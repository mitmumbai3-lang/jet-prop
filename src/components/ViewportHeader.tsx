import React from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  Box, 
  Compass, 
  Activity, 
  FileText, 
  ShieldCheck, 
  Eye, 
  Maximize2, 
  Scissors, 
  Layers, 
  Ruler, 
  MapPin,
  Sparkles
} from 'lucide-react';

export const ViewportHeader: React.FC = () => {
  const { 
    activeTab, 
    viewMode, 
    explodedValue, 
    cutawayActive, 
    cutawayDepth, 
    measureMode,
    showPins,
    setActiveTab, 
    setViewMode, 
    setExplodedValue, 
    setCutawayActive, 
    setCutawayDepth, 
    setMeasureMode,
    setShowPins
  } = useEngineStore();

  return (
    <div className="border-b border-obsidian-700 bg-obsidian-900/90 backdrop-blur-md px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-10 select-none">
      {/* Viewport Tabs */}
      <div className="flex items-center space-x-1 bg-obsidian-850 p-1 rounded-xl border border-obsidian-700/80">
        <button
          onClick={() => setActiveTab('model')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            activeTab === 'model'
              ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D MODEL</span>
        </button>

        <button
          onClick={() => setActiveTab('drawing')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            activeTab === 'drawing'
              ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>DRAWING (DXF/PDF)</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            activeTab === 'data'
              ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>TELEMETRY & LOGS</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            activeTab === 'report'
              ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>ENGINE REPORT</span>
        </button>

        <button
          onClick={() => setActiveTab('fmea')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
            activeTab === 'fmea'
              ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FMEA MATRIX</span>
        </button>
      </div>

      {/* 3D Viewport Controls (only active on 'model' tab) */}
      {activeTab === 'model' && (
        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Shaded / Wireframe / XRay Mode */}
          <div className="flex items-center bg-obsidian-850 p-1 rounded-lg border border-obsidian-700">
            {(['shaded', 'wireframe', 'xray', 'diff'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2 py-0.5 rounded uppercase text-[10px] font-mono transition-colors ${
                  viewMode === m
                    ? 'bg-obsidian-700 text-laser-cyan font-bold border border-laser-cyan/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Exploded View Slider */}
          <div className="flex items-center space-x-1.5 bg-obsidian-850 px-2.5 py-1 rounded-lg border border-obsidian-700">
            <span className="text-[10px] text-slate-400 font-mono">Explode:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedValue}
              onChange={(e) => setExplodedValue(parseFloat(e.target.value))}
              className="w-16 h-1 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-cyan"
            />
            <span className="text-[10px] text-laser-cyan w-6 text-right">
              {Math.round(explodedValue * 100)}%
            </span>
          </div>

          {/* Section Cutaway Toggle */}
          <button
            onClick={() => setCutawayActive(!cutawayActive)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-colors ${
              cutawayActive
                ? 'bg-laser-amber/20 text-laser-amber border-laser-amber/40 shadow-glow-amber'
                : 'bg-obsidian-850 text-slate-400 border-obsidian-700 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-[10px]">SECTION</span>
          </button>

          {/* Issue Pins Toggle */}
          <button
            onClick={() => setShowPins(!showPins)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-colors ${
              showPins
                ? 'bg-laser-cyan/20 text-laser-cyan border-laser-cyan/40 shadow-glow-cyan'
                : 'bg-obsidian-850 text-slate-400 border-obsidian-700 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px]">PINS</span>
          </button>

          {/* Measurement Caliper */}
          <button
            onClick={() => setMeasureMode(!measureMode)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-colors ${
              measureMode
                ? 'bg-laser-green/20 text-laser-green border-laser-green/40 shadow-glow-green'
                : 'bg-obsidian-850 text-slate-400 border-obsidian-700 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-[10px]">CALIPER</span>
          </button>
        </div>
      )}
    </div>
  );
};
