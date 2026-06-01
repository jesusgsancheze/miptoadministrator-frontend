import { useEffect, useRef, useState } from 'react';

interface Option { value: string; label: string; }

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

/** A dropdown with a type-to-filter search box. Keyboard: arrows, Enter, Esc. */
export default function SearchableSelect({ value, options, onChange, required, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q));
  const rows: Option[] = required
    ? filtered
    : [{ value: '', label: '-- none --' }, ...filtered];

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(h + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && rows[hi]) pick(rows[hi].value);
      else setOpen(true);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="select-search" ref={ref}>
      <input
        type="text"
        autoComplete="off"
        value={open ? query : selected?.label ?? ''}
        placeholder={selected ? selected.label : placeholder || 'Select or search...'}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHi(0); }}
        onKeyDown={onKey}
      />
      {open && (
        <div className="select-search-list">
          {rows.length === 0 && <div className="select-search-empty">No matches</div>}
          {rows.map((o, i) => (
            <div
              key={o.value || '__none__'}
              className={'select-search-opt' + (i === hi ? ' active' : '')}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}
            >
              {o.value === '' ? <span className="muted">{o.label}</span> : o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
