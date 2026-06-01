import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BarChartCard from '../components/BarChartCard';

const money = (v: number) => '$' + (v || 0).toLocaleString();

export default function Dashboard() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState<string>(''); // '' = all time
  const [balances, setBalances] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [spending, setSpending] = useState<any[]>([]);

  // Period-independent data, loaded once.
  useEffect(() => {
    api.get('/periods').then((r) => setPeriods(r.data)).catch(() => {});
    api.get('/dashboard/balances').then((r) => setBalances(r.data)).catch(() => {});
    api.get('/dashboard/timeline').then((r) => setTimeline(r.data)).catch(() => {});
  }, []);

  // Re-fetch the filterable data whenever the period changes.
  useEffect(() => {
    const q = periodId ? `?period=${periodId}` : '';
    api.get(`/dashboard/period-summary${q}`).then((r) => setSummary(r.data)).catch(() => {});
    api.get(`/dashboard/project-earnings${q}`).then((r) => setProjects(r.data)).catch(() => {});
    api.get(`/dashboard/personal-spending${q}`).then((r) => setSpending(r.data)).catch(() => {});
  }, [periodId]);

  const scopeLabel = periodId
    ? periods.find((p) => p._id === periodId)?.label || 'Selected period'
    : 'All time';

  return (
    <div>
      <div className="page-head">
        <h2>Dashboard</h2>
        <div>
          <label style={{ display: 'inline', marginRight: 8 }}>Period</label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            style={{ width: 'auto', display: 'inline-block' }}
          >
            <option value="">All time</option>
            {periods.map((p) => (
              <option key={p._id} value={p._id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <h3>Account balances</h3>
      <p className="muted" style={{ marginTop: 0 }}>Cumulative available money per source.</p>
      <div className="stat-grid">
        {balances.map((b) => (
          <div className="stat" key={b.accountId}>
            <div className="label">{b.account}</div>
            <div className="value">{money(b.balance)}</div>
          </div>
        ))}
        {!balances.length && <p className="muted">No accounts yet. Run the backend seed.</p>}
      </div>

      {summary && (
        <>
          <h3>Summary - {scopeLabel}</h3>
          <div className="stat-grid">
            <div className="stat"><div className="label">Income</div><div className="value">{money(summary.income.total)}</div></div>
            <div className="stat"><div className="label">Profit</div><div className="value">{money(summary.income.profit)}</div></div>
            <div className="stat"><div className="label">Payments</div><div className="value">{money(summary.payments.total)}</div></div>
            <div className="stat"><div className="label">Net</div><div className="value">{money(summary.net)}</div></div>
            <div className="stat"><div className="label">Income pending</div><div className="value">{money(summary.income.pending)}</div></div>
            <div className="stat"><div className="label">Payments pending</div><div className="value">{money(summary.payments.pending)}</div></div>
          </div>
        </>
      )}

      <h3>Charts</h3>
      <BarChartCard
        title="Income vs. payments by period"
        data={timeline}
        xKey="label"
        series={[
          { key: 'income', name: 'Income', color: '#22c55e' },
          { key: 'payments', name: 'Payments', color: '#ef4444' },
        ]}
        empty="No periods with data yet."
      />
      <BarChartCard
        title={`Earnings per project - ${scopeLabel}`}
        data={projects.filter((p) => p.income || p.payments)}
        xKey="project"
        series={[
          { key: 'income', name: 'Income', color: '#3b82f6' },
          { key: 'payments', name: 'Payments', color: '#f59e0b' },
        ]}
        empty="No project activity in this scope."
      />
      <BarChartCard
        title={`Personal spending by category - ${scopeLabel}`}
        data={spending.filter((s) => s.total)}
        xKey="category"
        series={[{ key: 'total', name: 'Spent', color: '#a855f7' }]}
        empty="No personal spending in this scope."
      />
    </div>
  );
}
