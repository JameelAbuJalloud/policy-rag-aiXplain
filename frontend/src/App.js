import React from 'react';
import { Search, Upload, FileText, BrainCircuit, Bot, User, Loader, ChevronDown, ChevronRight, Copy, Server, Download, X, Filter, RefreshCw, AlertTriangle, Sun, Moon } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:5001';

/**
 * Renders icon based on source type
 */
const SourceIcon = ({ sourceType, className }) => {
  switch (sourceType) {
    case 'API':
      return <BrainCircuit className={className} />;
    case 'Document':
      return <FileText className={className} />;
    default:
      return <FileText className={className} />;
  }
};

/**
 * Returns file-type emoji based on extension
 */
const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
        case 'pdf': return '📄';
        case 'csv': return '📊';
        case 'txt': return '📝';
        case 'json': return '📋';
        default: return '📎';
    }
};

/**
 * Welcome screen for new chat sessions
 */
const WelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
        <BrainCircuit className="w-16 h-16 text-indigo-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
            Welcome to Policy Navigator
        </h2>
        <p className="max-w-xl text-gray-600 dark:text-gray-400 mb-10">
            Your AI assistant for navigating complex government regulations. Get started in two simple steps.
        </p>
        <div className="space-y-6 text-left max-w-md w-full">
            <div className="flex items-start p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold mr-4">1</div>
                <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Upload Documents</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use the panel on the left to upload your policies or regulations (`.pdf`, `.txt`, `.csv`, etc.).</p>
                </div>
            </div>
            <div className="flex items-start p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold mr-4">2</div>
                <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Ask Questions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Once your documents are indexed, use the input box below to ask questions and get instant, sourced answers.</p>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Chat message display with copy functionality and source citations
 */
const ChatMessage = ({ message }) => {
    const [isSourcesOpen, setIsSourcesOpen] = React.useState(true);
    const [copySuccess, setCopySuccess] = React.useState(false);

    /**
     * Copies text to clipboard with browser compatibility
     */
    const copyToClipboard = (text) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }).catch(err => {
                console.error('Async clipboard copy failed: ', err);
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            } catch (err) {
                console.error('Fallback copy failed: ', err);
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className={`flex items-start gap-4 ${message.role === 'user' ? '' : 'bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm'}`}>
            {message.role === 'user' ? (
                <User className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
            ) : (
                <Bot className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {message.role === 'user' ? 'You' : 'Policy Navigator'}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 relative group whitespace-pre-wrap">
                    {message.text}
                    <button 
                        onClick={() => copyToClipboard(message.text)} 
                        className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy to clipboard"
                    >
                        {copySuccess ? (
                            <span className="text-green-500 text-xs font-semibold">Copied!</span>
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                        <button
                            onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            {isSourcesOpen ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                            Sources ({message.sources.length})
                        </button>
                        {isSourcesOpen && (
                            <div className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                                {message.sources.map((source, index) => (
                                    <div key={index} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                        <SourceIcon sourceType={source.type} className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="font-mono truncate mr-2" title={source.name}>{source.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Confirmation modal for destructive actions
 */
const ConfirmationModal = ({ config, onClose }) => {
    if (!config) return null;

    const { title, message, confirmText, onConfirm } = config;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all animate-fade-in-up">
                <div className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-4 text-left">
                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Sample questions for user guidance
 */
const exampleQuestions = [
    "Is Executive Order 14067 still in effect?",
    "What are the current data privacy policies?",
    "Which policies are under review?",
    "What security standards are required?",
    "Has Executive Order 13990 been repealed?",
    "What is the status of our remote work policy?",
    "Show me all active policies from 2023"
];

/**
 * Main application component - Policy Navigator chat interface
 */
export default function App() {
    const [indexedDocs, setIndexedDocs] = React.useState([]);
    const [question, setQuestion] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isRebuilding, setIsRebuilding] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [docFilter, setDocFilter] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [showAllExamples, setShowAllExamples] = React.useState(false);
    const [modalConfig, setModalConfig] = React.useState(null);
    const [isDarkMode, setIsDarkMode] = React.useState(true);
    
    const fileInputRef = React.useRef(null);
    const chatContainerRef = React.useRef(null);
    const questionInputRef = React.useRef(null);

    /**
     * Filters documents based on search input
     */
    const filteredDocs = indexedDocs.filter(doc => 
        doc.toLowerCase().includes(docFilter.toLowerCase())
    );

    /**
     * Fetches indexed documents from server
     */
    const fetchDocuments = React.useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/documents`);
            if (!response.ok) {
                throw new Error('Could not connect to the backend server. Please ensure it is running.');
            }
            const data = await response.json();
            setIndexedDocs(data.documents || []);
        } catch (e) {
            setError(e.message);
            console.error("Failed to fetch documents:", e);
        }
    }, []);

    /**
     * Exports chat history to text file
     */
    const exportChat = React.useCallback(() => {
        const timestamp = new Date().toISOString().split('T')[0];
        const chatText = chatHistory.map(msg => 
            `${msg.role.toUpperCase()}: ${msg.text}\n${
                msg.sources ? `Sources: ${msg.sources.map(s => s.name).join(', ')}\n` : ''
            }`
        ).join('\n---\n');
        
        const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `policy-navigator-chat-${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [chatHistory]);

    /**
     * Keyboard shortcuts handler
     */
    React.useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                questionInputRef.current?.focus();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
                e.preventDefault();
                fileInputRef.current?.click();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                if (chatHistory.length > 0) exportChat();
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [exportChat, chatHistory.length]);

    /**
     * Initial document fetch on mount
     */
    React.useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    /**
     * Auto-scroll to latest message
     */
    React.useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    /**
     * Handles file upload with progress tracking
     */
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(progress);
                    }
                });

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const parsedResponse = JSON.parse(xhr.responseText);
                            resolve(parsedResponse);
                        } catch (jsonError) {
                            console.error("Failed to parse JSON response:", xhr.responseText);
                            reject(new Error("Received an invalid response from the server."));
                        }
                    } else {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            reject(new Error(errorResponse.error || `Server responded with status ${xhr.status}`));
                        } catch {
                            reject(new Error(`Server responded with status ${xhr.status} and an invalid error format.`));
                        }
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('A network error occurred. Please check your connection.'));
                };
                
                xhr.open('POST', `${API_BASE_URL}/api/upload`);
                xhr.send(formData);
            });

            setIndexedDocs(result.documents || []);
            setChatHistory(prev => [...prev, { role: 'assistant', text: `✅ Successfully uploaded and indexed: ${file.name}` }]);

        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
            event.target.value = '';
        }
    };

    /**
     * Rebuilds document index on server
     */
    const handleRebuildIndex = async () => {
        setIsRebuilding(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/rebuild-index`, { method: 'POST' });
            
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to rebuild index.');
            }
            
            await fetchDocuments();

            const successMsg = {
                role: 'assistant',
                text: '✅ The knowledge base has been successfully rebuilt.',
                sources: []
            };
            setChatHistory(prev => [...prev, successMsg]);

        } catch (e) {
            setError(e.message);
        } finally {
            setIsRebuilding(false);
        }
    };

    /**
     * Submits question to API and handles response
     */
    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!question.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        
        const userMessage = { role: 'user', text: question };
        setChatHistory(prev => [...prev, userMessage]);
        setQuestion('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get an answer.');
            }
            
            const assistantMessage = { 
                role: 'assistant', 
                text: result.answer, 
                sources: result.sources 
            };
            setChatHistory(prev => [...prev, assistantMessage]);

        } catch (e) {
            setError(e.message);
            const errorMessage = { 
                role: 'assistant', 
                text: "I'm having a little trouble connecting right now. Could you please try asking again in a moment? It might also be helpful to check if the server is running." 
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    /**
     * Sets example question in input field
     */
    const handleExampleQuestion = (exampleText) => {
        setQuestion(exampleText);
        questionInputRef.current?.focus();
    };

    /**
     * Shows confirmation modal for clearing chat
     */
    const confirmClearChat = () => {
        setModalConfig({
            title: 'Clear Chat History',
            message: 'Are you sure you want to delete the entire chat history? This action cannot be undone.',
            confirmText: 'Clear Chat',
            onConfirm: () => setChatHistory([]),
        });
    };
    
    /**
     * Shows confirmation modal for rebuilding index
     */
    const confirmRebuildIndex = () => {
        setModalConfig({
            title: 'Rebuild Knowledge Base',
            message: 'This will re-scan and re-index all initial documents. It may take some time. Are you sure you want to continue?',
            confirmText: 'Rebuild',
            onConfirm: handleRebuildIndex,
        });
    };

    return (
        <div className={`${isDarkMode ? 'dark' : ''} flex h-screen bg-gray-100 dark:bg-gray-950 font-sans transition-colors duration-300`}>
            <ConfirmationModal config={modalConfig} onClose={() => setModalConfig(null)} />
            
            {/* Sidebar */}
            <aside className="w-1/3 max-w-sm p-6 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                <div className="flex items-center mb-6">
                    <BrainCircuit className="w-8 h-8 text-indigo-500" />
                    <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white">Policy Navigator</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">Your AI assistant for navigating complex government regulations.</p>
                
                {/* Upload Section */}
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                    1. Upload Documents
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 ml-2 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Ctrl+U</span>
                </h2>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.csv,.txt,.json"
                        disabled={isLoading || isRebuilding}
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={isLoading || isRebuilding}
                        className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        <span>{isLoading && uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Click to upload a file'}</span>
                    </button>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                            <div 
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Knowledge Base Section */}
                <div className="flex flex-col flex-grow mt-8 min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            2. Knowledge Base ({indexedDocs.length})
                        </h2>
                                                <button
                            onClick={confirmRebuildIndex}
                            disabled={isRebuilding || isLoading}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 disabled:cursor-wait transition-colors"
                            title="Re-scan directory and rebuild index"
                        >
                            {isRebuilding ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {indexedDocs.length > 0 && (
                        <div className="relative mb-2">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Filter documents..."
                                value={docFilter}
                                onChange={(e) => setDocFilter(e.target.value)}
                                className="w-full pl-10 pr-8 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                            {docFilter && (
                                <button
                                    onClick={() => setDocFilter('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg custom-scrollbar">
                        {filteredDocs.length > 0 ? (
                            <ul className="space-y-1">
                                {filteredDocs.map((doc, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors">
                                        <span className="mr-2 text-lg">{getFileIcon(doc)}</span>
                                        <span className="truncate flex-1" title={doc}>{doc}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : indexedDocs.length > 0 ? (
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                                No documents match "{docFilter}"
                            </div>
                        ) : (
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                                No documents indexed yet. Upload a file to begin.
                            </div>
                        )}
                    </div>
                </div>

                {/* Example Questions */}
                <div className="mt-auto pt-8">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Example Questions</h3>
                    <div className="space-y-1">
                        {exampleQuestions.slice(0, showAllExamples ? exampleQuestions.length : 3).map((q, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleExampleQuestion(q)} 
                                className="text-left w-full text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-2 rounded transition-colors"
                            >
                                "{q}"
                            </button>
                        ))}
                    </div>
                    {exampleQuestions.length > 3 && (
                        <button
                            onClick={() => setShowAllExamples(!showAllExamples)}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
                        >
                            {showAllExamples ? 'Show less' : `Show ${exampleQuestions.length - 3} more`}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
                <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chat</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Toggle theme"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        {chatHistory.length > 0 && (
                            <>
                                <button
                                    onClick={exportChat}
                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Export chat (Ctrl+E)"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={confirmClearChat}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
                    {chatHistory.length === 0 && !isLoading ? (
                        <WelcomeMessage />
                    ) : (
                        chatHistory.map((msg, index) => <ChatMessage key={index} message={msg} />)
                    )}
                    
                    {isLoading && chatHistory.length > 0 && (
                         <div className="flex items-start gap-4">
                              <Bot className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                              <div className="flex items-center space-x-2 pt-2">
                                  <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                                  <span className="text-gray-600 dark:text-gray-400">Processing your question...</span>
                              </div>
                        </div>
                    )}
                </main>

                {/* Question Input Area */}
                <footer className="p-6 md:p-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 mb-4 rounded-md text-sm" role="alert">
                            <div className="flex">
                                <Server className="w-5 h-5 mr-3 flex-shrink-0"/>
                                <div>
                                    <p className="font-bold">Connection Error</p>
                                    <p>{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="ml-auto pl-3">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleAskQuestion} className="relative">
                        <textarea
                            ref={questionInputRef}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAskQuestion(e);
                                }
                            }}
                            placeholder={indexedDocs.length === 0 ? "Upload documents to start asking questions..." : "Ask a question about the indexed documents..."}
                            className="w-full p-4 pr-14 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                            disabled={isLoading || isRebuilding || indexedDocs.length === 0}
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || isRebuilding || !question.trim() || indexedDocs.length === 0}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                            title="Send message"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Press Enter to send (Shift+Enter for newline) • <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">Ctrl+K</span> to focus
                    </div>
                </footer>
            </div>
            
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-in-out;
                }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #d1d5db;
                    border-radius: 20px;
                    border: 3px solid transparent;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4b5563;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #9ca3af;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #6b7280;
                }
            `}</style>
        </div>
    );
}