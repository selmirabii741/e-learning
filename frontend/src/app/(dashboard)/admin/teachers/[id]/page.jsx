'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { ArrowLeft, GraduationCap, Loader2, BookOpen, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditTeacherPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', bio: '', speciality: '' });
    const [accountStatus, setAccountStatus] = useState({ isActive: false, emailVerified: false });

    useEffect(() => {
        Promise.all([adminAPI.getTeacher(id), adminAPI.getTeacherCourses(id)])
            .then(([{ data: td }, { data: cd }]) => {
                const t = td.teacher;
                setForm({ name: t.name, email: t.email, bio: t.bio || '', speciality: t.speciality || '' });
                setAccountStatus({ isActive: t.isActive, emailVerified: t.emailVerified });
                setCourses(cd.courses);
            })
            .catch(() => toast.error('Professeur introuvable'))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await adminAPI.updateTeacher(id, form);
            toast.success('Profil mis à jour !');
            router.push('/admin/teachers');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Sidebar>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
            </Sidebar>
        );
    }

    return (
        <Sidebar>
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link href="/admin/teachers" className="btn-ghost px-3 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="page-title flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-teal-400" /> Modifier le professeur
                        </h1>
                        <p className="page-subtitle">{form.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="card space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Nom complet</label>
                                <input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">Email</label>
                                <input required type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Spécialité</label>
                            <input className="input" placeholder="ex: Développement Web" value={form.speciality} onChange={(e) => set('speciality', e.target.value)} />
                        </div>
                        <div>
                            <label className="input-label">Biographie</label>
                            <textarea rows={4} className="input resize-none" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
                        </div>
                        {/* Read-only account status — activation is handled by email verification only */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                            <span className="text-xs font-semibold text-[#8FA098] uppercase tracking-wider">Statut du compte :</span>
                            {accountStatus.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">● Actif</span>
                            ) : accountStatus.emailVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">● En attente de mot de passe</span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-[#8FA098] border border-slate-500/20">● En attente de confirmation email</span>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="btn-primary">
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {saving ? 'Sauvegarde...' : 'Enregistrer'}
                            </button>
                            <Link href="/admin/teachers" className="btn-ghost">Annuler</Link>
                        </div>
                    </form>
                </div>

                <div>
                    <div className="card">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-teal-400" /> Cours ({courses.length})
                        </h3>
                        {courses.length === 0 ? (
                            <p className="text-sm text-[#8FA098]">Aucun cours créé</p>
                        ) : (
                            <div className="space-y-3">
                                {courses.map((c) => (
                                    <div key={c._id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                        <p className="text-sm font-medium text-white truncate">{c.title}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="badge-slate text-[10px]">{c.category}</span>
                                            <span className="text-xs text-[#8FA098] flex items-center gap-1">
                                                <Users className="w-3 h-3" /> {c.enrolledCount}
                                            </span>
                                            {c.isPublished && (
                                                <span className="text-xs text-indigo-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Publié
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
