"use client";

export default function GameOverlay({ isGameOver, isGameStarted, onReset, onStart, moves, timeElapsed, score, formatTime }) {
  if (!isGameOver && isGameStarted) return null;

  const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
  const s = (timeElapsed % 60).toString().padStart(2, '0');
  const isWon = isGameOver && isGameStarted;

  const btn = {
    padding: '12px 32px', borderRadius: '12px', border: 'none',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'transform 0.2s, box-shadow 0.2s',
  };
  const statBox = {
    textAlign: 'center', padding: '12px 18px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        padding: '40px 48px', borderRadius: '24px', textAlign: 'center',
        background: 'linear-gradient(145deg, #0f172a, #1e293b)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)', maxWidth: '420px', width: '90%',
      }}>
        {isGameStarted ? (
          <>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '8px' }}>
              {isWon ? '🎉 Brilliant!' : '⏰ Game Over!'}
            </h2>
            <p style={{ color: 'rgba(226,232,240,0.6)', marginBottom: '24px', fontSize: '14px' }}>
              {isWon ? 'You matched all pairs!' : "Time's up — try again!"}
            </p>
            {isWon && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }}>
                {[['Score', score.toLocaleString()], ['Moves', moves], ['Time', `${m}:${s}`]].map(([l, v]) => (
                  <div key={l} style={statBox}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#22c55e' }}>{v}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.5)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
            <button style={btn} onClick={onReset}
              onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
            >Play Again</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧠</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '8px' }}>Memory Game</h2>
            <p style={{ color: 'rgba(226,232,240,0.5)', marginBottom: '28px', fontSize: '14px' }}>
              Match all the pairs as fast as you can!
            </p>
            <button style={btn} onClick={onStart}
              onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
            >Start Game</button>
          </>
        )}
      </div>
    </div>
  );
}