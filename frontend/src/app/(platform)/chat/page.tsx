'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import {
    Sparkles, Search, Trash2, Plus, Paperclip, Image as ImageIcon,
    Code, Send, Bot, User, MoreHorizontal, FileText, ChevronDown,
    X, RefreshCw, Copy, Check, Menu, Lightbulb, Code2, BrainCircuit, ShieldCheck, Lock, ArrowRight,
    SlidersHorizontal, MoreVertical
} from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { globalChatAPI } from '@/lib/api';

// === Types ===
type Role = 'user' | 'assistant';

interface ChatMessage {
    _id: string;
    role: Role;
    content: string;
    createdAt: string;
    attachments?: { type: string; url: string; name: string }[];
}

interface ChatConversation {
    _id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

const API_BASE = '/api/chat';

// === Helper to group conversations ===
const groupConversations = (convos: ChatConversation[]) => {
    const today: ChatConversation[] = [];
    const yesterday: ChatConversation[] = [];
    const thisWeek: ChatConversation[] = [];
    const older: ChatConversation[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 86400000 * 7);

    convos.forEach(c => {
        const d = new Date(c.updatedAt || c.createdAt);
        if (d >= todayStart) today.push(c);
        else if (d >= yesterdayStart) yesterday.push(c);
        else if (d >= weekStart) thisWeek.push(c);
        else older.push(c);
    });

    return { "Aujourd'hui": today, "Hier": yesterday, "Cette semaine": thisWeek, "Plus ancien": older };
};

const MarkdownRenderer = ({ content }: { content: string }) => {
    // Basic Markdown formatting for display
    const formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm text-[#4f46e5] font-mono">$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-[#1e293b] text-white p-4 rounded-xl overflow-x-auto my-3 text-sm font-mono">$1</pre>')
        .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="markdown-body" />;
};

export default function GlobalChatPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [searchMode, setSearchMode] = useState<'global' | 'document'>('document');

    const endRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Initial load: fetch conversations
    useEffect(() => {
        fetchConversations();
    }, []);

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeId) {
            fetchMessages(activeId);
            fetchDocuments(activeId);
        } else {
            setMessages([]);
            setDocuments([]);
        }
    }, [activeId]);

    // Scroll to bottom
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // === API Calls ===
    const fetchConversations = async () => {
        try {
            const { data } = await globalChatAPI.getConversations();
            setConversations(data);
        } catch (error) {
            console.error("Failed to fetch conversations");
        }
    };

    const fetchMessages = async (convId: string) => {
        try {
            const { data } = await globalChatAPI.getMessages(convId);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages");
            setMessages([]);
        }
    };

    const fetchDocuments = async (convId: string) => {
        try {
            const { data } = await globalChatAPI.getDocuments(convId);
            setDocuments(data);
        } catch (error) {
            console.error("Failed to fetch documents");
        }
    };

    const handleCreateConversation = async () => {
        setActiveId(null);
        setMessages([]);
        setDocuments([]);
        setInput('');
    };

    const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await globalChatAPI.deleteConversation(id);
            setConversations(prev => prev.filter(c => c._id !== id));
            if (activeId === id) setActiveId(null);
        } catch (error) {
            console.error("Failed to delete conversation");
        }
    };

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText || input).trim();
        if (!text || isLoading) return;

        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const tempId = Math.random().toString();
        const newMsg: ChatMessage = { _id: tempId, role: 'user', content: text, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, newMsg]);
        setIsLoading(true);

        try {
            let currentActiveId = activeId;

            // If no activeId, create conversation first
            if (!currentActiveId) {
                const { data: newConv } = await globalChatAPI.createConversation(text.slice(0, 30) + '...');
                setConversations(prev => [newConv, ...prev]);
                currentActiveId = newConv._id;
                setActiveId(currentActiveId);
            }

            const { data } = await globalChatAPI.sendMessage(currentActiveId as string, text, searchMode);
            setMessages(prev => [...prev, data.message]);
        } catch (error) {
            console.error("Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            let currentActiveId = activeId;

            if (!currentActiveId) {
                const { data: newConv } = await globalChatAPI.createConversation(`Document: ${file.name.substring(0, 20)}`);
                setConversations(prev => [newConv, ...prev]);
                currentActiveId = newConv._id;
                setActiveId(currentActiveId);
            }

            const { data } = await globalChatAPI.uploadDocument(currentActiveId as string, file);

            // Ajouter un message système visuel localement pour confirmer
            const systemMsg: ChatMessage = {
                _id: Math.random().toString(),
                role: 'assistant',
                content: `📄 **Document prêt** : Le fichier \`${file.name}\` a été analysé avec succès. Posez-moi vos questions dessus !`,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, systemMsg]);

            // Re-fetch documents to show the newly uploaded one
            fetchDocuments(currentActiveId as string);

        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'upload du document.");
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const groups = groupConversations(conversations);

    return (
        <Sidebar>
            <div className="flex h-[calc(100vh-64px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 font-sans overflow-hidden">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.txt,.js,.py,.html,.css,.json,.md,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                />
                {/* === LEFT SIDEBAR (HISTORY) === */}
                <div className={`${isSidebarOpen ? 'w-[300px]' : 'w-0'} flex-shrink-0 bg-white dark:bg-[#0E1322] border-r border-slate-200 dark:border-slate-800/60 transition-all duration-300 overflow-hidden flex flex-col`}>
                    <div className="p-5 flex items-center justify-between pb-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[15px]">Historique des conversations</h3>
                        <div className="flex items-center gap-3">
                            <Search size={18} className="text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors" />
                            <SlidersHorizontal size={18} className="text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors" />
                        </div>
                    </div>

                    <div className="px-4 pb-6">
                        <button
                            onClick={handleCreateConversation}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 hover:from-indigo-100 hover:to-purple-100 dark:from-indigo-500/10 dark:to-purple-500/10 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 py-3.5 px-4 rounded-2xl font-bold text-[14px] transition-all shadow-sm"
                        >
                            <Sparkles size={16} className="text-indigo-500" /> <span>+ Nouvelle conversation</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
                        {Object.entries(groups).map(([label, items]) => {
                            if (items.length === 0) return null;
                            return (
                                <div key={label} className="mb-4">
                                    <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3 px-2">{label}</div>
                                    <div className="space-y-1">
                                        {items.map(conv => (
                                            <div
                                                key={conv._id}
                                                onClick={() => setActiveId(conv._id)}
                                                className={`group relative flex items-center justify-between p-2 cursor-pointer transition-all ${activeId === conv._id
                                                        ? 'bg-indigo-50/80 dark:bg-indigo-500/20 rounded-xl rounded-l-none border-l-4 border-indigo-500 shadow-sm'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border-l-4 border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden pl-1">
                                                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors ${activeId === conv._id
                                                            ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600'
                                                            : 'bg-indigo-50/50 dark:bg-slate-800 text-indigo-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                                                        }`}>
                                                        <Sparkles size={18} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 py-1">
                                                        <span className={`truncate text-[13px] font-bold ${activeId === conv._id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'
                                                            }`}>
                                                            {conv.title || 'Nouvelle conversation'}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                                            {new Date(conv.updatedAt || conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteConversation(conv._id, e)}
                                                    className={`p-1.5 rounded-lg text-indigo-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 ${activeId === conv._id ? 'opacity-100 text-indigo-400' : ''}`}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* === CENTER CHAT AREA === */}
                <div className="flex-1 flex flex-col min-w-0 relative">

                    {/* Header */}
                    <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
                                <Menu size={20} />
                            </button>
                            <div>
                                <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    Assistant IA <Sparkles size={16} className="text-indigo-500" />
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-[13px] font-medium px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-100 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Modèle : Llama 3
                                <ChevronDown size={14} className="text-slate-400 ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-8 pb-48 scrollbar-thin flex flex-col items-center">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto text-center opacity-0 animate-fade-in mt-[-20px]">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
                                    <Sparkles size={32} />
                                </div>
                                <h2 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">Bonjour, comment puis-je vous aider ?</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">Posez vos questions librement. Je suis là pour vous accompagner.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                    <PromptCard
                                        title="Expliquer un concept"
                                        desc="Peux-tu m'expliquer ce qu'est l'Internet des Objets (IoT) ?"
                                        icon={<Lightbulb size={20} />}
                                        colorClass="text-purple-500"
                                        iconBgClass="bg-purple-100 dark:bg-purple-500/20"
                                        onClick={() => handleSend("Peux-tu m'expliquer ce qu'est l'Internet des Objets (IoT) ?")}
                                    />
                                    <PromptCard
                                        title="Aide au code"
                                        desc="Comment fonctionne une boucle en Python ?"
                                        icon={<Code2 size={20} />}
                                        colorClass="text-blue-500"
                                        iconBgClass="bg-blue-100 dark:bg-blue-500/20"
                                        onClick={() => handleSend("Comment fonctionne une boucle en Python ?")}
                                    />
                                    <PromptCard
                                        title="Résumer un texte"
                                        desc="Résume ce document en quelques points clés"
                                        icon={<FileText size={20} />}
                                        colorClass="text-emerald-500"
                                        iconBgClass="bg-emerald-100 dark:bg-emerald-500/20"
                                        onClick={() => handleSend("Résume ce document en quelques points clés")}
                                    />
                                    <PromptCard
                                        title="Brainstorming"
                                        desc="Trouvons des idées pour un projet innovant"
                                        icon={<BrainCircuit size={20} />}
                                        colorClass="text-orange-500"
                                        iconBgClass="bg-orange-100 dark:bg-orange-500/20"
                                        onClick={() => handleSend("Trouvons des idées pour un projet innovant")}
                                    />
                                </div>

                                {/* Banner Confidentiality */}
                                <div className="mt-8 mb-4 w-full flex items-center justify-between p-4 bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                        <div className="text-left">
                                            <h4 className="text-[14px] font-semibold text-indigo-900 dark:text-indigo-300">Confidentialité garantie</h4>
                                            <p className="text-[13px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">Vos conversations sont sécurisées et ne sont pas utilisées pour entraîner nos modèles.</p>
                                        </div>
                                    </div>
                                    <button className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 p-1">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-3xl mx-auto space-y-8 pb-32">
                                {messages.map((msg, idx) => (
                                    <div key={msg._id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>

                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white mt-1 shadow-md">
                                                <Sparkles size={14} />
                                            </div>
                                        )}

                                        <div className={`relative max-w-[85%] group ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                                            <div className={`
                                                px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm
                                                ${msg.role === 'user'
                                                    ? 'bg-[#E9E5FF] dark:bg-indigo-600 text-indigo-950 dark:text-white rounded-tr-sm'
                                                    : 'bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                                                }
                                            `}>
                                                <MarkdownRenderer content={msg.content} />
                                            </div>

                                            {/* Action bar for assistant messages */}
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                                    <button onClick={() => handleCopy(msg.content, msg._id)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        {copiedId === msg._id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                    </button>
                                                    <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                        <RefreshCw size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mt-1 order-2">
                                                <User size={14} />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-4 justify-start animate-fade-in-up">
                                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white mt-1 shadow-md">
                                            <Sparkles size={14} />
                                        </div>
                                        <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={endRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:px-8 lg:px-16 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] dark:from-[#0B0F19] dark:via-[#0B0F19] to-transparent pt-10">
                        <div className="max-w-3xl mx-auto relative">
                            {/* Suggestions */}
                            {messages.length > 0 && !isLoading && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none opacity-0 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
                                    <button onClick={() => handleSend("Donne-moi un résumé")} className="px-4 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors whitespace-nowrap shadow-sm">
                                        Donne-moi un résumé
                                    </button>
                                    <button onClick={() => handleSend("Quels sont les points clés ?")} className="px-4 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors whitespace-nowrap shadow-sm">
                                        Quels sont les points clés ?
                                    </button>
                                </div>
                            )}

                            {/* Uploaded Documents Display */}
                            {documents.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 pb-3 animate-fade-in">
                                    {documents.map(doc => (
                                        <div key={doc._id} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-indigo-700 dark:text-indigo-300 text-xs font-medium shadow-sm transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-default">
                                            <FileText size={14} className="text-indigo-500" />
                                            <span className="truncate max-w-[150px]" title={doc.fileName}>{doc.fileName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Main Input Box */}
                            <div className="bg-white dark:bg-[#1E293B] border-[1.5px] border-slate-200/80 dark:border-slate-700 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all focus-within:border-indigo-400 focus-within:ring-[3px] focus-within:ring-indigo-500/10">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Posez votre question ici..."
                                    className="w-full max-h-[200px] min-h-[64px] py-5 px-6 bg-transparent border-none outline-none resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[16px]"
                                    rows={1}
                                />

                                {/* Bottom Toolbar */}
                                <div className="flex items-center justify-between px-3 pb-3">
                                    <div className="flex items-center gap-1">
                                        <button onClick={handleUploadClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <Paperclip size={18} className="text-slate-400" /> <span className="hidden sm:inline">PDF</span>
                                        </button>
                                        <button onClick={handleUploadClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <ImageIcon size={18} className="text-slate-400" /> <span className="hidden sm:inline">Image</span>
                                        </button>
                                        <button onClick={handleUploadClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <Code size={18} className="text-slate-400" /> <span className="hidden sm:inline">Code</span>
                                        </button>
                                        <button className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <select
                                                value={searchMode}
                                                onChange={(e) => setSearchMode(e.target.value as 'global' | 'document')}
                                                className="bg-indigo-50/80 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-[13px] font-semibold px-4 py-2 pr-8 rounded-xl outline-none cursor-pointer border-none hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors appearance-none flex items-center shadow-sm"
                                            >
                                                <option value="document">📄 Strict (Document)</option>
                                                <option value="global">🌍 Global (Général)</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg mr-1 shadow-sm">
                                            <span>⌘</span><span>↵</span>
                                        </div>
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim() || isLoading}
                                            className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${input.trim() && !isLoading
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:scale-105'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                                }`}
                                        >
                                            <Send size={18} className={input.trim() && !isLoading ? 'ml-0.5' : ''} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4 text-[13px] text-slate-500 dark:text-slate-500 font-medium pb-2">
                                <Lock size={12} className="text-slate-400" /> EduAI peut faire des erreurs. Vérifiez les informations importantes.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inline Styles for Markdown & Animations */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .scrollbar-none::-webkit-scrollbar { display: none; }
                    .markdown-body strong { font-weight: 600; color: inherit; }
                    .markdown-body em { font-style: italic; }
                    .markdown-body p { margin-bottom: 0.75em; }
                    .markdown-body p:last-child { margin-bottom: 0; }
                    .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
                    .markdown-body li { margin-bottom: 0.25em; }
                `}} />
            </div>
        </Sidebar>
    );
}

// Components
const PromptCard = ({ title, desc, icon, onClick, colorClass, iconBgClass }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void, colorClass: string, iconBgClass: string }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-start text-left p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
    >
        <div className={`w-11 h-11 rounded-[0.85rem] ${iconBgClass} ${colorClass} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-[15px] mb-1.5">{title}</h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%]">{desc}</p>

        <div className={`absolute bottom-4 right-4 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-50 dark:bg-slate-800 ${colorClass}`}>
            <ArrowRight size={14} />
        </div>
    </button>
);

const MessageIcon = ({ label, active }: { label: string, active: boolean }) => {
    const colorClass = active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500';
    if (label === "Aujourd'hui") return <Sparkles size={16} className={colorClass} />;
    if (label === "Hier") return <Code size={16} className={colorClass} />;
    return <FileText size={16} className={colorClass} />;
};