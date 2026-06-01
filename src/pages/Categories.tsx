import CrudPage from '../components/CrudPage';

const SCOPES: Record<string, string> = {
  paymentType: 'Payment type',
  personalExpense: 'Personal expense',
  incomeKind: 'Income kind',
};

export default function Categories() {
  return (
    <CrudPage
      title="Categories"
      endpoint="/categories"
      description="Editable categories: payment types (Nomina, Mipto, Personal, Deuda) and personal-expense categories (Family, Fun, etc.)."
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'scope', label: 'Scope', render: (r: any) => SCOPES[r.scope] || r.scope },
        { key: 'isActive', label: 'Active', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'scope', label: 'Scope', type: 'select', required: true, defaultValue: 'personalExpense', options: [
            { value: 'paymentType', label: 'Payment type (Nomina / Mipto / ...)' },
            { value: 'personalExpense', label: 'Personal expense (Family / Fun / ...)' },
            { value: 'incomeKind', label: 'Income kind (Debt / Other)' },
          ] },
        { name: 'color', label: 'Color (hex)', type: 'text', defaultValue: '#64748b' },
        { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
      ]}
    />
  );
}
