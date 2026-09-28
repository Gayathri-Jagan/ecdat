import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import {
  INCOME_SOURCES, CATEGORY_COLORS, CATEGORY_ICONS,
  type Income, type IncomeInput,
} from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, PageHeader, EmptyState, Modal } from '@/components/ui';

export default function IncomePage() {
  const { income, addIncome, updateIncome, deleteIncome, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const [search, setSearch] = useState('');
  const [filterSrc, setFilterSrc] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // form state
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<string>(INCOME_SOURCES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount));
      setSource(editing.source);
      setDescription(editing.description ?? '');
      setDate(editing.date);
    } else {
      setAmount('');
      setSource(INCOME_SOURCES[0]);
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
    }
    setError(null);
  }, [editing, showAdd]);

  const filtered = useMemo(() => {
    return income
      .filter((i) => filterSrc === 'All' || i.source === filterSrc)
      .filter(
        (i) =>
          !search ||
          i.description?.toLowerCase().includes(search.toLowerCase()) ||
          i.source.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [income, search, filterSrc]);

  const total = filtered.reduce((s, i) => s + i.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { setError('Enter a valid amount'); return; }
    setSaving(true);
    setError(null);
    try {
      const input: IncomeInput = { amount: numAmount, source, description: description.trim() || null, date };
      if (editing) await updateIncome(editing.id, input);
      else await addIncome(input);
      setShowAdd(false);
    } catch { setError('Failed to save income'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try { await deleteIncome(id); } finally { setDeleting(null); }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle={`${filtered.length} sources · ${formatCurrency(total, currency)} total`}
        action={<button onClick={() => { setEditing(null); setShowAdd(true); }} className="btn-primary"><Plus size={16} /> Add Income</button>}
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search income..." className="input pl-9" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['All', ...INCOME_SOURCES].map((s) => (
            <button key={s} onClick={() => setFilterSrc(s)} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${filterSrc === s ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-2 sm:p-4">
        {filtered.length === 0 ? (
          <EmptyState message="No income found" sub="Add your first income source to get started" />
        ) : (
          <div className="space-y-1">
            {filtered.map((i) => (
              <div key={i.id} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${CATEGORY_COLORS[i.source] ?? '#10b981'}15` }}>
                  {CATEGORY_ICONS[i.source] ?? '💰'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{i.description || i.source}</p>
                  <p className="text-xs text-slate-400">{i.source} · {formatDate(i.date)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary-600">+{formatCurrency(i.amount, currency)}</span>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => { setEditing(i); setShowAdd(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-700">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(i.id)} disabled={deleting === i.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Edit Income' : 'Add Income'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" min="0" placeholder="0" autoFocus className="input" />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Source</label>
            <div className="flex flex-wrap gap-1.5">
              {INCOME_SOURCES.map((s) => (
                <button key={s} type="button" onClick={() => setSource(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${source === s ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" className="input" />
          </div>
          {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : editing ? 'Update Income' : 'Save Income'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
