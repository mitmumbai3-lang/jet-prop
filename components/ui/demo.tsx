"use client";

import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";

// High-fidelity aerospace propulsion module imagery from Unsplash
const WORKS: WorksWheelItem[] = [
  {
    title: "Fan Module & Shroud",
    moduleSubtitle: "Wide-Chord Hollow Titanium Fan Blades",
    stageCount: "STAGE 1",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    href: "#module-fan",
  },
  {
    title: "Booster Compressor",
    moduleSubtitle: "Low-Pressure 3-Stage Core Booster",
    stageCount: "STAGES 2-4",
    image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
    href: "#module-booster",
  },
  {
    title: "High-Pressure Compressor",
    moduleSubtitle: "10-Stage Axial HPC with Variable Stators",
    stageCount: "STAGES 5-14",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
    href: "#module-hpc",
  },
  {
    title: "Annular Combustor",
    moduleSubtitle: "Twin Annular Premixing Swirler with CMC Liners",
    stageCount: "COMBUSTION",
    image: "https://images.unsplash.com/photo-1517976487507-5b3a405342a3?auto=format&fit=crop&w=1200&q=80",
    href: "#module-combustor",
  },
  {
    title: "HPT Stage 1 Blisk",
    moduleSubtitle: "Single-Crystal CMSX-4 Aerofoil with Internal Cooling",
    stageCount: "HIGH-P TURBINE",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    href: "#module-hpt",
  },
  {
    title: "Nozzle Guide Vanes",
    moduleSubtitle: "Thermal Barrier Coated Turbine Stator Nozzles",
    stageCount: "TURBINE NGV",
    image: "https://images.unsplash.com/photo-1519074069444-1ba4ea16e879?auto=format&fit=crop&w=1200&q=80",
    href: "#module-ngv",
  },
  {
    title: "LPT Rotor Assembly",
    moduleSubtitle: "7-Stage Uncooled Titanium-Aluminide Blades",
    stageCount: "LOW-P TURBINE",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    href: "#module-lpt",
  },
  {
    title: "Concentric Spool Shafts",
    moduleSubtitle: "Dual High/Low Pressure High-Speed Drive Shafts",
    stageCount: "SPOOLS N1/N2",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80",
    href: "#module-shafts",
  },
  {
    title: "Exhaust Mixer & Nozzle",
    moduleSubtitle: "Confluent Core/Bypass Acoustic Lined Exhaust Nozzle",
    stageCount: "EXHAUST",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    href: "#module-exhaust",
  },
];

export default function WorksWheelDemo({ 
  onInspectModule 
}: { 
  onInspectModule?: (moduleTitle: string) => void 
} = {}) {
  return (
    <div className="bg-obsidian-950 text-slate-100 w-full h-full relative overflow-hidden flex flex-col">
      {/* Top Banner with Workbench Quick-Return */}
      <div className="z-20 px-6 py-3 border-b border-obsidian-800 bg-obsidian-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-laser-cyan/15 text-laser-cyan border border-laser-cyan/30 font-bold uppercase">
            3D PROPULSION MODULE WHEEL
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Scroll or drag to rotate 3D drum • Click card to open in CAD Workbench
          </span>
        </div>
        {onInspectModule && (
          <button
            onClick={() => onInspectModule('HPT Stage 1 Blisk')}
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-laser-cyan/20 text-laser-cyan border border-laser-cyan/40 hover:bg-laser-cyan/30 transition-all shadow-glow-cyan"
          >
            OPEN IN 3D WORKBENCH →
          </button>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <WorksWheel 
          items={WORKS} 
          label="PROPULSION MODULES" 
          action="INSPECT" 
          onItemClick={(item) => onInspectModule?.(item.title)}
        />
      </div>
    </div>
  );
}

export { WorksWheelDemo };
