'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Role = 'user' | 'assistant'
type ChatMode = 'rag' | 'general'
type Message = {
  id: string; role: Role; content: string
  timestamp: Date; loading?: boolean
}
interface Source {
  id: string; name: string; size: string; uploadedAt: Date; selected: boolean
}
interface Session {
  id: string; title: string; messages: Message[]
  createdAt: Date; mode: ChatMode
}

const uid = () => Math.random().toString(36).slice(2)
const fmt = (d: Date) => {
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
const dl = (text: string, name: string) => {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: name
  }); a.click()
}

function useDrag(init: number, min: number, max: number, dir: 'l' | 'r') {
  const [w, setW] = useState(init)
  const r = useRef({ on: false, x: 0, w: 0 })
  const grab = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); r.current = { on: true, x: e.clientX, w }
    document.body.style.cssText += 'cursor:col-resize;user-select:none'
    const mv = (ev: MouseEvent) => {
      if (!r.current.on) return
      const d = dir === 'l' ? ev.clientX - r.current.x : r.current.x - ev.clientX
      setW(Math.min(max, Math.max(min, r.current.w + d)))
    }
    const up = () => {
      r.current.on = false; document.body.style.cssText = ''
      window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }, [w, min, max, dir])
  return { w, grab }
}

function Dots() {
  return <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
    {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', display: 'inline-block', animation: 'dot 1.4s ease infinite', animationDelay: `${i * .2}s` }} />)}
  </span>
}

function MsgContent({ text }: { text: string }) {
  // Simple markdown: bold, code, bullets
  const lines = text.split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <strong key={i} style={{ fontSize: '0.9em', color: '#111827', display: 'block', marginTop: 6 }}>{line.slice(4)}</strong>
        if (line.startsWith('## ')) return <strong key={i} style={{ fontSize: '0.95em', color: '#111827', display: 'block', marginTop: 8 }}>{line.slice(3)}</strong>
        if (line.startsWith('# ')) return <strong key={i} style={{ fontSize: '1em', color: '#111827', display: 'block', marginTop: 8 }}>{line.slice(2)}</strong>
        if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ paddingLeft: 12, display: 'flex', gap: 6 }}><span style={{ color: '#6366f1', flexShrink: 0 }}>•</span><span>{line.slice(2)}</span></div>
        if (line.startsWith('```')) return <div key={i} />
        if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft: 12 }}>{line}</div>
        if (line === '') return <div key={i} style={{ height: 4 }} />
        // Inline bold
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return <div key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</div>
      })}
    </div>
  )
}

export default function App() {
  const [sources, setSources] = useState<Source[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadErr, setUploadErr] = useState('')
  const [dragging, setDragging] = useState(false)
  const [toolResult, setToolResult] = useState<{ title: string; content: string; tool: string } | null>(null)
  const [selectedToolSource, setSelectedToolSource] = useState<Record<string, string>>({})
  const [toolLoading, setToolLoading] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [chatMode, setChatMode] = useState<ChatMode>('rag')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const lp = useDrag(272, 180, 420, 'l')
  const rp = useDrag(308, 200, 480, 'r')

  const active = sessions.find(s => s.id === activeId)
  const msgs = active?.messages ?? []
  const sel = sources.filter(s => s.selected)
  const ragReady = sel.length > 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        switchMode(chatMode === 'rag' ? 'general' : 'rag')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chatMode])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, sending])
  useEffect(() => {
    if (sources.length === 1 && sessions.length === 0) newSession('rag')
  }, [sources.length])

  const lastSessionPerMode = useRef<Record<ChatMode, string | null>>({ rag: null, general: null })

  function newSession(mode: ChatMode = chatMode) {
    const id = uid()
    setSessions(p => [{ id, title: 'New conversation', messages: [], createdAt: new Date(), mode }, ...p])
    setActiveId(id)
    lastSessionPerMode.current[mode] = id
    setChatMode(mode)
    setToolResult(null)
  }

  function switchMode(mode: ChatMode) {
    if (mode === chatMode) return
    if (activeId) lastSessionPerMode.current[chatMode] = activeId
    setChatMode(mode)
    const last = lastSessionPerMode.current[mode]
    const found = sessions.find(s => s.id === last && s.mode === mode)
      ?? sessions.find(s => s.mode === mode)
    if (found) {
      setActiveId(found.id)
    } else {
      const id = uid()
      setSessions(p => [{ id, title: 'New conversation', messages: [], createdAt: new Date(), mode }, ...p])
      setActiveId(id)
      lastSessionPerMode.current[mode] = id
    }
  }

  const upload = useCallback(async (file: File) => {
    setUploadStatus('uploading'); setUploadErr('')
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSources(p => [...p, { id: uid(), name: file.name, size: (file.size / 1024).toFixed(0) + ' KB', uploadedAt: new Date(), selected: true }])
      setUploadStatus('success')
    } catch (e) { setUploadStatus('error'); setUploadErr(e instanceof Error ? e.message : 'Failed') }
  }, [])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f) }
  const toggle = (id: string) => setSources(p => p.map(s => s.id === id ? { ...s, selected: !s.selected } : s))

  // ── Send message ─────────────────────────────────────────────────────────────
  async function callAI(question: string, history: Message[], mode: ChatMode): Promise<string> {
    if (mode === 'rag') {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d.answer
    } else {
      const r = await fetch('/api/general-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter(m => !m.loading).map(m => ({ role: m.role, content: m.content })) })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d.answer
    }
  }

  const send = async (overrideInput?: string) => {
    const q = (overrideInput ?? input).trim()
    if (!q || sending) return
    if (chatMode === 'rag' && !ragReady) return
    if (!overrideInput) setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'

    let sid = activeId
    if (!sid) {
      const id = uid()
      setSessions(p => [{ id, title: q.slice(0, 50), messages: [], createdAt: new Date(), mode: chatMode }, ...p])
      setActiveId(id); sid = id
    }

    const um: Message = { id: uid(), role: 'user', content: q, timestamp: new Date() }
    const aidId = uid()
    const aidPlaceholder: Message = { id: aidId, role: 'assistant', content: '', timestamp: new Date(), loading: true }

    setSessions(p => p.map(s => s.id === sid ? {
      ...s, messages: [...s.messages, um, aidPlaceholder],
      title: s.messages.length === 0 ? q.slice(0, 50) : s.title
    } : s))
    setSending(true)

    try {
      const currentSession = sessions.find(s => s.id === sid)
      const history = [...(currentSession?.messages ?? []), um]
      const answer = await callAI(q, history, chatMode)
      setSessions(p => p.map(s => s.id === sid
        ? { ...s, messages: s.messages.map(m => m.id === aidId ? { ...m, content: answer, loading: false } : m) }
        : s))
    } catch (e) {
      setSessions(p => p.map(s => s.id === sid
        ? { ...s, messages: s.messages.map(m => m.id === aidId ? { ...m, content: `Error: ${e instanceof Error ? e.message : 'Failed'}`, loading: false } : m) }
        : s))
    } finally { setSending(false) }
  }

  // ── Regenerate ───────────────────────────────────────────────────────────────
  const regenerate = async (msgId: string) => {
    if (sending || !active) return
    const idx = active.messages.findIndex(m => m.id === msgId)
    if (idx < 1) return
    const userMsg = active.messages[idx - 1]
    if (userMsg.role !== 'user') return

    // Remove the assistant message and re-ask
    setSessions(p => p.map(s => s.id === activeId
      ? { ...s, messages: s.messages.filter(m => m.id !== msgId) }
      : s))
    await send(userMsg.content)
  }

  // ── Copy ─────────────────────────────────────────────────────────────────────
  const copy = (text: string) => { navigator.clipboard.writeText(text).catch(() => {}) }

  const runTool = async (tool: 'summary' | 'quiz', srcId: string) => {
    const src = sources.find(s => s.id === srcId); if (!src) return
    setToolResult({ title: `${tool === 'summary' ? 'Summary' : 'Quiz'} · ${src.name}`, content: '', tool })
    setToolLoading(true)
    try {
      const r = await fetch(`/api/${tool}`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setToolResult({ title: `${tool === 'summary' ? 'Summary' : 'Quiz'} · ${src.name}`, content: tool === 'summary' ? d.summary : d.quiz, tool })
    } catch (e) { setToolResult(p => p ? { ...p, content: `Error: ${e instanceof Error ? e.message : 'Failed'}` } : null) }
    finally { setToolLoading(false) }
  }

  const T = {
    bg: '#ffffff', surface: '#ffffff', surfaceHigh: '#f9fafb',
    border: '#f0f0f0', borderM: '#e5e7eb',
    text: '#1f2937', textMuted: '#9ca3af', textSub: '#4b5563',
    accent: '#8cc63f', accentL: '#f4f8eb', accentGlow: 'rgba(140, 198, 63, 0.15)',
    green: '#10b981', red: '#ef4444',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg, color: T.text, fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-feature-settings:"cv02","cv03","cv04","cv11"}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:6px}
        ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        
        /* Animations */
        @keyframes dot{0%,100%{opacity:.3;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(140, 198, 63, 0.4)}50%{box-shadow:0 0 0 8px rgba(140, 198, 63, 0)}}
        
        /* Hover Utilities */
        .hov{transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1)}
        .hov:hover:not(:disabled){transform:translateY(-2px);filter:brightness(0.96)}
        .hov:active:not(:disabled){transform:translateY(0)}
        
        /* Component Styles */
        .sess-row{transition:all 0.2s ease}
        .sess-row:hover{background:#f4f8eb!important}
        .sess-row:hover .del{opacity:1!important}
        
        .tool-btn{transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1)}
        .tool-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 16px rgba(140, 198, 63, 0.3)!important}
        
        .send{transition:all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)}
        .send:hover:not(:disabled){transform:scale(1.1) rotate(-5deg)}
        
        .chip{transition:all 0.2s ease}
        .chip:hover{background:#f4f8eb!important;border-color:#8cc63f!important;transform:translateY(-2px);box-shadow:0 4px 12px rgba(140, 198, 63, 0.1)!important}
        
        .upload-zone{transition:all 0.3s ease}
        .upload-zone:hover{border-color:#8cc63f!important;background:#f4f8eb!important;transform:scale(1.02)}
        
        .action-btn{transition:all 0.2s ease}
        .action-btn:hover{background:#f4f8eb!important;color:#648b2d!important;transform:scale(1.1)}
        
        .studio-card{transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1)}
        .studio-card:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,0.06)!important;border-color:#d1d5db!important}

        .msg-bubble{transition:all 0.3s ease}
        .msg-bubble:hover{box-shadow:0 4px 14px rgba(0,0,0,0.05)!important;transform:translateY(-1px)}

        .glass{background:rgba(255,255,255,0.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        
        textarea{resize:none;scrollbar-width:none}
        textarea::-webkit-scrollbar{display:none}
        textarea:focus{outline:none}
        
        input[type=checkbox]{accent-color:#8cc63f;width:14px;height:14px;cursor:pointer;flex-shrink:0;transition:transform 0.2s;transform:scale(1.1)}
        input[type=checkbox]:hover{transform:scale(1.2)}
        
        .bg-gradient{background: linear-gradient(135deg, #ffffff 0%, #f4f8eb 100%)}
        .icon-float{animation: float 3s ease-in-out infinite}
      `}</style>

      <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={onFile} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT ── */}
        {leftOpen && <>
          <aside style={{ width: Math.max(260, lp.w), background: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', borderRight: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '24px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎓</div>
                <span style={{ fontWeight: 700, fontSize: '1.3rem', color: '#1f2937', letterSpacing: '-0.03em' }}>EduAI</span>
              </div>
            </div>

            <button onClick={() => newSession('rag')} className="hov" style={{ margin: '0 16px 20px', padding: '12px 16px', background: T.accent, border: 'none', borderRadius: 12, color: '#ffffff', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(140, 198, 63, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 300 }}>+</span> Nouveau chat
              </div>
              <div style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>⌘ K</div>
            </button>

            {/* ── HISTORY ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textSub, fontSize: '0.85rem', fontWeight: 500 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Chats
                </div>
                <span style={{ color: T.textMuted, cursor: 'pointer', fontSize: '1.1rem' }}>+</span>
              </div>
              
              {sessions.map(s => (
                <div key={s.id} onClick={() => setActiveId(s.id)} className="sess-row"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', margin: '0 8px 4px', borderRadius: 10, cursor: 'pointer', background: activeId === s.id ? T.accentL : 'transparent', transition: 'all 0.15s' }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: '0.9rem', color: activeId === s.id ? '#648b2d' : T.textSub, fontWeight: activeId === s.id ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: activeId === s.id ? '#648b2d' : T.textMuted, flexShrink: 0, marginLeft: 8 }}>{fmt(s.createdAt)}</div>
                  {activeId === s.id && (
                    <button className="del" onClick={e => { e.stopPropagation(); setSessions(p => p.filter(x => x.id !== s.id)); if (activeId === s.id) setActiveId(null) }}
                      style={{ background: 'none', border: 'none', color: '#648b2d', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 0 2px 6px' }}>✕</button>
                  )}
                </div>
              ))}
              
              <div style={{ padding: '8px 20px', fontSize: '0.8rem', color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                Voir plus <span style={{ fontSize: '0.6rem' }}>▼</span>
              </div>

              {/* ── UPLOAD DOCUMENT ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.textSub }}>Documents</span>
                <span style={{ color: T.textMuted, cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => fileRef.current?.click()}>+</span>
              </div>
              
              {uploadStatus === 'uploading' && (
                <div style={{ padding: '10px 12px', background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: T.textMuted, margin: '0 8px 8px' }}>
                  <span style={{ width: 14, height: 14, border: `2px solid ${T.accent}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Processing...
                </div>
              )}
              {uploadStatus === 'error' && (
                <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: '0.8rem', color: '#ef4444', margin: '0 8px 8px' }}>✗ {uploadErr}</div>
              )}
              {sources.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px', marginBottom: 16 }}>
                  {sources.map(src => (
                    <div key={src.id} onClick={() => toggle(src.id)} className="hov"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, cursor: 'pointer', background: src.selected ? '#f9fafb' : 'transparent' }}>
                      <div style={{ width: 28, height: 32, background: '#fee2e2', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>PDF</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.text, fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.name.replace(/\.[^.]+$/, '')}</div>
                        <div style={{ color: T.textMuted, fontSize: '0.7rem' }}>{src.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="upload-zone hov" onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}
                  style={{ border: `1px dashed ${dragging ? T.accent : T.borderM}`, borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', background: dragging ? T.accentL : '#f9fafb', transition: 'all 0.2s', margin: '0 8px 16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: T.textSub }}>Glissez un PDF ici</div>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.textSub }}>Studio</span>
              </div>
              <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.textSub, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  <span style={{ fontSize: '1rem' }}>📝</span> Summary
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.textSub, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                  <span style={{ fontSize: '1rem' }}>🎯</span> Quiz
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', gap: 12, color: T.textMuted, padding: '4px 8px' }}>
                <span style={{ cursor: 'pointer' }}>⚙️</span>
                <span style={{ cursor: 'pointer' }}>☀️</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', cursor: 'pointer', borderRadius: 10 }} className="hov">
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>A</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>Account</div>
                  <div style={{ fontSize: '0.75rem', color: T.textMuted }}>Premium</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: T.textMuted }}>▼</span>
              </div>
            </div>
          </aside>
          <div onMouseDown={lp.grab} style={{ width: 4, flexShrink: 0, cursor: 'col-resize', borderRight: `1px solid ${T.border}` }} />
        </>}

        {/* ── CENTER ── */}
        <main className="bg-gradient" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {/* Top Bar inside main */}
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!leftOpen && <button onClick={() => setLeftOpen(true)} className="hov" style={{ width: 32, height: 32, borderRadius: 8, background: '#ffffff', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>☰</button>}
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                {active?.title || (chatMode === 'rag' ? 'Nouveau résumé' : 'Nouvelle conversation')}
                <span style={{ fontSize: '0.75rem', color: T.textMuted }}>▼</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="action-btn hov" style={{ width: 34, height: 34, borderRadius: 8, background: '#f9fafb', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }}>🔍</button>
              <button className="action-btn hov" style={{ width: 34, height: 34, borderRadius: 8, background: '#f9fafb', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }}>⛶</button>
              <button className="action-btn hov" style={{ width: 34, height: 34, borderRadius: 8, background: T.accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>⚙</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {msgs.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, animation: 'fadeUp 0.6s ease-out' }}>
                <div style={{ textAlign: 'center', maxWidth: 440 }}>
                  <div className="icon-float" style={{ width: 70, height: 70, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px', boxShadow: '0 8px 30px rgba(140, 198, 63, 0.3)' }}>
                    🎓
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>
                    Bonjour, comment puis-je vous aider ?
                  </h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 580, width: '100%' }}>
                  {(chatMode === 'rag'
                    ? ['Quels sont les concepts clés ?', 'Résume les points principaux', 'Liste les définitions importantes', 'Explique les idées de base']
                    : ['Explique-moi l\'informatique quantique', 'Écris une fonction Python', 'Qu\'est-ce que le Machine Learning ?', 'Aide-moi à rédiger un email']
                  ).map((q, i) => (
                    <button key={i} className="chip hov" onClick={() => { setInput(q); taRef.current?.focus() }}
                      style={{ background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px', color: T.textSub, cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((msg, idx) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease', width: '100%', maxWidth: 840, margin: '0 auto', padding: '0 20px' }}>
                {msg.role === 'assistant' ? (
                  <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: '85%' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>🎓</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: 700, marginBottom: 8 }}>EduAI</div>
                      <div className="msg-bubble" style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', color: '#374151', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {msg.loading ? <Dots /> : <MsgContent text={msg.content} />}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: T.textMuted }}>{fmt(msg.timestamp)}</span>
                        {!msg.loading && msg.content && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="action-btn hov" onClick={() => copy(msg.content)} style={{ padding: '6px', borderRadius: 6, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: '1rem', border: 'none' }}>⎘</button>
                            <button className="action-btn hov" onClick={() => regenerate(msg.id)} disabled={sending} style={{ padding: '6px', borderRadius: 6, background: 'transparent', color: T.textMuted, cursor: sending ? 'default' : 'pointer', fontSize: '1rem', border: 'none', opacity: sending ? 0.5 : 1 }}>↻</button>
                            <button className="action-btn hov" style={{ padding: '6px', borderRadius: 6, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: '1rem', border: 'none' }}>👍</button>
                            <button className="action-btn hov" style={{ padding: '6px', borderRadius: 6, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: '1rem', border: 'none' }}>👎</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: '85%' }}>
                    <div>
                      <div className="msg-bubble" style={{ padding: '14px 20px', borderRadius: 16, borderBottomRightRadius: 4, background: T.accentL, color: '#1f2937', fontSize: '0.95rem', lineHeight: 1.5, border: `1px solid rgba(140, 198, 63, 0.2)` }}>
                        <MsgContent text={msg.content} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: 6, textAlign: 'right' }}>{fmt(msg.timestamp)}</div>
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}>A</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="glass" style={{ padding: '16px 40px 24px', flexShrink: 0, borderTop: `1px solid ${T.border}` }}>
            <div style={{ background: '#ffffff', border: `1px solid ${T.borderM}`, borderRadius: 20, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <button onClick={() => fileRef.current?.click()} className="hov" title="Upload document"
                style={{ width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: T.textMuted }}>
                📎
              </button>
              <div style={{ background: T.accentL, padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: '#648b2d', cursor: 'pointer' }} onClick={() => switchMode(chatMode === 'rag' ? 'general' : 'rag')}>
                <span style={{ fontSize: '0.9rem' }}>🎯</span> RAG
              </div>
              <button style={{ background: 'transparent', border: 'none', color: T.textMuted, fontSize: '1.2rem', cursor: 'pointer' }}>🌐</button>
              
              <textarea ref={taRef}
                placeholder="Envoyer un message à EduAI..."
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                disabled={(chatMode === 'rag' && !ragReady) || sending}
                rows={1}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#1f2937', fontSize: '1rem', fontFamily: 'inherit', maxHeight: 180, overflowY: 'auto', resize: 'none', padding: '8px 0', alignSelf: 'center' }}
              />
              
              <button className="send hov" onClick={() => send()}
                disabled={!input.trim() || sending || (chatMode === 'rag' && !ragReady)}
                style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() && (chatMode === 'general' || ragReady) ? T.accent : '#f3f4f6', border: 'none', cursor: input.trim() && (chatMode === 'general' || ragReady) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: input.trim() && (chatMode === 'general' || ragReady) ? '#fff' : '#9ca3af', fontSize: '1.1rem', transition: 'all 0.2s', flexShrink: 0 }}>
                {sending ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : '➤'}
              </button>
            </div>
          </div>
        </main>

        {/* ── RIGHT ── */}
        {rightOpen && <>
          <div onMouseDown={rp.grab} style={{ width: 4, flexShrink: 0, cursor: 'col-resize', borderLeft: `1px solid ${T.border}` }} />
          <aside style={{ width: rp.w, background: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>
                <span style={{ color: T.accent }}>✦</span> Studio
              </div>
              <button className="hov" onClick={() => setRightOpen(false)} style={{ width: 22, height: 22, background: 'transparent', border: 'none', cursor: 'pointer', color: T.textMuted }}>▼</button>
            </div>

            {toolResult ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: T.text, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toolResult.title}</div>
                    <button onClick={() => setToolResult(null)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>✕</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {toolLoading
                      ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 12, color: T.textMuted }}>
                        <span style={{ width: 24, height: 24, border: `3px solid ${T.accent}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: '0.85rem' }}>Génération en cours...</span>
                      </div>
                      : <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{toolResult.content}</div>
                    }
                  </div>
                  {toolResult.content && !toolLoading && (
                    <div style={{ padding: '16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
                      <button onClick={() => dl(toolResult.content, `${toolResult.tool}.txt`)}
                        style={{ flex: 1, background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px', color: '#374151', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, fontFamily: 'inherit', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        ↓ Télécharger
                      </button>
                      <button onClick={() => { const src = sources.find(x => toolResult.title.includes(x.name)); if (src) runTool(toolResult.tool as 'summary' | 'quiz', src.id) }}
                        style={{ background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px', color: '#374151', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>↻</button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                  {[
                    { tool: 'summary' as const, icon: '📄', label: 'Summary', desc: 'Résumé intelligent de vos documents' },
                    { tool: 'quiz' as const, icon: '🎯', label: 'Quiz', desc: 'Générez des questions à choix multiple' },
                  ].map(({ tool, icon, label, desc }) => {
                    const selSrcId = selectedToolSource[tool] || (sources[0]?.id ?? '')
                    return (
                      <div key={tool} className="studio-card" style={{ marginBottom: 24, background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.accentL, color: '#648b2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, marginTop: 2 }}>{icon}</div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2937' }}>{label}</div>
                            <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: 4 }}>{desc}</div>
                          </div>
                        </div>
                        {sources.length === 0
                          ? <div style={{ padding: '16px', background: T.surfaceHigh, borderRadius: 10, textAlign: 'center', fontSize: '0.8rem', color: T.textMuted }}>Uploadez un PDF</div>
                          : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <select 
                                value={selSrcId} 
                                onChange={e => setSelectedToolSource(p => ({ ...p, [tool]: e.target.value }))}
                                className="hov"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.borderM}`, background: '#f9fafb', color: '#374151', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', appearance: 'none', fontWeight: 500 }}>
                                {sources.map(src => (
                                  <option key={src.id} value={src.id}>{src.name.replace(/\.[^.]+$/, '')} ({src.size})</option>
                                ))}
                              </select>
                              <button className="tool-btn" onClick={() => runTool(tool, selSrcId)} disabled={toolLoading || !selSrcId}
                                style={{ width: '100%', background: T.accent, border: 'none', borderRadius: 10, padding: '12px', color: '#ffffff', cursor: (toolLoading || !selSrcId) ? 'default' : 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', opacity: toolLoading ? 0.7 : 1, boxShadow: '0 4px 10px rgba(140, 198, 63, 0.25)' }}>
                                {toolLoading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : '✦ Générer'}
                              </button>
                            </div>
                        }
                      </div>
                    )
                  })}
                  
                  <div className="studio-card" style={{ background: '#ffffff', border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1rem' }}>💡</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>Conseil</span>
                      </div>
                      <span style={{ color: T.textMuted }}>•••</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: T.textSub, lineHeight: 1.6 }}>
                      Pour de meilleurs résultats, posez des questions précises sur le contenu de votre document.
                    </div>
                  </div>
                </div>
              )}
          </aside>
        </>}

        {!rightOpen && <button onClick={() => setRightOpen(true)} className="hov" style={{ width: 32, flexShrink: 0, background: '#ffffff', border: 'none', borderLeft: `1px solid ${T.border}`, cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>‹</button>}
      </div>
    </div>
  )
}