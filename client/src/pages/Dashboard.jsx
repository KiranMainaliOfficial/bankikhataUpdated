import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, ReceiptText, TrendingUp, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Skeleton from '../components/Skeleton.jsx';
import StatCard from '../components/StatCard.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';

function monthLabel(row) {
  if (!row?._id) return '';
  return `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
}

export default function Dashboard() {
  const { t } = usePreference();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
    refetchInterval: 45000
  });

  if (isLoading) return <Skeleton rows={6} />;

  const summary = data.summary;
  const monthly = Object.values(
    data.monthly.reduce((acc, row) => {
      const key = monthLabel(row);
      acc[key] ||= { month: key, credit: 0, payment: 0 };
      acc[key][row._id.type] = row.amount;
      return acc;
    }, {})
  );
  const growth = data.customerGrowth.map((row) => ({ month: monthLabel(row), customers: row.customers }));

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('totalCustomers')} value={summary.totalCustomers} />
        <StatCard icon={TrendingUp} label={t('totalOutstandingCredit')} value={money(summary.totalOutstandingCredit)} tone="amber" />
        <StatCard icon={Banknote} label={t('totalPaidAmount')} value={money(summary.totalPaidAmount)} tone="sky" />
        <StatCard icon={ReceiptText} label={t('totalTransactions')} value={summary.totalTransactions} />
        <StatCard icon={Banknote} label={t('todayCollection')} value={money(summary.todayCollection)} tone="sky" />
        <StatCard icon={Banknote} label={t('thisMonthCollection')} value={money(summary.thisMonthCollection)} tone="brand" />
        <StatCard icon={AlertTriangle} label={t('overdueAmount')} value={money(summary.overdueAmount)} tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="panel p-4">
          <h2 className="mb-4 font-bold">Monthly Credit & Collection</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Line type="monotone" dataKey="credit" stroke="#f59e0b" strokeWidth={3} />
                <Line type="monotone" dataKey="payment" stroke="#059669" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="mb-4 font-bold">Top Debtors</h2>
          <div className="space-y-3">
            {data.topDebtors.map((customer) => (
              <div key={customer._id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customer.fullName}</p>
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                </div>
                <span className="font-bold text-amber-600">{money(customer.totals.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="mb-4 font-bold">Customer Growth</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="customers" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
