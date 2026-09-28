import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  DEMO_EXPENSES, DEMO_INCOME, DEMO_BUDGETS, DEMO_GOALS,
} from '@/lib/demoData';
import type { Expense, Income, Budget, Goal, ExpenseInput, IncomeInput, BudgetInput, GoalInput } from '@/lib/types';

interface FinanceContextValue {
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
  goals: Goal[];
  loading: boolean;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (input: IncomeInput) => Promise<void>;
  updateIncome: (id: string, input: IncomeInput) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  saveBudget: (category: string, monthlyLimit: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (input: GoalInput) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setExpenses(DEMO_EXPENSES);
      setIncome(DEMO_INCOME);
      setBudgets(DEMO_BUDGETS);
      setGoals(DEMO_GOALS);
      setLoading(false);
      return;
    }
    if (!user) {
      setExpenses([]);
      setIncome([]);
      setBudgets([]);
      setGoals([]);
      setLoading(false);
      return;
    }
    loadData();
  }, [user, isGuest]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expRes, incRes, budRes, goalRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('income').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id).order('category'),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at'),
      ]);
      setExpenses((expRes.data ?? []) as Expense[]);
      setIncome((incRes.data ?? []) as Income[]);
      setBudgets((budRes.data ?? []) as Budget[]);
      setGoals((goalRes.data ?? []) as Goal[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addExpense = useCallback(async (input: ExpenseInput) => {
    if (isGuest) {
      setExpenses((p) => [{ ...input, id: crypto.randomUUID(), user_id: 'demo', created_at: new Date().toISOString(), notes: input.notes ?? null, description: input.description ?? null, payment_method: input.payment_method ?? null }, ...p]);
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('expenses').insert({ ...input, user_id: user.id }).select().single();
    if (error) throw error;
    setExpenses((p) => [data as Expense, ...p]);
  }, [user, isGuest]);

  const updateExpense = useCallback(async (id: string, input: ExpenseInput) => {
    if (isGuest) {
      setExpenses((p) => p.map((e) => (e.id === id ? { ...e, ...input } : e)));
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('expenses').update(input).eq('id', id).select().single();
    if (error) throw error;
    setExpenses((p) => p.map((e) => (e.id === id ? (data as Expense) : e)));
  }, [user, isGuest]);

  const deleteExpense = useCallback(async (id: string) => {
    if (isGuest) {
      setExpenses((p) => p.filter((e) => e.id !== id));
      return;
    }
    if (!user) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
    setExpenses((p) => p.filter((e) => e.id !== id));
  }, [user, isGuest]);

  const addIncome = useCallback(async (input: IncomeInput) => {
    if (isGuest) {
      setIncome((p) => [{ ...input, id: crypto.randomUUID(), user_id: 'demo', created_at: new Date().toISOString(), description: input.description ?? null }, ...p]);
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('income').insert({ ...input, user_id: user.id }).select().single();
    if (error) throw error;
    setIncome((p) => [data as Income, ...p]);
  }, [user, isGuest]);

  const updateIncome = useCallback(async (id: string, input: IncomeInput) => {
    if (isGuest) {
      setIncome((p) => p.map((i) => (i.id === id ? { ...i, ...input } : i)));
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('income').update(input).eq('id', id).select().single();
    if (error) throw error;
    setIncome((p) => p.map((i) => (i.id === id ? (data as Income) : i)));
  }, [user, isGuest]);

  const deleteIncome = useCallback(async (id: string) => {
    if (isGuest) {
      setIncome((p) => p.filter((i) => i.id !== id));
      return;
    }
    if (!user) return;
    const { error } = await supabase.from('income').delete().eq('id', id);
    if (error) throw error;
    setIncome((p) => p.filter((i) => i.id !== id));
  }, [user, isGuest]);

  const saveBudget = useCallback(async (category: string, monthlyLimit: number) => {
    if (isGuest) {
      setBudgets((p) => {
        const existing = p.find((b) => b.category === category);
        if (existing) return p.map((b) => (b.category === category ? { ...b, monthly_limit: monthlyLimit } : b));
        return [...p, { id: crypto.randomUUID(), user_id: 'demo', category, monthly_limit: monthlyLimit, created_at: new Date().toISOString() }];
      });
      return;
    }
    if (!user) return;
    const existing = budgets.find((b) => b.category === category);
    if (existing) {
      const { data, error } = await supabase.from('budgets').update({ monthly_limit: monthlyLimit }).eq('id', existing.id).select().single();
      if (error) throw error;
      setBudgets((p) => p.map((b) => (b.id === existing.id ? (data as Budget) : b)));
    } else {
      const { data, error } = await supabase.from('budgets').insert({ category, monthly_limit: monthlyLimit, user_id: user.id }).select().single();
      if (error) throw error;
      setBudgets((p) => [...p, data as Budget].sort((a, b) => a.category.localeCompare(b.category)));
    }
  }, [user, isGuest, budgets]);

  const deleteBudget = useCallback(async (id: string) => {
    if (isGuest) {
      setBudgets((p) => p.filter((b) => b.id !== id));
      return;
    }
    if (!user) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
    setBudgets((p) => p.filter((b) => b.id !== id));
  }, [user, isGuest]);

  const addGoal = useCallback(async (input: GoalInput) => {
    if (isGuest) {
      setGoals((p) => [...p, { ...input, id: crypto.randomUUID(), user_id: 'demo', current_amount: input.current_amount ?? 0, target_date: input.target_date ?? null, created_at: new Date().toISOString() }]);
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('goals').insert({ ...input, user_id: user.id }).select().single();
    if (error) throw error;
    setGoals((p) => [...p, data as Goal]);
  }, [user, isGuest]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    if (isGuest) {
      setGoals((p) => p.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      return;
    }
    if (!user) return;
    const { data, error } = await supabase.from('goals').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setGoals((p) => p.map((g) => (g.id === id ? (data as Goal) : g)));
  }, [user, isGuest]);

  const deleteGoal = useCallback(async (id: string) => {
    if (isGuest) {
      setGoals((p) => p.filter((g) => g.id !== id));
      return;
    }
    if (!user) return;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    setGoals((p) => p.filter((g) => g.id !== id));
  }, [user, isGuest]);

  return (
    <FinanceContext.Provider
      value={{
        expenses, income, budgets, goals, loading,
        addExpense, updateExpense, deleteExpense,
        addIncome, updateIncome, deleteIncome,
        saveBudget, deleteBudget,
        addGoal, updateGoal, deleteGoal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
