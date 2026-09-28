import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import {
  EXPENSE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS,
  type Expense,
} from '@/lib/types';
import { formatCurrency, formatDate, isSameMonth } from '@/lib/utils';
import { Card, PageHeader, EmptyState } from '@/components/ui';
import ExpenseModal from '@/components/ExpenseModal';

export default function Expenses() {
  const { expenses, deleteExpense, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const months = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => set.add(e.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => filterCat === 'All' || e.category === filterCat)
      .filter((e) => monthFilter === 'all' || e.date.slice(0, 7) === monthFilter)
      .filter(
        (e) =>
          !search ||
          e.description?.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()) ||
          e.notes?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, search, filterCat, monthFilter]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  async function handleDelete(id: string) {
    setDeleting(id);
    try { await deleteExpense(id); } finally { setDeleting(null); }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} transactions · ${formatCurrency(total, currency)} total`}
        action={<button onClick={() => { setEditing(null); setShowAdd(true); }} className="btn-primary"><Plus size={16} /> Add Expense</button>}
      />

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..." className="input pl-9" />
          </div>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Months</option>
            {months.map((m) => {
              const [y, mo] = m.split('-');
              const d = new Date(parseInt(y), parseInt(mo) - 1);
              return <option key={m} value={m}>{d.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['All', ...EXPENSE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                filterCat === cat ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* List */}
      <Card className="p-2 sm:p-4">
        {filtered.length === 0 ? (
          <EmptyState message="No expenses found" sub="Try adjusting your filters or add a new expense" />
        ) : (
          <div className="space-y-1">
            {filtered.map((e) => (
              <div key={e.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${CATEGORY_COLORS[e.category] ?? '#6b7280'}15` }}>
                  {CATEGORY_ICONS[e.category] ?? '📦'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.description || e.category}</p>
                  <p className="text-xs text-slate-400">
                    {e.category} · {formatDate(e.date)}{e.payment_method ? ` · ${e.payment_method}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(e.amount, currency)}</span>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => { setEditing(e); setShowAdd(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ExpenseModal open={showAdd} onClose={() => setShowAdd(false)} editing={editing} />
    </div>
  );
}
