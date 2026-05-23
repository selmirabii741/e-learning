import dynamic from 'next/dynamic';

const MemoryGameClient = dynamic(() => import('./MemoryGameClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', background: '#0A0E18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Memory Game</h1>
        <p style={{ color: 'rgba(226,232,240,0.5)', marginTop: 8 }}>Loading...</p>
      </div>
    </div>
  ),
});

export default function MemoryGamePage() {
  return <MemoryGameClient />;
}