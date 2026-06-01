import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from 'recharts';

interface Series { key: string; name: string; color: string; }
interface Props {
  title: string;
  data: any[];
  xKey: string;
  series: Series[];
  empty?: string;
}

const AXIS = { fill: '#94a3b8', fontSize: 11 };

/** Reusable dark-themed bar chart wrapped in a card. */
export default function BarChartCard({ title, data, xKey, series, empty }: Props) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {data.length === 0 ? (
        <p className="muted">{empty || 'No data yet.'}</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xKey} tick={AXIS} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={AXIS} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(v: any) => '$' + Number(v).toLocaleString()}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
