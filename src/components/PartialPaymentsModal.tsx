import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal from './Modal';
import SearchableSelect from './SearchableSelect';

interface Partial {
  date: string | Date;
  amount: number;
  account?: any;
  note?: string;
}

interface Props {
  payment: any;
  onClose: () => void;
  onChanged: (updated: any) => void;
}

const money = (v: number) => '$' + (v || 0).toLocaleString();
const fmtDate = (d: string | Date) => (d ? String(d).slice(0, 10) : '');

/** Modal to view, add and remove the installments of a single payment. */
export default function PartialPaymentsModal({ payment, onClose, onChanged }: Props) {
  const [current, setCurrent] = useState<any>(payment);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/accounts').then((r) => setAccounts(r.data)).catch(() => {});
    setAccount(payment?.account?._id || payment?.account || '');
  }, [payment]);

  const rows: Partial[] = current.partialPayments || [];
  const net = current.netAmount ?? current.amount ?? 0;
  const rawPaid = current.paidAmount
    ?? rows.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const paid = current.isDone ? Math.max(rawPaid, net) : rawPaid;
  const remaining = Math.max(net - paid, 0);

  const refresh = async () => {
    const r = await api.get(`/payments/${payment._id}`);
    setCurrent(r.data);
    onChanged(r.data);
  };

  const add = async () => {
    setError('');
    const v = Number(amount);
    if (!v || v <= 0) { setError('Amount must be greater than zero.'); return; }
    setBusy(true);
    try {
      await api.post(`/payments/${payment._id}/partial`, {
        amount: v, date, account: account || undefined, note: note || undefined,
      });
      setAmount(''); setNote('');
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save installment.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (i: number) => {
    if (!window.confirm('Delete this installment?')) return;
    await api.delete(`/payments/${payment._id}/partial/${i}`);
    await refresh();
  };

  const fillRemaining = () => setAmount(remaining > 0 ? String(remaining) : '');
  const accountName = (id: any) =>
    accounts.find((a) => a._id === (id?._id || id))?.name || '-';

  return (
    <Modal title={`Partial payments — ${current.concept || ''}`} onClose={onClose}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div><div className="muted" style={{ fontSize: 12 }}>Net total</div><strong>{money(net)}</strong></div>
        <div><div className="muted" style={{ fontSize: 12 }}>Paid</div><strong style={{ color: 'var(--good)' }}>{money(paid)}</strong></div>
        <div><div className="muted" style={{ fontSize: 12 }}>Remaining</div><strong style={{ color: remaining > 0 ? 'var(--bad)' : 'var(--good)' }}>{money(remaining)}</strong></div>
      </div>

      <h4 style={{ margin: '12px 0 6px' }}>Installments</h4>
      {rows.length === 0 && <p className="muted">No installments yet.</p>}
      {rows.length > 0 && (
        <table style={{ width: '100%', marginBottom: 12 }}>
          <thead>
            <tr><th>Date</th><th>Amount</th><th>Account</th><th>Note</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i}>
                <td>{fmtDate(p.date)}</td>
                <td>{money(Number(p.amount) || 0)}</td>
                <td>{accountName(p.account)}</td>
                <td>{p.note || '-'}</td>
                <td><button className="ghost" onClick={() => remove(i)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4 style={{ margin: '12px 0 6px' }}>Add installment</h4>
      <div>
        <label>Amount</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="number" value={amount}
            placeholder={remaining > 0 ? `Up to ${money(remaining)}` : ''}
            onChange={(e) => setAmount(e.target.value)}
          />
          {remaining > 0 && (
            <button type="button" className="ghost" onClick={fillRemaining}>
              Pay remaining
            </button>
          )}
        </div>
      </div>
      <div>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label>Account (source)</label>
        <SearchableSelect
          value={account}
          options={accounts.map((a) => ({ value: a._id, label: a.name }))}
          onChange={setAccount}
        />
      </div>
      <div>
        <label>Note</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button type="button" onClick={add} disabled={busy}>
          {busy ? 'Saving...' : 'Add installment'}
        </button>
        <button type="button" className="ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
