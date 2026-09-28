import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',                label: 'Dashboard',       icon: '▤' },
  { to: '/findings',        label: 'Findings',        icon: '⚠' },
  { to: '/recommendations', label: 'Recommendations', icon: '✦' },
  { to: '/cbom',            label: 'CBOM',            icon: '⬡' },
  { to: '/settings',        label: 'Settings',        icon: '⚙' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-[#22304A] bg-[#0D1522] min-h-[calc(100vh-64px)] p-3">
      <nav className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-[#2BB6A3]/15 text-[#2BB6A3] border border-[#2BB6A3]/30'
                  : 'text-[#8A93A6] hover:text-[#E6EBF5] hover:bg-[#16223A]'
              }`
            }
          >
            <span className="text-base">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 px-3 text-[10px] text-[#4A5568] leading-relaxed">
        ECDAT v0.1<br/>
        NIST-aligned crypto discovery
      </div>
    </aside>
  );
}