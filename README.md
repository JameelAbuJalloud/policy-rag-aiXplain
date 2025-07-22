```markdown
# Policy RAG

**An AI-Powered Assistant for Government Policy Analysis and Navigation**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-000000.svg)](https://flask.palletsprojects.com/)

Policy RAG is a sophisticated AI-powered application designed to help users navigate complex government policies, regulations, and executive orders. Built with modern web technologies and powered by AiXplain's advanced language models, it provides intelligent document analysis, contextual question answering, and real-time policy status tracking.

## 🌟 Key Features

- **Intelligent Document Processing**: Upload and analyze PDF, CSV, TXT, and JSON policy documents
- **AI-Powered Q&A**: Get contextual answers with proper source citations
- **Executive Order Tracking**: Real-time status updates via Federal Register API
- **Advanced Search**: Vector-based semantic search across your document collection
- **Modern UI**: Responsive React interface with dark/light mode support
- **Source Citations**: Comprehensive source tracking for transparency
- **Export Capabilities**: Save chat history and analysis results

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [File Structure](#file-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🏗️ Architecture Overview

Policy RAG follows a modern full-stack architecture with clear separation of concerns:

### Backend Components

The backend is built with Flask and provides a RESTful API for document processing and question answering. Key components include:

**Main Application (`main.py`)**: The Flask application server that handles HTTP requests, manages CORS, and coordinates between different services. It provides endpoints for document upload, question processing, and system health checks.

**Document Indexing Service (`indexing_service.py`)**: Responsible for processing uploaded documents, extracting text content, creating embeddings using AiXplain's models, and storing them in ChromaDB for efficient retrieval. Supports multiple file formats including PDF, CSV, TXT, and JSON.

**Answer Generation (`aixplain_processor.py`)**: Handles the core AI functionality by interfacing with AiXplain's language models. It performs semantic search across the document collection and generates contextual responses with proper source attribution.

**Federal Register Integration (`tools/federal_register_tool.py`)**: Provides real-time access to executive order information through the Federal Register API, enabling users to get current status updates on government policies.

### Frontend Components

The frontend is a React application that provides an intuitive interface for document management and AI-powered conversations:

**Main Application (`App.js`)**: The primary React component that manages the user interface, handles file uploads, displays chat conversations, and provides document management capabilities.

**Styling**: Uses Tailwind CSS for modern, responsive design with dark/light mode support.

### Data Storage

**ChromaDB Vector Store**: Persistent vector database that stores document embeddings for efficient semantic search. Configured with cosine similarity for optimal retrieval performance.

**File Storage**: Local file system storage for uploaded documents with organized directory structure:
- `initial_files/`: Pre-loaded policy documents
- `uploaded_files/`: User-uploaded documents
- `chromadb_data/`: Vector database storage

### AI Integration

**AiXplain Platform**: Integration with AiXplain's advanced language models for both text embedding generation and response generation. The system uses separate models optimized for each task to ensure high-quality results.

## 📋 Prerequisites

Before installing Policy RAG, ensure your system meets the following requirements:

### System Requirements

- **Python**: Version 3.8 or higher
- **Node.js**: Version 16.0 or higher (for frontend development)
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: Minimum 4GB RAM (8GB recommended for large document processing)
- **Storage**: At least 2GB free space for application and document storage

### API Keys and Accounts

**AiXplain Account**: You'll need an active AiXplain account with API access. Sign up at [AiXplain](https://aixplain.com) and obtain your API key from the dashboard.

**Model Access**: Ensure your AiXplain account has access to:
- Text embedding models (for document vectorization)
- Text generation models (for response generation)

## 🚀 Installation

### Quick Start (Recommended)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/JameelAhuJalloud/policy-rag-aiXplain.git
   cd policy-rag-aiXplain
   ```

2. **Set Up Python Environment**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

5. **Configure Environment Variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your API keys (see Configuration section)
   ```

6. **Initialize Data Directories** (if they don't exist)
   ```bash
   mkdir -p initial_files uploaded_files chromadb_data
   ```

7. **Start the Application**
   ```bash
   # Terminal 1: Start backend
   python main.py
   
   # Terminal 2: Start frontend (in a new terminal)
   npm start
   ```

   The application will be available at:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5001`

## ⚙️ Configuration

Policy RAG uses environment variables for configuration. Create a `.env` file in the root directory with the following settings:

### Required Configuration

```env
# AiXplain API Configuration
AIXPLAIN_API_KEY=your_aixplain_api_key_here
AIXPLAIN_EMBEDDING_MODEL_ID=your_embedding_model_id
AIXPLAIN_TEXT_GEN_MODEL_ID=your_text_generation_model_id

# Flask Application Settings
FLASK_APP=main.py
FLASK_ENV=development
```

### Configuration Details

**AIXPLAIN_API_KEY**: Your personal API key from AiXplain. This is required for all AI functionality including document embedding and response generation. Obtain this from your AiXplain dashboard under API Keys section.

**AIXPLAIN_EMBEDDING_MODEL_ID**: The model ID for text embedding generation. This model converts your documents into vector representations for semantic search.

**AIXPLAIN_TEXT_GEN_MODEL_ID**: The model ID for text generation. This model generates responses to user questions based on the retrieved document context.

**FLASK_ENV**: Set to `development` for local development with debug mode enabled, or `production` for deployment environments.

**CHROMA_DB_PATH**: Directory path where ChromaDB will store the vector database files. This should be a persistent location to maintain your document index between application restarts.

### Security Considerations

- Never commit your `.env` file to version control
- Use strong, unique API keys
- Regularly rotate your API keys
- Consider using environment-specific key management systems in production
- Implement rate limiting for production deployments

## 📖 Usage

Policy RAG provides an intuitive interface for document analysis and policy navigation. Here's how to use its key features:

### Getting Started

1. **Launch the Application**
   ```bash
   # Start the backend server
   python main.py
   
   # In a separate terminal, start the frontend
   npm start
   ```

2. **Access the Interface**
   Open your web browser and navigate to `http://localhost:3000`. You'll see the Policy RAG interface with a sidebar for document management and a main chat area.

### Document Management

#### Uploading Documents

The application supports multiple document formats for comprehensive policy analysis:

**PDF Documents**: Upload policy documents, regulations, executive orders, and other government publications. The system extracts text content using PyPDF2.

**CSV Files**: Import structured policy data, compliance checklists, or regulatory databases. Each row is processed as a separate policy entry.

**Text Files**: Upload plain text documents, meeting notes, or policy summaries.

**JSON Files**: Import structured policy data, API responses, or configuration files.

### To upload a document:
1. Click the "Click to upload a file" button in the sidebar (or press `Ctrl+U`)
2. Select your document from the file browser
3. Wait for the upload progress to complete
4. The document will appear in your Knowledge Base list

#### Managing Your Knowledge Base

The Knowledge Base section shows all indexed documents with the following features:

**Document Filtering**: Use the search box to quickly find specific documents by filename.

**Document Icons**: Each document displays an appropriate emoji (📄 for PDF, 📊 for CSV, 📝 for TXT, 📋 for JSON).

**Index Rebuilding**: Click the refresh icon to rebuild the entire knowledge base from the `initial_files` folder.

### Asking Questions

#### Basic Question Types

Policy RAG excels at answering various types of policy-related questions:

**Status Inquiries**: "Is Executive Order 14067 still in effect?" or "What's the current status of the remote work policy?"

**Content Analysis**: "What are the key requirements in the data privacy policy?" or "Summarize the security standards document."

**Policy Details**: "What is the effective date of POL-003?" or "Who needs to review these regulations?"

#### Example Questions

The interface provides example questions to help you get started:
- "Is Executive Order 14067 still in effect?"
- "What are the current data privacy policies?"
- "Which policies are under review?"
- "What security standards are required?"
- "Has Executive Order 13990 been repealed?"
- "What is the status of our remote work policy?"
- "Show me all active policies from 2023"

### Understanding Responses

#### Source Citations

Each response includes source information when relevant:
- Document name with appropriate file type icon
- Expandable source list showing all referenced documents
- Source type indicators (Document or API)

#### Response Features

**Copy to Clipboard**: Hover over any response to reveal a copy button for easy sharing.

**Real-time Processing**: See a loading indicator while your question is being processed.

**Dark/Light Mode**: Toggle between themes using the sun/moon icon in the header.

### Chat Management

**Export Chat History**: Click the download icon to save your conversation as a text file.

**Clear Chat**: Use the X button to clear all messages while preserving your document index.

**Keyboard Shortcuts**:
- `Ctrl+K` (or `Cmd+K` on Mac): Focus the question input
- `Ctrl+U` (or `Cmd+U` on Mac): Open file upload
- `Ctrl+E` (or `Cmd+E` on Mac): Export chat history
- `Enter`: Send message
- `Shift+Enter`: New line in message

## 🔌 API Documentation

### Base URL
```
http://localhost:5001
```

### Core Endpoints

#### GET `/`
Returns API information and system status.

#### GET `/api/documents`
Lists all indexed documents.

**Response:**
```json
{
  "documents": ["BILLS-117hr8152rh.pdf", "test_policy.csv"]
}
```

#### POST `/api/upload`
Uploads and indexes a new document.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "success": true,
  "message": "test_policy.csv was uploaded and indexed successfully.",
  "documents": ["BILLS-117hr8152rh.pdf", "test_policy.csv"]
}
```

#### POST `/api/ask`
Processes a question and returns an AI-generated answer.

**Request:**
```json
{
  "question": "What are the data privacy requirements?"
}
```

**Response:**
```json
{
  "answer": "Based on the documents...",
  "sources": [
    {
      "name": "data_privacy_policy.pdf",
      "type": "Document"
    }
  ]
}
```

#### POST `/api/rebuild-index`
Rebuilds the vector store from initial data.

#### GET `/health`
Basic health check endpoint.

#### GET `/api/health/embedding`
Checks embedding service status.

## 📁 File Structure

```
policy-rag-aiXplain/
├── backend/
│   ├── data/
│   │   ├── chromadb_data/     # Vector database storage
│   │   ├── initial_files/     # Pre-loaded documents
│   │   │   ├── .gitkeep
│   │   │   ├── BILLS-117hr8152rh.pdf
│   │   │   └── test_policy.csv
│   │   └── uploaded_files/    # User uploads
│   ├── tools/
│   │   └── federal_register_tool.py
│   ├── aixplain_processor.py
│   ├── indexing_service.py
│   └── main.py
├── frontend/
│   ├── node_modules/          # npm packages
│   ├── public/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   └── tailwind.config.js
├── .env.example              # Environment template
├── .gitignore
├── README.md
└── requirements.txt
```

## 🛠️ Development

### Backend Development

The backend uses Flask with the following key modules:
- `flask`: Web framework
- `flask-cors`: CORS support
- `chromadb`: Vector database
- `aixplain`: AI model integration
- `PyPDF2`: PDF processing
- `pandas`: CSV processing

### Frontend Development

The frontend uses React with:
- Tailwind CSS for styling
- Lucide React for icons
- Built-in React hooks for state management

### Adding New File Types

To support additional file formats:

1. Update `ALLOWED_EXTENSIONS` in `main.py`
2. Add a read function in `indexing_service.py`
3. Update the file icon mapping in `App.js`

## 🔧 Troubleshooting

### Common Issues

**"Could not connect to the backend server"**
- Ensure the backend is running on port 5001
- Check that no firewall is blocking the connection

**"Embedding failed: AiXplain model is not available"**
- Verify your AIXPLAIN_API_KEY is correct
- Check that the embedding model ID is valid

**Documents not appearing in Knowledge Base**
- Ensure documents are in supported formats
- Check backend logs for indexing errors
- Try rebuilding the index

**Empty responses to questions**
- Verify documents were successfully indexed
- Check that the text generation model ID is correct
- Ensure your AiXplain account has sufficient credits


## 🤝 Contributing

I welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Python: Follow PEP 8
- JavaScript: Use consistent formatting (2 spaces for indentation)
- Include descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Issues**: [GitHub Issues](https://github.com/JameelAhuJalloud/policy-rag-aiXplain/issues)
- **Email**: Contact through GitHub profile

---

**Policy RAG** - Empowering informed decision-making through AI-powered policy analysis.

*Built by Jameel Abu Jalloud*
```