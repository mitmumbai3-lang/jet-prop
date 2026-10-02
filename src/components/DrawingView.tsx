import React, { useState, useRef, useMemo } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Compass, 
  Layers, 
  Hand, 
  Maximize2, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { formatLength } from '../utils/units';
import { Finding, UnitsSystem, EngineDescription } from '../types';

type ToolMode = 'pan' | 'zoom-in' | 'zoom-out';
type LayerType = 'all' | 'geometry' | 'dimensions' | 'tolerances';

export const DrawingView: React.FC = () => {
  const { parts, selectedPartId, selectPart, findings, units, engineDescription } = useEngineStore();

  // Active component selection
  const currentPart = useMemo(() => {
    if (selectedPartId) {
      const found = parts.find((p) => p.id === selectedPartId);
      if (found) return found;
    }
    return parts[0] || null;
  }, [parts, selectedPartId]);

  // Viewport navigation & transformation state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [toolMode, setToolMode] = useState<ToolMode>('pan');
  const [activeLayer, setActiveLayer] = useState<LayerType>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset view to 100% centered
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Cursor-centered zoom helper
  const zoomAtPoint = (clientX: number, clientY: number, factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(0.35, prevZoom * factor), 7.0);
      const ratio = newZoom / prevZoom;

      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * ratio,
        y: mouseY - (mouseY - prevPan.y) * ratio,
      }));

      return newZoom;
    });
  };

  // Viewport center zoom helper (for on-screen +/- buttons)
  const zoomAtCenter = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    zoomAtPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  };

  // Wheel zoom centered directly at cursor coordinate
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    zoomAtPoint(e.clientX, e.clientY, factor);
  };

  // Canvas Mouse Down: pan or click-to-zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click

    if (toolMode === 'zoom-in' || (toolMode === 'pan' && e.ctrlKey)) {
      zoomAtPoint(e.clientX, e.clientY, 1.4);
      return;
    }

    if (toolMode === 'zoom-out' || (toolMode === 'pan' && (e.altKey || e.shiftKey))) {
      zoomAtPoint(e.clientX, e.clientY, 1 / 1.4);
      return;
    }

    // Start panning
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click anywhere to zoom in towards cursor
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    zoomAtPoint(e.clientX, e.clientY, 1.6);
  };

  // Findings specific to current component (or all findings if full engine)
  const currentFindings = useMemo(() => {
    if (!currentPart) return findings;
    const partFindings = findings.filter((f) => f.affectedPartIds.includes(currentPart.id));
    if (partFindings.length === 0 && currentPart.category === 'unclassified') {
      return findings; // For full engine assembly show all findings
    }
    return partFindings;
  }, [currentPart, findings]);

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 p-4 select-none relative overflow-hidden font-mono">
      {/* Background Engineering HUD Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />

      {/* Blueprint Top Navigation & Interactive Tool Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between z-10 mb-3 bg-obsidian-900/90 p-2.5 rounded-xl border border-obsidian-750 backdrop-blur-md gap-2 shadow-lg">
        {/* Left: Active Component Selector */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-laser-amber animate-pulse" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
              BLUEPRINT VIEW:
            </span>
          </div>

          <div className="relative inline-block">
            <select
              value={currentPart?.id || ''}
              onChange={(e) => selectPart(e.target.value)}
              className="bg-obsidian-950 text-xs font-bold text-laser-cyan border border-laser-cyan/40 rounded-lg px-2.5 py-1 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-laser-cyan shadow-glow-cyan"
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id} className="bg-obsidian-900 text-slate-100">
                  {p.name} ({p.category.toUpperCase().replace('_', ' ')})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-laser-cyan absolute right-2 top-2 pointer-events-none" />
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded bg-obsidian-800 text-slate-300 border border-obsidian-700">
            SCALE 1:2.5 • ASME Y14.5M • UNITS: {units.toUpperCase()}
          </span>

          {currentFindings.length > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-laser-red/20 text-laser-red border border-laser-red/40 font-bold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {currentFindings.length} DEFECT ANNOTATIONS
            </span>
          )}
        </div>

        {/* Right: Layer Filters & Cursor-Centered Zoom Tools */}
        <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
          {/* Layer toggles */}
          <div className="flex items-center space-x-1 bg-obsidian-950 p-0.5 rounded-lg border border-obsidian-750">
            {(['all', 'geometry', 'dimensions', 'tolerances'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-2 py-0.5 rounded uppercase text-[10px] transition-colors ${
                  activeLayer === layer
                    ? 'bg-laser-amber/20 text-laser-amber border border-laser-amber/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          {/* Interactive Cursor Tool Modes: Pan vs Click-Zoom */}
          <div className="flex items-center space-x-0.5 bg-obsidian-950 p-0.5 rounded-lg border border-obsidian-750">
            <button
              onClick={() => setToolMode('pan')}
              className={`p-1.5 rounded transition-all ${
                toolMode === 'pan'
                  ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pan tool: Drag to move blueprint anywhere"
            >
              <Hand className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setToolMode('zoom-in')}
              className={`p-1.5 rounded transition-all ${
                toolMode === 'zoom-in'
                  ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zoom In: Click anywhere to zoom in on that point"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setToolMode('zoom-out')}
              className={`p-1.5 rounded transition-all ${
                toolMode === 'zoom-out'
                  ? 'bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Zoom Out: Click anywhere to zoom out from that point"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Zoom Scale & Reset */}
          <div className="flex items-center space-x-1 bg-obsidian-950 px-2 py-1 rounded-lg border border-obsidian-750 text-[10px]">
            <span className="w-10 text-center font-bold text-laser-cyan">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleResetView}
              className="p-1 hover:text-laser-cyan text-slate-400 transition-colors"
              title="Reset view (100% centered)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Blueprint Canvas Viewport with Infinite Pan & Cursor-Centered Zoom */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`flex-1 rounded-2xl border border-obsidian-700/80 bg-obsidian-900/80 backdrop-blur-md relative overflow-hidden select-none ${
          toolMode === 'pan'
            ? isDragging ? 'cursor-grabbing' : 'cursor-grab'
            : toolMode === 'zoom-in' ? 'cursor-zoom-in' : 'cursor-zoom-out'
        }`}
      >
        {/* Floating Hint Overlay */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none bg-obsidian-950/85 border border-obsidian-750 px-3 py-1.5 rounded-lg text-[10px] text-slate-300 font-mono shadow-md flex items-center gap-2">
          <span className="text-laser-cyan font-bold">CURSOR NAV:</span>
          <span>Scroll wheel / click to zoom anywhere • Drag to pan • Double-click to magnify</span>
        </div>

        {/* Floating Quick Zoom Buttons (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-1 bg-obsidian-950/90 border border-obsidian-750 p-1 rounded-xl shadow-xl">
          <button
            onClick={() => zoomAtCenter(1.25)}
            className="p-2 hover:bg-obsidian-800 text-slate-300 hover:text-laser-cyan rounded-lg transition-colors"
            title="Zoom In (+25%)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomAtCenter(0.8)}
            className="p-2 hover:bg-obsidian-800 text-slate-300 hover:text-laser-cyan rounded-lg transition-colors"
            title="Zoom Out (-20%)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-obsidian-800 text-slate-300 hover:text-laser-cyan rounded-lg transition-colors"
            title="Reset Centered (100%)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Transformable Blueprint Container */}
        <div
          className="w-full h-full flex items-center justify-center origin-top-left will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <div className="relative w-[1000px] h-[650px] flex-shrink-0">
            {renderComponentBlueprint(currentPart, activeLayer, currentFindings, units, engineDescription)}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Procedurally generates authentic 2D engineering blueprints tailored to each jet engine component
 */
function renderComponentBlueprint(
  part: any, 
  activeLayer: LayerType,
  currentFindings: Finding[],
  units: UnitsSystem,
  engineDesc: EngineDescription | null
) {
  const category = part?.category || 'compressor_rotor';
  const name = part?.name || 'Engine Component';
  const material = part?.materialId?.toUpperCase() || 'TI-6AL-4V';
  const isFullEngine = 
    category === 'unclassified' || 
    name.toLowerCase().includes('engine') || 
    name.toLowerCase().includes('jx') ||
    name.toLowerCase().includes('assembly');

  return (
    <svg viewBox="0 0 1000 650" className="w-full h-full">
      {/* Millimeter CAD Grid Defs */}
      <defs>
        <pattern id="cad-grid-fine" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5" />
        </pattern>
        <pattern id="cad-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#cad-grid-fine)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="1" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f0ff" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff3366" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff7300" />
        </marker>
        <linearGradient id="thrust-jet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid Canvas */}
      <rect width="1000" height="650" fill="#080a0f" />
      <rect width="1000" height="650" fill="url(#cad-grid-major)" />

      {/* Border & Coordinate Reference Marks */}
      <rect x="20" y="20" width="960" height="610" fill="none" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" />
      <text x="35" y="40" fill="#00f0ff" fontSize="10" opacity="0.6">ZONE A-1</text>
      <text x="930" y="40" fill="#00f0ff" fontSize="10" opacity="0.6">ZONE D-4</text>

      {/* Central Engine Rotation Centerline */}
      <line x1="40" y1="325" x2="960" y2="325" stroke="#00f0ff" strokeWidth="1.2" strokeDasharray="16 4 4 4" opacity="0.5" />
      <text x="50" y="315" fill="#00f0ff" fontSize="10" opacity="0.8">CL ENGINE ROTATION AXIS (Z-DATUM)</text>

      {/* ========================================================================= */}
      {/* 1. FULL MULTI-STAGE PROPULSION ENGINE 2D CROSS-SECTION BLUEPRINT */}
      {/* ========================================================================= */}
      {isFullEngine && (
        <g>
          {/* A. Outer Nacelle Cowling Profile (Top & Bottom symmetrical) */}
          <path
            d="M 90 200 C 70 200, 60 215, 60 240 C 60 270, 95 285, 140 285 L 340 285 L 560 265 L 820 285 L 820 300 L 560 280 L 340 298 L 140 298 C 95 298, 75 280, 75 250 Z"
            fill="rgba(0, 240, 255, 0.07)"
            stroke="#00f0ff"
            strokeWidth="1.8"
          />
          <path
            d="M 90 450 C 70 450, 60 435, 60 410 C 60 380, 95 365, 140 365 L 340 365 L 560 385 L 820 365 L 820 350 L 560 370 L 340 352 L 140 352 C 95 352, 75 370, 75 400 Z"
            fill="rgba(0, 240, 255, 0.07)"
            stroke="#00f0ff"
            strokeWidth="1.8"
          />

          {/* B. Aerodynamic Bullet Nose Spinner */}
          <path
            d="M 140 325 L 80 325 C 80 310, 110 300, 140 300 Z"
            fill="rgba(255, 115, 0, 0.2)"
            stroke="#ff7300"
            strokeWidth="1.8"
          />
          <path
            d="M 140 325 L 80 325 C 80 340, 110 350, 140 350 Z"
            fill="rgba(255, 115, 0, 0.2)"
            stroke="#ff7300"
            strokeWidth="1.8"
          />

          {/* C. Multi-Stage Compressor Section (Stages C1 - C3) */}
          {[170, 220, 270].map((xBl, i) => (
            <g key={i}>
              {/* Upper Rotor Blade */}
              <path
                d={`M ${xBl} 298 L ${xBl + 20} 220 L ${xBl + 32} 225 L ${xBl + 12} 298 Z`}
                fill="rgba(0, 240, 255, 0.15)"
                stroke="#00f0ff"
                strokeWidth="1.5"
              />
              {/* Lower Rotor Blade */}
              <path
                d={`M ${xBl} 352 L ${xBl + 20} 430 L ${xBl + 32} 425 L ${xBl + 12} 352 Z`}
                fill="rgba(0, 240, 255, 0.15)"
                stroke="#00f0ff"
                strokeWidth="1.5"
              />
              {/* Stator Vane */}
              <line x1={xBl + 38} y1="218" x2={xBl + 38} y2="298" stroke="#ff7300" strokeWidth="1.5" />
              <line x1={xBl + 38} y1="352" x2={xBl + 38} y2="432" stroke="#ff7300" strokeWidth="1.5" />
            </g>
          ))}
          <text x="180" y="195" fill="#00f0ff" fontSize="10">COMPRESSOR SECTION (STAGES 1-3)</text>

          {/* D. Annular Combustor Chamber & Effusion Liner */}
          <path
            d="M 330 250 C 380 240, 480 245, 530 265 L 525 285 C 475 270, 385 265, 335 275 Z"
            fill="rgba(255, 115, 0, 0.15)"
            stroke="#ff7300"
            strokeWidth="1.8"
          />
          <path
            d="M 330 400 C 380 410, 480 405, 530 385 L 525 365 C 475 380, 385 385, 335 375 Z"
            fill="rgba(255, 115, 0, 0.15)"
            stroke="#ff7300"
            strokeWidth="1.8"
          />
          {/* Fuel Injectors */}
          <circle cx="340" cy="262" r="5" fill="#ff3366" stroke="#ff3366" />
          <circle cx="340" cy="388" r="5" fill="#ff3366" stroke="#ff3366" />
          <text x="360" y="235" fill="#ff7300" fontSize="10">ANNULAR COMBUSTOR LINER</text>

          {/* E. High-Pressure & Low-Pressure Turbine Blisks */}
          {/* HPT Stage 1 */}
          <path
            d="M 540 265 L 555 315 L 568 315 L 552 265 Z"
            fill="rgba(0, 240, 255, 0.2)"
            stroke="#00f0ff"
            strokeWidth="1.8"
          />
          <path
            d="M 540 385 L 555 335 L 568 335 L 552 385 Z"
            fill="rgba(0, 240, 255, 0.2)"
            stroke="#00f0ff"
            strokeWidth="1.8"
          />
          {/* LPT Stage 2 */}
          <path
            d="M 580 268 L 595 318 L 608 318 L 592 268 Z"
            fill="rgba(0, 240, 255, 0.2)"
            stroke="#00f0ff"
            strokeWidth="1.8"
          />
          <path
            d="M 580 382 L 595 332 L 608 332 L 592 382 Z"
            fill="rgba(0, 240, 255, 0.2)"
            stroke="#00f0ff"
            strokeWidth="1.8"
          />
          <text x="540" y="240" fill="#00f0ff" fontSize="10">HPT / LPT TURBINE BLISKS</text>

          {/* F. Centerline Drive Shaft (Z-Spool) */}
          <rect x="130" y="320" width="560" height="10" fill="#00f0ff" opacity="0.6" stroke="#00f0ff" strokeWidth="1" />

          {/* G. Bearing Assemblies (#1, #2, #3, #4) */}
          {[160, 320, 530, 660].map((xBrg, i) => (
            <g key={i}>
              <rect x={xBrg} y="315" width="16" height="20" fill="#ff7300" stroke="#ff7300" rx="2" />
              <text x={xBrg - 10} y="348" fill="#ff7300" fontSize="8">BRG #{i + 1}</text>
            </g>
          ))}

          {/* H. Exhaust Convergent Nozzle & Tailcone Plug */}
          <path
            d="M 670 325 L 810 325 L 670 300 Z"
            fill="rgba(0, 240, 255, 0.15)"
            stroke="#00f0ff"
            strokeWidth="1.5"
          />
          <path
            d="M 670 325 L 810 325 L 670 350 Z"
            fill="rgba(0, 240, 255, 0.15)"
            stroke="#00f0ff"
            strokeWidth="1.5"
          />
          {/* Exhaust Thrust Jet plume */}
          <polygon points="820,290 920,270 920,380 820,360" fill="url(#thrust-jet)" />

          {/* Dynamic Active Defect Callouts with Leader Lines */}
          {(activeLayer === 'all' || activeLayer === 'tolerances') && (
            <g>
              {/* Finding 1: Wall Thinning on Turbine / Combustor */}
              <g>
                <circle cx="552" cy="265" r="10" fill="rgba(255, 51, 102, 0.2)" stroke="#ff3366" strokeWidth="2" />
                <line x1="552" y1="265" x2="680" y2="170" stroke="#ff3366" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
                <rect x="680" y="145" width="240" height="42" fill="#0b0e14" stroke="#ff3366" strokeWidth="1.5" rx="5" />
                <text x="690" y="163" fill="#ff3366" fontSize="10" fontWeight="bold">DEFECT: BLISK WALL THINNING</text>
                <text x="690" y="178" fill="#94a3b8" fontSize="9">MEASURED: 0.42 mm (FAA LIMIT: 0.85 mm)</text>
              </g>

              {/* Finding 2: Dynamic Shaft Unbalance / Eccentricity */}
              <g>
                <circle cx="328" cy="325" r="10" fill="rgba(255, 51, 102, 0.2)" stroke="#ff3366" strokeWidth="2" />
                <line x1="328" y1="325" x2="260" y2="460" stroke="#ff3366" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
                <rect x="160" y="460" width="250" height="42" fill="#0b0e14" stroke="#ff3366" strokeWidth="1.5" rx="5" />
                <text x="170" y="478" fill="#ff3366" fontSize="10" fontWeight="bold">DYNAMIC UNBALANCE: e = 0.048 mm</text>
                <text x="170" y="493" fill="#94a3b8" fontSize="9">ISO 1940-1 G2.5 EXCEEDED @ 14,200 RPM</text>
              </g>

              {/* Finding 3: Blade Tip Running Clearance Rub */}
              <g>
                <circle cx="230" cy="220" r="10" fill="rgba(255, 115, 0, 0.2)" stroke="#ff7300" strokeWidth="2" />
                <line x1="230" y1="220" x2="150" y2="140" stroke="#ff7300" strokeWidth="1.5" markerEnd="url(#arrow-amber)" />
                <rect x="70" y="115" width="230" height="42" fill="#0b0e14" stroke="#ff7300" strokeWidth="1.5" rx="5" />
                <text x="80" y="133" fill="#ff7300" fontSize="10" fontWeight="bold">TIP CLEARANCE: 0.62 mm</text>
                <text x="80" y="148" fill="#94a3b8" fontSize="9">HOT CLASH PROXIMITY: 0.08 mm</text>
              </g>
            </g>
          )}

          {/* Engine Dimension Callouts */}
          {(activeLayer === 'all' || activeLayer === 'dimensions') && (
            <g>
              {/* Overall Length */}
              <line x1="60" y1="520" x2="820" y2="520" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="360" y="540" fill="#94a3b8" fontSize="11">
                OVERALL ENGINE LENGTH L = {formatLength(1450.0, units)}
              </text>

              {/* Maximum Nacelle Diameter */}
              <line x1="45" y1="200" x2="45" y2="450" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="30" y="335" fill="#94a3b8" fontSize="11" transform="rotate(-90 30 335)">
                MAX DIA D = {formatLength(480.0, units)}
              </text>
            </g>
          )}
        </g>
      )}

      {/* ========================================================================= */}
      {/* 2. TURBINE ROTOR / HPT BLISK */}
      {/* ========================================================================= */}
      {!isFullEngine && category === 'turbine_rotor' && (
        <g>
          {/* Blisk Aerofoil Cross Section */}
          <path
            d="M 220 325 C 220 220, 260 140, 380 90 C 470 60, 560 120, 620 210 C 660 270, 710 325, 710 325 Z"
            fill="rgba(0, 240, 255, 0.08)"
            stroke="#00f0ff"
            strokeWidth="2.5"
          />

          {/* Internal Serpentine Cooling Cavity */}
          <path
            d="M 320 290 C 330 220, 360 170, 440 140 C 490 160, 520 210, 560 270 Z"
            fill="rgba(255, 115, 0, 0.12)"
            stroke="#ff7300"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text x="390" y="210" fill="#ff7300" fontSize="10">COOLING CAVITY (EFFUSION FLOW)</text>

          {/* Trailing Edge Thinning Defect Annotation */}
          {(activeLayer === 'all' || activeLayer === 'tolerances') && (
            <g>
              <circle cx="620" cy="210" r="16" fill="rgba(255, 51, 102, 0.15)" stroke="#ff3366" strokeWidth="2" />
              <line x1="620" y1="210" x2="740" y2="150" stroke="#ff3366" strokeWidth="1.5" markerStart="url(#arrow-red)" />
              <rect x="740" y="125" width="220" height="52" fill="#0b0e14" stroke="#ff3366" strokeWidth="1.5" rx="6" />
              <text x="750" y="145" fill="#ff3366" fontSize="10" fontWeight="bold">CRITICAL DEFECT: WALL THINNING</text>
              <text x="750" y="162" fill="#94a3b8" fontSize="9">MEASURED: 0.42 mm (LIMIT: 0.85 mm)</text>
            </g>
          )}

          {/* Dimensions */}
          {(activeLayer === 'all' || activeLayer === 'dimensions') && (
            <g>
              {/* Outer Tip Radius */}
              <line x1="380" y1="90" x2="380" y2="40" stroke="#94a3b8" strokeWidth="1" />
              <line x1="180" y1="50" x2="380" y2="50" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />
              <text x="210" y="45" fill="#94a3b8" fontSize="10">TIP RADIUS R = {formatLength(420.0, units)}</text>

              {/* Hub Bore Diameter */}
              <line x1="220" y1="325" x2="220" y2="480" stroke="#94a3b8" strokeWidth="1" />
              <line x1="710" y1="325" x2="710" y2="480" stroke="#94a3b8" strokeWidth="1" />
              <line x1="220" y1="450" x2="710" y2="450" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="410" y="442" fill="#94a3b8" fontSize="11">ROOT BORE DIA = {formatLength(540.0, units)} ± 0.02</text>
            </g>
          )}
        </g>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPRESSOR ROTOR & CASING */}
      {/* ========================================================================= */}
      {!isFullEngine && (category === 'compressor_rotor' || category === 'casing') && (
        <g>
          {/* Casing Profile Section (Top Half) */}
          <path
            d="M 160 140 L 340 140 L 480 160 L 640 170 L 780 180 L 780 215 L 640 205 L 480 195 L 340 175 L 160 175 Z"
            fill="rgba(0, 240, 255, 0.08)"
            stroke="#00f0ff"
            strokeWidth="2"
          />

          {/* Stator Vanes S1 - S4 */}
          {[230, 380, 540, 700].map((xPos, idx) => (
            <g key={idx}>
              <path
                d={`M ${xPos} 175 L ${xPos + 28} 255 L ${xPos + 16} 260 L ${xPos - 8} 175 Z`}
                fill="rgba(255, 115, 0, 0.15)"
                stroke="#ff7300"
                strokeWidth="1.8"
              />
              <text x={xPos - 12} y={278} fill="#ff7300" fontSize="10" fontWeight="bold">
                STATOR S{idx + 1}
              </text>
            </g>
          ))}

          {/* Rotor Blade Tip Clearance Callout */}
          {(activeLayer === 'all' || activeLayer === 'tolerances') && (
            <g>
              <line x1="410" y1="175" x2="410" y2="195" stroke="#ff3366" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <rect x="425" y="160" width="310" height="42" fill="#0b0e14" stroke="#ff3366" strokeWidth="1.2" rx="5" />
              <text x="435" y="177" fill="#ff3366" fontSize="10" fontWeight="bold">
                TIP CLEARANCE GAP = {formatLength(0.62, units, 3)} (COLD)
              </text>
              <text x="435" y="193" fill="#ff3366" fontSize="9">
                DYNAMIC RUNNING: 0.08 mm (RUB HAZARD)
              </text>
            </g>
          )}

          {/* Dimensions */}
          {(activeLayer === 'all' || activeLayer === 'dimensions') && (
            <g>
              <line x1="160" y1="110" x2="780" y2="110" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="420" y="100" fill="#94a3b8" fontSize="11">LENGTH L = {formatLength(620.0, units)}</text>
              <line x1="130" y1="140" x2="130" y2="510" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="75" y="330" fill="#94a3b8" fontSize="11" transform="rotate(-90 75 330)">
                CASING DIA {formatLength(480.0, units)} ± 0.05
              </text>
            </g>
          )}
        </g>
      )}

      {/* ========================================================================= */}
      {/* 4. FAN BLADE (WIDE-CHORD) */}
      {/* ========================================================================= */}
      {!isFullEngine && category === 'fan_blade' && (
        <g>
          <path
            d="M 350 510 L 410 510 L 450 340 L 490 120 L 330 110 L 360 340 Z"
            fill="rgba(0, 240, 255, 0.09)"
            stroke="#00f0ff"
            strokeWidth="2.5"
          />
          <path
            d="M 330 510 L 330 570 L 350 580 L 340 595 L 365 605 L 395 605 L 420 595 L 410 580 L 430 570 L 430 510 Z"
            fill="rgba(255, 115, 0, 0.15)"
            stroke="#ff7300"
            strokeWidth="1.8"
          />
          <text x="310" y="590" fill="#ff7300" fontSize="9">FIR-TREE ROOT</text>

          {(activeLayer === 'all' || activeLayer === 'dimensions') && (
            <g>
              <line x1="510" y1="120" x2="510" y2="510" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="525" y="320" fill="#94a3b8" fontSize="11">SPAN HEIGHT H = {formatLength(850.0, units)}</text>
              <line x1="330" y1="85" x2="490" y2="85" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="365" y="75" fill="#94a3b8" fontSize="10">TIP CHORD C = {formatLength(280.0, units)}</text>
            </g>
          )}
        </g>
      )}

      {/* ========================================================================= */}
      {/* 5. SHAFT (N2 SPOOL) */}
      {/* ========================================================================= */}
      {!isFullEngine && category === 'shaft' && (
        <g>
          <path
            d="M 120 290 L 260 290 L 260 275 L 560 275 L 560 285 L 820 285 L 820 365 L 560 365 L 560 375 L 260 375 L 260 360 L 120 360 Z"
            fill="rgba(0, 240, 255, 0.08)"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          <rect x="230" y="280" width="60" height="90" fill="rgba(255, 115, 0, 0.15)" stroke="#ff7300" strokeWidth="1.5" />
          <text x="235" y="270" fill="#ff7300" fontSize="9">#3 ROLLER BRG</text>

          <rect x="730" y="280" width="60" height="90" fill="rgba(255, 115, 0, 0.15)" stroke="#ff7300" strokeWidth="1.5" />
          <text x="735" y="270" fill="#ff7300" fontSize="9">#4 BALL BRG</text>

          {(activeLayer === 'all' || activeLayer === 'tolerances') && (
            <g>
              <line x1="440" y1="325" x2="440" y2="220" stroke="#ff3366" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
              <rect x="360" y="175" width="270" height="42" fill="#0b0e14" stroke="#ff3366" strokeWidth="1.5" rx="5" />
              <text x="370" y="195" fill="#ff3366" fontSize="10" fontWeight="bold">DYNAMIC UNBALANCE: e = 0.048 mm</text>
              <text x="370" y="210" fill="#94a3b8" fontSize="9">ISO 1940-1 G2.5 EXCEEDED @ 14,200 RPM</text>
            </g>
          )}

          {(activeLayer === 'all' || activeLayer === 'dimensions') && (
            <g>
              <line x1="120" y1="410" x2="820" y2="410" stroke="#94a3b8" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="420" y="430" fill="#94a3b8" fontSize="11">TOTAL LENGTH L = {formatLength(1240.0, units)}</text>
            </g>
          )}
        </g>
      )}

      {/* ========================================================================= */}
      {/* 6. COMBUSTOR LINER */}
      {/* ========================================================================= */}
      {!isFullEngine && category === 'combustor_liner' && (
        <g>
          <path
            d="M 220 220 C 350 200, 550 210, 720 250 L 700 290 C 540 250, 360 240, 240 260 Z"
            fill="rgba(0, 240, 255, 0.08)"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          {[300, 380, 460, 540, 620].map((xH, i) => (
            <circle key={i} cx={xH} cy={235 + (i * 4)} r="3" fill="#ff7300" stroke="#ff7300" />
          ))}
          <text x="360" y="180" fill="#ff7300" fontSize="10">2,840 LASER EFFUSION COOLING HOLES (DIA 0.50 mm)</text>
        </g>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL CAD TITLE BLOCK (BOTTOM-RIGHT) */}
      {/* ========================================================================= */}
      <g transform="translate(630, 490)">
        <rect width="330" height="120" fill="#06080d" stroke="#00f0ff" strokeWidth="1.5" rx="4" />
        <line x1="0" y1="32" x2="330" y2="32" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />
        <line x1="0" y1="72" x2="330" y2="72" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />
        <line x1="165" y1="72" x2="165" y2="120" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />

        <text x="12" y="22" fill="#00f0ff" fontSize="12" fontWeight="bold" fontFamily="monospace">
          {name.toUpperCase()}
        </text>
        <text x="12" y="50" fill="#94a3b8" fontSize="9" fontFamily="monospace">
          MATERIAL: {material}
        </text>
        <text x="12" y="64" fill="#94a3b8" fontSize="9" fontFamily="monospace">
          CAD REF: {part?.id || 'DWG-AERO-01'} • REV: C-08
        </text>
        <text x="12" y="94" fill="#94a3b8" fontSize="9" fontFamily="monospace">
          TOLERANCES: ISO 2768-m
        </text>
        <text x="175" y="94" fill="#00ff88" fontSize="10" fontWeight="bold" fontFamily="monospace">
          STATUS: VERIFIED
        </text>
        <text x="12" y="110" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          STANDARDS: ASME Y14.5M / FAA 14 CFR §33
        </text>
      </g>
    </svg>
  );
}
