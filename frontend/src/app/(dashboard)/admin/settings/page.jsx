'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Settings, User, Lock, Bell, Palette, Globe, Shield } from 'lucide-react';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
    colors: { primary: '#4F46E5', secondary: '#6366F1', success: '#10B981', warning: '#F59E0B', danger: '#EF4444' },
    card: { bg: '#ffffff', border: '1px solid #E2E8F0', radius: '20px', shadow: '0 4px 20px rgba(0, 0, 0, 0.03)' },
    text: { primary: '#1e293b', secondary: '#475569', muted: '#94a3b8' },
};

const SECTIONS = [
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'security', icon: Lock, label: 'Sécurité' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'theme', icon: Palette, label: 'Apparence' },
    { id: 'language', icon: Globe, label: 'Langue' },
    { id: 'platform', icon: Shield, label: 'Plateforme' },
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('profile');

    return (
        <Sidebar>
            <div className="min-h-full" style={{ background: 'var(--bg-body)', margin: '-20px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    
                    {/* Header */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '12px', background: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${T.colors.primary}40` }}>
                                <Settings size={20} className="text-white" />
                            </div>
                            Paramètres
                        </h1>
                        <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                            Gérez vos préférences et les configurations de la plateforme.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
                        {/* Sidebar Menu */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {SECTIONS.map((sec) => {
                                const Icon = sec.icon;
                                const isActive = activeSection === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        onClick={() => setActiveSection(sec.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px', borderRadius: '12px', border: 'none',
                                            background: isActive ? '#fff' : 'transparent',
                                            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                                            color: isActive ? T.colors.primary : T.text.secondary,
                                            fontWeight: isActive ? 700 : 600, fontSize: 14,
                                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                        className={!isActive ? 'hover:bg-slate-50' : ''}
                                    >
                                        <Icon size={18} /> {sec.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                            {activeSection === 'profile' && (
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, marginBottom: 24 }}>Informations du profil</h2>
                                    <div style={{ display: 'grid', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary, marginBottom: 8 }}>Nom complet</label>
                                            <input type="text" defaultValue="Admin EduAI" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }} className="focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary, marginBottom: 8 }}>Adresse email</label>
                                            <input type="email" defaultValue="admin@eduai.com" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }} className="focus:border-indigo-500" />
                                        </div>
                                        <button style={{ marginTop: 12, padding: '12px 24px', borderRadius: '12px', background: T.colors.primary, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }} className="hover:bg-[#4F46E5] text-[#03150D] transition-colors">
                                            Enregistrer les modifications
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeSection !== 'profile' && (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <Settings size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary }}>Section en construction</h2>
                                    <p style={{ fontSize: 14, color: T.text.muted, marginTop: 8 }}>Les paramètres pour cette section seront bientôt disponibles.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
