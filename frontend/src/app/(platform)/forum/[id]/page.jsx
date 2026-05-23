'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import UserAvatar from '@/components/ui/UserAvatar';
import { forumAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import {
    ArrowLeft, ChevronUp, ChevronDown, CheckCircle2,
    MessageCircle, Eye, Tag, Trash2, Loader2, Send, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}


function VoteButtons({ votes, onUp, onDown, className = '' }) {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <button onClick={onUp} className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8FA098] hover:text-teal-400 transition-colors">
                <ChevronUp className="w-5 h-5" />
            </button>
            <span className={`text-sm font-bold ${votes > 0 ? 'text-teal-400' : votes < 0 ? 'text-red-400' : 'text-[#8FA098]'}`}>
                {votes}
            </span>
            <button onClick={onDown} className="p-1 rounded-lg hover:bg-white/[0.08] text-[#8FA098] hover:text-red-400 transition-colors">
                <ChevronDown className="w-5 h-5" />
            </button>
        </div>
    );
}

export default function ForumThreadPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [post, setPost] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        forumAPI.getPost(id)
            .then(({ data }) => {
                setPost(data.post);
                setReplies(data.replies);
            })
            .catch(() => toast.error('Post introuvable'))
            .finally(() => setLoading(false));
    }, [id]);


    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSending(true);
        try {
            const { data } = await forumAPI.addReply(id, { content: replyContent.trim() });
            setReplies((prev) => [...prev, data.reply]);
            setPost((p) => ({ ...p, replyCount: (p.replyCount || 0) + 1 }));
            setReplyContent('');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur envoi');
        } finally { setSending(false); }
    };


    const votePost = async (dir) => {
        try {
            const { data } = await forumAPI.votePost(id, dir);
            setPost(data.post);
        } catch { toast.error('Erreur vote'); }
    };


    const voteReply = async (replyId, dir) => {
        try {
            const { data } = await forumAPI.voteReply(replyId, dir);
            setReplies((prev) => prev.map((r) => r._id === replyId ? data.reply : r));
        } catch { toast.error('Erreur vote'); }
    };


    const acceptReply = async (replyId) => {
        try {
            const { data } = await forumAPI.acceptReply(replyId);
            setReplies((prev) => prev.map((r) => ({
                ...r,
                isAccepted: r._id === replyId ? true : false,
            })));
            setPost((p) => ({ ...p, isSolved: true }));
            toast.success('Meilleure réponse sélectionnée !');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur');
        }
    };


    const deletePost = async () => {
        if (!confirm('Supprimer cette question ?')) return;
        try {
            await forumAPI.deletePost(id);
            toast.success('Question supprimée');
            router.push('/forum');
        } catch { toast.error('Erreur suppression'); }
    };


    const deleteReply = async (replyId) => {
        if (!confirm('Supprimer cette réponse ?')) return;
        try {
            await forumAPI.deleteReply(replyId);
            setReplies((prev) => prev.filter((r) => r._id !== replyId));
            setPost((p) => ({ ...p, replyCount: Math.max(0, (p.replyCount || 1) - 1) }));
            toast.success('Réponse supprimée');
        } catch { toast.error('Erreur suppression'); }
    };

    if (loading) return (
        <Sidebar><div className="flex justify-center py-24"><Loader2 className="w-10 h-10 text-teal-400 animate-spin" /></div></Sidebar>
    );

    if (!post) return (
        <Sidebar>
            <div className="card text-center py-20">
                <p className="text-[#8FA098]">Question introuvable</p>
                <Link href="/forum" className="btn-primary mt-4 mx-auto">Retour au forum</Link>
            </div>
        </Sidebar>
    );

    const isPostAuthor = String(post.author?._id) === String(user?._id);

    return (
        <Sidebar>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/forum"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.10)', color: 'var(--text-secondary)' }}>
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {post.isSolved && <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                        <h1 className="page-title mb-0 truncate">{post.title}</h1>
                    </div>
                    <p className="page-subtitle flex items-center gap-2">
                        <Eye className="w-3 h-3" /> {post.views} vues ·
                        <MessageCircle className="w-3 h-3" /> {post.replyCount} réponse{post.replyCount !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="max-w-4xl space-y-4">
                <div className="card">
                    <div className="flex gap-4">
                        <VoteButtons votes={post.votes} onUp={() => votePost('up')} onDown={() => votePost('down')} />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

                            {post.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {post.tags.map((t) => (
                                        <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                            <Tag className="w-2.5 h-2.5" />{t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-[#8FA098]">
                                    <UserAvatar user={post.author} size="xs" />
                                    <span className="font-medium text-slate-300">{post.author?.name}</span>
                                    <Clock className="w-3 h-3" />
                                    <span>{timeAgo(post.createdAt)}</span>
                                </div>
                                {isPostAuthor && (
                                    <button onClick={deletePost} className="text-[#B7C2B8] hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {replies.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-[#8FA098] uppercase tracking-wider">
                            {replies.length} réponse{replies.length !== 1 ? 's' : ''}
                        </h2>

                        {replies.map((reply) => {
                            const isReplyAuthor = String(reply.author?._id) === String(user?._id);
                            return (
                                <div key={reply._id}
                                    className={`card transition-all ${reply.isAccepted ? 'border border-indigo-500/30 bg-indigo-500/5' : ''}`}>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <VoteButtons
                                                votes={reply.votes}
                                                onUp={() => voteReply(reply._id, 'up')}
                                                onDown={() => voteReply(reply._id, 'down')}
                                            />
                                            {isPostAuthor && !reply.isAccepted && (
                                                <button
                                                    onClick={() => acceptReply(reply._id)}
                                                    title="Marquer comme meilleure réponse"
                                                    className="mt-1 p-1 rounded-lg text-[#B7C2B8] hover:text-indigo-400 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {reply.isAccepted && (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Meilleure réponse
                                                </div>
                                            )}
                                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap mb-3">{reply.content}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs text-[#8FA098]">
                                                    <UserAvatar user={reply.author} size="xs" />
                                                    <span className="font-medium text-slate-300">{reply.author?.name}</span>
                                                    <span className="text-[11px] capitalize">{reply.author?.role}</span>
                                                    <Clock className="w-3 h-3" />
                                                    <span>{timeAgo(reply.createdAt)}</span>
                                                </div>
                                                {isReplyAuthor && (
                                                    <button onClick={() => deleteReply(reply._id)}
                                                        className="text-[#B7C2B8] hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div ref={bottomRef} />

                <div className="card">
                    <h2 className="text-sm font-semibold text-white mb-4">
                        Votre réponse
                    </h2>
                    <form onSubmit={handleReply} className="space-y-3">
                        <textarea
                            rows={5}
                            className="input resize-none"
                            placeholder="Rédigez votre réponse... Soyez précis et pédagogue !"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            maxLength={3000}
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#B7C2B8]">{replyContent.length}/3000</span>
                            <button type="submit" disabled={sending || !replyContent.trim()} className="btn-primary">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {sending ? 'Envoi...' : 'Répondre'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Sidebar>
    );
}
