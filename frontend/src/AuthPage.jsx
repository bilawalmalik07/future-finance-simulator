import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUsername, signup, login } from './Api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh' }}>
      {/* Left hero panel */}
      <div style={{
        flex: isMobile ? 'none' : 1,
        background: 'linear-gradient(145deg, #0a0d0f 0%, #0d1a12 100%)',
        padding: isMobile ? '32px 24px' : '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: isMobile ? 'none' : '1px solid #1f2830',
        borderBottom: isMobile ? '1px solid #1f2830' : 'none',
        gap: isMobile ? 24 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: 'var(--green)', color: '#000', width: 32, height: 32,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18,
          }}>$</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>FutureFinance</span>
        </div>

        <div style={{ maxWidth: 460 }}>
          <div style={{
            display: 'inline-block', background: 'var(--green-glow)', color: 'var(--green)',
            border: '1px solid rgba(0,230,118,0.2)', borderRadius: 20, padding: '4px 14px',
            fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16,
          }}>Financial Simulation</div>
          <h1 style={{ fontSize: isMobile ? 36 : 52, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 16, color: 'var(--text)' }}>
            Learn money by<br />
            <span style={{ color: 'var(--green)' }}>living it.</span>
          </h1>
          {!isMobile && (
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 380 }}>
              Get a career, build a budget, survive life's surprises.
              12 months of decisions that actually teach you something.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 24 : 40 }}>
          {[['10', 'Career Paths'], ['12', 'Simulated Months'], ['850', 'Max Credit Score']].map(([n, l]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: isMobile ? 24 : 32, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{n}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{
        width: isMobile ? '100%' : 440,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '32px 24px' : 40,
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: isMobile ? 24 : 36, width: '100%',
        }}>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 4, marginBottom: 28, gap: 4 }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 6,
                  background: mode === m ? 'var(--border)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}
                onClick={() => { setMode(m); setError(''); }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Username</label>
            <input
              className="input-field"
              placeholder=""
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ marginBottom: error ? 8 : 20 }}
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 16 }}>{error}</p>}

            <button
              className="btn-primary"
              style={{ width: '100%', opacity: status === 'loading' ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Loading…' : mode === 'login' ? 'Sign In →' : 'Start Simulation →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
              {mode === 'login' ? "No account? " : "Already have one? "}
              <span
                style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }}
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