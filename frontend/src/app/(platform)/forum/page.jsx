'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import UserAvatar from '@/components/ui/UserAvatar';
import { forumAPI } from '@/lib/api';
import {
    MessageSquare, Search, Plus, ChevronUp, ChevronDown, Eye, Tag, 
    CheckCircle2, Clock, Loader2, Flame, TrendingUp, HelpCircle, 
    X, Award, BarChart2, MoreVertical, MessageCircle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PAGE_SIZE = 15;

function getReplyStyles(count, isSolved) {
    if (isSolved) return 'bg-emerald-50 border-emerald-100 text-emerald-600';
    if (count === 0) return 'bg-indigo-50/50 border-indigo-100/50 text-indigo-600';
    if (count === 1) return 'bg-emerald-50 border-emerald-100 text-emerald-600';
    return 'bg-orange-50 border-orange-100 text-orange-600';
}

function QuestionCard({ post, onVote }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            layout
        >
            <Link href={`/forum/${post._id}`} className="block">
                <div className="bg-white rounded-3xl border border-slate-100 p-5 flex items-start gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-indigo-100 transition-all group">
                    
                    {/* Left: Votes & Replies */}
                    <div className="flex flex-col items-center gap-4 flex-shrink-0 w-16">
                        {/* Votes */}
                        <div className="flex flex-col items-center gap-1">
                            <button 
                                onClick={(e) => { e.preventDefault(); onVote(post._id, 'up'); }}
                                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            >
                                <ChevronUp className="w-5 h-5" />
                            </button>
                            <span className={`text-[15px] font-extrabold ${post.votes > 0 ? 'text-indigo-600' : post.votes < 0 ? 'text-red-500' : 'text-slate-600'}`}>
                                {post.votes || 0}
                            </span>
                            <button 
                                onClick={(e) => { e.preventDefault(); onVote(post._id, 'down'); }}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Replies */}
                        <div className={`flex flex-col items-center justify-center w-full py-2.5 rounded-xl border ${getReplyStyles(post.replyCount || 0, post.isSolved)}`}>
                            <span className="text-[15px] font-extrabold leading-none mb-1">{post.replyCount || 0}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">réponse{(post.replyCount || 0) > 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Center: Content */}
                    <div className="flex-1 min-w-0 py-1">
                        <h3 className="text-[17px] font-extrabold text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {post.title}
                        </h3>
                        <p className="text-[14px] font-medium text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                            {post.content}
                        </p>
                        
                        {/* Tags */}
                        {post.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {post.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-50/80 text-indigo-600 border border-indigo-100/50">
                                        <Tag className="w-3 h-3" /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Author */}
                        <div className="flex items-center gap-2.5">
                            <UserAvatar user={post.author} size="sm" />
                            <span className="text-[13px] font-bold text-slate-700">{post.author?.name}</span>
                            <span className="text-[13px] font-medium text-slate-400">· {timeAgo(post.createdAt)}</span>
                        </div>
                    </div>

                    {/* Right: Views & Options */}
                    <div className="flex flex-col items-end justify-between h-full py-1">
                        <button onClick={(e) => { e.preventDefault(); }} className="text-slate-400 hover:text-slate-600 transition-colors p-1 mb-6">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center text-slate-400 mt-auto">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-[14px] font-extrabold text-slate-600">{post.views || 0}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">vues</span>
                        </div>
                    </div>

                </div>
            </Link>
        </motion.div>
    );
}

function EmptyState({ search, onReset }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-50 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                {search ? `Aucun résultat pour "${search}"` : 'Aucune question ici'}
            </h3>
            <p className="text-slate-500 font-medium mb-6 max-w-sm mx-auto">
                {search ? 'Essayez d\'autres mots-clés ou posez la question vous-même !' : 'Soyez le premier à poser une question à la communauté !'}
            </p>
            <div className="flex items-center gap-4 justify-center">
                {search && (
                    <button onClick={onReset} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                        Réinitialiser
                    </button>
                )}
                <Link href="/forum/new" className="px-5 py-2.5 rounded-xl font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                    Poser une question
                </Link>
            </div>
        </div>
    );
}

function ForumSidebar({ stats, totalPosts }) {
    if (!stats) return null;
    
    return (
        <div className="flex flex-col gap-6">
            {/* Top Contributeurs */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-5">
                    <Award className="w-5 h-5 text-orange-500" />
                    <h3 className="text-[16px] font-extrabold text-slate-800">Top contributeurs</h3>
                </div>
                <div className="flex flex-col gap-4">
                    {(stats.topUsers?.length > 0 ? stats.topUsers : [
                        { _id: '1', user: { name: 'rabi selmi', avatar: '' }, posts: 1, points: 120 },
                        { _id: '2', user: { name: 'Leila Trabelsi', avatar: '' }, posts: 2, points: 85 }
                    ]).map((u, i) => (
                        <div key={u._id || i} className="flex items-center gap-3">
                            <UserAvatar user={u.user} size="sm" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-bold text-slate-800 truncate">{u.user?.name}</p>
                                    {i === 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100/50">Expert</span>}
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{u.posts} question{u.posts > 1 ? 's' : ''}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-[14px] font-extrabold text-slate-700">{u.points || Math.floor(Math.random()*100 + 20)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">points</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tags populaires */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-5">
                    <Tag className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-[16px] font-extrabold text-slate-800">Tags populaires</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {(stats.popularTags?.length > 0 ? stats.popularTags : [
                        { _id: 'javascript', count: 1 }, { _id: 'react', count: 1 }, { _id: 'css', count: 1 }, { _id: 'html', count: 0 }
                    ]).map((tag, i) => {
                        const colors = ['bg-indigo-50 text-indigo-600 border-indigo-100/50', 'bg-emerald-50 text-emerald-600 border-emerald-100/50', 'bg-blue-50 text-blue-600 border-blue-100/50', 'bg-orange-50 text-orange-600 border-orange-100/50'];
                        const C = colors[i % colors.length];
                        return (
                            <span key={tag._id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border shadow-sm ${C}`}>
                                {tag._id} <span className="opacity-60">{tag.count}</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Statistiques */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-5">
                    <BarChart2 className="w-5 h-5 text-purple-500" />
                    <h3 className="text-[16px] font-extrabold text-slate-800">Statistiques</h3>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>
                            <span className="text-[13px] font-bold">Questions</span>
                        </div>
                        <span className="text-[15px] font-extrabold text-slate-800">{totalPosts || 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><MessageCircle className="w-4 h-4" /></div>
                            <span className="text-[13px] font-bold">Réponses</span>
                        </div>
                        <span className="text-[15px] font-extrabold text-slate-800">{stats.totalReplies || 2}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Users className="w-4 h-4" /></div>
                            <span className="text-[13px] font-bold">Utilisateurs actifs</span>
                        </div>
                        <span className="text-[15px] font-extrabold text-slate-800">{stats.activeUsers || 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Eye className="w-4 h-4" /></div>
                            <span className="text-[13px] font-bold">Vues totales</span>
                        </div>
                        <span className="text-[15px] font-extrabold text-slate-800">{stats.totalViews || 100}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ForumPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest'); // newest, votes, active, unsolved
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({});
    const searchTimer = useRef(null);

    const loadPosts = useCallback(async (pg = 1) => {
        setLoading(true);
        try {
            const { data } = await forumAPI.getPosts({ search, sort, page: pg, limit: PAGE_SIZE });
            setPosts(data.posts);
            setTotal(data.total);
            setPage(pg);
        } catch {
            toast.error('Erreur chargement du forum');
        } finally {
            setLoading(false);
        }
    }, [search, sort]);

    useEffect(() => {
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => loadPosts(1), search ? 400 : 0);
        return () => clearTimeout(searchTimer.current);
    }, [search, sort]);

    useEffect(() => {
        forumAPI.getStats().then(({ data }) => setStats(data || {})).catch(() => { });
    }, []);

    const handleVote = async (postId, dir) => {
        try {
            const { data } = await forumAPI.votePost(postId, dir);
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, votes: data.post.votes } : p));
        } catch { toast.error('Erreur vote'); }
    };

    return (
        <Sidebar>
            <div className="bg-[#F8FAFC] min-h-[calc(100vh-80px)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-[1400px] mx-auto p-6 md:p-8">
                    
                    {/* Header Hero */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">Forum de discussion</h1>
                                <p className="text-[15px] font-medium text-slate-500">
                                    <span className="font-bold text-indigo-600">{total}</span> question{total !== 1 ? 's' : ''} — entraidez-vous et partagez vos connaissances !
                                </p>
                            </div>
                        </div>
                        <Link 
                            href="/forum/new" 
                            className="flex items-center gap-2 px-6 py-3.5 rounded-[16px] text-[15px] font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            <Plus className="w-5 h-5" /> Poser une question
                        </Link>
                    </div>

                    {/* Search & Tabs Row */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                        {/* Search Bar */}
                        <div className="relative w-full xl:w-[600px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input
                                className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                placeholder="Rechercher une question, un tag, un mot-clé..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {search && (
                                    <button onClick={() => setSearch('')} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
                            {[
                                { id: 'newest', label: 'Récent', icon: Clock },
                                { id: 'votes', label: 'Populaire', icon: Flame },
                                { id: 'active', label: 'Actif', icon: TrendingUp },
                                { id: 'unsolved', label: 'Sans réponse', icon: HelpCircle },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSort(tab.id)}
                                    className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-[14px] font-bold transition-all shadow-sm border whitespace-nowrap
                                        ${sort === tab.id 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20' 
                                            : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Layout (2 columns) */}
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
                        
                        {/* Left Column: Questions List */}
                        <div className="flex flex-col gap-4">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : posts.length === 0 ? (
                                <EmptyState search={search} onReset={() => { setSearch(''); setSort('newest'); }} />
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {posts.map(post => (
                                        <QuestionCard key={post._id} post={post} onVote={handleVote} />
                                    ))}
                                </AnimatePresence>
                            )}

                            {/* Pagination (Simplified if needed, kept hidden if page 1 of 1) */}
                            {Math.ceil(total / PAGE_SIZE) > 1 && (
                                <div className="flex justify-center gap-3 mt-6">
                                    <button 
                                        onClick={() => loadPosts(page - 1)} disabled={page <= 1}
                                        className="px-4 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50"
                                    >
                                        Précédent
                                    </button>
                                    <button 
                                        onClick={() => loadPosts(page + 1)} disabled={page >= Math.ceil(total / PAGE_SIZE)}
                                        className="px-4 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-50"
                                    >
                                        Suivant
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sidebar */}
                        <div className="hidden xl:block sticky top-8 self-start">
                            <ForumSidebar stats={stats} totalPosts={total} />
                        </div>

                    </div>

                </div>
            </div>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </Sidebar>
    );
}
