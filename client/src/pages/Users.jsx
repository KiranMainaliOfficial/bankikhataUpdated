import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';

const emptyUser = { name: '', email: '', password: '', role: 'staff', phone: '' };

export default function Users() {
  const { t } = usePreference();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyUser);
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data
  });
  const create = useMutation({
    mutationFn: async () => (await api.post('/users', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm(emptyUser);
    }
  });

  if (isLoading) return <Skeleton rows={5} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('users')}</h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          {t('users')}
        </button>
      </div>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.users.map((user) => (
          <article key={user._id} className="panel p-4">
            <p className="font-bold">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold dark:bg-slate-800">{t(user.role)}</span>
              <span className={user.isActive ? 'text-sm text-brand-600' : 'text-sm text-rose-600'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </article>
        ))}
      </section>

      <Modal title={t('users')} open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          {['name', 'email', 'password', 'phone'].map((field) => (
            <input
              key={field}
              className="input"
              type={field === 'password' ? 'password' : 'text'}
              placeholder={field}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required={field !== 'phone'}
            />
          ))}
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">{t('staff')}</option>
            <option value="admin">{t('admin')}</option>
          </select>
          <button className="btn btn-primary" disabled={create.isPending}>{t('save')}</button>
        </form>
      </Modal>
    </div>
  );
}
