import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import DataTable from '../components/DataTable';

const money = (v: number) => '$' + (v || 0).toLocaleString();
const sum = (rows: any[]) => rows.reduce((s, r) => s + (r.amount || 0), 0);
// Cash actually paid out: paidAmount, saturated to net when isDone.
const paidOf = (p: any) => {
  const net = p.netAmount ?? p.amount ?? 0;
  const paid = p.paidAmount ?? (p.isDone ? net : 0);
  return p.isDone ? Math.max(paid, net) : paid;
};
const sumPaid = (rows: any[]) => rows.reduce((s, r) => s + paidOf(r), 0);
const sumRemaining = (rows: any[]) =>
  rows.reduce((s, r) => {
    const net = r.netAmount ?? r.amount ?? 0;
    return s + Math.max(net - paidOf(r), 0);
  }, 0);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** A comparable key so periods sort naturally by year > month > half. */
const periodKey = (p: any) =>
  (p.year || 0) * 10000 + (p.month || 0) * 100 + (p.half || 0);

/** Compute the period that follows the given one. */
function nextPeriodFor(p: any) {
  if (p.half === 1) return { year: p.year, month: p.month, half: 2 };
  return {
    year: p.month === 12 ? p.year + 1 : p.year,
    month: p.month === 12 ? 1 : p.month + 1,
    half: 1,
  };
}

type Sort = 'newest' | 'oldest' | 'income' | 'payments' | 'pending';

export default function Periods() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [allIncomes, setAllIncomes] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('newest');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/periods'),
      api.get('/accounts'),
      api.get('/incomes'),
      api.get('/payments'),
    ])
      .then(([p, a, i, pay]) => {
        const ps = (p.data || []).slice().sort((a: any, b: any) => periodKey(b) - periodKey(a));
        setPeriods(ps);
        setAccounts(a.data || []);
        setAllIncomes(i.data || []);
        setAllPayments(pay.data || []);
        setSelectedId((cur) => cur && ps.find((x: any) => x._id === cur) ? cur : (ps[0]?._id || null));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Per-period totals, used both by the period list and the stat cards.
  const totalsFor = (periodId: string) => {
    const inc = allIncomes.filter((r) => String(r.period?._id || r.period) === periodId);
    const pay = allPayments.filter((r) => String(r.period?._id || r.period) === periodId);
    return {
      incomeReceived: sum(inc.filter((i) => i.isDone)),
      incomePending: sum(inc.filter((i) => !i.isDone)),
      paid: sumPaid(pay),
      pending: sumRemaining(pay),
      incomes: inc,
      payments: pay,
    };
  };

  const sortedPeriods = useMemo(() => {
    const rows = periods.map((p) => ({ p, t: totalsFor(p._id) }));
    const cmp: Record<Sort, (a: any, b: any) => number> = {
      newest: (a, b) => periodKey(b.p) - periodKey(a.p),
      oldest: (a, b) => periodKey(a.p) - periodKey(b.p),
      income: (a, b) => b.t.incomeReceived - a.t.incomeReceived,
      payments: (a, b) => b.t.paid - a.t.paid,
      pending: (a, b) => b.t.pending - a.t.pending,
    };
    return rows.sort(cmp[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, allIncomes, allPayments, sort]);

  const selected = periods.find((p) => p._id === selectedId) || null;
  const totals = selected ? totalsFor(selected._id) : null;

  const toggle = (kind: 'incomes' | 'payments', id: string) =>
    api.patch(`/${kind}/${id}/done`).then(load);

  const openNext = async () => {
    if (!selected) return;
    const np = nextPeriodFor(selected);
    if (!window.confirm(
      `Open ${MONTHS[np.month - 1]} ${np.year} - ${np.half === 1 ? 'Start' : 'Mid'}? Recurrent payments will be carried over.`,
    )) return;
    setBusy(true);
    try {
      const r = await api.post('/periods/open', np);
      const cloned = r.data?.clonedPayments ?? 0;
      const reused = !!r.data?.reusedExisting;
      window.alert(
        (reused
          ? 'Period already existed - re-checked it for recurrents. '
          : 'Period opened. ') +
          (cloned > 0
            ? `${cloned} recurrent payment(s) carried forward.`
            : 'No recurrent payments matched - confirm each one has Recurrence set to something other than "Not recurrent".'),
      );
      load();
      setSelectedId(r.data?.period?._id || null);
    } catch (e: any) {
      const m = e?.response?.data?.message || 'Could not open period.';
      window.alert(Array.isArray(m) ? m.join(', ') : m);
    } finally {
      setBusy(false);
    }
  };

  // Per-account contribution to the selected period.
  const accountBoxes = accounts.map((acc) => {
    const id = acc._id;
    const inc = (totals?.incomes || []).filter((r: any) => String(r.account?._id || r.account) === id);
    const pay = (totals?.payments || []).filter((r: any) => String(r.account?._id || r.account) === id);
    return {
      id,
      name: acc.name,
      incomeReceived: sum(inc.filter((i: any) => i.isDone)),
      paid: sumPaid(pay),
      pending: sumRemaining(pay),
      net: sum(inc.filter((i: any) => i.isDone)) - sumPaid(pay),
    };
  });

  if (loading) return <div><h2>Periods</h2><p className="muted">Loading...</p></div>;

  if (periods.length === 0) {
    return (
      <div>
        <h2>Periods</h2>
        <p className="muted">No periods exist yet. Create one in Settings to start tracking.</p>
      </div>
    );
  }

  const doneCell = (kind: 'incomes' | 'payments') => (r: any) => (
    <button className="ghost" onClick={() => toggle(kind, r._id)}>
      {r.isDone ? 'Undo' : kind === 'incomes' ? 'Mark done' : 'Mark paid'}
    </button>
  );
  const statusCell = (r: any) => (
    <span className={'pill ' + (r.isDone ? 'done' : 'pending')}>
      {r.isDone ? 'Done' : 'Pending'}
    </span>
  );

  return (
    <div>
      <div className="page-head">
        <h2>Periods</h2>
        <button onClick={openNext} disabled={busy || !selected}>
          {busy ? 'Opening...' : 'Open next period'}
        </button>
      </div>
      <p className="muted">
        Every period at a glance. Pick one to see its incomes, payments and per-account totals.
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0 14px' }}>
        <label style={{ margin: 0 }}>Sort by</label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ maxWidth: 220, marginBottom: 0 }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="income">Income received</option>
          <option value="payments">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Income received</th>
              <th>Income pending</th>
              <th>Paid</th>
              <th>Pending</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedPeriods.map(({ p, t }) => {
              const active = p._id === selectedId;
              return (
                <tr
                  key={p._id}
                  style={{
                    cursor: 'pointer',
                    background: active ? 'rgba(99,102,241,.12)' : undefined,
                  }}
                  onClick={() => setSelectedId(p._id)}
                >
                  <td><strong>{p.label}</strong></td>
                  <td>{money(t.incomeReceived)}</td>
                  <td className="muted">{money(t.incomePending)}</td>
                  <td>{money(t.paid)}</td>
                  <td style={{ color: t.pending > 0 ? 'var(--bad)' : 'var(--muted)' }}>{money(t.pending)}</td>
                  <td>
                    <button
                      className="ghost"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(p._id); }}
                    >
                      {active ? 'Selected' : 'View'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && totals && (
        <>
          <h3 style={{ marginTop: 0 }}>{selected.label}</h3>

          <div className="stat-grid">
            <div className="stat"><div className="label">Income received</div><div className="value">{money(totals.incomeReceived)}</div></div>
            <div className="stat"><div className="label">Income pending</div><div className="value">{money(totals.incomePending)}</div></div>
            <div className="stat"><div className="label">Paid</div><div className="value">{money(totals.paid)}</div></div>
            <div className="stat"><div className="label">Payments pending</div><div className="value">{money(totals.pending)}</div></div>
          </div>

          <h4 style={{ margin: '18px 0 8px' }}>By account</h4>
          <div className="stat-grid">
            {accountBoxes.map((a) => (
              <div className="stat" key={a.id}>
                <div className="label">{a.name}</div>
                <div className="value" style={{ color: a.net >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                  {money(a.net)}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                  In: {money(a.incomeReceived)}<br />
                  Paid: {money(a.paid)}<br />
                  Pending: <span style={{ color: a.pending > 0 ? 'var(--bad)' : undefined }}>{money(a.pending)}</span>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 22 }}>
            Incomes ({totals.incomes.filter((i: any) => !i.isDone).length} pending)
          </h3>
          <div className="card">
            <DataTable
              columns={[
                { key: 'kind', label: 'Kind' },
                { key: 'project', label: 'Project', render: (r: any) => r.project?.name || '-' },
                { key: 'account', label: 'Account', render: (r: any) => r.account?.name || '-' },
                { key: 'amount', label: 'Amount', render: (r: any) => money(r.amount) },
                { key: 'isDone', label: 'Status', render: statusCell },
                { key: '_a', label: '', render: doneCell('incomes') },
              ]}
              rows={totals.incomes}
            />
          </div>

          <h3 style={{ marginTop: 22 }}>
            Payments ({totals.payments.filter((p: any) => !p.isDone).length} pending)
          </h3>
          <div className="card">
            <DataTable
              columns={[
                { key: 'concept', label: 'Concept' },
                { key: 'payee', label: 'Person', render: (r: any) => r.payee?.name || '-' },
                { key: 'paymentType', label: 'Type', render: (r: any) => r.paymentType?.name || '-' },
                { key: 'project', label: 'Project', render: (r: any) => r.project?.name || '-' },
                { key: 'account', label: 'Account', render: (r: any) => r.account?.name || '-' },
                { key: 'net', label: 'Net', render: (r: any) => money(r.netAmount ?? r.amount) },
                { key: 'paid', label: 'Paid / Remaining', render: (r: any) => {
                    const net = r.netAmount ?? r.amount ?? 0;
                    const paid = paidOf(r);
                    const rem = Math.max(net - paid, 0);
                    return (
                      <span>
                        {money(paid)} <span className="muted">/</span>{' '}
                        <span style={{ color: rem > 0 ? 'var(--bad)' : 'var(--good)' }}>{money(rem)}</span>
                      </span>
                    );
                  } },
                { key: 'isDone', label: 'Status', render: (r: any) => {
                    const net = r.netAmount ?? r.amount ?? 0;
                    const paid = paidOf(r);
                    const partial = !r.isDone && paid > 0 && paid < net;
                    const label = r.isDone ? 'Paid' : partial ? 'Partial' : 'Pending';
                    const cls = r.isDone ? 'done' : partial ? 'partial' : 'pending';
                    return <span className={'pill ' + cls}>{label}</span>;
                  } },
                { key: '_a', label: '', render: doneCell('payments') },
              ]}
              rows={totals.payments}
            />
          </div>
        </>
      )}
    </div>
  );
}
