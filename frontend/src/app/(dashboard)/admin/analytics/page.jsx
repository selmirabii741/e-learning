'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { adminAPI } from '@/lib/api';
import { BarChart2, Users, BookOpen, Activity, Calendar, GraduationCap, CheckCircle, ShieldAlert, Monitor, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
    colors: {
        primary: '#4F46E5',
        secondary: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
    },
    card: {
        bg: '#ffffff',
        border: '1px solid #E2E8F0',
        radius: '24px',
        shadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
    },
    text: {
        primary: '#1e293b',
        secondary: '#475569',
        muted: '#94a3b8',
    },
};

export default function AnalyticsPage() {
    const [timeframe, setTimeframe] = useState('30d');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await adminAPI.getStats();
                setStats(data);
            } catch (error) {
                toast.error("Erreur lors du chargement des statistiques.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <Sidebar>
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: T.colors.primary }} />
                </div>
            </Sidebar>
        );
    }

    const adminCount = (stats?.totalUsers || 0) - (stats?.totalStudents || 0) - (stats?.totalInstructors || 0);

    const STATS = [
        { title: 'Utilisateurs Globaux', value: stats?.totalUsers || 0, icon: Users, color: '#4F46E5' },
        { title: 'Étudiants Inscrits', value: stats?.totalStudents || 0, icon: Monitor, color: '#3B82F6' },
        { title: 'Professeurs Actifs', value: stats?.totalInstructors || 0, icon: GraduationCap, color: '#10B981' },
        { title: 'Total Cours', value: stats?.totalCourses || 0, icon: BookOpen, color: '#F59E0B' },
        { title: 'Cours Publiés', value: stats?.publishedCourses || 0, icon: CheckCircle, color: '#ec4899' },
        { title: 'Inscriptions aux cours', value: stats?.totalEnrollments || 0, icon: Activity, color: '#6366F1' },
        { title: 'Vérifications en attente', value: stats?.pendingVerifications || 0, icon: ShieldAlert, color: '#EF4444' },
    ];

    return (
        <Sidebar>
            <div className="min-h-full" style={{
                background: 'var(--bg-body)',
                backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(217, 244, 91, 0.08) 0%, transparent 50%)',
                margin: '-20px', padding: '32px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                    
                    {/* ── Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'linear-gradient(135deg, #4F46E5, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${T.colors.primary}40` }}>
                                    <BarChart2 size={22} className="text-white" />
                                </div>
                                Analytics & Statistiques
                            </h1>
                            <p style={{ fontSize: 15, color: T.text.muted, marginTop: 8, fontWeight: 500 }}>
                                Analysez l'activité, l'engagement et les performances pédagogiques de la plateforme EduAI.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, background: '#fff', padding: '6px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            {[{ id: '7d', label: '7 jours' }, { id: '30d', label: '30 jours' }, { id: '1y', label: '1 an' }].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTimeframe(t.id)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '12px',
                                        background: timeframe === t.id ? T.colors.primary : 'transparent',
                                        color: timeframe === t.id ? '#fff' : T.text.secondary,
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                        border: 'none', transition: 'all 0.2s'
                                    }}
                                    className={timeframe !== t.id ? 'hover:bg-slate-50' : ''}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── KPI Cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {STATS.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={i} style={{
                                    background: T.card.bg, border: T.card.border, borderRadius: T.card.radius,
                                    padding: '24px', boxShadow: T.card.shadow, transition: 'transform 0.2s', cursor: 'pointer'
                                }} className="hover:-translate-y-1">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={20} style={{ color: stat.color }} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text.muted, marginBottom: 4 }}>{stat.title}</p>
                                    <p style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em' }}>{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Main Charts Area ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                        
                        {/* User Growth Chart (Mock shape, since we don't have historical data in the API yet) */}
                        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary }}>Croissance des utilisateurs</h3>
                                    <p style={{ fontSize: 13, color: T.text.muted, marginTop: 4, fontWeight: 500 }}>Évolution des inscriptions et connexions</p>
                                </div>
                                <button style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, color: T.text.secondary, display: 'flex', gap: 8, alignItems: 'center' }} className="hover:bg-slate-50">
                                    <Calendar size={14} /> Exporter
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-end', height: 260, gap: 12, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                                {[40, 45, 55, 50, 70, 85, 95, 120, 110, 140, 160, 200].map((h, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                                        <div style={{ 
                                            width: '100%', height: `${(h/200)*100}%`, 
                                            background: i === 11 ? `linear-gradient(180deg, ${T.colors.primary} 0%, rgba(217, 244, 91, 0.2) 100%)` : '#E2E8F0',
                                            borderRadius: '8px 8px 0 0',
                                            transition: 'background 0.3s', cursor: 'pointer', alignSelf: 'flex-end'
                                        }} className="hover:bg-indigo-300"></div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((m, i) => (
                                    <span key={i} style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, width: '100%', textAlign: 'center' }}>{m}</span>
                                ))}
                            </div>
                        </div>

                        {/* User Distribution */}
                        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text.primary, marginBottom: 8 }}>Répartition des utilisateurs</h3>
                            <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 32, fontWeight: 500 }}>Proportion des différents rôles</p>
                            
                            <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 32px', borderRadius: '50%', background: `conic-gradient(${T.colors.info} 0% 70%, ${T.colors.success} 70% 95%, ${T.colors.primary} 95% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 130, height: 130, background: '#fff', borderRadius: '50%', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 24, fontWeight: 800, color: T.text.primary }}>{stats?.totalUsers || 0}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text.muted }}>Total</span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                                    <span style={{ fontSize: 14, color: T.text.secondary, display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}><Monitor size={16} color={T.colors.info}/> Étudiants</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: T.text.primary }}>{stats?.totalStudents || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                                    <span style={{ fontSize: 14, color: T.text.secondary, display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}><GraduationCap size={16} color={T.colors.success}/> Professeurs</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: T.text.primary }}>{stats?.totalInstructors || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                                    <span style={{ fontSize: 14, color: T.text.secondary, display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}><Users size={16} color={T.colors.primary}/> Administrateurs</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: T.text.primary }}>{adminCount > 0 ? adminCount : 0}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── Secondary Charts Area ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                        {/* Course Activity */}
                        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '24px', boxShadow: T.card.shadow }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text.primary, marginBottom: 8 }}>Activité des cours</h3>
                            <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 24, fontWeight: 500 }}>Statut global des cours</p>
                            
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                                    <span style={{ fontSize: 14, color: T.text.secondary, display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}><CheckCircle size={16} color={T.colors.success}/> Publiés</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: T.text.primary }}>{stats?.publishedCourses || 0}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
                                    <span style={{ fontSize: 14, color: T.text.secondary, display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}><BookOpen size={16} color={T.colors.warning}/> Brouillons</span>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: T.text.primary }}>{(stats?.totalCourses || 0) - (stats?.publishedCourses || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Usage */}
                        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '24px', boxShadow: T.card.shadow }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text.primary, marginBottom: 8 }}>Vérifications d'identité</h3>
                            <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 24, fontWeight: 500 }}>Certificats de professeurs en attente</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '120px' }}>
                                {stats?.pendingVerifications > 0 ? (
                                    <>
                                        <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <ShieldAlert size={32} className="text-red-500" />
                                        </div>
                                        <p style={{ fontSize: 24, fontWeight: 800, color: T.colors.danger }}>{stats.pendingVerifications}</p>
                                        <p style={{ fontSize: 14, color: T.text.muted, fontWeight: 600 }}>Dossiers à vérifier</p>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ width: 64, height: 64, borderRadius: '16px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <CheckCircle size={32} className="text-green-500" />
                                        </div>
                                        <p style={{ fontSize: 18, fontWeight: 800, color: T.text.primary }}>Tout est à jour</p>
                                        <p style={{ fontSize: 14, color: T.text.muted, fontWeight: 600 }}>Aucune vérification en attente</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '24px', boxShadow: T.card.shadow, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text.primary }}>Activité Récente</h3>
                                <button style={{ background: 'none', border: 'none', color: T.colors.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Voir tout</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                                {[
                                    { icon: Users, title: 'Nouveau professeur', desc: 'Dr. Martin a rejoint la plateforme', time: '10 min', color: T.colors.primary },
                                    { icon: BookOpen, title: 'Cours complété', desc: 'Sophie D. a terminé "Algorithmes"', time: '45 min', color: T.colors.success },
                                    { icon: Sparkles, title: 'Quiz IA généré', desc: 'Sujet : Machine Learning par Marc', time: '2 h', color: T.colors.secondary },
                                ].map((item, i) => {
                                    const FeedIcon = item.icon;
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FeedIcon size={16} style={{ color: item.color }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>{item.title}</p>
                                                <p style={{ fontSize: 12, color: T.text.secondary, marginTop: 2 }}>{item.desc}</p>
                                                <p style={{ fontSize: 11, color: T.text.muted, marginTop: 4, fontWeight: 600 }}>{item.time}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Sidebar>
    );
}
