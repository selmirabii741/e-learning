"use client";
import useScrabbleGame from "./hooks/useScrabbleGame";
import { getPremium, PREMIUM_COLORS, TILE_SCORES } from "./utils/scrabbleUtils";

export default function ScrabbleGameClient() {
  const {
    board, rack, currentPlayer, selectedTile, placedTiles,
    scores, tilesLeft, gameOver,
    selectTile, placeTile, removePlaced, submitWord, passTurn, exchangeTiles, reset,
  } = useScrabbleGame();

  const isPlaced = (r, c) => placedTiles.find(t => t.r === r && t.c === c);
  const usedRackIndices = new Set(placedTiles.map(t => t.rackIdx));

  const btn = (bg, color, extra = {}) => ({
    padding: '8px 18px', borderRadius: '10px', border: 'none',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', ...extra,
    background: bg, color,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E18', padding: '20px 12px', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#e2e8f0', fontSize: '1.6rem', fontWeight: 800, marginBottom: '14px' }}>🔤 Scrabble</h1>

      {/* Scoreboard */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
        {[0, 1].map(p => (
          <div key={p} style={{
            padding: '10px 22px', borderRadius: '12px',
            background: currentPlayer === p ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${currentPlayer === p ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.5)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Player {p + 1}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: currentPlayer === p ? '#22c55e' : '#e2e8f0' }}>{scores[p]}</div>
          </div>
        ))}
        <div style={{
          padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Tiles Left</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e2e8f0' }}>{tilesLeft}</div>
        </div>
      </div>

      {gameOver && (
        <div style={{
          padding: '16px 32px', borderRadius: '14px', marginBottom: '14px', textAlign: 'center',
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>
            🏆 {scores[0] > scores[1] ? 'Player 1' : scores[1] > scores[0] ? 'Player 2' : 'Nobody'} wins!
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(226,232,240,0.6)', marginTop: '4px' }}>
            {scores[0]} — {scores[1]}
          </div>
          <button onClick={reset} style={btn('linear-gradient(135deg, #22c55e, #16a34a)', '#fff', { marginTop: '10px', padding: '10px 28px' })}>
            New Game
          </button>
        </div>
      )}

      {/* Board */}
      <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: '1.5px', padding: '4px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => {
              const placed = isPlaced(r, c);
              const boardTile = board[r][c];
              const prem = getPremium(r, c);
              const premInfo = prem ? PREMIUM_COLORS[prem] : null;
              const isCenter = r === 7 && c === 7;

              return (
                <div key={`${r}-${c}`} onClick={() => !boardTile && !gameOver && placeTile(r, c)} style={{
                  width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '4px', cursor: boardTile ? 'default' : 'pointer', fontSize: '11px', fontWeight: 700,
                  position: 'relative', transition: 'all 0.15s',
                  background: placed ? '#d4a843'
                    : boardTile ? '#c9a94e'
                    : premInfo ? premInfo.bg
                    : isCenter ? 'rgba(234,179,8,0.25)'
                    : 'rgba(15,23,42,0.8)',
                  color: placed || boardTile ? '#1a1a2e' : premInfo ? '#fff' : 'rgba(226,232,240,0.2)',
                  border: placed ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.04)',
                }}>
                  {placed ? (
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{placed.letter}</span>
                  ) : boardTile ? (
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{boardTile}</span>
                  ) : premInfo ? (
                    <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.9 }}>{premInfo.label}</span>
                  ) : isCenter ? (
                    <span style={{ fontSize: '14px' }}>⭐</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Placed tiles (removable) */}
      {placedTiles.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(226,232,240,0.4)', alignSelf: 'center', marginRight: '4px' }}>Placed:</span>
          {placedTiles.map((t, i) => (
            <button key={i} onClick={() => removePlaced(i)} title="Click to remove" style={{
              width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid rgba(234,179,8,0.4)',
              background: '#d4a843', color: '#1a1a2e', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{t.letter}</button>
          ))}
        </div>
      )}

      {/* Tile rack */}
      {!gameOver && (
        <div style={{
          padding: '14px 20px', borderRadius: '14px', marginBottom: '14px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.4)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', textAlign: 'center' }}>
            Player {currentPlayer + 1}'s Rack
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {rack.map((letter, i) => {
              const used = usedRackIndices.has(i);
              return (
                <button key={i} onClick={() => !used && selectTile(i)} disabled={used} style={{
                  width: '44px', height: '44px', borderRadius: '8px', cursor: used ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: used ? 'rgba(255,255,255,0.02)' : selectedTile === i ? '#eab308' : '#c9a94e',
                  border: selectedTile === i ? '2px solid #fde047' : '2px solid transparent',
                  color: used ? 'rgba(226,232,240,0.15)' : '#1a1a2e',
                  boxShadow: selectedTile === i ? '0 0 16px rgba(234,179,8,0.3)' : used ? 'none' : '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'all 0.15s', opacity: used ? 0.3 : 1,
                }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>{letter === '_' ? ' ' : letter}</span>
                  <span style={{ fontSize: '8px', fontWeight: 700, opacity: 0.6 }}>{letter === '_' ? '0' : TILE_SCORES[letter]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!gameOver && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={submitWord} disabled={placedTiles.length === 0}
            style={btn(placedTiles.length ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.06)', placedTiles.length ? '#fff' : 'rgba(226,232,240,0.3)', { boxShadow: placedTiles.length ? '0 4px 16px rgba(34,197,94,0.25)' : 'none' })}>
            Submit Word
          </button>
          <button onClick={exchangeTiles} disabled={selectedTile === null}
            style={btn('rgba(59,130,246,0.15)', '#60a5fa', { border: '1px solid rgba(59,130,246,0.3)' })}>
            Exchange Tile
          </button>
          <button onClick={passTurn}
            style={btn('rgba(255,255,255,0.06)', 'rgba(226,232,240,0.6)', { border: '1px solid rgba(255,255,255,0.08)' })}>
            Pass Turn
          </button>
          <button onClick={reset}
            style={btn('rgba(239,68,68,0.1)', '#fca5a5', { border: '1px solid rgba(239,68,68,0.2)' })}>
            Reset
          </button>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '20px', padding: '14px 20px', borderRadius: '12px', maxWidth: '520px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
        fontSize: '12px', color: 'rgba(226,232,240,0.4)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'rgba(226,232,240,0.6)' }}>How to play:</strong> Select a tile from your rack, then click a board square to place it.
        Click placed tiles to remove them. Press "Submit Word" to confirm. Premium squares:
        <span style={{ color: '#c0392b' }}> 3W</span>,
        <span style={{ color: '#e8a0bf' }}> 2W</span>,
        <span style={{ color: '#2980b9' }}> 3L</span>,
        <span style={{ color: '#5dade2' }}> 2L</span>.
      </div>
    </div>
  );
}
