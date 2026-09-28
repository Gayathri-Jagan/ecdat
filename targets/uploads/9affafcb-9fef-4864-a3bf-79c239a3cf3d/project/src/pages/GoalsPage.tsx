import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import { type Goal, type GoalInput } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, PageHeader, EmptyState, Modal, ProgressBar } from '@/components/ui';
import { BeeIcon } from '@/components/BeeLogo';

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // form
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // contribute
  const [contributing, setContributing] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setTarget(String(editing.target_amount));
      setCurrent(String(editing.current_amount));
      setTargetDate(editing.target_date ?? '');
    } else {
      setName(''); setTarget(''); setCurrent(''); setTargetDate('');
    }
    setError(null);
  }, [editing, showAdd]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = parseFloat(target);
    const c = parseFloat(current) || 0;
    if (!name.trim() || isNaN(t) || t <= 0) { setError('Enter a valid name and target'); return; }
    setSaving(true);
    try {
      const input: GoalInput = { name: name.trim(), target_amount: t, current_amount: c, target_date: targetDate || null };
      if (editing) await updateGoal(editing.id, input);
      else await addGoal(input);
      setShowAdd(false);
    } catch { setError('Failed to save goal'); }
    finally { setSaving(false); }
  }

  async function handleContribute(goalId: string) {
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    await updateGoal(goalId, { current_amount: goal.current_amount + amt });
    setContributing(null);
    setContribAmount('');
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Savings Goals"
                subtitle={`${goals.length} goals · ${formatCurrency(goals.reduce((s, g) => s + g.current_amount, 0), currency)} saved 🐝`}
        action={<button onClick={() => { setEditing(null); setShowAdd(true); }} className="btn-primary"><Plus size={16} /> Add Goal</button>}
      />

      {goals.length === 0 ? (
        <Card className="p-5"><EmptyState message="No savings goals yet" sub="Create a goal to start tracking your savings progress" /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((g, idx) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const remaining = g.target_amount - g.current_amount;
            const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
            const monthsLeft = g.target_date ? Math.max(0, Math.round((new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : null;
            const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;
            return (
              <Card key={g.id} hover className="group p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/10">
                      <BeeIcon size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</p>
                      {g.target_date && <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10} /> {formatDate(g.target_date)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => { setEditing(g); setShowAdd(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-700"><Pencil size={13} /></button>
                    <button onClick={() => { setDeleting(g.id); deleteGoal(g.id).finally(() => setDeleting(null)); }} disabled={deleting === g.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(g.current_amount, currency)}</span>
                  <span className="text-xs text-slate-400">of {formatCurrency(g.target_amount, currency)}</span>
                </div>
                <ProgressBar value={g.current_amount} max={g.target_amount} color={color} />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color }}>{pct.toFixed(0)}% complete</span>
                  <span className="text-xs text-slate-400">{formatCurrency(remaining, currency)} left</span>
                </div>

                {monthlyNeeded && monthlyNeeded > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                    <TrendingUp size={13} className="text-primary-500" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Save {formatCurrency(monthlyNeeded, currency)}/mo to finish in {monthsLeft} months</span>
                  </div>
                )}

                {contributing === g.id ? (
                  <div className="mt-3 flex gap-2">
                    <input type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} placeholder="Amount" min="0" autoFocus className="input flex-1" />
                    <button onClick={() => handleContribute(g.id)} className="btn-primary">Add</button>
                    <button onClick={() => setContributing(null)} className="btn-ghost"><X size={16} /></button>
                  </div>
                ) : (
                  pct < 100 && (
                    <button onClick={() => setContributing(g.id)} className="mt-3 w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-400">
                      + Add Contribution
                    </button>
                  )
                )}
                {pct >= 100 && (
                  <div className="mt-3 rounded-xl bg-primary-50 py-2 text-center text-xs font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    Goal Achieved! 🎉🐝
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Edit Goal' : 'New Savings Goal'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Goal Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund" autoFocus className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target Amount</label>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} step="0.01" min="0" placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Current Savings</label>
              <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} step="0.01" min="0" placeholder="0" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Target Date (optional)</label>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input" />
          </div>
          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Goal' : 'Create Goal'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
