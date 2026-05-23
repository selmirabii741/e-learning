'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Download, Calendar, Filter, FileSpreadsheet, File } from 'lucide-react';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
    colors: { primary: '#4F46E5', secondary: '#6366F1', success: '#10B981', warning: '#F59E0B', danger: '#EF4444' },
    card: { bg: '#ffffff', border: '1px solid #E2E8F0', radius: '20px', shadow: '0 4px 20px rgba(0, 0, 0, 0.03)' },
    text: { primary: '#1e293b', secondary: '#475569', muted: '#94a3b8' },
};

const REPORTS = [
    { id: 1, title: 'Rapport des Inscriptions (Mensuel)', date: '01/05/2026', type: 'CSV', size: '1.2 MB', icon: FileSpreadsheet },
    { id: 2, title: 'Activité des Professeurs (Global)', date: '28/04/2026', type: 'PDF', size: '4.5 MB', icon: File },
    { id: 3, title: 'Revenus et Souscriptions - Q1', date: '31/03/2026', type: 'CSV', size: '2.1 MB', icon: FileSpreadsheet },
    { id: 4, title: 'Audit de Sécurité Système', date: '15/03/2026', type: 'PDF', size: '8.4 MB', icon: File },
];

export default function ReportsPage() {
    return (
        <Sidebar>
            <div className="min-h-full" style={{ background: 'var(--bg-body)', backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(217, 244, 91, 0.05) 0%, transparent 50%)', margin: '-20px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '12px', background: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${T.colors.primary}40` }}>
                                    <FileText size={20} className="text-white" />
                                </div>
                                Rapports
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                                Téléchargez et consultez les rapports générés par le système.
                            </p>
                        </div>
                        <button style={{ padding: '10px 20px', borderRadius: '12px', background: T.colors.primary, color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', boxShadow: `0 4px 14px ${T.colors.primary}40`, transition: 'all 0.2s' }} className="hover:-translate-y-0.5 hover:shadow-lg">
                            <Download size={16} /> Générer un rapport
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        <div style={{ padding: '10px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 8, color: T.text.secondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <Calendar size={16} style={{ color: T.text.muted }} /> Ce mois
                        </div>
                        <div style={{ padding: '10px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 8, color: T.text.secondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <Filter size={16} style={{ color: T.text.muted }} /> Type de fichier
                        </div>
                    </div>

                    {/* Report List */}
                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, overflow: 'hidden', boxShadow: T.card.shadow }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            {['Nom du rapport', 'Date', 'Taille', 'Action'].map((h, i) => (
                                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.text.muted, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: i === 3 ? 'right' : 'left' }}>{h}</span>
                            ))}
                        </div>
                        <div>
                            {REPORTS.map((r, index) => {
                                const Icon = r.icon;
                                return (
                                    <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', alignItems: 'center', padding: '16px 24px', borderBottom: index === REPORTS.length - 1 ? 'none' : '1px solid #E2E8F0', transition: 'background 0.2s', cursor: 'default' }} className="hover:bg-slate-50 group">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: r.type === 'CSV' ? '#ecfccb' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={20} style={{ color: r.type === 'CSV' ? '#65a30d' : '#ef4444' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>{r.title}</p>
                                                <p style={{ fontSize: 12, color: T.text.muted, fontWeight: 600, marginTop: 2 }}>Format {r.type}</p>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 13, color: T.text.secondary, fontWeight: 500 }}>{r.date}</div>
                                        <div style={{ fontSize: 13, color: T.text.secondary, fontWeight: 500 }}>{r.size}</div>
                                        <div style={{ textAlign: 'right' }}>
                                            <button style={{ padding: '8px', borderRadius: '8px', background: 'transparent', color: T.colors.primary, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-indigo-50" title="Télécharger">
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
