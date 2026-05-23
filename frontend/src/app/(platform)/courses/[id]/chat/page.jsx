'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { chatAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    SendHorizontal, Sparkles, User, ArrowLeft,
    MessageSquare, Lightbulb, BookOpen, HelpCircle,
    RotateCcw, Copy, Check, Upload, FileText, X, Loader2,
    CheckCircle2, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';



const QUICK_REPLIES = [
    { icon: <Lightbulb className="w-3 h-3" />, label: 'Explique' },
    { icon: <BookOpen className="w-3 h-3" />, label: 'Exemple' },
    { icon: <HelpCircle className="w-3 h-3" />, label: 'Résumé' },
    { icon: <RotateCcw className="w-3 h-3" />, label: 'Reformule' },
];


function TypingIndicator() {
    return (
        <div className="flex gap-2.5 items-end pl-0.5">
            <div className="w-6 h-6 rounded-[10px] bg-[#6366f1]/90 flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#6366f1]/20">
                <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div
                className="bg-[#1a1b2e] border border-[#252840] rounded-[14px] rounded-bl-[4px]
          px-4 py-3 flex items-center gap-[5px]
          shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
            >
                {[0, 130, 260].map((d) => (
                    <span
                        key={d}
                        className="w-[5px] h-[5px] rounded-full bg-[#7c84a3]"
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
        shrink-0 p-1 rounded-[6px] hover:bg-white/5
        text-[#3d4266] hover:text-[#7c84a3]"
        >
            {done
                ? <Check className="w-3 h-3 text-[#34d399]" />
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
                className={`w-6 h-6 rounded-[10px] flex items-center justify-center flex-shrink-0 self-end mb-[3px]
          ${isUser
                        ? 'bg-[#3b4fd8] shadow-sm shadow-[#3b4fd8]/30'
                        : 'bg-[#6366f1]/90 shadow-sm shadow-[#6366f1]/20'
                    }`}
            >
                {isUser
                    ? <User className="w-3 h-3 text-white" />
                    : <Sparkles className="w-3 h-3 text-white" />}
            </div>

            <div className={`group flex flex-col gap-[5px] max-w-[74%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`rounded-[14px] text-[13px] leading-[1.75]
            ${isUser
                            ? 'bg-[#3b4fd8] text-white rounded-br-[4px] px-4 py-[10px] shadow-md shadow-[#3b4fd8]/20'
                            : 'bg-[#1a1b2e] border border-[#252840] text-[#e2e6f0] rounded-bl-[4px] px-4 py-[14px] shadow-[0_2px_16px_rgba(0,0,0,0.35)]'
                        }`}
                >
                    {isUser
                        ? <p className="m-0">{msg.content}</p>
                        : (
                            <div className="flex items-start gap-1.5">
                                <div className="flex-1 min-w-0">
                                    <ReactMarkdown
                                        className={`
                      prose prose-sm max-w-none
                      [&_p]:text-[#e2e6f0] [&_p]:leading-[1.8] [&_p]:my-[6px] [&_p]:text-[13px]
                      [&_h1]:text-[#a5b4fc] [&_h1]:font-semibold [&_h1]:text-[14px] [&_h1]:mt-[18px] [&_h1]:mb-[8px] [&_h1]:tracking-[-0.01em]
                      [&_h2]:text-[#a5b4fc] [&_h2]:font-semibold [&_h2]:text-[13px] [&_h2]:mt-[16px] [&_h2]:mb-[6px]
                      [&_h3]:text-[#a5b4fc] [&_h3]:font-medium  [&_h3]:text-[12px] [&_h3]:mt-[12px] [&_h3]:mb-[4px]
                      [&_strong]:text-white [&_strong]:font-semibold
                      [&_em]:text-[#c4cbe0] [&_em]:italic
                      [&_ul]:my-[8px] [&_ul]:space-y-[4px]
                      [&_ol]:my-[8px] [&_ol]:space-y-[4px]
                      [&_li]:text-[#d0d6e8] [&_li]:text-[13px] [&_li]:leading-[1.65]
                      [&_li::marker]:text-[#6366f1]
                      [&_code]:bg-[#0a0b11] [&_code]:text-[#6ee7d4] [&_code]:px-[6px] [&_code]:py-[2px]
                      [&_code]:rounded-[5px] [&_code]:text-[11.5px] [&_code]:font-mono
                      [&_code]:border [&_code]:border-[#1e2040]
                      [&_pre]:bg-[#0a0b11] [&_pre]:border [&_pre]:border-[#1e2040]
                      [&_pre]:rounded-[10px] [&_pre]:p-[12px] [&_pre]:my-[10px]
                      [&_pre]:overflow-x-auto [&_pre]:text-[11.5px]
                      [&_blockquote]:border-l-2 [&_blockquote]:border-[#6366f1]/50
                      [&_blockquote]:pl-3 [&_blockquote]:text-[#7c84a3] [&_blockquote]:italic [&_blockquote]:my-2
                      [&_a]:text-[#818cf8] [&_a]:no-underline hover:[&_a]:underline
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
                    <span className="text-[10px] text-[#3d4266] tabular-nums px-0.5 leading-none">
                        {time}
                    </span>
                )}
            </div>
        </div>
    );
}


function PdfUploadZone({ courseId, lessonId, pdfInfo, setPdfInfo }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError('Seuls les fichiers PDF sont acceptés.');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setError('Le fichier dépasse la taille maximale de 20 Mo.');
            return;
        }
        setError('');
        setUploading(true);
        try {
            const { data } = await chatAPI.uploadPdf(courseId, file, lessonId);
            setPdfInfo({
                filename: data.filename,
                pages: data.pages,
                charCount: data.charCount,
                message: data.message,
            });
        } catch (err) {
            const msg = err?.response?.data?.message || 'Erreur lors de l\'importation du PDF.';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file) handleUpload(file);
    };

    if (pdfInfo) {
        return (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] bg-[#0f3a2a]/60 border border-[#34d399]/25">
                <CheckCircle2 className="w-4 h-4 text-[#34d399] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#34d399] font-medium truncate">{pdfInfo.filename}</p>
                    <p className="text-[10px] text-[#34d399]/70">{pdfInfo.pages} page(s) · {pdfInfo.charCount?.toLocaleString()} caractères extraits</p>
                </div>
                <button
                    onClick={() => { setPdfInfo(null); setError(''); }}
                    className="p-1 rounded-md hover:bg-white/5 text-[#34d399]/60 hover:text-[#34d399] transition-colors"
                    title="Retirer le PDF"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !uploading && fileRef.current?.click()}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] border border-dashed cursor-pointer transition-all duration-200
                    ${uploading
                        ? 'border-[#6366f1]/40 bg-[#6366f1]/5'
                        : 'border-[#252840] hover:border-[#6366f1]/40 hover:bg-[#1a1b2e]'}`}
            >
                {uploading ? (
                    <Loader2 className="w-4 h-4 text-[#6366f1] animate-spin flex-shrink-0" />
                ) : (
                    <Upload className="w-4 h-4 text-[#7c84a3] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#7c84a3] font-medium">
                        {uploading ? 'Extraction du texte en cours…' : 'Importer un PDF pour le tuteur IA'}
                    </p>
                    <p className="text-[10px] text-[#3d4266]">
                        Glissez-déposez ou cliquez · PDF uniquement · 20 Mo max
                    </p>
                </div>
                <FileText className="w-4 h-4 text-[#3d4266] flex-shrink-0" />
            </div>
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#3a0f0f]/60 border border-[#f87171]/25">
                    <AlertCircle className="w-3.5 h-3.5 text-[#f87171] flex-shrink-0" />
                    <p className="text-[11px] text-[#f87171]">{error}</p>
                </div>
            )}
            <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
            />
        </div>
    );
}


function EmptyState({ onSuggest, courseId, lessonId, pdfInfo, setPdfInfo }) {
    const cards = [
        { emoji: '🎯', label: 'Comment fonctionne ce cours ?' },
        { emoji: '📌', label: 'Quels sont les points clés ?' },
        { emoji: '💡', label: 'Explique le premier concept' },
        { emoji: '🔗', label: 'Donne un exemple pratique' },
    ];
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 select-none px-4">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#1a1b2e] border border-[#252840] flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.12)]">
                    <MessageSquare className="w-6 h-6 text-[#6366f1]" />
                </div>
                <div>
                    <h2 className="text-white font-semibold text-[15px] mb-1">Tuteur IA — Questions sur le PDF</h2>
                    <p className="text-[#7c84a3] text-[13px] leading-relaxed max-w-[300px]">
                        Importez un PDF puis posez vos questions. Le tuteur répond uniquement à partir du contenu du document.
                    </p>
                </div>
            </div>

            <div className="w-full max-w-[380px]">
                <PdfUploadZone courseId={courseId} lessonId={lessonId} pdfInfo={pdfInfo} setPdfInfo={setPdfInfo} />
            </div>

            {pdfInfo && (
                <div className="grid grid-cols-2 gap-[8px] w-full max-w-[360px]">
                    {cards.map((c) => (
                        <button
                            key={c.label}
                            onClick={() => onSuggest(c.label)}
                            className="text-left px-3.5 py-3 rounded-[12px]
              bg-[#1a1b2e] border border-[#252840]
              hover:border-[#6366f1]/35 hover:bg-[#21233a]
              hover:shadow-[0_2px_12px_rgba(99,102,241,0.08)]
              transition-all duration-200 group"
                        >
                            <span className="text-[15px] block mb-[5px]">{c.emoji}</span>
                            <span className="text-[12px] text-[#7c84a3] group-hover:text-[#a5b4fc] transition-colors leading-snug block">
                                {c.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}


function ChatPageInner() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const lessonId = searchParams.get('lessonId') || '';
    const lessonName = searchParams.get('lessonName') || '';
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [pdfInfo, setPdfInfo] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const MAX_CHARS = 500;

    // Check PDF status on mount
    useEffect(() => {
        chatAPI.getPdfStatus(id, lessonId || undefined).then(({ data }) => {
            if (data.hasPdf) {
                setPdfInfo({
                    filename: data.filename,
                    pages: data.pages,
                    charCount: data.charCount,
                });
            }
        }).catch(() => { });
    }, [id, lessonId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (text) => {
        const content = (text || input).trim();
        if (!content || loading) return;
        setMessages((p) => [...p, { role: 'user', content, timestamp: Date.now() }]);
        setInput('');
        setLoading(true);
        try {
            const history = messages.map((m) => ({ role: m.role, content: m.content }));
            const { data } = await chatAPI.ask(id, content, history, lessonId || undefined);
            const sourceLabel = data.source ? ` (source : ${data.source})` : '';
            setMessages((p) => [...p, {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now(),
                source: data.source,
            }]);
        } catch {
            setMessages((p) => [...p, { role: 'assistant', content: '❌ Une erreur est survenue. Veuillez réessayer.', timestamp: Date.now() }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const onSubmit = (e) => { e.preventDefault(); sendMessage(); };
    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
    const charPct = input.length / MAX_CHARS;

    return (
        <>
            <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes tdot {
          0%,60%,100% { transform:translateY(0);    opacity:.3; }
          30%          { transform:translateY(-5px); opacity:1;  }
        }
        .cs {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color .3s;
        }
        .cs:hover { scrollbar-color: #252840 transparent; }
        .cs::-webkit-scrollbar { width: 3px; }
        .cs::-webkit-scrollbar-track { background: transparent; }
        .cs::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 99px;
          transition: background .3s;
        }
        .cs:hover::-webkit-scrollbar-thumb { background: #252840; }
        .send-btn:not(:disabled):hover {
          box-shadow: 0 0 14px rgba(99,102,241,.45);
        }
      `}</style>

            <Sidebar>
                <div className="flex flex-col h-[calc(100vh-7rem)] max-w-2xl mx-auto gap-0">

                    <div className="flex items-center gap-3 pb-3 flex-shrink-0">
                        <Link
                            href={`/courses/${id}`}
                            className="w-8 h-8 rounded-[10px] border border-[#252840] flex items-center justify-center
                hover:bg-[#1a1b2e] hover:border-[#363a5a] transition-all duration-200"
                            title="Retour au cours"
                        >
                            <ArrowLeft className="w-[14px] h-[14px] text-[#7c84a3]" />
                        </Link>

                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                                <div className="w-8 h-8 rounded-[10px] bg-[#6366f1] flex items-center justify-center shadow-md shadow-[#6366f1]/25">
                                    <Sparkles className="w-[14px] h-[14px] text-white" />
                                </div>
                                <span className="absolute -bottom-[2px] -right-[2px] w-[9px] h-[9px] bg-[#34d399] rounded-full border-[1.5px] border-[#0c0d16]" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-semibold text-white text-[14px] leading-tight">
                                    {lessonName ? `Tuteur IA — ${lessonName}` : 'Tuteur IA'}
                                </h1>
                                <p className="text-[10px] text-[#34d399] font-medium truncate max-w-[200px]">
                                    {pdfInfo ? `📄 ${pdfInfo.filename}` : lessonId ? '📖 Leçon sélectionnée' : 'En ligne'}
                                </p>
                            </div>
                        </div>

                        {messages.length > 0 && (
                            <button
                                onClick={() => setMessages([])}
                                title="Nouvelle conversation"
                                className="w-8 h-8 rounded-[10px] border border-[#252840] flex items-center justify-center
                  text-[#3d4266] hover:text-[#7c84a3] hover:bg-[#1a1b2e] hover:border-[#363a5a]
                  transition-all duration-200"
                            >
                                <RotateCcw className="w-[13px] h-[13px]" />
                            </button>
                        )}
                    </div>

                    {/* PDF upload bar when in conversation mode */}
                    {messages.length > 0 && (
                        <div className="flex-shrink-0 pb-3">
                            <PdfUploadZone courseId={id} lessonId={lessonId} pdfInfo={pdfInfo} setPdfInfo={setPdfInfo} />
                        </div>
                    )}

                    <div className="cs flex-1 overflow-y-auto min-h-0 pr-[2px]">
                        <div className="flex flex-col gap-5 py-1">
                            {messages.length === 0
                                ? <EmptyState onSuggest={sendMessage} courseId={id} lessonId={lessonId} pdfInfo={pdfInfo} setPdfInfo={setPdfInfo} />
                                : messages.map((m, i) => <MessageBubble key={i} msg={m} index={i} />)
                            }
                            {loading && <TypingIndicator />}
                            <div ref={bottomRef} className="h-1" />
                        </div>
                    </div>

                    {messages.length > 0 && !loading && (
                        <div className="flex gap-[6px] overflow-x-auto pt-3 pb-1 flex-shrink-0 scrollbar-none">
                            {QUICK_REPLIES.map((qr) => (
                                <button
                                    key={qr.label}
                                    onClick={() => sendMessage(qr.label)}
                                    className="flex items-center gap-[5px] text-[11px] font-medium whitespace-nowrap flex-shrink-0
                    px-[10px] py-[5px] rounded-[6px]
                    bg-[#13141f] border border-[#252840]
                    text-[#7c84a3] hover:text-[#a5b4fc]
                    hover:bg-[#1a1b2e] hover:border-[#6366f1]/35
                    transition-all duration-150"
                                >
                                    {qr.icon}
                                    {qr.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-shrink-0 pt-3">
                        <form
                            onSubmit={onSubmit}
                            className="flex items-end gap-2.5
                bg-[#13141f] border border-[#252840] rounded-[12px]
                px-[14px] py-[10px]
                focus-within:border-[#6366f1]/50
                focus-within:shadow-[0_0_0_3px_rgba(99,102,241,.08)]
                transition-all duration-200"
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
                                onKeyDown={onKey}
                                placeholder="Posez votre question sur le PDF…"
                                disabled={loading}
                                className="flex-1 bg-transparent text-[13px] text-[#e2e6f0] placeholder-[#3d4266]
                  resize-none focus:outline-none leading-[1.6] max-h-[108px]"
                                style={{ height: '22px' }}
                            />
                            <div className="flex items-center gap-2 self-end">
                                {charPct > 0.72 && (
                                    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
                                        <circle cx="9" cy="9" r="7" fill="none" stroke="#252840" strokeWidth="2.2" />
                                        <circle
                                            cx="9" cy="9" r="7" fill="none"
                                            stroke={charPct > 0.9 ? '#f59e0b' : '#6366f1'}
                                            strokeWidth="2.2"
                                            strokeDasharray={`${charPct * 43.98} 43.98`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 9 9)"
                                        />
                                    </svg>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="send-btn w-[34px] h-[34px] rounded-[10px]
                    bg-[#6366f1] hover:bg-[#7577f3]
                    disabled:opacity-25 disabled:cursor-not-allowed
                    flex items-center justify-center
                    transition-all duration-200
                    hover:scale-[1.04] active:scale-[.96]"
                                >
                                    <SendHorizontal className="w-[15px] h-[15px] text-white" />
                                </button>
                            </div>
                        </form>
                        {messages.length === 0 && (
                            <p className="text-[10px] text-[#2e3155] mt-2 text-center">
                                Entrée pour envoyer · Maj+Entrée pour saut de ligne
                            </p>
                        )}
                    </div>

                </div>
            </Sidebar>
        </>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0c0d16' }}>
                <div style={{ width: 24, height: 24, border: '2.5px solid #252840', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        }>
            <ChatPageInner />
        </Suspense>
    );
}
