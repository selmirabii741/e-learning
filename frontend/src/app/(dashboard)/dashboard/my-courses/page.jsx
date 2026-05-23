'use client';
import { useEffect, useState, useMemo } from 'react';
import { progressAPI, studentAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    BookOpen, CheckCircle, TrendingUp, Trophy,
    ArrowRight, Search, Play, List, LayoutGrid, Target, MoreVertical,
    Code, Database, Palette
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CARD_THEMES = [
    { gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)', accent: '#4f46e5' },
    { gradient: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', accent: '#059669' },
    { gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)', accent: '#d97706' },
    { gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)', accent: '#dc2626' },
    { gradient: 'linear-gradient(135deg, #7c3aed 0%, #6366F1 50%, #a78bfa 100%)', accent: '#7c3aed' },
    { gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #22d3ee 100%)', accent: '#0891b2' },
];
const CARD_ICONS = [Code, Database, Palette, BookOpen, Code, Database];

function StatCard({ icon: Icon, label, value, linkText, linkHref, iconBg, iconColor }) {
    return (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef2f6', padding: '20px 22px', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', gap: 12 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color: iconColor }} />
                </div>
                <div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value ?? '—'}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', marginTop: 4 }}>{label}</p>
                </div>
            </div>
            {linkText && <Link href={linkHref || '#'} style={{ fontSize: 12, fontWeight: 600, color: iconColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>{linkText} <ArrowRight size={12} /></Link>}
        </div>
    );
}

function CourseCard({ progress, index }) {
    const course = progress.course;
    if (!course) return null;
    const theme = CARD_THEMES[index % CARD_THEMES.length];
    const CardIcon = CARD_ICONS[index % CARD_ICONS.length];
    const pct = progress.completionPercentage || 0;
    const done = progress.completedLessons?.length || 0;
    const total = course.lessons?.length || 0;
    const statusLabel = pct === 100 ? 'Terminé' : pct === 0 ? 'En pause' : 'En cours';
    const statusBg = pct === 100 ? '#dcfce7' : pct === 0 ? '#fef3c7' : '#dcfce7';
    const statusColor = pct === 100 ? '#16a34a' : pct === 0 ? '#d97706' : '#16a34a';
    const nextLesson = course.lessons?.[done]?.title || '';

    return (
        <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #eef2f6', transition: 'all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)', display: 'flex', flexDirection: 'column' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            {/* Gradient header */}
            <div style={{ background: theme.gradient, padding: '20px 20px 24px', position: 'relative', minHeight: 100 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor }}>{statusLabel}</span>
                    <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <MoreVertical size={14} style={{ color: '#fff' }} />
                    </button>
                </div>
            </div>
            {/* Body */}
            <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${theme.accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CardIcon size={18} style={{ color: theme.accent }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{course.title}</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{course.category || 'Général'}</p>
                    </div>
                </div>
                {/* Progress */}
                <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{done} / {total} leçons complétées</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: theme.accent, transition: 'width 0.6s' }} />
                    </div>
                </div>
                {/* Next lesson + Continue */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prochaine leçon</p>
                        <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextLesson || 'Aucune'}</p>
                    </div>
                    <Link href={`/courses/${course._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', color: theme.accent, border: `1.5px solid ${theme.accent}`, textDecoration: 'none', transition: 'all 0.2s', flexShrink: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; }}>
                        <Play size={12} /> Continuer
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function MyCoursesPage() {
    const { user } = useAuthStore();
    const [progress, setProgress] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        Promise.all([progressAPI.getMyProgress(), studentAPI.getStats()])
            .then(([p, s]) => { setProgress(p.data.progress || []); setStats(s.data.stats); })
            .catch(() => toast.error('Erreur chargement'))
            .finally(() => setLoading(false));
    }, [user]);

    const completed = progress.filter(p => p.completionPercentage === 100);
    const inProgress = progress.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100);
    const paused = progress.filter(p => p.completionPercentage === 0);

    const filtered = useMemo(() => progress.filter(p => {
        const q = search.toLowerCase();
        if (q && !p.course?.title?.toLowerCase().includes(q)) return false;
        if (filter === 'completed' && p.completionPercentage !== 100) return false;
        if (filter === 'in-progress' && (p.completionPercentage === 0 || p.completionPercentage === 100)) return false;
        if (filter === 'paused' && p.completionPercentage !== 0) return false;
        return true;
    }), [progress, search, filter]);

    const TABS = [
        { key: 'all', label: 'Tous', count: progress.length },
        { key: 'in-progress', label: 'En cours', count: inProgress.length },
        { key: 'completed', label: 'Terminés', count: completed.length },
        { key: 'paused', label: 'En pause', count: paused.length },
    ];

    return (
        <Sidebar>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Mes cours</h1>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Suivez vos cours et continuez votre apprentissage</p>
                </div>

                {!loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                        <StatCard icon={BookOpen} label="Cours inscrits" value={stats?.totalCourses ?? progress.length} linkText="Voir mes cours" linkHref="#" iconBg="rgba(79,70,229,0.1)" iconColor="#4f46e5" />
                        <StatCard icon={CheckCircle} label="Terminé" value={stats?.completedCourses ?? completed.length} linkText="Voir mes cours complétés" linkHref="#" iconBg="rgba(5,150,105,0.1)" iconColor="#059669" />
                        <StatCard icon={TrendingUp} label="Progression moyenne" value={`${stats?.averageCompletion ?? 0}%`} linkText="Voir ma progression" linkHref="/dashboard/statistics" iconBg="rgba(217,119,6,0.1)" iconColor="#d97706" />
                        <StatCard icon={Trophy} label="Score quiz moyen" value={stats?.avgScore ?? 0} linkText="Voir mes quiz" linkHref="/dashboard/statistics" iconBg="rgba(124,58,237,0.1)" iconColor="#7c3aed" />
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #eef2f6' }}>
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setFilter(t.key)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none', color: filter === t.key ? '#4f46e5' : '#94a3b8', borderBottom: filter === t.key ? '2px solid #4f46e5' : '2px solid transparent', marginBottom: -2 }}>
                                {t.label} ({t.count})
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: viewMode === 'grid' ? 'rgba(79,70,229,0.1)' : 'transparent', color: viewMode === 'grid' ? '#4f46e5' : '#94a3b8', border: `1px solid ${viewMode === 'grid' ? 'rgba(79,70,229,0.2)' : '#eef2f6'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <LayoutGrid size={14} /> Grille
                        </button>
                        <button onClick={() => setViewMode('list')} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: viewMode === 'list' ? 'rgba(79,70,229,0.1)' : 'transparent', color: viewMode === 'list' ? '#4f46e5' : '#94a3b8', border: `1px solid ${viewMode === 'list' ? 'rgba(79,70,229,0.2)' : '#eef2f6'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <List size={14} /> Liste
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                    <div style={{ position: 'relative', flex: '1 1 220px' }}>
                        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Rechercher un cours..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <select style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fff', border: '1.5px solid #e2e8f0', color: '#1e293b', outline: 'none', cursor: 'pointer' }}><option>Catégorie</option></select>
                    <select style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fff', border: '1.5px solid #e2e8f0', color: '#1e293b', outline: 'none', cursor: 'pointer' }}><option>Niveau</option></select>
                    <select style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fff', border: '1.5px solid #e2e8f0', color: '#1e293b', outline: 'none', cursor: 'pointer' }}><option>Trier par</option></select>
                </div>

                {/* Course Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 320, borderRadius: 18, background: '#f8fafc', border: '1px solid #eef2f6' }} className="animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 18, background: '#fff', border: '1px solid #eef2f6' }}>
                        <BookOpen size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{progress.length === 0 ? 'Aucun cours inscrit' : 'Aucun cours trouvé'}</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>{progress.length === 0 ? 'Explorez le catalogue pour commencer' : 'Modifiez vos filtres'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr', gap: viewMode === 'grid' ? 20 : 12 }}>
                        {filtered.map((p, i) => <CourseCard key={p._id} progress={p} index={i} />)}
                    </div>
                )}

                {/* Weekly Goal */}
                <div style={{ marginTop: 32, borderRadius: 16, background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', border: '1px solid #eef2f6', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Target size={22} style={{ color: '#fff' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Objectif hebdomadaire</p>
                            <p style={{ fontSize: 12, color: '#94a3b8' }}>Terminez 3 leçons cette semaine pour rester régulier !</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>2/3</p>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5' }}>2 leçons restantes</p>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>pour atteindre votre objectif</p>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
