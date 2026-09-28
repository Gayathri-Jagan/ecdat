import { useState } from 'react';
import { login } from '../api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
      <div className="w-full max-w-md p-8 bg-[#111A2B] rounded-lg border border-[#22304A]">
        <h1 className="text-2xl font-bold text-[#E6EBF5] mb-2">ECDAT</h1>
        <p className="text-sm text-[#8A93A6] mb-8">
          Enterprise Cryptographic Discovery and Analysis Tool
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#E6EBF5] mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-[#0B1220] border border-[#22304A] text-[#E6EBF5] focus:border-[#2BB6A3] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#E6EBF5] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-[#0B1220] border border-[#22304A] text-[#E6EBF5] focus:border-[#2BB6A3] focus:outline-none"
            />
          </div>
          {error && (
            <div className="text-sm text-[#F0504A] bg-[#F0504A]/10 border border-[#F0504A]/30 rounded p-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-[#2BB6A3] text-[#0B1220] font-semibold hover:bg-[#24A090] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-xs text-[#8A93A6] text-center">
          NIST SP 800-131A Rev.2 · IR 8547 · FIPS 203/204/205
        </p>
      </div>
    </div>
  );
}