'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { Users, Mail, Calendar, Search, Trash2, Loader2, User } from 'lucide-react';
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

export default function AdminStudentsPage() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const fetchStudents = async () => {
        try {
            const { data } = await adminAPI.getStudents({ search: search || undefined });
            setStudents(data.students);
        } catch { toast.error('Erreur chargement'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleDelete = async (student) => {
        if (!confirm(`Supprimer définitivement "${student.name}" (${student.email}) ? Cette action est irréversible.`)) return;
        setDeletingId(student._id);
        try {
            await adminAPI.deleteStudent(student._id);
            toast.success(`Étudiant "${student.name}" supprimé`);
            setStudents((prev) => prev.filter((s) => s._id !== student._id));
        } catch { toast.error('Erreur lors de la suppression'); }
        finally { setDeletingId(null); }
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
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)' }}>
                                    <Users size={20} className="text-white" />
                                </div>
                                Étudiants
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                                {loading ? 'Chargement...' : `${students.length} étudiant(s) inscrit(s)`}
                            </p>
                        </div>
                    </div>

                    {/* ── Search ── */}
                    <form onSubmit={(e) => { e.preventDefault(); setLoading(true); fetchStudents(); }} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email..."
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
                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 100px',
                            padding: '16px 24px', background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                        }}>
                            {['ÉTUDIANT', 'EMAIL', 'INSCRIPTION', 'ACTION'].map((h, i) => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i === 3 ? 'right' : 'left' }}>{h}</span>
                            ))}
                        </div>

                        {loading ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <Loader2 size={32} className="animate-spin" style={{ color: T.colors.primary, margin: '0 auto 16px', display: 'block' }} />
                                <p style={{ fontSize: 14, color: T.text.muted, fontWeight: 500 }}>Chargement des étudiants…</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <User size={32} style={{ color: T.text.muted }} />
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 6 }}>Aucun étudiant trouvé</p>
                            </div>
                        ) : (
                            <div>
                                {students.map((s, index) => (
                                    <div
                                        key={s._id}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 100px',
                                            alignItems: 'center', padding: '16px 24px',
                                            borderBottom: index === students.length - 1 ? 'none' : '1px solid #E2E8F0',
                                            transition: 'background 0.2s', cursor: 'default'
                                        }}
                                        className="hover:bg-slate-50"
                                    >
                                        {/* Name */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0
                                            }}>
                                                {s.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.name}
                                            </span>
                                        </div>

                                        {/* Email */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <Mail size={14} style={{ color: T.text.muted, flexShrink: 0 }} />
                                            {s.email}
                                        </div>

                                        {/* Date */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.text.secondary }}>
                                            <Calendar size={14} style={{ color: T.text.muted }} />
                                            {new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>

                                        {/* Action */}
                                        <div style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(s)}
                                                disabled={deletingId === s._id}
                                                style={{
                                                    padding: '8px', borderRadius: '8px', background: 'transparent',
                                                    color: T.colors.danger, border: 'none', cursor: deletingId === s._id ? 'wait' : 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                className="hover:bg-red-50"
                                                title="Supprimer l'étudiant"
                                            >
                                                {deletingId === s._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
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
