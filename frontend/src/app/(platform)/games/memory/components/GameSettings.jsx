"use client";
import { DIFFICULTIES } from "../utils/constants";

const CARD_SETS = ["science", "nature", "food"];

export default function GameSettings({ isOpen, onClose, onReset, onStart, difficulty, cardSet, setDifficulty, setCardSet }) {
  if (!isOpen) return null;

  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0', fontSize: '14px', outline: 'none', cursor: 'pointer',
  };
  const btnBase = {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        padding: '32px', borderRadius: '20px', maxWidth: '380px', width: '90%',
        background: 'linear-gradient(145deg, #0f172a, #1e293b)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '24px', textAlign: 'center' }}>
          ⚙️ Game Settings
        </h2>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(226,232,240,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Difficulty
          </label>
          <select style={selectStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {Object.keys(DIFFICULTIES).map((key) => (
              <option key={key} value={key} style={{ background: '#1e293b' }}>{DIFFICULTIES[key].label}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(226,232,240,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Theme
          </label>
          <select style={selectStyle} value={cardSet} onChange={(e) => setCardSet(e.target.value)}>
            {CARD_SETS.map((set) => (
              <option key={set} value={set} style={{ background: '#1e293b' }}>{set.charAt(0).toUpperCase() + set.slice(1)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...btnBase, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }} onClick={onStart}>Start</button>
          <button style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }} onClick={onReset}>Reset</button>
          <button style={{ ...btnBase, background: 'rgba(255,255,255,0.04)', color: 'rgba(226,232,240,0.6)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}