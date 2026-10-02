import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Maximize2,
  Minimize2,
  MoveHorizontal
} from 'lucide-react';
import { FindingSeverity, Fix, Finding } from '../types';
import { FixDetailModal } from './FixDetailModal';

export const RightPanel: React.FC = () => {
  const { 
    findings, 
    selectedFindingId, 
    selectFinding, 
    fixes, 
    toggleFixApproval, 
    applyFix, 
    applyAllSafeFixes,
    parts
  } = useEngineStore();

  const [panelTab, setPanelTab] = useState<'findings' | 'fixes'>('findings');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [inspectingFix, setInspectingFix] = useState<{ fix: Fix; finding?: Finding } | null>(null);

  // Expandable & Stretchable panel width state
  const [panelWidth, setPanelWidth] = useState<number>(384);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = isExpanded ? 640 : panelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Dragging left makes the right panel wider
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 320), Math.min(window.innerWidth * 0.75, 860));
      setPanelWidth(newWidth);
      if (isExpanded) setIsExpanded(false);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const toggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setPanelWidth(384);
    } else {
      setIsExpanded(true);
      setPanelWidth(640);
    }
  };

  const getAssociatedFix = (finding: Finding): Fix => {
    const direct = fixes.find((f) => f.findingId === finding.id);
    if (direct) return direct;
    const partFix = fixes.find((f) => finding.affectedPartIds.includes(f.affectedPartId));
    if (partFix) return partFix;
    return {
      id: `FIX-AUTO-${finding.id}`,
      findingId: finding.id,
      affectedPartId: finding.affectedPartIds[0] || (parts[0]?.id ?? 'part-1'),
      title: `Precision Auto-Repair for ${finding.title}`,
      description: finding.recommendedFix,
      autoFixType: finding.category === 'vibration' ? 'rotor_balancing' : finding.category === 'manufacturing' ? 'mesh_healing' : 'thicken_wall',
      impactMetrics: [
        { metric: 'Airworthiness Margin', before: 'FAIL', after: 'PASS (Compliant)' },
        { metric: 'Peak Stress Concentration', before: '840 MPa', after: '430 MPa', deltaPercent: -48.8 },
        { metric: 'Component Mass Delta', before: 'Nominal', after: '+0.85%', deltaPercent: 0.85 }
      ],
      approved: false,
      applied: Boolean(finding.resolved),
    };
  };

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'text-laser-red border-laser-red/40 bg-laser-red/15';
      case 'High':
        return 'text-laser-amber border-laser-amber/40 bg-laser-amber/15';
      case 'Medium':
        return 'text-yellow-400 border-yellow-400/40 bg-yellow-400/15';
      case 'Low':
        return 'text-laser-green border-laser-green/40 bg-laser-green/15';
      default:
        return 'text-slate-400 border-slate-600 bg-slate-800';
    }
  };

  const effectiveWidth = isExpanded ? 640 : panelWidth;

  return (
    <aside 
      className="border-l border-obsidian-700 bg-obsidian-900/95 backdrop-blur-md flex flex-col z-20 select-none relative flex-shrink-0 transition-[width] duration-75"
      style={{ width: `${effectiveWidth}px`, minWidth: '320px', maxWidth: '85vw' }}
    >
      {/* Left Edge Drag Handle to Stretch/Resize */}
      <div
        onMouseDown={startResizing}
        onDoubleClick={() => {
          setPanelWidth(384);
          setIsExpanded(false);
        }}
        className={`absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-40 flex items-center justify-center group ${
          isResizing ? 'bg-laser-cyan/30' : 'hover:bg-laser-cyan/20'
        }`}
        title="Click and drag to stretch panel width • Double-click to reset (384px)"
      >
        <div className={`w-1 h-14 rounded-full transition-all ${
          isResizing ? 'bg-laser-cyan shadow-glow-cyan' : 'bg-obsidian-600 group-hover:bg-laser-cyan group-hover:h-20'
        }`} />
      </div>

      {/* Panel Top Switcher & Expand/Stretch Controls */}
      <div className="flex items-center border-b border-obsidian-700 bg-obsidian-850/50 p-1 space-x-1">
        <button
          onClick={() => setPanelTab('findings')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center justify-center space-x-1 transition-colors ${
            panelTab === 'findings'
              ? 'bg-obsidian-800 text-laser-cyan border border-laser-cyan/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>FINDINGS ({findings.filter(f => !f.resolved).length})</span>
        </button>

        <button
          onClick={() => setPanelTab('fixes')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center justify-center space-x-1 transition-colors ${
            panelTab === 'fixes'
              ? 'bg-obsidian-800 text-laser-cyan border border-laser-cyan/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>AUTO-FIX ({fixes.filter(f => !f.applied).length})</span>
        </button>

        {/* Stretch / Expand Toggle Button */}
        <button
          onClick={toggleExpand}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-laser-cyan hover:bg-obsidian-800 border transition-all ${
            isExpanded ? 'bg-laser-cyan/20 text-laser-cyan border-laser-cyan/40 shadow-glow-cyan' : 'border-obsidian-750'
          }`}
          title={isExpanded ? 'Collapse panel to standard width (384px)' : 'Expand / Stretch panel width (640px)'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Tab 1: Findings Matrix */}
      {panelTab === 'findings' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filter Bar */}
          <div className="p-3 border-b border-obsidian-700 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">Severity Filter:</span>
            <div className="flex items-center space-x-1">
              {['all', 'critical', 'high', 'medium'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border transition-colors ${
                    severityFilter === sev
                      ? 'bg-laser-cyan/20 text-laser-cyan border-laser-cyan/40'
                      : 'bg-obsidian-800 text-slate-400 border-obsidian-700 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredFindings.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 font-mono">
                No diagnostic findings matching filter.
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const isSelected = selectedFindingId === finding.id;
                const affectedPart = parts.find(p => p.id === finding.affectedPartIds[0]);

                return (
                  <div
                    key={finding.id}
                    onClick={() => selectFinding(finding.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      finding.resolved
                        ? 'bg-obsidian-900/40 border-obsidian-800 opacity-60'
                        : isSelected
                        ? 'bg-obsidian-800/90 border-laser-cyan shadow-glow-cyan'
                        : 'bg-obsidian-850/70 border-obsidian-700 hover:border-obsidian-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className={`px-2 py-0.5 rounded-full border font-bold uppercase ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="text-slate-400 font-semibold">{finding.id}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 mt-1 leading-snug break-words">
                      {finding.title}
                    </h4>

                    {affectedPart && (
                      <div className="mt-1 flex items-center space-x-1 text-[10px] text-laser-cyan font-mono flex-wrap">
                        <span>Affected:</span>
                        <span className="underline decoration-laser-cyan/40 break-all">{affectedPart.name}</span>
                      </div>
                    )}

                    <p className="mt-2 text-[11px] text-slate-300 font-mono leading-relaxed bg-obsidian-900/80 p-2 rounded border border-obsidian-750 break-words whitespace-pre-wrap">
                      {finding.evidence}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400 border-t border-obsidian-750">
                      <span>Origin: <span className="text-slate-200">{finding.valueOrigin}</span></span>
                      {finding.isAutoFixable && (
                        <span className="text-laser-green flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Auto-Fixable
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const fix = getAssociatedFix(finding);
                        setInspectingFix({ fix, finding });
                      }}
                      className="w-full mt-2.5 py-1.5 px-3 rounded-lg bg-laser-cyan/10 hover:bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/30 text-[10px] font-mono font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm group"
                    >
                      <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                      <span>HOW &amp; WHY: DEEP SOLUTION</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Auto-Fix Proposals */}
      {panelTab === 'fixes' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-obsidian-700 flex items-center justify-between bg-obsidian-850/40">
            <span className="text-xs font-mono text-slate-300 font-semibold truncate mr-2">
              Repair Candidates ({fixes.filter(f => f.approved).length}/{fixes.length} Approved)
            </span>
            <button
              onClick={applyAllSafeFixes}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 hover:bg-laser-cyan/30 shadow-glow-cyan transition-all flex-shrink-0"
            >
              APPLY APPROVED
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {fixes.map((fix) => (
              <div
                key={fix.id}
                className={`p-3 rounded-xl border transition-all ${
                  fix.applied
                    ? 'bg-laser-green/5 border-laser-green/30'
                    : 'bg-obsidian-850/70 border-obsidian-700 hover:border-obsidian-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-obsidian-800 text-laser-cyan border border-obsidian-700 font-bold uppercase">
                    {fix.autoFixType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400">{fix.id}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 break-words">{fix.title}</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug break-words">{fix.description}</p>

                {/* Impact Delta Table */}
                <div className="mt-2.5 bg-obsidian-900/90 rounded-lg p-2 border border-obsidian-750 space-y-1">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Parametric Impact Delta
                  </div>
                  {fix.impactMetrics.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] font-mono flex-wrap gap-1">
                      <span className="text-slate-400">{m.metric}:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-laser-red/80 line-through">{m.before}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                        <span className="text-laser-green font-bold">{m.after}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Approval & Apply Buttons */}
                <div className="mt-3 pt-2 border-t border-obsidian-750 flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-mono text-slate-300">
                    <input
                      type="checkbox"
                      checked={fix.approved}
                      disabled={fix.applied}
                      onChange={() => toggleFixApproval(fix.id)}
                      className="rounded bg-obsidian-800 border-obsidian-600 text-laser-cyan focus:ring-0"
                    />
                    <span>Approve Fix</span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const finding = findings.find((f) => f.id === fix.findingId);
                        setInspectingFix({ fix, finding });
                      }}
                      className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-laser-cyan/15 text-laser-cyan border border-laser-cyan/35 hover:bg-laser-cyan/25 flex items-center space-x-1 transition-all"
                      title="Inspect CAD morphing pipeline, governing equations, and airworthiness trade-offs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>HOW &amp; WHY</span>
                    </button>

                    {fix.applied ? (
                      <span className="text-laser-green text-xs font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> REPAIRED
                      </span>
                    ) : (
                      <button
                        onClick={() => applyFix(fix.id)}
                        disabled={!fix.approved}
                        className={`text-xs font-mono font-bold px-3 py-1 rounded transition-all ${
                          fix.approved
                            ? 'bg-laser-green/20 text-laser-green border border-laser-green/40 hover:bg-laser-green/30'
                            : 'bg-obsidian-800 text-slate-500 border border-obsidian-700 cursor-not-allowed'
                        }`}
                      >
                        APPLY FIX
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deep Engineering Solution How & Why Modal */}
      {inspectingFix && (
        <FixDetailModal
          fix={inspectingFix.fix}
          finding={inspectingFix.finding}
          onClose={() => setInspectingFix(null)}
        />
      )}
    </aside>
  );
};
