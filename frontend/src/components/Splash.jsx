import { useEffect, useState } from 'react';

export default function Splash({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1400);
    const doneTimer = setTimeout(() => onDone?.(), 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220] transition-opacity duration-400 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Logo mark */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2BB6A3] to-[#1B7A6E] flex items-center justify-center shadow-lg shadow-[#2BB6A3]/20">
            <svg viewBox="0 0 32 32" className="w-12 h-12 text-[#0B1220]">
              <path
                fill="currentColor"
                d="M16 2 4 8v8c0 7 5 13 12 14 7-1 12-7 12-14V8L16 2zm0 4.2 8 4v6c0 5-3.6 9-8 10-4.4-1-8-5-8-10v-6l8-4z"
              />
              <circle cx="16" cy="16" r="3" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-[#2BB6A3]/10 blur-xl -z-10" />
        </div>

        <h1 className="text-3xl font-bold text-[#E6EBF5] tracking-wide">ECDAT</h1>
        <p className="text-xs text-[#8A93A6] mt-1 text-center max-w-xs">
          Enterprise Cryptographic Discovery and Analysis Tool
        </p>

        {/* Loading bar */}
        <div className="mt-8 w-48 h-0.5 bg-[#22304A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2BB6A3] transition-all duration-[1400ms] ease-out"
            style={{ width: fadeOut ? '100%' : '20%' }}
          />
        </div>

        <p className="text-[10px] text-[#4A5568] mt-3 font-mono uppercase tracking-widest">
          Initializing engine…
        </p>
      </div>
    </div>
  );
}