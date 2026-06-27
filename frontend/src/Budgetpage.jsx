import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitBudget, updateCreditScore, triggerEvent } from './Api';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

const categories = [
  { key: 'housing', label: 'Housing', icon: '🏠', hint: 'Rent or mortgage' },
  { key: 'transport', label: 'Transport', icon: '🚗', hint: 'Car, gas, or transit' },
  { key: 'food', label: 'Food', icon: '🍔', hint: 'Groceries and dining' },
  { key: 'utilities', label: 'Utilities', icon: '💡', hint: 'Electric, water, internet' },
  { key: 'entertainment', label: 'Entertainment', icon: '🎮', hint: 'Fun stuff & subscriptions' },
];

export default function BudgetPage() {
  const [sim, setSim] = useState(null);
  const [month, setMonth] = useState(1);
  const [values, setValues] = useState({ housing: '', transport: '', food: '', utilities: '', entertainment: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const inputRefs = useRef([]);

  useEffect(() => {
    const s = localStorage.getItem('simulation');
    if (!s) return navigate('/dashboard');
    setSim(JSON.parse(s));
    setMonth(parseInt(localStorage.getItem('currentMonth') || '1'));
  }, []);

  useEffect(() => {
    function handleEnter(e) {
      if (e.key === 'Enter' && result) {
        navigate('/dashboard');
      }
    }
    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, [result]);

  const income = sim?.monthly_income || 0;
  const totalSpent = Object.values(values).reduce((a, v) => a + (parseFloat(v) || 0), 0);
  const remaining = income - totalSpent;
  const pct = income > 0 ? Math.min((totalSpent / income) * 100, 100) : 0;

  async function handleSubmit() {
    setError('');
    const parsed = {};
    for (const k of categories.map(c => c.key)) parsed[k] = parseFloat(values[k]) || 0;
    setLoading(true);
    try {
      const res = await submitBudget({ simulation_id: sim.id, month_number: month, ...parsed });
      const creditRes = await updateCreditScore(sim.id);
      const eventRes = await triggerEvent(sim.id, month);
      setResult({ budget: res.data.budget, credit: creditRes.data.credit, event: eventRes.data.event });
      localStorage.setItem('currentMonth', String(month + 1));
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to submit budget.');
    }
    setLoading(false);
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < categories.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        handleSubmit();
      }
    }
  }

  if (!sim) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '12px 16px' : '16px 40px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button style={{ background: 'none', color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Inter', cursor: 'pointer', border: 'none' }} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>Month {month} Budget</span>
        <div />
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 24px' }}>
        {!result ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
            {/* Form */}
            <div>
              <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 6 }}>Allocate your income</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Monthly take-home: <strong style={{ color: 'var(--green)' }}>${income.toLocaleString()}</strong></p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {categories.map((cat, index) => (
                  <div key={cat.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                      <span>{cat.icon} {cat.label}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{cat.hint}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }}>$</span>
                      <input
                        ref={el => inputRefs.current[index] = el}
                        className="input-field"
                        type="number" min="0" placeholder="0"
                        value={values[cat.key]}
                        onChange={e => setValues(p => ({ ...p, [cat.key]: e.target.value }))}
                        onKeyDown={e => handleKeyDown(e, index)}
                        style={{ paddingLeft: 32, borderRadius: 8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button className="btn-primary" style={{ width: '100%', fontSize: 15 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Budget →'}
              </button>
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 20 : 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Live Summary</h3>
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.3s ease', width: `${pct}%`, background: remaining < 0 ? 'var(--red)' : pct > 80 ? 'var(--yellow)' : 'var(--green)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>$0</span>
                  <span style={{ color: 'var(--text-muted)' }}>${income.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[['Income', `$${income.toLocaleString()}`, 'var(--green)', false], ['Total Spent', `$${totalSpent.toFixed(2)}`, null, false], null, ['Remaining', `${remaining < 0 ? '-' : ''}$${Math.abs(remaining).toFixed(2)}`, remaining < 0 ? 'var(--red)' : 'var(--blue)', true]].map((row, i) =>
                  row === null ? <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} /> :
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row[0]}</span>
                    <span style={{ color: row[2] || 'var(--text)', fontWeight: row[3] ? 700 : 500 }}>{row[1]}</span>
                  </div>
                )}
              </div>

              {remaining < 0 && (
                <div style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>
                  ⚠️ You're overspending by ${Math.abs(remaining).toFixed(2)}. This will hurt your credit score.
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.map(cat => {
                  const v = parseFloat(values[cat.key]) || 0;
                  const p = income > 0 ? (v / income) * 100 : 0;
                  return (
                    <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span>{cat.icon} {cat.label}</span>
                      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--green)', borderRadius: 4, width: `${Math.min(p, 100)}%`, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ width: 28, textAlign: 'right', color: 'var(--text-muted)' }}>{p.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 20 : 40, maxWidth: 640, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>{result.budget.overspent ? '😬' : '✅'}</div>
              <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>
                {result.budget.overspent ? 'Month Complete — Overspent!' : 'Month Complete — Well Done!'}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['Monthly Income', `$${result.budget.monthly_income.toLocaleString()}`, 'var(--green)'], ['Total Spent', `$${result.budget.total_spent.toLocaleString()}`, result.budget.overspent ? 'var(--red)' : 'var(--text)'], ['Savings', `$${result.budget.savings.toLocaleString()}`, 'var(--blue)'], ['Remaining', `${result.budget.remaining < 0 ? '-' : ''}$${Math.abs(result.budget.remaining).toFixed(2)}`, result.budget.remaining < 0 ? 'var(--red)' : 'var(--green)']].map(([label, value, color]) => (
                <div key={label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: isMobile ? '12px 14px' : '16px 20px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: isMobile ? 18 : 22, fontFamily: 'Space Grotesk', fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>

            {result.event ? (
              <div style={{ background: 'rgba(255,215,64,0.08)', border: '1px solid rgba(255,215,64,0.25)', borderRadius: 10, padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>⚡</span>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>{result.event.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{result.event.description}</p>
                  <p style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>Cost: -${result.event.cost.toLocaleString()} from savings</p>
                  <p style={{ fontSize: 13, color: 'var(--green)', marginTop: 2 }}>New savings: ${result.event.new_savings.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>🍀</span><p>No emergency this month — lucky you!</p>
              </div>
            )}

            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>Credit Score Update</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 40, fontFamily: 'Space Grotesk', fontWeight: 700 }}>{result.credit.new_score}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: result.credit.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {result.credit.change >= 0 ? '+' : ''}{result.credit.change}
                </span>
                <span className={`tag tag-${result.credit.rating === 'Legendary' || result.credit.rating === 'Excellent' ? 'green' : result.credit.rating === 'Good' ? 'blue' : result.credit.rating === 'Fair' ? 'yellow' : 'red'}`}>
                  {result.credit.rating}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {result.credit.reasons.map((r, i) => (
                  <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {r}</p>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', fontSize: 15 }} onClick={() => navigate('/dashboard')}>
              {month >= 12 ? 'See Final Report →' : 'Next Month →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}