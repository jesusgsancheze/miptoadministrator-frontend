import CrudPage from '../components/CrudPage';

export default function Clients() {
  return (
    <CrudPage
      title="Clients"
      endpoint="/clients"
      description="The people or companies that pay your incomes."
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'notes', label: 'Notes' },
        { key: 'isActive', label: 'Active', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea' },
        { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
      ]}
    />
  );
}
