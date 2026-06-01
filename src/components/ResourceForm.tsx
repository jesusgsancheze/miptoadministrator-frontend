import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SearchableSelect from './SearchableSelect';
import DeductionsField from './DeductionsField';

export interface Field {
  name: string;
  label: string;
  type: string; // text | textarea | number | date | checkbox | select
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsEndpoint?: string;
  optionLabel?: string; // property to display, default "name"
  defaultValue?: any;
}

interface Props {
  fields: Field[];
  initial?: any;
  submitLabel?: string;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

function buildInitial(fields: Field[], initial: any) {
  const out: any = {};
  for (const f of fields) {
    let v = initial ? initial[f.name] : undefined;
    if (v === undefined || v === null) {
      if (f.defaultValue !== undefined) v = f.defaultValue;
      else if (f.type === 'checkbox') v = false;
      else if (f.type === 'deductions') v = [];
      else v = '';
    }
    if (f.type === 'select' && v && typeof v === 'object') v = v._id ?? '';
    if (f.type === 'date' && v) v = String(v).slice(0, 10);
    out[f.name] = v;
  }
  return out;
}

export default function ResourceForm({ fields, initial, submitLabel = 'Save', onSubmit, onCancel }: Props) {
  // Lazy init runs once on mount; the form is remounted each time a modal opens.
  const [values, setValues] = useState<any>(() => buildInitial(fields, initial));
  const [remote, setRemote] = useState<Record<string, any[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fields.filter((f) => f.optionsEndpoint).forEach((f) => {
      api.get(f.optionsEndpoint as string)
        .then((res) => setRemote((p) => ({ ...p, [f.name]: res.data })))
        .catch(() => {});
    });
  }, []);

  const set = (name: string, v: any) => setValues((p: any) => ({ ...p, [name]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const missing = fields.find(
      (f) => f.required && [undefined, null, ''].includes(values[f.name]),
    );
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setBusy(true);
    try {
      const payload: any = {};
      for (const f of fields) {
        const v = values[f.name];
        if (f.type === 'number') {
          payload[f.name] = v === '' || v === null || v === undefined ? null : Number(v);
        } else if (f.type === 'checkbox') {
          payload[f.name] = !!v;
        } else if (f.type === 'deductions') {
          payload[f.name] = (Array.isArray(v) ? v : [])
            .map((d: any) => ({ reason: (d.reason || '').trim(), amount: Number(d.amount) || 0 }))
            .filter((d: any) => d.reason || d.amount);
        } else if (v === '' || v === undefined) {
          payload[f.name] = null;
        } else {
          payload[f.name] = v;
        }
      }
      await onSubmit(payload);
    } catch (err: any) {
      const m = err?.response?.data?.message;
      setError(Array.isArray(m) ? m.join(', ') : m || 'Save failed');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {fields.map((f) => {
        const opts = f.options
          || (remote[f.name] || []).map((o: any) => ({ value: o._id, label: o[f.optionLabel || 'name'] }));
        return (
          <div key={f.name}>
            <label>{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'select' ? (
              <SearchableSelect
                value={values[f.name] ?? ''}
                options={opts}
                required={f.required}
                onChange={(v) => set(f.name, v)}
              />
            ) : f.type === 'deductions' ? (
              <DeductionsField
                value={values[f.name] || []}
                grossAmount={Number(values['amount']) || 0}
                onChange={(v) => set(f.name, v)}
              />
            ) : f.type === 'checkbox' ? (
              <div>
                <input
                  type="checkbox"
                  checked={!!values[f.name]}
                  style={{ width: 'auto' }}
                  onChange={(e) => set(f.name, e.target.checked)}
                />
              </div>
            ) : f.type === 'textarea' ? (
              <textarea
                rows={2}
                value={values[f.name] ?? ''}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : (
              <input
                type={f.type}
                value={values[f.name] ?? ''}
                required={f.required}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </div>
        );
      })}
      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button type="submit" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
