'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { ArrowLeft, GraduationCap, Loader2, User, Mail, BookText, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewTeacherPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', speciality: '', bio: '',
    });

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Send firstName + lastName separately so the backend can pass them
            // directly to Keycloak — preventing the "Verify Profile" form on login.
            await adminAPI.createTeacher(form);
            toast.success(`Email de confirmation envoyé à ${form.email}`);
            router.push('/admin/teachers');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sidebar>
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link href="/admin/teachers" className="btn-ghost px-3 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="page-title flex items-center gap-2">
                            <GraduationCap className="w-6 h-6 text-teal-400" /> Nouveau professeur
                        </h1>
                        <p className="page-subtitle">Créer un compte instructeur</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="card space-y-6">

                    {/* ── Prénom + Nom côte à côte ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="input-label flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-teal-400" /> Prénom *
                            </label>
                            <input
                                required
                                className="input"
                                placeholder="ex : Aymen"
                                value={form.firstName}
                                onChange={(e) => set('firstName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="input-label flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-teal-400" /> Nom de famille *
                            </label>
                            <input
                                required
                                className="input"
                                placeholder="ex : Ben Salah"
                                value={form.lastName}
                                onChange={(e) => set('lastName', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Email ── */}
                    <div>
                        <label className="input-label flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-teal-400" /> Adresse email *
                        </label>
                        <input
                            required
                            type="email"
                            className="input"
                            placeholder="professeur@ecole.tn"
                            value={form.email}
                            onChange={(e) => set('email', e.target.value)}
                        />
                        <p className="text-xs text-[#8FA098] mt-1.5">
                            Un lien de confirmation sera envoyé à cette adresse. Le professeur définira son propre mot de passe.
                        </p>
                    </div>

                    {/* ── Spécialité ── */}
                    <div>
                        <label className="input-label flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-teal-400" /> Spécialité
                        </label>
                        <input
                            className="input"
                            placeholder="ex : Mathématiques, Développement Web, IA..."
                            value={form.speciality}
                            onChange={(e) => set('speciality', e.target.value)}
                        />
                    </div>

                    {/* ── Biographie ── */}
                    <div>
                        <label className="input-label flex items-center gap-2">
                            <BookText className="w-3.5 h-3.5 text-teal-400" /> Biographie
                        </label>
                        <textarea
                            rows={4}
                            className="input resize-none"
                            placeholder="Présentation courte du professeur..."
                            value={form.bio}
                            onChange={(e) => set('bio', e.target.value)}
                        />
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex items-center gap-3 pt-2">
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Envoi en cours…' : 'Créer & envoyer l\'invitation'}
                        </button>
                        <Link href="/admin/teachers" className="btn-ghost">Annuler</Link>
                    </div>
                </form>
            </div>
        </Sidebar>
    );
}
