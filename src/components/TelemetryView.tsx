import React, { useState, useMemo } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  Activity, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Gauge, 
  Flame, 
  Wind, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Info, 
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
  Radio,
  BarChart2,
  ListFilter
} from 'lucide-react';
import { exportCSV } from '../exporters/fileExporters';
import { 
  formatTemp, 
  formatPressure, 
  formatVibration, 
  formatFuelFlow 
} from '../utils/units';

type TelemetryTab = 'charts' | 'table' | 'events' | 'fft' | 'ehm';
type MetricView = 'egt' | 'vibration' | 'spool' | 'fluidics';
type PhaseFilter = 'all' | 'takeoff' | 'climb' | 'cruise' | 'descent';
type SeverityFilter = 'all' | 'anomalies' | 'nominal';

interface FadecEvent {
  id: string;
  timestamp: string;
  ataChapter: string;
  severity: 'CRITICAL' | 'WARNING' | 'CAUTION' | 'INFO';
  title: string;
  details: string;
  parameterImpact: string;
  complianceRule: string;
}

export const TelemetryView: React.FC = () => {
  const { telemetryData, units, projectName, engineType, parts } = useEngineStore();

  const [activeTab, setActiveTab] = useState<TelemetryTab>('charts');
  const [selectedMetric, setSelectedMetric] = useState<MetricView>('egt');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (telemetryData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs space-y-3">
        <Activity className="w-10 h-10 text-slate-600 animate-pulse" />
        <p className="text-slate-300 font-semibold">No Sensor Telemetry Data Loaded</p>
        <p className="max-w-md text-slate-400 text-[11px]">
          Upload a test-cell CSV log, or load a sample propulsion model to stream real-time multi-channel sensor telemetry.
        </p>
      </div>
    );
  }

  // Pre-calculate telemetry statistics
  const latestPt = telemetryData[telemetryData.length - 1];
  const maxEgt = Math.max(...telemetryData.map((d) => d.egt_celsius));
  const minEgtMargin = Math.min(...telemetryData.map((d) => d.egt_margin_celsius));
  const maxVibN2 = Math.max(...telemetryData.map((d) => d.vibration_n2_ips));
  const maxVibN1 = Math.max(...telemetryData.map((d) => d.vibration_n1_ips));
  const avgN2Vib = telemetryData.reduce((acc, d) => acc + d.vibration_n2_ips, 0) / telemetryData.length;
  const avgEgtMargin = telemetryData.reduce((acc, d) => acc + d.egt_margin_celsius, 0) / telemetryData.length;

  // Index of peak N2 vibration anomaly
  const peakAnomalyIndex = useMemo(() => {
    let peakIdx = 0;
    let peakVal = 0;
    telemetryData.forEach((d, i) => {
      if (d.vibration_n2_ips > peakVal) {
        peakVal = d.vibration_n2_ips;
        peakIdx = i;
      }
    });
    return peakIdx;
  }, [telemetryData]);

  // Active sample being inspected (hovered, clicked, or latest)
  const activeInspectedIndex = hoveredPointIndex !== null 
    ? hoveredPointIndex 
    : (selectedSampleIndex !== null ? selectedSampleIndex : telemetryData.length - 1);
  const inspectedPt = telemetryData[activeInspectedIndex] || latestPt;

  // Filtered telemetry records for data table
  const filteredData = useMemo(() => {
    return telemetryData.filter((pt, index) => {
      // Phase filter
      if (phaseFilter !== 'all' && pt.flightPhase !== phaseFilter) {
        return false;
      }
      // Severity filter (exceedance = N2 vib > 0.60 or EGT margin <= 15)
      const isExceedance = pt.vibration_n2_ips > 0.60 || pt.egt_margin_celsius <= 15.0;
      if (severityFilter === 'anomalies' && !isExceedance) {
        return false;
      }
      if (severityFilter === 'nominal' && isExceedance) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matches = 
          pt.timestamp.toLowerCase().includes(q) ||
          pt.flightPhase.toLowerCase().includes(q) ||
          pt.n1_rpm.toString().includes(q) ||
          pt.n2_rpm.toString().includes(q) ||
          pt.egt_celsius.toString().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [telemetryData, phaseFilter, severityFilter, searchQuery]);

  // Export CSV handler
  const handleExportCSV = () => {
    const csvContent = exportCSV(telemetryData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_telemetry_flight_cell_logs.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON handler
  const handleExportJSON = () => {
    const jsonContent = JSON.stringify({
      projectName,
      engineType,
      exportedAt: new Date().toISOString(),
      sampleCount: telemetryData.length,
      sampleRateHz: 0.5,
      flightDurationMinutes: 80,
      statistics: {
        maxEgtCelsius: maxEgt,
        minEgtMarginCelsius: minEgtMargin,
        maxVibrationN2Ips: maxVibN2,
        maxVibrationN1Ips: maxVibN1,
        averageEgtMarginCelsius: Math.round(avgEgtMargin * 10) / 10,
        averageN2VibrationIps: Math.round(avgN2Vib * 100) / 100
      },
      records: telemetryData
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_telemetry_data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Jump to peak anomaly
  const handleJumpToAnomaly = () => {
    setSelectedSampleIndex(peakAnomalyIndex);
    setActiveTab('table');
  };

  // FADEC & ACARS Event Log entries
  const fadecEvents: FadecEvent[] = useMemo(() => [
    {
      id: 'EVT-01',
      timestamp: 'T+00:00',
      ataChapter: 'ATA 72-00',
      severity: 'INFO',
      title: 'FADEC DUAL-CHANNEL HEALTH CHECK NOMINAL',
      details: 'Channel A master in command; Channel B tracking standby. Sensor cross-check variance < 0.2%.',
      parameterImpact: 'Dual EEC Healthy',
      complianceRule: 'FAA 14 CFR §33.28'
    },
    {
      id: 'EVT-02',
      timestamp: 'T+02:15',
      ataChapter: 'ATA 76-10',
      severity: 'INFO',
      title: 'TAKEOFF POWER DETENT ENGAGED (MAX CONTINUOUS)',
      details: 'Thrust Lever Angle (TLA) 78.4°. Fuel metering valve commanded to full takeoff flow.',
      parameterImpact: 'N1: 4,960 RPM | N2: 14,240 RPM',
      complianceRule: 'FAR §33.7 Takeoff Rating'
    },
    {
      id: 'EVT-03',
      timestamp: 'T+18:40',
      ataChapter: 'ATA 77-10',
      severity: 'CAUTION',
      title: 'EGT MARGIN DEGRADATION RATE EXCEEDS CRUISE BASELINE',
      details: 'Step decrease of 4.2°C detected across climb-to-cruise transition. Clearance erosion indicated.',
      parameterImpact: 'EGT Margin: +32.0°C (Baseline: 42.0°C)',
      complianceRule: 'EASA CS-E 740'
    },
    {
      id: 'EVT-04',
      timestamp: 'T+34:10',
      ataChapter: 'ATA 72-52',
      severity: 'WARNING',
      title: '1X N2 ROTOR HARMONIC VIBRATION ADVISORY EXCEEDANCE',
      details: 'Radial vibration velocity exceeded 0.60 IPS threshold. Harmonic 1X signature confirms mass eccentricity on Core Spool.',
      parameterImpact: 'N2 Vib: 0.72 IPS (Advisory Limit: 0.60 IPS)',
      complianceRule: 'ISO 10816-4 Class II'
    },
    {
      id: 'EVT-05',
      timestamp: 'T+52:00',
      ataChapter: 'ATA 72-52',
      severity: 'CRITICAL',
      title: 'PEAK ROTOR UNBALANCE EXCEEDANCE DETECTED',
      details: 'Peak vibration of 1.03 IPS reached at 14,210 RPM during cruise altitude step. High dynamic stress on Bearing #3.',
      parameterImpact: 'N2 Vib: 1.03 IPS (Alert Limit: 1.00 IPS)',
      complianceRule: 'ISO 1940-1 Grade G2.5'
    },
    {
      id: 'EVT-06',
      timestamp: 'T+71:30',
      ataChapter: 'ATA 73-20',
      severity: 'INFO',
      title: 'FLIGHT DESCENT IDLE TRANSITION NOMINAL',
      details: 'Core deceleration slope nominal. Oil scavenge cooling return temperature stabilized at 92.4°C.',
      parameterImpact: 'N1: 2,120 RPM | N2: 7,850 RPM',
      complianceRule: 'FAA 14 CFR §33.89'
    },
    {
      id: 'EVT-07',
      timestamp: 'T+78:00',
      ataChapter: 'ATA 77-20',
      severity: 'WARNING',
      title: 'EGT MARGIN DEPLETION — DISPATCH LIMIT REACHED',
      details: 'EGT margin depleted to +14.1°C, breaching minimum certified dispatch threshold (+15.0°C). Shop maintenance visit required.',
      parameterImpact: 'EGT Margin: +14.1°C (Min Req: > +15.0°C)',
      complianceRule: 'FAA 14 CFR §33.73'
    }
  ], []);

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 p-4 overflow-y-auto space-y-4 select-none font-mono">
      {/* Background Engineering HUD Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

      {/* ========================================================================= */}
      {/* TOP TELEMETRY KPI VITAL CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {/* Card 1: EGT Margin */}
        <div className="p-3.5 rounded-xl bg-obsidian-900/90 border border-laser-amber/40 shadow-glow-amber/10 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold tracking-wider">EGT MARGIN</span>
              <Flame className="w-4 h-4 text-laser-amber" />
            </div>
            <div className="mt-1.5 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-laser-amber">
                +{latestPt.egt_margin_celsius.toFixed(1)}°C
              </span>
              <span className="text-[10px] text-laser-red font-semibold bg-laser-red/10 px-1.5 py-0.5 rounded border border-laser-red/30">
                -66% decay
              </span>
            </div>
            <div className="mt-2 w-full bg-obsidian-950 h-1.5 rounded-full overflow-hidden border border-obsidian-750">
              <div 
                className="h-full bg-gradient-to-r from-laser-red via-laser-amber to-laser-green" 
                style={{ width: `${Math.min(100, Math.max(10, (latestPt.egt_margin_celsius / 45) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-obsidian-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Min: +{minEgtMargin.toFixed(1)}°C</span>
            <span className="text-laser-amber font-bold">Limit: &gt; +15.0°C</span>
          </div>
        </div>

        {/* Card 2: N2 Vibration */}
        <div className="p-3.5 rounded-xl bg-obsidian-900/90 border border-laser-red/40 bg-laser-red/5 shadow-glow-red/10 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold tracking-wider text-laser-red">N2 CORE VIBRATION</span>
              <Activity className="w-4 h-4 text-laser-red animate-pulse" />
            </div>
            <div className="mt-1.5 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-laser-red">
                {latestPt.vibration_n2_ips.toFixed(2)} IPS
              </span>
              <span className="text-[10px] text-slate-300 font-semibold bg-obsidian-950 px-1.5 py-0.5 rounded border border-laser-red/30">
                Peak: {maxVibN2.toFixed(2)} IPS
              </span>
            </div>
            <div className="mt-2 w-full bg-obsidian-950 h-1.5 rounded-full overflow-hidden border border-obsidian-750">
              <div 
                className="h-full bg-laser-red shadow-glow-red" 
                style={{ width: `${Math.min(100, (latestPt.vibration_n2_ips / 1.2) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-obsidian-800 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">ISO 10816 Limit: 0.60 IPS</span>
            <span className="text-laser-red font-bold animate-pulse">HAZARD (e=0.048 mm)</span>
          </div>
        </div>

        {/* Card 3: N1 / N2 Spool Speeds */}
        <div className="p-3.5 rounded-xl bg-obsidian-900/90 border border-obsidian-750 shadow-md backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold tracking-wider">ROTOR SPOOL RPM</span>
              <Gauge className="w-4 h-4 text-laser-cyan" />
            </div>
            <div className="mt-1.5 flex items-baseline space-x-2">
              <span className="text-xl font-black text-slate-100">
                {latestPt.n1_rpm.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xl font-black text-laser-cyan">
                {latestPt.n2_rpm.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-laser-cyan">N1 Fan: 99.2%</span>
              <span className="text-purple-400">N2 Core: 98.8%</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-obsidian-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Envelope: Takeoff Power</span>
            <span className="text-laser-green font-bold">FADEC Nominal</span>
          </div>
        </div>

        {/* Card 4: Oil System & Fluidics */}
        <div className="p-3.5 rounded-xl bg-obsidian-900/90 border border-obsidian-750 shadow-md backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold tracking-wider">LUBRICATION SYSTEM</span>
              <Wind className="w-4 h-4 text-laser-green" />
            </div>
            <div className="mt-1.5 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-laser-green">
                {latestPt.oil_pressure_psi.toFixed(1)} PSI
              </span>
              <span className="text-xs text-slate-400">
                ({latestPt.oil_temp_celsius.toFixed(0)}°C)
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>Scavenge Temp: {latestPt.oil_temp_celsius.toFixed(1)}°C</span>
              <span className="text-laser-green">Delta P: 4.2 PSI</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-obsidian-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Range: 40 - 55 PSI</span>
            <span className="text-laser-green font-bold">No Chip Detected</span>
          </div>
        </div>
      </div>

      {/* Quick Secondary Vital Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-obsidian-900/70 border border-obsidian-800 rounded-xl text-[11px] text-slate-300 relative z-10 flex-wrap gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-laser-green animate-pulse" />
            LIVE TELEMETRY STREAM: <strong className="text-slate-100">{telemetryData.length} SAMPLES</strong> @ 0.5 Hz
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            FUEL FLOW RATE: <strong className="text-laser-cyan">{formatFuelFlow(latestPt.fuel_flow_pph, units)}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            OIL TEMP: <strong className="text-slate-200">{formatTemp(latestPt.oil_temp_celsius, units)}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleJumpToAnomaly}
            className="px-2.5 py-1 rounded bg-laser-red/20 text-laser-red border border-laser-red/40 hover:bg-laser-red/30 transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm"
          >
            <Zap className="w-3 h-3" />
            JUMP TO PEAK ANOMALY (T+52:00)
          </button>
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1 rounded bg-obsidian-950 text-laser-cyan border border-laser-cyan/40 hover:bg-laser-cyan/10 transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm"
            title="Download full flight telemetry dataset as CSV"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1 rounded bg-obsidian-950 text-slate-300 border border-obsidian-700 hover:text-laser-cyan transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm"
            title="Download flight telemetry dataset with metadata as JSON"
          >
            <FileSpreadsheet className="w-3 h-3" />
            JSON
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANOMALY DIAGNOSTIC CORRELATION BANNER */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-xl bg-laser-amber/10 border border-laser-amber/35 flex items-start space-x-3 relative z-10 shadow-lg">
        <AlertTriangle className="w-5 h-5 text-laser-amber flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs text-slate-200 leading-relaxed">
          <strong className="text-laser-amber uppercase tracking-wider mr-2">
            TELEMETRY ANOMALY & CAD CORRELATION MATRIX:
          </strong>
          Significant 1× N2 frequency vibration harmonic detected (peak <span className="text-laser-red font-bold">{maxVibN2.toFixed(2)} IPS</span> at 14,210 RPM). Directly correlates with calculated mass eccentricity <span className="text-laser-cyan font-bold">e = 0.048 mm</span> on Part <span className="text-laser-cyan font-bold">part-shaft-n2</span> exceeding ISO 1940-1 Grade G2.5. Concurrently, accelerated EGT margin erosion (<span className="text-laser-amber font-bold">-0.38°C/cycle</span>) correlates with running tip clearance rub (<span className="text-laser-red font-bold">0.08 mm</span>) and trailing edge wall thinning (<span className="text-laser-red font-bold">0.42 mm</span>) on HPT Stage 1 blisk.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-obsidian-800 pb-2 relative z-10 flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 bg-obsidian-900/90 p-1 rounded-xl border border-obsidian-750">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'charts'
                ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            SENSOR TIME-SERIES
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-laser-amber/20 text-laser-amber border border-laser-amber/40 shadow-glow-amber'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            TELEMETRY STREAM LOG ({filteredData.length})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-laser-red/20 text-laser-red border border-laser-red/40 shadow-glow-red'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            FADEC & ACARS EVENT RECORDER
          </button>

          <button
            onClick={() => setActiveTab('fft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fft'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            FFT VIBRATION SPECTRUM
          </button>

          <button
            onClick={() => setActiveTab('ehm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ehm'
                ? 'bg-laser-green/20 text-laser-green border border-laser-green/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            ENGINE HEALTH MONITORING (EHM)
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-laser-cyan" />
          <span>FLIGHT TIME: <strong className="text-slate-200">T+00:00 to T+80:00</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SENSOR TIME-SERIES VISUALIZER */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="flex-1 min-h-[460px] rounded-2xl border border-obsidian-700/80 bg-obsidian-900/70 backdrop-blur-md p-4 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-tech-grid opacity-25 pointer-events-none" />

          {/* Metric Selector Toolbar & HUD Channel Legend */}
          <div className="flex items-center justify-between mb-3 z-10 flex-wrap gap-2">
            <div className="flex items-center space-x-1 bg-obsidian-950 p-1 rounded-xl border border-obsidian-750">
              <button
                onClick={() => setSelectedMetric('egt')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  selectedMetric === 'egt'
                    ? 'bg-laser-amber/20 text-laser-amber border border-laser-amber/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EGT MARGIN DECAY (°C)
              </button>
              <button
                onClick={() => setSelectedMetric('vibration')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  selectedMetric === 'vibration'
                    ? 'bg-laser-red/20 text-laser-red border border-laser-red/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                VIBRATION SPECTRUM (N1 vs N2)
              </button>
              <button
                onClick={() => setSelectedMetric('spool')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  selectedMetric === 'spool'
                    ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ROTOR SPOOL RPM
              </button>
              <button
                onClick={() => setSelectedMetric('fluidics')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  selectedMetric === 'fluidics'
                    ? 'bg-laser-green/20 text-laser-green border border-laser-green/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LUBRICATION & FUEL FLOW
              </button>
            </div>

            {/* Hover Inspector Tooltip Strip */}
            <div className="flex items-center space-x-3 text-xs bg-obsidian-950 px-3 py-1 rounded-xl border border-obsidian-750">
              <span className="text-slate-400">INSPECT POINT [{inspectedPt.timestamp}]:</span>
              <span className="text-laser-cyan font-bold">{inspectedPt.flightPhase.toUpperCase()}</span>
              {selectedMetric === 'egt' && (
                <span className="text-laser-amber font-bold">
                  Margin: +{inspectedPt.egt_margin_celsius.toFixed(1)}°C (EGT {inspectedPt.egt_celsius}°C)
                </span>
              )}
              {selectedMetric === 'vibration' && (
                <span className="text-laser-red font-bold">
                  N2 Vib: {inspectedPt.vibration_n2_ips.toFixed(2)} IPS | N1: {inspectedPt.vibration_n1_ips.toFixed(2)} IPS
                </span>
              )}
              {selectedMetric === 'spool' && (
                <span className="text-slate-200 font-bold">
                  N1: {inspectedPt.n1_rpm} RPM | N2: {inspectedPt.n2_rpm} RPM
                </span>
              )}
              {selectedMetric === 'fluidics' && (
                <span className="text-laser-green font-bold">
                  Oil: {inspectedPt.oil_pressure_psi.toFixed(1)} PSI | Fuel: {formatFuelFlow(inspectedPt.fuel_flow_pph, units)}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Multi-Channel SVG Chart */}
          <div 
            className="flex-1 w-full relative min-h-[280px]"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            <svg 
              viewBox="0 0 800 240" 
              className="w-full h-full overflow-visible"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, (mouseX - 10) / (rect.width - 20)));
                const idx = Math.round(ratio * (telemetryData.length - 1));
                setHoveredPointIndex(idx);
              }}
              onClick={() => {
                if (hoveredPointIndex !== null) {
                  setSelectedSampleIndex(hoveredPointIndex);
                }
              }}
            >
              <defs>
                <linearGradient id="egtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7300" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ff7300" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff3366" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ff3366" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 90, 140, 190].map((y) => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="4 4" />
              ))}

              {/* Flight Phase Background Band Dividers */}
              <line x1="120" y1="20" x2="120" y2="230" stroke="rgba(0, 240, 255, 0.15)" strokeDasharray="2 4" />
              <line x1="280" y1="20" x2="280" y2="230" stroke="rgba(0, 240, 255, 0.15)" strokeDasharray="2 4" />
              <line x1="680" y1="20" x2="680" y2="230" stroke="rgba(0, 240, 255, 0.15)" strokeDasharray="2 4" />

              {/* 1. METRIC: EGT MARGIN DECAY */}
              {selectedMetric === 'egt' && (
                <>
                  {/* Clean Baseline Line (45°C) */}
                  <line x1="0" y1="40" x2="800" y2="40" stroke="#00ff88" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
                  <text x="700" y="35" fill="#00ff88" fontSize="9" fontFamily="monospace">CLEAN BASELINE: +45°C</text>

                  {/* 15°C Alert Threshold Line */}
                  <line x1="0" y1="180" x2="800" y2="180" stroke="#ff3366" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.9" />
                  <text x="690" y="175" fill="#ff3366" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    FAA DISPATCH LIMIT: +15.0°C
                  </text>

                  {/* EGT Margin Filled Area */}
                  <polygon
                    fill="url(#egtGrad)"
                    points={`10,220 ${telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 210 - ((d.egt_margin_celsius - 10) / 40) * 180;
                      return `${x},${y}`;
                    }).join(' ')} 790,220`}
                  />

                  {/* EGT Margin Curve */}
                  <polyline
                    fill="none"
                    stroke="#ff7300"
                    strokeWidth="2.5"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 210 - ((d.egt_margin_celsius - 10) / 40) * 180;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Points on curve */}
                  {telemetryData.map((d, i) => {
                    const x = (i / (telemetryData.length - 1)) * 780 + 10;
                    const y = 210 - ((d.egt_margin_celsius - 10) / 40) * 180;
                    const isBelowLimit = d.egt_margin_celsius <= 15.0;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={activeInspectedIndex === i ? 5 : isBelowLimit ? 4 : 2.5}
                        fill={isBelowLimit ? '#ff3366' : '#ff7300'}
                        stroke="#0b0e14"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </>
              )}

              {/* 2. METRIC: VIBRATION SPECTRUM */}
              {selectedMetric === 'vibration' && (
                <>
                  {/* 0.60 IPS Advisory Limit */}
                  <line x1="0" y1="125" x2="800" y2="125" stroke="#ff7300" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
                  <text x="680" y="120" fill="#ff7300" fontSize="9" fontFamily="monospace">ADVISORY: 0.60 IPS</text>

                  {/* 1.00 IPS Alert Limit */}
                  <line x1="0" y1="65" x2="800" y2="65" stroke="#ff3366" strokeWidth="1.5" strokeDasharray="6 3" />
                  <text x="680" y="60" fill="#ff3366" fontSize="9" fontFamily="monospace" fontWeight="bold">ALERT: 1.00 IPS</text>

                  {/* N2 Vibration Area */}
                  <polygon
                    fill="url(#vibGrad)"
                    points={`10,220 ${telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - (d.vibration_n2_ips / 1.3) * 190;
                      return `${x},${y}`;
                    }).join(' ')} 790,220`}
                  />

                  {/* N1 Vibration Curve */}
                  <polyline
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="1.8"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - (d.vibration_n1_ips / 1.3) * 190;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* N2 Vibration Curve */}
                  <polyline
                    fill="none"
                    stroke="#ff3366"
                    strokeWidth="2.8"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - (d.vibration_n2_ips / 1.3) * 190;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Points on curve */}
                  {telemetryData.map((d, i) => {
                    const x = (i / (telemetryData.length - 1)) * 780 + 10;
                    const y = 220 - (d.vibration_n2_ips / 1.3) * 190;
                    const isExceed = d.vibration_n2_ips > 0.60;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={activeInspectedIndex === i ? 6 : isExceed ? 4 : 2.5}
                        fill={isExceed ? '#ff3366' : '#ff7300'}
                        stroke="#0b0e14"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </>
              )}

              {/* 3. METRIC: SPOOL RPM */}
              {selectedMetric === 'spool' && (
                <>
                  {/* N2 Spool Curve */}
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - ((d.n2_rpm - 6000) / 9500) * 190;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* N1 Spool Curve */}
                  <polyline
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="2.2"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - ((d.n1_rpm - 1500) / 4000) * 190;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {telemetryData.map((d, i) => {
                    const x = (i / (telemetryData.length - 1)) * 780 + 10;
                    const y = 220 - ((d.n2_rpm - 6000) / 9500) * 190;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={activeInspectedIndex === i ? 5 : 2.5}
                        fill="#a855f7"
                        stroke="#0b0e14"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </>
              )}

              {/* 4. METRIC: LUBRICATION & FUEL FLOW */}
              {selectedMetric === 'fluidics' && (
                <>
                  {/* Fuel Flow Curve */}
                  <polyline
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="2.2"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - ((d.fuel_flow_pph - 800) / 4600) * 190;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Oil Temp Curve */}
                  <polyline
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    points={telemetryData.map((d, i) => {
                      const x = (i / (telemetryData.length - 1)) * 780 + 10;
                      const y = 220 - ((d.oil_temp_celsius - 80) / 40) * 190;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                </>
              )}

              {/* Active Inspected Hover Crosshair Line */}
              {activeInspectedIndex !== null && (
                <g>
                  <line
                    x1={(activeInspectedIndex / (telemetryData.length - 1)) * 780 + 10}
                    y1="10"
                    x2={(activeInspectedIndex / (telemetryData.length - 1)) * 780 + 10}
                    y2="230"
                    stroke="#00f0ff"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity="0.8"
                  />
                  <circle
                    cx={(activeInspectedIndex / (telemetryData.length - 1)) * 780 + 10}
                    cy="12"
                    r="4"
                    fill="#00f0ff"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* X-Axis Flight Phase Annotations */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-obsidian-800">
            <span className="font-bold text-slate-300">TAKEOFF (0-15m)</span>
            <span className="font-bold text-slate-300">CLIMB (15-35m)</span>
            <span className="font-bold text-laser-cyan">STEADY CRUISE (35-70m)</span>
            <span className="font-bold text-slate-300">DESCENT (70-80m)</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TELEMETRY STREAM LOG (DATA TABLE) */}
      {/* ========================================================================= */}
      {activeTab === 'table' && (
        <div className="flex-1 rounded-2xl border border-obsidian-750 bg-obsidian-900/80 backdrop-blur-md p-4 flex flex-col space-y-3 relative shadow-xl">
          {/* Table Filters & Search Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search timestamp, phase, or sensor readings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-obsidian-950 border border-obsidian-750 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-laser-cyan"
                />
              </div>

              {/* Phase Filter */}
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value as PhaseFilter)}
                className="bg-obsidian-950 border border-obsidian-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-laser-cyan"
              >
                <option value="all">ALL PHASES</option>
                <option value="takeoff">TAKEOFF</option>
                <option value="climb">CLIMB</option>
                <option value="cruise">CRUISE</option>
                <option value="descent">DESCENT</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="bg-obsidian-950 border border-obsidian-750 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-laser-cyan"
              >
                <option value="all">ALL LOGS</option>
                <option value="anomalies">ANOMALIES & EXCEEDANCES ONLY</option>
                <option value="nominal">NOMINAL ONLY</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-400">
              Showing <strong className="text-laser-cyan">{filteredData.length}</strong> of {telemetryData.length} records
            </div>
          </div>

          {/* High-Density Tabular Telemetry Stream */}
          <div className="overflow-x-auto border border-obsidian-800 rounded-xl max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-950/90 text-slate-400 sticky top-0 border-b border-obsidian-800 uppercase text-[10px] tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">PHASE</th>
                  <th className="py-2.5 px-3">N1 FAN (RPM)</th>
                  <th className="py-2.5 px-3">N2 CORE (RPM)</th>
                  <th className="py-2.5 px-3">EGT (°C)</th>
                  <th className="py-2.5 px-3">EGT MARGIN</th>
                  <th className="py-2.5 px-3">N1 VIB (IPS)</th>
                  <th className="py-2.5 px-3">N2 VIB (IPS)</th>
                  <th className="py-2.5 px-3">OIL PRESS</th>
                  <th className="py-2.5 px-3">FUEL FLOW</th>
                  <th className="py-2.5 px-3">HEALTH STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-800/60 font-mono">
                {filteredData.map((pt, index) => {
                  const isHighVib = pt.vibration_n2_ips > 0.60;
                  const isCriticalVib = pt.vibration_n2_ips >= 1.00;
                  const isLowMargin = pt.egt_margin_celsius <= 15.0;
                  const isSelected = selectedSampleIndex === index;

                  return (
                    <tr
                      key={index}
                      onClick={() => setSelectedSampleIndex(index)}
                      className={`hover:bg-obsidian-800/50 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-laser-cyan/10 border-l-2 border-laser-cyan' 
                          : isCriticalVib 
                            ? 'bg-laser-red/10' 
                            : isLowMargin 
                              ? 'bg-laser-amber/10' 
                              : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500 text-[10px]">{String(index + 1).padStart(2, '0')}</td>
                      <td className="py-2 px-3 font-bold text-slate-200">{pt.timestamp}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          pt.flightPhase === 'takeoff'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : pt.flightPhase === 'climb'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : pt.flightPhase === 'cruise'
                                ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/30'
                                : 'bg-slate-700 text-slate-300'
                        }`}>
                          {pt.flightPhase}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-200">{pt.n1_rpm.toLocaleString()}</td>
                      <td className="py-2 px-3 font-semibold text-laser-cyan">{pt.n2_rpm.toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-200">{pt.egt_celsius}°C</td>
                      <td className="py-2 px-3">
                        <span className={`font-bold ${
                          pt.egt_margin_celsius > 25 
                            ? 'text-laser-green' 
                            : pt.egt_margin_celsius > 15 
                              ? 'text-laser-amber' 
                              : 'text-laser-red animate-pulse'
                        }`}>
                          +{pt.egt_margin_celsius.toFixed(1)}°C
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">{pt.vibration_n1_ips.toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          isCriticalVib
                            ? 'bg-laser-red/30 text-laser-red border border-laser-red/60 animate-pulse'
                            : isHighVib
                              ? 'bg-laser-red/15 text-laser-red border border-laser-red/30'
                              : 'text-slate-300'
                        }`}>
                          {pt.vibration_n2_ips.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">{pt.oil_pressure_psi.toFixed(1)} PSI</td>
                      <td className="py-2 px-3 text-slate-300">{formatFuelFlow(pt.fuel_flow_pph, units)}</td>
                      <td className="py-2 px-3">
                        {isCriticalVib ? (
                          <span className="text-[10px] text-laser-red font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ALERT: 1X VIB SPIKE
                          </span>
                        ) : isLowMargin ? (
                          <span className="text-[10px] text-laser-amber font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> WARN: EGT MARGIN
                          </span>
                        ) : isHighVib ? (
                          <span className="text-[10px] text-laser-amber flex items-center gap-1">
                            <Info className="w-3 h-3" /> CAUTION: N2 VIB
                          </span>
                        ) : (
                          <span className="text-[10px] text-laser-green flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> NOMINAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FADEC & ACARS EVENT RECORDER */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        <div className="flex-1 rounded-2xl border border-obsidian-750 bg-obsidian-900/80 backdrop-blur-md p-4 flex flex-col space-y-3 relative shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-obsidian-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-laser-amber" />
              <span className="text-xs font-bold text-slate-200">
                FADEC ELECTRONIC ENGINE CONTROLLER (EEC) & ACARS EVENT RECORDER
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              FAA 14 CFR §33.28 / AC 33.28-1 Compliant
            </span>
          </div>

          <div className="space-y-2.5">
            {fadecEvents.map((evt) => (
              <div 
                key={evt.id}
                className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                  evt.severity === 'CRITICAL'
                    ? 'bg-laser-red/10 border-laser-red/40'
                    : evt.severity === 'WARNING'
                      ? 'bg-laser-amber/10 border-laser-amber/40'
                      : evt.severity === 'CAUTION'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-obsidian-950/80 border-obsidian-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {evt.severity === 'CRITICAL' ? (
                      <span className="px-2 py-0.5 rounded bg-laser-red/30 text-laser-red border border-laser-red/60 text-[10px] font-bold">
                        CRITICAL
                      </span>
                    ) : evt.severity === 'WARNING' ? (
                      <span className="px-2 py-0.5 rounded bg-laser-amber/20 text-laser-amber border border-laser-amber/40 text-[10px] font-bold">
                        WARNING
                      </span>
                    ) : evt.severity === 'CAUTION' ? (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] font-bold">
                        CAUTION
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 text-[10px] font-bold">
                        INFO
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-200">{evt.title}</span>
                      <span className="text-[10px] text-slate-400">[{evt.timestamp}]</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-obsidian-850 text-slate-300 border border-obsidian-750">
                        {evt.ataChapter}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{evt.details}</p>
                  </div>
                </div>

                <div className="text-right text-[11px] flex-shrink-0 md:border-l md:border-obsidian-800 md:pl-4">
                  <div className="text-slate-300 font-semibold">{evt.parameterImpact}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{evt.complianceRule}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FFT VIBRATION SPECTRUM & HARMONICS */}
      {/* ========================================================================= */}
      {activeTab === 'fft' && (
        <div className="flex-1 rounded-2xl border border-obsidian-750 bg-obsidian-900/80 backdrop-blur-md p-4 flex flex-col space-y-4 relative shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-obsidian-800">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">
                ROTORDYNAMICS FFT SPECTRUM & 1X HARMONIC FREQUENCY DECOMPOSITION
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              ISO 10816-4 / ISO 1940-1 Rotordynamic Analysis
            </span>
          </div>

          {/* FFT Spectrum SVG Graphic */}
          <div className="w-full h-[260px] bg-obsidian-950 rounded-xl border border-obsidian-800 p-3 relative">
            <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible">
              {/* Frequency grid */}
              {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((f, i) => (
                <line key={f} x1={70 + i * 65} y1="20" x2={70 + i * 65} y2="180" stroke="rgba(255, 255, 255, 0.05)" />
              ))}
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="70" y1={y} x2="720" y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
              ))}

              {/* ISO 10816 Class II Limit (0.44 IPS) */}
              <line x1="70" y1="110" x2="720" y2="110" stroke="#ff7300" strokeWidth="1" strokeDasharray="4 4" />
              <text x="600" y="105" fill="#ff7300" fontSize="9" fontFamily="monospace">ISO 10816-4 LIMIT: 0.44 IPS</text>

              {/* Alert Trip Limit (1.00 IPS) */}
              <line x1="70" y1="50" x2="720" y2="50" stroke="#ff3366" strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="610" y="45" fill="#ff3366" fontSize="9" fontFamily="monospace" fontWeight="bold">ALERT TRIP: 1.00 IPS</text>

              {/* FFT Spectrum Curve */}
              <path
                d="M 70 180 Q 120 178, 140 180 L 170 180 L 180 120 L 190 180 L 290 180 L 320 180 L 330 45 L 340 180 L 480 180 L 500 135 L 515 180 L 650 180 L 660 160 L 670 180 L 720 180"
                fill="rgba(168, 85, 247, 0.12)"
                stroke="#a855f7"
                strokeWidth="2.5"
              />

              {/* Peak 1: 1X N1 Fan Peak (86.7 Hz) */}
              <circle cx="180" cy="120" r="4" fill="#00f0ff" />
              <text x="145" y="105" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                1× N1 (86.7 Hz)
              </text>
              <text x="160" y="115" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                0.24 IPS
              </text>

              {/* Peak 2: 1X N2 Core Unbalance (236.7 Hz) */}
              <circle cx="330" cy="45" r="5" fill="#ff3366" className="animate-pulse" />
              <line x1="330" y1="45" x2="330" y2="25" stroke="#ff3366" strokeWidth="1.5" />
              <text x="280" y="18" fill="#ff3366" fontSize="10" fontFamily="monospace" fontWeight="bold">
                1× N2 CORE UNBALANCE (236.7 Hz): 1.03 IPS
              </text>

              {/* Peak 3: 2X N2 Misalignment (473.4 Hz) */}
              <circle cx="505" cy="135" r="4" fill="#ff7300" />
              <text x="475" y="122" fill="#ff7300" fontSize="9" fontFamily="monospace">
                2× N2 (473.4 Hz): 0.36 IPS
              </text>

              {/* Axes */}
              <line x1="70" y1="180" x2="720" y2="180" stroke="#00f0ff" strokeWidth="1.2" />
              <line x1="70" y1="20" x2="70" y2="180" stroke="#00f0ff" strokeWidth="1.2" />

              {/* Frequency Axis Ticks */}
              <text x="65" y="195" fill="#94a3b8" fontSize="9">0 Hz</text>
              <text x="170" y="195" fill="#94a3b8" fontSize="9">100 Hz</text>
              <text x="320" y="195" fill="#94a3b8" fontSize="9">250 Hz</text>
              <text x="495" y="195" fill="#94a3b8" fontSize="9">500 Hz</text>
            </svg>
          </div>

          {/* Rotordynamic Physics Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-obsidian-950 rounded-xl border border-obsidian-800 text-xs">
              <div className="text-laser-amber font-bold mb-1">CENTRIFUGAL UNBALANCE FORCE EQUATION:</div>
              <div className="p-2 bg-obsidian-900 rounded font-mono text-[11px] text-slate-200">
                F_unbal = m · e · ω² = (14.2 kg) · (0.048 mm) · (1488 rad/s)² = 2,840 N
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Dynamic unbalance produces a rotating radial force of 2.84 kN at 14,210 RPM transmitted into Bearing #3, causing accelerated raceway spalling and high vibration.
              </p>
            </div>

            <div className="p-3 bg-obsidian-950 rounded-xl border border-obsidian-800 text-xs">
              <div className="text-laser-cyan font-bold mb-1">PROPOSED ROTORDYNAMIC REMEDIATION:</div>
              <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside mt-1">
                <li>Attach 2.4 g balance trim weight at 142° azimuth on Stage 2 balancing plane.</li>
                <li>Reduces residual unbalance from e = 0.048 mm to &lt; 0.008 mm.</li>
                <li>Brings vibration below ISO 1940-1 Grade G2.5 limit (&lt; 0.28 IPS).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ENGINE HEALTH MONITORING (EHM) & STATISTICAL TRENDS */}
      {/* ========================================================================= */}
      {activeTab === 'ehm' && (
        <div className="flex-1 rounded-2xl border border-obsidian-750 bg-obsidian-900/80 backdrop-blur-md p-4 flex flex-col space-y-4 relative shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-obsidian-800">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-laser-green" />
              <span className="text-xs font-bold text-slate-200">
                ENGINE HEALTH MONITORING (EHM) & REMAINING USEFUL LIFE (RUL)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              ICAO Annex 16 / FAA AC 33.28 Prognostics
            </span>
          </div>

          {/* Statistical Summary Matrix */}
          <div className="overflow-x-auto border border-obsidian-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">SENSOR CHANNEL</th>
                  <th className="py-2.5 px-3">BASELINE</th>
                  <th className="py-2.5 px-3">MIN RECORDED</th>
                  <th className="py-2.5 px-3">MEAN</th>
                  <th className="py-2.5 px-3">PEAK EXTREME</th>
                  <th className="py-2.5 px-3">STD DEV (σ)</th>
                  <th className="py-2.5 px-3">CERT LIMIT</th>
                  <th className="py-2.5 px-3">HEALTH VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-800/60 font-mono text-[11px]">
                <tr className="hover:bg-obsidian-800/40">
                  <td className="py-2.5 px-3 font-bold text-laser-amber">EGT Margin (°C)</td>
                  <td className="py-2.5 px-3 text-slate-300">+45.0°C</td>
                  <td className="py-2.5 px-3 text-laser-red font-bold">+{minEgtMargin.toFixed(1)}°C</td>
                  <td className="py-2.5 px-3 text-slate-200">+{avgEgtMargin.toFixed(1)}°C</td>
                  <td className="py-2.5 px-3 text-slate-200">+{Math.max(...telemetryData.map(d => d.egt_margin_celsius)).toFixed(1)}°C</td>
                  <td className="py-2.5 px-3 text-slate-400">±8.4°C</td>
                  <td className="py-2.5 px-3 text-slate-300">&gt; +15.0°C</td>
                  <td className="py-2.5 px-3 text-laser-red font-bold">⚠️ EXCEEDANCE (14.1°C)</td>
                </tr>

                <tr className="hover:bg-obsidian-800/40">
                  <td className="py-2.5 px-3 font-bold text-laser-red">N2 Core Vibration</td>
                  <td className="py-2.5 px-3 text-slate-300">0.25 IPS</td>
                  <td className="py-2.5 px-3 text-slate-300">{Math.min(...telemetryData.map(d => d.vibration_n2_ips)).toFixed(2)} IPS</td>
                  <td className="py-2.5 px-3 text-slate-200">{avgN2Vib.toFixed(2)} IPS</td>
                  <td className="py-2.5 px-3 text-laser-red font-bold">{maxVibN2.toFixed(2)} IPS</td>
                  <td className="py-2.5 px-3 text-slate-400">±0.22 IPS</td>
                  <td className="py-2.5 px-3 text-slate-300">&lt; 0.60 IPS</td>
                  <td className="py-2.5 px-3 text-laser-red font-bold">❌ NON-COMPLIANT</td>
                </tr>

                <tr className="hover:bg-obsidian-800/40">
                  <td className="py-2.5 px-3 font-bold text-laser-cyan">N1 Fan Vibration</td>
                  <td className="py-2.5 px-3 text-slate-300">0.20 IPS</td>
                  <td className="py-2.5 px-3 text-slate-300">{Math.min(...telemetryData.map(d => d.vibration_n1_ips)).toFixed(2)} IPS</td>
                  <td className="py-2.5 px-3 text-slate-200">0.24 IPS</td>
                  <td className="py-2.5 px-3 text-slate-200">{maxVibN1.toFixed(2)} IPS</td>
                  <td className="py-2.5 px-3 text-slate-400">±0.03 IPS</td>
                  <td className="py-2.5 px-3 text-slate-300">&lt; 0.40 IPS</td>
                  <td className="py-2.5 px-3 text-laser-green font-bold">✅ NOMINAL</td>
                </tr>

                <tr className="hover:bg-obsidian-800/40">
                  <td className="py-2.5 px-3 font-bold text-laser-green">Oil Pressure (PSI)</td>
                  <td className="py-2.5 px-3 text-slate-300">48.0 PSI</td>
                  <td className="py-2.5 px-3 text-slate-300">{Math.min(...telemetryData.map(d => d.oil_pressure_psi)).toFixed(1)} PSI</td>
                  <td className="py-2.5 px-3 text-slate-200">48.4 PSI</td>
                  <td className="py-2.5 px-3 text-slate-200">{Math.max(...telemetryData.map(d => d.oil_pressure_psi)).toFixed(1)} PSI</td>
                  <td className="py-2.5 px-3 text-slate-400">±0.8 PSI</td>
                  <td className="py-2.5 px-3 text-slate-300">40 - 55 PSI</td>
                  <td className="py-2.5 px-3 text-laser-green font-bold">✅ NOMINAL</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remaining Useful Life & Maintenance Forecast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-obsidian-950 rounded-xl border border-obsidian-800 text-xs">
              <div className="text-laser-amber font-bold mb-1">EGT MARGIN DECAY PROGNOSIS (RUL):</div>
              <p className="text-[11px] text-slate-300">
                Linear trend analysis shows a margin decay rate of <strong className="text-laser-red">-0.38°C per flight cycle</strong>.
              </p>
              <div className="mt-2 p-2 bg-obsidian-900 rounded font-mono text-[11px] text-slate-200">
                Projected Cycles to Zero-Margin: <strong className="text-laser-amber">38.4 Cycles</strong> (~3.2 Weeks of Operation)
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Recommended Action: Priority shop visit scheduled. Perform HPT Stage 1 nozzle guide vane wash and tip shroud rub strip replacement.
              </p>
            </div>

            <div className="p-3.5 bg-obsidian-950 rounded-xl border border-obsidian-800 text-xs">
              <div className="text-laser-cyan font-bold mb-1">ROTOR DYNAMICS PROGNOSIS:</div>
              <p className="text-[11px] text-slate-300">
                1X N2 core harmonic vibration (<strong className="text-laser-red">1.03 IPS peak</strong>) will reduce Bearing #3 L10h fatigue life by <strong className="text-laser-red">72%</strong>.
              </p>
              <div className="mt-2 p-2 bg-obsidian-900 rounded font-mono text-[11px] text-slate-200">
                Bearing #3 L10h Life Remaining: <strong className="text-laser-amber">410 Hours</strong> (vs 15,000h nominal)
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Recommended Action: Execute auto-repair CAD fix &apos;FIX-ROTOR-BAL-01&apos; to re-center mass centerline within ±0.005 mm.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
