import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';
import { Banknote, TrendingDown, TrendingUp } from 'lucide-react';

export default function Reports() {
  const { t } = usePreference();
  const [range, setRange] = useState('month');
  const { data, isLoading } = useQuery({
    queryKey: ['reports', range],
    queryFn: async () => (await api.get('/reports', { params: { range } })).data
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{t('reports')}</h1>
        <select className="input max-w-48" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="today">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
      </div>
      {!isLoading && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={TrendingUp} label={t('totalCredit')} value={money(data.summary.totalCredit)} tone="amber" />
            <StatCard icon={TrendingDown} label={t('totalPaid')} value={money(data.summary.totalCollection)} tone="sky" />
            <StatCard icon={Banknote} label={t('balance')} value={money(data.summary.outstandingAmount)} />
          </section>
          <section className="panel p-4">
            <h2 className="mb-3 font-bold">Top Debtors</h2>
            <div className="grid gap-2">
              {data.topDebtors.map((customer) => (
                <div key={customer._id} className="flex justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="font-semibold">{customer.fullName}</span>
                  <span>{money(customer.totals.balance)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
