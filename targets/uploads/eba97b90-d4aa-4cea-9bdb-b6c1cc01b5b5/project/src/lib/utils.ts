import type { Expense, Income } from '@/lib/types';

export function formatCurrency(amount: number, currency = 'INR'): string {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] ?? '₹';
  return `${symbol}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDayOfMonth(dateStr: string): number {
  return new Date(dateStr).getDate();
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.ceil(d.getDate() / 7);
}

export function calculateFinancialScore(
  totalIncome: number,
  totalExpenses: number,
  budget: number,
  savingsGoalsProgress: number,
): number {
  if (totalIncome === 0) return 0;
  const savingsRate = (totalIncome - totalExpenses) / totalIncome;
  let score = 50;
  score += Math.max(0, savingsRate) * 100;
  score -= Math.max(0, -savingsRate) * 100;
  if (budget > 0) {
    const budgetUsage = totalExpenses / budget;
    if (budgetUsage <= 1) score += 15;
    else score -= (budgetUsage - 1) * 30;
  }
  score += savingsGoalsProgress * 0.1;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateSpendingProfile(expenses: Expense[]): import('@/lib/types').SpendingProfile {
  if (expenses.length === 0) {
    return {
      name: 'New Explorer',
      emoji: '🌱',
      description: "You're just getting started on your financial journey.",
      characteristics: ['New to tracking', 'Building habits'],
      strengths: ['Taking the first step'],
      improvements: ['Add more transactions for insights'],
      color: '#10b981',
    };
  }

  const byCat = new Map<string, number>();
  let total = 0;
  expenses.forEach((e) => {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
    total += e.amount;
  });

  const sorted = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
  const topCat = sorted[0]?.[0] ?? '';
  const topCatPct = total > 0 ? (sorted[0]?.[1] ?? 0) / total : 0;
  const numCats = byCat.size;
  const avgPerTxn = total / expenses.length;

  // High frequency small transactions = impulse shopper
  const foodPct = (byCat.get('Food') ?? 0) / total;
  const shoppingPct = (byCat.get('Shopping') ?? 0) / total;
  const entertainmentPct = (byCat.get('Entertainment') ?? 0) / total;
  const investmentPct = (byCat.get('Investment') ?? 0) / total;

  if (investmentPct > 0.15 || (numCats >= 6 && topCatPct < 0.25)) {
    return {
      name: 'Wise Saver',
      emoji: '🦉',
      description: 'You spread spending thoughtfully and prioritize saving and investing.',
      characteristics: ['Diversified spending', 'Investment-minded', 'Disciplined'],
      strengths: ['Great savings habit', 'Long-term thinking', 'Balanced approach'],
      improvements: ['Allow occasional treats', 'Track small expenses too'],
      color: '#10b981',
    };
  }

  if (topCatPct < 0.3 && numCats >= 5) {
    return {
      name: 'Balanced Spender',
      emoji: '⚖️',
      description: 'Your spending is well-distributed across categories with no single category dominating.',
      characteristics: ['Even distribution', 'Moderate spending', 'Versatile lifestyle'],
      strengths: ['No over-reliance on one category', 'Flexible budgeting', 'Good variety'],
      improvements: ['Set category-specific budgets', 'Track weekly trends'],
      color: '#6366f1',
    };
  }

  if (foodPct > 0.35) {
    return {
      name: 'Food Explorer',
      emoji: '🍜',
      description: 'A significant portion of your spending goes to food and dining experiences.',
      characteristics: ['Food-focused spending', 'Social diner', 'Experience-driven'],
      strengths: ['Enjoy life experiences', 'Social connections'],
      improvements: ['Cook more meals at home', 'Set a food budget', 'Use meal planning'],
      color: '#f97316',
    };
  }

  if (shoppingPct > 0.3 || entertainmentPct > 0.2) {
    return {
      name: 'Impulse Shopper',
      emoji: '🛒',
      description: 'Shopping and entertainment make up a large share of your spending.',
      characteristics: ['Spontaneous purchases', 'Entertainment-loving', 'Trend-focused'],
      strengths: ['Enjoy life fully', 'Quick decision-maker'],
      improvements: ['Implement 24-hour purchase rule', 'Set entertainment budget', 'Track impulse buys'],
      color: '#ec4899',
    };
  }

  return {
    name: 'Balanced Spender',
    emoji: '⚖️',
    description: 'Your spending shows a reasonable balance across categories.',
    characteristics: ['Moderate spending', 'Some category focus'],
    strengths: ['Reasonable control', 'Aware of spending'],
    improvements: ['Set clear budgets', 'Build savings goals'],
    color: '#6366f1',
  };
}

export function getLongestNoSpendStreak(expenses: Expense[], ref: Date): number {
  const monthExpenses = expenses
    .filter((e) => isSameMonth(e.date, ref))
    .map((e) => new Date(e.date).getDate())
    .sort((a, b) => a - b);
  if (monthExpenses.length === 0) return 0;

  const daysInMonth = getDaysInMonth(ref);
  let maxStreak = 0;
  let current = 0;
  let lastDay = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    if (monthExpenses.includes(day)) {
      current = 0;
    } else {
      current++;
      maxStreak = Math.max(maxStreak, current);
    }
    lastDay = day;
  }
  return maxStreak;
}
