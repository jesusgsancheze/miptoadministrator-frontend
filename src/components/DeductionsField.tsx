interface Deduction { reason: string; amount: any; }

interface Props {
  value: Deduction[];
  grossAmount: number;
  onChange: (v: Deduction[]) => void;
}

const money = (v: number) => '$' + (v || 0).toLocaleString();

/** Repeatable editor for per-payment deductions. Shows the live net total. */
export default function DeductionsField({ value, grossAmount, onChange }: Props) {
  const rows = value || [];
  const update = (i: number, patch: Partial<Deduction>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { reason: '', amount: '' }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const totalDed = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const net = grossAmount - totalDed;

  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            placeholder="Reason"
            value={r.reason}
            onChange={(e) => update(i, { reason: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            value={r.amount}
            style={{ maxWidth: 120 }}
            onChange={(e) => update(i, { amount: e.target.value })}
          />
          <button type="button" className="ghost" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="ghost" onClick={add}>+ Add deduction</button>
      {rows.length > 0 && (
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Deductions: {money(totalDed)} &nbsp;|&nbsp; Net payment:{' '}
          <strong style={{ color: net < 0 ? 'var(--bad)' : 'var(--good)' }}>
            {money(net)}
          </strong>
        </div>
      )}
    </div>
  );
}
