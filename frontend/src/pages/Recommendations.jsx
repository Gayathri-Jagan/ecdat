import { useEffect, useState } from 'react';
import { getLatestScan } from '../api';

export default function Recommendations() {
  const [findings, setFindings] = useState([]);
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

  if (loading) return <div className="text-[#8A93A6]">Loading recommendations…</div>;

  if (findings.length === 0) {
    return (
      <div className="text-sm text-[#8A93A6] bg-[#111A2B] border border-[#22304A] rounded-lg p-6">
        No findings yet. Run a scan from the Dashboard first.
      </div>
    );
  }

  const applicable = findings.filter((f) => f.pqc_replacement);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">PQC Migration Recommendations</h2>
        <p className="text-sm text-[#8A93A6]">
          Post-quantum and hybrid algorithm replacements for each finding, with NIST FIPS
          citations, rationale, and trade-off notes.
        </p>
      </div>

      {/* Summary banner */}
      <div className="bg-[#0D1522] border border-[#22304A] rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="text-2xl text-[#2BB6A3]">✦</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#E6EBF5] mb-1">
              NIST PQC Standards Referenced
            </div>
            <div className="text-xs text-[#8A93A6] leading-relaxed">
              <span className="text-[#E6EBF5]">FIPS 203</span> — ML-KEM (formerly Kyber), key encapsulation ·{' '}
              <span className="text-[#E6EBF5]">FIPS 204</span> — ML-DSA (Dilithium), digital signatures ·{' '}
              <span className="text-[#E6EBF5]">FIPS 205</span> — SLH-DSA (SPHINCS+), hash-based signatures.
              <br />
              Hybrid deployments (classical + PQC) are protected under NIST IR 8547 during the transition period.
            </div>
          </div>
        </div>
      </div>

      {applicable.map((f) => {
        const rec = f.pqc_replacement;
        return (
          <div key={f.id} className="bg-[#111A2B] border border-[#22304A] rounded-lg p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-mono text-lg text-[#E6EBF5]">
                  {f.algorithm}
                  {f.key_size ? `-${f.key_size}` : ''}
                </div>
                <div className="text-xs text-[#8A93A6] mt-1 font-mono">
                  {f.file}:{f.line}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold px-2 py-1 rounded border inline-block ${tierColor(f.tier)}`}>
                  {f.tier.toUpperCase()}
                </div>
                <div className="text-xs text-[#8A93A6] mt-1">Score {f.risk_score}</div>
              </div>
            </div>

            {/* Recommendation grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Field label="Recommended Replacement" value={
                  rec.recommendation_kem && rec.recommendation_signature
                    ? `KEM: ${rec.recommendation_kem} · Signature: ${rec.recommendation_signature}`
                    : rec.recommendation || '—'
                } accent />
                <Field label="NIST FIPS Reference" value={rec.fips || '—'} mono />
                <Field label="Hybrid Option" value={rec.hybrid || '—'} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-[#8A93A6] uppercase tracking-wide mb-1">Rationale</div>
                  <div className="text-sm text-[#E6EBF5] leading-relaxed">{rec.rationale}</div>
                </div>
              </div>
            </div>

            {/* Trade-offs */}
            <div className="mt-4 pt-4 border-t border-[#22304A]">
              <div className="text-xs text-[#8A93A6] uppercase tracking-wide mb-1">Trade-offs</div>
              <div className="text-sm text-[#E6EBF5] leading-relaxed">{rec.trade_offs}</div>
            </div>

            {/* Current NIST status footer */}
            <div className="mt-4 pt-4 border-t border-[#22304A] text-xs text-[#8A93A6]">
              Current NIST status: <span className="text-[#E6EBF5]">{f.nist_status_current}</span>
              {f.nist_status_2030 && f.nist_status_2030 !== f.nist_status_current && (
                <> · 2030: <span className="text-[#E6EBF5]">{f.nist_status_2030}</span></>
              )}
              {f.nist_status_2035 && f.nist_status_2035 !== f.nist_status_2030 && (
                <> · 2035: <span className="text-[#F0504A]">{f.nist_status_2035}</span></>
              )}
              {f.nist_reference && <> · <span className="font-mono">{f.nist_reference}</span></>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, accent, mono }) {
  return (
    <div>
      <div className="text-xs text-[#8A93A6] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-sm ${accent ? 'text-[#2BB6A3] font-semibold' : 'text-[#E6EBF5]'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}