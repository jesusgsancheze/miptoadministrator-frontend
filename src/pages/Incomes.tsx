import { api } from '../api/client';
import CrudPage from '../components/CrudPage';

const money = (v: number) => '$' + (v || 0).toLocaleString();

export default function Incomes() {
  return (
    <CrudPage
      title="Incomes"
      endpoint="/incomes"
      description="Incomes per source and project. Use Mark done once the money has been received."
      searchPlaceholder="Search project, client, account, period, amount..."
      filters={[
        {
          name: 'status',
          label: 'Status',
          options: [
            { value: 'done', label: 'Received' },
            { value: 'pending', label: 'Pending' },
          ],
          match: (r: any, v: string) => (v === 'done' ? !!r.isDone : !r.isDone),
        },
        {
          name: 'period',
          label: 'Period',
          optionsEndpoint: '/periods',
          optionLabel: 'label',
          match: (r: any, v: string) => String(r.period?._id || r.period) === v,
        },
        {
          name: 'account',
          label: 'Account',
          optionsEndpoint: '/accounts',
          match: (r: any, v: string) => String(r.account?._id || r.account) === v,
        },
      ]}
      searchValue={(r: any) => [
        r.kind,
        r.project?.name,
        r.client?.name,
        r.account?.name,
        r.period?.label,
        r.description,
        String(r.amount ?? ''),
        String(r.profit ?? ''),
      ].filter(Boolean).join(' ')}
      columns={[
        { key: 'kind', label: 'Kind' },
        { key: 'project', label: 'Project', render: (r: any) => r.project?.name || '-' },
        { key: 'client', label: 'Client', render: (r: any) => r.client?.name || '-' },
        { key: 'account', label: 'Account', render: (r: any) => r.account?.name || '-' },
        { key: 'period', label: 'Period', render: (r: any) => r.period?.label || '-' },
        { key: 'amount', label: 'Amount', render: (r: any) => money(r.amount) },
        { key: 'profit', label: 'Profit', render: (r: any) => money(r.profit) },
        { key: 'isDone', label: 'Status', render: (r: any) => (
            <span className={'pill ' + (r.isDone ? 'done' : 'pending')}>
              {r.isDone ? 'Done' : 'Pending'}
            </span>
          ) },
      ]}
      fields={[
        { name: 'period', label: 'Period', type: 'select', optionsEndpoint: '/periods', optionLabel: 'label', required: true },
        { name: 'account', label: 'Account (source)', type: 'select', optionsEndpoint: '/accounts', required: true },
        { name: 'kind', label: 'Kind', type: 'select', required: true, defaultValue: 'project', options: [
            { value: 'project', label: 'Project income' },
            { value: 'debt', label: 'Debt' },
            { value: 'other', label: 'Other' },
          ] },
        { name: 'project', label: 'Project (when kind = project)', type: 'select', optionsEndpoint: '/projects' },
        { name: 'client', label: 'Client', type: 'select', optionsEndpoint: '/clients' },
        { name: 'amount', label: 'Amount (USD)', type: 'number', required: true },
        { name: 'profit', label: 'Profit / margin (USD)', type: 'number', defaultValue: 0 },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'isRecurrent', label: 'Recurrent income', type: 'checkbox' },
        { name: 'isDone', label: 'Already received', type: 'checkbox' },
      ]}
      rowActions={(row: any, reload: () => void) => (
        <button
          className="ghost"
          onClick={() => api.patch(`/incomes/${row._id}/done`).then(reload)}
        >
          {row.isDone ? 'Undo' : 'Mark done'}
        </button>
      )}
      bulkActions={(ids: string[], reload: () => void) => (
        <>
          <button
            onClick={async () => {
              await api.patch('/incomes/done-bulk', { ids, isDone: true });
              reload();
            }}
          >
            Mark {ids.length} done
          </button>
          <button
            className="ghost"
            onClick={async () => {
              await api.patch('/incomes/done-bulk', { ids, isDone: false });
              reload();
            }}
          >
            Mark {ids.length} undone
          </button>
          <button
            className="ghost"
            onClick={async () => {
              if (!window.confirm(`Delete ${ids.length} income(s)?`)) return;
              await api.post('/incomes/bulk-delete', { ids });
              reload();
            }}
          >
            Delete {ids.length}
          </button>
        </>
      )}
    />
  );
}
