import os
import logging
from typing import List, Dict
from dotenv import load_dotenv

import indexing_service

try:
    from aixplain.factories import ModelFactory
    AIXPLAIN_SDK_INSTALLED = True
except ImportError:
    AIXPLAIN_SDK_INSTALLED = False

load_dotenv()
AIXPLAIN_API_KEY = os.getenv("AIXPLAIN_API_KEY")
AIXPLAIN_TEXT_GEN_MODEL_ID = os.getenv("AIXPLAIN_TEXT_GEN_MODEL_ID")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("answer_generator")

text_generation_model = None
if AIXPLAIN_SDK_INSTALLED and AIXPLAIN_API_KEY and AIXPLAIN_TEXT_GEN_MODEL_ID:
    try:
        os.environ['AIXPLAIN_API_KEY'] = AIXPLAIN_API_KEY
        text_generation_model = ModelFactory.get(AIXPLAIN_TEXT_GEN_MODEL_ID)
        logger.info(f"Successfully initialized AiXplain text generation model: {AIXPLAIN_TEXT_GEN_MODEL_ID}")
    except Exception as e:
        logger.error(f"Failed to initialize AiXplain text gen model: {e}. Will use simple fallback.")
else:
    logger.warning("AiXplain SDK/API key/Model ID not found. Using simple fallback for generation.")

def search_vector_store(query: str, max_results: int = 5) -> List[Dict]:
    """Searches for relevant documents using the indexing service"""
    try:
        return indexing_service.query_collection(query, max_results)
    except ValueError as e:
        raise e
    except Exception as e:
        logger.error(f"Vector search error propagated from indexing_service: {e}", exc_info=True)
        return []

def generate_answer_with_aixplain(question: str, search_results: List[Dict]) -> str:
    """Generates contextual answer using AiXplain LLM or fallback method"""
    if text_generation_model:
        if not search_results:
            prompt = f"""You are 'Policy Navigator', a helpful AI assistant specializing in government policies and regulations.

User: "{question}"

Instructions:
- If the user is greeting you (hi, hello, etc.), respond with a minimal greeting like "Hello! How can I help you today?"
- If it's a question but no relevant information was found, say "I couldn't find any information about that in my knowledge base."
- Be concise and professional

Response:"""
        else:
            combined_context = "\n\n---\n\n".join([chunk['text'] for chunk in search_results[:5]])
            prompt = f"""You are 'Policy Navigator', a helpful AI assistant.
Answer the user's question based on the provided context.

Context:
\"\"\"
{combined_context}
\"\"\"

Question: "{question}"

Instructions:
- Answer ONLY based on the provided context
- Be direct and specific
- If the context doesn't contain enough information, say so
- Do NOT respond with greetings

Answer:"""
        
        try:
            generation_result = text_generation_model.run(prompt)
            if hasattr(generation_result, 'data') and generation_result.data and generation_result.data.strip():
                return generation_result.data.strip()
        except Exception as e:
            logger.error(f"AiXplain generation failed: {e}. Falling back.")
    
    # Simple fallback
    if not search_results:
        return "I couldn't find any information about that in my knowledge base."
    
    response = "Based on the information I found:\n\n"
    for chunk in search_results[:3]:
        response += f"From {chunk['source']}: {chunk['text'][:200]}...\n\n"
    return response