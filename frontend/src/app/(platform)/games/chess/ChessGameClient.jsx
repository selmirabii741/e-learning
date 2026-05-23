"use client";
import useChessGame from "./hooks/useChessGame";

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['8','7','6','5','4','3','2','1'];

export default function ChessGameClient() {
  const { board, turn, selected, validMoves, status, history, captured, aiThinking, aiDifficulty, setAiDifficulty, handleClick, reset, SYMBOLS, undo, redo, canUndo, canRedo } = useChessGame();

  const isSelected = (r, c) => selected?.[0] === r && selected?.[1] === c;
  const isValid = (r, c) => validMoves.some(([vr, vc]) => vr === r && vc === c);
  const statusMsg = status === 'checkmate' ? `Checkmate! ${turn === 'white' ? 'Black' : 'White'} wins!`
    : status === 'stalemate' ? 'Stalemate — Draw!'
    : status === 'check' ? `${turn === 'white' ? 'You are' : 'AI is'} in check!`
    : aiThinking ? '🤖 AI thinking...' : "Your turn (White)";

  const capRow = (color) => captured[color].map((p, i) =>
    <span key={i} style={{ fontSize: '18px', opacity: 0.8 }}>{SYMBOLS[p.color][p.type]}</span>
  );

  const diffBtn = (d, label) => (
    <button key={d} onClick={() => { setAiDifficulty(d); reset(); }} style={{
      padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
      background: aiDifficulty === d ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
      color: aiDifficulty === d ? '#22c55e' : 'rgba(226,232,240,0.5)',
      border: `1px solid ${aiDifficulty === d ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E18', padding: '20px 16px', fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} 
        .piece-white {
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4);
          font-weight: 900;
        }
        .piece-black {
          color: #1a1a1a;
          text-shadow: 0 1px 3px rgba(255,255,255,0.2);
          font-weight: 900;
        }
      `}</style>

      <h1 style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>♟ Chess vs AI</h1>

      {/* AI Difficulty */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {diffBtn('easy', '🟢 Easy')} {diffBtn('medium', '🟡 Medium')} {diffBtn('hard', '🔴 Hard')}
      </div>

      {/* Status */}
      <div style={{
        padding: '10px 20px', borderRadius: '12px', marginBottom: '12px', fontSize: '13px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '8px',
        background: status === 'checkmate' ? 'rgba(239,68,68,0.15)' : aiThinking ? 'rgba(59,130,246,0.12)' : status === 'check' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${status === 'checkmate' ? 'rgba(239,68,68,0.3)' : aiThinking ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
        color: status === 'checkmate' ? '#fca5a5' : aiThinking ? '#93c5fd' : status === 'check' ? '#fde047' : '#e2e8f0',
        animation: aiThinking ? 'pulse 1.2s infinite' : 'none',
      }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: turn === 'white' ? '#e2e8f0' : '#1e293b', border: '2px solid #64748b' }} />
        {statusMsg}
      </div>

      {/* Captured */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '11px', color: 'rgba(226,232,240,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>You captured: {capRow('black')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>AI captured: {capRow('white')}</div>
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
        
        {/* The Board Panel */}
        <div style={{ 
          opacity: aiThinking ? 0.85 : 1, pointerEvents: aiThinking ? 'none' : 'auto',
          background: '#121726', padding: '24px 32px', borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative'
        }}>
          {/* Top Coordinates */}
          <div style={{ display: 'flex', paddingLeft: '24px', paddingRight: '24px', marginBottom: '8px', width: '100%', justifyContent: 'center' }}>
            {FILES.map(f => <div key={f} style={{ width: '56px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{f}</div>)}
          </div>
          
          {/* Board Grid */}
          <div style={{ border: '2px solid #1e293b', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            {board.map((row, r) => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <span style={{ width: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 600, position: 'absolute', left: '-28px' }}>{RANKS[r]}</span>
                
                {row.map((piece, c) => {
                  const light = (r + c) % 2 === 0;
                  const sel = isSelected(r, c);
                  const valid = isValid(r, c);
                  const baseBg = light ? '#cbd5e1' : '#475569';
                  
                  return (
                    <div key={c} onClick={() => handleClick(r, c)} style={{
                      width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: sel ? 'rgba(234,179,8,0.6)' : valid ? (piece ? 'rgba(239,68,68,0.5)' : baseBg) : baseBg,
                      cursor: 'pointer', fontSize: '38px', position: 'relative',
                      boxShadow: sel ? 'inset 0 0 0 3px rgba(250,204,21,1)' : 'none',
                    }}>
                      {valid && !piece && <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} />}
                      {piece && <span className={`piece-${piece.color}`} style={{ 
                        lineHeight: 1, 
                        transform: sel ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                        transition: 'transform 0.15s ease',
                        filter: valid && piece ? 'drop-shadow(0 0 8px rgba(239,68,68,0.8))' : 'none',
                        zIndex: sel ? 10 : 1
                      }}>{SYMBOLS[piece.color][piece.type]}</span>}
                    </div>
                  );
                })}
                
                <span style={{ width: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 600, position: 'absolute', right: '-28px' }}>{RANKS[r]}</span>
              </div>
            ))}
          </div>

          {/* Bottom Coordinates */}
          <div style={{ display: 'flex', paddingLeft: '24px', paddingRight: '24px', marginTop: '8px', width: '100%', justifyContent: 'center' }}>
            {FILES.map(f => <div key={f} style={{ width: '56px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{f}</div>)}
          </div>
        </div>

        {/* Right Panel: Controls & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', background: '#121726', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={undo} disabled={!canUndo} style={{
              padding: '10px 14px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              background: canUndo ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
              color: canUndo ? '#3b82f6' : 'rgba(226,232,240,0.3)',
              fontSize: '13px', fontWeight: 700, cursor: canUndo ? 'pointer' : 'not-allowed',
              border: `1px solid ${canUndo ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
            }}>↶ Undo</button>
            
            <button onClick={redo} disabled={!canRedo} style={{
              padding: '10px 14px', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              background: canRedo ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
              color: canRedo ? '#3b82f6' : 'rgba(226,232,240,0.3)',
              fontSize: '13px', fontWeight: 700, cursor: canRedo ? 'pointer' : 'not-allowed',
              border: `1px solid ${canRedo ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
            }}>Redo ↷</button>
            
            <button onClick={reset} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.25)',
              marginLeft: '4px'
            }}>New Game</button>
          </div>

          {/* History */}
          <div style={{ width: '310px', height: '390px', overflowY: 'auto', borderRadius: '16px', background: '#121726', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Move History</h3>
            {!history.length && <p style={{ fontSize: '12px', color: 'rgba(226,232,240,0.3)' }}>No moves yet</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((m, i) => (
                <div key={i} style={{ 
                  fontSize: '13px', color: i % 2 === 0 ? '#e2e8f0' : '#93c5fd', 
                  padding: '8px 12px', borderRadius: '8px', 
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.06)',
                  display: 'flex', alignItems: 'center'
                }}>
                  <span style={{ color: '#64748b', fontSize: '11px', width: '24px' }}>{i + 1}.</span>
                  {m}
                  {i % 2 === 1 && <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 'auto' }}>🤖</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
