import React from 'react';
import { 
  Box, 
  Flame, 
  Wrench, 
  ShieldCheck, 
  Sparkles,
  Layers,
  PackageCheck
} from 'lucide-react';

export type MainNavPage = 'workspace' | 'physics' | 'repair' | 'standards' | 'results';

interface NavigationProps {
  currentPage: MainNavPage;
  onPageChange: (page: MainNavPage) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const navItems: { id: MainNavPage; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'workspace',
      label: '3D CAD WORKBENCH',
      icon: <Box className="w-3.5 h-3.5" />,
    },
    {
      id: 'physics',
      label: 'PHYSICS & THERMO',
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    {
      id: 'repair',
      label: 'AUTO-REPAIR STUDIO',
      icon: <Wrench className="w-3.5 h-3.5" />,
    },
    {
      id: 'standards',
      label: 'REGULATORY MATRIX',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'results',
      label: 'FINAL EXPORT & RESULTS',
      icon: <PackageCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <nav className="h-10 bg-obsidian-950 border-b border-obsidian-800 px-4 flex items-center justify-between z-20 select-none">
      <div className="flex items-center space-x-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-laser-cyan/15 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-850'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex items-center space-x-3 text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-laser-green animate-pulse" />
          <span>PRECISION AERO ENGINE v2.4</span>
        </span>
      </div>
    </nav>
  );
};
