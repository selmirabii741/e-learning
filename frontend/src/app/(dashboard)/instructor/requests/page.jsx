'use client';
import { useEffect, useState, useCallback } from 'react';
import { coursesAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    ArrowLeft, Users, Loader2, CheckCircle, XCircle,
    Clock, BookOpen, Mail, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

/* ── Design tokens ───────────────────────────────────────────────────── */
const T = {
    card: {
        bg: 'var(--bg-card)',
        border: '1.5px solid var(--border-strong)',
        radius: '14px',
        shadow: '0 2px 10px rgba(0,0,0,0.12), 0 4px 24px rgba(0,0,0,0.10)',
    },
    text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
    },
};

/* ── Status Badge ────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
    const map = {
        pending:  { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)', icon: Clock, label: 'En attente' },
        approved: { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)',  icon: CheckCircle, label: 'Approuvée' },
        rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)',  icon: XCircle, label: 'Refusée' },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 600,
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
        }}>
            <Icon style={{ width: 12, height: 12 }} /> {s.label}
        </span>
    );
}

/* ── Stat Pill ────────────────────────────────────────────────────────── */
function StatPill({ count, label, color, active, onClick }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            background: active ? `${color}20` : 'var(--bg-card)',
            color: active ? color : T.text.secondary,
            border: `1.5px solid ${active ? color : 'var(--border)'}`,
            cursor: 'pointer', transition: 'all 0.15s',
        }}>
            <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{count}</span>
            {label}
        </button>
    );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function InstructorAccessRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [processingId, setProcessingId] = useState(null);

    const load = useCallback(() => {
        coursesAPI.getAccessRequests(filter)
            .then(({ data }) => {
                setRequests(data.requests || []);
                setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
            })
            .catch(() => toast.error('Erreur chargement'))
            .finally(() => setLoading(false));
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (requestId, action) => {
        setProcessingId(requestId);
        try {
            const fn = action === 'approve' ? coursesAPI.approveRequest : coursesAPI.rejectRequest;
            const { data } = await fn(requestId);
            toast.success(data.message);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = filter
        ? requests.filter(r => r.status === filter)
        : requests;

    return (
        <Sidebar>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                {/* ── Header ── */}
                <div style={{
                    marginBottom: 24, paddingBottom: 16,
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/instructor" style={{
                            padding: '8px', border: '1px solid var(--border)',
                            borderRadius: 8, background: 'var(--bg-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: T.text.primary, textDecoration: 'none',
                        }}>
                            <ArrowLeft style={{ width: 16, height: 16 }} />
                        </Link>
                        <div>
                            <h1 style={{
                                fontSize: 20, fontWeight: 700, color: T.text.primary,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <ShieldCheck style={{ width: 22, height: 22, color: '#fbbf24' }} />
                                Demandes d'accès
                            </h1>
                            <p style={{ fontSize: 13, color: T.text.muted, marginTop: 3 }}>
                                Gérez les demandes d'accès à vos cours
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Filter pills ── */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    <StatPill count={counts.pending + counts.approved + counts.rejected} label="Toutes" color="var(--accent)" active={!filter} onClick={() => setFilter('')} />
                    <StatPill count={counts.pending} label="En attente" color="#fbbf24" active={filter === 'pending'} onClick={() => setFilter('pending')} />
                    <StatPill count={counts.approved} label="Approuvées" color="#22c55e" active={filter === 'approved'} onClick={() => setFilter('approved')} />
                    <StatPill count={counts.rejected} label="Refusées" color="#ef4444" active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
                </div>

                {/* ── Table ── */}
                <div style={{
                    background: T.card.bg, border: T.card.border,
                    borderRadius: T.card.radius, overflow: 'hidden',
                    boxShadow: T.card.shadow,
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.8fr 1.5fr 1.5fr 120px 140px',
                        padding: '10px 20px',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-strong)',
                    }}>
                        {['ÉTUDIANT', 'COURS', 'DATE', 'STATUT', 'ACTIONS'].map(h => (
                            <span key={h} style={{
                                fontSize: 11, fontWeight: 700, color: T.text.muted,
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                            }}>{h}</span>
                        ))}
                    </div>

                    {/* Body */}
                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ fontSize: 13, color: T.text.muted }}>Chargement…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <ShieldCheck size={40} style={{ color: T.text.muted, margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, marginBottom: 4 }}>
                                Aucune demande
                            </p>
                            <p style={{ fontSize: 13, color: T.text.muted }}>
                                {filter ? 'Aucune demande avec ce statut' : 'Les demandes d\'accès apparaîtront ici'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((req) => {
                            const date = new Date(req.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            });
                            const isProcessing = processingId === req._id;
                            return (
                                <div
                                    key={req._id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.8fr 1.5fr 1.5fr 120px 140px',
                                        alignItems: 'center',
                                        padding: '14px 20px',
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Student */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                            background: `linear-gradient(135deg, hsl(${(req.student?.name?.charCodeAt(0) || 0) * 7 % 360}, 60%, 50%), hsl(${(req.student?.name?.charCodeAt(0) || 0) * 7 % 360 + 30}, 60%, 40%))`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 700, color: '#fff',
                                        }}>
                                            {req.student?.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{req.student?.name}</p>
                                            <p style={{ fontSize: 11, color: T.text.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <Mail style={{ width: 10, height: 10 }} /> {req.student?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Course */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                        <BookOpen style={{ width: 14, height: 14, color: T.text.muted, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: T.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {req.course?.title}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div style={{ fontSize: 12, color: T.text.secondary }}>{date}</div>

                                    {/* Status */}
                                    <div><StatusBadge status={req.status} /></div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {req.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleAction(req._id, 'approve')}
                                                    disabled={isProcessing}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '5px 10px', borderRadius: 7,
                                                        fontSize: 11, fontWeight: 600,
                                                        background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                                                        border: '1px solid rgba(34,197,94,0.25)',
                                                        cursor: isProcessing ? 'wait' : 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.2)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                                                >
                                                    {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={11} />}
                                                    Oui
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req._id, 'reject')}
                                                    disabled={isProcessing}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '5px 10px', borderRadius: 7,
                                                        fontSize: 11, fontWeight: 600,
                                                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                                        border: '1px solid rgba(239,68,68,0.25)',
                                                        cursor: isProcessing ? 'wait' : 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                                >
                                                    <XCircle size={11} /> Non
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: 11, color: T.text.muted, fontStyle: 'italic' }}>
                                                {req.status === 'approved' ? 'Inscrit ✓' : 'Refusé'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
