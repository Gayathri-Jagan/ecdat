import { useMemo } from 'react';
import { Dna, Sparkles, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { useFinance } from '@/lib/finance';
import { useAuth } from '@/lib/auth';
import { CATEGORY_COLORS } from '@/lib/types';
import { calculateSpendingProfile, formatCurrency, isSameMonth } from '@/lib/utils';
import { Card, PageHeader } from '@/components/ui';
import { HoneycombPattern } from '@/components/BeeLogo';

export default function SpendingDNA() {
  const { expenses, loading } = useFinance();
  const { profile } = useAuth();
  const currency = profile?.currency ?? 'INR';
  const monthDate = new Date();

  const profileData = useMemo(() => calculateSpendingProfile(expenses), [expenses]);

  const radarData = useMemo(() => {
    const monthExp = expenses.filter((e) => isSameMonth(e.date, monthDate));
    const byCat = new Map<string, number>();
    monthExp.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const max = Math.max(...Array.from(byCat.values()), 1);
    return ['Food', 'Travel', 'Shopping', 'Entertainment', 'Education', 'Health', 'Bills', 'Groceries'].map((cat) => ({
      category: cat,
      amount: ((byCat.get(cat) ?? 0) / max) * 100,
    }));
  }, [expenses]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" /></div>;
  }

  return (
    <div>
      <PageHeader title="Spending DNA" subtitle="Your unique financial personality profile" />

      {/* Profile Card */}
      <Card className="mb-4 overflow-hidden">
        <div className="relative p-6" style={{ background: `linear-gradient(135deg, ${profileData.color}15, ${profileData.color}05)` }}>
          <HoneycombPattern className="pointer-events-none absolute inset-0" opacity={0.05} />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl shadow-sm" style={{ backgroundColor: `${profileData.color}20` }}>
              {profileData.emoji}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-base">🐝</span>
                <Dna size={16} style={{ color: profileData.color }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: profileData.color }}>Your Profile</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.name}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{profileData.description}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Radar chart */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Spending Pattern</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
              <Radar name="Spending" dataKey="amount" stroke={profileData.color} fill={profileData.color} fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Characteristics */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles size={15} className="text-primary-500" /> Key Characteristics
          </h3>
          <div className="space-y-2">
            {profileData.characteristics.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: profileData.color }} />
                <span className="text-sm text-slate-700 dark:text-slate-200">{c}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Strengths */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <CheckCircle2 size={15} className="text-primary-500" /> Strengths
          </h3>
          <div className="space-y-2">
            {profileData.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary-500" />
                <span className="text-sm text-slate-700 dark:text-slate-200">{s}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Improvements */}
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <AlertCircle size={15} className="text-amber-500" /> Improvement Areas
          </h3>
          <div className="space-y-2">
            {profileData.improvements.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <TrendingUp size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <span className="text-sm text-slate-700 dark:text-slate-200">{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
