import CrudPage from '../components/CrudPage';
import ChangePasswordCard from '../components/ChangePasswordCard';

const money = (v: number) => '$' + (v || 0).toLocaleString();

export default function Settings() {
  return (
    <div>
      <h2>Settings</h2>
      <p className="muted">Manage your money sources and the half-month periods.</p>

      <CrudPage
        title="Accounts"
        endpoint="/accounts"
        description="Your three money sources. Balances are computed from transactions."
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'openingBalance', label: 'Opening balance', render: (r: any) => money(r.openingBalance) },
          { key: 'isActive', label: 'Active', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
        ]}
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'openingBalance', label: 'Opening balance (USD)', type: 'number', defaultValue: 0 },
          { name: 'notes', label: 'Notes', type: 'textarea' },
          { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
        ]}
      />

      <CrudPage
        title="Periods"
        endpoint="/periods"
        description="Half-month batches. Half 1 = start of month, Half 2 = mid month. The label is generated automatically."
        columns={[
          { key: 'label', label: 'Label' },
          { key: 'year', label: 'Year' },
          { key: 'month', label: 'Month' },
          { key: 'half', label: 'Half' },
          { key: 'isClosed', label: 'Closed', render: (r: any) => (r.isClosed ? 'Yes' : 'No') },
        ]}
        fields={[
          { name: 'year', label: 'Year', type: 'number', required: true, defaultValue: 2026 },
          { name: 'month', label: 'Month (1-12)', type: 'number', required: true },
          { name: 'half', label: 'Half', type: 'select', required: true, defaultValue: '1', options: [
              { value: '1', label: '1 - Start of month' },
              { value: '2', label: '2 - Mid month' },
            ] },
          { name: 'isClosed', label: 'Closed', type: 'checkbox' },
        ]}
      />

      <ChangePasswordCard />
    </div>
  );
}
