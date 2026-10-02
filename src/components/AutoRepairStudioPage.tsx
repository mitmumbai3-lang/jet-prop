import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { FixDetailModal } from './FixDetailModal';
import { Fix } from '../types';
import { 
  Wrench, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileCheck, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  exportSTL, 
  exportOBJ, 
  exportSTEP, 
  exportDXF, 
  exportChangeReportJSON 
} from '../exporters/fileExporters';

export const AutoRepairStudioPage: React.FC = () => {
  const { 
    fixes, 
    findings, 
    parts, 
    projectName, 
    engineType, 
    auditLog, 
    applyFix, 
    applyAllSafeFixes 
  } = useEngineStore();

  const [activeFixModal, setActiveFixModal] = useState<Fix | null>(null);

  const handleDownloadFile = (partId: string, format: 'stl' | 'obj' | 'step' | 'dxf') => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    let content = '';
    let mime = 'text/plain';
    let ext: string = format;

    if (format === 'stl') {
      content = exportSTL(part);
      mime = 'model/stl';
    } else if (format === 'obj') {
      content = exportOBJ(part);
      mime = 'model/obj';
    } else if (format === 'step') {
      content = exportSTEP(part);
      mime = 'application/step';
      ext = 'stp';
    } else if (format === 'dxf') {
      content = exportDXF(part);
      mime = 'application/dxf';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${part.name.replace(/\s+/g, '_')}_CORRECTED.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadChangeReport = () => {
    const json = exportChangeReportJSON(projectName, engineType, fixes, findings, auditLog);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_Change_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 p-6 overflow-y-auto space-y-6 select-none font-mono">
      {/* Header */}
      <div className="border-b border-obsidian-700 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-laser-cyan/15 text-laser-cyan border border-laser-cyan/30 font-bold uppercase">
              AUTO-REPAIR & CHANGE CONTROL
            </span>
            <span className="text-xs text-slate-400">FAA AC 33.28-1 / ISO 10303 Compliant</span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-100 mt-1">
            Engine Part Auto-Repair & Export Studio
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={applyAllSafeFixes}
            className="px-4 py-2 rounded-xl bg-laser-cyan/20 hover:bg-laser-cyan/30 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan text-xs font-bold transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>APPLY ALL APPROVED FIXES</span>
          </button>

          <button
            onClick={handleDownloadChangeReport}
            className="px-4 py-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-slate-200 border border-obsidian-700 text-xs font-bold transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CHANGE REPORT (JSON)</span>
          </button>
        </div>
      </div>

      {/* Repairs Matrix */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Wrench className="w-4 h-4 text-laser-cyan" />
          <span>PROPOSED & APPLIED GEOMETRIC REPAIRS ({fixes.length})</span>
        </h2>

        {fixes.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-obsidian-800 bg-obsidian-900/40 text-slate-500 text-xs">
            No active repair proposals. Ingest CAD models or sensor logs to generate high-precision auto-fixes.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fixes.map((fix) => {
              const finding = findings.find(f => f.id === fix.findingId);
              const part = parts.find(p => p.id === fix.affectedPartId);

              return (
                <div
                  key={fix.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    fix.applied
                      ? 'bg-obsidian-900/90 border-laser-green/40 shadow-[0_0_25px_rgba(0,255,136,0.1)]'
                      : 'bg-obsidian-900/80 border-obsidian-700 hover:border-obsidian-600'
                  }`}
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between text-[10px] mb-2">
                      <span className="px-2 py-0.5 rounded bg-obsidian-800 text-laser-cyan border border-obsidian-700 font-bold uppercase">
                        {fix.autoFixType.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-semibold">{fix.id}</span>
                        {fix.applied && (
                          <span className="text-laser-green font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> REPAIRED
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 font-display">
                      {fix.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                      {fix.description}
                    </p>

                    {/* Parametric Impact Matrix */}
                    <div className="mt-3 bg-obsidian-950/80 rounded-xl p-3 border border-obsidian-800 space-y-1.5 text-xs">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">
                        PARAMETRIC BEFORE / AFTER DELTA
                      </span>
                      {fix.impactMetrics.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-slate-400">{m.metric}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-laser-red line-through">{m.before}</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span className="text-laser-green font-bold">{m.after}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Detail Triggers */}
                  <div className="mt-4 pt-3 border-t border-obsidian-800 flex items-center justify-between">
                    <button
                      onClick={() => setActiveFixModal(fix)}
                      className="text-xs text-laser-cyan hover:underline decoration-laser-cyan/40 underline-offset-4 flex items-center gap-1 font-bold"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>HOW & WHY IT WORKS</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {part && fix.applied && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDownloadFile(part.id, 'stl')}
                            title="Download Corrected STL"
                            className="px-2 py-1 rounded bg-obsidian-800 hover:bg-obsidian-750 text-[10px] text-slate-200 border border-obsidian-700"
                          >
                            STL
                          </button>
                          <button
                            onClick={() => handleDownloadFile(part.id, 'obj')}
                            title="Download Corrected OBJ"
                            className="px-2 py-1 rounded bg-obsidian-800 hover:bg-obsidian-750 text-[10px] text-slate-200 border border-obsidian-700"
                          >
                            OBJ
                          </button>
                          <button
                            onClick={() => handleDownloadFile(part.id, 'step')}
                            title="Download Corrected STEP"
                            className="px-2 py-1 rounded bg-obsidian-800 hover:bg-obsidian-750 text-[10px] text-laser-cyan border border-laser-cyan/30"
                          >
                            STEP
                          </button>
                        </div>
                      )}

                      {!fix.applied && (
                        <button
                          onClick={() => applyFix(fix.id)}
                          className="px-3 py-1.5 rounded-lg bg-laser-green/20 hover:bg-laser-green/30 text-laser-green border border-laser-green/40 text-xs font-bold transition-all"
                        >
                          APPLY FIX
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fix Detail Modal */}
      {activeFixModal && (
        <FixDetailModal
          fix={activeFixModal}
          finding={findings.find(f => f.id === activeFixModal.findingId)}
          onClose={() => setActiveFixModal(null)}
        />
      )}
    </div>
  );
};
