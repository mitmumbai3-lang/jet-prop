import React, { useEffect, useRef } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  ShieldAlert, 
  RotateCcw, 
  Trash2, 
  Sparkles, 
  Cpu, 
  Activity, 
  Globe2,
  Lock,
  Layers
} from 'lucide-react';
import anime from 'animejs';

export const Header: React.FC = () => {
  const { 
    projectName, 
    engineType, 
    units, 
    privacyMode, 
    healthScore,
    setUnits, 
    setPrivacyMode, 
    clearAllSessionData,
    loadSampleEngine
  } = useEngineStore();

  const logoRef = useRef<SVGSVGElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logoRef.current) {
      anime({
        targets: logoRef.current.querySelectorAll('.spin-blade'),
        rotate: '1turn',
        duration: 8000,
        easing: 'linear',
        loop: true,
      });
    }
  }, []);

  useEffect(() => {
    if (healthRef.current) {
      anime({
        targets: healthRef.current,
        scale: [0.95, 1],
        opacity: [0.8, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, [healthScore]);

  const getHealthBadgeColor = () => {
    if (healthScore >= 85) return 'text-laser-green border-laser-green/30 bg-laser-green/10';
    if (healthScore >= 60) return 'text-laser-amber border-laser-amber/30 bg-laser-amber/10';
    return 'text-laser-red border-laser-red/30 bg-laser-red/10';
  };

  return (
    <header className="h-16 border-b border-obsidian-700 bg-obsidian-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-obsidian-800 border border-laser-cyan/30 shadow-glow-cyan">
          <svg 
            ref={logoRef} 
            className="w-7 h-7 text-laser-cyan" 
            viewBox="0 0 100 100" 
            fill="none"
          >
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
            <circle cx="50" cy="50" r="28" stroke="#ff7300" strokeWidth="2" opacity="0.8" />
            <g className="spin-blade" style={{ transformOrigin: '50px 50px' }}>
              <path d="M50 8 A42 42 0 0 1 78 20 L62 36 A22 22 0 0 0 50 28 Z" fill="#00f0ff" />
              <path d="M92 50 A42 42 0 0 1 80 78 L64 62 A22 22 0 0 0 72 50 Z" fill="#00f0ff" />
              <path d="M50 92 A42 42 0 0 1 22 80 L38 64 A22 22 0 0 0 50 72 Z" fill="#00f0ff" />
              <path d="M8 50 A42 42 0 0 1 20 22 L36 38 A22 22 0 0 0 28 50 Z" fill="#00f0ff" />
            </g>
            <circle cx="50" cy="50" r="6" fill="#ffffff" />
          </svg>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5">
              JETENGINE <span className="text-laser-cyan font-mono text-xs px-1.5 py-0.5 rounded bg-laser-cyan/10 border border-laser-cyan/30">AI WORKBENCH</span>
            </h1>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-obsidian-800 rounded border border-obsidian-700">
              v2.4-AERO
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">{projectName}</span>
            <span>•</span>
            <span className="text-laser-amber/90">{engineType}</span>
          </div>
        </div>
      </div>

      {/* Telemetry HUD & Status Bar */}
      <div className="flex items-center space-x-4">
        {/* Health Score Readout */}
        <div ref={healthRef} className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${getHealthBadgeColor()}`}>
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>HEALTH SCORE:</span>
          <span className="text-sm">{healthScore}%</span>
        </div>

        {/* Units Selector */}
        <div className="flex items-center bg-obsidian-800 rounded-lg p-0.5 border border-obsidian-700 text-xs font-mono">
          <button
            onClick={() => setUnits('metric')}
            className={`px-2 py-1 rounded transition-colors ${
              units === 'metric' 
                ? 'bg-laser-cyan/20 text-laser-cyan font-bold border border-laser-cyan/40 shadow-glow-cyan' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            METRIC [mm/kg]
          </button>
          <button
            onClick={() => setUnits('imperial')}
            className={`px-2 py-1 rounded transition-colors ${
              units === 'imperial' 
                ? 'bg-laser-cyan/20 text-laser-cyan font-bold border border-laser-cyan/40 shadow-glow-cyan' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            IMPERIAL [in/lbm]
          </button>
        </div>

        {/* ITAR / EAR Export Control Notice & Privacy Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            title={privacyMode ? "Privacy Mode Active: Zero external AI calls. 100% offline deterministic rules." : "Online AI Mode: Gemini multi-modal reasoning active."}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-all ${
              privacyMode
                ? 'bg-laser-green/10 text-laser-green border-laser-green/40'
                : 'bg-obsidian-800 text-slate-300 border-obsidian-700 hover:border-slate-500'
            }`}
          >
            {privacyMode ? <Lock className="w-3.5 h-3.5" /> : <Globe2 className="w-3.5 h-3.5 text-laser-cyan" />}
            <span className="hidden sm:inline">{privacyMode ? 'LOCAL OFFLINE' : 'AI CLOUD ACTIVE'}</span>
          </button>

          <div 
            title="EXPORT CONTROLLED: Data may be subject to EAR/ITAR restrictions. Session data isolated."
            className="flex items-center space-x-1 px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-mono cursor-help"
          >
            <ShieldAlert className="w-3 h-3 text-laser-amber" />
            <span className="hidden md:inline">ITAR/EAR SHIELD</span>
          </div>
        </div>

        {/* Load Sample Dataset & Session Purge */}
        <div className="flex items-center space-x-2 border-l border-obsidian-700 pl-4">
          <button
            onClick={loadSampleEngine}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-laser-cyan/15 hover:bg-laser-cyan/25 text-laser-cyan border border-laser-cyan/40 hover:shadow-glow-cyan text-xs font-mono font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>LOAD SAMPLE ENGINE</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to cryptographically purge all files, 3D meshes, and telemetry data from memory?")) {
                clearAllSessionData();
              }
            }}
            title="Zero-Trace Purge: Cryptographically shred session geometry and logs"
            className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-red-500/20 text-slate-400 hover:text-laser-red border border-obsidian-700 hover:border-laser-red/40 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
