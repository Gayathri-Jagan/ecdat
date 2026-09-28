import { useEffect, useState, useRef } from 'react';
import {
  getLatestScan, startScan, uploadZipScan, gitCloneScan, containerScan
} from '../api';

export default function Dashboard() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [businessCrit, setBusinessCrit] = useState('Medium');
  const [sourceType, setSourceType] = useState('local');
  const [gitUrl, setGitUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLatestScan();
      setFindings(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load findings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleScan = async () => {
    setScanning(true);
    setError('');
    try {
      if (sourceType === 'local') {
        await startScan(businessCrit);
      } else if (sourceType === 'zip') {
        const file = fileRef.current?.files?.[0];
        if (!file) { setError('Choose a ZIP file first'); setScanning(false); return; }
        await uploadZipScan(file, businessCrit);
      } else if (sourceType === 'git') {
        if (!gitUrl.trim()) { setError('Enter a Git URL first'); setScanning(false); return; }
        await gitCloneScan(gitUrl.trim(), businessCrit);
      } else if (sourceType === 'container') {
        if (!imageName.trim()) { setError('Enter a container image name first'); setScanning(false); return; }
        await containerScan(imageName.trim(), businessCrit);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const tierColor = (tier) => {
    if (tier === 'Critical') return { bg: 'bg-[#F0504A]/20', text: 'text-[#F0504A]', border: 'border-[#F0504A]' };
    if (tier === 'High')     return { bg: 'bg-[#F59E0B]/20', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]' };
    if (tier === 'Medium')   return { bg: 'bg-[#EAB308]/20', text: 'text-[#EAB308]', border: 'border-[#EAB308]' };
    return { bg: 'bg-[#2BB6A3]/20', text: 'text-[#2BB6A3]', border: 'border-[#2BB6A3]' };
  };

  const critColor = (crit) => {
    if (crit === 'Critical') return 'text-[#F0504A]';
    if (crit === 'High')     return 'text-[#F59E0B]';
    if (crit === 'Low')      return 'text-[#2BB6A3]';
    return 'text-[#8A93A6]';
  };

  if (loading) return <div className="text-[#8A93A6]">Loading findings…</div>;

  const counts = {
    critical: findings.filter(f => f.tier === 'Critical').length,
    high: findings.filter(f => f.tier === 'High').length,
    medium: findings.filter(f => f.tier === 'Medium').length,
    low: findings.filter(f => f.tier === 'Low').length
  };

  const sourceCounts = {
    source: findings.filter(f => f.source_type === 'source').length,
    certificate: findings.filter(f => f.source_type === 'certificate').length,
    library: findings.filter(f => f.source_type === 'library').length
  };

  const currentCrit = findings[0]?.business_criticality || businessCrit;
  const cryptoFindings = findings.filter(f => f.source_type !== 'library');
  const libraryFindings = findings.filter(f => f.source_type === 'library');

  const sourceTabs = [
    { id: 'local',     label: 'Local folder' },
    { id: 'zip',       label: 'Upload ZIP' },
    { id: 'git',       label: 'Git URL' },
    { id: 'container', label: 'Container image' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs + Business criticality */}
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-4 gap-3 flex-1">
          <KPI label="Critical" value={counts.critical} color="#F0504A" />
          <KPI label="High" value={counts.high} color="#F59E0B" />
          <KPI label="Medium" value={counts.medium} color="#EAB308" />
          <KPI label="Low" value={counts.low} color="#2BB6A3" />
        </div>
        <div>
          <label className="block text-[10px] text-[#8A93A6] uppercase tracking-wide mb-1">
            Business Criticality
          </label>
          <select
            value={businessCrit}
            onChange={(e) => setBusinessCrit(e.target.value)}
            className="px-3 py-2 rounded bg-[#111A2B] border border-[#22304A] text-[#E6EBF5] text-sm focus:border-[#2BB6A3] focus:outline-none"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Scan Source selector */}
      <div className="bg-[#111A2B] border border-[#22304A] rounded-lg p-4">
        <div className="text-xs text-[#8A93A6] uppercase tracking-wide mb-3">
          Scan Source
        </div>
        <div className="flex gap-1 mb-4 flex-wrap">
          {sourceTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSourceType(t.id); setError(''); }}
              className={`px-3 py-2 text-sm rounded border transition-colors ${
                sourceType === t.id
                  ? 'bg-[#2BB6A3] text-[#0B1220] border-[#2BB6A3] font-semibold'
                  : 'bg-transparent text-[#8A93A6] border-[#22304A] hover:text-[#E6EBF5]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {sourceType === 'local' && (
          <div className="text-xs text-[#8A93A6] mb-3">
            Scans the local <span className="font-mono text-[#E6EBF5]">targets/</span> folder inside the ECDAT directory.
          </div>
        )}

        {sourceType === 'zip' && (
          <div className="mb-3">
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="text-xs text-[#8A93A6] file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-[#22304A] file:text-[#E6EBF5] file:cursor-pointer hover:file:bg-[#2BB6A3] hover:file:text-[#0B1220]"
            />
          </div>
        )}

        {sourceType === 'git' && (
          <input
            type="text"
            placeholder="https://github.com/user/repo"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            className="w-full max-w-lg px-3 py-2 text-sm rounded bg-[#0B1220] border border-[#22304A] text-[#E6EBF5] focus:border-[#2BB6A3] focus:outline-none mb-3"
          />
        )}

        {sourceType === 'container' && (
          <input
            type="text"
            placeholder="nginx:latest or myapp:1.0"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            className="w-full max-w-lg px-3 py-2 text-sm rounded bg-[#0B1220] border border-[#22304A] text-[#E6EBF5] focus:border-[#2BB6A3] focus:outline-none mb-3"
          />
        )}

        <div className="flex justify-end">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 rounded bg-[#2BB6A3] text-[#0B1220] font-semibold hover:bg-[#24A090] disabled:opacity-50"
          >
            {scanning ? 'Scanning…' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* Discovery sources pills */}
      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="text-[#8A93A6] uppercase tracking-wide">Findings by source:</span>
        <span className="px-3 py-1 rounded border bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30">
          Source code · {sourceCounts.source}
        </span>
        <span className="px-3 py-1 rounded border bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30">
          Certificates · {sourceCounts.certificate}
        </span>
        <span className="px-3 py-1 rounded border bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30">
          Libraries · {sourceCounts.library}
        </span>
        <span className="text-[#8A93A6] uppercase tracking-wide ml-4">Business context:</span>
        <span className={`px-3 py-1 rounded border bg-[#111A2B] border-[#22304A] font-semibold ${critColor(currentCrit)}`}>
          {currentCrit}
        </span>
      </div>

      {error && (
        <div className="text-sm text-[#F0504A] bg-[#F0504A]/10 border border-[#F0504A]/30 rounded p-3">
          {error}
        </div>
      )}

      {/* Mosca */}
      <div className="bg-[#0D1522] border border-[#22304A] rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="text-2xl text-[#2BB6A3]">∑</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#E6EBF5] mb-1">
              Mosca's Algorithm — Quantum Risk Model
            </div>
            <div className="text-xs text-[#8A93A6] font-mono mb-2">
              (T_shelf + T_migration) &gt; T_threat → data is at risk
            </div>
            <div className="text-xs text-[#8A93A6] leading-relaxed">
              <span className="text-[#E6EBF5]">T_shelf</span> = required confidentiality lifetime ·{' '}
              <span className="text-[#E6EBF5]">T_migration</span> = time to migrate to PQC ·{' '}
              <span className="text-[#E6EBF5]">T_threat</span> = expected CRQC arrival.
              Final scores are amplified by the target's business criticality.
            </div>
          </div>
        </div>
      </div>

      {/* Two-panel */}
      <div className="grid grid-cols-2 gap-4">
        <Panel
          title="Traditional CBOM View"
          subtitle="What every other tool shows — everything red, no priority"
        >
          {cryptoFindings.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-3 px-4 border-b border-[#22304A] last:border-b-0">
              <div>
                <span className="font-mono text-sm">{f.algorithm}{f.key_size ? `-${f.key_size}` : ''}</span>
                <span className="text-xs text-[#8A93A6] ml-2">{f.file}:{f.line}</span>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-[#F0504A]/20 text-[#F0504A]">
                HIGH RISK
              </span>
            </div>
          ))}
          <p className="text-xs text-[#8A93A6] italic mt-3">
            Everything is red. Where do I start?
          </p>
        </Panel>

        <Panel
          title="ECDAT Time-Exposure View — Mosca's Algorithm"
          subtitle="Ranked by score, adjusted for business criticality"
        >
          {cryptoFindings.map((f, i) => {
            const c = tierColor(f.tier);
            return (
              <div key={f.id} className="py-3 px-4 border-b border-[#22304A] last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#E6EBF5] w-8">#{i + 1}</span>
                    <span className="text-2xl font-bold text-[#E6EBF5]">{f.risk_score}</span>
                    <span className="font-mono text-sm">{f.algorithm}{f.key_size ? `-${f.key_size}` : ''}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${c.bg} ${c.text} ${c.border}`}>
                    {f.tier.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-[#8A93A6] mt-1 ml-11">
                  NIST: {f.nist_status_current}
                  {f.nist_status_2030 && f.nist_status_2030 !== f.nist_status_current && ` → ${f.nist_status_2030} (2030)`}
                  {f.quantum_vulnerable && ' · Quantum-vulnerable'}
                  {f.time_exposed && ' · TIME-EXPOSED'}
                </div>
                <div className="text-xs text-[#8A93A6] mt-1 ml-11 font-mono">
                  {f.t_shelf}y + {f.t_migration}y &gt; {f.t_threat}y = {f.time_exposed ? 'EXPOSED' : 'safe'}
                  {' · '}
                  <span className={critColor(f.business_criticality)}>
                    {f.business_criticality || 'Medium'} criticality
                  </span>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-[#2BB6A3] italic mt-3">
            Fix #1 this quarter. #2 next year. #3+ don't need action.
          </p>
        </Panel>
      </div>

      {/* Libraries */}
      {libraryFindings.length > 0 && (
        <div className="bg-[#111A2B] border border-[#22304A] rounded-lg p-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold">Libraries & Dependencies</h3>
            <p className="text-xs text-[#8A93A6]">
              {libraryFindings.length} cryptographic libraries detected.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {libraryFindings.map((f) => (
              <div key={f.id} className="bg-[#0B1220] border border-[#22304A] rounded px-3 py-2">
                <div className="font-mono text-sm text-[#E6EBF5]">{f.algorithm}</div>
                <div className="text-xs text-[#8A93A6] font-mono truncate">{f.match || f.file}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="bg-[#111A2B] rounded-lg border border-[#22304A] p-4">
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-xs text-[#8A93A6] mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function KPI({ label, value, color }) {
  return (
    <div className="bg-[#111A2B] border border-[#22304A] rounded-lg p-3">
      <div className="text-xs text-[#8A93A6] uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}