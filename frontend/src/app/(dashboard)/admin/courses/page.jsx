'use client';
import { useEffect, useState, useMemo } from 'react';
import { adminAPI, coursesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    Search, BookOpen, Users, ChevronDown,
    Loader2, Eye, Trash2, AlertTriangle, Plus, Filter
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

/* ── Badge helpers ─────────────────────────────────────────────────────── */
const BADGE_PALETTE = [
    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' }, // Blue
    { bg: 'rgba(154, 217, 75,0.1)', color: '#6366F1', border: 'rgba(154, 217, 75,0.2)' }, // Purple
    { bg: 'rgba(236,72,153,0.1)', color: '#ec4899', border: 'rgba(236,72,153,0.2)' }, // Pink
    { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.2)' }, // Orange
    { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: 'rgba(14,165,233,0.2)' }, // Sky
    { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' }, // Red
    { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'rgba(6,182,212,0.2)' }, // Cyan
    { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.2)' }, // Yellow
];

function getCategoryBadge(category) {
    if (!category) return { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', border: 'var(--border)' };
    const hash = category.toLowerCase().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return BADGE_PALETTE[hash % BADGE_PALETTE.length];
}

const LVL_COLORS = {
    'débutant': { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: 'rgba(168,85,247,0.2)' }, // Purple
    'intermédiaire': { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' }, // Blue
    'avancé': { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: 'rgba(244,63,94,0.2)' }, // Rose
};

function Badge({ label, bg, color, border }) {
    return (
        <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: '8px',
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            background: bg, color, border: `1px solid ${border}`,
        }}>{label}</span>
    );
}

/* ── Delete Confirm Modal ───────────────────────────────────────────────── */
function DeleteModal({ course, onConfirm, onCancel, loading }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
        }}>
            <div style={{
                background: '#fff', border: T.card.border, borderRadius: '24px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.1)', padding: 32, maxWidth: 420, width: '100%',
                animation: 'jumpIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '16px', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <AlertTriangle style={{ width: 24, height: 24, color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em' }}>Supprimer le cours ?</h3>
                        <p style={{ fontSize: 13, color: T.text.muted, marginTop: 2 }}>Cette action est irréversible</p>
                    </div>
                </div>
                <div style={{ fontSize: 14, color: T.text.secondary, marginBottom: 24, padding: '16px', background: 'rgba(239,68,68,0.04)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <strong style={{ color: '#ef4444' }}>{course?.title}</strong> sera définitivement supprimé avec toutes ses leçons et progressions.
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        padding: '10px 20px', borderRadius: '12px', fontSize: 14, fontWeight: 600,
                        background: '#f1f5f9', color: T.text.secondary, cursor: 'pointer', transition: 'background 0.2s'
                    }} className="hover:bg-slate-200">Annuler</button>
                    <button onClick={onConfirm} disabled={loading} style={{
                        padding: '10px 20px', borderRadius: '12px', fontSize: 14, fontWeight: 600,
                        background: '#ef4444', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                    }} className="hover:bg-red-600 transition-colors">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Confirmer la suppression
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes jumpIn {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

/* ── Course Row ─────────────────────────────────────────────────────────── */
function CourseRow({ course, index, onToggle, onDelete, togglingId, deletingId }) {
    const [hover, setHover] = useState(false);
    const cat = course.category;
    const lvl = course.level?.toLowerCase();
    const cBdg = getCategoryBadge(cat);
    const lBdg = LVL_COLORS[lvl] || { bg: 'rgba(148, 163, 184, 0.1)', color: '#64748b', border: 'rgba(148, 163, 184, 0.2)' };
    const students = course.enrolledStudents?.length ?? 0;
    const date = course.createdAt
        ? new Date(course.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 150px 130px 100px 120px 110px 80px',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid #E2E8F0',
                background: hover ? '#f8fafc' : '#ffffff',
                transition: 'background 0.2s',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* COURS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '10px', background: T.colors.primary + '15',
                    color: T.colors.primary, display: 'flex', alignItems: 'center', justifyItems: 'center', flexShrink: 0
                }}>
                    <BookOpen size={18} className="mx-auto" />
                </div>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
                        {course.title}
                    </p>
                    <p style={{ fontSize: 12, color: T.text.muted, marginTop: 2 }}>
                        {course.instructor?.name || course.instructor?.firstName || '—'}
                    </p>
                </div>
            </div>

            {/* CATÉGORIE */}
            <div><Badge label={course.category || '—'} {...cBdg} /></div>

            {/* NIVEAU */}
            <div>
                {course.level
                    ? <Badge label={course.level.charAt(0).toUpperCase() + course.level.slice(1)} {...lBdg} />
                    : <span style={{ color: T.text.muted, fontSize: 13 }}>—</span>
                }
            </div>

            {/* ÉTUDIANTS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: T.text.secondary }}>
                <Users size={14} style={{ color: T.text.muted }} /> {students}
            </div>

            {/* STATUT */}
            <div>
                {course.isPublished
                    ? <Badge label="● Publié" bg="rgba(16,185,129,0.1)" color="#10B981" border="rgba(16,185,129,0.2)" />
                    : <Badge label="● Brouillon" bg="rgba(245,158,11,0.1)" color="#F59E0B" border="rgba(245,158,11,0.2)" />
                }
            </div>

            {/* CRÉÉ LE */}
            <div style={{ fontSize: 13, color: T.text.secondary, fontWeight: 500 }}>{date}</div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <button
                    onClick={() => onDelete(course)}
                    style={{
                        padding: '8px', borderRadius: '8px', background: 'transparent',
                        color: T.colors.danger, border: 'none', cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    className="hover:bg-red-50"
                    title="Supprimer le cours"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AdminCoursesPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterLvl, setFilterLvl] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [togglingId, setTogglingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (user && user.role !== 'admin') router.replace('/dashboard');
    }, [user, router]);

    const load = () => {
        setLoading(true);
        adminAPI.getAdminCourses()
            .then(({ data }) => setCourses(Array.isArray(data) ? data : (data.courses || [])))
            .catch(() => toast.error('Erreur chargement des cours'))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const categories = useMemo(() => [...new Set(courses.map(c => c.category).filter(Boolean))], [courses]);
    const levels = useMemo(() => [...new Set(courses.map(c => c.level).filter(Boolean))], [courses]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return courses.filter(c => {
            if (q && !c.title?.toLowerCase().includes(q) && !c.instructor?.name?.toLowerCase().includes(q)) return false;
            if (filterCat && c.category !== filterCat) return false;
            if (filterLvl && c.level !== filterLvl) return false;
            if (filterStatus === 'published' && !c.isPublished) return false;
            if (filterStatus === 'draft' && c.isPublished) return false;
            return true;
        });
    }, [courses, search, filterCat, filterLvl, filterStatus]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget._id);
        try {
            await coursesAPI.delete(deleteTarget._id);
            setCourses(prev => prev.filter(c => c._id !== deleteTarget._id));
            toast.success('Cours supprimé');
            setDeleteTarget(null);
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally { setDeletingId(null); }
    };

    const published = courses.filter(c => c.isPublished).length;
    const drafts = courses.length - published;

    const inputStyle = {
        background: '#fff', border: '1px solid #E2E8F0',
        color: T.text.primary, borderRadius: '12px', fontSize: 13, outline: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'border-color 0.2s',
    };
    const selStyle = {
        ...inputStyle, padding: '10px 36px 10px 14px', cursor: 'pointer',
        appearance: 'none', color: T.text.secondary, fontWeight: 500,
    };

    return (
        <Sidebar>
            <div className="min-h-full" style={{
                background: 'var(--bg-body)',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 244, 91, 0.05) 0%, transparent 60%)',
                margin: '-20px', padding: '32px', // Extend to cover padding from layout
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* ── Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(217, 244, 91, 0.3)' }}>
                                    <BookOpen size={20} className="text-white" />
                                </div>
                                Gestion des cours
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                                {loading ? 'Chargement...' : `${courses.length} cours au total — ${published} publiés, ${drafts} brouillons`}
                            </p>
                        </div>
                    </div>


                    {/* ── Filters ── */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                            <input type="text" placeholder="Rechercher un cours, un instructeur…" value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ ...inputStyle, width: '100%', padding: '10px 14px 10px 40px', fontWeight: 500 }}
                                className="focus:border-indigo-500"
                            />
                        </div>
                        {[
                            { val: filterCat, set: setFilterCat, placeholder: 'Toutes catégories', items: categories },
                            { val: filterLvl, set: setFilterLvl, placeholder: 'Tous niveaux', items: levels },
                        ].map(({ val, set, placeholder, items }, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                                <select value={val} onChange={e => set(e.target.value)} style={{ ...selStyle, minWidth: 170 }} className="focus:border-indigo-500">
                                    <option value="">{placeholder}</option>
                                    {items.map(it => <option key={it} value={it}>{it}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                            </div>
                        ))}
                        <div style={{ position: 'relative' }}>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...selStyle, minWidth: 150 }} className="focus:border-indigo-500">
                                <option value="">Tous statuts</option>
                                <option value="published">Publié</option>
                                <option value="draft">Brouillon</option>
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                        </div>
                        {(search || filterCat || filterLvl || filterStatus) && (
                            <button onClick={() => { setSearch(''); setFilterCat(''); setFilterLvl(''); setFilterStatus(''); }}
                                style={{
                                    padding: '10px 16px', borderRadius: '12px', fontSize: 13, fontWeight: 600,
                                    background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', transition: 'all 0.2s'
                                }} className="hover:bg-red-50">
                                Réinitialiser
                            </button>
                        )}
                    </div>

                    {/* ── Table ── */}
                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, overflow: 'hidden', boxShadow: T.card.shadow }}>

                        {/* Header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '2.5fr 150px 130px 100px 120px 110px 80px',
                            padding: '16px 24px', background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                        }}>
                            {['COURS', 'CATÉGORIE', 'NIVEAU', 'ÉTUDIANTS', 'STATUT', 'CRÉÉ LE', 'ACTIONS'].map(h => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</span>
                            ))}
                        </div>

                        {/* Body */}
                        {loading ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <Loader2 size={32} className="animate-spin" style={{ color: T.colors.primary, margin: '0 auto 16px', display: 'block' }} />
                                <p style={{ fontSize: 14, color: T.text.muted, fontWeight: 500 }}>Chargement des cours…</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <BookOpen size={32} style={{ color: T.text.muted }} />
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 6 }}>Aucun cours trouvé</p>
                                <p style={{ fontSize: 14, color: T.text.muted }}>Modifiez vos filtres de recherche.</p>
                            </div>
                        ) : (
                            filtered.map((course, i) => (
                                <CourseRow key={course._id} course={course} index={i}
                                    onDelete={setDeleteTarget}
                                    togglingId={togglingId} deletingId={deletingId}
                                />
                            ))
                        )}
                    </div>

                    {/* Result count */}
                    {!loading && filtered.length > 0 && (
                        <p style={{ fontSize: 13, color: T.text.muted, marginTop: 16, textAlign: 'right', fontWeight: 500 }}>
                            {filtered.length} cours affichés sur {courses.length}
                        </p>
                    )}
                </div>

                {/* ── Delete Modal ── */}
                {deleteTarget && (
                    <DeleteModal
                        course={deleteTarget}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteTarget(null)}
                        loading={deletingId === deleteTarget._id}
                    />
                )}
            </div>
        </Sidebar>
    );
}
