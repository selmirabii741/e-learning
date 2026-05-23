"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const GRID = 16; // 4x4
const COLORS = ['#0ff','#f0f','#0f0','#ff0','#f44','#4af','#fa0','#a4f','#0fa','#ff4','#f4a','#4ff','#a0f','#af4','#f04','#4fa'];

export default function MindCrashClient() {
  const [phase, setPhase] = useState('menu'); // menu|countdown|showing|player|ai|result|gameover
  const [seq, setSeq] = useState([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [playerInput, setPlayerInput] = useState([]);
  const [aiInput, setAiInput] = useState([]);
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [aiLives, setAiLives] = useState(3);
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null); // 'correct'|'wrong'
  const [aiDiff, setAiDiff] = useState(0.82);
  const [countdown, setCountdown] = useState(3);
  const [aiShowIdx, setAiShowIdx] = useState(-1);
  const [lastActive, setLastActive] = useState(-1);
  const timerRef = useRef(null);

  const seqLen = () => 3 + round;
  const speed = () => Math.max(250, 600 - round * 30);

  const genSeq = useCallback(() => {
    const s = [];
    for (let i = 0; i < seqLen(); i++) s.push(Math.floor(Math.random() * GRID));
    return s;
  }, [round]);

  const startGame = (diff) => {
    setAiDiff(diff);
    setRound(0); setLives(3); setAiLives(3); setScore(0); setAiScore(0);
    setPhase('countdown'); setCountdown(3);
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) { beginRound(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const beginRound = useCallback(() => {
    const s = genSeq();
    setSeq(s); setPlayerInput([]); setAiInput([]);
    setShowIdx(-1); setPhase('showing');
  }, [genSeq]);

  // Show sequence
  useEffect(() => {
    if (phase !== 'showing') return;
    let i = -1;
    const sp = speed();
    const show = () => {
      i++;
      if (i >= seq.length) {
        setShowIdx(-1); setLastActive(-1);
        setTimeout(() => setPhase('player'), 400);
        return;
      }
      setShowIdx(seq[i]); setLastActive(seq[i]);
      timerRef.current = setTimeout(() => { setShowIdx(-1); timerRef.current = setTimeout(show, sp * 0.3); }, sp);
    };
    timerRef.current = setTimeout(show, 500);
    return () => clearTimeout(timerRef.current);
  }, [phase, seq]);

  // Player clicks tile
  const handleTile = (idx) => {
    if (phase !== 'player') return;
    const step = playerInput.length;
    setLastActive(idx);
    setTimeout(() => setLastActive(-1), 200);

    if (idx === seq[step]) {
      const newInput = [...playerInput, idx];
      setPlayerInput(newInput);
      if (newInput.length === seq.length) {
        setScore(s => s + seq.length * 10 + round * 5);
        setFlash('correct');
        setTimeout(() => { setFlash(null); setPhase('ai'); }, 600);
      }
    } else {
      setShake(true); setFlash('wrong');
      setLives(l => l - 1);
      setTimeout(() => { setShake(false); setFlash(null); }, 500);
      setTimeout(() => {
        if (lives - 1 <= 0) setPhase('gameover');
        else setPhase('ai');
      }, 800);
    }
  };

  // AI turn
  useEffect(() => {
    if (phase !== 'ai') return;
    let i = 0;
    const sp = speed();
    const aiPlay = () => {
      if (i >= seq.length) {
        const correct = aiInput.length === seq.length && !aiInput.failed;
        if (correct) setAiScore(s => s + seq.length * 10 + round * 5);
        else setAiLives(l => l - 1);
        setTimeout(() => {
          if (!correct && aiLives - 1 <= 0) setPhase('gameover');
          else { setRound(r => r + 1); setPhase('countdown'); setCountdown(3); }
        }, 800);
        return;
      }
      // AI decides
      const correct = Math.random() < aiDiff;
      const tile = correct ? seq[i] : ((seq[i] + 1 + Math.floor(Math.random() * (GRID - 1))) % GRID);
      setAiShowIdx(tile); setLastActive(tile);
      setAiInput(prev => {
        const n = [...prev, tile];
        if (!correct) n.failed = true;
        return n;
      });
      if (!correct) {
        setTimeout(() => { setAiShowIdx(-1); setLastActive(-1); setShake(true); setTimeout(() => setShake(false), 400); }, sp);
        i = seq.length; // end AI turn
        setTimeout(aiPlay, sp + 200);
      } else {
        setTimeout(() => { setAiShowIdx(-1); setLastActive(-1); i++; setTimeout(aiPlay, sp * 0.3); }, sp);
      }
    };
    const t = setTimeout(aiPlay, 600);
    return () => clearTimeout(t);
  }, [phase]);

  const reset = () => setPhase('menu');

  const tileStyle = (i, active) => ({
    width: '72px', height: '72px', borderRadius: '10px', cursor: phase === 'player' ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? COLORS[i] : 'rgba(255,255,255,0.04)',
    border: `2px solid ${active ? COLORS[i] : 'rgba(255,255,255,0.08)'}`,
    boxShadow: active ? `0 0 25px ${COLORS[i]}, 0 0 50px ${COLORS[i]}44, inset 0 0 15px ${COLORS[i]}66` : 'none',
    transition: 'all 0.1s', transform: active ? 'scale(1.08)' : 'scale(1)',
    fontSize: '10px', color: active ? '#000' : 'rgba(255,255,255,0.1)', fontWeight: 800,
  });

  const isActive = (i) => showIdx === i || aiShowIdx === i || lastActive === i;

  return (
    <div style={{
      minHeight: '100vh', background: '#07060b', padding: '20px', fontFamily: "'Courier New',monospace",
      display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden',
      animation: shake ? 'mc-shake 0.3s' : 'none',
    }}>
      <style>{`
        @keyframes mc-glitch{0%,100%{text-shadow:-2px 0 #f0f,2px 0 #0ff}20%{text-shadow:3px 0 #f0f,-3px 0 #0ff}40%{text-shadow:-1px 2px #f0f,1px -2px #0ff}60%{text-shadow:2px -1px #f0f,-2px 1px #0ff}80%{text-shadow:-3px 0 #f0f,3px 0 #0ff}}
        @keyframes mc-scan{0%{top:-10%}100%{top:110%}}
        @keyframes mc-pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes mc-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px) rotate(-0.5deg)}75%{transform:translateX(8px) rotate(0.5deg)}}
        @keyframes mc-flash-correct{0%{background:rgba(0,255,0,0.15)}100%{background:transparent}}
        @keyframes mc-flash-wrong{0%{background:rgba(255,0,0,0.2)}100%{background:transparent}}
        @keyframes mc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes mc-grid{0%{opacity:.03}50%{opacity:.06}100%{opacity:.03}}
      `}</style>

      {/* Scanline overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 4px)' }} />
      <div style={{ position: 'fixed', left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.15), transparent)', zIndex: 100, pointerEvents: 'none', animation: 'mc-scan 4s linear infinite' }} />

      {/* Flash overlay */}
      {flash && <div style={{ position: 'fixed', inset: 0, zIndex: 90, pointerEvents: 'none', animation: `mc-flash-${flash} 0.5s forwards` }} />}

      {/* Grid background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', animation: 'mc-grid 3s infinite' }} />

      {/* Title */}
      <h1 style={{
        fontSize: phase === 'menu' ? '3rem' : '1.8rem', fontWeight: 900, color: '#0ff', letterSpacing: '0.15em',
        animation: 'mc-glitch 2s infinite', marginBottom: phase === 'menu' ? '8px' : '10px',
        textTransform: 'uppercase', position: 'relative', zIndex: 2,
      }}>
        MIND<span style={{ color: '#f0f' }}>CRASH</span>
      </h1>

      {/* Menu */}
      {phase === 'menu' && (
        <div style={{ textAlign: 'center', zIndex: 2, animation: 'mc-float 3s ease-in-out infinite' }}>
          <p style={{ color: 'rgba(0,255,255,0.5)', fontSize: '13px', marginBottom: '30px', maxWidth: '400px', lineHeight: 1.7 }}>
            Watch the pattern. Repeat it. Survive.<br />Compete against a neural AI opponent.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {[[0.7, '🟢 EASY MODE', 'rgba(0,255,0,0.12)', '#0f0', 'rgba(0,255,0,0.3)'],
              [0.85, '🟡 MEDIUM MODE', 'rgba(255,255,0,0.1)', '#ff0', 'rgba(255,255,0,0.3)'],
              [0.95, '🔴 HARD MODE', 'rgba(255,0,0,0.1)', '#f44', 'rgba(255,0,0,0.3)']
            ].map(([d, label, bg, color, border]) => (
              <button key={d} onClick={() => startGame(d)} style={{
                padding: '14px 40px', borderRadius: '8px', border: `1px solid ${border}`,
                background: bg, color, fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                fontFamily: 'monospace', letterSpacing: '0.1em', width: '260px',
                transition: 'all 0.2s', textTransform: 'uppercase',
              }}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div style={{ fontSize: '6rem', fontWeight: 900, color: '#0ff', animation: 'mc-pulse 0.8s', zIndex: 2, marginTop: '60px',
          textShadow: '0 0 30px #0ff, 0 0 60px #0ff44' }}>
          {countdown || 'GO!'}
        </div>
      )}

      {/* Game UI */}
      {!['menu', 'countdown', 'gameover'].includes(phase) && (
        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* HUD */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              ['ROUND', round + 1, '#0ff'],
              ['YOU', score, '#0f0'],
              ['♥', '❤'.repeat(lives), '#f44'],
              ['AI', aiScore, '#f0f'],
              ['♥', '💜'.repeat(aiLives), '#a4f'],
            ].map(([l, v, c], i) => (
              <div key={i} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Phase indicator */}
          <div style={{
            padding: '6px 18px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em',
            background: phase === 'showing' ? 'rgba(0,255,255,0.1)' : phase === 'player' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,255,0.1)',
            color: phase === 'showing' ? '#0ff' : phase === 'player' ? '#0f0' : '#f0f',
            border: `1px solid ${phase === 'showing' ? 'rgba(0,255,255,0.3)' : phase === 'player' ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,255,0.3)'}`,
            animation: phase === 'showing' ? 'mc-pulse 1s infinite' : 'none',
          }}>
            {phase === 'showing' ? '⚡ MEMORIZE' : phase === 'player' ? '🎯 YOUR TURN' : phase === 'ai' ? '🤖 AI PLAYING' : '⏳ LOADING'}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
            {seq.map((_, i) => {
              const done = phase === 'player' ? i < playerInput.length : phase === 'ai' ? i < aiInput.length : i <= (showIdx >= 0 ? seq.indexOf(showIdx) : -1);
              const wrong = phase === 'player' && i === playerInput.length - 1 && flash === 'wrong';
              return <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: wrong ? '#f44' : done ? (phase === 'ai' ? '#f0f' : '#0f0') : 'rgba(255,255,255,0.1)',
                boxShadow: done ? `0 0 6px ${phase === 'ai' ? '#f0f' : '#0f0'}` : 'none',
                transition: 'all 0.15s',
              }} />;
            })}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {Array.from({ length: GRID }).map((_, i) => (
              <div key={i} onClick={() => handleTile(i)} style={tileStyle(i, isActive(i))}>
                {isActive(i) ? '█' : (i + 1).toString(16).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === 'gameover' && (
        <div style={{ zIndex: 2, textAlign: 'center', marginTop: '30px', animation: 'mc-float 3s ease-in-out infinite' }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>{score > aiScore ? '🏆' : score < aiScore ? '🤖' : '🤝'}</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: score > aiScore ? '#0f0' : '#f44', marginBottom: '8px',
            textShadow: `0 0 20px ${score > aiScore ? '#0f0' : '#f44'}` }}>
            {score > aiScore ? 'YOU WIN!' : score < aiScore ? 'AI WINS!' : 'DRAW!'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
            Round {round + 1} reached
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
            {[['YOUR SCORE', score, '#0ff'], ['AI SCORE', aiScore, '#f0f']].map(([l, v, c]) => (
              <div key={l} style={{ padding: '14px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c, textShadow: `0 0 15px ${c}44` }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => startGame(aiDiff)} style={{
              padding: '12px 28px', borderRadius: '8px', border: '1px solid rgba(0,255,255,0.3)',
              background: 'rgba(0,255,255,0.1)', color: '#0ff', fontSize: '14px', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.1em',
            }}>RETRY</button>
            <button onClick={reset} style={{
              padding: '12px 28px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.1em',
            }}>MENU</button>
          </div>
        </div>
      )}
    </div>
  );
}
