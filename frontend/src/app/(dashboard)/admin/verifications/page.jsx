'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import { ShieldCheck, Clock, XCircle, CheckCircle, Eye, FileText, Search, MessageSquare, User, Loader2 } from 'lucide-react';
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

const statusConfig = {
    pending: { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,.1)', icon: Clock },
    approved: { label: 'Approuvé', color: '#10B981', bg: 'rgba(16,185,129,.1)', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: '#ef4444', bg: 'rgba(239,68,68,.1)', icon: XCircle },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: '10px',
            background: cfg.bg, border: `1px solid ${cfg.color}30`,
            fontSize: 12, fontWeight: 700, color: cfg.color,
        }}>
            <Icon size={14} /> {cfg.label}
        </span>
    );
}

function CertificateModal({ verification, onClose, onApprove, onReject }) {
    const [comment, setComment] = useState('');
    const [action, setAction] = useState(null);

    if (!verification) return null;

    const certSrc = verification.certificateData
        ? `data:${verification.certificateType};base64,${verification.certificateData}`
        : null;
    const isPdf = verification.certificateType === 'application/pdf';
    const prof = verification.userId;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 900, maxHeight: '88vh',
                    background: '#fff', border: T.card.border, borderRadius: '28px',
                    boxShadow: '0 24px 64px rgba(0,0,0,.15)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'jumpIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 32px', borderBottom: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#F8FAFC'
                }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em' }}>
                            Vérification du profil
                        </h2>
                        <p style={{ fontSize: 14, color: T.text.muted, marginTop: 4, fontWeight: 500 }}>
                            {prof?.name} ({prof?.email})
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <StatusBadge status={verification.status} />
                        <button onClick={onClose} style={{
                            width: 36, height: 36, borderRadius: '18px', background: '#fff',
                            border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: T.text.muted, transition: 'all 0.2s'
                        }} className="hover:bg-slate-100 hover:text-[#B7C2B8]">
                            <XCircle size={18} />
                        </button>
                    </div>
                </div>

                {/* Content (Scrollable) */}
                <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
                    <p style={{ fontSize: 14, color: T.text.secondary, marginBottom: 24, fontWeight: 500 }}>
                        Vérifiez les informations du professeur avant de valider son accès à la plateforme.<br />
                        Le certificat doit être lisible et correspondre au profil renseigné.
                    </p>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={18} style={{ color: T.colors.primary }} /> Certificat fourni
                    </h3>

                    {certSrc && (
                        <div style={{
                            borderRadius: '20px', overflow: 'hidden',
                            border: '1px solid #E2E8F0', padding: 16,
                            marginBottom: 32, background: '#F8FAFC',
                        }}>
                            <div style={{
                                background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                minHeight: 300
                            }}>
                                {isPdf ? (
                                    <iframe src={certSrc} style={{ width: '100%', height: 400, border: 'none' }} title="Certificate PDF" />
                                ) : (
                                    <img src={certSrc} alt="Certificate" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                                <a href={certSrc} target="_blank" rel="noreferrer" style={{
                                    padding: '10px 20px', background: '#fff', border: '1px solid #E2E8F0',
                                    borderRadius: '12px', color: T.text.primary, fontSize: 13, fontWeight: 700,
                                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }} className="hover:bg-slate-50">
                                    <Eye size={16} /> Ouvrir le certificat
                                </a>
                                <a href={certSrc} download={verification.certificateName || "certificat"} style={{
                                    padding: '10px 20px', background: '#fff', border: '1px solid #E2E8F0',
                                    borderRadius: '12px', color: T.text.primary, fontSize: 13, fontWeight: 700,
                                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }} className="hover:bg-slate-50">
                                    <ShieldCheck size={16} /> Télécharger
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Information cards */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32,
                    }}>
                        {[
                            { label: 'Spécialité', value: prof?.speciality || '—' },
                            { label: 'Inscrit le', value: prof?.createdAt ? new Date(prof.createdAt).toLocaleDateString('fr-FR') : '—' },
                            { label: 'E-mail', value: prof?.email || '—' },
                            { label: 'Statut du compte', value: 'En attente de validation' },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '16px 20px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <p style={{ fontSize: 12, color: T.text.muted, marginBottom: 4, fontWeight: 600 }}>{item.label}</p>
                                <p style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, wordBreak: 'break-all' }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {verification.status === 'pending' && (
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: T.text.secondary, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <MessageSquare size={16} /> Commentaire (optionnel)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ajoutez un commentaire qui sera envoyé au professeur..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    background: '#fff',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '16px', color: T.text.primary, fontSize: 14,
                                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    transition: 'border-color 0.2s'
                                }}
                                className="focus:border-indigo-500"
                            />
                        </div>
                    )}

                    {verification.status !== 'pending' && verification.adminComment && (
                        <div style={{
                            padding: '16px 20px', borderRadius: '16px',
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                        }}>
                            <p style={{ fontSize: 12, color: T.text.muted, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commentaire admin</p>
                            <p style={{ fontSize: 14, color: T.text.primary, fontWeight: 500 }}>{verification.adminComment}</p>
                        </div>
                    )}
                </div>

                {/* Action Footer (Sticky) */}
                <div style={{
                    padding: '20px 32px', borderTop: '1px solid #E2E8F0',
                    background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 12
                }}>
                    <button onClick={onClose} style={{
                        padding: '12px 24px', background: '#fff', border: '1px solid #E2E8F0',
                        borderRadius: '14px', color: T.text.secondary, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s'
                    }} className="hover:bg-slate-50">
                        Fermer
                    </button>
                    {verification.status === 'pending' && (
                        <>
                            <button
                                disabled={action === 'rejecting'}
                                onClick={async () => {
                                    setAction('rejecting');
                                    await onReject(verification._id, comment);
                                    setAction(null);
                                }}
                                style={{
                                    padding: '12px 24px', background: '#fff',
                                    border: `1px solid ${T.colors.danger}`,
                                    borderRadius: '14px', color: T.colors.danger, fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    opacity: action === 'rejecting' ? 0.7 : 1, transition: 'all 0.2s'
                                }}
                                className="hover:bg-red-50"
                            >
                                {action === 'rejecting' ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                Refuser
                            </button>
                            <button
                                disabled={action === 'approving'}
                                onClick={async () => {
                                    setAction('approving');
                                    await onApprove(verification._id, comment);
                                    setAction(null);
                                }}
                                style={{
                                    padding: '12px 28px', background: T.colors.success, border: 'none',
                                    borderRadius: '14px', color: '#fff', fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                    opacity: action === 'approving' ? 0.7 : 1, transition: 'all 0.2s',
                                    boxShadow: `0 4px 14px ${T.colors.success}40`
                                }}
                                className="hover:bg-indigo-600"
                            >
                                {action === 'approving' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                Approuver
                            </button>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes jumpIn {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

export default function VerificationsPage() {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const { user } = useAuthStore();

    const fetchVerifications = async () => {
        try {
            const params = {};
            if (filter) params.status = filter;
            const { data } = await adminAPI.getVerifications(params);
            setVerifications(data.verifications);
        } catch {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user) fetchVerifications(); }, [user, filter]);

    const openDetails = async (id) => {
        try {
            const { data } = await adminAPI.getVerification(id);
            setSelectedVerification(data.verification);
            setSelectedId(id);
        } catch {
            toast.error('Erreur lors du chargement du détail');
        }
    };
    debugger
    const handleApprove = async (id, comment) => {
        try {
            await adminAPI.approveVerification(id, { comment });
            toast.success('Professeur approuvé !');
            setSelectedId(null);
            setSelectedVerification(null);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur');
        }
    };

    const handleReject = async (id, comment) => {
        try {
            await adminAPI.rejectVerification(id, { comment });
            toast.success('Professeur rejeté');
            setSelectedId(null);
            setSelectedVerification(null);
            fetchVerifications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur');
        }
    };

    const filtered = verifications.filter((v) =>
        !search || v.userId?.name?.toLowerCase().includes(search.toLowerCase())
        || v.userId?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const pendingCount = verifications.filter(v => v.status === 'pending').length;
    const approvedCount = verifications.filter(v => v.status === 'approved').length;
    const rejectedCount = verifications.filter(v => v.status === 'rejected').length;
    const allCount = verifications.length;

    const tabs = [
        { id: '', label: 'Tous', count: allCount },
        { id: 'pending', label: 'En attente', count: pendingCount },
        { id: 'approved', label: 'Approuvés', count: approvedCount },
        { id: 'rejected', label: 'Rejetés', count: rejectedCount }
    ];

    const inputStyle = {
        background: '#fff', border: '1px solid #E2E8F0',
        color: T.text.primary, borderRadius: '14px', fontSize: 14, outline: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s',
    };

    return (
        <Sidebar>
            <div className="min-h-full" style={{
                background: 'var(--bg-body)',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(217, 244, 91, 0.05) 0%, transparent 60%)',
                margin: '-20px', padding: '32px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                    {/* Hero Header */}
                    <div style={{
                        background: '#fff', border: '1px solid #E2E8F0',
                        borderRadius: '24px', padding: '32px 40px', marginBottom: 32,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 24, position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(154, 217, 75, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}>
                                    <ShieldCheck size={22} className="text-white" />
                                </div>
                                <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em' }}>
                                    Validation des professeurs
                                </h1>
                            </div>
                            <p style={{ fontSize: 15, color: T.text.secondary, fontWeight: 500, maxWidth: 500 }}>
                                Examinez les demandes d’inscription et validez les certificats des enseignants pour garantir la qualité de la plateforme.
                            </p>
                        </div>
                        {pendingCount > 0 && (
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, background: '#fef3c7', border: '1px solid #fde68a', padding: '12px 24px', borderRadius: '16px' }}>
                                <Clock size={20} style={{ color: '#d97706' }} />
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{pendingCount} en attente</p>
                                    <p style={{ fontSize: 12, color: '#b45309', fontWeight: 600, marginTop: 4 }}>Nouvelles demandes</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filters & Search */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 280, position: 'relative', maxWidth: 450 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: T.text.muted }} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, e-mail ou statut..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ ...inputStyle, width: '100%', padding: '12px 16px 12px 44px', fontWeight: 500 }}
                                className="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 8, background: '#fff', padding: '6px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} className="overflow-x-auto hide-scrollbar">
                            {tabs.map((tab) => {
                                const isActive = filter === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilter(tab.id)}
                                        style={{
                                            padding: '8px 16px', borderRadius: '12px',
                                            background: isActive ? T.colors.primary : 'transparent',
                                            color: isActive ? '#fff' : T.text.secondary,
                                            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                            border: 'none', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
                                        }}
                                        className={!isActive ? 'hover:bg-slate-50' : ''}
                                    >
                                        {tab.label}
                                        <span style={{
                                            background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                            color: isActive ? '#fff' : T.text.muted,
                                            padding: '2px 8px', borderRadius: '10px', fontSize: 12
                                        }}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Table / Cards */}
                    {loading ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} style={{ height: 90, borderRadius: '22px', background: '#fff', border: '1px solid #E2E8F0' }} className="animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '80px 20px',
                            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
                        }}>
                            <div style={{ width: 72, height: 72, borderRadius: '20px', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <ShieldCheck size={36} style={{ color: T.text.muted }} />
                            </div>
                            <p style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, marginBottom: 8 }}>Aucune demande trouvée</p>
                            <p style={{ fontSize: 15, color: T.text.muted, fontWeight: 500 }}>
                                Essayez de modifier les filtres ou la recherche.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            background: '#fff', border: '1px solid #E2E8F0',
                            borderRadius: '22px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
                        }}>
                            {/* Table header (hidden on mobile) */}
                            <div className="hidden md:grid" style={{
                                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px',
                                padding: '16px 24px', borderBottom: '1px solid #E2E8F0',
                                background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 10
                            }}>
                                {['Professeur', 'Certificat', 'Statut', 'Date', 'Action'].map((h, i) => (
                                    <p key={h} style={{ fontSize: 12, fontWeight: 700, color: T.text.muted, textTransform: 'uppercase', letterSpacing: '.08em', textAlign: i === 4 ? 'right' : 'left' }}>
                                        {h}
                                    </p>
                                ))}
                            </div>

                            {/* Rows */}
                            <div>
                                {filtered.map((v, index) => (
                                    <div
                                        key={v._id}
                                        className="hover:bg-slate-50 flex flex-col md:grid"
                                        style={{
                                            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 120px',
                                            padding: '20px 24px', gap: '16px', alignItems: 'center',
                                            borderBottom: index === filtered.length - 1 ? 'none' : '1px solid #E2E8F0',
                                            transition: 'background .2s', cursor: 'pointer',
                                        }}
                                        onClick={() => openDetails(v._id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: '14px',
                                                background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, color: '#fff', fontWeight: 800, fontSize: 16,
                                                boxShadow: '0 4px 10px rgba(217, 244, 91, 0.2)'
                                            }}>
                                                {v.userId?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ fontSize: 15, fontWeight: 700, color: T.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.userId?.name}</p>
                                                <p style={{ fontSize: 13, color: T.text.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{v.userId?.email}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FileText size={18} style={{ color: T.text.secondary }} />
                                            </div>
                                            <span style={{ fontSize: 14, color: T.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                                {v.certificateName || '—'}
                                            </span>
                                        </div>

                                        <div style={{ width: '100%' }}>
                                            <StatusBadge status={v.status} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: T.text.secondary, fontWeight: 500, width: '100%' }}>
                                            <Clock size={16} style={{ color: T.text.muted }} />
                                            {new Date(v.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>

                                        <div style={{ width: '100%', textAlign: 'right' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openDetails(v._id); }}
                                                style={{
                                                    padding: '10px 18px', borderRadius: '12px',
                                                    background: '#fff', border: '1px solid #E2E8F0',
                                                    color: T.colors.primary, fontSize: 13, fontWeight: 700,
                                                    cursor: 'pointer', fontFamily: 'inherit',
                                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                                    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                }}
                                                className="hover:bg-violet-50 hover:border-violet-200"
                                            >
                                                <Eye size={16} /> Voir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail modal */}
                {selectedVerification && (
                    <CertificateModal
                        verification={selectedVerification}
                        onClose={() => { setSelectedId(null); setSelectedVerification(null); }}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                )}
            </div>
        </Sidebar>
    );
}
