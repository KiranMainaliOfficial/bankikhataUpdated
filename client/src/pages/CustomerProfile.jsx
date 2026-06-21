import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, MessageSquareText, Phone, Plus, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import StatCard from '../components/StatCard.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';
import { formatDate, money } from '../lib/format.js';

const emptyTx = { type: 'credit', amount: '', productOrReason: '', paymentMethod: 'cash', notes: '' };

export default function CustomerProfile() {
  const { id } = useParams();
  const { t } = usePreference();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyTx);

  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/customers/${id}`)).data
  });

  const addTx = useMutation({
    mutationFn: async () => (await api.post('/transactions', { ...form, customer: id })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setForm(emptyTx);
      setOpen(false);
    }
  });

  if (isLoading) return <Skeleton rows={6} />;
  const { customer, transactions } = data;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">{customer.customerId}</p>
            <h1 className="text-2xl font-bold">{customer.fullName}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{customer.address || '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-muted" href={`tel:${customer.phone}`}>
              <Phone size={18} />
              {t('call')}
            </a>
            <a className="btn btn-muted" href={`sms:${customer.phone}?body=Namaste, your remaining balance is ${money(customer.totals.balance)}.`}>
              <MessageSquareText size={18} />
              {t('reminder')}
            </a>
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} />
              {t('addCredit')}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={ReceiptText} label={t('totalCredit')} value={money(customer.totals.credit)} tone="amber" />
        <StatCard icon={Banknote} label={t('totalPaid')} value={money(customer.totals.paid)} tone="sky" />
        <StatCard icon={Banknote} label={t('balance')} value={money(customer.totals.balance)} />
      </section>

      <section className="panel p-4">
        <h2 className="mb-4 font-bold">Ledger</h2>
        <div className="mobile-scroll">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Running Balance</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-3">{formatDate(tx.date)}</td>
                  <td className={tx.type === 'credit' ? 'font-semibold text-amber-600' : 'font-semibold text-brand-600'}>
                    {tx.type}
                  </td>
                  <td>{tx.productOrReason || tx.paymentMethod || '-'}</td>
                  <td>{money(tx.amount)}</td>
                  <td className="font-bold">{money(tx.runningBalance)}</td>
                  <td>{tx.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title={t('addCredit')} open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); addTx.mutate(); }}>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="credit">{t('addCredit')}</option>
            <option value="payment">{t('receivePayment')}</option>
          </select>
          <input
            className="input"
            type="number"
            min="1"
            placeholder={t('amount')}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          {form.type === 'payment' ? (
            <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          ) : (
            <input
              className="input"
              placeholder="Product / Reason"
              value={form.productOrReason}
              onChange={(e) => setForm({ ...form, productOrReason: e.target.value })}
            />
          )}
          <textarea className="input min-h-24" placeholder={t('notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn btn-primary" disabled={addTx.isPending}>{t('save')}</button>
        </form>
      </Modal>
    </div>
  );
}
