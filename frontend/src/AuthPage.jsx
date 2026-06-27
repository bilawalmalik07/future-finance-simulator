import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUsername, signup, login } from './Api';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit() {
    if (!username.trim()) return;
    setStatus('loading');
    setError('');
    try {
      if (mode === 'signup') {
        const check = await checkUsername(username.trim());
        if (!check.data.available) {
          setError('Username already taken. Try another.');
          setStatus('error');
          return;
        }
        const res = await signup(username.trim());
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        const res = await login(username.trim());
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong. Try again.');
      setStatus('error');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>$</span>
          <span style={styles.logoText}>FutureFinance</span>
        </div>
        <div style={styles.heroBlock}>
          <div style={styles.pill}>Financial Simulation</div>
          <h1 style={styles.heroTitle}>
            Learn money by<br />
            <span style={styles.heroAccent}>living it.</span>
          </h1>
          <p style={styles.heroSub}>
            Get a career, build a budget, survive life's surprises.
            12 months of decisions that actually teach you something.
          </p>
        </div>
        <div style={styles.stats}>
          {[['10', 'Career Paths'], ['12', 'Simulated Months'], ['850', 'Max Credit Score']].map(([n, l]) => (
            <div key={l} style={styles.stat}>
              <span style={styles.statNum}>{n}</span>
              <span style={styles.statLabel}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.tabs}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
                onClick={() => { setMode(m); setError(''); }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={styles.form}>
            <label style={styles.label}>Username</label>
            <input
              className="input-field"
              placeholder="e.g. alex_budget"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ marginBottom: error ? 8 : 20 }}
            />
            {error && <p style={styles.error}>{error}</p>}

            <button
              className="btn-primary"
              style={{ width: '100%', opacity: status === 'loading' ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Loading…' : mode === 'login' ? 'Sign In →' : 'Start Simulation →'}
            </button>

            <p style={styles.hint}>
              {mode === 'login' ? "No account? " : "Already have one? "}
              <span
                style={styles.hintLink}
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },
  left: {
    flex: 1,
    background: 'linear-gradient(145deg, #0a0d0f 0%, #0d1a12 100%)',
    padding: '48px 56px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRight: '1px solid #1f2830',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: {
    background: 'var(--green)', color: '#000', width: 32, height: 32,
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18,
    lineHeight: '32px', textAlign: 'center',
  },
  logoText: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px' },
  heroBlock: { maxWidth: 460 },
  pill: {
    display: 'inline-block', background: 'var(--green-glow)', color: 'var(--green)',
    border: '1px solid rgba(0,230,118,0.2)', borderRadius: 20, padding: '4px 14px',
    fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20,
  },
  heroTitle: { fontSize: 52, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20, color: 'var(--text)' },
  heroAccent: { color: 'var(--green)' },
  heroSub: { fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 380 },
  stats: { display: 'flex', gap: 40 },
  stat: { display: 'flex', flexDirection: 'column' },
  statNum: { fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, color: 'var(--green)', lineHeight: 1 },
  statLabel: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4 },
  right: { width: 440, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 36, width: '100%' },
  tabs: { display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 4, marginBottom: 28, gap: 4 },
  tab: { flex: 1, padding: '9px 0', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s' },
  tabActive: { background: 'var(--border)', color: 'var(--text)' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  error: { color: 'var(--red)', fontSize: 12, marginBottom: 16 },
  hint: { textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 13 },
  hintLink: { color: 'var(--green)', cursor: 'pointer', fontWeight: 600 },
};