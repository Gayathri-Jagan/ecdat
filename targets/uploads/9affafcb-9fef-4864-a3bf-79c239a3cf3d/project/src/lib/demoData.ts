import type { Expense, Income, Budget, Goal } from '@/lib/types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DEMO_EXPENSES: Expense[] = [
  { id: 'd1', user_id: 'demo', amount: 320, category: 'Food', description: 'Lunch at campus canteen', date: daysAgo(0), payment_method: 'UPI', notes: null, created_at: daysAgo(0) },
  { id: 'd2', user_id: 'demo', amount: 1200, category: 'Shopping', description: 'New sneakers', date: daysAgo(1), payment_method: 'Credit Card', notes: 'Black Friday sale', created_at: daysAgo(1) },
  { id: 'd3', user_id: 'demo', amount: 80, category: 'Travel', description: 'Metro card recharge', date: daysAgo(2), payment_method: 'UPI', notes: null, created_at: daysAgo(2) },
  { id: 'd4', user_id: 'demo', amount: 450, category: 'Groceries', description: 'Weekly groceries', date: daysAgo(3), payment_method: 'Debit Card', notes: null, created_at: daysAgo(3) },
  { id: 'd5', user_id: 'demo', amount: 250, category: 'Entertainment', description: 'Movie night', date: daysAgo(4), payment_method: 'UPI', notes: 'With friends', created_at: daysAgo(4) },
  { id: 'd6', user_id: 'demo', amount: 1500, category: 'Education', description: 'Online course subscription', date: daysAgo(5), payment_method: 'Credit Card', notes: null, created_at: daysAgo(5) },
  { id: 'd7', user_id: 'demo', amount: 200, category: 'Food', description: 'Dinner with friends', date: daysAgo(6), payment_method: 'Cash', notes: null, created_at: daysAgo(6) },
  { id: 'd8', user_id: 'demo', amount: 600, category: 'Bills', description: 'Phone bill', date: daysAgo(7), payment_method: 'UPI', notes: null, created_at: daysAgo(7) },
  { id: 'd9', user_id: 'demo', amount: 350, category: 'Health', description: 'Pharmacy', date: daysAgo(8), payment_method: 'Cash', notes: 'Vitamins', created_at: daysAgo(8) },
  { id: 'd10', user_id: 'demo', amount: 180, category: 'Food', description: 'Breakfast', date: daysAgo(9), payment_method: 'UPI', notes: null, created_at: daysAgo(9) },
  { id: 'd11', user_id: 'demo', amount: 5000, category: 'Investment', description: 'Mutual fund SIP', date: daysAgo(10), payment_method: 'Bank Transfer', notes: 'Monthly investment', created_at: daysAgo(10) },
  { id: 'd12', user_id: 'demo', amount: 290, category: 'Shopping', description: 'Books', date: daysAgo(12), payment_method: 'Debit Card', notes: null, created_at: daysAgo(12) },
  { id: 'd13', user_id: 'demo', amount: 120, category: 'Travel', description: 'Auto fare', date: daysAgo(14), payment_method: 'Cash', notes: null, created_at: daysAgo(14) },
  { id: 'd14', user_id: 'demo', amount: 400, category: 'Food', description: 'Weekend brunch', date: daysAgo(15), payment_method: 'Credit Card', notes: null, created_at: daysAgo(15) },
  { id: 'd15', user_id: 'demo', amount: 750, category: 'Bills', description: 'Electricity bill', date: daysAgo(18), payment_method: 'UPI', notes: null, created_at: daysAgo(18) },
  { id: 'd16', user_id: 'demo', amount: 220, category: 'Entertainment', description: 'Concert tickets', date: daysAgo(20), payment_method: 'Credit Card', notes: null, created_at: daysAgo(20) },
  { id: 'd17', user_id: 'demo', amount: 380, category: 'Groceries', description: 'Monthly groceries', date: daysAgo(22), payment_method: 'Debit Card', notes: null, created_at: daysAgo(22) },
  { id: 'd18', user_id: 'demo', amount: 950, category: 'Health', description: 'Dental checkup', date: daysAgo(25), payment_method: 'Cash', notes: null, created_at: daysAgo(25) },
  { id: 'd19', user_id: 'demo', amount: 160, category: 'Food', description: 'Coffee and snacks', date: daysAgo(27), payment_method: 'UPI', notes: null, created_at: daysAgo(27) },
  { id: 'd20', user_id: 'demo', amount: 3200, category: 'Shopping', description: 'Winter jacket', date: daysAgo(28), payment_method: 'Credit Card', notes: 'End of season sale', created_at: daysAgo(28) },
];

export const DEMO_INCOME: Income[] = [
  { id: 'i1', user_id: 'demo', amount: 35000, source: 'Salary', description: 'Monthly salary', date: daysAgo(1), created_at: daysAgo(1) },
  { id: 'i2', user_id: 'demo', amount: 8000, source: 'Freelance', description: 'Web design project', date: daysAgo(10), created_at: daysAgo(10) },
  { id: 'i3', user_id: 'demo', amount: 5000, source: 'Scholarship', description: 'Academic scholarship', date: daysAgo(15), created_at: daysAgo(15) },
  { id: 'i4', user_id: 'demo', amount: 2000, source: 'Pocket Money', description: 'Monthly allowance', date: daysAgo(20), created_at: daysAgo(20) },
];

export const DEMO_BUDGETS: Budget[] = [
  { id: 'b1', user_id: 'demo', category: 'Food', monthly_limit: 3000, created_at: daysAgo(30) },
  { id: 'b2', user_id: 'demo', category: 'Shopping', monthly_limit: 5000, created_at: daysAgo(30) },
  { id: 'b3', user_id: 'demo', category: 'Travel', monthly_limit: 1500, created_at: daysAgo(30) },
  { id: 'b4', user_id: 'demo', category: 'Entertainment', monthly_limit: 2000, created_at: daysAgo(30) },
  { id: 'b5', user_id: 'demo', category: 'Bills', monthly_limit: 3000, created_at: daysAgo(30) },
  { id: 'b6', user_id: 'demo', category: 'Groceries', monthly_limit: 2500, created_at: daysAgo(30) },
];

export const DEMO_GOALS: Goal[] = [
  { id: 'g1', user_id: 'demo', name: 'Emergency Fund', target_amount: 50000, current_amount: 18000, target_date: daysFromNow(180), created_at: daysAgo(60) },
  { id: 'g2', user_id: 'demo', name: 'New Laptop', target_amount: 80000, current_amount: 35000, target_date: daysFromNow(120), created_at: daysAgo(90) },
  { id: 'g3', user_id: 'demo', name: 'Trip to Goa', target_amount: 25000, current_amount: 12000, target_date: daysFromNow(90), created_at: daysAgo(45) },
  { id: 'g4', user_id: 'demo', name: 'Investment Portfolio', target_amount: 100000, current_amount: 45000, target_date: daysFromNow(365), created_at: daysAgo(120) },
];
