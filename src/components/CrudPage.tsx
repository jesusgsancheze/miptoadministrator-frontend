import { ReactNode, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useResource } from '../hooks/useResource';
import DataTable from './DataTable';
import Modal from './Modal';
import ResourceForm, { Field } from './ResourceForm';

interface Column { key: string; label: any; render?: (row: any) => any; }

/** A fixed dropdown filter shown above the table. */
export interface Filter {
  /** Stable key for the filter (used as state key). */
  name: string;
  label: string;
  /** Predicate: does this row match the chosen value? */
  match: (row: any, value: string) => boolean;
  /** Hardcoded options. */
  options?: { value: string; label: string }[];
  /** Or fetch options from a REST endpoint that returns [{ _id, name|label }]. */
  optionsEndpoint?: string;
  /** Property to render for the fetched option label (default "name"). */
  optionLabel?: string;
}

interface Props {
  title: string;
  endpoint: string;
  columns: Column[];
  fields: Field[];
  description?: string;
  rowActions?: (row: any, reload: () => void) => ReactNode;
  /** When provided, a search box appears at the top and rows are filtered
   *  by case-insensitive substring match against the string this returns. */
  searchValue?: (row: any) => string;
  searchPlaceholder?: string;
  /** Fixed dropdown filters rendered next to the search input. All filters
   *  AND together, then the search query AND's on top. */
  filters?: Filter[];
  /** When provided, each row gets a checkbox and these action buttons render
   *  above the table whenever at least one row is selected. */
  bulkActions?: (
    selectedIds: string[],
    reload: () => void,
    clearSelection: () => void,
  ) => ReactNode;
}

export default function CrudPage({
  title, endpoint, columns, fields, description, rowActions,
  searchValue, searchPlaceholder, filters, bulkActions,
}: Props) {
  const { data, loading, error, reload } = useResource(endpoint);
  const [editing, setEditing] = useState<any>(null); // null = closed, {} = new, {...} = edit
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filterOpts, setFilterOpts] = useState<Record<string, { value: string; label: string }[]>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const singular = title.replace(/s$/, '');

  // Fetch dropdown options for any filter that points at an endpoint.
  useEffect(() => {
    (filters || []).filter((f) => f.optionsEndpoint).forEach((f) => {
      api.get(f.optionsEndpoint as string)
        .then((r) => {
          const opts = (r.data || []).map((o: any) => ({
            value: o._id, label: o[f.optionLabel || 'name'],
          }));
          setFilterOpts((p) => ({ ...p, [f.name]: opts }));
        })
        .catch(() => {});
    });
  }, [filters]);

  const setFilter = (name: string, value: string) =>
    setFilterValues((p) => ({ ...p, [name]: value }));

  const q = query.trim().toLowerCase();
  const activeFilters = (filters || []).filter((f) => filterValues[f.name]);
  let filtered = data as any[];
  for (const f of activeFilters) filtered = filtered.filter((r) => f.match(r, filterValues[f.name]));
  if (searchValue && q) {
    filtered = filtered.filter((r) => (searchValue(r) || '').toLowerCase().includes(q));
  }

  const allSelected = filtered.length > 0 && filtered.every((r: any) => selected.has(r._id));
  const someSelected = !allSelected && filtered.some((r: any) => selected.has(r._id));

  const toggleRow = (id: string, on: boolean) => {
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id); else n.delete(id);
      return n;
    });
  };
  const toggleAll = (on: boolean) => {
    setSelected((s) => {
      const n = new Set(s);
      for (const r of filtered as any[]) { if (on) n.add(r._id); else n.delete(r._id); }
      return n;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const save = async (values: any) => {
    if (editing && editing._id) await api.put(`${endpoint}/${editing._id}`, values);
    else await api.post(endpoint, values);
    setEditing(null);
    reload();
  };

  const remove = async (row: any) => {
    if (!window.confirm(`Delete this ${singular.toLowerCase()}?`)) return;
    await api.delete(`${endpoint}/${row._id}`);
    reload();
  };

  const actionCol: Column = {
    key: '_actions',
    label: 'Actions',
    render: (row: any) => (
      <div style={{ display: 'flex', gap: 6 }}>
        {rowActions ? rowActions(row, reload) : null}
        <button className="ghost" onClick={() => setEditing(row)}>Edit</button>
        <button className="ghost" onClick={() => remove(row)}>Delete</button>
      </div>
    ),
  };

  const selectionCol: Column | null = bulkActions
    ? {
        key: '_sel',
        label: (
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            style={{ width: 'auto' }}
            onChange={(e) => toggleAll(e.target.checked)}
          />
        ),
        render: (row: any) => (
          <input
            type="checkbox"
            checked={selected.has(row._id)}
            style={{ width: 'auto' }}
            onChange={(e) => toggleRow(row._id, e.target.checked)}
          />
        ),
      }
    : null;

  const allColumns: Column[] = [
    ...(selectionCol ? [selectionCol] : []),
    ...columns,
    actionCol,
  ];

  return (
    <div>
      <div className="page-head">
        <h2>{title}</h2>
        <button onClick={() => setEditing({})}>+ Add {singular}</button>
      </div>
      {description && <p className="muted">{description}</p>}
      {(searchValue || (filters && filters.length > 0)) && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          alignItems: 'center', marginBottom: 10,
        }}>
          {searchValue && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || 'Search...'}
              style={{ maxWidth: 320, flex: '1 1 220px', marginBottom: 0 }}
            />
          )}
          {(filters || []).map((f) => {
            const opts = f.options || filterOpts[f.name] || [];
            return (
              <select
                key={f.name}
                value={filterValues[f.name] || ''}
                onChange={(e) => setFilter(f.name, e.target.value)}
                style={{ maxWidth: 200, marginBottom: 0 }}
              >
                <option value="">{`All ${f.label.toLowerCase()}`}</option>
                {opts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            );
          })}
          {(activeFilters.length > 0 || query) && (
            <button
              type="button"
              className="ghost"
              onClick={() => { setFilterValues({}); setQuery(''); }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      {bulkActions && selected.size > 0 && (
        <div
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}
        >
          <strong>{selected.size} selected</strong>
          {bulkActions(Array.from(selected), () => { reload(); clearSelection(); }, clearSelection)}
          <button className="ghost" onClick={clearSelection}>Clear</button>
        </div>
      )}
      <div className="card">
        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <>
            {(q || activeFilters.length > 0) && (
              <p className="muted" style={{ marginTop: 0 }}>
                {filtered.length} of {data.length} match
                {q ? ` "${query}"` : ''}
                {activeFilters.length > 0 ? ` (${activeFilters.length} filter${activeFilters.length === 1 ? '' : 's'})` : ''}
              </p>
            )}
            <DataTable columns={allColumns} rows={filtered} />
          </>
        )}
      </div>
      {editing && (
        <Modal
          title={editing._id ? `Edit ${singular}` : `New ${singular}`}
          onClose={() => setEditing(null)}
        >
          <ResourceForm
            fields={fields}
            initial={editing._id ? editing : undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
