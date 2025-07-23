# Policy RAG

**An AI-Powered Assistant for Government Policy Analysis and Navigation**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-000000.svg)](https://flask.palletsprojects.com/)

Policy RAG is an advanced AI-powered application designed to help users navigate complex government policies, regulations, and executive orders. Built with modern web technologies and powered by AiXplain's language models, it offers intelligent document analysis, contextual Q\&A, and real-time policy tracking.

## 🌟 Key Features

* **Intelligent Document Processing**: Analyze PDF, CSV, TXT, and JSON policy documents
* **AI-Powered Q\&A**: Contextual answers with source citations
* **Executive Order Tracking**: Live updates via the Federal Register API
* **Semantic Search**: Vector-based search across your document library
* **Modern UI**: Responsive React interface with dark/light mode
* **Transparent Sources**: Cited sources for all answers
* **Export Tools**: Save chat logs and analysis results

## 📋 Table of Contents

* [Architecture Overview](#architecture-overview)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)
* [API Documentation](#api-documentation)
* [File Structure](#file-structure)
* [Development](#development)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

## 🏗️ Architecture Overview

### Backend

* **`main.py`**: Flask server with routes for file upload, question answering, and health checks.
* **`indexing_service.py`**: Processes and embeds uploaded documents into ChromaDB.
* **`aixplain_processor.py`**: Connects to AiXplain APIs for semantic search and response generation.
* **`tools/federal_register_tool.py`**: Integrates with the Federal Register API for policy status tracking.

### Frontend

* **`App.js`**: Main React component for UI and document/chat interactions.
* **Tailwind CSS**: Provides responsive and clean styling with dark/light mode support.

### Data Storage

* **ChromaDB**: Stores vector embeddings for semantic retrieval.
* **File Directories**:

  * `initial_files/`: Preloaded documents
  * `uploaded_files/`: User documents
  * `chromadb_data/`: Persistent vector storage

### Initial Dataset

Policy Navigator comes with a pre-loaded initial dataset to demonstrate its capabilities. These files are located in the `data/initial_data/` directory and are automatically indexed when the application starts or when the knowledge base is rebuilt.

### AI Integration

* **AiXplain**: Supplies embedding and generation models for document indexing and answering.

## 📋 Prerequisites

### Requirements

* **Python**: 3.8+
* **Node.js**: 16+
* **npm**: 8+
* **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
* **Memory**: 4GB+ (8GB recommended)
* **Storage**: 2GB+ free

### Accounts & API Keys

* **AiXplain API Key**: Get from [aixplain.com](https://aixplain.com)
* Ensure access to embedding and generation models

## 🚀 Installation

1. **Clone the Repository**

```bash
git clone https://github.com/JameelAhuJalloud/policy-rag-aiXplain.git
cd policy-rag-aiXplain
```

2. **Setup Backend**

```bash
python -m venv venv
# Activate
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

3. **Setup Frontend**

```bash
cd frontend
npm install
```

4. **Configure Environment**

```bash
cp .env.example .env  # Edit with your API keys
```

5. **Start Application**

```bash
# Backend
python main.py
# Frontend
npm start
```

## ⚙️ Configuration

Create a `.env` file with:

```env
AIXPLAIN_API_KEY=your_api_key
AIXPLAIN_EMBEDDING_MODEL_ID=model_id
AIXPLAIN_TEXT_GEN_MODEL_ID=model_id
FLASK_APP=main.py
FLASK_ENV=development
```

> ❗️ Never commit `.env` to version control.

## 📖 Usage

1. **Visit**: `http://localhost:3000`
2. **Upload**: Use sidebar or `Ctrl+U` to upload documents (PDF, CSV, TXT, JSON)
3. **Ask Questions**: Type policy-related questions in the chat interface

### Supported Question Types

* "Is Executive Order 14067 still in effect?"
* "Summarize the data privacy policy."
* "Who must review POL-003?"

### Features

* **Citations** with icons and source types
* **Chat Shortcuts**: `Ctrl+E` to export, `Ctrl+K` to focus input

## 🔌 API Documentation

### Base URL

`http://localhost:5001`

### Endpoints

* `GET /` → API Info
* `GET /api/documents` → List documents
* `POST /api/upload` → Upload a document
* `POST /api/ask` → Ask a question
* `POST /api/rebuild-index` → Reindex documents
* `GET /health` → Health check
* `GET /api/health/embedding` → Embedding service status

## 📁 File Structure

```
policy-rag-aiXplain/
├── backend/
│   ├── data/
│   │   ├── chromadb_data/
│   │   ├── initial_files/
│   │   └── uploaded_files/
│   ├── tools/
│   ├── aixplain_processor.py
│   ├── indexing_service.py
│   └── main.py
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── index.css
│       └── index.js
├── .env.example
├── requirements.txt
└── README.md
```

## 🛠️ Development

### Backend

* Flask, Flask-CORS
* AiXplain SDK
* PyPDF2, Pandas

### Frontend

* React + Tailwind CSS
* Lucide for icons

### Add New File Types

1. Update `main.py` → `ALLOWED_EXTENSIONS`
2. Add reader logic in `indexing_service.py`
3. Map icon in `App.js`

## 🔧 Troubleshooting

* **Backend not reachable**: Ensure it's running on port 5001
* **Embedding errors**: Check API key and model ID
* **Documents not shown**: Reindex via `/api/rebuild-index`


## 🔥 Future Improvements

#### Authentication & User Management
- Implement user authentication with JWT tokens
- Role-based access control (admin, user, viewer)
- Personal document collections per user
- API key management for programmatic access

#### Document Management
- **Document versioning**: Track changes and maintain version history
- **Batch upload**: Support uploading multiple files simultaneously
- **Document preview**: In-app preview for PDFs and other formats
- **Auto-categorization**: Automatically tag documents by type/topic
- **Document metadata**: Add custom tags, descriptions, and categories

#### Search & Analytics
- **Advanced search filters**: Filter by date, document type, relevance score
- **Search history**: Save and replay previous searches
- **Analytics dashboard**: Usage statistics, popular queries, document insights
- **Query suggestions**: Auto-complete based on document content

#### AI Enhancements
- **Multiple AI model support**: Allow users to choose between different models
- **Custom prompts**: Let users customize system prompts for specific use cases
- **Fine-tuning capability**: Train models on specific policy domains
- **Multilingual support**: Process and respond in multiple languages
- **Sentiment analysis**: Analyze policy sentiment and public feedback

#### Integration Features
- **Webhook support**: Notify external systems of new documents/queries
- **Calendar integration**: Track policy effective dates and deadlines
- **Slack/Teams integration**: Ask questions directly from messaging platforms
- **Email digest**: Regular summaries of policy changes
- **RSS feed**: Subscribe to policy updates

#### UI/UX Improvements
- **Mobile responsive design**: Optimize for tablets and smartphones
- **Customizable themes**: User-defined color schemes
- **Accessibility improvements**: Full WCAG 2.1 AA compliance
- **Keyboard navigation**: Complete keyboard-only operation
- **Rich text editor**: Format questions with markdown support

### Long-term Vision (6-12 months)

#### Enterprise Features
- **Multi-tenant architecture**: Support for multiple organizations
- **SSO integration**: SAML, OAuth, Active Directory support
- **Audit logs**: Complete activity tracking for compliance
- **Data residency options**: Choose where data is stored
- **SLA guarantees**: Enterprise-grade reliability

#### Advanced Analytics
- **Policy impact analysis**: Predict policy effects using AI
- **Compliance scoring**: Automated compliance assessments
- **Trend analysis**: Identify patterns in policy changes
- **Comparative analysis**: Compare policies across jurisdictions
- **Visual knowledge graphs**: Interactive policy relationship maps

#### Technical Improvements
- **Microservices architecture**: Separate services for better scalability
- **Kubernetes deployment**: Container orchestration for scale
- **GraphQL API**: More flexible data querying
- **Real-time updates**: WebSocket support for live notifications
- **Distributed caching**: Redis integration for performance

#### Collaboration Features
- **Real-time collaboration**: Multiple users working on same analysis
- **Comments and annotations**: Add notes to documents and responses
- **Shared workspaces**: Team-based document collections
- **Review workflows**: Approval processes for policy changes
- **Export templates**: Customizable report generation

#### Optimization Goals
- **Faster indexing**: Process documents 10x faster using parallel processing
- **Streaming responses**: Start showing results before complete generation
- **Smart caching**: Cache frequent queries and responses
- **CDN integration**: Serve static assets globally
- **Database optimization**: Implement read replicas and sharding

#### Security Roadmap
- **End-to-end encryption**: Encrypt documents at rest and in transit
- **Zero-trust architecture**: Verify every request
- **Penetration testing**: Regular security assessments
- **GDPR compliance**: Full data privacy controls
- **SOC 2 certification**: Enterprise security standards


#### Building a Community
- **Public policy library**: Shared repository of common policies
- **Community Q&A**: Users helping users with policy questions
- **Plugin system**: Allow third-party extensions
- **API marketplace**: Share custom integrations
- **Policy templates**: Starter templates for common use cases


#### Mobile Experience
- **Native mobile apps**: iOS and Android applications
- **Offline mode**: Download policies for offline access
- **Mobile scanning**: Upload documents via camera
- **Voice queries**: Ask questions using voice input
- **Push notifications**: Policy update alerts

These improvements would transform Policy RAG from a powerful tool into a comprehensive policy intelligence platform suitable for government agencies, large enterprises, and policy professionals worldwide.

## 📄 License

MIT License. See [LICENSE](LICENSE).

## 📞 Support

* GitHub Issues: [Issues Page](https://github.com/JameelAhuJalloud/policy-rag-aiXplain/issues)
* Contact: via GitHub profile

---

**Policy RAG** — Empowering informed decision-making through AI.

*Built by Jameel Abu Jalloud*
