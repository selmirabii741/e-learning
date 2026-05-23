'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import { GraduationCap, BookOpen, Users, TrendingUp, Heart, ArrowUpRight, ArrowRight, Activity, UserPlus, FileEdit, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM SAAS ADMIN DASHBOARD TOKENS
═══════════════════════════════════════════════════════════════════════════ */
const T = {
    colors: {
        primary: '#4F46E5',
        secondary: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
    },
    card: {
        bg: 'var(--bg-card)', // fallback handled by global css
        border: '1px solid var(--border)',
        radius: '20px',
        shadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        shadowHover: '0 12px 30px rgba(217, 244, 91, 0.08)',
    },
    text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
    },
};

/* ─── Section label ──────────────────────────────────────────────────── */
function SectionLabel({ children }) {
    return (
        <p style={{
            fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: T.colors.secondary, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.colors.primary }} />
            {children}
        </p>
    );
}

/* ─── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconColor, iconBg, growth }) {
    return (
        <div
            className="group cursor-default relative overflow-hidden"
            style={{
                background: T.card.bg,
                border: T.card.border,
                borderRadius: T.card.radius,
                boxShadow: T.card.shadow,
                padding: '24px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = T.card.shadowHover;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = T.colors.secondary + '40';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow = T.card.shadow;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
            }}
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity duration-300 group-hover:opacity-10">
                <Icon size={80} style={{ color: iconColor }} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                            width: 48, height: 48, borderRadius: '14px',
                            background: iconBg,
                            border: `1px solid ${iconColor}20`,
                        }}
                    >
                        <Icon size={22} style={{ color: iconColor }} />
                    </div>
                    {growth && (
                        <div style={{
                            padding: '4px 8px', borderRadius: '20px',
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                        }}>
                            <TrendingUp size={12} /> {growth}
                        </div>
                    )}
                </div>
                
                <div>
                    <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: T.text.primary, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif' }}>
                        {value ?? '—'}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: T.text.secondary, marginTop: 6 }}>{label}</p>
                </div>
                
                {sub && !growth && (
                    <p style={{ fontSize: 13, color: T.text.muted, marginTop: 8, fontWeight: 500 }}>{sub}</p>
                )}
            </div>
        </div>
    );
}

/* ─── Activity Item ──────────────────────────────────────────────────── */
function ActivityItem({ icon: Icon, color, title, desc, time, isLast }) {
    return (
        <div
            className="flex items-start gap-4 transition-all duration-200"
            style={{
                padding: '16px',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                margin: '0 -16px',
                borderRadius: isLast ? '0 0 20px 20px' : '0'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            <div style={{
                width: 36, height: 36, borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2,
                background: color + '15', border: `1px solid ${color}30`,
            }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, fontFamily: 'Inter, sans-serif' }}>{title}</p>
                <p style={{ fontSize: 13, color: T.text.muted, marginTop: 2 }}>{desc}</p>
            </div>
            <p style={{ fontSize: 12, color: T.text.muted, fontWeight: 500, flexShrink: 0, paddingTop: 4 }}>{time}</p>
        </div>
    );
}

/* ─── Mini Chart ─────────────────────────────────────────────────────── */
function MiniChart({ data }) {
    const max = 2.5;
    const w = 600, h = 240, padL = 40, padR = 20, padT = 20, padB = 30;
    const chartW = w - padL - padR, chartH = h - padT - padB;

    const pts = data.map((v, i) => ({
        x: padL + (i / (data.length - 1)) * chartW,
        y: padT + chartH - (v / max) * chartH
    }));

    function smooth(points) {
        if (points.length < 2) return '';
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
    const area = line + ` L${pts[pts.length - 1].x},${padT + chartH} L${pts[0].x},${padT + chartH} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none" style={{ minHeight: 240 }}>
            <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.colors.primary} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={T.colors.primary} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 0.5, 1, 1.5, 2, 2.5].map((v, i) => {
                const y = padT + chartH - (v / max) * chartH;
                return (
                    <g key={i}>
                        <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                        <text x={padL - 12} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)" fontWeight="500">{v}</text>
                    </g>
                );
            })}
            {/* X Axis Labels */}
            {['15 Mai', '20 Mai', '25 Mai', '30 Mai', '4 Jun', '9 Jun', '14 Jun'].map((l, i) => (
                <text key={i} x={padL + (i / 6) * chartW} y={h - 5} textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontWeight="500">{l}</text>
            ))}
            <path d={area} fill="url(#cg)" />
            <path d={line} fill="none" stroke={T.colors.primary} strokeWidth="3" strokeLinecap="round" />
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill="#fff" stroke={T.colors.primary} strokeWidth="2.5" 
                    style={{ transition: 'all 0.2s', transformOrigin: `${p.x}px ${p.y}px` }}
                    className="hover:scale-150 cursor-pointer"
                />
            ))}
        </svg>
    );
}

/* ─── Pill Button ────────────────────────────────────────────────────── */
function PillButton({ children, onClick }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1.5 transition-all duration-200 shadow-sm"
            style={{
                padding: '6px 14px', borderRadius: '10px',
                fontSize: 12, fontWeight: 600,
                color: T.text.secondary,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.borderColor = T.colors.secondary; e.currentTarget.style.color = T.colors.primary; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = T.text.secondary; }}
        >
            {children}
        </button>
    );
}

/* ═══════════════════════ Page ═══════════════════════════════════════════ */
export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user) return;
        adminAPI.getStats()
            .then(({ data }) => setStats(data))
            .catch(() => toast.error('Impossible de charger les statistiques'))
            .finally(() => setLoading(false));
    }, [user]);

    const chartData = [0, 0, 0, 0.8, 1.05, 1.05, 2, 2];

    const sectionCard = {
        background: T.card.bg,
        border: T.card.border,
        borderRadius: T.card.radius,
        boxShadow: T.card.shadow,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
    };

    return (
        <Sidebar>
            {/* Background wrapper for the soft lavender gradient */}
            <div className="min-h-full" style={{
                background: 'var(--bg-body)',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 244, 91, 0.05) 0%, transparent 60%)',
                margin: '-20px', padding: '20px', // Extend to cover padding from layout
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    
                    {/* ── Welcome Banner ── */}
                    <div
                        className="relative overflow-hidden"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '32px 40px', borderRadius: '24px', marginBottom: 32,
                            background: `linear-gradient(135deg, ${T.colors.primary}, ${T.colors.secondary})`,
                            boxShadow: '0 10px 30px rgba(217, 244, 91, 0.2)',
                            color: '#fff'
                        }}
                    >
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 rounded-full opacity-20" style={{ background: '#fff', filter: 'blur(30px)' }} />
                        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 rounded-full opacity-20" style={{ background: '#fff', filter: 'blur(20px)' }} />
                        
                        <div className="relative z-10">
                            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
                                Tableau de bord administrateur
                            </h1>
                            <p style={{ fontSize: 15, opacity: 0.9, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Sparkles size={16} /> Vue d'ensemble intelligente de la plateforme EduAI.
                            </p>
                        </div>
                        
                        <div className="hidden md:flex relative z-10 items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                            <Activity size={28} className="text-white" />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} style={{ height: 160, borderRadius: T.card.radius, background: 'var(--bg-card)' }} className="animate-pulse shadow-sm border border-slate-200/50 dark:border-slate-800" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* ── Stats Section ── */}
                            <div style={{ marginBottom: 32 }}>
                                <SectionLabel>Vue Globale</SectionLabel>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                                    <StatCard icon={Users}         label="Total utilisateurs" value={stats?.totalUsers}       iconColor={T.colors.primary}         iconBg="rgba(217, 244, 91, 0.1)"           growth="+12%" />
                                    <StatCard icon={GraduationCap} label="Professeurs"         value={stats?.totalInstructors} iconColor={T.colors.success}   iconBg="rgba(16, 185, 129, 0.1)"    growth="+5%" />
                                    <StatCard icon={UserPlus}      label="Étudiants"           value={stats?.totalStudents}    iconColor={T.colors.warning}    iconBg="rgba(245, 158, 11, 0.1)"     growth="+18%" />
                                    <StatCard icon={BookOpen}   label="Cours total"   value={stats?.totalCourses}     iconColor="#3B82F6"    iconBg="rgba(59, 130, 246, 0.1)"     sub={`${stats?.publishedCourses ?? 0} publiés au total`} />
                                    <StatCard icon={TrendingUp} label="Inscriptions"  value={stats?.totalEnrollments} iconColor="#EC4899"    iconBg="rgba(236, 72, 153, 0.1)"     growth="+22%" />
                                    <StatCard icon={Heart}      label="Cours publiés" value={stats?.publishedCourses} iconColor="#6366F1"  iconBg="rgba(154, 217, 75, 0.1)"   growth="+8%" />
                                </div>
                            </div>

                            {/* ── Analytics Section ── */}
                            <div style={{ marginBottom: 32 }}>
                                <SectionLabel>Analytics &amp; Activité Récente</SectionLabel>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: { gridTemplateColumns: '2fr 1fr' }, gap: 24 }} className="lg:grid-cols-3">
                                    {/* Chart */}
                                    <div style={sectionCard} className="lg:col-span-2">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Activity size={18} style={{ color: T.colors.primary }} />
                                                    Croissance des Inscriptions
                                                </h3>
                                                <p style={{ fontSize: 13, color: T.text.muted, marginTop: 4, fontWeight: 500 }}>Évolution sur les 30 derniers jours</p>
                                            </div>
                                            <PillButton>30 jours <ChevronDown size={14} /></PillButton>
                                        </div>
                                        <div className="flex-1 min-h-[240px]">
                                            <MiniChart data={chartData} />
                                        </div>
                                    </div>

                                    {/* Activity */}
                                    <div style={sectionCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <ArrowUpRight size={18} style={{ color: T.colors.secondary }} />
                                                Activité
                                            </h3>
                                            <PillButton>Voir tout</PillButton>
                                        </div>
                                        <div className="px-4">
                                            <ActivityItem icon={UserPlus} color={T.colors.primary} title="Nouveau professeur" desc="Dr. Sarah Johnson a rejoint" time="Il y a 2h" />
                                            <ActivityItem icon={BookOpen} color={T.colors.success} title="Nouveau cours publié" desc="Introduction à l'IA" time="Il y a 5h" />
                                            <ActivityItem icon={UserPlus} color="#3B82F6" title="Nouvel étudiant" desc="Mike Wilson inscrit" time="Il y a 1j" />
                                            <ActivityItem icon={FileEdit} color="#EC4899" title="Cours mis à jour" desc="Python Avancé édité" time="Il y a 2j" isLast />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}

