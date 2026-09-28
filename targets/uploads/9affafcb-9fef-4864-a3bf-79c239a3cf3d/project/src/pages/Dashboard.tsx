import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, ArrowRight,
  Target, Activity, Gauge,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import {
  formatCurrency, isSameMonth, getMonthName, calculateFinancialScore,
  calculateSpendingProfile,
} from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/types';
import { Card, StatCard, ProgressBar, EmptyState } from '@/components/ui';
import ExpenseModal from '@/components/ExpenseModal';

export default function Dashboard() {
  const { expenses, income, budgets, goals, loading } = useFinance();
  const { profile, isGuest } = useAuth();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const monthDate = new Date();

  const displayName = profile?.full_name || (isGuest ? 'Guest' : 'there');
  const firstName = displayName.split(' ')[0];
  const currency = profile?.currency ?? 'INR';

  const stats = useMemo(() => {
    const monthExp = expenses.filter((e) => isSameMonth(e.date, monthDate));
    const monthInc = income.filter((i) => isSameMonth(i.date, monthDate));
    const totalExp = monthExp.reduce((s, e) => s + e.amount, 0);
    const totalInc = monthInc.reduce((s, i) => s + i.amount, 0);
    const balance = totalInc - totalExp;
    const savings = balance;

    const byCat = new Map<string, number>();
    monthExp.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const topCats = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const goalsProgress = goals.reduce((s, g) => s + (g.current_amount / g.target_amount) * 100, 0);
    const score = calculateFinancialScore(totalInc, totalExp, profile?.monthly_budget ?? 0, goalsProgress);

    // 7-day trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayExp = expenses.filter((e) => e.date === dayStr).reduce((s, e) => s + e.amount, 0);
      const dayInc = income.filter((i2) => i2.date === dayStr).reduce((s, i2) => s + i2.amount, 0);
      trend.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), expense: dayExp, income: dayInc });
    }

    return { totalExp, totalInc, balance, savings, topCats, score, trend, monthExp };
  }, [expenses, income, goals, profile]);

  const budget = profile?.monthly_budget ?? 0;
  const budgetUsed = budget > 0 ? (stats.totalExp / budget) * 100 : 0;
  const profile_result = useMemo(() => calculateSpendingProfile(expenses), [expenses]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hi, {firstName} 🐝
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{getMonthName(monthDate)}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Balance" value={formatCurrency(stats.balance, currency)} icon={Wallet} color="primary" delay={0} />
        <StatCard label="Income" value={formatCurrency(stats.totalInc, currency)} icon={TrendingUp} color="secondary" delay={0.05} />
        <StatCard label="Expenses" value={formatCurrency(stats.totalExp, currency)} icon={TrendingDown} color="rose" delay={0.1} />
        <StatCard label="Savings" value={formatCurrency(stats.savings, currency)} icon={PiggyBank} color="amber" delay={0.15} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Spending trend */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Spending Trend</h3>
            <Activity size={16} className="text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.trend} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => formatCurrency(Number(v), currency)}
              />
              <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2} fill="url(#incGrad)" />
              <Area type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Financial Score */}
        <Card className="flex flex-col items-center justify-center p-5">
          <div className="mb-2 flex items-center gap-2 self-start">
            <Gauge size={16} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial Score</h3>
          </div>
          <div className="relative my-4 flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" className="dark:stroke-slate-800" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={stats.score >= 70 ? '#10b981' : stats.score >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(stats.score / 100) * 314} 314`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.score}</span>
              <span className="text-[10px] font-medium text-slate-400">out of 100</span>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {stats.score >= 70 ? 'Excellent financial health!' : stats.score >= 40 ? 'Room for improvement' : 'Needs attention'}
          </p>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Budget progress */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Budget</h3>
            <Target size={16} className="text-slate-400" />
          </div>
          {budget > 0 ? (
            <>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalExp, currency)}</span>
                <span className="text-sm text-slate-400">of {formatCurrency(budget, currency)}</span>
              </div>
              <ProgressBar
                value={stats.totalExp}
                max={budget}
                color={budgetUsed > 100 ? '#ef4444' : budgetUsed > 80 ? '#f59e0b' : '#10b981'}
              />
              <p className="mt-2 text-xs font-medium text-slate-500">
                {budgetUsed > 100
                  ? `Over budget by ${formatCurrency(stats.totalExp - budget, currency)}`
                  : `${formatCurrency(budget - stats.totalExp, currency)} remaining`}
              </p>
            </>
          ) : (
            <EmptyState message="No budget set" sub="Set a monthly budget in Profile" />
          )}
        </Card>

        {/* Top categories */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Categories</h3>
            <button onClick={() => navigate('/app/analytics')} className="text-xs font-semibold text-primary-600 hover:underline">
              View all
            </button>
          </div>
          {stats.topCats.length > 0 ? (
            <div className="space-y-2.5">
              {stats.topCats.map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg">{CATEGORY_ICONS[cat] ?? '📦'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{cat}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(amt, currency)}</span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar value={amt} max={stats.totalExp} color={CATEGORY_COLORS[cat] ?? '#6b7280'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No expenses this month" />
          )}
        </Card>

        {/* Spending DNA preview */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spending DNA</h3>
            <button onClick={() => navigate('/app/dna')} className="text-xs font-semibold text-primary-600 hover:underline">
              Details
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-4xl">{profile_result.emoji}</span>
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{profile_result.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{profile_result.description}</p>
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
          <button onClick={() => navigate('/app/expenses')} className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
            View all <ArrowRight size={12} />
          </button>
        </div>
        {stats.monthExp.length > 0 ? (
          <div className="space-y-1.5">
            {stats.monthExp.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: `${CATEGORY_COLORS[e.category] ?? '#6b7280'}15` }}
                >
                  {CATEGORY_ICONS[e.category] ?? '📦'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.description || e.category}</p>
                  <p className="text-xs text-slate-400">{e.category} · {new Date(e.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="text-sm font-bold text-rose-500">-{formatCurrency(e.amount, currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No transactions yet" />
        )}
      </Card>

      <ExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
