import { useState, useEffect } from 'react';
import { Target, Plus, X, Pencil, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Budget } from '@/lib/types';
import { formatCurrency, isSameMonth } from '@/lib/utils';
import { Card, PageHeader, EmptyState } from '@/components/ui';

export default function BudgetPage() {
  const { budgets, expenses, saveBudget, deleteBudget, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const monthDate = new Date();
  const [adding, setAdding] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [newCat, setNewCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const spentByCat = new Map<string, number>();
  expenses.filter((e) => isSameMonth(e.date, monthDate)).forEach((e) => {
    spentByCat.set(e.category, (spentByCat.get(e.category) ?? 0) + e.amount);
  });

  const totalBudget = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCat.get(b.category) ?? 0), 0);

  function startAdd() {
    const available = EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c));
    if (available.length > 0) setNewCat(available[0]);
    setNewLimit('');
    setEditingCat(null);
    setAdding(true);
  }

  function startEdit(b: Budget) {
    setEditingCat(b.category);
    setNewCat(b.category);
    setNewLimit(String(b.monthly_limit));
    setAdding(true);
  }

  async function handleSave() {
    const limit = parseFloat(newLimit);
    if (isNaN(limit) || limit < 0) return;
    setSaving(true);
    try {
      await saveBudget(editingCat ?? newCat, limit);
      setAdding(false);
      setEditingCat(null);
      setNewLimit('');
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Budget Planner"
        subtitle={`${formatCurrency(totalSpent, currency)} spent of ${formatCurrency(totalBudget, currency)} budget`}
        action={!adding && <button onClick={startAdd} className="btn-primary"><Plus size={16} /> Set Budget</button>}
      />

      {/* Overall progress */}
      {budgets.length > 0 && (
        <Card className="mb-4 p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Overall Budget Usage</span>
            <span className={`text-sm font-bold ${totalSpent > totalBudget ? 'text-rose-500' : 'text-primary-600'}`}>
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%`, backgroundColor: totalSpent > totalBudget ? '#ef4444' : '#10b981' }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1 text-slate-500"><ShieldCheck size={13} className="text-primary-500" /> Safe</span>
            <span className="flex items-center gap-1 text-slate-500"><AlertTriangle size={13} className="text-amber-500" /> Warning</span>
            <span className="flex items-center gap-1 text-slate-500"><AlertTriangle size={13} className="text-rose-500" /> Exceeded</span>
          </div>
        </Card>
      )}

      {/* Add/Edit form */}
      {adding && (
        <Card className="mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{editingCat ? `Edit ${editingCat}` : 'New Budget'}</span>
            <button onClick={() => { setAdding(false); setEditingCat(null); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!editingCat && (
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="input sm:w-40">
                {EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c)).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder="Monthly limit" min="0" autoFocus className="input flex-1" />
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : 'Save'}</button>
          </div>
        </Card>
      )}

      {/* Budget cards */}
      {budgets.length === 0 && !adding ? (
        <Card className="p-5"><EmptyState message="No budgets set" sub="Set monthly limits per category to track your spending" /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {budgets.map((b) => {
            const spent = spentByCat.get(b.category) ?? 0;
            const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
            const status = pct > 100 ? 'exceeded' : pct > 80 ? 'warning' : 'safe';
            const statusColor = status === 'exceeded' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';
            const StatusIcon = status === 'exceeded' ? AlertTriangle : status === 'warning' ? AlertTriangle : CheckCircle2;
            return (
              <Card key={b.id} hover className="group p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{CATEGORY_ICONS[b.category] ?? '📦'}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{b.category}</p>
                      <p className="text-xs text-slate-400">Monthly budget</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase`} style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>
                      <StatusIcon size={11} /> {status}
                    </span>
                    <button onClick={() => startEdit(b)} className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-primary-600 group-hover:opacity-100 dark:hover:bg-slate-700"><Pencil size={13} /></button>
                    <button onClick={() => deleteBudget(b.id)} className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-500/10"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: statusColor }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(spent, currency)} spent</span>
                  <span className="text-slate-400">of {formatCurrency(b.monthly_limit, currency)}</span>
                </div>
                {status === 'exceeded' && (
                  <p className="mt-1 text-xs font-semibold text-rose-500">{formatCurrency(spent - b.monthly_limit, currency)} over limit</p>
                )}
                {status === 'safe' && (
                  <p className="mt-1 text-xs font-medium text-slate-400">{formatCurrency(b.monthly_limit - spent, currency)} remaining</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
