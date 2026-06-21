import {
  BarChart3,
  FileDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  Settings,
  Sun,
  Users,
  WalletCards,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePreference } from '../contexts/PreferenceContext.jsx';

const navItems = [
  { to: '/', label: 'dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'customers', icon: Users },
  { to: '/transactions', label: 'transactions', icon: ReceiptText },
  { to: '/reports', label: 'reports', icon: BarChart3 },
  { to: '/import-export', label: 'importExport', icon: FileDown },
  { to: '/users', label: 'users', icon: WalletCards },
  { to: '/settings', label: 'settings', icon: Settings }
];

function NavContent({ onNavigate }) {
  const { t } = usePreference();
  return (
    <nav className="grid gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`
          }
        >
          <Icon size={19} />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t, language, setLanguage, theme, setTheme } = usePreference();

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-[#101418]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:block">
        <Link to="/" className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-600 font-bold text-white">BK</div>
          <div>
            <p className="font-bold">{t('appName')}</p>
            <p className="text-xs text-slate-500">Credit OS</p>
          </div>
        </Link>
        <NavContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[82vw] max-w-xs bg-white p-4 shadow-xl dark:bg-slate-950">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-lg font-bold">{t('appName')}</span>
              <button className="btn btn-muted h-10 min-h-10 w-10 p-0" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <NavContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center justify-between gap-2">
            <button className="btn btn-muted h-10 min-h-10 w-10 p-0 lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold sm:text-base">{t('appName')}</p>
              <p className="truncate text-xs text-slate-500">{user?.name} · {user?.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="btn btn-muted h-10 min-h-10 px-3"
                onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
              >
                {language === 'en' ? 'ने' : 'EN'}
              </button>
              <button
                className="btn btn-muted h-10 min-h-10 w-10 p-0"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label={t('theme')}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button className="btn btn-muted h-10 min-h-10 w-10 p-0" onClick={logout} aria-label={t('logout')}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-3 pb-24 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
