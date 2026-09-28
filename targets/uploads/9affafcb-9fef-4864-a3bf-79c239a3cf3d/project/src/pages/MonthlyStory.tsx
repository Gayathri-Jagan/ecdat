import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, TrendingUp, TrendingDown, Calendar, Receipt, Target, Award, Flame } from 'lucide-react';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/types';
import {
  formatCurrency, isSameMonth, getMonthName, calculateFinancialScore,
  calculateSpendingProfile, getLongestNoSpendStreak,
} from '@/lib/utils';
import { Card, PageHeader } from '@/components/ui';

export default function MonthlyStory() {
  const { expenses, income, budgets, goals, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const [monthDate, setMonthDate] = useState(new Date());

  const story = useMemo(() => {
    const monthExp = expenses.filter((e) => isSameMonth(e.date, monthDate));
    const monthInc = income.filter((i) => isSameMonth(i.date, monthDate));
    const totalInc = monthInc.reduce((s, i) => s + i.amount, 0);
    const totalExp = monthExp.reduce((s, e) => s + e.amount, 0);
    const savings = totalInc - totalExp;

    const byCat = new Map<string, number>();
    monthExp.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const sortedCats = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
    const highestCat = sortedCats[0] ?? ['—', 0];
    const lowestCat = sortedCats[sortedCats.length - 1] ?? ['—', 0];

    const largest = monthExp.reduce((max, e) => (e.amount > max.amount ? e : max), monthExp[0] ?? null);

    const streak = getLongestNoSpendStreak(expenses, monthDate);
    const budget = profile?.monthly_budget ?? 0;
    const budgetPerf = budget > 0 ? totalExp / budget : 0;
    const goalsProgress = goals.reduce((s, g) => s + (g.current_amount / g.target_amount) * 100, 0);
    const score = calculateFinancialScore(totalInc, totalExp, budget, goalsProgress);
    const dna = calculateSpendingProfile(expenses);

    return {
      totalInc, totalExp, savings, highestCat, lowestCat, largest,
      streak, budgetPerf, score, dna, txnCount: monthExp.length,
    };
  }, [expenses, income, goals, profile, monthDate]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  function changeMonth(delta: number) {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const items = [
    { icon: TrendingUp, label: 'Total Income', value: formatCurrency(story.totalInc, currency), color: 'text-primary-600' },
    { icon: TrendingDown, label: 'Total Expenses', value: formatCurrency(story.totalExp, currency), color: 'text-rose-500' },
    { icon: Award, label: 'Savings', value: formatCurrency(story.savings, currency), color: story.savings >= 0 ? 'text-primary-600' : 'text-rose-500' },
    { icon: Receipt, label: 'Transactions', value: String(story.txnCount), color: 'text-secondary-600' },
    { icon: Target, label: 'Highest Category', value: story.highestCat[0], sub: formatCurrency(story.highestCat[1], currency), color: 'text-amber-500' },
    { icon: Target, label: 'Lowest Category', value: story.lowestCat[0], sub: formatCurrency(story.lowestCat[1], currency), color: 'text-secondary-600' },
    { icon: Flame, label: 'No-Spend Streak', value: `${story.streak} days`, color: 'text-orange-500' },
    { icon: Award, label: 'Financial Score', value: `${story.score}/100`, color: story.score >= 70 ? 'text-primary-600' : story.score >= 40 ? 'text-amber-500' : 'text-rose-500' },
  ];

  return (
    <div>
      <PageHeader title="Monthly Story" subtitle="A visual summary of your month" />

      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronLeft size={16} /></button>
        <span className="min-w-[140px] text-center text-sm font-semibold text-slate-700 dark:text-slate-200">{getMonthName(monthDate)}</span>
        <button onClick={() => changeMonth(1)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronRight size={16} /></button>
      </div>

      {/* Story Card */}
      <Card className="overflow-hidden">
        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-amber-400 via-primary-500 to-secondary-600 p-6">
          <div className="absolute right-4 top-4 opacity-20">
            <span className="text-5xl">🐝</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Your Monthly Story</p>
          <h2 className="mt-1 text-2xl font-bold text-white">{getMonthName(monthDate)}</h2>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              {story.dna.emoji} {story.dna.name}
            </span>
            {story.budgetPerf > 0 && story.budgetPerf <= 1 && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                Within Budget ✓
              </span>
            )}
            {story.budgetPerf > 1 && (
              <span className="rounded-full bg-rose-500/30 px-3 py-1 text-xs font-semibold text-white">
                Over Budget
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 sm:grid-cols-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white p-4 dark:bg-slate-900">
                <Icon size={16} className={item.color} />
                <p className="mt-2 text-xs font-medium text-slate-400">{item.label}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
                {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
              </div>
            );
          })}
        </div>

        {/* Largest expense */}
        {story.largest && (
          <div className="border-t border-slate-100 p-5 dark:border-slate-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Largest Expense</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${CATEGORY_COLORS[story.largest.category] ?? '#6b7280'}15` }}>
                {CATEGORY_ICONS[story.largest.category] ?? '📦'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{story.largest.description || story.largest.category}</p>
                <p className="text-xs text-slate-400">{story.largest.category} · {new Date(story.largest.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
              </div>
              <span className="text-lg font-bold text-rose-500">{formatCurrency(story.largest.amount, currency)}</span>
            </div>
          </div>
        )}

        {/* Budget performance */}
        <div className="border-t border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Performance</p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {story.budgetPerf === 0 ? 'No budget set' : story.budgetPerf <= 1 ? `Used ${Math.round(story.budgetPerf * 100)}% of budget` : `Exceeded budget by ${Math.round((story.budgetPerf - 1) * 100)}%`}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold ${
              story.budgetPerf === 0 ? 'bg-slate-100 text-slate-400' :
              story.budgetPerf <= 1 ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/10' :
              'bg-rose-100 text-rose-500 dark:bg-rose-500/10'
            }`}>
              {story.budgetPerf === 0 ? '—' : story.budgetPerf <= 1 ? '✓' : '!'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
