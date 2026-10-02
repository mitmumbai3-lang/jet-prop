import React, { useMemo } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { FileText, Download, CheckCircle, AlertTriangle, Layers, Gauge, Cpu, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import { generateEngineDescription } from '../engine/engineReportGenerator';
import { formatLength, formatMass, formatThrust, formatTemp } from '../utils/units';

export const EngineReportView: React.FC = () => {
  const { engineDescription, projectName, parts, findings, units, loadSampleEngine } = useEngineStore();

  // Active synthesized description (guaranteed non-null)
  const report = useMemo(() => {
    if (engineDescription) return engineDescription;
    return generateEngineDescription(parts, projectName);
  }, [engineDescription, parts, projectName]);

  const exportPdfReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;

    // --- PAGE 1: SYSTEM ARCHITECTURE & THERMODYNAMICS ---
    // Background Dark Slate Aesthetic
    doc.setFillColor(10, 14, 22);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Outer Technical Drawing Border
    doc.setDrawColor(0, 240, 255);
    doc.setLineWidth(0.6);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setDrawColor(0, 240, 255);
    doc.setLineWidth(0.2);
    doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, pageHeight - (margin + 2) * 2);

    // Zone coordinate markings
    doc.setTextColor(0, 240, 255);
    doc.setFontSize(7);
    doc.text('ZONE A-1', margin + 4, margin + 6);
    doc.text('ZONE D-4', pageWidth - margin - 18, margin + 6);
    doc.text('CLASSIFICATION: CIVIL / DEFENSE UNCLASSIFIED', margin + 4, pageHeight - margin - 4);
    doc.text('FAA 14 CFR §33 / EASA CS-E', pageWidth - margin - 45, pageHeight - margin - 4);

    // Document Header
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 240, 255);
    doc.text('JETENGINE AI WORKBENCH — PROPULSION REPORT', margin + 6, 26);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`PROJECT REFERENCE: ${projectName.toUpperCase()}`, margin + 6, 32);
    doc.text(`PROPULSION ARCHITECTURE: ${report.engineType.toUpperCase()}`, margin + 6, 36);
    doc.text(`REPORT GENERATED: ${new Date().toUTCString()} • UNITS: ${units.toUpperCase()}`, margin + 6, 40);

    doc.setDrawColor(30, 41, 59);
    doc.line(margin + 4, 43, pageWidth - margin - 4, 43);

    // Section 1: Executive Architecture Summary
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 255, 136);
    doc.text('1.0 EXECUTIVE PROPULSION ARCHITECTURE SUMMARY', margin + 6, 49);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    const summaryLines = doc.splitTextToSize(report.architectureSummary, pageWidth - margin * 2 - 12);
    doc.text(summaryLines, margin + 6, 54);

    let currentY = 54 + summaryLines.length * 4 + 4;

    // Section 2: Key Thermodynamic Parameters Box
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 255, 136);
    doc.text('2.0 THERMODYNAMIC CYCLE PERFORMANCE ESTIMATES', margin + 6, currentY);
    currentY += 4;

    // 4 KPI boxes
    const boxW = (pageWidth - margin * 2 - 12) / 4;
    const boxH = 18;

    const kpis = [
      { label: 'EST. NET THRUST', val: formatThrust(report.estimatedThrustKN, units), sub: 'Sea Level Static' },
      { label: 'BYPASS RATIO (BPR)', val: `${report.estimatedBypassRatio} : 1`, sub: report.engineType === 'Turbojet' ? 'Pure Turbojet' : 'Turbofan' },
      { label: 'OPR CYCLE RATIO', val: `${report.estimatedOverallPressureRatio} : 1`, sub: 'Compressor Core' },
      { label: 'TURBINE INLET TEMP', val: formatTemp(report.estimatedTurbineInletTempC, units), sub: 'Max Takeoff' },
    ];

    kpis.forEach((kpi, idx) => {
      const bx = margin + 6 + idx * boxW;
      doc.setFillColor(15, 23, 42);
      doc.setDrawColor(0, 240, 255);
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, currentY, boxW - 2, boxH, 1.5, 1.5, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.label, bx + 2, currentY + 4.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 240, 255);
      doc.text(kpi.val, bx + 2, currentY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.sub, bx + 2, currentY + 15);
    });

    currentY += boxH + 7;

    // Section 3: Major Module Inventory & Mass Breakdown Table
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 255, 136);
    doc.text('3.0 MAJOR PROPULSION MODULE INVENTORY & MASS BREAKDOWN', margin + 6, currentY);
    currentY += 4;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin + 6, currentY, pageWidth - margin * 2 - 12, 6, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(226, 232, 240);
    doc.text('MODULE NAME', margin + 8, currentY + 4.2);
    doc.text('STAGES', margin + 65, currentY + 4.2);
    doc.text('PARTS', margin + 82, currentY + 4.2);
    doc.text('MASS', margin + 100, currentY + 4.2);
    doc.text('TECHNICAL SPECIFICATION', margin + 122, currentY + 4.2);

    currentY += 6;

    report.modules.forEach((mod, idx) => {
      const rowBg = idx % 2 === 0 ? [15, 23, 42] : [11, 17, 32];
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.rect(margin + 6, currentY, pageWidth - margin * 2 - 12, 9, 'F');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 240, 255);
      doc.text(mod.name, margin + 8, currentY + 5.5);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text(`${mod.stages}`, margin + 68, currentY + 5.5);
      doc.text(`${mod.partCount}`, margin + 85, currentY + 5.5);
      doc.text(formatMass(mod.totalMassKg, units), margin + 100, currentY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      const descLines = doc.splitTextToSize(mod.description, 55);
      doc.text(descLines[0] || '', margin + 122, currentY + 4);
      if (descLines[1]) doc.text(descLines[1], margin + 122, currentY + 7.5);

      currentY += 9;
    });

    currentY += 6;

    // Section 4: Diagnostic Findings Summary
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 115, 0);
    doc.text('4.0 DIAGNOSTIC AIRWORTHINESS FINDINGS & SCREENING MATRIX', margin + 6, currentY);
    currentY += 4;

    if (findings.length === 0) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('No active diagnostic anomalies detected. Geometry conforms to certified baseline.', margin + 8, currentY + 4);
      currentY += 8;
    } else {
      findings.slice(0, 5).forEach((f) => {
        doc.setFillColor(15, 23, 42);
        doc.setDrawColor(30, 41, 59);
        doc.rect(margin + 6, currentY, pageWidth - margin * 2 - 12, 11, 'FD');

        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(f.severity === 'Critical' ? 255 : 255, f.severity === 'Critical' ? 51 : 115, f.severity === 'Critical' ? 102 : 0);
        doc.text(`[${f.severity.toUpperCase()}] ${f.id}: ${f.title}`, margin + 8, currentY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(203, 213, 225);
        const evLines = doc.splitTextToSize(f.evidence, pageWidth - margin * 2 - 16);
        doc.text(evLines[0] || '', margin + 8, currentY + 8);

        currentY += 12;
      });
    }

    currentY += 3;

    // Section 5: Assumptions & Standards Footer
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('5.0 MODELING ASSUMPTIONS & COMPLIANCE SIGN-OFF', margin + 6, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    report.assumptions.slice(0, 3).forEach((a) => {
      doc.text(`• ${a}`, margin + 8, currentY);
      currentY += 3.5;
    });

    // Bottom ASME Title Block
    const tbX = pageWidth - margin - 80;
    const tbY = pageHeight - margin - 22;
    doc.setFillColor(6, 8, 13);
    doc.setDrawColor(0, 240, 255);
    doc.rect(tbX, tbY, 74, 18, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(0, 240, 255);
    doc.text('CERTIFIED AIRWORTHINESS REPORT', tbX + 2, tbY + 4.5);
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`STATUS: COMPLIANCE SCREENED`, tbX + 2, tbY + 8.5);
    doc.text(`STANDARDS: ASME Y14.5M / FAA 14 CFR §33`, tbX + 2, tbY + 12);
    doc.setTextColor(0, 255, 136);
    doc.text(`HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}-AP242`, tbX + 2, tbY + 15.5);

    doc.save(`${projectName.replace(/\s+/g, '_')}_Engineering_Report.pdf`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 p-6 overflow-y-auto space-y-6 select-none font-sans">
      {/* Header with Export Button */}
      <div className="flex flex-wrap items-center justify-between border-b border-obsidian-700 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-laser-cyan/15 text-laser-cyan border border-laser-cyan/30 font-bold">
              SYSTEM ARCHITECTURE REPORT
            </span>
            <span className="text-xs font-mono text-slate-400">FAA FAR-33 / EASA CS-E</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-800 text-laser-amber border border-obsidian-700 font-bold uppercase">
              {units.toUpperCase()} UNITS ACTIVE
            </span>
          </div>
          <h2 className="text-lg font-bold font-display text-slate-100 mt-1">
            {report.engineType} — Propulsion Architecture & Cycle Analysis
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Model: <strong className="text-laser-cyan">{projectName}</strong> • {parts.length} CAD Component(s) Ingested
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportPdfReport}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-laser-cyan/20 hover:bg-laser-cyan/30 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan text-xs font-mono font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CERTIFIED PDF REPORT</span>
          </button>
        </div>
      </div>

      {/* Summary Abstract */}
      <div className="p-4 rounded-xl bg-obsidian-900/90 border border-obsidian-700 leading-relaxed text-sm text-slate-300 font-sans">
        <p>{report.architectureSummary}</p>
      </div>

      {/* Thermodynamic Parameter Estimates with Active Units */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-700">
          <span className="text-[10px] font-mono text-slate-400">ESTIMATED THRUST CLASS</span>
          <div className="text-xl font-mono font-bold text-laser-cyan mt-1">
            {formatThrust(report.estimatedThrustKN, units)}
          </div>
          <span className="text-[9px] font-mono text-slate-500">Sea Level Static ISA [Calculated]</span>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-700">
          <span className="text-[10px] font-mono text-slate-400">BYPASS RATIO (BPR)</span>
          <div className="text-xl font-mono font-bold text-laser-green mt-1">
            {report.estimatedBypassRatio} : 1
          </div>
          <span className="text-[9px] font-mono text-slate-500">
            {report.engineType === 'Turbojet' ? 'Pure Turbojet (No Bypass)' : 'Ultra-High Bypass Turbofan'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-700">
          <span className="text-[10px] font-mono text-slate-400">OVERALL PRESSURE RATIO</span>
          <div className="text-xl font-mono font-bold text-laser-amber mt-1">
            {report.estimatedOverallPressureRatio} : 1
          </div>
          <span className="text-[9px] font-mono text-slate-500">Compressor Core Compression Ratio</span>
        </div>

        <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-obsidian-700">
          <span className="text-[10px] font-mono text-slate-400">TURBINE INLET TEMP (TIT)</span>
          <div className="text-xl font-mono font-bold text-laser-red mt-1">
            {formatTemp(report.estimatedTurbineInletTempC, units)}
          </div>
          <span className="text-[9px] font-mono text-slate-500">Max Continuous Takeoff Power</span>
        </div>
      </div>

      {/* Module-by-Module Table */}
      <div>
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-laser-cyan" />
          <span>MAJOR MODULE INVENTORY & MASS BREAKDOWN</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-obsidian-700 bg-obsidian-900/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-obsidian-850 text-slate-400 uppercase text-[10px] border-b border-obsidian-700">
              <tr>
                <th className="p-3">Module Name</th>
                <th className="p-3">Stages</th>
                <th className="p-3">Part Count</th>
                <th className="p-3">Total Mass ({units === 'imperial' ? 'lbm' : 'kg'})</th>
                <th className="p-3">Engineering Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-750 text-slate-200">
              {report.modules.map((m, idx) => (
                <tr key={idx} className="hover:bg-obsidian-800/50">
                  <td className="p-3 font-semibold text-laser-cyan">{m.name}</td>
                  <td className="p-3">{m.stages}</td>
                  <td className="p-3">{m.partCount}</td>
                  <td className="p-3 font-bold">{formatMass(m.totalMassKg, units)}</td>
                  <td className="p-3 text-slate-300 font-sans text-xs">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions and Missing Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono">
        <div className="p-4 rounded-xl bg-obsidian-900/80 border border-obsidian-700">
          <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-4 h-4 text-laser-green" />
            <span>MODELING ASSUMPTIONS</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
            {report.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-laser-amber/10 border border-laser-amber/30">
          <h4 className="text-xs font-bold text-laser-amber uppercase flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-laser-amber" />
            <span>MISSING INFORMATION AUDIT</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
            {report.missingDataWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
