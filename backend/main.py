import os
import re
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from chromadb.errors import InvalidDimensionException

from tools.federal_register_tool import get_executive_order_status
import indexing_service
import aixplain_processor

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('policy-navigator')

UPLOAD_FOLDER = os.path.join('data', 'uploaded_files')
INITIAL_DOCUMENTS_FOLDER = os.path.join('data', 'initial_files')
ALLOWED_EXTENSIONS = {'.csv', '.pdf', '.txt', '.json'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(INITIAL_DOCUMENTS_FOLDER, exist_ok=True)
os.makedirs('tools', exist_ok=True)

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

logger.info("Initializing vector store...")
vector_metadata = indexing_service.build_or_load_vector_store(INITIAL_DOCUMENTS_FOLDER)
logger.info(f"Vector store initialized. Indexed documents: {vector_metadata.get('indexed_documents', [])}")

def is_allowed_file(filename):
    """Validates file extension against allowed types"""
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_EXTENSIONS

def is_executive_order_question(question):
    """Detects if question is about executive order status"""
    patterns = [
        r'\bis (executive order|eo)\s*\d+\b',
        r'\bstatus of (executive order|eo)\s*\d+\b',
        r'\bcurrent status.*(executive order|eo)\s*\d+\b',
        r'\b(has|have) (executive order|eo)\s*\d+ (been )?(repealed|amended)\b',
    ]
    return any(re.search(pattern, question.lower()) for pattern in patterns)

@app.route('/', methods=['GET'])
def home():
    """Returns API information and current status"""
    return jsonify({
        "message": "Policy Navigator RAG API (AiXplain-powered)",
        "endpoints": {
            "GET /api/documents": "List all indexed documents.",
            "POST /api/upload": "Upload a new document.",
            "POST /api/ask": "Ask a question.",
            "GET /health": "Health check."
        },
        "indexed_documents_count": len(vector_metadata.get('indexed_documents', [])),
        "status": "running"
    })

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Lists all indexed documents"""
    return jsonify({"documents": vector_metadata.get('indexed_documents', [])})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handles file upload and indexing"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files['file']
    if file.filename == '' or not is_allowed_file(file.filename):
        return jsonify({"error": "No selected file or file type not allowed."}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    try:
        success = indexing_service.add_single_file_to_vector_store(filepath)

        if success:
            if file.filename not in vector_metadata['indexed_documents']:
                vector_metadata['indexed_documents'].append(file.filename)

            return jsonify({
                "success": True,
                "message": f"'{file.filename}' was uploaded and indexed successfully.",
                "documents": vector_metadata.get('indexed_documents', [])
            })

        return jsonify({"error": f"Failed to process '{file.filename}'."}), 500

    except InvalidDimensionException as e:
        logger.error(f"Dimension mismatch error: {e}", exc_info=True)
        return jsonify({"error": "Critical database error. Contact administrator."}), 500
    except Exception as e:
        logger.error(f"Unexpected error during file upload: {e}", exc_info=True)
        return jsonify({"error": "Unexpected server error."}), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Processes questions using tools or RAG pipeline"""
    data = request.get_json()
    question = data.get('question', '').strip()

    if not question:
        return jsonify({"error": "No question provided."}), 400

    if is_executive_order_question(question):
        match = re.search(r'(executive order|eo)\s*(\d+)', question, re.IGNORECASE)
        if match:
            executive_order_number = match.group(2)
            executive_order_info = get_executive_order_status(executive_order_number)

            if executive_order_info:
                executive_order_context = (
                    f"Executive Order {executive_order_info['number']}:\n"
                    f"Title: {executive_order_info['title']}\n"
                    f"Date: {executive_order_info['date']}\n"
                    f"Status: {executive_order_info['status']}\n"
                )
                generated_answer = aixplain_processor.generate_answer_with_aixplain(
                    question, [{"text": executive_order_context, "source": "Federal Register API"}]
                )
                return jsonify({"answer": generated_answer, "sources": [{"name": f"Federal Register - EO {executive_order_info['number']}", "type": "API"}]})

            return jsonify({"answer": f"Executive Order {executive_order_number} not found.", "sources": []})

    try:
        search_results = aixplain_processor.search_vector_store(question)
        answer = aixplain_processor.generate_answer_with_aixplain(question, search_results)
        
        # Only include sources if we have search results
        if search_results:
            sources = list({chunk['source'] for chunk in search_results})
            formatted_sources = [{"name": name, "type": "Document"} for name in sources[:3]]
        else:
            formatted_sources = []

        return jsonify({"answer": answer, "sources": formatted_sources})

    except ValueError as e:
        logger.error(f"RAG pipeline error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        logger.error(f"Unexpected RAG error: {e}", exc_info=True)
        return jsonify({"error": "Unexpected error processing question."}), 500


@app.route('/api/rebuild-index', methods=['POST'])
def rebuild_index():
    """Rebuilds vector store from initial data"""
    global vector_metadata
    try:
        vector_metadata = indexing_service.rebuild_vector_store(INITIAL_DOCUMENTS_FOLDER)
        return jsonify({
            "success": True,
            "message": "Knowledge base rebuilt.",
            "documents": vector_metadata.get('indexed_documents', [])
        })
    except Exception as e:
        logger.error(f"Index rebuild error: {e}", exc_info=True)
        return jsonify({"error": "Error during index rebuild."}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Basic system health check"""
    return jsonify({"status": "healthy"})

@app.route('/api/health/embedding', methods=['GET'])
def check_embedding_service():
    """Tests embedding service availability"""
    try:
        test_embedding = indexing_service.embed_texts(["test"])
        if test_embedding:
            return jsonify({"status": "healthy", "dimension": len(test_embedding[0])})
        return jsonify({"status": "unhealthy", "error": "Embedding failed."}), 503
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 503

if __name__ == '__main__':
    logger.info("Starting Policy Navigator server...")
    app.run(debug=True, port=5001)