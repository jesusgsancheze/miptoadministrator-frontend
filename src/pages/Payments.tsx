import { useState } from 'react';
import { api } from '../api/client';
import CrudPage from '../components/CrudPage';
import PartialPaymentsModal from '../components/PartialPaymentsModal';

const money = (v: number) => '$' + (v || 0).toLocaleString();

export default function Payments() {
  const [partialFor, setPartialFor] = useState<any>(null);
  const [partialReload, setPartialReload] = useState<() => void>(() => () => {});

  return (
    <>
      <CrudPage
        title="Payments"
        endpoint="/payments"
        description="Payroll, company and personal outcomes. Mark recurrent payments, which half-month they fall on, and split a payment into partial installments when needed."
        searchPlaceholder="Search concept, person, project, category, account, period..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'paid', label: 'Paid' },
              { value: 'partial', label: 'Partial' },
              { value: 'pending', label: 'Pending' },
            ],
            match: (r: any, v: string) => {
              const paid = r.paidAmount ?? 0;
              if (v === 'paid') return !!r.isDone;
              if (v === 'partial') return !r.isDone && paid > 0;
              return !r.isDone && paid <= 0;
            },
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
          r.concept,
          r.payee?.name,
          r.paymentType?.name,
          r.project?.name,
          r.personalCategory?.name,
          r.account?.name,
          r.period?.label,
          r.description,
          String(r.amount ?? ''),
          String(r.netAmount ?? ''),
          (r.deductions || []).map((d: any) => d.reason).join(' '),
        ].filter(Boolean).join(' ')}
        columns={[
          { key: 'concept', label: 'Concept' },
          { key: 'payee', label: 'Person', render: (r: any) => r.payee?.name || '-' },
          { key: 'paymentType', label: 'Type', render: (r: any) => r.paymentType?.name || '-' },
          { key: 'project', label: 'Project', render: (r: any) => r.project?.name || '-' },
          { key: 'personalCategory', label: 'Personal cat.', render: (r: any) => r.personalCategory?.name || '-' },
          { key: 'account', label: 'Account', render: (r: any) => r.account?.name || '-' },
          { key: 'period', label: 'Period', render: (r: any) => r.period?.label || '-' },
          { key: 'amount', label: 'Amount', render: (r: any) => money(r.amount) },
          { key: 'deductions', label: 'Deductions', render: (r: any) => {
              const d = (r.deductions || []).reduce((s: number, x: any) => s + (x.amount || 0), 0);
              return d ? '-' + money(d) : '-';
            } },
          { key: 'net', label: 'Net', render: (r: any) => money(r.netAmount ?? r.amount) },
          { key: 'paid', label: 'Paid / Remaining', render: (r: any) => {
              const net = r.netAmount ?? r.amount ?? 0;
              const rawPaid = r.paidAmount ?? 0;
              const paid = r.isDone ? Math.max(rawPaid, net) : rawPaid;
              const remaining = Math.max(net - paid, 0);
              const n = (r.partialPayments || []).length;
              return (
                <span title={n ? `${n} installment(s)` : ''}>
                  {money(paid)} <span className="muted">/</span>{' '}
                  <span style={{ color: remaining > 0 ? 'var(--bad)' : 'var(--good)' }}>
                    {money(remaining)}
                  </span>
                </span>
              );
            } },
          { key: 'isRecurrent', label: 'Recurrent', render: (r: any) => (r.isRecurrent ? `Yes (${r.recurrentHalf})` : 'No') },
          { key: 'isDone', label: 'Status', render: (r: any) => {
              const net = r.netAmount ?? r.amount ?? 0;
              const paid = r.paidAmount ?? 0;
              const partial = !r.isDone && paid > 0 && paid < net;
              const label = r.isDone ? 'Paid' : partial ? 'Partial' : 'Pending';
              const cls = r.isDone ? 'done' : partial ? 'partial' : 'pending';
              return <span className={'pill ' + cls}>{label}</span>;
            } },
        ]}
        fields={[
          { name: 'period', label: 'Period', type: 'select', optionsEndpoint: '/periods', optionLabel: 'label', required: true },
          { name: 'concept', label: 'Concept', type: 'text', required: true },
          { name: 'account', label: 'Account (source)', type: 'select', optionsEndpoint: '/accounts', required: true },
          { name: 'paymentType', label: 'Payment type', type: 'select', optionsEndpoint: '/categories?scope=paymentType', required: true },
          { name: 'payee', label: 'Payee (person)', type: 'select', optionsEndpoint: '/people' },
          { name: 'project', label: 'Project (for payroll)', type: 'select', optionsEndpoint: '/projects' },
          { name: 'personalCategory', label: 'Personal category', type: 'select', optionsEndpoint: '/categories?scope=personalExpense' },
          { name: 'amount', label: 'Amount before deductions (USD)', type: 'number', required: true },
          { name: 'deductions', label: 'Deductions', type: 'deductions' },
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'recurrence', label: 'Recurrence',
            type: 'select',
            defaultValue: 'none',
            deriveInitial: (r: any) => !r.isRecurrent ? 'none' : (r.recurrentHalf || 'both'),
            options: [
              { value: 'none', label: 'Not recurrent (one-off payment)' },
              { value: '1', label: 'Recurs on start of month' },
              { value: '2', label: 'Recurs on mid month' },
              { value: 'both', label: 'Recurs on both halves' },
            ] },
          { name: 'isDone', label: 'Already paid', type: 'checkbox' },
        ]}
        rowActions={(row: any, reload: () => void) => (
          <>
            <button
              className="ghost"
              onClick={() => { setPartialReload(() => reload); setPartialFor(row); }}
            >
              Pay partial
            </button>
            <button
              className="ghost"
              onClick={() => api.patch(`/payments/${row._id}/done`).then(reload)}
            >
              {row.isDone ? 'Undo' : 'Mark paid'}
            </button>
          </>
        )}
        bulkActions={(ids: string[], reload: () => void) => (
          <>
            <button
              onClick={async () => {
                await api.patch('/payments/done-bulk', { ids, isDone: true });
                reload();
              }}
            >
              Mark {ids.length} paid
            </button>
            <button
              className="ghost"
              onClick={async () => {
                await api.patch('/payments/done-bulk', { ids, isDone: false });
                reload();
              }}
            >
              Mark {ids.length} unpaid
            </button>
            <button
              className="ghost"
              onClick={async () => {
                if (!window.confirm(`Delete ${ids.length} payment(s)?`)) return;
                await api.post('/payments/bulk-delete', { ids });
                reload();
              }}
            >
              Delete {ids.length}
            </button>
          </>
        )}
      />
      {partialFor && (
        <PartialPaymentsModal
          payment={partialFor}
          onClose={() => { setPartialFor(null); partialReload(); }}
          onChanged={(updated) => setPartialFor(updated)}
        />
      )}
    </>
  );
}
