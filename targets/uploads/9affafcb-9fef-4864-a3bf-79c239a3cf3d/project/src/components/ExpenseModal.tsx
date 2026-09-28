import { useState, useEffect } from 'react';
import { useFinance } from '@/lib/finance';
import {
  EXPENSE_CATEGORIES, PAYMENT_METHODS,
  type Expense, type ExpenseInput,
} from '@/lib/types';
import { Modal } from '@/components/ui';

interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Expense | null;
}

export default function ExpenseModal({ open, onClose, editing }: ExpenseModalProps) {
  const { addExpense, updateExpense } = useFinance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDescription(editing.description ?? '');
      setDate(editing.date);
      setPaymentMethod(editing.payment_method ?? PAYMENT_METHODS[0]);
      setNotes(editing.notes ?? '');
    } else {
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod(PAYMENT_METHODS[0]);
      setNotes('');
    }
    setError(null);
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: ExpenseInput = {
        amount: numAmount,
        category,
        description: description.trim() || null,
        date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
      };
      if (editing) {
        await updateExpense(editing.id, input);
      } else {
        await addExpense(input);
      }
      onClose();
    } catch {
      setError('Failed to save expense');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Expense' : 'Add Expense'}>
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
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === cat ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" className="input" />
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input">
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra notes" className="input" />
        </div>
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : editing ? 'Update Expense' : 'Save Expense'}
        </button>
      </form>
    </Modal>
  );
}
