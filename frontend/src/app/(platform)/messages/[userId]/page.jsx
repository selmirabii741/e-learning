'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { messagesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import { 
    Search, SlidersHorizontal, ArrowLeft, MoreVertical, 
    Info, CheckCheck, Smile, Paperclip, Send 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

function formatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTimestamp(dateStr) {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
    const { userId } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    
    // Left column state
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('toutes');
    
    // Right column state
    const [messages, setMessages] = useState([]);
    const [partner, setPartner] = useState(null);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const bottomRef = useRef(null);
    const pollingRef = useRef(null);

    // Fetch conversations list
    useEffect(() => {
        messagesAPI.getConversations()
            .then(({ data }) => setConversations(data.conversations))
            .finally(() => setLoadingConversations(false));
    }, []);

    // Fetch active thread
    const loadThread = useCallback(async (initial = false) => {
        try {
            const { data } = await messagesAPI.getThread(userId);
            setMessages(data.messages);
            if (initial) setPartner(data.partner);
        } catch {
            if (initial) {
                toast.error('Conversation introuvable');
                router.push('/messages');
            }
        }
    }, [userId, router]);

    useEffect(() => {
        loadThread(true);
        pollingRef.current = setInterval(() => loadThread(false), 5000);
        return () => clearInterval(pollingRef.current);
    }, [loadThread]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!content.trim() || sending) return;
        setSending(true);
        try {
            const { data } = await messagesAPI.send({ receiverId: userId, content: content.trim() });
            setMessages(prev => [...prev, data.message]);
            setContent('');
            setShowEmojiPicker(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur envoi');
        } finally {
            setSending(false);
        }
    };

    const filtered = conversations.filter((c) => {
        const matchesSearch = c.partner?.name?.toLowerCase().includes(search.toLowerCase());
        if (activeTab === 'non_lues') return matchesSearch && c.unreadCount > 0;
        return matchesSearch;
    });

    const unreadTotal = conversations.filter(c => c.unreadCount > 0).length;

    // Group messages by date
    const grouped = [];
    let lastDate = '';
    messages.forEach(msg => {
        const day = new Date(msg.createdAt).toDateString();
        if (day !== lastDate) {
            grouped.push({ type: 'separator', label: formatDateLabel(msg.createdAt), key: `sep-${day}` });
            lastDate = day;
        }
        grouped.push({ type: 'message', msg });
    });

    return (
        <Sidebar>
            <div className="h-[calc(100vh-80px)] flex bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
                
                {/* ══ COLONNE GAUCHE (CONVERSATIONS) ══ */}
                <div className="hidden md:flex w-[380px] flex-shrink-0 flex-col bg-white border-r border-[#E5E7EB] z-10">
                    <div className="p-5 flex flex-col gap-5 border-b border-[#E5E7EB]">
                        <h1 className="text-2xl font-extrabold text-slate-800">Messages</h1>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="Rechercher une conversation..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="w-10 h-10 flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveTab('toutes')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'toutes' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                Toutes <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'toutes' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{conversations.length}</span>
                            </button>
                            <button onClick={() => setActiveTab('non_lues')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'non_lues' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                Non lues {unreadTotal > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'non_lues' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{unreadTotal}</span>}
                            </button>
                            <button onClick={() => setActiveTab('archivees')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'archivees' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                                Archivées
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
                        {loadingConversations ? null : filtered.map(({ partner: p, lastMessage, unreadCount }) => {
                            const isActive = p._id === userId;
                            return (
                                <Link
                                    key={p._id}
                                    href={`/messages/${p._id}`}
                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all group ${isActive ? 'bg-indigo-50/50 shadow-[0_2px_8px_rgba(99,102,241,0.05)]' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${isActive ? 'shadow-sm' : ''}`} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                            {p.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`text-[15px] truncate ${isActive || unreadCount > 0 ? 'font-extrabold text-slate-800' : 'font-bold text-slate-700'}`}>
                                                {p.name}
                                            </h3>
                                            <span className={`text-[11px] font-bold ${isActive ? 'text-indigo-600' : unreadCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {lastMessage?.createdAt ? formatTime(lastMessage.createdAt) : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-[13px] truncate pr-2 ${isActive || unreadCount > 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
                                                {lastMessage?.content || '...'}
                                            </p>
                                            {unreadCount > 0 && !isActive && (
                                                <span className="w-5 h-5 flex-shrink-0 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* ══ COLONNE DROITE (CONVERSATION ACTIVE) ══ */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                    {/* Chat Header */}
                    <div className="h-[88px] flex items-center justify-between px-6 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <Link href="/messages" className="md:hidden w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            
                            {partner && (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                            {partner.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-slate-800 leading-tight">{partner.name}</h2>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs font-bold text-slate-500">En ligne <span className="mx-1 font-normal text-slate-300">•</span> {partner.role === 'instructor' ? 'Instructeur' : 'Étudiant'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                                <Info className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                        {grouped.map(item => {
                            if (item.type === 'separator') {
                                return (
                                    <div key={item.key} className="flex items-center justify-center my-6">
                                        <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            }

                            const { msg } = item;
                            const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
                            const currentUserId = user?._id || user?.id;
                            const isMe = String(senderId) === String(currentUserId);

                            return (
                                <div key={msg._id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 shadow-sm mb-5" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                            {msg.sender?.name?.substring(0, 2).toUpperCase() || partner?.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-5 py-3.5 text-[14px] leading-relaxed font-medium shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${isMe ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-[20px] rounded-br-[4px]' : 'bg-white text-slate-800 border border-slate-100 rounded-[20px] rounded-bl-[4px]'}`}>
                                            {msg.content}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-1 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[11px] font-bold text-slate-400">{formatTimestamp(msg.createdAt)}</span>
                                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} className="h-2" />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white border-t border-[#E5E7EB]">
                        <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[30px] p-1.5 pr-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                                
                                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                                    <Smile className="w-5 h-5" />
                                </button>

                                {showEmojiPicker && (
                                    <div className="absolute bottom-16 left-0 z-50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden border border-slate-100">
                                        <EmojiPicker onEmojiClick={(e) => setContent(c => c + e.emoji)} />
                                    </div>
                                )}

                                <input
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 px-2 py-3"
                                    placeholder="Écrire un message..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage(e);
                                        }
                                    }}
                                />

                                <button type="button" className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                <button 
                                    type="submit" 
                                    disabled={sending || !content.trim()}
                                    className="w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform hover:scale-105 active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                                >
                                    <Send className="w-5 h-5 ml-0.5" />
                                </button>
                            </div>
                            
                            <div className="text-center mt-3">
                                <p className="text-[11px] font-bold text-slate-400">
                                    Appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-indigo-400 font-mono">Enter</kbd> pour envoyer · <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-indigo-400 font-mono">Shift + Enter</kbd> pour passer à la ligne
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #CBD5E1; }
            `}</style>
        </Sidebar>
    );
}
