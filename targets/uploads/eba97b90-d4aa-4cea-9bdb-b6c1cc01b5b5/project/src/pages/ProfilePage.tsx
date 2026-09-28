import { useState } from 'react';
import { User, Moon, Bell, LogOut, Wallet, Mail, Target, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { CURRENCIES } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, PageHeader } from '@/components/ui';

export default function ProfilePage() {
  const { user, profile, isGuest, signOut, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [budget, setBudget] = useState(String(profile?.monthly_budget ?? 0));
  const [currency, setCurrency] = useState(profile?.currency ?? 'INR');
  const [darkMode, setDarkMode] = useState(profile?.dark_mode ?? false);
  const [notifications, setNotifications] = useState(profile?.notifications ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Apply dark mode class
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', darkMode);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      if (!isGuest) {
        await updateProfile({
          full_name: name,
          monthly_budget: parseFloat(budget) || 0,
          currency,
          dark_mode: darkMode,
          notifications,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.full_name || (isGuest ? 'Guest User' : 'New User');
  const email = user?.email ?? 'guest@budgetbee.app';

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account and preferences" />

      {/* Profile card */}
      <Card className="mb-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-2xl font-bold text-white shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-sm text-slate-400">{email}</p>
            {isGuest && (
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                Guest Mode
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Personal info */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <User size={15} className="text-slate-400" /> Personal Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input" disabled={isGuest} />
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} disabled className="input pl-9 opacity-60" />
              </div>
            </div>
          </div>
        </Card>

        {/* Financial settings */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <DollarSign size={15} className="text-slate-400" /> Financial Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Monthly Budget</label>
              <div className="relative">
                <Target size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min="0" placeholder="0" className="input pl-9" disabled={isGuest} />
              </div>
              <p className="mt-1 text-xs text-slate-400">Current: {formatCurrency(parseFloat(budget) || 0, currency)}</p>
            </div>
            <div>
              <label className="label">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input" disabled={isGuest}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Bell size={15} className="text-slate-400" /> Preferences
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Moon size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dark Mode</p>
                  <p className="text-xs text-slate-400">Switch to dark theme</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</p>
                  <p className="text-xs text-slate-400">Budget alerts and reminders</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative h-6 w-11 rounded-full transition-colors ${notifications ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Wallet size={15} className="text-slate-400" /> Account
            </h3>
            {isGuest && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  You're in guest mode. Changes won't be saved. Sign up to persist your data.
                </p>
              </div>
            )}
            <button onClick={handleSave} disabled={saving || isGuest} className="btn-primary w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <p className="mt-2 text-center text-xs font-medium text-primary-600">Changes saved!</p>}
          </div>
          <button onClick={signOut} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50 dark:border-rose-500/20 dark:hover:bg-rose-500/10">
            <LogOut size={16} /> Sign Out
          </button>
        </Card>
      </div>
    </div>
  );
}
