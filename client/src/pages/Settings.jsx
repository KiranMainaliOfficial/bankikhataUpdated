import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import Skeleton from '../components/Skeleton.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';
import { api } from '../lib/api.js';

export default function Settings() {
  const { t } = usePreference();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data
  });
  const save = useMutation({
    mutationFn: async () => (await api.put('/settings', form)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] })
  });

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  if (isLoading || !form) return <Skeleton rows={5} />;

  return (
    <section className="panel p-4">
      <h1 className="mb-4 text-xl font-bold">{t('settings')}</h1>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        <label className="text-sm font-semibold">
          {t('businessName')}
          <input className="input mt-1" value={form.businessName || ''} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          {t('currency')}
          <input className="input mt-1" value={form.currency || 'NPR'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          {t('language')}
          <select className="input mt-1" value={form.language || 'en'} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="en">English</option>
            <option value="ne">नेपाली</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t('theme')}
          <select className="input mt-1" value={form.theme || 'system'} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
            <option value="system">System</option>
            <option value="light">{t('light')}</option>
            <option value="dark">{t('dark')}</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Reminder days
          <input className="input mt-1" type="number" value={form.reminderDays || 30} onChange={(e) => setForm({ ...form, reminderDays: Number(e.target.value) })} />
        </label>
        <label className="text-sm font-semibold">
          High outstanding limit
          <input className="input mt-1" type="number" value={form.highOutstandingLimit || 10000} onChange={(e) => setForm({ ...form, highOutstandingLimit: Number(e.target.value) })} />
        </label>
        <label className="flex items-center gap-3 rounded-md bg-slate-50 p-3 text-sm font-semibold dark:bg-slate-800 md:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(form.googleSheets?.enabled)}
            onChange={(e) =>
              setForm({ ...form, googleSheets: { ...form.googleSheets, enabled: e.target.checked } })
            }
          />
          Google Sheets sync enabled
        </label>
        <button className="btn btn-primary md:col-span-2" disabled={save.isPending}>
          <Save size={18} />
          {t('save')}
        </button>
      </form>
    </section>
  );
}
