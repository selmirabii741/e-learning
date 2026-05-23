import dynamic from 'next/dynamic';
const MindCrashClient = dynamic(() => import('./MindCrashClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight:'100vh', background:'#07060b', display:'flex', alignItems:'center', justifyContent:'center', color:'#0ff' }}>
      <h1 style={{ fontSize:'2rem', fontWeight:900, fontFamily:'monospace' }}>LOADING MINDCRASH...</h1>
    </div>
  ),
});
export default function MindCrashPage() { return <MindCrashClient />; }
