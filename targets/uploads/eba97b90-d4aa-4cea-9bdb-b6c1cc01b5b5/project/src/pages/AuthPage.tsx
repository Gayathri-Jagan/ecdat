import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { BeeLogo, HoneycombPattern } from '@/components/BeeLogo';

export default function AuthPage() {
  const { signIn, signUp, signInAsGuest, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) { setError(error); return; }
        navigate('/app');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, name);
        if (error) { setError(error); return; }
        navigate('/app');
      } else {
        const { error } = await resetPassword(email);
        if (error) { setError(error); return; }
        setSuccess('Password reset link sent to your email.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-primary-50/30 to-secondary-50/30 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <HoneycombPattern className="absolute inset-0" opacity={0.06} />
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 shadow-lg shadow-amber-500/20">
            <BeeLogo size={40} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">BudgetBee</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Buzz your way to better budgeting</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
              </h2>
              <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'login' ? 'Sign in to manage your finances' : mode === 'signup' ? 'Start tracking your expenses today' : 'Enter your email to receive a reset link'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Alex Morgan"
                        className="input pl-10"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="input pl-10"
                    />
                  </div>
                </div>
                {mode !== 'forgot' && (
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="input px-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
                {success && <p className="text-xs font-medium text-primary-600">{success}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {mode !== 'forgot' && (
                <button
                  onClick={() => setMode('forgot')}
                  className="mt-3 w-full text-center text-xs font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400"
                >
                  Forgot password?
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Mode switch */}
          <div className="mt-5 border-t border-slate-200 pt-4 text-center dark:border-slate-800">
            {mode === 'login' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="font-semibold text-primary-600 hover:underline">
                  Sign up
                </button>
              </p>
            )}
            {(mode === 'signup' || mode === 'forgot') && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="font-semibold text-primary-600 hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Guest mode */}
          <div className="mt-4">
            <button
              onClick={() => { signInAsGuest(); navigate('/app'); }}
              className="btn-secondary w-full"
            >
              <Sparkles size={15} />
              Continue as Guest
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
