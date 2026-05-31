'use client';
import { useEffect, useState } from 'react';
import { progressAPI, studentAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import { usePlannerStore } from '@/lib/calendar/planner-store';
import Sidebar from '@/components/layout/Sidebar';
import {
    BookOpen, CheckCircle, TrendingUp, Trophy,
    ArrowRight, Play, Clock, Award,
    Code, Palette, Database, Megaphone, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

/* ── Accent Colors ──────────────────────────────────────────────── */
const COURSE_COLORS = [
    { bg: '#4f46e5', light: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.15)', text: '#4f46e5' },
    { bg: '#059669', light: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.15)', text: '#059669' },
    { bg: '#d97706', light: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.15)', text: '#d97706' },
    { bg: '#dc2626', light: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.15)', text: '#dc2626' },
    { bg: '#7c3aed', light: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.15)', text: '#7c3aed' },
    { bg: '#0891b2', light: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.15)', text: '#0891b2' },
];

/* ── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, linkText, linkHref, iconBg, iconColor }) {
    return (
        <div style={{
            background: 'var(--bg-card)', borderRadius: 16,
            border: '1px solid var(--border-strong)',
            padding: '20px 22px', transition: 'all 0.25s ease',
            display: 'flex', flexDirection: 'column', gap: 12,
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={20} style={{ color: iconColor }} />
                </div>
                <div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value ?? '—'}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 }}>{label}</p>
                </div>
            </div>
            {linkText && (
                <Link href={linkHref || '#'} style={{
                    fontSize: 12, fontWeight: 600, color: iconColor,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                    transition: 'opacity 0.2s',
                }}>
                    {linkText} <ArrowRight size={12} />
                </Link>
            )}
        </div>
    );
}

/* ── Course Row ─────────────────────────────────────────────────── */
function CourseRow({ progress, index }) {
    const course = progress.course;
    if (!course) return null;
    const colors = COURSE_COLORS[index % COURSE_COLORS.length];
    const pct = progress.completionPercentage || 0;
    const done = progress.completedLessons?.length || 0;
    const total = course.lessons?.length || 0;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 20px', borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            transition: 'all 0.2s ease',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
        >
            {/* Course icon */}
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: colors.light, border: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <BookOpen size={20} style={{ color: colors.text }} />
            </div>

            {/* Course info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{course.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {done} / {total} leçons complétées
                </p>
            </div>

            {/* Progress bar */}
            <div style={{ width: 120, flexShrink: 0 }}>
                <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--border-strong)', overflow: 'hidden' }}>
                    <div style={{
                        width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3,
                        background: colors.bg, transition: 'width 0.6s ease',
                    }} />
                </div>
            </div>

            {/* Percentage */}
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, minWidth: 36, textAlign: 'right' }}>{pct}%</span>

            {/* Continue button */}
            <Link href={`/courses/${course._id}`} style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: colors.light, color: colors.text, border: `1px solid ${colors.border}`,
                textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.light; e.currentTarget.style.color = colors.text; }}
            >
                Continuer
            </Link>
        </div>
    );
}

/* ── Deadline Item ──────────────────────────────────────────────── */
function DeadlineItem({ day, monthLabel, title, subtitle, daysLeft, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{day}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{monthLabel}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{subtitle}</p>
            </div>
            <span style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                color: '#fff', background: color, whiteSpace: 'nowrap',
            }}>
                {daysLeft}
            </span>
        </div>
    );
}

/* ── Category Card ──────────────────────────────────────────────── */
function CategoryCard({ icon: Icon, name, count, color }) {
    return (
        <div style={{
            padding: '18px 20px', borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            transition: 'all 0.2s ease',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{count} cours</p>
            </div>
        </div>
    );
}

/* ── Helper: format days left ────────────────────────────────────── */
function getDaysLeftInfo(deadlineIso) {
    const now = new Date();
    const deadline = new Date(deadlineIso);
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Passé', color: '#6b7280' };
    if (diffDays <= 2) return { label: `${diffDays} jour${diffDays > 1 ? 's' : ''}`, color: '#ef4444' };
    if (diffDays <= 5) return { label: `${diffDays} jours`, color: '#f59e0b' };
    return { label: `${diffDays} jours`, color: '#10b981' };
}

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function DashboardPage() {
    const { user } = useAuthStore();
    const [progress, setProgress] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Get tasks from planner store (calendar)
    const tasks = usePlannerStore((state) => state.tasks);
    const upcomingTasks = tasks
        .filter(t => !t.completed && new Date(t.deadline) > new Date())
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 4);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        Promise.all([progressAPI.getMyProgress(), studentAPI.getStats()])
            .then(([progRes, statsRes]) => {
                setProgress(progRes.data.progress || []);
                setStats(statsRes.data.stats);
            })
            .catch(() => toast.error('Erreur chargement'))
            .finally(() => setLoading(false));
    }, [user]);

    const completed = progress.filter(p => p.completionPercentage === 100);
    const activeCourses = progress.filter(p => p.completionPercentage < 100);

    const firstName = (mounted && user?.name?.split(' ')[0]) || 'Étudiant';

    return (
        <Sidebar>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* ── Greeting Header (no Explorer button) ── */}
                <div style={{ marginBottom: 28 }}>
                    <h1 suppressHydrationWarning style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Bonjour, {firstName} 👋
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                        Prête à apprendre quelque chose de nouveau aujourd&apos;hui ?
                    </p>
                </div>

                {/* ── Stats Row ── */}
                {!loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                        <StatCard icon={BookOpen} label="Cours inscrits" value={stats?.totalCourses ?? progress.length}
                            linkText="Voir mes cours" linkHref="/dashboard/my-courses"
                            iconBg="rgba(79,70,229,0.1)" iconColor="#4f46e5" />
                        <StatCard icon={CheckCircle} label="Terminé" value={stats?.completedCourses ?? completed.length}
                            linkText="Voir mes cours complétés" linkHref="/dashboard/my-courses"
                            iconBg="rgba(5,150,105,0.1)" iconColor="#059669" />
                        <StatCard icon={TrendingUp} label="Progression moyenne" value={`${stats?.averageCompletion ?? 0}%`}
                            linkText="Voir ma progression" linkHref="/dashboard/statistics"
                            iconBg="rgba(217,119,6,0.1)" iconColor="#d97706" />
                        <StatCard icon={Trophy} label="Score quiz moyen" value={stats?.avgScore ?? 0}
                            linkText="Voir mes quiz" linkHref="/dashboard/statistics"
                            iconBg="rgba(124,58,237,0.1)" iconColor="#7c3aed" />
                    </div>
                )}

                {/* ── Main Content: Courses + Sidebar ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>
                    {/* Left: Courses in progress */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Mes cours en cours</h2>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} style={{ height: 76, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }} className="animate-pulse" />
                                ))}
                            </div>
                        ) : activeCourses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-strong)' }}>
                                <BookOpen size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Aucun cours en cours</p>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Explorez le catalogue pour commencer</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {activeCourses.slice(0, 4).map((p, i) => (
                                    <CourseRow key={p._id} progress={p} index={i} />
                                ))}
                            </div>
                        )}

                        {activeCourses.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Link href="/dashboard/my-courses" style={{
                                    fontSize: 13, fontWeight: 600, color: '#4f46e5',
                                    textDecoration: 'none', transition: 'opacity 0.2s',
                                }}>
                                    Voir tous mes cours →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Prochaines échéances — from calendar tasks */}
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: 16,
                            border: '1px solid var(--border-strong)', padding: '20px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Prochaines échéances</h3>
                                <Link href="/calendar" style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>Voir tout</Link>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {upcomingTasks.length === 0 ? (
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                                        Aucune échéance à venir
                                    </p>
                                ) : upcomingTasks.map(task => {
                                    const d = new Date(task.deadline);
                                    const info = getDaysLeftInfo(task.deadline);
                                    return (
                                        <DeadlineItem
                                            key={task.id}
                                            day={d.getDate()}
                                            monthLabel={MONTHS_SHORT[d.getMonth()]}
                                            title={task.title}
                                            subtitle={`À rendre avant ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`}
                                            daysLeft={info.label}
                                            color={info.color}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Activité récente */}
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: 16,
                            border: '1px solid var(--border-strong)', padding: '20px',
                        }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Activité récente</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {progress.slice(0, 3).map((p, i) => {
                                    const course = p.course;
                                    if (!course) return null;
                                    const pct = p.completionPercentage || 0;
                                    const done = p.completedLessons?.length || 0;
                                    return (
                                        <div key={p._id || i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: pct === 100 ? '#059669' : '#4f46e5', marginTop: 5, flexShrink: 0 }} />
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {pct === 100 ? `Cours terminé : ${course.title}` : `${done} leçon(s) complétée(s) — ${course.title}`}
                                                </p>
                                                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {course.category || 'Cours'} · Progression : {pct}%
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {progress.length === 0 && !loading && (
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                                        Aucune activité récente
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Catégories populaires ── */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Catégories populaires</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                        <CategoryCard icon={Code} name="Développement" count="12" color="#4f46e5" />
                        <CategoryCard icon={Palette} name="Design" count="8" color="#ec4899" />
                        <CategoryCard icon={Database} name="Base de données" count="6" color="#059669" />
                        <CategoryCard icon={Megaphone} name="Marketing" count="5" color="#f59e0b" />
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
