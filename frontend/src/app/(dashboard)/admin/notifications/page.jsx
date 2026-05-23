'use client';
import Sidebar from '@/components/layout/Sidebar';
import { Bell, ShieldAlert, CheckCircle, Info } from 'lucide-react';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
    colors: { primary: '#4F46E5', secondary: '#6366F1', success: '#10B981', warning: '#F59E0B', danger: '#EF4444' },
    card: { bg: '#ffffff', border: '1px solid #E2E8F0', radius: '20px', shadow: '0 4px 20px rgba(0, 0, 0, 0.03)' },
    text: { primary: '#1e293b', secondary: '#475569', muted: '#94a3b8' },
};

const NOTIFICATIONS = [
    { id: 1, type: 'warning', title: 'Nouvelle inscription professeur en attente', desc: 'Un professeur vient de soumettre son certificat. Veuillez le vérifier.', time: 'Il y a 5 min', icon: ShieldAlert, color: '#F59E0B' },
    { id: 2, type: 'success', title: 'Sauvegarde automatique réussie', desc: 'La base de données a été sauvegardée avec succès.', time: 'Il y a 2 heures', icon: CheckCircle, color: '#10B981' },
    { id: 3, type: 'info', title: 'Nouveau cours publié', desc: 'Le cours "Introduction au Machine Learning" a été publié.', time: 'Hier', icon: Info, color: '#3B82F6' },
];

export default function NotificationsPage() {
    return (
        <Sidebar>
            <div className="min-h-full" style={{ background: 'var(--bg-body)', margin: '-20px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${T.colors.primary}40` }}>
                                    <Bell size={20} className="text-white" />
                                </div>
                                Notifications Système
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                                Retrouvez ici toutes les alertes et événements de la plateforme.
                            </p>
                        </div>
                        <button style={{ padding: '8px 16px', borderRadius: '10px', background: '#fff', border: '1px solid #E2E8F0', color: T.text.secondary, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-slate-50">
                            Tout marquer comme lu
                        </button>
                    </div>

                    {/* Timeline */}
                    <div style={{ display: 'grid', gap: 16 }}>
                        {NOTIFICATIONS.map((n) => {
                            const Icon = n.icon;
                            return (
                                <div key={n.id} style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '20px', boxShadow: T.card.shadow, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${n.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={24} style={{ color: n.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text.primary }}>{n.title}</h3>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text.muted }}>{n.time}</span>
                                        </div>
                                        <p style={{ fontSize: 14, color: T.text.secondary, lineHeight: 1.5 }}>{n.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
