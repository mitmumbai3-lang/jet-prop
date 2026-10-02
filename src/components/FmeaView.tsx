import React, { useState, useMemo } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Filter, 
  Layers, 
  Sparkles, 
  ExternalLink,
  Info,
  ChevronRight,
  TrendingDown,
  RefreshCw,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FmeaItem {
  id: string;
  partId: string;
  partName: string;
  partCategory: string;
  materialId?: string;
  failureMode: string;
  potentialCause: string;
  potentialEffect: string;
  severity: number;    // S: 1-10
  occurrence: number;  // O: 1-10
  detection: number;   // D: 1-10
  rpn: number;         // S * O * D
  recommendedAction: string;
  status: 'Open' | 'Mitigated';
  fixId?: string;
  findingId?: string;
}

export const FmeaView: React.FC = () => {
  const { 
    parts, 
    findings, 
    fixes, 
    selectedPartId, 
    selectPart, 
    applyFix, 
    loadSampleEngine 
  } = useEngineStore();

  const [filterPartId, setFilterPartId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'mitigated'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Synchronize with selectedPartId from 3D viewport when user clicks a 3D component
  const activePartId = filterPartId === 'all' && selectedPartId ? selectedPartId : filterPartId;

  // Dynamically synthesize reactive FMEA rows for ALL input/uploaded components
  const fmeaRows = useMemo<FmeaItem[]>(() => {
    if (parts.length === 0) return [];

    const items: FmeaItem[] = [];
    let counter = 1;

    parts.forEach((part) => {
      // Find all findings associated with this component
      const partFindings = findings.filter((f) => f.affectedPartIds.includes(part.id));

      if (partFindings.length > 0) {
        // Generate a failure mode row for every real detected finding
        partFindings.forEach((finding) => {
          const associatedFix = fixes.find((fx) => fx.findingId === finding.id || fx.affectedPartId === part.id);
          const isResolved = finding.resolved || associatedFix?.applied;

          let S = 8;
          let O = isResolved ? 1 : 6;
          let D = 3;

          if (finding.severity === 'Critical') {
            S = 10;
            O = isResolved ? 1 : 7;
            D = 4;
          } else if (finding.severity === 'High') {
            S = 8;
            O = isResolved ? 1 : 5;
            D = 3;
          } else if (finding.severity === 'Medium') {
            S = 6;
            O = isResolved ? 1 : 4;
            D = 2;
          } else {
            S = 4;
            O = isResolved ? 1 : 3;
            D = 2;
          }

          items.push({
            id: `FMEA-${String(counter++).padStart(2, '0')}`,
            partId: part.id,
            partName: part.name,
            partCategory: part.category,
            materialId: part.materialId,
            failureMode: finding.title,
            potentialCause: finding.probableCause || finding.evidence,
            potentialEffect: finding.consequenceIfUnresolved || 'Component performance loss and secondary airframe vibration',
            severity: S,
            occurrence: O,
            detection: D,
            rpn: S * O * D,
            recommendedAction: finding.recommendedFix || associatedFix?.title || 'Apply automated CAD geometry morphing',
            status: isResolved ? 'Mitigated' : 'Open',
            fixId: associatedFix?.id,
            findingId: finding.id,
          });
        });
      }

      // Also ensure baseline propulsion airworthiness failure mode for this component category
      const baselineMode = getBaselineCategoryMode(part.category, part.name);
      items.push({
        id: `FMEA-${String(counter++).padStart(2, '0')}`,
        partId: part.id,
        partName: part.name,
        partCategory: part.category,
        materialId: part.materialId,
        failureMode: baselineMode.failureMode,
        potentialCause: baselineMode.potentialCause,
        potentialEffect: baselineMode.potentialEffect,
        severity: baselineMode.severity,
        occurrence: baselineMode.occurrence,
        detection: baselineMode.detection,
        rpn: baselineMode.severity * baselineMode.occurrence * baselineMode.detection,
        recommendedAction: baselineMode.recommendedAction,
        status: 'Mitigated',
      });
    });

    // Sort by RPN descending (highest risk first)
    return items.sort((a, b) => b.rpn - a.rpn);
  }, [parts, findings, fixes]);

  // Helper for baseline failure modes per engine component category
  function getBaselineCategoryMode(category: string, name: string) {
    switch (category) {
      case 'fan_blade':
        return {
          failureMode: 'FOD Bird Ingestion & Leading Edge Notch Cracking',
          potentialCause: 'Foreign object impact at takeoff velocity (Mach 0.25)',
          potentialEffect: 'Fan blade unbalance and thrust loss',
          severity: 9,
          occurrence: 2,
          detection: 3,
          recommendedAction: 'Verify hollow titanium diffusion bonding per FAA AC 33.76',
        };
      case 'compressor_rotor':
        return {
          failureMode: 'Axial Aerodynamic Stall & Blade Tip Rub',
          potentialCause: 'Distorted inlet airflow causing transient tip gap closure',
          potentialEffect: 'Compressor surge, core over-temperature',
          severity: 8,
          occurrence: 3,
          detection: 3,
          recommendedAction: 'Radial casing abradable coating inspection',
        };
      case 'turbine_rotor':
        return {
          failureMode: 'High-Temperature Creep Rupture at Peak TIT',
          potentialCause: 'Centrifugal hoop stress at sustained 1,450°C gas temp',
          potentialEffect: 'Uncontained turbine blade liberation',
          severity: 10,
          occurrence: 2,
          detection: 3,
          recommendedAction: 'CMSX-4 Larson-Miller parameter verification (LMP > 27,000)',
        };
      case 'shaft':
        return {
          failureMode: 'Torsional Whirl & Bearing Raceway Spallation',
          potentialCause: 'High-speed N2 shaft eccentricity at 14,200 RPM',
          potentialEffect: '#3/#4 bearing distress and high airframe vibration',
          severity: 8,
          occurrence: 2,
          detection: 2,
          recommendedAction: 'ISO 1940-1 Grade G2.5 precision balancing protocol',
        };
      case 'combustor_liner':
        return {
          failureMode: 'Thermal Effusion Hole Plugging & TBC Spallation',
          potentialCause: 'Fuel nozzle coke buildup creating localized flame hot spot',
          potentialEffect: 'Liner burn-through and turbine inlet distortion',
          severity: 8,
          occurrence: 3,
          detection: 4,
          recommendedAction: 'Automated effusion hole laser cleaning and TBC thickness check',
        };
      case 'casing':
        return {
          failureMode: 'Thermal Distortion & Flange Gas Leakage',
          potentialCause: 'Uneven circumferential temperature gradient',
          potentialEffect: 'Secondary bypass pressure loss and efficiency drop',
          severity: 6,
          occurrence: 2,
          detection: 2,
          recommendedAction: 'Torque check on split-line fasteners and O-ring inspection',
        };
      default:
        return {
          failureMode: 'High Cycle Fatigue (HCF) Harmonic Resonance',
          potentialCause: 'Aerodynamic blade-passing excitation matching natural frequency',
          potentialEffect: 'Micro-crack propagation leading to structural liberation',
          severity: 7,
          occurrence: 2,
          detection: 3,
          recommendedAction: 'Campbell diagram resonance frequency screening (FAA AC 33.28)',
        };
    }
  }

  // Filtered rows based on component selection and status
  const filteredRows = useMemo(() => {
    return fmeaRows.filter((row) => {
      // Part filter
      if (activePartId !== 'all' && row.partId !== activePartId) {
        return false;
      }
      // Status filter
      if (statusFilter === 'open' && row.status !== 'Open') return false;
      if (statusFilter === 'mitigated' && row.status !== 'Mitigated') return false;
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          row.partName.toLowerCase().includes(query) ||
          row.failureMode.toLowerCase().includes(query) ||
          row.potentialCause.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [fmeaRows, activePartId, statusFilter, searchTerm]);

  // Aggregate reactive statistics
  const totalModes = fmeaRows.length;
  const criticalModes = fmeaRows.filter((r) => r.rpn > 100 && r.status === 'Open').length;
  const openModes = fmeaRows.filter((r) => r.status === 'Open').length;
  const mitigatedModes = fmeaRows.filter((r) => r.status === 'Mitigated').length;

  const handleMitigate = (row: FmeaItem) => {
    if (row.fixId) {
      applyFix(row.fixId);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00f0ff', '#00ff88', '#ff7300']
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 p-6 overflow-y-auto space-y-5 select-none font-mono">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-obsidian-700 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-laser-amber/15 border border-laser-amber/40 flex items-center justify-center text-laser-amber shadow-glow-amber">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 uppercase tracking-wider font-display">
                FAILURE MODE AND EFFECTS ANALYSIS (FMEA) REGISTER
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Standard: MIL-STD-1629A / SAE ARP5580 • Dynamically reactive to input CAD components
              </p>
            </div>
          </div>
        </div>

        {/* Real-Time RPN KPI Tiles */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-obsidian-900 border border-obsidian-750 flex items-center space-x-2">
            <span className="text-slate-400">INPUT COMPONENTS:</span>
            <span className="text-laser-cyan font-bold">{parts.length}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-obsidian-900 border border-obsidian-750 flex items-center space-x-2">
            <span className="text-slate-400">HIGH RISK (RPN &gt; 100):</span>
            <span className={`font-bold ${criticalModes > 0 ? 'text-laser-red animate-pulse' : 'text-laser-green'}`}>
              {criticalModes}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-laser-green/10 border border-laser-green/30 flex items-center space-x-2 text-laser-green">
            <span>MITIGATED:</span>
            <span className="font-bold">{mitigatedModes}</span>
          </div>
        </div>
      </div>

      {/* Reactive Component Selection Bar */}
      <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-750 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-laser-cyan" />
            <span className="font-bold uppercase tracking-wider text-[11px]">Select Component to Inspect:</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <input
              type="text"
              placeholder="Search failure modes or causes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-obsidian-950 text-xs px-2.5 py-1 rounded-lg border border-obsidian-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-laser-cyan/50"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-obsidian-950 text-xs px-2.5 py-1 rounded-lg border border-obsidian-700 text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses ({fmeaRows.length})</option>
              <option value="open">Open High-Risk ({openModes})</option>
              <option value="mitigated">Mitigated ({mitigatedModes})</option>
            </select>
          </div>
        </div>

        {/* Component Selector Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5">
          <button
            onClick={() => {
              setFilterPartId('all');
              selectPart(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activePartId === 'all'
                ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/50 shadow-glow-cyan font-bold'
                : 'bg-obsidian-850 text-slate-400 border border-obsidian-700 hover:text-slate-200'
            }`}
          >
            <span>ALL COMPONENTS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-obsidian-950 text-laser-cyan">
              {fmeaRows.length}
            </span>
          </button>

          {parts.map((p) => {
            const isSelected = activePartId === p.id;
            const partIssues = findings.filter(f => f.affectedPartIds.includes(p.id) && !f.resolved).length;

            return (
              <button
                key={p.id}
                onClick={() => {
                  setFilterPartId(p.id);
                  selectPart(p.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/50 shadow-glow-cyan font-bold'
                    : 'bg-obsidian-850 text-slate-300 border border-obsidian-700 hover:border-obsidian-600'
                }`}
              >
                <span className="truncate max-w-[180px]">{p.name}</span>
                {partIssues > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-laser-red/20 text-laser-red border border-laser-red/40 font-bold">
                    {partIssues} OPEN
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State when no parts exist */}
      {parts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-obsidian-700 bg-obsidian-900/40 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-laser-cyan/10 border border-laser-cyan/30 flex items-center justify-center text-laser-cyan mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Awaiting Jet Engine Component Ingestion
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-sans">
              Drop CAD models (STEP, STL, OBJ, DXF) in the Workbench dropzone, or load the certified in-memory benchmark engine to generate real-time FMEA risk evaluations.
            </p>
          </div>
          <button
            onClick={() => loadSampleEngine()}
            className="px-4 py-2 rounded-xl bg-laser-cyan/20 hover:bg-laser-cyan/30 text-laser-cyan border border-laser-cyan/40 text-xs font-mono font-bold transition-all shadow-glow-cyan"
          >
            LOAD BENCHMARK ENGINE COMPONENTS
          </button>
        </div>
      ) : (
        /* Reactive FMEA Table */
        <div className="overflow-x-auto rounded-xl border border-obsidian-700 bg-obsidian-900/60 shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-obsidian-850 text-slate-400 uppercase text-[10px] border-b border-obsidian-700">
              <tr>
                <th className="p-3">FMEA ID</th>
                <th className="p-3">Component Item</th>
                <th className="p-3">Potential Failure Mode</th>
                <th className="p-3">Worst-Case Airworthiness Effect</th>
                <th className="p-2 text-center">Sev (S)</th>
                <th className="p-2 text-center">Occ (O)</th>
                <th className="p-2 text-center">Det (D)</th>
                <th className="p-3 text-center">RPN</th>
                <th className="p-3">Mitigation Action</th>
                <th className="p-3 text-center">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-750 text-slate-200 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No failure mode records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isPartHighlighted = selectedPartId === row.partId;

                  return (
                    <tr 
                      key={row.id} 
                      onClick={() => selectPart(row.partId)}
                      className={`hover:bg-obsidian-800/60 transition-colors cursor-pointer ${
                        isPartHighlighted ? 'bg-laser-cyan/10 border-l-2 border-l-laser-cyan' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-400 whitespace-nowrap">{row.id}</td>
                      <td className="p-3 font-semibold text-laser-cyan whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-laser-cyan" />
                          <span className="truncate max-w-[160px]">{row.partName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-200 font-sans text-xs max-w-xs break-words">
                        {row.failureMode}
                      </td>
                      <td className="p-3 text-slate-400 font-sans text-[11px] max-w-xs break-words">
                        {row.potentialEffect}
                      </td>
                      <td className="p-2 text-center font-bold text-laser-red">{row.severity}</td>
                      <td className="p-2 text-center font-bold text-laser-amber">{row.occurrence}</td>
                      <td className="p-2 text-center font-bold text-yellow-400">{row.detection}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                          row.rpn > 140 ? 'bg-laser-red/20 text-laser-red border border-laser-red/40 shadow-[0_0_10px_rgba(255,0,85,0.2)]' :
                          row.rpn > 80 ? 'bg-laser-amber/20 text-laser-amber border border-laser-amber/40' :
                          'bg-laser-green/20 text-laser-green border border-laser-green/40'
                        }`}>
                          {row.rpn}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-sans text-xs max-w-xs break-words">
                        {row.recommendedAction}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {row.status === 'Open' && row.fixId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMitigate(row);
                            }}
                            className="px-2.5 py-1 rounded bg-laser-green/20 hover:bg-laser-green/30 text-laser-green border border-laser-green/40 font-bold text-[10px] flex items-center space-x-1 mx-auto transition-all shadow-glow-green"
                            title="Apply CAD morphing repair to mitigate this failure mode"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>MITIGATE</span>
                          </button>
                        ) : (
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            row.status === 'Mitigated'
                              ? 'bg-laser-green/15 text-laser-green border border-laser-green/30'
                              : 'bg-laser-amber/15 text-laser-amber border border-laser-amber/30'
                          }`}>
                            {row.status === 'Mitigated' && <CheckCircle2 className="w-3 h-3" />}
                            {row.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
