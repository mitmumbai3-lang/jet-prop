import React, { useState, useEffect } from 'react';
import { calculateBraytonCycle, checkCampbellResonance, calculateCreepLifeHours } from '../engine/physicsScreening';
import { AEROSPACE_MATERIALS } from '../data/materials';
import { useEngineStore } from '../store/useEngineStore';
import { Flame, Wind, Gauge, AlertTriangle, Zap } from 'lucide-react';
import { formatThrust, formatTemp, formatStress, formatMassFlow, formatSFC } from '../utils/units';

export const PhysicsStudioPage: React.FC = () => {
  const { engineDescription, units, projectName } = useEngineStore();

  const isTurbojet = 
    engineDescription?.engineType.toLowerCase().includes('turbojet') ||
    projectName.toLowerCase().includes('jx') ||
    projectName.toLowerCase().includes('turbojet');

  // Brayton Cycle State
  const [opr, setOpr] = useState<number>(isTurbojet ? 6.4 : 40.0);
  const [tit, setTit] = useState<number>(isTurbojet ? 1253 : 1793);
  const [massFlow, setMassFlow] = useState<number>(isTurbojet ? 2 : 120);

  // Campbell State
  const [bladeFreq, setBladeFreq] = useState<number>(isTurbojet ? 6800 : 4800);
  const [rpm, setRpm] = useState<number>(isTurbojet ? 98000 : 14200);

  // Creep State
  const [selectedMaterial, setSelectedMaterial] = useState<string>(isTurbojet ? 'inconel-718' : 'cmsx-4');
  const [creepTemp, setCreepTemp] = useState<number>(isTurbojet ? 980 : 1050);
  const [creepStress, setCreepStress] = useState<number>(isTurbojet ? 280 : 220);

  // Synchronize when engine description updates
  useEffect(() => {
    if (engineDescription) {
      if (engineDescription.estimatedOverallPressureRatio) {
        setOpr(Math.round(engineDescription.estimatedOverallPressureRatio * 10) / 10);
      }
      if (engineDescription.estimatedTurbineInletTempC) {
        setTit(engineDescription.estimatedTurbineInletTempC + 273);
      }
      if (isTurbojet) {
        setMassFlow(2);
        setRpm(98000);
        setBladeFreq(6800);
        setSelectedMaterial('inconel-718');
        setCreepTemp(980);
      } else {
        setMassFlow(120);
        setRpm(14200);
        setBladeFreq(4800);
        setSelectedMaterial('cmsx-4');
        setCreepTemp(1050);
      }
    }
  }, [engineDescription, isTurbojet]);

  const brayton = calculateBraytonCycle(opr, tit, massFlow);
  const campbell = checkCampbellResonance(bladeFreq, rpm, [20, 24, 32]);
  const creep = calculateCreepLifeHours(creepTemp, creepStress, AEROSPACE_MATERIALS[selectedMaterial]);

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 p-6 overflow-y-auto space-y-6 select-none font-mono">
      {/* Page Header */}
      <div className="border-b border-obsidian-700 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-laser-cyan/15 text-laser-cyan border border-laser-cyan/30 font-bold uppercase">
              HIGH-PRECISION PHYSICS ENGINE
            </span>
            <span className="text-xs text-slate-400">ISA Sea-Level Standard Atmosphere • UNITS: {units.toUpperCase()}</span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-100 mt-1">
            Aerothermal & Structural Screening Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coupled 1D Thermodynamic Brayton Cycle, Rotordynamic Campbell Screener, and Larson-Miller Creep Life.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-obsidian-850 border border-obsidian-700 text-laser-cyan font-bold">
            MODEL: {engineDescription?.engineType.toUpperCase() || 'CFM-LEAP NEXTGEN'}
          </span>
        </div>
      </div>

      {/* Module 1: Brayton Thermodynamic Cycle */}
      <div className="rounded-2xl border border-obsidian-750 bg-obsidian-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-laser-amber" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              1. BRAYTON THERMODYNAMIC PROPULSION CYCLE
            </h2>
          </div>
          <span className="text-xs text-laser-green font-bold">
            THERMAL EFFICIENCY: {brayton.thermalEfficiency}%
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-obsidian-850/60 border border-obsidian-750 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Overall Pressure Ratio (OPR):</span>
              <span className="text-laser-cyan font-bold">{opr}:1</span>
            </div>
            <input
              type="range"
              min={isTurbojet ? 3 : 15}
              max={isTurbojet ? 15 : 60}
              step={isTurbojet ? 0.2 : 1}
              value={opr}
              onChange={(e) => setOpr(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-cyan"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Turbine Inlet Temp (TIT):</span>
              <span className="text-laser-amber font-bold">{tit} K ({formatTemp(tit - 273, units)})</span>
            </div>
            <input
              type="range"
              min="1100"
              max="2100"
              step="10"
              value={tit}
              onChange={(e) => setTit(parseInt(e.target.value))}
              className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-amber"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Core Mass Flow:</span>
              <span className="text-laser-green font-bold">{formatMassFlow(massFlow, units)}</span>
            </div>
            <input
              type="range"
              min={isTurbojet ? 0.5 : 20}
              max={isTurbojet ? 8 : 250}
              step={isTurbojet ? 0.1 : 5}
              value={massFlow}
              onChange={(e) => setMassFlow(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-green"
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-obsidian-850 border border-obsidian-700">
            <span className="text-[10px] text-slate-400">NET THRUST</span>
            <div className="text-lg font-bold text-laser-cyan mt-0.5">
              {formatThrust(brayton.thrustKN, units)}
            </div>
            <span className="text-[9px] text-slate-500">Sea Level Static ISA</span>
          </div>

          <div className="p-3 rounded-xl bg-obsidian-850 border border-obsidian-700">
            <span className="text-[10px] text-slate-400">COMPRESSOR EXIT (T3)</span>
            <div className={`text-lg font-bold mt-0.5 ${brayton.compressorExitTempK > 920 ? 'text-laser-red' : 'text-slate-100'}`}>
              {formatTemp(brayton.compressorExitTempK - 273, units)} ({brayton.compressorExitTempK} K)
            </div>
            <span className="text-[9px] text-slate-500">Ti Fire Limit: 920 K</span>
          </div>

          <div className="p-3 rounded-xl bg-obsidian-850 border border-obsidian-700">
            <span className="text-[10px] text-slate-400">JET VELOCITY (Vj)</span>
            <div className="text-lg font-bold text-laser-green mt-0.5">{brayton.nozzleExitVelocityMps} m/s</div>
            <span className="text-[9px] text-slate-500">Specific Thrust: {brayton.specificThrustNsKg} Ns/kg</span>
          </div>

          <div className="p-3 rounded-xl bg-obsidian-850 border border-obsidian-700">
            <span className="text-[10px] text-slate-400">SPECIFIC FUEL CONSUMPTION</span>
            <div className="text-lg font-bold text-purple-400 mt-0.5">
              {formatSFC(brayton.sfcKgKNs, units)}
            </div>
            <span className="text-[9px] text-slate-500">Combustor LHV 43.1 MJ/kg</span>
          </div>
        </div>

        {brayton.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-laser-amber/10 border border-laser-amber/30 space-y-1 text-xs text-laser-amber">
            {brayton.warnings.map((w, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Module 2: Campbell Diagram Resonance Screening */}
      <div className="rounded-2xl border border-obsidian-750 bg-obsidian-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-laser-cyan" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              2. CAMPBELL DIAGRAM DYNAMIC RESONANCE SCREENER
            </h2>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
            campbell.hasResonanceRisk ? 'bg-laser-red/20 text-laser-red border-laser-red/40' : 'bg-laser-green/20 text-laser-green border-laser-green/40'
          }`}>
            {campbell.hasResonanceRisk ? 'RESONANCE HAZARD DETECTED' : 'OPERATING ENVELOPE SAFE'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>1st Flexural Blade Natural Frequency:</span>
                <span className="text-laser-cyan font-bold">{bladeFreq} Hz</span>
              </div>
              <input
                type="range"
                min={isTurbojet ? 3000 : 1500}
                max={isTurbojet ? 12000 : 8000}
                step="50"
                value={bladeFreq}
                onChange={(e) => setBladeFreq(parseInt(e.target.value))}
                className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Maximum Rotor Speed (100% N2):</span>
                <span className="text-laser-cyan font-bold">{rpm.toLocaleString()} RPM</span>
              </div>
              <input
                type="range"
                min={isTurbojet ? 40000 : 8000}
                max={isTurbojet ? 110000 : 18000}
                step={isTurbojet ? 1000 : 100}
                value={rpm}
                onChange={(e) => setRpm(parseInt(e.target.value))}
                className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-cyan"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-obsidian-850/80 border border-obsidian-700">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2 font-bold">
              Critical Harmonic Intersections
            </span>
            {campbell.criticalHarmonics.length === 0 ? (
              <p className="text-slate-500">No stator passing frequency crossing within ±5% of operating speed.</p>
            ) : (
              <div className="space-y-1.5">
                {campbell.criticalHarmonics.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono p-1.5 rounded bg-obsidian-900 border border-obsidian-800">
                    <span className="text-laser-amber">{h.order}X Engine Order:</span>
                    <span className="text-slate-200">{h.resonanceRpm.toLocaleString()} RPM ({h.speedPercent}% N2)</span>
                    <span className="text-laser-red font-bold text-[10px]">COINCIDENT</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module 3: Larson-Miller Creep Life Rupture */}
      <div className="rounded-2xl border border-obsidian-750 bg-obsidian-900/80 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-laser-green" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              3. LARSON-MILLER PARAMETER CREEP LIFE ESTIMATOR
            </h2>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
            creep.creepRisk === 'Critical' ? 'bg-laser-red/20 text-laser-red border-laser-red/40' :
            creep.creepRisk === 'Moderate' ? 'bg-laser-amber/20 text-laser-amber border-laser-amber/40' :
            'bg-laser-green/20 text-laser-green border-laser-green/40'
          }`}>
            RISK: {creep.creepRisk.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Superalloy Material:</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full bg-obsidian-850 text-laser-cyan rounded-lg p-2 border border-obsidian-700"
            >
              <option value="cmsx-4">CMSX-4 Single Crystal Superalloy</option>
              <option value="inconel-718">Inconel 718 Nickel Superalloy</option>
              <option value="ti-6al-4v">Titanium Ti-6Al-4V</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Operating Temperature:</span>
              <span className="text-laser-amber font-bold">{formatTemp(creepTemp, units)} ({creepTemp + 273} K)</span>
            </div>
            <input
              type="range"
              min="600"
              max="1250"
              value={creepTemp}
              onChange={(e) => setCreepTemp(parseInt(e.target.value))}
              className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-amber"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Applied Centrifugal Stress:</span>
              <span className="text-laser-green font-bold">{formatStress(creepStress, units)}</span>
            </div>
            <input
              type="range"
              min="50"
              max="600"
              value={creepStress}
              onChange={(e) => setCreepStress(parseInt(e.target.value))}
              className="w-full h-1.5 bg-obsidian-700 rounded-lg appearance-none cursor-pointer accent-laser-green"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-850/80 border border-obsidian-700 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Larson-Miller Parameter (LMP):</span>
            <span className="text-laser-cyan font-bold ml-2">{creep.lmp.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">Predicted Rupture Life:</span>
            <span className="text-laser-green font-bold ml-2">{creep.estimatedLifeHours.toLocaleString()} flight hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};
