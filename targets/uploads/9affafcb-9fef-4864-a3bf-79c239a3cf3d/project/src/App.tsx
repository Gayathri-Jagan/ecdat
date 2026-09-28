import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FinanceProvider } from '@/lib/finance';
import Layout from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import Expenses from '@/pages/Expenses';
import IncomePage from '@/pages/IncomePage';
import Analytics from '@/pages/Analytics';
import BudgetPage from '@/pages/BudgetPage';
import GoalsPage from '@/pages/GoalsPage';
import SpendingDNA from '@/pages/SpendingDNA';
import MonthlyStory from '@/pages/MonthlyStory';
import ProfilePage from '@/pages/ProfilePage';

function ProtectedRoutes() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return (
    <FinanceProvider>
      <Layout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="income" element={<IncomePage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="dna" element={<SpendingDNA />} />
          <Route path="story" element={<MonthlyStory />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Layout>
    </FinanceProvider>
  );
}

function AuthRoute() {
  const { user, isGuest, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-500" />
      </div>
    );
  }
  if (user || isGuest) return <Navigate to="/app" replace />;
  return <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRoute />} />
          <Route path="/app/*" element={<ProtectedRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
