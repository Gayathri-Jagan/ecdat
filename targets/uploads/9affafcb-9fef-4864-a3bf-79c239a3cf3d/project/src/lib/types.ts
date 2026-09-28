export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  monthly_budget: number;
  currency: string;
  dark_mode: boolean;
  notifications: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  created_at: string;
}

export interface ExpenseInput {
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  payment_method?: string | null;
  notes?: string | null;
}

export interface IncomeInput {
  amount: number;
  source: string;
  description?: string | null;
  date: string;
}

export interface BudgetInput {
  category: string;
  monthly_limit: number;
}

export interface GoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Shopping', 'Entertainment',
  'Education', 'Health', 'Bills', 'Groceries',
  'Investment', 'Others',
] as const;

export const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Scholarship',
  'Pocket Money', 'Business', 'Others',
] as const;

export const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Wallet',
] as const;

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Travel: '#3b82f6',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Education: '#14b8a6',
  Health: '#10b981',
  Bills: '#ef4444',
  Groceries: '#84cc16',
  Investment: '#6366f1',
  Others: '#6b7280',
  Salary: '#10b981',
  Freelance: '#6366f1',
  Scholarship: '#14b8a6',
  'Pocket Money': '#f59e0b',
  Business: '#8b5cf6',
};

export const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔',
  Travel: '✈️',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Education: '📚',
  Health: '💊',
  Bills: '🧾',
  Groceries: '🥬',
  Investment: '📈',
  Others: '📦',
  Salary: '💼',
  Freelance: '💻',
  Scholarship: '🎓',
  'Pocket Money': '💰',
  Business: '🏪',
};

export type SpendingProfile = {
  name: string;
  emoji: string;
  description: string;
  characteristics: string[];
  strengths: string[];
  improvements: string[];
  color: string;
};
