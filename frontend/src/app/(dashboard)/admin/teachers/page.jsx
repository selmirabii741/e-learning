'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Plus, Search, Trash2, Pencil, BookOpen, Users, CheckCircle, XCircle, GraduationCap, MailCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
    colors: {
        primary: '#4F46E5',
        secondary: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
    },
    card: {
        bg: '#ffffff',
        border: '1px solid #E2E8F0',
        radius: '20px',
        shadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
    },
    text: {
        primary: '#1e293b',
        secondary: '#475569',
        muted: '#94a3b8',
    },
};

export default function TeachersPage() {
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(null);

    const fetchTeachers = async () => {
        try {
            const { data } = await adminAPI.getTeachers({ search: search || undefined });
            setTeachers(data.teachers);
        } catch {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeachers(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        fetchTeachers();
    };

    const handleDeactivate = async (id, name) => {
        if (!confirm(`Désactiver le compte de ${name} ?`)) return;
        try {
            await adminAPI.deleteTeacher(id);
            toast.success('Instructeur désactivé');
            setTeachers((prev) => prev.map((t) => (t._id === id ? { ...t, isActive: false } : t)));
        } catch {
            toast.error('Erreur lors de la désactivation');
        }
    };

    const handleResend = async (id, email) => {
        if (!confirm(`Renvoyer l'email de confirmation à ${email} ?`)) return;
        setResending(id);
        try {
            await adminAPI.resendVerification(id);
            toast.success(`Email renvoyé à ${email}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du renvoi');
        } finally {
            setResending(null);
        }
    };

    const inputStyle = {
        background: '#fff', border: '1px solid #E2E8F0',
        color: T.text.primary, borderRadius: '12px', fontSize: 13, outline: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'border-color 0.2s',
    };

    return (
        <Sidebar>
            <div className="min-h-full" style={{
                background: 'var(--bg-body)',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 244, 91, 0.05) 0%, transparent 60%)',
                margin: '-20px', padding: '32px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* ── Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: T.colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}>
                                    <GraduationCap size={20} className="text-white" />
                                </div>
                                Professeurs
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                                {loading ? 'Chargement...' : `${teachers.length} instructeur(s) enregistré(s)`}
                            </p>
                        </div>
                        <Link href="/admin/teachers/new" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                            borderRadius: '12px', fontSize: 14, fontWeight: 600,
                            background: T.colors.primary, color: '#fff',
                            textDecoration: 'none', boxShadow: `0 4px 14px ${T.colors.primary}40`,
                            transition: 'all 0.2s'
                        }} className="hover:bg-[#4F46E5] text-[#03150D]">
                            <Plus size={16} /> Ajouter un professeur
                        </Link>
                    </div>

                    {/* ── Search & Filters ── */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email, spécialité..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ ...inputStyle, width: '100%', padding: '10px 14px 10px 40px', fontWeight: 500 }}
                                className="focus:border-indigo-500"
                            />
                        </div>
                        <button type="submit" style={{
                            padding: '10px 20px', borderRadius: '12px', fontSize: 13, fontWeight: 600,
                            background: '#f8fafc', color: T.text.secondary, border: '1px solid #E2E8F0',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }} className="hover:bg-slate-50">
                            Rechercher
                        </button>
                    </form>

                    {/* ── Table ── */}
                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, overflow: 'hidden', boxShadow: T.card.shadow }}>
                        
                        <div style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 100px 120px 180px',
                            padding: '16px 24px', background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                        }}>
                            {['PROFESSEUR', 'SPÉCIALITÉ', 'COURS', 'ÉTUDIANTS', 'STATUT', 'ACTIONS'].map((h, i) => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i >= 2 && i < 5 ? 'center' : i === 5 ? 'right' : 'left' }}>{h}</span>
                            ))}
                        </div>

                        {loading ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <Loader2 size={32} className="animate-spin" style={{ color: T.colors.primary, margin: '0 auto 16px', display: 'block' }} />
                                <p style={{ fontSize: 14, color: T.text.muted, fontWeight: 500 }}>Chargement des professeurs…</p>
                            </div>
                        ) : teachers.length === 0 ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Users size={32} style={{ color: T.text.muted }} />
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 6 }}>Aucun professeur trouvé</p>
                            </div>
                        ) : (
                            <div>
                                {teachers.map((t, index) => (
                                    <div
                                        key={t._id}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 100px 120px 180px',
                                            alignItems: 'center', padding: '16px 24px',
                                            borderBottom: index === teachers.length - 1 ? 'none' : '1px solid #E2E8F0',
                                            transition: 'background 0.2s', cursor: 'default'
                                        }}
                                        className="hover:bg-slate-50"
                                    >
                                        {/* Name + Email */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #10B981, #059669)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0
                                            }}>
                                                {t.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                                                <p style={{ fontSize: 12, color: T.text.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.email}</p>
                                            </div>
                                        </div>

                                        {/* Speciality */}
                                        <div>
                                            {t.speciality ? (
                                                <span style={{
                                                    display: 'inline-block', padding: '4px 10px', borderRadius: '8px',
                                                    background: 'rgba(217, 244, 91, 0.1)', color: T.colors.primary,
                                                    fontSize: 12, fontWeight: 600, border: `1px solid rgba(217, 244, 91, 0.2)`
                                                }}>
                                                    {t.speciality}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: 12, color: T.text.muted }}>—</span>
                                            )}
                                        </div>

                                        {/* Courses */}
                                        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: T.text.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <BookOpen size={14} style={{ color: T.text.muted }} />
                                            {t.courseCount ?? 0}
                                        </div>

                                        {/* Students */}
                                        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: T.text.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <Users size={14} style={{ color: T.text.muted }} />
                                            {t.totalStudents ?? 0}
                                        </div>

                                        {/* Status */}
                                        <div style={{ textAlign: 'center' }}>
                                            {t.isActive ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 12, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>
                                                    <CheckCircle size={12} /> Actif
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <XCircle size={12} /> Inactif
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                            {!t.isActive && (
                                                <button
                                                    onClick={() => handleResend(t._id, t.email)}
                                                    disabled={resending === t._id}
                                                    title="Renvoyer l'email de confirmation"
                                                    style={{ padding: '6px 10px', borderRadius: '8px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #f59e0b', color: '#f59e0b', cursor: 'pointer' }}
                                                    className="hover:bg-amber-50"
                                                >
                                                    {resending === t._id ? <Loader2 size={14} className="animate-spin" /> : <MailCheck size={14} />} Renvoyer
                                                </button>
                                            )}
                                            <Link href={`/admin/teachers/${t._id}`} style={{ padding: '6px 10px', borderRadius: '8px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #E2E8F0', color: T.text.secondary, cursor: 'pointer' }} className="hover:bg-slate-100">
                                                <Pencil size={14} />
                                            </Link>
                                            {t.isActive && (
                                                <button
                                                    onClick={() => handleDeactivate(t._id, t.name)}
                                                    style={{ padding: '6px 10px', borderRadius: '8px', background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                                    className="hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
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
