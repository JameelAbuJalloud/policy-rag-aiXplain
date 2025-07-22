import os
import json
import logging
from typing import List, Dict
import pandas as pd
import PyPDF2
import chromadb
from chromadb.config import Settings
from uuid import uuid4
from dotenv import load_dotenv

try:
    from aixplain.factories import ModelFactory
    AIXPLAIN_SDK_INSTALLED = True
except ImportError:
    AIXPLAIN_SDK_INSTALLED = False

load_dotenv()
AIXPLAIN_API_KEY = os.getenv("AIXPLAIN_API_KEY")
AIXPLAIN_EMBEDDING_MODEL_ID = os.getenv("AIXPLAIN_EMBEDDING_MODEL_ID")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("indexing_service")

embedding_model = None
if AIXPLAIN_SDK_INSTALLED and AIXPLAIN_API_KEY:
    try:
        os.environ['AIXPLAIN_API_KEY'] = AIXPLAIN_API_KEY
        embedding_model = ModelFactory.get(AIXPLAIN_EMBEDDING_MODEL_ID)
        logger.info(f"Successfully initialized AiXplain embedding model: {AIXPLAIN_EMBEDDING_MODEL_ID}")
    except Exception as e:
        logger.error(f"FATAL: Failed to initialize AiXplain embedding model: {e}. The application cannot proceed.")
        embedding_model = None
else:
    logger.error("FATAL: AiXplain SDK not installed or API key not found. The application cannot proceed.")

client = chromadb.PersistentClient(path="data/chromadb_data", settings=Settings(anonymized_telemetry=False))
collection = client.get_or_create_collection(name="policy_documents", metadata={"hnsw:space": "cosine"})

def embed_texts(texts: List[str]) -> List[List[float]]:
    """Generates embeddings for text using AiXplain model"""
    if not texts: return []
    if not embedding_model:
        logger.error("Embedding failed: AiXplain model is not available.")
        return []
    
    try:
        logger.info(f"Embedding {len(texts)} text(s) with AiXplain model...")
        result = embedding_model.run(texts)
        if 'data' in result and result['data']:
            embeddings = [item['embedding'] for item in result['data'] if 'embedding' in item]
            if embeddings and len(embeddings) == len(texts):
                embedding_dimension = len(embeddings[0])
                logger.info(f"Successfully extracted {len(embeddings)} embeddings of dimension {embedding_dimension}.")
                return embeddings
        logger.error("AiXplain API response did not contain valid/complete embedding data.")
        logger.debug(f"Received malformed response: {result}")
    except Exception as e:
        logger.error(f"An exception occurred during AiXplain embedding: {e}", exc_info=True)
        return []

def get_vector_store_collection() -> chromadb.Collection:
    """Returns the ChromaDB collection instance"""
    return collection

def read_pdf(filepath: str) -> str:
    """Extracts text content from PDF file"""
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text: text += page_text + "\n"
    except Exception as e: 
        logger.error(f"Error reading PDF {filepath}: {e}")
    return text

def read_txt(filepath: str) -> str:
    """Reads content from text file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f: 
            return f.read()
    except Exception as e:
        logger.error(f"Error reading TXT {filepath}: {e}")
        return ""

def read_json(filepath: str) -> str:
    """Converts JSON file to formatted string"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f: 
            data = json.load(f)
        return json.dumps(data, indent=2)
    except Exception as e:
        logger.error(f"Error reading JSON {filepath}: {e}")
        return ""

def read_csv(filepath: str) -> str:
    """Converts CSV policy data to structured text"""
    try:
        df = pd.read_csv(filepath)
        text_parts = []
        for _, row in df.iterrows():
            policy_text = (f"Policy: {row.get('Policy_Name', 'N/A')}\n"
                           f"Policy ID: {row.get('Policy_ID', 'N/A')}\n"
                           f"Description: {row.get('Description', 'No description provided.')}\n"
                           f"Status: {row.get('Status', 'N/A')}\n"
                           f"Effective Date: {row.get('Effective_Date', 'N/A')}\n")
            text_parts.append(policy_text)
        return "\n\n===POLICY_SEPARATOR===\n\n".join(text_parts)
    except Exception as e:
        logger.error(f"Error reading CSV {filepath}: {e}")
        return ""

JSON_EXTENSION = '.json'

def read_file(filepath: str) -> str:
    """Reads file content based on extension"""
    extension = os.path.splitext(filepath)[1].lower()
    if extension == '.csv': 
        return read_csv(filepath)
    elif extension == '.pdf': 
        return read_pdf(filepath)
    elif extension == JSON_EXTENSION: 
        return read_json(filepath)
    elif extension == '.txt': 
        return read_txt(filepath)
    else:
        logger.warning(f"Unsupported file type '{extension}' for file: {filepath}")
        return ""

def create_text_chunks(text: str, chunk_size: int = 512, overlap: int = 50) -> List[str]:
    """Splits text into overlapping chunks or by policy separator"""
    if "===POLICY_SEPARATOR===" in text:
        return [chunk.strip() for chunk in text.split("===POLICY_SEPARATOR===") if chunk.strip()]
    tokens = text.split()
    if not tokens: 
        return []
    chunks = []
    index = 0
    while index < len(tokens):
        chunk_text = " ".join(tokens[index:index + chunk_size]).strip()
        if chunk_text: 
            chunks.append(chunk_text)
        index += chunk_size - overlap
    return chunks

def add_document_to_collection(chunks: List[str], filename: str) -> bool:
    """Adds document chunks with embeddings to vector store"""
    if not chunks:
        logger.warning(f"No valid chunks for {filename}.")
        return False
    embeddings = embed_texts(chunks)
    if embeddings is None or len(embeddings) != len(chunks):
        logger.error(f"Embedding failed for {filename}. Aborting add.")
        return False
    ids = [str(uuid4()) for _ in chunks]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]
    collection.add(embeddings=embeddings, documents=chunks, metadatas=metadatas, ids=ids)
    logger.info(f"Successfully added {len(chunks)} chunks from {filename} to the vector store.")
    return True

def build_or_load_vector_store(data_directory: str) -> Dict:
    """Initializes vector store with new documents from directory"""
    metadata = {"indexed_documents": []}
    if not os.path.exists(data_directory):
        os.makedirs(data_directory, exist_ok=True)
        return metadata
    
    existing_documents = {meta['source'] for meta in collection.get(include=["metadatas"])['metadatas']}
    logger.info(f"Found {len(existing_documents)} already indexed documents.")
    
    # Add ALL existing documents to metadata (THIS IS THE FIX)
    metadata['indexed_documents'].extend(list(existing_documents))
    
    supported_extensions = {'.csv', '.pdf', '.txt', JSON_EXTENSION}
    files_to_index = [f for f in os.listdir(data_directory) 
                      if os.path.splitext(f)[1].lower() in supported_extensions 
                      and f not in existing_documents]
    
    if not files_to_index:
        logger.info("No new documents to index.")
        return metadata
    
    for filename in files_to_index:
        filepath = os.path.join(data_directory, filename)
        logger.info(f"Starting indexing for new file: {filename}")
        text = read_file(filepath)
        if text:
            chunks = create_text_chunks(text)
            if add_document_to_collection(chunks, filename):
                # Only add if not already in the list (in case of duplicates)
                if filename not in metadata['indexed_documents']:
                    metadata['indexed_documents'].append(filename)
        else:
            logger.warning(f"No text extracted from {filename}. Skipping.")
    
    return metadata

def rebuild_vector_store(data_directory: str) -> Dict:
    """Deletes and rebuilds entire vector store from scratch"""
    global collection
    collection_name = "policy_documents"
    logger.info(f"Rebuilding vector store. Deleting collection '{collection_name}'...")
    try:
        client.delete_collection(name=collection_name)
    except Exception: 
        pass
    collection = client.get_or_create_collection(name=collection_name, metadata={"hnsw:space": "cosine"})
    supported_extensions = {'.csv', '.pdf', '.txt', JSON_EXTENSION}
    files_to_index = [f for f in os.listdir(data_directory) 
                      if os.path.splitext(f)[1].lower() in supported_extensions]
    metadata = {"indexed_documents": []}
    for filename in files_to_index:
        filepath = os.path.join(data_directory, filename)
        text = read_file(filepath)
        if text:
            chunks = create_text_chunks(text)
            if add_document_to_collection(chunks, filename):
                metadata['indexed_documents'].append(filename)
    return metadata

def query_collection(query_text: str, max_results: int = 5) -> List[Dict]:
    """Searches vector store for relevant document chunks"""
    if collection.count() == 0:
        logger.warning("Query attempted but the vector store is empty.")
        return []

    query_embedding = embed_texts([query_text])
    if query_embedding is None:
        logger.error("Failed to embed query text, cannot search.")
        raise ValueError("The embedding service failed to process the query.")

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(max_results, collection.count())
    )

    chunks = []
    if results and results.get('documents') and results['documents'][0]:
        for index, document in enumerate(results['documents'][0]):
            distance = results['distances'][0][index]
            if distance < 1.0: 
                chunks.append({
                    'text': document,
                    'source': results['metadatas'][0][index].get('source', 'Unknown'),
                    'distance': distance
                })
    logger.info(f"Found {len(chunks)} relevant chunks for the query.")
    return chunks

def add_single_file_to_vector_store(filepath: str) -> bool:
    """Indexes a single file into the vector store"""
    try:
        filename = os.path.basename(filepath)
        
        existing_documents = {meta['source'] for meta in collection.get(include=["metadatas"])['metadatas']}
        if filename in existing_documents:
            logger.warning(f"File {filename} is already indexed. Skipping.")
            return False
        
        logger.info(f"Reading file: {filename}")
        text = read_file(filepath)
        
        if not text:
            logger.error(f"No text extracted from {filename}")
            return False
        
        chunks = create_text_chunks(text)
        if not chunks:
            logger.error(f"No chunks created from {filename}")
            return False
        
        logger.info(f"Adding {len(chunks)} chunks from {filename} to vector store")
        success = add_document_to_collection(chunks, filename)
        
        if success:
            logger.info(f"Successfully indexed {filename}")
        else:
            logger.error(f"Failed to index {filename}")
            
        return success
        
    except Exception as e:
        logger.error(f"Error adding file {filepath} to vector store: {e}", exc_info=True)
        return False

if __name__ == '__main__':
    DATA_DIRECTORY = "data/initial_data"
    logger.info("Starting the standalone indexing process...")
    vector_store_metadata = build_or_load_vector_store(DATA_DIRECTORY)
    logger.info(f"Indexing complete. Total indexed documents: {len(vector_store_metadata['indexed_documents'])}")
    logger.info(f"ChromaDB collection now contains {collection.count()} chunks.")