'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { coursesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    Plus, BookOpen, Users, Edit3, Trash2, Search,
    Loader2, ChevronDown, AlertTriangle, Copy, KeyRound, X
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const T = {
    card: { bg: 'var(--bg-card)', border: '1px solid var(--border)', radius: '14px', shadow: 'var(--card-shadow)' },
    text: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', muted: 'var(--text-muted)', accent: 'var(--accent)' },
};

const LVL_COLORS = {
    'débutant': { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    'intermédiaire': { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    'avancé': { bg: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
};

const BADGE_PALETTE = [
    { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    { bg: 'rgba(154, 217, 75,0.12)', color: '#6366F1', border: 'rgba(154, 217, 75,0.3)' },
    { bg: 'rgba(236,72,153,0.12)', color: '#ec4899', border: 'rgba(236,72,153,0.3)' },
    { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
    { bg: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: 'rgba(14,165,233,0.3)' },
    { bg: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
];

function getCategoryBadge(category) {
    if (!category) return { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', border: 'var(--border)' };
    const hash = category.toLowerCase().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return BADGE_PALETTE[hash % BADGE_PALETTE.length];
}

function Badge({ label, bg, color, border }) {
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            background: bg, color, border: `1px solid ${border}`,
        }}>{label}</span>
    );
}

function DeleteModal({ course, onConfirm, onCancel, loading }) {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: T.card.bg, border: T.card.border, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: 28, maxWidth: 400, width: '90%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text.primary }}>Supprimer le cours ?</h3>
                        <p style={{ fontSize: 12, color: T.text.muted, marginTop: 2 }}>Cette action est irréversible</p>
                    </div>
                </div>
                <p style={{ fontSize: 13, color: T.text.secondary, marginBottom: 20, padding: '12px 14px', background: 'rgba(239,68,68,0.05)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.1)' }}>
                    <strong style={{ color: T.text.primary }}>{course?.title}</strong> sera définitivement supprimé avec toutes ses leçons et progressions.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: T.card.bg, border: T.card.border, color: T.text.secondary, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

function CourseRow({ course, onDelete }) {
    const [hover, setHover] = useState(false);
    const cat = course.category;
    const lvl = course.level?.toLowerCase();
    const cBdg = getCategoryBadge(cat);
    const lBdg = LVL_COLORS[lvl] || { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af', border: 'rgba(156,163,175,0.2)' };
    const students = course.enrolledStudents?.length ?? 0;
    const lessons = course.lessons?.length ?? 0;
    const date = course.createdAt ? new Date(course.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div
            style={{
                display: 'grid', gridTemplateColumns: '2.2fr 130px 120px 80px 80px 100px 120px',
                alignItems: 'center', padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                transition: 'background 0.12s',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Title */}
            <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</p>
                {course.enrollmentCode && (
                    <button onClick={() => { navigator.clipboard.writeText(course.enrollmentCode); toast.success('Code copié !'); }}
                        title={`Code: ${course.enrollmentCode}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', fontFamily: "'SF Mono','Fira Code',monospace", background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer' }}>
                        <KeyRound style={{ width: 9, height: 9 }} /> {course.enrollmentCode} <Copy style={{ width: 8, height: 8, opacity: 0.6 }} />
                    </button>
                )}
            </div>

            {/* Category */}
            <div><Badge label={cat || '—'} {...cBdg} /></div>

            {/* Level */}
            <div>{course.level ? <Badge label={course.level.charAt(0).toUpperCase() + course.level.slice(1)} {...lBdg} /> : <span style={{ color: T.text.muted, fontSize: 12 }}>—</span>}</div>

            {/* Students */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.text.secondary }}>
                <Users size={13} style={{ color: T.text.muted }} />{students}
            </div>

            {/* Lessons */}
            <div style={{ fontSize: 13, color: T.text.secondary }}>{lessons} leçons</div>

            {/* Status */}
            <div>
                {course.isPublished
                    ? <Badge label="● Publié" bg="rgba(34,197,94,0.1)" color="#22c55e" border="rgba(34,197,94,0.25)" />
                    : <Badge label="● Brouillon" bg="rgba(251,191,36,0.1)" color="#fbbf24" border="rgba(251,191,36,0.25)" />}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Link href={`/instructor/courses/${course._id}/edit`}
                    style={{ padding: '6px 10px', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: 7, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: T.text.secondary, textDecoration: 'none', transition: 'all 0.15s' }}>
                    <Edit3 style={{ width: 13, height: 13 }} /> Modifier
                </Link>
                <button onClick={() => onDelete(course)}
                    style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#f87171', transition: 'all 0.15s' }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                </button>
            </div>
        </div>
    );
}

export default function InstructorCoursesPage() {
    const { user } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterLvl, setFilterLvl] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(() => {
        if (!user) return;
        setLoading(true);
        coursesAPI.getMyCourses()
            .then(({ data }) => setCourses(data.courses || []))
            .catch(() => toast.error('Erreur chargement des cours'))
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const categories = useMemo(() => [...new Set(courses.map(c => c.category).filter(Boolean))], [courses]);
    const levels = useMemo(() => [...new Set(courses.map(c => c.level).filter(Boolean))], [courses]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return courses.filter(c => {
            if (q && !c.title?.toLowerCase().includes(q)) return false;
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
        } catch { toast.error('Erreur suppression'); }
        finally { setDeletingId(null); }
    };

    const published = courses.filter(c => c.isPublished).length;
    const drafts = courses.length - published;
    const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length ?? 0), 0);

    const inputStyle = { background: T.card.bg, border: '1px solid var(--border)', color: T.text.primary, borderRadius: 8, fontSize: 13, outline: 'none' };
    const selStyle = { ...inputStyle, padding: '8px 30px 8px 12px', cursor: 'pointer', appearance: 'none', color: T.text.secondary };

    return (
        <Sidebar>
            <div style={{ maxWidth: 1150, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text.primary, letterSpacing: '-0.02em' }}>Mes cours</h1>
                        <p style={{ fontSize: 13, color: T.text.muted, marginTop: 3 }}>
                            {loading ? '…' : `${courses.length} cours — ${published} publiés, ${drafts} brouillons — ${totalStudents} étudiants`}
                        </p>
                    </div>
                    <Link href="/instructor/courses/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                        borderRadius: 9, fontSize: 13, fontWeight: 600,
                        background: 'var(--btn-primary-bg)', color: '#fff',
                        textDecoration: 'none', boxShadow: '0 4px 12px rgba(34,197,94,0.25)',
                    }}>
                        <Plus style={{ width: 15, height: 15 }} /> Nouveau cours
                    </Link>
                </div>

                {/* Stat cards */}
                {!loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: 'Total cours', value: courses.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                            { label: 'Publiés', value: published, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                            { label: 'Étudiants inscrits', value: totalStudents, color: '#6366F1', bg: 'rgba(154, 217, 75,0.1)' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '16px 18px', boxShadow: T.card.shadow }}>
                                <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
                                <p style={{ fontSize: 12, color: T.text.muted, marginTop: 2 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                        <input type="text" placeholder="Rechercher un cours…" value={search} onChange={e => setSearch(e.target.value)}
                            style={{ ...inputStyle, width: '100%', padding: '8px 12px 8px 33px' }} />
                    </div>
                    {[
                        { val: filterCat, set: setFilterCat, placeholder: 'Toutes catégories', items: categories },
                        { val: filterLvl, set: setFilterLvl, placeholder: 'Tous niveaux', items: levels },
                    ].map(({ val, set, placeholder, items }, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <select value={val} onChange={e => set(e.target.value)} style={{ ...selStyle, minWidth: 155 }}>
                                <option value="">{placeholder}</option>
                                {items.map(it => <option key={it} value={it}>{it}</option>)}
                            </select>
                            <ChevronDown size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                        </div>
                    ))}
                    <div style={{ position: 'relative' }}>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...selStyle, minWidth: 140 }}>
                            <option value="">Tous statuts</option>
                            <option value="published">Publié</option>
                            <option value="draft">Brouillon</option>
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: T.text.muted, pointerEvents: 'none' }} />
                    </div>
                    {(search || filterCat || filterLvl || filterStatus) && (
                        <button onClick={() => { setSearch(''); setFilterCat(''); setFilterLvl(''); setFilterStatus(''); }}
                            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                            Réinitialiser
                        </button>
                    )}
                </div>

                {/* Table */}
                <div style={{ background: T.card.bg, border: '1px solid var(--border-strong)', borderRadius: T.card.radius, overflow: 'hidden', boxShadow: T.card.shadow }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '2.2fr 130px 120px 80px 80px 100px 120px',
                        padding: '10px 20px', background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-strong)',
                    }}>
                        {['COURS', 'CATÉGORIE', 'NIVEAU', 'ÉTUDIANTS', 'LEÇONS', 'STATUT', 'ACTIONS'].map(h => (
                            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.text.muted, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ fontSize: 13, color: T.text.muted }}>Chargement des cours…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <BookOpen size={36} style={{ color: T.text.muted, margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, marginBottom: 4 }}>
                                {courses.length === 0 ? 'Aucun cours créé' : 'Aucun cours trouvé'}
                            </p>
                            <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 16 }}>
                                {courses.length === 0 ? 'Créez votre premier cours pour commencer' : 'Modifiez vos filtres'}
                            </p>
                            {courses.length === 0 && (
                                <Link href="/instructor/courses/new" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                                    borderRadius: 9, fontSize: 13, fontWeight: 600,
                                    background: 'var(--btn-primary-bg)', color: '#fff', textDecoration: 'none',
                                }}>
                                    <Plus style={{ width: 15, height: 15 }} /> Créer un cours
                                </Link>
                            )}
                        </div>
                    ) : (
                        filtered.map(course => (
                            <CourseRow key={course._id} course={course} onDelete={setDeleteTarget} />
                        ))
                    )}
                </div>

                {!loading && filtered.length > 0 && (
                    <p style={{ fontSize: 12, color: T.text.muted, marginTop: 12, textAlign: 'right' }}>
                        {filtered.length} cours affichés sur {courses.length}
                    </p>
                )}
            </div>

            {deleteTarget && (
                <DeleteModal course={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deletingId === deleteTarget._id} />
            )}
        </Sidebar>
    );
}
