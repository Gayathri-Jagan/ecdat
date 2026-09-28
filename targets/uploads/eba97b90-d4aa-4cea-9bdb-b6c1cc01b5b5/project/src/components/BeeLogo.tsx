interface BeeLogoProps {
  size?: number;
  className?: string;
}

export function BeeLogo({ size = 36, className = '' }: BeeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="BudgetBee logo"
    >
      {/* Wings */}
      <ellipse cx="17" cy="16" rx="7" ry="5" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1.5" opacity="0.9" />
      <ellipse cx="31" cy="16" rx="7" ry="5" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1.5" opacity="0.9" />
      {/* Body */}
      <ellipse cx="24" cy="28" rx="12" ry="13" fill="#fbbf24" />
      {/* Stripes */}
      <path d="M14 24 Q24 20 34 24" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M14 31 Q24 27 34 31" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Head */}
      <circle cx="24" cy="14" r="6" fill="#1e293b" />
      {/* Eyes */}
      <circle cx="22" cy="13" r="1.3" fill="#fff" />
      <circle cx="26" cy="13" r="1.3" fill="#fff" />
      {/* Smile */}
      <path d="M22 16 Q24 17.5 26 16" stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Antennae */}
      <path d="M21 9 Q20 6 18 5" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M27 9 Q28 6 30 5" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="5" r="1.5" fill="#1e293b" />
      <circle cx="30" cy="5" r="1.5" fill="#1e293b" />
      {/* Cheeks */}
      <circle cx="19.5" cy="15.5" r="1.5" fill="#f87171" opacity="0.5" />
      <circle cx="28.5" cy="15.5" r="1.5" fill="#f87171" opacity="0.5" />
    </svg>
  );
}

export function BeeIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      {/* Wings */}
      <ellipse cx="17" cy="16" rx="7" ry="5" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1.5" opacity="0.9" />
      <ellipse cx="31" cy="16" rx="7" ry="5" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1.5" opacity="0.9" />
      {/* Body */}
      <ellipse cx="24" cy="28" rx="12" ry="13" fill="#fbbf24" />
      {/* Stripes */}
      <path d="M14 24 Q24 20 34 24" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M14 31 Q24 27 34 31" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Head */}
      <circle cx="24" cy="14" r="6" fill="#1e293b" />
      {/* Eyes */}
      <circle cx="22" cy="13" r="1.3" fill="#fff" />
      <circle cx="26" cy="13" r="1.3" fill="#fff" />
      {/* Antennae */}
      <path d="M21 9 Q20 6 18 5" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M27 9 Q28 6 30 5" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="5" r="1.5" fill="#1e293b" />
      <circle cx="30" cy="5" r="1.5" fill="#1e293b" />
    </svg>
  );
}

export function HoneycombPattern({ className = '', opacity = 0.04 }: { className?: string; opacity?: number }) {
  return (
    <svg className={className} width="100%" height="100%" style={{ opacity }} aria-hidden>
      <defs>
        <pattern id="honeycomb" width="28" height="24" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
          <polygon points="14,0 28,8 28,16 14,24 0,16 0,8" fill="none" stroke="#f59e0b" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#honeycomb)" />
    </svg>
  );
}
