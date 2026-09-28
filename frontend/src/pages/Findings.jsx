import { useEffect, useState } from 'react';
import { getLatestScan } from '../api';

const TIERS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const SOURCES = ['All', 'source', 'certificate', 'library'];

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setFindings(await getLatestScan());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const tierColor = (tier) => {
    if (tier === 'Critical') return 'bg-[#F0504A]/20 text-[#F0504A] border-[#F0504A]/40';
    if (tier === 'High')     return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
    if (tier === 'Medium')   return 'bg-[#EAB308]/20 text-[#EAB308] border-[#EAB308]/40';
    return 'bg-[#2BB6A3]/20 text-[#2BB6A3] border-[#2BB6A3]/40';
  };

  const sourceColor = (source) => {
    if (source === 'source')      return 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40';
    if (source === 'certificate') return 'bg-[#06B6D4]/20 text-[#06B6D4] border-[#06B6D4]/40';
    if (source === 'library')     return 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
    return 'bg-[#22304A] text-[#8A93A6] border-[#22304A]';
  };

  const filtered = findings.filter((f) => {
    if (filter !== 'All' && f.tier !== filter) return false;
    if (sourceFilter !== 'All' && f.source_type !== sourceFilter) return false;
    if (search && !(
      f.algorithm.toLowerCase().includes(search.toLowerCase()) ||
      f.file.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  if (loading) return <div className="text-[#8A93A6]">Loading findings…</div>;

  const sourceCounts = {
    source: findings.filter(f => f.source_type === 'source').length,
    certificate: findings.filter(f => f.source_type === 'certificate').length,
    library: findings.filter(f => f.source_type === 'library').length
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">All Findings</h2>
          <p className="text-sm text-[#8A93A6]">
            {findings.length} total · {filtered.length} shown
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30">
            Source: {sourceCounts.source}
          </span>
          <span className="px-2 py-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30">
            Certificates: {sourceCounts.certificate}
          </span>
          <span className="px-2 py-1 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
            Libraries: {sourceCounts.library}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                filter === t
                  ? 'bg-[#2BB6A3] text-[#0B1220] border-[#2BB6A3] font-semibold'
                  : 'bg-transparent text-[#8A93A6] border-[#22304A] hover:text-[#E6EBF5]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-1 border-l border-[#22304A] pl-3">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                sourceFilter === s
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] font-semibold'
                  : 'bg-transparent text-[#8A93A6] border-[#22304A] hover:text-[#E6EBF5]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search algorithm or file…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1 text-sm rounded bg-[#0B1220] border border-[#22304A] text-[#E6EBF5] focus:border-[#2BB6A3] focus:outline-none"
        />
      </div>

      <div className="bg-[#111A2B] border border-[#22304A] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#16223A] text-[#8A93A6] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Score</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Algorithm</th>
              <th className="text-left px-4 py-3">Key</th>
              <th className="text-left px-4 py-3">NIST Status</th>
	      <th className="text-left px-4 py-3">Business Crit</th>
	      <th className="text-left px-4 py-3">Location</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-[#8A93A6]">
                  No findings match. Run a scan from the Dashboard.
                </td>
              </tr>
            ) : (
              filtered.map((f) => (
                <tr key={f.id} className="border-t border-[#22304A] hover:bg-[#16223A]/50">
                  <td className="px-4 py-3 font-bold text-[#E6EBF5]">{f.risk_score}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${tierColor(f.tier)}`}>
                      {f.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded border ${sourceColor(f.source_type)}`}>
                      {f.source_type || 'source'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#E6EBF5]">{f.algorithm}</td>
                  <td className="px-4 py-3 text-[#8A93A6]">{f.key_size || '—'}</td>
                  <th className="text-left px-4 py-3">NIST Status</th>
		  <th className="text-left px-4 py-3">Business Crit</th>
		  <th className="text-left px-4 py-3">Location</th>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}