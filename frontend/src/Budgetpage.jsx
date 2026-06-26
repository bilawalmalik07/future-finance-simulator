import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitBudget, updateCreditScore } from '../api';

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

  useEffect(() => {
    const s = localStorage.getItem('simulation');
    if (!s) return navigate('/dashboard');
    setSim(JSON.parse(s));
    setMonth(parseInt(localStorage.getItem('currentMonth') || '1'));
  }, []);

  const income = sim?.monthly_income || 0;
  const totalSpent = Object.values(values).reduce((a, v) => a + (parseFloat(v) || 0), 0);
  const remaining = income - totalSpent;
  const pct = income > 0 ? Math.min((totalSpent / income) * 100, 100) : 0;

  async function handleSubmit() {
    setError('');
    const parsed = {};
    for (const k of categories.map(c => c.key)) {
      parsed[k] = parseFloat(values[k]) || 0;
    }
    setLoading(true);
    try {
      const res = await submitBudget({
        simulation_id: sim.id,
        month_number: month,
        ...parsed,
      });
      const budgetResult = res.data.budget;

      // Auto-update credit score
      const creditRes = await updateCreditScore(sim.id);
      setResult({ budget: budgetResult, credit: creditRes.data.credit });

      // Advance month
      const nextMonth = month + 1;
      localStorage.setItem('currentMonth', String(nextMonth));
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to submit budget.');
    }
    setLoading(false);
  }

  function handleDone() {
    navigate('/dashboard');
  }

  if (!sim) return null;

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button style={styles.back} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <span style={styles.navTitle}>Month {month} Budget</span>
        <div />
      </nav>

      <div style={styles.content}>
        {!result ? (
          <div style={styles.layout}>
            {/* Form */}
            <div style={styles.formSide}>
              <h2 style={styles.title}>Allocate your income</h2>
              <p style={styles.sub}>Monthly take-home: <strong style={{ color: 'var(--green)' }}>${income.toLocaleString()}</strong></p>

              <div style={styles.fields}>
                {categories.map(cat => (
                  <div key={cat.key} style={styles.field}>
                    <div style={styles.fieldHeader}>
                      <span>{cat.icon} {cat.label}</span>
                      <span style={styles.fieldHint}>{cat.hint}</span>
                    </div>
                    <div style={styles.inputWrap}>
                      <span style={styles.dollar}>$</span>
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={values[cat.key]}
                        onChange={e => setValues(p => ({ ...p, [cat.key]: e.target.value }))}
                        style={{ paddingLeft: 32, borderRadius: 8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 8, fontSize: 15 }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit Budget →'}
              </button>
            </div>

            {/* Summary panel */}
            <div style={styles.summaryPanel}>
              <h3 style={styles.summaryTitle}>Live Summary</h3>

              <div style={styles.gauge}>
                <div style={styles.gaugeBar}>
                  <div style={{
                    ...styles.gaugeFill,
                    width: `${pct}%`,
                    background: remaining < 0 ? 'var(--red)' : pct > 80 ? 'var(--yellow)' : 'var(--green)',
                  }} />
                </div>
                <div style={styles.gaugeLabels}>
                  <span style={{ color: 'var(--text-muted)' }}>0</span>
                  <span style={{ color: 'var(--text-muted)' }}>${income.toLocaleString()}</span>
                </div>
              </div>

              <div style={styles.summaryRows}>
                <SummaryRow label="Income" value={`$${income.toLocaleString()}`} color="var(--green)" />
                <SummaryRow label="Total Spent" value={`$${totalSpent.toFixed(2)}`} />
                <div style={styles.divider} />
                <SummaryRow
                  label="Remaining"
                  value={`${remaining < 0 ? '-' : ''}$${Math.abs(remaining).toFixed(2)}`}
                  color={remaining < 0 ? 'var(--red)' : 'var(--blue)'}
                  bold
                />
              </div>

              {remaining < 0 && (
                <div style={styles.warningBox}>
                  ⚠️ You're overspending by ${Math.abs(remaining).toFixed(2)}. This will hurt your credit score.
                </div>
              )}

              {/* Breakdown */}
              <div style={styles.breakdown}>
                {categories.map(cat => {
                  const v = parseFloat(values[cat.key]) || 0;
                  const p = income > 0 ? (v / income) * 100 : 0;
                  return (
                    <div key={cat.key} style={styles.breakdownRow}>
                      <span>{cat.icon} {cat.label}</span>
                      <div style={styles.breakdownBar}>
                        <div style={{ ...styles.breakdownFill, width: `${Math.min(p, 100)}%` }} />
                      </div>
                      <span style={styles.breakdownPct}>{p.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Results */
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div style={styles.resultEmoji}>{result.budget.overspent ? '😬' : '✅'}</div>
              <h2 style={styles.resultTitle}>
                {result.budget.overspent ? 'Month Complete — Overspent' : 'Month Complete — Well Done!'}
              </h2>
            </div>

            <div style={styles.resultGrid}>
              <ResultStat label="Monthly Income" value={`$${result.budget.monthly_income.toLocaleString()}`} color="var(--green)" />
              <ResultStat label="Total Spent" value={`$${result.budget.total_spent.toLocaleString()}`} color={result.budget.overspent ? 'var(--red)' : 'var(--text)'} />
              <ResultStat label="Savings" value={`$${result.budget.savings.toLocaleString()}`} color="var(--blue)" />
              <ResultStat label="Remaining" value={`${result.budget.remaining < 0 ? '-' : ''}$${Math.abs(result.budget.remaining).toFixed(2)}`} color={result.budget.remaining < 0 ? 'var(--red)' : 'var(--green)'} />
            </div>

            {/* Credit Score */}
            <div style={styles.creditBlock}>
              <h3 style={styles.creditTitle}>Credit Score Update</h3>
              <div style={styles.creditRow}>
                <span style={styles.creditScore}>{result.credit.new_score}</span>
                <span style={{ ...styles.creditChange, color: result.credit.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {result.credit.change >= 0 ? '+' : ''}{result.credit.change}
                </span>
                <span className={`tag tag-${result.credit.rating === 'Excellent' ? 'green' : result.credit.rating === 'Good' ? 'blue' : result.credit.rating === 'Fair' ? 'yellow' : 'red'}`}>
                  {result.credit.rating}
                </span>
              </div>
              <div style={styles.reasons}>
                {result.credit.reasons.map((r, i) => (
                  <p key={i} style={styles.reason}>{r}</p>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', fontSize: 15 }} onClick={handleDone}>
              Back to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color, bold }) {
  return (
    <div style={styles.summaryRow}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: color || 'var(--text)', fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function ResultStat({ label, value, color }) {
  return (
    <div style={styles.resultStat}>
      <p style={styles.resultStatLabel}>{label}</p>
      <p style={{ ...styles.resultStatValue, color: color || 'var(--text)' }}>{value}</p>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 40px', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  back: { background: 'none', color: 'var(--text-muted)', fontSize: 14, fontFamily: 'Inter', cursor: 'pointer', border: 'none' },
  navTitle: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 },
  content: { maxWidth: 1000, margin: '0 auto', padding: '40px 24px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 },
  formSide: {},
  title: { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  sub: { color: 'var(--text-muted)', marginBottom: 28 },
  fields: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 },
  field: {},
  fieldHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 500 },
  fieldHint: { color: 'var(--text-muted)', fontWeight: 400 },
  inputWrap: { position: 'relative' },
  dollar: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 },
  error: { color: 'var(--red)', fontSize: 13, marginBottom: 12 },
  summaryPanel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 },
  summaryTitle: { fontSize: 16, fontWeight: 700, marginBottom: 20 },
  gauge: { marginBottom: 24 },
  gaugeBar: { height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  gaugeFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease, background 0.3s' },
  gaugeLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 11 },
  summaryRows: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14 },
  divider: { height: 1, background: 'var(--border)', margin: '4px 0' },
  warningBox: {
    background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
    borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)', marginBottom: 16,
  },
  breakdown: { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  breakdownRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 },
  breakdownBar: { flex: 1, height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' },
  breakdownFill: { height: '100%', background: 'var(--green)', borderRadius: 4, transition: 'width 0.3s' },
  breakdownPct: { width: 28, textAlign: 'right', color: 'var(--text-muted)' },
  resultCard: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 40, maxWidth: 640, margin: '0 auto',
  },
  resultHeader: { textAlign: 'center', marginBottom: 32 },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { fontSize: 22, fontWeight: 700 },
  resultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 },
  resultStat: {
    background: 'var(--surface2)', borderRadius: 10, padding: '16px 20px',
    border: '1px solid var(--border)',
  },
  resultStatLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  resultStatValue: { fontSize: 22, fontFamily: 'Space Grotesk', fontWeight: 700 },
  creditBlock: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '20px 24px', marginBottom: 24,
  },
  creditTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' },
  creditRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  creditScore: { fontSize: 40, fontFamily: 'Space Grotesk', fontWeight: 700 },
  creditChange: { fontSize: 20, fontWeight: 600 },
  reasons: { display: 'flex', flexDirection: 'column', gap: 4 },
  reason: { fontSize: 12, color: 'var(--text-muted)' },
};