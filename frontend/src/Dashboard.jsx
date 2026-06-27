import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSimulation, getFunFact } from './Api';

const jobIcons = {
  'Software Engineer': '💻', 'Teacher': '📚', 'Nurse': '🏥',
  'Electrician': '⚡', 'Entrepreneur': '🚀', 'Graphic Designer': '🎨',
  'Police Officer': '🛡️', 'Accountant': '📊', 'Chef': '👨‍🍳', 'Pharmacist': '💊',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sim, setSim] = useState(null);
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return navigate('/');
    setUser(JSON.parse(stored));
    const storedSim = localStorage.getItem('simulation');
    if (storedSim) setSim(JSON.parse(storedSim));
    setMonth(parseInt(localStorage.getItem('currentMonth') || '1'));
    getFunFact().then(r => setFact(r.data.fact)).catch(() => {});
  }, []);

  async function handleStartSim() {
    setLoading(true);
    try {
      const res = await startSimulation(user.id);
      const simulation = res.data.simulation;
      localStorage.setItem('simulation', JSON.stringify(simulation));
      localStorage.setItem('currentMonth', '1');
      setSim(simulation);
      setMonth(1);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function handleRestart() {
    localStorage.removeItem('simulation');
    localStorage.removeItem('currentMonth');
    setSim(null);
    setMonth(1);
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  const gameOver = month > 12;

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={styles.navIcon}>$</span>
          <span style={styles.navText}>FutureFinance</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.navUser}>@{user?.username}</span>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.greeting}>
          <h1 style={styles.greetTitle}>
            Welcome back, <span style={{ color: 'var(--green)' }}>{user?.username}</span> 👋
          </h1>
          {fact && (
            <div style={styles.factBanner}>
              <span style={styles.factIcon}>💡</span>
              <span>{fact}</span>
            </div>
          )}
        </div>

        {!sim ? (
          <div style={styles.startCard}>
            <div style={styles.startEmoji}>🎲</div>
            <h2 style={styles.startTitle}>Ready to start your financial journey?</h2>
            <p style={styles.startSub}>
              You'll be assigned a random career, salary, and city.<br />
              Then manage your budget across 12 simulated months.
            </p>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 40px' }} onClick={handleStartSim} disabled={loading}>
              {loading ? 'Assigning career…' : '🚀 Start Simulation'}
            </button>
          </div>

        ) : gameOver ? (
          /* Game Over Screen */
          <div style={styles.gameOverCard}>
            <div style={styles.gameOverEmoji}>🏁</div>
            <h2 style={styles.gameOverTitle}>Simulation Complete!</h2>
            <p style={styles.gameOverSub}>
              You completed 12 months as a <strong style={{ color: 'var(--green)' }}>{sim.job}</strong> in {sim.location}.
            </p>
            <div style={styles.gameOverStats}>
              <div style={styles.gameOverStat}>
                <p style={styles.gameOverStatLabel}>Career</p>
                <p style={styles.gameOverStatValue}>{jobIcons[sim.job]} {sim.job}</p>
              </div>
              <div style={styles.gameOverStat}>
                <p style={styles.gameOverStatLabel}>Annual Salary</p>
                <p style={styles.gameOverStatValue} >${sim.salary.toLocaleString()}</p>
              </div>
              <div style={styles.gameOverStat}>
                <p style={styles.gameOverStatLabel}>Location</p>
                <p style={styles.gameOverStatValue}>📍 {sim.location}</p>
              </div>
            </div>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 40px', marginTop: 8 }} onClick={handleRestart}>
              🔄 Play Again
            </button>
          </div>

        ) : (
          <>
            <div style={styles.careerCard}>
              <div style={styles.careerLeft}>
                <div style={styles.jobEmoji}>{jobIcons[sim.job] || '💼'}</div>
                <div>
                  <p style={styles.careerLabel}>Your Career</p>
                  <h2 style={styles.jobTitle}>{sim.job}</h2>
                  <p style={styles.jobLocation}>📍 {sim.location}</p>
                </div>
              </div>
              <div style={styles.careerRight}>
                <Stat label="Annual Salary" value={`$${sim.salary.toLocaleString()}`} color="var(--green)" />
                <Stat label="Monthly Take-Home" value={`$${sim.monthly_income.toLocaleString()}`} color="var(--blue)" />
                <Stat label="Tax Rate" value={`${(sim.tax_rate * 100).toFixed(0)}%`} color="var(--yellow)" />
              </div>
            </div>

            <div style={styles.monthRow}>
              <div style={styles.monthCard}>
                <p style={styles.monthLabel}>Current Month</p>
                <p style={styles.monthNum}>{month} <span style={styles.monthOf}>/ 12</span></p>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${(month / 12) * 100}%` }} />
                </div>
              </div>
            </div>

            <div style={styles.actions}>
              <ActionCard icon="💰" title="Submit Budget" sub={`Allocate your month ${month} income`} onClick={() => navigate('/budget')} primary />
              <ActionCard icon="🔄" title="Restart Simulation" sub="Start fresh with a new career" onClick={handleRestart} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={styles.statBlock}>
      <p style={styles.statLabel2}>{label}</p>
      <p style={{ ...styles.statValue, color }}>{value}</p>
    </div>
  );
}

function ActionCard({ icon, title, sub, onClick, primary }) {
  return (
    <button onClick={onClick} style={{ ...styles.actionCard, ...(primary ? styles.actionPrimary : {}) }}>
      <span style={styles.actionIcon}>{icon}</span>
      <div>
        <p style={styles.actionTitle}>{title}</p>
        <p style={styles.actionSub}>{sub}</p>
      </div>
      <span style={styles.actionArrow}>→</span>
    </button>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  navIcon: { background: 'var(--green)', color: '#000', width: 28, height: 28, borderRadius: 6, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navText: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  navUser: { color: 'var(--text-muted)', fontSize: 13 },
  content: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  greeting: { marginBottom: 32 },
  greetTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12 },
  factBanner: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--green-glow)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--text-muted)' },
  factIcon: { fontSize: 16 },
  startCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '64px 40px', textAlign: 'center' },
  startEmoji: { fontSize: 64, marginBottom: 20 },
  startTitle: { fontSize: 26, fontWeight: 700, marginBottom: 12 },
  startSub: { color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 },
  gameOverCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '64px 40px', textAlign: 'center' },
  gameOverEmoji: { fontSize: 72, marginBottom: 20 },
  gameOverTitle: { fontSize: 32, fontWeight: 700, marginBottom: 12 },
  gameOverSub: { color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 },
  gameOverStats: { display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 32, flexWrap: 'wrap' },
  gameOverStat: { textAlign: 'center' },
  gameOverStatLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  gameOverStatValue: { fontSize: 18, fontFamily: 'Space Grotesk', fontWeight: 700 },
  careerCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 20 },
  careerLeft: { display: 'flex', alignItems: 'center', gap: 20 },
  jobEmoji: { fontSize: 48 },
  careerLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  jobTitle: { fontSize: 22, fontWeight: 700, marginTop: 2 },
  jobLocation: { color: 'var(--text-muted)', fontSize: 13, marginTop: 4 },
  careerRight: { display: 'flex', gap: 32 },
  statBlock: { textAlign: 'right' },
  statLabel2: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontFamily: 'Space Grotesk', fontWeight: 700, marginTop: 2 },
  monthRow: { marginBottom: 24 },
  monthCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' },
  monthLabel: { fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  monthNum: { fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 10 },
  monthOf: { fontSize: 16, color: 'var(--text-muted)' },
  progressBar: { height: 4, background: 'var(--border)', borderRadius: 4 },
  progressFill: { height: '100%', background: 'var(--green)', borderRadius: 4, transition: 'width 0.5s ease' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  actionCard: { display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px', textAlign: 'left', cursor: 'pointer', color: 'var(--text)', transition: 'all 0.15s', width: '100%' },
  actionPrimary: { background: 'var(--green-glow)', borderColor: 'rgba(0,230,118,0.25)' },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, marginBottom: 2 },
  actionSub: { color: 'var(--text-muted)', fontSize: 12 },
  actionArrow: { marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 18 },
};