import { useEffect, useState } from 'react';
import { getLatestCBOM, exportCBOM } from '../api';

export default function CBOM() {
  const [cbom, setCbom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLatestCBOM();
      setCbom(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load CBOM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportCBOM();
      setCbom(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(cbom, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecdat-cbom.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProp = (component, name) => {
    const p = (component.properties || []).find((x) => x.name === name);
    return p ? p.value : null;
  };

  if (loading) return <div className="text-[#8A93A6]">Loading CBOM…</div>;

  const components = cbom?.components || [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">CycloneDX CBOM</h2>
          <p className="text-sm text-[#8A93A6]">
            {components.length} cryptographic assets ·{' '}
            <span className="font-mono text-xs">
              spec {cbom?.specVersion || '—'}
            </span>
            {cbom?.serialNumber && (
              <> · <span className="font-mono text-xs">{cbom.serialNumber.slice(0, 30)}…</span></>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm rounded bg-[#2BB6A3] text-[#0B1220] font-semibold hover:bg-[#24A090] disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Regenerate'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!cbom}
            className="px-4 py-2 text-sm rounded border border-[#22304A] text-[#E6EBF5] hover:border-[#2BB6A3] disabled:opacity-50"
          >
            Download
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-[#F0504A] bg-[#F0504A]/10 border border-[#F0504A]/30 rounded p-3">
          {error}
        </div>
      )}

      {components.length === 0 && !error && (
        <div className="text-sm text-[#8A93A6] bg-[#111A2B] border border-[#22304A] rounded-lg p-6">
          No CBOM yet. Click <strong className="text-[#2BB6A3]">Regenerate</strong> to build one from the latest scan.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {components.map((c) => {
          const tier = getProp(c, 'ecdat:tier') || 'Unknown';
          const score = getProp(c, 'ecdat:riskScore') || '—';
          const nist = getProp(c, 'ecdat:nistStatusCurrent') || '—';
          const nist2030 = getProp(c, 'ecdat:nistStatus2030');
          const nist2035 = getProp(c, 'ecdat:nistStatus2035');
          const qv = getProp(c, 'ecdat:quantumVulnerable');
          const te = getProp(c, 'ecdat:timeExposed');
          const loc = getProp(c, 'ecdat:location');

          const tierClass = {
            Critical: 'bg-[#F0504A]/20 text-[#F0504A] border-[#F0504A]/40',
            High:     'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40',
            Medium:   'bg-[#EAB308]/20 text-[#EAB308] border-[#EAB308]/40',
            Low:      'bg-[#2BB6A3]/20 text-[#2BB6A3] border-[#2BB6A3]/40',
          }[tier] || 'bg-[#22304A] text-[#8A93A6] border-[#22304A]';

          return (
            <div key={c['bom-ref']} className="bg-[#111A2B] border border-[#22304A] rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-base text-[#E6EBF5]">
                    {c.name}
                    {c.cryptoProperties?.algorithmProperties?.parameterSetIdentifier && (
                      <span className="text-[#8A93A6]">
                        -{c.cryptoProperties.algorithmProperties.parameterSetIdentifier}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8A93A6] mt-1">
                    {c.cryptoProperties?.algorithmProperties?.primitive || 'unknown primitive'}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${tierClass}`}>
                  {tier.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-xs mb-3">
                <div className="text-[#8A93A6]">Risk score</div>
                <div className="text-[#E6EBF5] font-bold">{score}</div>

                <div className="text-[#8A93A6]">NIST status</div>
                <div className="text-[#E6EBF5]">{nist}</div>

                {nist2030 && (
                  <>
                    <div className="text-[#8A93A6]">Status 2030</div>
                    <div className="text-[#E6EBF5]">{nist2030}</div>
                  </>
                )}

                {nist2035 && (
                  <>
                    <div className="text-[#8A93A6]">Status 2035</div>
                    <div className="text-[#E6EBF5]">{nist2035}</div>
                  </>
                )}

                <div className="text-[#8A93A6]">Quantum-vulnerable</div>
                <div className={qv === 'true' ? 'text-[#F0504A] font-semibold' : 'text-[#2BB6A3]'}>
                  {qv === 'true' ? 'YES' : 'no'}
                </div>

                <div className="text-[#8A93A6]">Time-exposed</div>
                <div className={te === 'true' ? 'text-[#F0504A] font-semibold' : 'text-[#2BB6A3]'}>
                  {te === 'true' ? 'YES' : 'no'}
                </div>
              </div>

              {loc && (
                <div className="text-xs text-[#8A93A6] font-mono bg-[#0B1220] px-2 py-1 rounded mt-2">
                  {loc}
                </div>
              )}

              <div className="text-[10px] text-[#4A5568] font-mono mt-3">
                bom-ref: {c['bom-ref'].slice(0, 16)}…
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-[#4A5568] pt-4 border-t border-[#22304A] leading-relaxed">
        Every component above is Mosca-classified. Assets where{' '}
        <span className="font-mono text-[#8A93A6]">(T_shelf + T_migration) &gt; T_threat</span>{' '}
        are flagged <span className="text-[#F0504A]">time-exposed</span> in the{' '}
        <span className="font-mono">ecdat:timeExposed</span> property.
      </div>
    </div>
  );
}