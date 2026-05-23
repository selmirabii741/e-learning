'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Users, Search, MoreVertical, Shield, User, GraduationCap, Edit, Trash2, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { adminAPI } from '@/lib/api';
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

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        // Fetch both students and teachers to simulate a global user management view
        const fetchAllUsers = async () => {
            setLoading(true);
            try {
                const [resStudents, resTeachers] = await Promise.all([
                    adminAPI.getStudents({}),
                    adminAPI.getTeachers({})
                ]);
                
                const formattedStudents = (resStudents.data?.students || []).map(s => ({ ...s, role: 'student' }));
                const formattedTeachers = (resTeachers.data?.teachers || []).map(t => ({ ...t, role: 'teacher' }));
                
                let combined = [...formattedStudents, ...formattedTeachers];
                // Sort by creation date
                combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                setUsers(combined);
            } catch (err) {
                toast.error("Erreur lors du chargement des utilisateurs.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllUsers();
    }, []);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === 'all' ? true : u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        if (role === 'teacher') return <span className="px-3 py-1 bg-violet-100 text-white rounded-lg text-xs font-bold flex items-center gap-2"><GraduationCap size={14}/> Professeur</span>;
        if (role === 'student') return <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-lg text-xs font-bold flex items-center gap-2"><User size={14}/> Étudiant</span>;
        return <span className="px-3 py-1 bg-slate-100 text-[#B7C2B8] rounded-lg text-xs font-bold flex items-center gap-2"><Shield size={14}/> Admin</span>;
    };

    const getStatusBadge = (status) => {
        // Mock status based on arbitrary logic for presentation
        const isActive = status !== 'suspended'; 
        if (isActive) return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">Actif</span>;
        return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold">Suspendu</span>;
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
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${T.colors.primary}40` }}>
                                    <Users size={20} className="text-white" />
                                </div>
                                Gestion Utilisateurs
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                                Vue globale de tous les comptes de la plateforme.
                            </p>
                        </div>
                    </div>

                    {/* ── Search & Filters ── */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.text.muted }} />
                            <input
                                type="text"
                                placeholder="Rechercher un utilisateur..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ ...inputStyle, width: '100%', padding: '10px 14px 10px 40px', fontWeight: 500 }}
                                className="focus:border-indigo-500"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8, background: '#fff', padding: '4px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            {[
                                { id: 'all', label: 'Tous' },
                                { id: 'student', label: 'Étudiants' },
                                { id: 'teacher', label: 'Professeurs' }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterRole(f.id)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '10px',
                                        background: filterRole === f.id ? 'rgba(217, 244, 91, 0.1)' : 'transparent',
                                        color: filterRole === f.id ? T.colors.primary : T.text.secondary,
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                        border: 'none', transition: 'all 0.2s'
                                    }}
                                    className={filterRole !== f.id ? 'hover:bg-slate-50' : ''}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, overflow: 'hidden', boxShadow: T.card.shadow }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 100px',
                            padding: '16px 24px', background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                        }}>
                            {['Utilisateur', 'Rôle', 'Statut', 'Inscription', 'Action'].map((h, i) => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>
                            ))}
                        </div>

                        {loading ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <Loader2 size={32} className="animate-spin" style={{ color: T.colors.primary, margin: '0 auto 16px', display: 'block' }} />
                                <p style={{ fontSize: 14, color: T.text.muted, fontWeight: 500 }}>Chargement des utilisateurs…</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Users size={32} style={{ color: T.text.muted }} />
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 6 }}>Aucun utilisateur trouvé</p>
                            </div>
                        ) : (
                            <div>
                                {filteredUsers.map((u, index) => (
                                    <div
                                        key={u._id}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 100px',
                                            alignItems: 'center', padding: '16px 24px',
                                            borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid #E2E8F0',
                                            transition: 'background 0.2s', cursor: 'default'
                                        }}
                                        className="hover:bg-slate-50 group"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '12px', background: u.role === 'teacher' ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0
                                            }}>
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, display: 'block' }}>{u.name}</span>
                                                <span style={{ fontSize: 12, fontWeight: 500, color: T.text.muted }}>{u.email}</span>
                                            </div>
                                        </div>

                                        <div>{getRoleBadge(u.role)}</div>
                                        <div>{getStatusBadge(u.status)}</div>

                                        <div style={{ fontSize: 13, color: T.text.secondary, fontWeight: 500 }}>
                                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                            <button className="p-2 text-[#8FA098] hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors" title="Modifier">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-2 text-[#8FA098] hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Suspendre">
                                                <Ban size={16} />
                                            </button>
                                            <button className="p-2 text-[#8FA098] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                                <Trash2 size={16} />
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
