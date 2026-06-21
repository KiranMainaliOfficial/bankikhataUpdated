import { useQuery } from '@tanstack/react-query';
import Skeleton from '../components/Skeleton.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';
import { formatDate, money } from '../lib/format.js';

export default function Transactions() {
  const { t } = usePreference();
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get('/transactions', { params: { limit: 80 } })).data
  });

  if (isLoading) return <Skeleton rows={6} />;

  return (
    <section className="panel p-4">
      <h1 className="mb-4 text-xl font-bold">{t('transactions')}</h1>
      <div className="mobile-scroll">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">{t('date')}</th>
              <th>{t('customers')}</th>
              <th>{t('type')}</th>
              <th>{t('amount')}</th>
              <th>Method</th>
              <th>{t('notes')}</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((tx) => (
              <tr key={tx._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-3">{formatDate(tx.date)}</td>
                <td>{tx.customer?.fullName}</td>
                <td className={tx.type === 'credit' ? 'font-semibold text-amber-600' : 'font-semibold text-brand-600'}>{tx.type}</td>
                <td>{money(tx.amount)}</td>
                <td>{tx.paymentMethod || '-'}</td>
                <td>{tx.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
