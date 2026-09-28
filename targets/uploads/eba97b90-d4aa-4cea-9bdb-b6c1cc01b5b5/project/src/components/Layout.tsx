import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Receipt, TrendingUp, BarChart3, Target,
  PiggyBank, Dna, BookOpen, User, Menu, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { BeeLogo, HoneycombPattern } from '@/components/BeeLogo';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/expenses', label: 'Expenses', icon: Receipt },
  { to: '/app/income', label: 'Income', icon: TrendingUp },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/budget', label: 'Budget', icon: Target },
  { to: '/app/goals', label: 'Goals', icon: PiggyBank },
  { to: '/app/dna', label: 'Spending DNA', icon: Dna },
  { to: '/app/story', label: 'Monthly Story', icon: BookOpen },
  { to: '/app/profile', label: 'Profile', icon: User },
];

const MOBILE_NAV = NAV_ITEMS.slice(0, 5);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isGuest, signOut } = useAuth();
  const location = useLocation();

  const displayName = profile?.full_name || (isGuest ? 'Guest' : 'there');
  const currency = profile?.currency ?? 'INR';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="relative sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <HoneycombPattern className="pointer-events-none absolute inset-0" opacity={0.03} />
        <div className="relative flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 shadow-sm">
            <BeeLogo size={26} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">BudgetBee</p>
            <p className="text-[10px] font-medium text-slate-400">Smart Expense Tracker</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{firstName}</p>
              <p className="truncate text-[10px] text-slate-400">{isGuest ? 'Guest Mode' : 'Signed in'}</p>
            </div>
          </div>
          <button onClick={signOut} className="nav-item w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                    <BeeLogo size={26} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">BudgetBee</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-2" onClick={() => setSidebarOpen(false)}>
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <button onClick={signOut} className="nav-item w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <BeeLogo size={20} />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">BudgetBee</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-6xl"
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/90 px-2 py-1.5 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
