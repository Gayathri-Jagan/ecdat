import { useEffect, useState } from 'react';
import { getCurrentUser, getAuditLog, logout } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [executionMode, setExecutionMode] = useState(
    localStorage.getItem('ecdat_execution_mode') || 'local'
  );
  const [auditEntries, setAuditEntries] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const entries = await getAuditLog();
        setAuditEntries(entries.slice(0, 15));
      } catch { /* ignore */ }
      setLoadingAudit(false);
    })();
  }, []);

  const handleModeChange = (mode) => {
    setExecutionMode(mode);
    localStorage.setItem('ecdat_execution_mode', mode);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const actionColor = (action) => {
    if (action.includes('failed')) return 'text-[#F0504A]';
    if (action.includes('success')) return 'text-[#2BB6A3]';
    if (action.includes('export') || action.includes('scan')) return 'text-[#F59E0B]';
    return 'text-[#8A93A6]';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold mb-1">Settings</h2>
        <p className="text-sm text-[#8A93A6]">Account, execution mode, and audit log</p>
      </div>

      {/* Account */}
      <Section title="Account">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-[#8A93A6]">Username</div>
          <div className="text-[#E6EBF5] font-mono">{user?.username || '—'}</div>
          <div className="text-[#8A93A6]">Role</div>
          <div className="text-[#2BB6A3] font-semibold">{user?.role || '—'}</div>
          <div className="text-[#8A93A6]">Password hashing</div>
          <div className="text-[#E6EBF5] font-mono text-xs">Argon2id (OWASP 2024)</div>
          <div className="text-[#8A93A6]">Session</div>
          <div className="text-[#E6EBF5] font-mono text-xs">JWT HS256, 8h TTL</div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 text-sm rounded border border-[#F0504A]/40 text-[#F0504A] hover:bg-[#F0504A]/10"
        >
          Sign out
        </button>
      </Section>

      {/* Execution mode */}
      <Section title="Execution Mode">
        <p className="text-xs text-[#8A93A6] mb-3">
          Choose where scans run. Local mode keeps all data on this machine. Cloud mode is
          for future remote-deployment support.
        </p>
        <div className="flex gap-2">
          {['local', 'cloud'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`flex-1 px-4 py-3 rounded border text-sm font-semibold transition-colors ${
                executionMode === mode
                  ? 'bg-[#2BB6A3]/15 border-[#2BB6A3] text-[#2BB6A3]'
                  : 'bg-transparent border-[#22304A] text-[#8A93A6] hover:text-[#E6EBF5]'
              }`}
            >
              {mode === 'local' ? 'Local / Offline' : 'Cloud'}
              <div className="text-xs font-normal mt-1 opacity-75">
                {mode === 'local' ? 'Data stays on this machine' : 'Remote processing'}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-[#4A5568] mt-2">
          Current: <span className="text-[#E6EBF5]">{executionMode}</span>
        </p>
      </Section>

      {/* Audit log */}
      <Section title="Audit Log">
        <p className="text-xs text-[#8A93A6] mb-3">
          Every register, login, scan, and export is recorded. Showing latest 15 entries.
        </p>
        {loadingAudit ? (
          <div className="text-sm text-[#8A93A6]">Loading…</div>
        ) : auditEntries.length === 0 ? (
          <div className="text-sm text-[#8A93A6]">No audit entries yet.</div>
        ) : (
          <div className="bg-[#0B1220] border border-[#22304A] rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#16223A] text-[#8A93A6] uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Time</th>
                  <th className="text-left px-3 py-2">User</th>
                  <th className="text-left px-3 py-2">Action</th>
                  <th className="text-left px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((e, i) => (
                  <tr key={i} className="border-t border-[#22304A]">
                    <td className="px-3 py-2 text-[#8A93A6] font-mono">
                      {e.timestamp?.slice(11, 19) || '—'}
                    </td>
                    <td className="px-3 py-2 text-[#E6EBF5]">{e.user}</td>
                    <td className={`px-3 py-2 font-semibold ${actionColor(e.action || '')}`}>
                      {e.action}
                    </td>
                    <td className="px-3 py-2 text-[#8A93A6]">{e.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="text-xs text-[#4A5568] pt-4 border-t border-[#22304A] leading-relaxed">
        ECDAT v0.1 · NIST SP 800-131A Rev.2 · IR 8547 · FIPS 203/204/205
        <br />
        Quantum risk model: Mosca's Algorithm — (T_shelf + T_migration) &gt; T_threat
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-[#111A2B] border border-[#22304A] rounded-lg p-5">
      <h3 className="text-base font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}