import { useState } from 'react';
import { api } from '../api/client';
import { useResource } from '../hooks/useResource';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ResourceForm, { Field } from '../components/ResourceForm';

const money = (v: number) => '$' + (v || 0).toLocaleString();
const fmt = (d: any) => (d ? String(d).slice(0, 10) : '-');

const loanFields: Field[] = [
  { name: 'borrower', label: 'Borrower', type: 'select', optionsEndpoint: '/people', required: true },
  { name: 'principal', label: 'Amount lent (USD)', type: 'number', required: true },
  { name: 'dateIssued', label: 'Date issued', type: 'date' },
  { name: 'account', label: 'Lent from account', type: 'select', optionsEndpoint: '/accounts' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

const repayFields: Field[] = [
  { name: 'amount', label: 'Repayment amount (USD)', type: 'number', required: true },
  { name: 'date', label: 'Date', type: 'date' },
  { name: 'account', label: 'Paid into account', type: 'select', optionsEndpoint: '/accounts' },
  { name: 'note', label: 'Note', type: 'text' },
];

export default function Loans() {
  const { data, loading, error, reload } = useResource('/loans');
  const [editing, setEditing] = useState<any>(null);
  const [repayFor, setRepayFor] = useState<any>(null);
  const [filterPerson, setFilterPerson] = useState<string>('');

  const saveLoan = async (v: any) => {
    if (editing && editing._id) await api.put(`/loans/${editing._id}`, v);
    else await api.post('/loans', v);
    setEditing(null);
    reload();
  };

  const addRepayment = async (v: any) => {
    await api.post(`/loans/${repayFor._id}/repayments`, v);
    setRepayFor(null);
    reload();
  };

  const removeLoan = async (row: any) => {
    if (!window.confirm('Delete this loan?')) return;
    await api.delete(`/loans/${row._id}`);
    reload();
  };

  // Aggregate loans by borrower so total debt per person is visible at a glance.
  const groups = Object.values(
    (data as any[]).reduce((acc: any, loan: any) => {
      const id = loan.borrower?._id || 'unknown';
      if (!acc[id]) {
        acc[id] = {
          id,
          name: loan.borrower?.name || 'Unknown',
          loans: 0,
          lent: 0,
          repaid: 0,
          outstanding: 0,
        };
      }
      const g = acc[id];
      g.loans += 1;
      g.lent += loan.principal || 0;
      g.outstanding += loan.outstanding || 0;
      g.repaid += (loan.principal || 0) - (loan.outstanding || 0);
      return acc;
    }, {}),
  ).sort((a: any, b: any) => b.outstanding - a.outstanding);

  const visibleLoans = filterPerson
    ? (data as any[]).filter((l) => (l.borrower?._id || 'unknown') === filterPerson)
    : (data as any[]);
  const filteredName = (groups as any[]).find((g) => g.id === filterPerson)?.name;

  return (
    <div>
      <div className="page-head">
        <h2>Loans</h2>
        <button onClick={() => setEditing({})}>+ Add Loan</button>
      </div>
      <p className="muted">Money lent to employees and friends. Register repayments as they come in.</p>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && data.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Debt by person</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'Person' },
              { key: 'loans', label: 'Loans' },
              { key: 'lent', label: 'Total lent', render: (r: any) => money(r.lent) },
              { key: 'repaid', label: 'Repaid', render: (r: any) => money(r.repaid) },
              { key: 'outstanding', label: 'Currently owes', render: (r: any) => (
                  <strong style={{ color: r.outstanding > 0 ? 'var(--bad)' : 'var(--good)' }}>
                    {money(r.outstanding)}
                  </strong>
                ) },
              { key: '_f', label: '', render: (r: any) => (
                  <button
                    className="ghost"
                    onClick={() => setFilterPerson(filterPerson === r.id ? '' : r.id)}
                  >
                    {filterPerson === r.id ? 'Clear' : 'View loans'}
                  </button>
                ) },
            ]}
            rows={groups}
          />
        </div>
      )}

      <h3>{filterPerson ? `Loans - ${filteredName}` : 'All loans'}</h3>
      <div className="card">
        {!loading && !error && (
          <DataTable
            columns={[
              { key: 'borrower', label: 'Borrower', render: (r: any) => r.borrower?.name || '-' },
              { key: 'principal', label: 'Lent', render: (r: any) => money(r.principal) },
              { key: 'outstanding', label: 'Outstanding', render: (r: any) => money(r.outstanding) },
              { key: 'dateIssued', label: 'Issued', render: (r: any) => fmt(r.dateIssued) },
              { key: 'status', label: 'Status', render: (r: any) => (
                  <span className={'pill ' + r.status}>{r.status}</span>
                ) },
              { key: '_a', label: 'Actions', render: (r: any) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="ghost" onClick={() => setRepayFor(r)}>
                      Repayments ({(r.repayments || []).length})
                    </button>
                    <button className="ghost" onClick={() => setEditing(r)}>Edit</button>
                    <button className="ghost" onClick={() => removeLoan(r)}>Delete</button>
                  </div>
                ) },
            ]}
            rows={visibleLoans}
          />
        )}
      </div>

      {editing && (
        <Modal title={editing._id ? 'Edit Loan' : 'New Loan'} onClose={() => setEditing(null)}>
          <ResourceForm
            fields={loanFields}
            initial={editing._id ? editing : undefined}
            onSubmit={saveLoan}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {repayFor && (
        <Modal
          title={`Repayments - ${repayFor.borrower?.name || ''}`}
          onClose={() => setRepayFor(null)}
        >
          <p className="muted">
            Lent {money(repayFor.principal)} - Outstanding {money(repayFor.outstanding)}
          </p>
          <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
            <tbody>
              {(repayFor.repayments || []).map((rp: any, i: number) => (
                <tr key={i}>
                  <td>{fmt(rp.date)}</td>
                  <td>{money(rp.amount)}</td>
                  <td>{rp.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(repayFor.repayments || []).length && <p className="muted">No repayments yet.</p>}
          <h4>Register a repayment</h4>
          <ResourceForm
            fields={repayFields}
            submitLabel="Add repayment"
            onSubmit={addRepayment}
            onCancel={() => setRepayFor(null)}
          />
        </Modal>
      )}
    </div>
  );
}
