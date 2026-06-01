import CrudPage from '../components/CrudPage';

export default function Projects() {
  return (
    <CrudPage
      title="Projects"
      endpoint="/projects"
      description="Projects used to group incomes and payroll, so you can see earnings per project."
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'isActive', label: 'Active', render: (r: any) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'color', label: 'Color (hex)', type: 'text', defaultValue: '#3b82f6' },
        { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true },
      ]}
    />
  );
}
