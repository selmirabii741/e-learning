'use client';
import { useEffect, useState } from 'react';
import { progressAPI, studentAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    BookOpen, CheckCircle, TrendingUp, Trophy, Brain,
    Star, Target, Clock, BarChart2, Loader2, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const T = {
    card: { bg: 'var(--bg-card)', border: '1.5px solid var(--border-strong)', radius: '16px', shadow: '0 2px 12px rgba(0,0,0,0.10), 0 4px 24px rgba(0,0,0,0.08)' },
    text: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', muted: 'var(--text-muted)', accent: 'var(--accent)' },
};

function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg }) {
    return (
        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, boxShadow: T.card.shadow, padding: '20px 22px', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,0,0,0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.card.shadow; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, border: `1px solid ${iconColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} style={{ color: iconColor }} />
                </div>
                <div>
                    <p style={{ fontSize: 28, fontWeight: 800, color: T.text.primary, lineHeight: 1, letterSpacing: '-0.03em' }}>{value ?? '—'}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: T.text.muted, marginTop: 4 }}>{label}</p>
                    {sub && <p style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ percent, color, height = 8 }) {
    return (
        <div style={{ width: '100%', height, borderRadius: height / 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', borderRadius: height / 2, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function ProgressChart({ data }) {
    if (!data || data.length === 0) return null;
    const max = 100;
    const w = 600, h = 200, padL = 44, padR = 20, padT = 15, padB = 35;
    const chartW = w - padL - padR, chartH = h - padT - padB;
    const pts = data.map((v, i) => ({
        x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
        y: padT + chartH - (v / max) * chartH,
    }));
    function smooth(points) {
        if (points.length < 2) return `M${points[0]?.x ?? 0},${points[0]?.y ?? 0}`;
        const t = 0.3;
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)], p1 = points[i];
            const p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
            d += ` C${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
        }
        return d;
    }
    const line = smooth(pts);
    const area = pts.length > 1 ? line + ` L${pts[pts.length - 1].x},${padT + chartH} L${pts[0].x},${padT + chartH} Z` : '';
    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 220 }} preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map((v, i) => {
                const y = padT + chartH - (v / max) * chartH;
                return <g key={i}><line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--border)" strokeWidth="1" /><text x={padL - 10} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--text-muted)">{v}%</text></g>;
            })}
            {area && <path d={area} fill="url(#sg)" />}
            <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="rgba(59,130,246,0.3)" strokeWidth="4" />)}
        </svg>
    );
}

export default function StudentStatisticsPage() {
    const { user } = useAuthStore();
    const [progress, setProgress] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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
    const inProgress = progress.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100);
    const notStarted = progress.filter(p => p.completionPercentage === 0);
    const totalLessons = progress.reduce((s, p) => s + (p.course?.lessons?.length || 0), 0);
    const completedLessons = progress.reduce((s, p) => s + (p.completedLessons?.length || 0), 0);
    const chartData = progress.length ? progress.map(p => p.completionPercentage) : [];
    const avgProgress = progress.length ? Math.round(progress.reduce((s, p) => s + p.completionPercentage, 0) / progress.length) : 0;

    const sectionCard = { background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, boxShadow: T.card.shadow, padding: '22px 24px' };

    return (
        <Sidebar>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.03em' }}>Statistiques</h1>
                    <p style={{ fontSize: 13, color: T.text.muted, marginTop: 4 }}>Vue d'ensemble de votre progression et performances</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: 13, color: T.text.muted }}>Chargement des statistiques…</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                            <StatCard icon={BookOpen} label="Cours inscrits" value={stats?.totalCourses ?? progress.length} iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)" />
                            <StatCard icon={CheckCircle} label="Cours terminés" value={stats?.completedCourses ?? completed.length} iconColor="#22c55e" iconBg="rgba(34,197,94,0.1)" />
                            <StatCard icon={TrendingUp} label="Progression moy." value={`${stats?.averageCompletion ?? avgProgress}%`} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" />
                            <StatCard icon={Trophy} label="Score quiz moy." value={`${stats?.avgScore ?? 0}%`} iconColor="#6366F1" iconBg="rgba(154, 217, 75,0.1)" sub={`${stats?.totalQuizAttempts ?? 0} tentative(s)`} />
                            <StatCard icon={Brain} label="Leçons complétées" value={`${completedLessons}/${totalLessons}`} iconColor="#6366f1" iconBg="rgba(99,102,241,0.1)" />
                            <StatCard icon={Star} label="En cours" value={inProgress.length} iconColor="#ec4899" iconBg="rgba(236,72,153,0.1)" sub={`${notStarted.length} non commencé(s)`} />
                        </div>

                        {/* Chart + Course breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 28 }}>
                            {/* Chart */}
                            <div style={sectionCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <BarChart2 size={16} style={{ color: '#3b82f6' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text.primary }}>Progression par cours</h3>
                                        <p style={{ fontSize: 12, color: T.text.muted }}>Votre avancement dans chaque cours inscrit</p>
                                    </div>
                                </div>
                                {chartData.length > 0 ? (
                                    <ProgressChart data={chartData} />
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '40px 0', color: T.text.muted, fontSize: 13 }}>Aucune donnée disponible</p>
                                )}
                            </div>

                            {/* Distribution */}
                            <div style={sectionCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(154, 217, 75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target size={16} style={{ color: '#6366F1' }} />
                                    </div>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text.primary }}>Répartition</h3>
                                </div>
                                {[
                                    { label: 'Terminés', count: completed.length, color: '#22c55e', percent: progress.length ? (completed.length / progress.length * 100) : 0 },
                                    { label: 'En cours', count: inProgress.length, color: '#3b82f6', percent: progress.length ? (inProgress.length / progress.length * 100) : 0 },
                                    { label: 'Non commencés', count: notStarted.length, color: '#f59e0b', percent: progress.length ? (notStarted.length / progress.length * 100) : 0 },
                                ].map((item, i) => (
                                    <div key={i} style={{ marginBottom: 18 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: T.text.secondary }}>{item.label}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.count} ({Math.round(item.percent)}%)</span>
                                        </div>
                                        <ProgressBar percent={item.percent} color={item.color} height={10} />
                                    </div>
                                ))}

                                {/* Donut-style visual */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ position: 'relative', width: 80, height: 80 }}>
                                        <svg viewBox="0 0 36 36" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                                                strokeDasharray={`${progress.length ? (completed.length / progress.length * 100) : 0} ${100 - (progress.length ? (completed.length / progress.length * 100) : 0)}`}
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: 14, fontWeight: 800, color: T.text.primary }}>{avgProgress}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>Progression globale</p>
                                        <p style={{ fontSize: 12, color: T.text.muted }}>{completedLessons} leçons sur {totalLessons}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Course detail table */}
                        <div style={sectionCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Award size={16} style={{ color: '#10b981' }} />
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text.primary }}>Détail par cours</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 100px 100px 1.5fr 80px', padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 8 }}>
                                {['COURS', 'LEÇONS', 'QUIZ', 'PROGRESSION', 'STATUT'].map(h => (
                                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.text.muted, letterSpacing: '0.07em' }}>{h}</span>
                                ))}
                            </div>

                            {progress.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '30px', color: T.text.muted, fontSize: 13 }}>Aucun cours inscrit</p>
                            ) : progress.map((p, i) => {
                                const c = p.course;
                                if (!c) return null;
                                const done = p.completedLessons?.length || 0;
                                const total = c.lessons?.length || 0;
                                const pct = p.completionPercentage || 0;
                                const isComplete = pct === 100;
                                return (
                                    <div key={p._id} style={{
                                        display: 'grid', gridTemplateColumns: '2.5fr 100px 100px 1.5fr 80px',
                                        alignItems: 'center', padding: '12px 16px',
                                        borderBottom: i < progress.length - 1 ? '1px solid var(--border)' : 'none',
                                        transition: 'background 0.1s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <p style={{ fontSize: 13, fontWeight: 600, color: T.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                                        <p style={{ fontSize: 13, color: T.text.secondary }}>{done}/{total}</p>
                                        <p style={{ fontSize: 13, color: T.text.secondary }}>{p.quizScores?.length || 0}</p>
                                        <div style={{ paddingRight: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: isComplete ? '#22c55e' : '#3b82f6' }}>{pct}%</span>
                                            </div>
                                            <ProgressBar percent={pct} color={isComplete ? '#22c55e' : '#3b82f6'} height={6} />
                                        </div>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textAlign: 'center',
                                            background: isComplete ? 'rgba(34,197,94,0.1)' : pct > 0 ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: isComplete ? '#22c55e' : pct > 0 ? '#3b82f6' : '#f59e0b',
                                            border: `1px solid ${isComplete ? 'rgba(34,197,94,0.25)' : pct > 0 ? 'rgba(59,130,246,0.25)' : 'rgba(245,158,11,0.25)'}`,
                                        }}>
                                            {isComplete ? 'Terminé' : pct > 0 ? 'En cours' : 'Nouveau'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Sidebar>
    );
}
