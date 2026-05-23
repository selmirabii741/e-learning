'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { forumAPI } from '@/lib/api';
import { Tag, Loader2, ArrowLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const COMMON_TAGS = ['javascript', 'react', 'css', 'python', 'node.js', 'html', 'sql', 'git', 'algorithm', 'bug'];

export default function NewForumPostPage() {
    const router = useRouter();
    const [form, setForm] = useState({ title: '', content: '', tags: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);

    const toggleTag = (tag) => {
        setSelectedTags((prev) => {
            const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 5);
            setForm(f => ({ ...f, tags: next.join(', ') }));
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            toast.error('Titre et description sont requis');
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await forumAPI.createPost(form);
            toast.success('Question publiée !');
            router.push(`/forum/${data.post._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur publication');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sidebar>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/forum"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(124,58,237,0.10)', color: 'var(--text-secondary)' }}>
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="page-title mb-0">Poser une question</h1>
                    <p className="page-subtitle">Soyez précis pour obtenir de bonnes réponses</p>
                </div>
            </div>

            <div className="max-w-3xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
                    <div className="card space-y-5">
                        <div>
                            <label className="input-label">Titre de la question <span className="text-red-400">*</span></label>
                            <input
                                className="input"
                                placeholder="Ex: Comment centrer un div en CSS ?"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                maxLength={200}
                            />
                            <p className="text-[11px] text-[#B7C2B8] mt-1">{form.title.length}/200</p>
                        </div>

                        <div>
                            <label className="input-label">Description détaillée <span className="text-red-400">*</span></label>
                            <textarea
                                rows={8}
                                className="input resize-none"
                                placeholder="Décrivez votre problème en détail. Incluez le code si nécessaire, les messages d'erreur, et ce que vous avez déjà essayé..."
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                maxLength={5000}
                            />
                            <p className="text-[11px] text-[#B7C2B8] mt-1">{form.content.length}/5000</p>
                        </div>

                        <div>
                            <label className="input-label">Tags (max 5)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {COMMON_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${selectedTags.includes(tag)
                                                ? 'bg-teal-600 border-teal-600 text-white'
                                                : 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20'
                                            }`}
                                    >
                                        <Tag className="w-3 h-3" />{tag}
                                    </button>
                                ))}
                            </div>
                            <input
                                className="input text-sm"
                                placeholder="Ou tapez vos tags séparés par des virgules..."
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={submitting} className="btn-primary">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {submitting ? 'Publication...' : 'Publier la question'}
                        </button>
                        <Link href="/forum" className="btn-ghost">Annuler</Link>
                    </div>
                </form>

                <div className="space-y-4">
                    <div className="card">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <h3 className="text-sm font-semibold text-white">Conseils</h3>
                        </div>
                        <ul className="space-y-2 text-xs text-[#8FA098]">
                            <li>✅ Utilisez un titre clair et précis</li>
                            <li>✅ Incluez votre code avec des exemples</li>
                            <li>✅ Mentionnez les erreurs exactes</li>
                            <li>✅ Expliquez ce que vous avez essayé</li>
                            <li>✅ Choisissez les bons tags</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
