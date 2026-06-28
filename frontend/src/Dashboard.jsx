import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSimulation, getFunFact, getSimulationSummary } from './Api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

const jobIcons = {
  'Software Engineer': '💻', 'Teacher': '📚', 'Nurse': '🏥',
  'Electrician': '⚡', 'Entrepreneur': '🚀', 'Graphic Designer': '🎨',
  'Police Officer': '🛡️', 'Accountant': '📊', 'Chef': '👨‍🍳', 'Pharmacist': '💊',
  'Data Scientist': '🤖', 'Firefighter': '🚒', 'Dentist': '🦷', 'Plumber': '🔧',
  'Marketing Manager': '📣', 'Lawyer': '⚖️', 'Journalist': '📰', 'Architect': '🏛️',
  'Social Worker': '🤝', 'Pilot': '✈️', 'Real Estate Agent': '🏠', 'Mechanic': '🔩',
  'Veterinarian': '🐾', 'UX Designer': '🖌️', 'Truck Driver': '🚛',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sim, setSim] = useState(null);
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(1);
  const [summary, setSummary] = useState(null);
  const [runningSavings, setRunningSavings] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  function fetchSummary(simId) {
    getSimulationSummary(simId)
      .then(r => {
        if (r && r.data && typeof r.data.total_savings === 'number') {
          setSummary(r.data);
          setRunningSavings(r.data.total_savings);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return navigate('/');
    setUser(JSON.parse(stored));
    const storedSim = localStorage.getItem('simulation');
    if (storedSim) {
      const parsedSim = JSON.parse(storedSim);
      setSim(parsedSim);
      const currentMonth = parseInt(localStorage.getItem('currentMonth') || '1');
      setMonth(currentMonth);
      if (currentMonth > 1) fetchSummary(parsedSim.id);
    }
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
      setSummary(null);
      setRunningSavings(null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleRestart() {
    localStorage.removeItem('simulation');
    localStorage.removeItem('currentMonth');
    setSim(null); setMonth(1); setSummary(null); setRunningSavings(null);
  }

  function handleLogout() { localStorage.clear(); navigate('/'); }

  const gameOver = month > 12;
  const creditRating = (score) => {
    if (score >= 950) return 'Legendary';
    if (score >= 850) return 'Excellent';
    if (score >= 750) return 'Good';
    if (score >= 620) return 'Fair';
    return 'Poor';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 40px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#00E676', width: 40, height: 26, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', border: '1.5px solid #00c060' }}>
            <div style={{ position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, border: '1px dashed rgba(0,150,70,0.5)', borderRadius: 2, pointerEvents: 'none' }} />
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontStyle: 'italic', fontSize: 18, color: '#000', lineHeight: 1, position: 'relative', zIndex: 1 }}>F</span>
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>FutureFinance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
          {!isMobile && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{user?.username}</span>}
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12 }}>
            {localStorage.getItem('isNewUser') === 'true' ? 'Welcome,' : 'Welcome back,'} <span style={{ color: 'var(--green)' }}>{user?.username}</span> 👋
          </h1>
          {fact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-glow)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>💡</span><span>{fact}</span>
            </div>
          )}
        </div>

        {!sim ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '40px 24px' : '64px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎲</div>
            <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, marginBottom: 12 }}>Ready to start your financial journey?</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, fontSize: isMobile ? 14 : 16 }}>
              You'll be assigned a random career, salary, and city.<br />
              Then manage your budget across 12 simulated months.
            </p>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 40px' }} onClick={handleStartSim} disabled={loading}>
              {loading ? 'Assigning career…' : 'Start Simulation'}
            </button>
          </div>

        ) : gameOver ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '32px 20px' : '48px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🏁</div>
            <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, marginBottom: 12 }}>Simulation Complete!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              You completed 12 months as a <strong style={{ color: 'var(--green)' }}>{sim.job}</strong> in {sim.location}.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 20 : 40, marginBottom: 32, flexWrap: 'wrap' }}>
              {[['Career', `${jobIcons[sim.job] || '💼'} ${sim.job}`], ['Annual Salary', `$${sim.salary.toLocaleString()}`], ['Location', `📍 ${sim.location}`]].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{l}</p>
                  <p style={{ fontSize: 18, fontFamily: 'Space Grotesk', fontWeight: 700 }}>{v}</p>
                </div>
              ))}
            </div>

            {summary && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '20px 16px' : '24px 28px', marginBottom: 32, textAlign: 'left' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📊 Year in Review</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    ['Total Saved', `$${Number(summary.total_savings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'var(--green)'],
                    ['Total Spent', `$${Number(summary.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'var(--red)'],
                    ['Overspent Months', `${summary.overspent_months} / 12`, summary.overspent_months > 3 ? 'var(--red)' : 'var(--yellow)'],
                    ['Final Credit Score', summary.final_credit_score, summary.final_credit_score >= 750 ? 'var(--green)' : summary.final_credit_score >= 620 ? 'var(--yellow)' : 'var(--red)'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</p>
                      <p style={{ fontSize: 20, fontFamily: 'Space Grotesk', fontWeight: 700, color }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Credit Rating</span>
                  <span className={`tag tag-${summary.final_credit_score >= 750 ? 'green' : summary.final_credit_score >= 620 ? 'yellow' : 'red'}`}>
                    {creditRating(summary.final_credit_score)}
                  </span>
                </div>
              </div>
            )}
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 40px' }} onClick={handleRestart}>🔄 Play Again</button>
          </div>

        ) : (
          <>
            {/* Career Card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
              padding: isMobile ? '20px 16px' : '28px 32px',
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between', marginBottom: 16, gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: isMobile ? 36 : 48 }}>{jobIcons[sim.job] || '💼'}</div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Career</p>
                  <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginTop: 2 }}>{sim.job}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>📍 {sim.location}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: isMobile ? 20 : 32, flexWrap: 'wrap' }}>
                {[['Annual Salary', `$${sim.salary.toLocaleString()}`, 'var(--green)'], ['Monthly Take-Home', `$${sim.monthly_income.toLocaleString()}`, 'var(--blue)'], ['Tax Rate', `${(sim.tax_rate * 100).toFixed(0)}%`, 'var(--yellow)']].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</p>
                    <p style={{ fontSize: isMobile ? 16 : 20, fontFamily: 'Space Grotesk', fontWeight: 700, color: c, marginTop: 2 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Month Progress */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px' : '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Current Month</p>
              <p style={{ fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 10 }}>{month} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/ 12</span></p>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 4 }}>
                <div style={{ height: '100%', background: 'var(--green)', borderRadius: 4, width: `${(month / 12) * 100}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Stats */}
            {month > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  ['💰 Total Saved So Far', runningSavings !== null ? `$${Number(runningSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', 'var(--green)'],
                  ['📅 Months Remaining', Math.max(0, 13 - month), 'var(--yellow)'],
                  ['📈 Avg Saved / Month', runningSavings !== null && month > 1 ? `$${(Number(runningSavings) / (month - 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', 'var(--blue)'],
                ].map(([label, value, color], i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '14px 14px' : '18px 20px', gridColumn: isMobile && i === 2 ? 'span 2' : 'span 1' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{label}</p>
                    <p style={{ fontSize: isMobile ? 18 : 20, fontFamily: 'Space Grotesk', fontWeight: 700, color }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { icon: '💰', title: 'Submit Budget', sub: `Allocate your month ${month} income`, onClick: () => navigate('/budget'), primary: true },
                { icon: '🔄', title: 'Restart Simulation', sub: 'Start fresh with a new career', onClick: handleRestart, primary: false },
              ].map(({ icon, title, sub, onClick, primary }) => (
                <button key={title} onClick={onClick} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: primary ? 'var(--green-glow)' : 'var(--surface)',
                  border: `1px solid ${primary ? 'rgba(0,230,118,0.25)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '20px', textAlign: 'left',
                  cursor: 'pointer', color: 'var(--text)', width: '100%',
                }}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</p>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}