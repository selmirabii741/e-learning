'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function getStrength(pw) {
  if (!pw) return { level: 0, label: '', color: '#1e293b' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Faible',  color: '#ef4444' };
  if (score <= 3) return { level: 2, label: 'Moyen',   color: '#f59e0b' };
  return             { level: 3, label: 'Fort',    color: '#22c55e' };
}

function SetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await authAPI.setPassword({ token, password: form.password, confirmPassword: form.confirm });
      setDone(true);
      toast.success('Compte activé ! Vous pouvez maintenant vous connecter.');
      setTimeout(() => router.push('/'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la définition du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.root}>
        <div style={styles.card}>
          <div style={styles.logo}>🎓 EduAI</div>
          <p style={{ ...styles.title, color: '#f87171' }}>Lien invalide</p>
          <p style={styles.subtitle}>Aucun token de réinitialisation trouvé dans l'URL.</p>
          <Link href="/" style={{ ...styles.btn, marginTop: '20px' }}>Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Background orbs */}
      <div style={{ ...styles.orb, top: '-15%', left: '-10%', background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)' }} />
      <div style={{ ...styles.orb, bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

      <div style={styles.card}>
        <div style={styles.logo}>🎓 EduAI</div>

        {done ? (
          <div style={styles.center}>
            <CheckCircle2 size={52} style={{ color: '#22c55e' }} />
            <p style={styles.title}>Compte activé !</p>
            <p style={styles.subtitle}>Redirection vers la page de connexion…</p>
          </div>
        ) : (
          <>
            <div style={styles.center}>
              <div style={styles.iconWrap}>
                <Lock size={26} style={{ color: '#818cf8' }} />
              </div>
              <p style={styles.title}>Définir votre mot de passe</p>
              <p style={styles.subtitle}>
                Choisissez un mot de passe fort pour sécuriser votre compte instructeur.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '28px' }}>
              {/* Password */}
              <div style={styles.field}>
                <label style={styles.label}>Nouveau mot de passe *</label>
                <div style={styles.inputWrap}>
                  <input
                    required
                    type={show.password ? 'text' : 'password'}
                    minLength={8}
                    placeholder="Min. 8 caractères"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    style={styles.input}
                  />
                  <button type="button" onClick={() => toggle('password')} style={styles.eyeBtn}>
                    {show.password ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={styles.strengthBar}>
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          style={{
                            ...styles.strengthSegment,
                            background: strength.level >= n ? strength.color : '#1e293b',
                            transition: 'background 0.25s',
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div style={{ ...styles.field, marginTop: '16px' }}>
                <label style={styles.label}>Confirmer le mot de passe *</label>
                <div style={styles.inputWrap}>
                  <input
                    required
                    type={show.confirm ? 'text' : 'password'}
                    minLength={8}
                    placeholder="Répétez le mot de passe"
                    value={form.confirm}
                    onChange={(e) => set('confirm', e.target.value)}
                    style={{
                      ...styles.input,
                      borderColor:
                        form.confirm.length > 0
                          ? form.confirm === form.password
                            ? 'rgba(34,197,94,0.4)'
                            : 'rgba(239,68,68,0.4)'
                          : 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <button type="button" onClick={() => toggle('confirm')} style={styles.eyeBtn}>
                    {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirm.length > 0 && form.confirm !== form.password && (
                  <p style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              {/* Tips */}
              <ul style={styles.tips}>
                {[
                  'Au moins 8 caractères',
                  'Une lettre majuscule',
                  'Un chiffre',
                  'Un caractère spécial (recommandé)',
                ].map((tip) => (
                  <li key={tip} style={styles.tip}>
                    <span style={{ color: '#6366f1', marginRight: '6px' }}>•</span>{tip}
                  </li>
                ))}
              </ul>

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : null}
                {loading ? 'Activation…' : 'Activer mon compte'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
      `}</style>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
        <div style={{ width: 24, height: 24, border: '2.5px solid #1e293b', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <SetPasswordInner />
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
    padding: '24px',
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
    background: 'rgba(15,15,30,0.88)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '460px',
    width: '100%',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 800,
    background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '28px',
    textAlign: 'center',
    letterSpacing: '-0.5px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'center',
  },
  iconWrap: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '340px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '11px 40px 11px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
  },
  strengthBar: {
    display: 'flex',
    gap: '4px',
    height: '4px',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  strengthSegment: {
    flex: 1,
    borderRadius: '4px',
    height: '4px',
  },
  tips: {
    margin: '16px 0 24px',
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tip: {
    fontSize: '12px',
    color: '#475569',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
};
