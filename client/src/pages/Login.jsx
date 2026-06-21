import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t, language, setLanguage, theme, setTheme } = usePreference();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@bankikhata.local', password: 'ChangeMe123!' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4 dark:bg-[#101418]">
      <div className="w-full max-w-md">
        <div className="mb-5 flex justify-end gap-2">
          <button className="btn btn-muted" onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}>
            {language === 'en' ? 'नेपाली' : 'English'}
          </button>
          <button className="btn btn-muted" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? t('dark') : t('light')}
          </button>
        </div>
        <form className="panel p-5" onSubmit={submit}>
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-brand-600 text-white">
              <LockKeyhole />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('appName')}</h1>
              <p className="text-sm text-slate-500">Secure admin access</p>
            </div>
          </div>
          {error && <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          <label className="mb-3 block text-sm font-semibold">
            {t('email')}
            <input
              className="input mt-1"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label className="mb-5 block text-sm font-semibold">
            {t('password')}
            <input
              className="input mt-1"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? '...' : t('login')}
          </button>
        </form>
      </div>
    </main>
  );
}
