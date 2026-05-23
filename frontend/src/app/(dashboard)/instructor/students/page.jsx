'use client';
import { useEffect, useState, useMemo } from 'react';
import { coursesAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    Users, Loader2, ArrowLeft, Search, Mail, BookOpen,
    TrendingUp, CheckCircle, Clock, ChevronDown, ShieldCheck,
    MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

/* ── Progress Badge ──────────────────────────────────────────────────── */
function ProgressBadge({ pct }) {
    const color = pct === 100 ? '#22c55e' : pct > 0 ? '#f59e0b' : 'var(--text-muted)';
    const bg = pct === 100 ? 'rgba(34,197,94,0.1)' : pct > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)';
    const Icon = pct === 100 ? CheckCircle : pct > 0 ? TrendingUp : Clock;
    const label = pct === 100 ? 'Terminé' : pct > 0 ? `${pct}%` : 'Non commencé';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            fontSize: 11, fontWeight: 600,
            background: bg, color,
            border: `1px solid ${color}30`,
        }}>
            <Icon style={{ width: 11, height: 11 }} /> {label}
        </span>
    );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function InstructorStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [total, setTotal] = useState(0);
    const [contactingId, setContactingId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        coursesAPI.getMyStudents()
            .then(({ data }) => {
                setStudents(data.students || []);
                setTotal(data.total || 0);
            })
            .catch(() => toast.error('Erreur chargement des étudiants'))
            .finally(() => setLoading(false));
    }, []);

    // Extract unique course names for filter
    const courseNames = useMemo(() => {
        const names = new Set();
        students.forEach(s => s.courses?.forEach(c => names.add(c.title)));
        return [...names].sort();
    }, [students]);

    // Filter students
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return students.filter(s => {
            if (q && !s.name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q)) return false;
            if (filterCourse && !s.courses?.some(c => c.title === filterCourse)) return false;
            return true;
        });
    }, [students, search, filterCourse]);

    const inputStyle = {
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        color: T.text.primary, borderRadius: 8, fontSize: 13, outline: 'none',
    };

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
                                letterSpacing: '-0.02em',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <Users style={{ width: 22, height: 22, color: 'var(--icon-students)' }} />
                                Mes Étudiants
                            </h1>
                            <p style={{ fontSize: 13, color: T.text.muted, marginTop: 3 }}>
                                {loading ? '…' : `${total} étudiant${total !== 1 ? 's' : ''} inscrits dans vos cours`}
                            </p>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                        <ShieldCheck style={{ width: 14, height: 14, color: '#22c55e' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>
                            Accès restreint à vos cours
                        </span>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            type="text" placeholder="Rechercher un étudiant…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ ...inputStyle, width: '100%', padding: '9px 12px 9px 36px' }}
                            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
                            style={{
                                ...inputStyle, padding: '9px 32px 9px 12px',
                                cursor: 'pointer', appearance: 'none', minWidth: 180,
                                color: T.text.secondary,
                            }}
                        >
                            <option value="">Tous les cours</option>
                            {courseNames.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                    {(search || filterCourse) && (
                        <button onClick={() => { setSearch(''); setFilterCourse(''); }} style={{
                            padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                            background: 'var(--danger-bg)', color: 'var(--danger)',
                            border: '1px solid var(--danger)', cursor: 'pointer',
                        }}>
                            Réinitialiser
                        </button>
                    )}
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
                        gridTemplateColumns: '2fr 1.5fr 1.2fr 100px 120px 120px',
                        padding: '10px 20px',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-strong)',
                    }}>
                        {['ÉTUDIANT', 'EMAIL', 'COURS', 'PROGRESSION', 'INSCRIT LE', 'ACTIONS'].map(h => (
                            <span key={h} style={{
                                fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                                letterSpacing: '0.07em', textTransform: 'uppercase',
                                textAlign: h === 'ACTIONS' ? 'right' : 'left'
                            }}>{h}</span>
                        ))}
                    </div>

                    {/* Body */}
                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chargement…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center' }}>
                            <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, marginBottom: 4 }}>Aucun étudiant trouvé</p>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                {search || filterCourse ? 'Modifiez vos filtres' : 'Les étudiants apparaîtront ici quand ils rejoindront vos cours'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((student, i) => {
                            const date = student.createdAt
                                ? new Date(student.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—';
                            return (
                                <div
                                    key={student._id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1.5fr 1.2fr 100px 120px 120px',
                                        alignItems: 'center',
                                        padding: '14px 20px',
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Name + Avatar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <div style={{
                                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                            background: `linear-gradient(135deg, hsl(${(student.name?.charCodeAt(0) || 0) * 7 % 360}, 60%, 50%), hsl(${(student.name?.charCodeAt(0) || 0) * 7 % 360 + 30}, 60%, 40%))`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 700, color: '#fff',
                                        }}>
                                            {student.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: T.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {student.name}
                                            </p>
                                            <p style={{ fontSize: 11, color: T.text.muted }}>
                                                {student.courseCount} cours
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.text.secondary, minWidth: 0 }}>
                                        <Mail size={12} style={{ color: T.text.muted, flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</span>
                                    </div>

                                    {/* Courses */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {student.courses?.slice(0, 2).map(c => (
                                            <span key={c.courseId} style={{
                                                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                                                borderRadius: 5, whiteSpace: 'nowrap',
                                                background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>
                                                {c.title}
                                            </span>
                                        ))}
                                        {student.courses?.length > 2 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '2px 6px',
                                                borderRadius: 5, background: 'rgba(255,255,255,0.05)',
                                                color: T.text.muted,
                                            }}>
                                                +{student.courses.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress */}
                                    <div>
                                        <ProgressBadge pct={student.avgProgress || 0} />
                                    </div>

                                    {/* Date */}
                                    <div style={{ fontSize: 12, color: T.text.secondary }}>{date}</div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => {
                                                setContactingId(student._id);
                                                // Assuming messages route works with user ID directly
                                                router.push(`/messages/${student._id}`);
                                            }}
                                            disabled={contactingId === student._id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                                                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                                                color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)',
                                                cursor: contactingId === student._id ? 'wait' : 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={e => {
                                                if (contactingId !== student._id) {
                                                    e.currentTarget.style.transform = 'scale(1.03)';
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (contactingId !== student._id) {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))';
                                                }
                                            }}
                                        >
                                            {contactingId === student._id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <MessageSquare size={14} />
                                            )}
                                            <span className="hidden sm:inline">Contacter</span>
                                        </button>
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
