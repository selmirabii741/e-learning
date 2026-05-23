"use client";

const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };
const CARD_SET_LABELS = { science: "Science", nature: "Nature", food: "Food" };

const statBox = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  padding: '8px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
};
const statLabel = { fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(226,232,240,0.4)' };
const statValue = { fontSize: '16px', fontWeight: 700, color: '#e2e8f0' };
const btnStyle = {
  padding: '8px 20px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.3)',
  background: 'rgba(34,197,94,0.1)', color: '#22c55e',
  fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
};

export default function GameHUD({ moves, timeElapsed, matchedPairs, score, isGameStarted, isGameOver, onToggleSettings, settingsOpen, difficulty, cardSet }) {
  const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
  const s = (timeElapsed % 60).toString().padStart(2, '0');

  return (
    <div style={{
      maxWidth: '700px', margin: '0 auto 8px', padding: '14px 20px',
      borderRadius: '16px', background: 'rgba(15,23,42,0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          ['Moves', moves], ['Time', `${m}:${s}`], ['Pairs', matchedPairs],
          ['Score', score], ['Difficulty', DIFFICULTY_LABELS[difficulty] || difficulty],
          ['Theme', CARD_SET_LABELS[cardSet] || cardSet],
        ].map(([label, value]) => (
          <div key={label} style={statBox}>
            <span style={statLabel}>{label}</span>
            <span style={statValue}>{value}</span>
          </div>
        ))}
      </div>
      <button
        style={btnStyle}
        onClick={onToggleSettings}
        onMouseEnter={e => { e.target.style.background = 'rgba(34,197,94,0.2)'; }}
        onMouseLeave={e => { e.target.style.background = 'rgba(34,197,94,0.1)'; }}
      >
        {isGameOver ? 'Play Again' : settingsOpen ? 'Close' : 'Settings'}
      </button>
    </div>
  );
}