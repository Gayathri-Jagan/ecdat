/*
# Smart Expense Tracker — initial schema

## Purpose
Stores expense records and monthly category budgets for a single-tenant
(no sign-in) expense tracking app. Data is intentionally shared/public so
the anon-key frontend can read and write directly.

## New Tables

### expenses
- `id` (uuid, primary key)
- `amount` (numeric, not null) — amount spent in INR
- `category` (text, not null) — one of a fixed set of categories
- `description` (text, nullable) — optional note about the expense
- `date` (date, not null) — the date the expense occurred
- `created_at` (timestamptz, default now())

### budgets
- `id` (uuid, primary key)
- `category` (text, not null) — the category this budget applies to
- `monthly_limit` (numeric, not null) — max amount per month for this category
- `created_at` (timestamptz, default now())
- Unique constraint on (category) so each category has one budget

## Security
- RLS enabled on both tables.
- Anon + authenticated CRUD allowed because the app has no sign-in and the
  data is intentionally shared (single-tenant).

## Notes
1. Amounts stored as numeric(12,2) for currency precision.
2. Index on expenses(date) and expenses(category) for fast filtering.
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  category text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  monthly_limit numeric(12,2) NOT NULL CHECK (monthly_limit >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- expenses policies (anon + authenticated, single-tenant shared data)
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE
  TO anon, authenticated USING (true);

-- budgets policies (anon + authenticated, single-tenant shared data)
DROP POLICY IF EXISTS "anon_select_budgets" ON budgets;
CREATE POLICY "anon_select_budgets" ON budgets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budgets" ON budgets;
CREATE POLICY "anon_insert_budgets" ON budgets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budgets" ON budgets;
CREATE POLICY "anon_update_budgets" ON budgets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budgets" ON budgets;
CREATE POLICY "anon_delete_budgets" ON budgets FOR DELETE
  TO anon, authenticated USING (true);
