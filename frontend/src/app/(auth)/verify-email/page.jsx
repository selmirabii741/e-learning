'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Aucun token de vérification trouvé dans l\'URL.');
      return;
    }

    (async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        // Redirect to set-password page with the one-time token
        router.replace(`/set-password?token=${data.setPasswordToken}`);
      } catch (err) {
        setStatus('error');
        setErrorMsg(
          err.response?.data?.message ||
            'Lien invalide ou expiré. Contactez l\'administrateur.'
        );
      }
    })();
  }, [token, router]);

  return (
    <div style={styles.root}>
      {/* Background orbs */}
      <div style={{ ...styles.orb, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)' }} />
      <div style={{ ...styles.orb, bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>🎓 EduAI</div>

        {status === 'loading' && (
          <div style={styles.center}>
            <Loader2 size={48} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
            <p style={styles.title}>Vérification en cours…</p>
            <p style={styles.subtitle}>Validation de votre lien de confirmation.</p>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.center}>
            <XCircle size={52} style={{ color: '#f87171' }} />
            <p style={{ ...styles.title, color: '#f87171' }}>Lien invalide</p>
            <p style={styles.subtitle}>{errorMsg}</p>
            <Link href="/" style={styles.btn}>
              Retour à l'accueil
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
        <div style={{ width: 24, height: 24, border: '2.5px solid #1e293b', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080810',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  orb: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(15,15,30,0.85)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '440px',
    width: '90%',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 800,
    background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '32px',
    letterSpacing: '-0.5px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '320px',
  },
  btn: {
    marginTop: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 28px',
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '14px',
    textDecoration: 'none',
  },
};
