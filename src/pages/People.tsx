import CrudPage from '../components/CrudPage';

export default function People() {
  return (
    <CrudPage
      title="People"
      endpoint="/people"
      description="Employees and friends who are paid, or who borrow money."
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'notes', label: 'Notes' },
        { key: 'isActive', label: 'Active', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'type', label: 'Type', type: 'select', defaultValue: 'employee', options: [
            { value: 'employee', label: 'Employee' },
            { value: 'friend', label: 'Friend' },
            { value: 'external', label: 'External' },
          ] },
        { name: 'notes', label: 'Notes', type: 'textarea' },
        { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
      ]}
    />
  );
}
