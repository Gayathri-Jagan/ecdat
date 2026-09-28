import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LineChart, Line, RadialBarChart, RadialBar,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import { CATEGORY_COLORS } from '@/lib/types';
import { formatCurrency, isSameMonth, getMonthName, getDaysInMonth, getDayOfMonth } from '@/lib/utils';
import { Card, PageHeader, EmptyState } from '@/components/ui';

export default function Analytics() {
  const { expenses, income, budgets, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const [monthDate, setMonthDate] = useState(new Date());

  const data = useMemo(() => {
    const monthExp = expenses.filter((e) => isSameMonth(e.date, monthDate));
    const monthInc = income.filter((i) => isSameMonth(i.date, monthDate));

    // Monthly trend (last 6 months)
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - i, 1);
      const exp = expenses.filter((e) => isSameMonth(e.date, d)).reduce((s, e) => s + e.amount, 0);
      const inc = income.filter((i2) => isSameMonth(i2.date, d)).reduce((s, i2) => s + i2.amount, 0);
      trend.push({ month: d.toLocaleDateString('en', { month: 'short' }), expense: exp, income: inc, savings: inc - exp });
    }

    // Category distribution
    const byCat = new Map<string, number>();
    monthExp.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const catData = Array.from(byCat.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Weekly spending
    const weekly = [0, 0, 0, 0, 0];
    monthExp.forEach((e) => {
      const week = Math.min(Math.floor((getDayOfMonth(e.date) - 1) / 7), 4);
      weekly[week] += e.amount;
    });
    const weeklyData = weekly.map((v, i) => ({ week: `Week ${i + 1}`, amount: v }));

    // Savings growth (cumulative)
    let cumulative = 0;
    const savingsGrowth = trend.map((t) => {
      cumulative += t.savings;
      return { month: t.month, savings: cumulative };
    });

    // Budget usage
    const budgetData = budgets.map((b) => {
      const spent = monthExp.filter((e) => e.category === b.category).reduce((s, e) => s + e.amount, 0);
      return { name: b.category, spent, limit: b.monthly_limit, pct: b.monthly_limit > 0 ? Math.min((spent / b.monthly_limit) * 100, 100) : 0 };
    });

    return { trend, catData, weeklyData, savingsGrowth, budgetData, monthExp, monthInc };
  }, [expenses, income, budgets, monthDate]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  function changeMonth(delta: number) {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Deep dive into your financial patterns" />

      {/* Month selector */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronLeft size={16} /></button>
        <span className="min-w-[140px] text-center text-sm font-semibold text-slate-700 dark:text-slate-200">{getMonthName(monthDate)}</span>
        <button onClick={() => changeMonth(1)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronRight size={16} /></button>
      </div>

      {data.monthExp.length === 0 && data.monthInc.length === 0 ? (
        <Card className="p-5"><EmptyState message="No data for this month" sub="Try selecting a different month" /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Monthly Expense Trend */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Monthly Expense Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend} margin={{ left: -15, right: 5, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="aExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v), currency)} />
                <Area type="monotone" dataKey="expense" stroke="#10b981" strokeWidth={2} fill="url(#aExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Income vs Expense */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.trend} margin={{ left: -15, right: 5, top: 5, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v), currency)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Distribution */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Category Distribution</h3>
            {data.catData.length > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {data.catData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v), currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {data.catData.slice(0, 6).map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.name] ?? '#6b7280' }} />
                      <span className="flex-1 text-slate-600 dark:text-slate-300">{c.name}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(c.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <EmptyState message="No expense data" />}
          </Card>

          {/* Weekly Spending */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Weekly Spending</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weeklyData} margin={{ left: -15, right: 5, top: 5, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v), currency)} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Savings Growth */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Savings Growth</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.savingsGrowth} margin={{ left: -15, right: 5, top: 5, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v), currency)} />
                <Line type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Budget Usage */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Budget Usage</h3>
            {data.budgetData.length > 0 ? (
              <div className="space-y-3">
                {data.budgetData.map((b) => (
                  <div key={b.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{b.name}</span>
                      <span className={b.pct > 100 ? 'font-bold text-rose-500' : 'text-slate-500'}>
                        {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.pct}%`, backgroundColor: b.pct > 100 ? '#ef4444' : b.pct > 80 ? '#f59e0b' : '#10b981' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No budgets set" sub="Set budgets in the Budget page" />}
          </Card>
        </div>
      )}
    </div>
  );
}
