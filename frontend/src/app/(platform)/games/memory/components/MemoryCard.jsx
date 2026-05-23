"use client";

export default function MemoryCard({ card, onClick, disabled }) {
  const { emoji, isFlipped, isMatched } = card;
  const showFront = isFlipped || isMatched;

  return (
    <div
      className="memory-card"
      style={{ perspective: '800px', cursor: disabled || showFront ? 'default' : 'pointer' }}
      onClick={!disabled && !isFlipped && !isMatched ? onClick : undefined}
      role="button"
      aria-label={showFront ? `Card: ${emoji}` : 'Hidden card'}
      tabIndex={disabled || showFront ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div
        className={`card-inner${showFront ? ' flipped' : ''}`}
        style={{ position: 'relative', width: '100%', aspectRatio: '1' }}
      >
        {/* Back face — ✦ symbol (visible by default) */}
        <div
          className="card-face"
          style={{
            position: 'absolute', inset: 0, borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(145deg, #1e3a5f 0%, #2a4d7a 100%)',
            border: '1.5px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            fontSize: '1.4rem', color: 'rgba(255,255,255,0.2)', userSelect: 'none',
          }}
        >
          ✦
        </div>

        {/* Front face — emoji (hidden, revealed on flip) */}
        <div
          className="card-face card-front"
          style={{
            position: 'absolute', inset: 0, borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isMatched
              ? 'linear-gradient(145deg, #065f46, #047857)'
              : 'linear-gradient(145deg, #0f1d32, #1a2744)',
            border: isMatched
              ? '1.5px solid rgba(34,197,94,0.4)'
              : '1.5px solid rgba(255,255,255,0.1)',
            boxShadow: isMatched
              ? '0 0 24px rgba(34,197,94,0.2), 0 4px 20px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(0,0,0,0.4)',
            fontSize: '2rem', userSelect: 'none',
            animation: isMatched ? 'matchPulse 2s ease-in-out infinite' : 'none',
          }}
        >
          <span style={{ filter: isMatched ? 'drop-shadow(0 0 6px rgba(34,197,94,0.4))' : 'none' }}>
            {emoji}
          </span>
        </div>
      </div>
    </div>
  );
}