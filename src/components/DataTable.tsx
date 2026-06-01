interface Column { key: string; label: any; render?: (row: any) => any; }

export default function DataTable({ columns, rows }: { columns: Column[]; rows: any[] }) {
  if (!rows.length) return <p className="muted">No records yet.</p>;
  return (
    <table>
      <thead>
        <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row._id || i}>
            {columns.map((c) => (
              <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
