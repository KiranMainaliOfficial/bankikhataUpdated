import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';

const emptyCustomer = { fullName: '', phone: '', alternatePhone: '', address: '', notes: '' };

export default function Customers() {
  const { t } = usePreference();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCustomer);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, sort],
    queryFn: async () => (await api.get('/customers', { params: { search, sort, limit: 50 } })).data
  });

  const saveCustomer = useMutation({
    mutationFn: async () => (await api.post('/customers', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setForm(emptyCustomer);
      setOpen(false);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="input pl-10" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Recently Added</option>
          <option value="name">Name</option>
          <option value="balance">Outstanding Balance</option>
          <option value="oldest">Oldest</option>
        </select>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          {t('addCustomer')}
        </button>
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.customers.map((customer) => (
            <Link key={customer._id} to={`/customers/${customer._id}`} className="panel block p-4 transition hover:-translate-y-0.5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{customer.fullName}</p>
                  <p className="text-sm text-slate-500">{customer.customerId}</p>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-1 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-200">
                  {money(customer.totals.balance)}
                </span>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Phone size={16} />
                {customer.phone}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-800">{t('totalCredit')}: {money(customer.totals.credit)}</div>
                <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-800">{t('totalPaid')}: {money(customer.totals.paid)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal title={t('addCustomer')} open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); saveCustomer.mutate(); }}>
          {['fullName', 'phone', 'alternatePhone', 'address', 'notes'].map((field) => (
            <label key={field} className="text-sm font-semibold">
              {t(field) || field}
              <input
                className="input mt-1"
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                required={field === 'fullName' || field === 'phone'}
              />
            </label>
          ))}
          <button className="btn btn-primary" disabled={saveCustomer.isPending}>{t('save')}</button>
        </form>
      </Modal>
    </div>
  );
}
