'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { coursesAPI, progressAPI, chatAPI, aiAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    BookOpen, CheckCircle, Clock, ChevronRight, ChevronLeft,
    Loader2, FileText, Download, Maximize2, X, Eye,
    SendHorizontal, Sparkles, User, MessageSquare, Lightbulb, HelpCircle,
    RotateCcw, Copy, Check, Upload, AlertCircle, CheckCircle2, MessageCircle,
    BrainCircuit, ClipboardList, PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

/* ── Progress Ring ── */
function ProgressRing({ pct }) {
    const r = 20, c = 2 * Math.PI * r;
    const color = pct === 100 ? '#10b981' : '#6366f1';
    return (
        <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="4" />
                <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
                style={{ color: 'var(--text-primary)' }}>{pct}%</span>
        </div>
    );
}

/* ── PDF Viewer ── */
function PdfViewer({ courseId, lessonId, title }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        let revoke = null;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setBlobUrl(null);

        const fetchPdf = async () => {
            try {
                const { data } = await coursesAPI.getLessonPdf(courseId, lessonId);
                if (cancelled) return;
                const byteChars = atob(data.pdf);
                const byteArray = new Uint8Array(byteChars.length);
                for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                revoke = url;
                setBlobUrl(url);
            } catch (err) {
                if (!cancelled) setError('Impossible de charger le document');
                console.error('PDF fetch error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchPdf();
        return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
    }, [courseId, lessonId]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    /* Error state */
    if (error) return (
        <div className="rounded-2xl border p-16 flex flex-col items-center justify-center text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <FileText className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{error}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vérifiez votre connexion et réessayez</p>
        </div>
    );

    return (
        <>
            {/* ── Fullscreen Overlay ── */}
            {isFullscreen && blobUrl && (
                <div className="fixed inset-0 z-[9999] flex flex-col"
                    style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}>
                    <div className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(20,184,166,0.15)' }}>
                                <FileText className="w-4 h-4 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{title || 'Document'}</p>
                                <p className="text-[11px] text-white/40">Mode plein écran — Échap pour fermer</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={blobUrl} download={`${title || 'cours'}.pdf`}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white transition-colors"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Download className="w-3.5 h-3.5" /> Télécharger
                            </a>
                            <button onClick={() => setIsFullscreen(false)}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-red-500/20"
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <X className="w-3.5 h-3.5" /> Fermer
                            </button>
                        </div>
                    </div>
                    <iframe src={blobUrl} className="flex-1 w-full border-0" title={title || 'PDF'} />
                </div>
            )}

            {/* ── Inline Card Viewer ── */}
            <div className="card p-0 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-sidebar)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: '#f1f5f9' }}>
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                                Document de cours
                            </span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PDF • Lecture en ligne</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {blobUrl && (
                            <a href={blobUrl} download={`${title || 'cours'}.pdf`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white border-slate-200 text-slate-650 hover:bg-slate-50 shadow-sm"
                            >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span className="hidden sm:inline">Télécharger</span>
                            </a>
                        )}
                        <button onClick={() => setIsFullscreen(true)} disabled={!blobUrl}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 border bg-white border-slate-200 text-slate-650 hover:bg-slate-50 shadow-sm"
                        >
                            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Plein écran</span>
                        </button>
                    </div>
                </div>

                {/* PDF Content */}
                <div className="relative flex-1" style={{ minHeight: '500px', height: '65vh' }}>
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                            style={{ background: 'var(--bg-card)' }}>
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'rgba(20,184,166,0.08)' }}>
                                    <Loader2 className="w-7 h-7 animate-spin text-teal-400" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>Chargement du document</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Veuillez patienter…</p>
                            </div>
                        </div>
                    ) : blobUrl ? (
                        <iframe src={blobUrl} className="w-full h-full border-0 absolute inset-0" title={title || 'PDF'} />
                    ) : null}
                </div>
            </div>
        </>
    );
}

/* ── No PDF Placeholder ── */
function NoPdfPlaceholder() {
    return (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
                <FileText className="w-9 h-9 text-[#4F46E5]" />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Aucun document disponible
            </h3>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                L'instructeur n'a pas encore ajouté de document PDF pour cette leçon.
            </p>
        </div>
    );
}

/* ── Chat Components ── */

const QUICK_REPLIES = [
    { icon: <Lightbulb className="w-3 h-3" />, label: 'Approfondir' },
    { icon: <BookOpen className="w-3 h-3" />, label: 'Illustrer' },
    { icon: <HelpCircle className="w-3 h-3" />, label: 'Synthétiser' },
    { icon: <RotateCcw className="w-3 h-3" />, label: 'Reformuler' },
];
function TypingIndicator() {
    return (
        <div className="flex gap-2.5 items-end pl-0.5 animate-pulse">
            <div className="w-6 h-6 rounded-[8px] bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div
                className="bg-slate-50 border border-slate-200/80 rounded-[14px] rounded-bl-[4px]
          px-4 py-3 flex items-center gap-[5px]
          shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
                {[0, 130, 260].map((d) => (
                    <span
                        key={d}
                        className="w-[5px] h-[5px] rounded-full bg-slate-400"
                        style={{ animation: `tdot 1.3s cubic-bezier(.45,.05,.55,.95) ${d}ms infinite` }}
                    />
                ))}
            </div>
        </div>
    );
}


function CopyBtn({ text }) {
    const [done, setDone] = useState(false);
    const go = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); };
    return (
        <button
            onClick={go}
            title="Copier"
            className="opacity-0 group-hover:opacity-100 transition-all duration-200
        shrink-0 p-1.5 rounded-[8px] hover:bg-slate-100/85
        text-slate-400 hover:text-slate-600"
        >
            {done
                ? <Check className="w-3 h-3 text-emerald-500" />
                : <Copy className="w-3 h-3" />}
        </button>
    );
}


function MessageBubble({ msg, index }) {
    const isUser = msg.role === 'user';
    const time = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div
            className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            style={{
                animation: 'msgIn .2s cubic-bezier(.22,.68,0,1.2) both',
                animationDelay: `${Math.min(index * 20, 180)}ms`,
            }}
        >
            <div
                className={`w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0 self-end mb-[3px]
          ${isUser
                        ? 'bg-indigo-600 shadow-sm shadow-indigo-500/20'
                        : 'bg-gradient-to-tr from-indigo-500 to-indigo-600 shadow-sm shadow-indigo-500/20'
                    }`}
            >
                {isUser
                    ? <User className="w-3 h-3 text-white" />
                    : <Sparkles className="w-3 h-3 text-white" />}
            </div>

            <div className={`group flex flex-col gap-[5px] max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`rounded-[14px] text-[13px] leading-[1.75]
            ${isUser
                            ? 'bg-indigo-600 text-white rounded-br-[4px] px-4 py-[10px] shadow-sm shadow-indigo-500/10'
                            : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-bl-[4px] px-4 py-[12px] shadow-[0_2px_10px_rgba(0,0,0,0.015)]'
                        }`}
                >
                    {isUser
                        ? <p className="m-0 font-medium">{msg.content}</p>
                        : (
                            <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <ReactMarkdown
                                        className={`
                       prose prose-sm max-w-none
                       [&_p]:text-slate-700 [&_p]:leading-[1.8] [&_p]:my-[6px] [&_p]:text-[13px]
                       [&_h1]:text-indigo-600 [&_h1]:font-bold [&_h1]:text-[14px] [&_h1]:mt-[18px] [&_h1]:mb-[8px]
                       [&_h2]:text-indigo-600 [&_h2]:font-bold [&_h2]:text-[13px] [&_h2]:mt-[16px] [&_h2]:mb-[6px]
                       [&_h3]:text-indigo-600 [&_h3]:font-semibold  [&_h3]:text-[12px] [&_h3]:mt-[12px] [&_h3]:mb-[4px]
                       [&_strong]:text-slate-900 [&_strong]:font-bold
                       [&_em]:text-slate-800 [&_em]:italic
                       [&_ul]:my-[8px] [&_ul]:space-y-[4px]
                       [&_ol]:my-[8px] [&_ol]:space-y-[4px]
                       [&_li]:text-slate-700 [&_li]:text-[13px] [&_li]:leading-[1.65]
                       [&_li::marker]:text-indigo-500 [&_li::marker]:font-bold
                       [&_code]:bg-slate-100 [&_code]:text-indigo-600 [&_code]:px-[6px] [&_code]:py-[2px]
                       [&_code]:rounded-[5px] [&_code]:text-[11.5px] [&_code]:font-mono [&_code]:font-semibold
                       [&_code]:border [&_code]:border-slate-200/50
                       [&_pre]:bg-slate-950 [&_pre]:border [&_pre]:border-slate-800
                       [&_pre]:rounded-[10px] [&_pre]:p-[12px] [&_pre]:my-[10px]
                       [&_pre]:overflow-x-auto [&_pre]:text-[11.5px] [&_pre]:text-slate-300
                       [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/50
                       [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 [&_blockquote]:italic [&_blockquote]:my-2
                       [&_a]:text-indigo-600 [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline
                       [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                     `}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                <CopyBtn text={msg.content} />
                            </div>
                        )
                    }
                </div>
                {time && (
                    <span className="text-[10px] text-slate-400 tabular-nums px-0.5 leading-none">
                        {time}
                    </span>
                )}
            </div>
        </div>
    );
}


// PdfUploadZone removed


function EmptyState({ onSuggest, courseId, lessonId, pdfInfo, setPdfInfo }) {
    const cards = [
        { emoji: '🎯', label: 'Synthétiser les objectifs pédagogiques' },
        { emoji: '📌', label: 'Identifier les concepts clés' },
        { emoji: '💡', label: 'Approfondir la première notion' },
        { emoji: '🔗', label: 'Illustrer avec un cas pratique' },
    ];
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 select-none px-4 mt-8">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center shadow-[0_4px_16px_rgba(79,70,229,0.04)]">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-slate-800 font-bold text-[15px] mb-1">Assistant Pédagogique IA</h2>
                    <p className="text-slate-500 text-[13px] leading-relaxed max-w-[300px]">
                        Interrogez l'assistant sur le contenu de cette leçon. Le document a été analysé pour vous fournir des réponses ciblées.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-[8px] w-full max-w-[360px] mt-4">
                {cards.map((c) => (
                    <button
                        key={c.label}
                        onClick={() => onSuggest(c.label)}
                        className="text-left px-3.5 py-3 rounded-[12px]
              bg-white border border-slate-200
              hover:border-indigo-500/40 hover:bg-indigo-50/10
              hover:shadow-[0_4px_12px_rgba(79,70,229,0.04)]
              transition-all duration-200 group"
                    >
                        <span className="text-[15px] block mb-[5px]">{c.emoji}</span>
                        <span className="text-[12px] text-slate-500 group-hover:text-indigo-600 transition-colors leading-snug block font-medium">
                            {c.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}



/* ── Summary Panel ── */
function SummaryPanel({ courseId, lessonId, courseTitle, lessonTitle, onClose }) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generate = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await aiAPI.getLessonSummary(courseId, lessonId);
            setSummary(data.summary);
        } catch (err) {
            setError(err?.response?.data?.message || 'Erreur lors de la génération du résumé.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSummary('');
        generate();
    }, [lessonId]);

    const handleDownload = () => {
        if (!summary) return;
        const fileContent = `Cours : ${courseTitle}\nLeçon : ${lessonTitle}\n\nRésumé :\n${summary}`;
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lesson-summary-${lessonId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Résumé téléchargé !');
    };

    return (
        <aside className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0 border-l h-full flex flex-col bg-white z-50 absolute lg:relative right-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col h-full bg-white text-slate-800">
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Résumé IA</h2>
                            <p className="text-[12px] text-slate-400 font-medium">Synthèse de la leçon</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {summary && !loading && (
                            <button onClick={generate} className="p-2 rounded-lg hover:bg-slate-100 transition-colors group" title="Régénérer">
                                <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors group">
                            <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 cs">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            <p className="text-slate-400 text-sm font-medium">Génération du résumé en cours...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                            <p className="text-red-500 text-sm max-w-[280px] font-medium">{error}</p>
                            <button onClick={generate} className="mt-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Réessayer</button>
                        </div>
                    ) : summary ? (
                        <div className="prose prose-slate max-w-none
                            [&_p]:text-slate-600 [&_p]:text-[13.5px] [&_p]:leading-[1.7] [&_p]:mb-4
                            [&_strong]:text-slate-900 [&_strong]:font-bold
                            [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500"
                        >
                            <ReactMarkdown
                                components={{
                                    h2: ({ children }) => {
                                        const text = children?.toString() || '';
                                        let icon = <FileText className="w-4 h-4 text-indigo-500" />;
                                        if (text.toLowerCase().includes('court') || text.toLowerCase().includes('résumé')) {
                                            icon = <FileText className="w-4 h-4 text-indigo-500" />;
                                        } else if (text.toLowerCase().includes('clés') || text.toLowerCase().includes('clefs') || text.toLowerCase().includes('points')) {
                                            icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                                        } else if (text.toLowerCase().includes('concept') || text.toLowerCase().includes('important')) {
                                            icon = <ClipboardList className="w-4 h-4 text-violet-500" />;
                                        } else if (text.toLowerCase().includes('conclusion')) {
                                            icon = <PlayCircle className="w-4 h-4 text-teal-500" />;
                                        }
                                        return (
                                            <h2 className="flex items-center gap-2 text-slate-800 font-bold text-[14px] mt-6 mb-3 border-b pb-1.5 border-slate-100">
                                                {icon}
                                                {children}
                                            </h2>
                                        );
                                    },
                                    li: ({ children }) => {
                                        return (
                                            <li className="flex items-start gap-2 text-slate-600 text-[13.5px] leading-relaxed my-1.5 list-none pl-0">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-1 flex-shrink-0" />
                                                <span>{children}</span>
                                            </li>
                                        );
                                    }
                                }}
                            >
                                {summary}
                            </ReactMarkdown>
                        </div>
                    ) : null}
                </div>

                {summary && !loading && (
                    <div className="px-6 py-4 border-t border-slate-200/80 bg-white flex items-center justify-between gap-3 flex-shrink-0">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(summary);
                                toast.success("Résumé copié !");
                            }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 shadow-sm flex-1"
                        >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copier</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white shadow-sm flex-1"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Télécharger</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

/* ── Quiz Panel ── */
function QuizPanel({ courseId, lessonId, onClose }) {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    
    // Setup States
    const [isSetup, setIsSetup] = useState(true);
    const [difficulty, setDifficulty] = useState(2); // 1: débutant, 2: intermédiaire, 3: avancé
    const [count, setCount] = useState(5);

    const generate = async (selectedDiff = difficulty, selectedCount = count) => {
        setLoading(true);
        setError('');
        setQuiz(null);
        setAnswers({});
        setShowResults(false);
        setIsSetup(false);
        try {
            const { data } = await aiAPI.getLessonQuiz(courseId, lessonId, selectedCount, selectedDiff);
            setQuiz(data.questions);
        } catch (err) {
            setError(err?.response?.data?.message || 'Erreur lors de la génération du quiz.');
            setIsSetup(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setQuiz(null);
        setAnswers({});
        setShowResults(false);
        setIsSetup(true);
    }, [lessonId]);

    const handleSelect = (qIndex, oIndex) => {
        if (showResults) return;
        setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
    };

    const submitQuiz = () => {
        if (Object.keys(answers).length < quiz.length) return;
        setShowResults(true);
    };

    const score = showResults ? quiz.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0) : 0;

    return (
        <aside className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0 border-l h-full flex flex-col bg-white z-50 absolute lg:relative right-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col h-full bg-white text-slate-800">
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <BrainCircuit className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Quiz de la leçon</h2>
                            <p className="text-[12px] text-slate-400 font-medium">Testez vos connaissances</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isSetup && !loading && (
                            <button onClick={() => setIsSetup(true)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors group" title="Nouveau Quiz (Configuration)">
                                <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors group">
                            <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 cs">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            <p className="text-slate-400 text-sm font-medium">Génération du quiz...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                            <p className="text-red-500 text-sm max-w-[280px] font-medium">{error}</p>
                            <button onClick={() => generate(difficulty, count)} className="mt-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Réessayer</button>
                        </div>
                    ) : isSetup ? (
                        <div className="flex flex-col gap-6 py-2">
                            <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-200/80 flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-slate-800">Difficulté</h3>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { val: 1, label: 'Débutant', color: '#10b981', bg: 'rgba(16,185,129,0.06)', activeBorder: '#10b981' },
                                        { val: 2, label: 'Intermédiaire', color: '#4f46e5', bg: 'rgba(79,70,229,0.06)', activeBorder: '#4f46e5' },
                                        { val: 3, label: 'Avancé', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', activeBorder: '#ef4444' }
                                    ].map((item) => (
                                        <button
                                            key={item.val}
                                            onClick={() => setDifficulty(item.val)}
                                            className="px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 shadow-sm"
                                            style={{
                                                borderColor: difficulty === item.val ? item.activeBorder : '#e2e8f0',
                                                background: difficulty === item.val ? item.bg : '#ffffff',
                                                color: difficulty === item.val ? item.color : '#64748b',
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-200/80 flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-slate-800">Nombre de questions</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {[3, 5, 10, 15].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setCount(num)}
                                            className="px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 shadow-sm"
                                            style={{
                                                borderColor: count === num ? '#4f46e5' : '#e2e8f0',
                                                background: count === num ? 'rgba(79,70,229,0.06)' : '#ffffff',
                                                color: count === num ? '#4f46e5' : '#64748b',
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => generate(difficulty, count)}
                                className="w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10"
                                style={{
                                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                }}
                            >
                                <BrainCircuit className="w-4 h-4" />
                                Générer le quiz
                            </button>
                        </div>
                    ) : quiz ? (
                        <div className="flex flex-col gap-8 pb-10">
                            {showResults && (
                                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col items-center text-center gap-2 shadow-sm">
                                    <h3 className="text-xl font-extrabold text-emerald-800">Score : {score} / {quiz.length}</h3>
                                    <p className="text-emerald-700 text-sm font-semibold">
                                        {score === quiz.length ? "Parfait ! Vous avez tout compris. 🏆" : "Excellent travail ! Continuez à réviser. 🎯"}
                                    </p>
                                </div>
                            )}

                            {quiz.map((q, qIndex) => {
                                const isAnswered = answers[qIndex] !== undefined;
                                const isCorrect = showResults && answers[qIndex] === q.correctAnswer;
                                const isWrong = showResults && answers[qIndex] !== q.correctAnswer;

                                return (
                                    <div key={qIndex} className="flex flex-col gap-4">
                                        <h3 className="text-[15px] font-bold text-slate-800 leading-relaxed">
                                            <span className="text-indigo-600 font-extrabold mr-2">{qIndex + 1}.</span>
                                            {q.question}
                                        </h3>
                                        <div className="flex flex-col gap-2.5">
                                            {q.options.map((opt, oIndex) => {
                                                const selected = answers[qIndex] === oIndex;
                                                let stateClass = "border-slate-200 bg-white hover:border-indigo-500/40 hover:bg-slate-50/50 text-slate-700 shadow-sm";
                                                
                                                if (showResults) {
                                                    if (oIndex === q.correctAnswer) stateClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-sm";
                                                    else if (selected) stateClass = "border-rose-500 bg-rose-50 text-rose-850 font-semibold shadow-sm";
                                                    else stateClass = "border-slate-100 bg-slate-50/30 opacity-50 text-slate-400";
                                                } else if (selected) {
                                                    stateClass = "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold shadow-sm";
                                                }

                                                return (
                                                    <button
                                                        key={oIndex}
                                                        onClick={() => handleSelect(qIndex, oIndex)}
                                                        disabled={showResults}
                                                        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 ${stateClass} text-[14px]`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {showResults && (
                                            <div className={`mt-2 p-4 rounded-xl text-[13px] leading-relaxed border ${isCorrect ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                                                <span className="font-bold block mb-1">Explication :</span>
                                                {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {!showResults ? (
                                <button
                                    onClick={submitQuiz}
                                    disabled={Object.keys(answers).length < quiz.length}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold transition-colors mt-4 shadow-sm"
                                >
                                    Valider mes réponses
                                </button>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => generate(difficulty, count)}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                                    >
                                        Recommencer le quiz
                                    </button>
                                    <button
                                        onClick={() => setIsSetup(true)}
                                        className="w-full py-4 bg-slate-100 border border-slate-200 hover:bg-slate-250 text-slate-700 rounded-xl font-semibold transition-colors"
                                    >
                                        Configurer un autre quiz
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </aside>
    );
}

export default function LearnPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [activeLesson, setActiveLesson] = useState(0);
    const [completing, setCompleting] = useState(false);
    const [loading, setLoading] = useState(true);

    
    // ── Chat State ──
    const [activePanel, setActivePanel] = useState(null); // "chat", "summary", "quiz", or null
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [pdfInfo, setPdfInfo] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const MAX_CHARS = 500;

    // Fetch PDF status on lesson change
    useEffect(() => {
        const currentLesson = data?.course?.lessons?.[activeLesson];
        if (!currentLesson) return;
        setMessages([]);
        setInput('');
        setPdfInfo(null);
        chatAPI.getPdfStatus(id, currentLesson._id).then(({ data: resData }) => {
            if (resData.hasPdf) {
                setPdfInfo({ filename: resData.filename, pages: resData.pages, charCount: resData.charCount });
            }
        }).catch(() => {});
    }, [id, activeLesson, data]);

    useEffect(() => {
        if (activePanel === 'chat') {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, chatLoading, activePanel]);

    const sendMessage = async (text) => {
        const content = (text || input).trim();
        if (!content || chatLoading) return;
        setMessages((p) => [...p, { role: 'user', content, timestamp: Date.now() }]);
        setInput('');
        setChatLoading(true);
        const currentLessonId = data?.course?.lessons?.[activeLesson]?._id;
        try {
            const history = messages.map((m) => ({ role: m.role, content: m.content }));
            const { data: resData } = await chatAPI.ask(id, content, history, currentLessonId);
            setMessages((p) => [...p, { role: 'assistant', content: resData.answer, timestamp: Date.now(), source: resData.source }]);
        } catch {
            setMessages((p) => [...p, { role: 'assistant', content: '❌ Une erreur est survenue.', timestamp: Date.now() }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleOpenPanel = (panelType) => {
        const currentLesson = data?.course?.lessons?.[activeLesson];
        if (!currentLesson) {
            toast.error("Aucune leçon sélectionnée.");
            return;
        }

        const hasContent = !!(currentLesson.pdfUrl || currentLesson.content?.trim());
        if (!hasContent) {
            toast.error("Aucun contenu lisible trouvé pour cette leçon.");
            return;
        }

        setActivePanel(activePanel === panelType ? null : panelType);
    };

    const load = useCallback(async () => {
        try {
            const { data } = await coursesAPI.getById(id);
            setData(data);
        } catch { toast.error('Cours introuvable'); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const completeLesson = async (lessonId) => {
        setCompleting(true);
        try {
            await progressAPI.completeLesson(id, lessonId);
            toast.success('Leçon complétée !');
            const { data: fresh } = await coursesAPI.getById(id);
            setData(fresh);
            if (activeLesson < (data?.course?.lessons?.length ?? 0) - 1)
                setTimeout(() => setActiveLesson(p => p + 1), 600);
        } catch { toast.error('Erreur'); }
        finally { setCompleting(false); }
    };

    if (loading) return (
        <Sidebar>

            <style>{`
                @keyframes msgIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes tdot { 0%,60%,100% { transform:translateY(0); opacity:.3; } 30% { transform:translateY(-5px); opacity:1; } }
                .cs { scrollbar-width: thin; scrollbar-color: transparent transparent; transition: scrollbar-color .3s; }
                .cs:hover { scrollbar-color: var(--scrollbar-thumb) transparent; }
                .cs::-webkit-scrollbar { width: 4px; }
                .cs::-webkit-scrollbar-track { background: transparent; }
                .cs::-webkit-scrollbar-thumb { background: transparent; border-radius: 99px; transition: background .3s; }
                .cs:hover::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); }
                .send-btn:not(:disabled):hover { box-shadow: 0 0 14px rgba(99,102,241,.45); }
            `}</style>
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement du cours…</p>
            </div>
        </Sidebar>
    );
    if (!data) return <Sidebar><p className="text-[#8FA098] p-8">Cours introuvable</p></Sidebar>;

    const { course, progress } = data;
    const lessons = course.lessons || [];
    const lesson = lessons[activeLesson];
    const isDone = (lid) => progress?.completedLessons?.map(String).includes(String(lid));
    const completedCount = progress?.completedLessons?.length ?? 0;
    const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
    const isFirst = activeLesson === 0;
    const isLast = activeLesson === lessons.length - 1;
    const hasPdf = !!lesson?.pdfUrl;

    return (
        <Sidebar>
            {/* ── Top Bar ── */}
            <div className="flex items-center gap-4 mb-0 pb-4 border-b flex-wrap"
                style={{ borderColor: 'var(--border)' }}>
                <Link href={`/courses/${id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all border hover:scale-[1.02] bg-white border-slate-200 text-slate-500 font-semibold"
                >
                    <ChevronLeft className="w-3.5 h-3.5" /> Retour
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-extrabold truncate text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>{course.title}</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3">
                        <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.08)' }}>
                            <div className="h-1.5 rounded-full transition-all duration-700"
                                style={{
                                    width: `${pct}%`,
                                    background: pct === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                                }} />
                        </div>
                        <span className="text-xs font-bold text-slate-650">{pct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenPanel('quiz')}
                            disabled={!lesson}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border"
                            style={{
                                background: activePanel === 'quiz' ? '#10b981' : 'rgba(16,185,129,0.08)',
                                color: activePanel === 'quiz' ? '#ffffff' : '#059669',
                                borderColor: activePanel === 'quiz' ? '#10b981' : 'rgba(16,185,129,0.2)',
                            }}
                        >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Quiz</span>
                        </button>
                        <button
                            onClick={() => handleOpenPanel('summary')}
                            disabled={!lesson}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border"
                            style={{
                                background: activePanel === 'summary' ? '#8b5cf6' : 'rgba(139,92,246,0.08)',
                                color: activePanel === 'summary' ? '#ffffff' : '#7c3aed',
                                borderColor: activePanel === 'summary' ? '#8b5cf6' : 'rgba(139,92,246,0.2)',
                            }}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Résumé</span>
                        </button>
                        <button
                            onClick={() => handleOpenPanel('chat')}
                            disabled={!lesson}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border"
                            style={{
                                background: activePanel === 'chat' ? '#ef4444' : 'rgba(79,70,229,0.08)',
                                color: activePanel === 'chat' ? '#ffffff' : '#4f46e5',
                                borderColor: activePanel === 'chat' ? '#ef4444' : 'rgba(79,70,229,0.2)',
                            }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{activePanel === 'chat' ? 'Fermer' : 'Tuteur IA'}</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* ── Main Layout ── */}
            <div className="flex -mx-4 lg:-mx-5 -mb-4 lg:-mb-5" style={{ height: 'calc(100vh - 130px)' }}>
                <div className="flex gap-0 h-full w-full">

                    {/* ── Lesson Sidebar ── */}
                    <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 border-r h-full overflow-hidden"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-sidebar)' }}>
                        <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"
                                style={{ color: 'var(--text-muted)' }}>
                                <Eye className="w-3 h-3" /> {course.category}
                            </p>
                            <h2 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                                {course.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-4">
                                <ProgressRing pct={pct} />
                                <div>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {completedCount}/{lessons.length} leçons
                                    </p>
                                    <p className="text-[11px] flex items-center gap-1 font-medium mt-0.5" style={{ color: pct === 100 ? '#10b981' : 'var(--text-muted)' }}>
                                        {pct === 100 ? <><CheckCircle className="w-3.5 h-3.5" /> Cours terminé</> : `${lessons.length - completedCount} restante${lessons.length - completedCount !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto py-3 px-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                                Contenu du cours
                            </p>
                            {lessons.map((l, i) => {
                                const done = isDone(l._id);
                                const active = activeLesson === i;
                                return (
                                    <button key={l._id} onClick={() => setActiveLesson(i)}
                                        className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 group`}
                                        style={{
                                            background: active ? '#eeebff' : 'transparent',
                                            borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
                                        }}>
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold transition-all ${done
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : active
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-[#8FA098]'
                                            }`}
                                            style={{
                                                background: done || active ? undefined : 'var(--bg-card)',
                                                border: done || active ? 'none' : '1px solid var(--border)',
                                            }}>
                                            {done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                                        </div>
                                        <div className="min-w-0 flex-1 pt-0.5">
                                            <p className="text-[13px] font-semibold leading-snug"
                                                style={{ color: active ? '#6366f1' : done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                {l.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {l.duration > 0 && (
                                                    <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                        <Clock className="w-2.5 h-2.5" />{l.duration} min
                                                    </span>
                                                )}
                                                {done && (
                                                    <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-0.5">
                                                        ✓ Complétée
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* ── Content Area ── */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="mx-auto px-6 py-8 max-w-4xl">
                            {lesson ? (
                                <>
                                    {/* Lesson Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                                style={{ color: '#6366f1', background: '#eeebff' }}>
                                                Leçon {activeLesson + 1}/{lessons.length}
                                            </span>
                                            {isDone(lesson._id) && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#eeebff] text-[#6366f1]">
                                                    <CheckCircle className="w-3 h-3 text-[#6366f1]" /> Complétée
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl font-bold leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                                            {lesson.title}
                                        </h1>
                                        {lesson.duration > 0 && (
                                            <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                                <Clock className="w-3 h-3" /> Durée estimée : {lesson.duration} min
                                            </span>
                                        )}
                                    </div>

                                    {/* Mobile Progress */}
                                    <div className="card lg:hidden mb-6 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Progression</span>
                                            <span className="text-xs font-bold text-teal-400">{pct}%</span>
                                        </div>
                                         <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
                                             <div className="h-2 rounded-full transition-all duration-700"
                                                 style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #14b8a6, #6366f1)' }} />
                                         </div>
                                     </div>

                                     {/* PDF Viewer */}
                                     <div className="mb-6">
                                        {hasPdf ? (
                                            <PdfViewer courseId={id} lessonId={lesson._id} title={lesson.title} />
                                        ) : (
                                            <NoPdfPlaceholder />
                                        )}
                                    </div>

                                    {/* Bottom Navigation */}
                                    <div className="card p-3 flex items-center gap-2">
                                        <button onClick={() => setActiveLesson(p => Math.max(0, p - 1))}
                                            disabled={isFirst}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" /> Précédent
                                        </button>

                                        <div className="flex-1 flex justify-center">
                                            {!isDone(lesson._id) ? (
                                                <button onClick={() => completeLesson(lesson._id)} disabled={completing}
                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all hover:scale-[1.01] active:scale-[0.99] border border-emerald-200 shadow-sm"
                                                    style={{ background: '#e6fbf3', color: '#10b981' }}
                                                >
                                                    {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10b981]" /> : <CheckCircle className="w-3.5 h-3.5 text-[#10b981]" />}
                                                    {completing ? 'Enregistrement...' : 'Marquer comme complétée'}
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold border border-emerald-200 shadow-sm"
                                                    style={{ color: '#10b981', background: '#e6fbf3' }}>
                                                    <CheckCircle className="w-3.5 h-3.5 text-[#10b981]" /> Marquer comme complétée
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={() => setActiveLesson(p => Math.min(lessons.length - 1, p + 1))}
                                            disabled={isLast}
                                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all text-white shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                                        >
                                            Suivant <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                        style={{ background: 'rgba(99,102,241,0.08)' }}>
                                        <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sélectionnez une leçon</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Chat Sidebar ── */}
                    {activePanel === 'chat' && (
                        <aside className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0 border-l h-full flex flex-col bg-white z-50 absolute lg:relative right-0" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/50 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800">Tuteur IA</h2>
                                        <p className="text-[10px] text-emerald-650 font-semibold">{pdfInfo ? `📄 ${pdfInfo.filename}` : 'En ligne'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {messages.length > 0 && (
                                        <button onClick={() => setMessages([])} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors" title="Nouvelle discussion">
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => setActivePanel(null)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors lg:hidden" title="Fermer">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            
                            <div className="cs flex-1 overflow-y-auto px-4 bg-white">
                                <div className="flex flex-col gap-4 py-4">
                                    {messages.length === 0 ? (
                                        <EmptyState onSuggest={sendMessage} courseId={id} lessonId={lesson?._id} pdfInfo={pdfInfo} setPdfInfo={setPdfInfo} />
                                    ) : (
                                        messages.map((m, i) => <MessageBubble key={i} msg={m} index={i} />)
                                    )}
                                    {chatLoading && <TypingIndicator />}
                                    <div ref={bottomRef} className="h-1" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-white border-t border-slate-200/80">
                                {messages.length > 0 && !chatLoading && (
                                    <div className="flex gap-[6px] overflow-x-auto pb-3 scrollbar-none">
                                        {QUICK_REPLIES.map((qr) => (
                                            <button
                                                key={qr.label}
                                                onClick={() => sendMessage(qr.label)}
                                                className="flex items-center gap-[5px] text-[11px] font-bold whitespace-nowrap flex-shrink-0 px-[10px] py-[5px] rounded-[8px] bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/10 hover:border-indigo-200/50 shadow-sm transition-all"
                                            >
                                                {qr.icon}
                                                {qr.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <form
                                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                    className="flex items-end gap-2.5 bg-slate-50 border border-slate-250/70 rounded-[12px] px-[14px] py-[10px] focus-within:border-indigo-500/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(79,70,229,.05)] transition-all"
                                >
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        value={input}
                                        onChange={(e) => {
                                            if (e.target.value.length <= MAX_CHARS) setInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 108) + 'px';
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        placeholder="Posez votre question..."
                                        disabled={chatLoading}
                                        className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-[1.6] max-h-[108px]"
                                        style={{ height: '22px' }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !input.trim()}
                                        className="send-btn w-[34px] h-[34px] rounded-[10px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-[1.04] active:scale-[.96] shrink-0"
                                    >
                                        <SendHorizontal className="w-[15px] h-[15px] text-white" />
                                    </button>
                                </form>
                            </div>
                        </aside>
                    )}

                    {activePanel === 'summary' && lesson && (
                        <SummaryPanel
                            courseId={id}
                            lessonId={lesson._id}
                            courseTitle={course.title}
                            lessonTitle={lesson.title}
                            onClose={() => setActivePanel(null)}
                        />
                    )}

                    {activePanel === 'quiz' && lesson && (
                        <QuizPanel
                            courseId={id}
                            lessonId={lesson._id}
                            onClose={() => setActivePanel(null)}
                        />
                    )}

                </div>
            </div>
        </Sidebar>
    );
}
