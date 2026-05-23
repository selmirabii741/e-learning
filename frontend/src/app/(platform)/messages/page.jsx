'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { messagesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import UserAvatar from '@/components/ui/UserAvatar';
import { Search, SlidersHorizontal, MessageSquare, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function formatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function MessagesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('toutes'); // toutes, non_lues, archivees

    useEffect(() => {
        messagesAPI.getConversations()
            .then(({ data }) => setConversations(data.conversations))
            .catch(() => toast.error('Erreur chargement des conversations'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = conversations.filter((c) => {
        const matchesSearch = c.partner?.name?.toLowerCase().includes(search.toLowerCase());
        if (activeTab === 'non_lues') return matchesSearch && c.unreadCount > 0;
        // archive logic if exists
        return matchesSearch;
    });

    const unreadTotal = conversations.filter(c => c.unreadCount > 0).length;

    return (
        <Sidebar>
            <div className="h-[calc(100vh-80px)] flex bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
                
                {/* ══ COLONNE GAUCHE (CONVERSATIONS) ══ */}
                <div className="w-full md:w-[380px] flex-shrink-0 flex flex-col bg-white border-r border-[#E5E7EB] z-10">
                    
                    {/* Header List */}
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

                        {/* Tabs */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setActiveTab('toutes')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'toutes' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Toutes <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'toutes' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{conversations.length}</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('non_lues')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'non_lues' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Non lues {unreadTotal > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'non_lues' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{unreadTotal}</span>}
                            </button>
                            <button 
                                onClick={() => setActiveTab('archivees')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'archivees' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Archivées
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm font-medium">
                                Aucune conversation trouvée.
                            </div>
                        ) : (
                            filtered.map(({ partner, lastMessage, unreadCount }) => (
                                <Link
                                    key={partner._id}
                                    href={`/messages/${partner._id}`}
                                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all group"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                                            {partner.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`text-[15px] truncate ${unreadCount > 0 ? 'font-extrabold text-slate-800' : 'font-bold text-slate-700'}`}>
                                                {partner.name}
                                            </h3>
                                            <span className={`text-[11px] font-bold ${unreadCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {lastMessage?.createdAt ? formatTime(lastMessage.createdAt) : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-[13px] truncate pr-2 ${unreadCount > 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
                                                {lastMessage?.content || '...'}
                                            </p>
                                            {unreadCount > 0 && (
                                                <span className="w-5 h-5 flex-shrink-0 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* ══ COLONNE DROITE (VIDE) ══ */}
                <div className="hidden md:flex flex-1 items-center justify-center bg-[#F8FAFC]">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Vos messages</h2>
                        <p className="text-sm font-medium text-slate-500 max-w-[250px] mx-auto">
                            Sélectionnez une conversation dans la liste pour commencer à discuter.
                        </p>
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
