import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  Eye, 
  EyeOff, 
  Focus, 
  Search, 
  Sliders, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { AEROSPACE_MATERIALS } from '../data/materials';
import { PartCategory } from '../types';

export const AssemblyTree: React.FC = () => {
  const { 
    parts, 
    selectedPartId, 
    isolatedPartId, 
    selectPart, 
    isolatePart, 
    togglePartVisibility,
    updatePartMaterial,
    updatePartCategory
  } = useEngineStore();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredParts = parts.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMass = parts.reduce((acc, p) => acc + p.massKg, 0);

  const getCategoryColor = (category: PartCategory) => {
    switch (category) {
      case 'turbine_rotor':
      case 'turbine_nozzle':
        return 'text-laser-cyan bg-laser-cyan/10 border-laser-cyan/30';
      case 'compressor_rotor':
      case 'compressor_stator':
        return 'text-laser-green bg-laser-green/10 border-laser-green/30';
      case 'combustor_liner':
      case 'fuel_nozzle':
        return 'text-laser-amber bg-laser-amber/10 border-laser-amber/30';
      case 'shaft':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-slate-300 bg-obsidian-800 border-obsidian-700';
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 border-t border-obsidian-700">
      {/* Assembly Header & Mass Summary */}
      <div className="p-3 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-laser-cyan" />
            <span>ASSEMBLY COMPONENTS</span>
            <span className="px-1.5 py-0.2 rounded-full bg-obsidian-800 text-laser-cyan text-[10px]">
              {parts.length}
            </span>
          </h3>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            Total Mass: <span className="text-slate-200 font-semibold">{totalMass.toFixed(2)} kg</span>
          </p>
        </div>

        {isolatedPartId && (
          <button
            onClick={() => isolatePart(null)}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-laser-amber/20 text-laser-amber border border-laser-amber/40 hover:bg-laser-amber/30 transition-colors"
          >
            EXIT ISOLATION
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter components (e.g. Blisk, Shaft)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-850 text-xs font-mono text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-obsidian-700 focus:outline-none focus:border-laser-cyan/50"
          />
        </div>
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pr-1 pb-4">
        {filteredParts.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-mono">
            {parts.length === 0 ? 'No CAD parts loaded. Upload files or click "Load Sample Engine" above.' : 'No components match your search query.'}
          </div>
        ) : (
          filteredParts.map((part) => {
            const isSelected = selectedPartId === part.id;
            const isIsolated = isolatedPartId === part.id;
            const material = AEROSPACE_MATERIALS[part.materialId] || AEROSPACE_MATERIALS['ti-6al-4v'];

            return (
              <div
                key={part.id}
                onClick={() => selectPart(part.id)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-laser-cyan/15 border-laser-cyan shadow-glow-cyan'
                    : 'bg-obsidian-850/60 border-obsidian-700/80 hover:border-obsidian-600 hover:bg-obsidian-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: part.color || '#00f0ff' }}
                    />
                    <span className="text-xs font-mono font-medium text-slate-200 truncate" title={part.name}>
                      {part.name}
                    </span>
                  </div>

                  {/* Actions: Isolate & Toggle Visibility */}
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => isolatePart(isIsolated ? null : part.id)}
                      title={isIsolated ? "Restore full assembly view" : "Isolate this component"}
                      className={`p-1 rounded hover:bg-obsidian-700 transition-colors ${
                        isIsolated ? 'text-laser-amber' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Focus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => togglePartVisibility(part.id)}
                      title={part.visible ? "Hide part" : "Show part"}
                      className={`p-1 rounded hover:bg-obsidian-700 transition-colors ${
                        part.visible ? 'text-laser-cyan' : 'text-slate-500'
                      }`}
                    >
                      {part.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sub details: Category, Material, Mass */}
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded border uppercase ${getCategoryColor(part.category)}`}>
                    {part.category.replace('_', ' ')}
                  </span>
                  
                  <span className="text-slate-400 font-semibold">
                    {part.massKg.toFixed(2)} kg
                  </span>
                </div>

                {/* Material selector */}
                <div className="mt-1.5 pt-1.5 border-t border-obsidian-700/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Material:</span>
                  <select
                    value={part.materialId}
                    onChange={(e) => updatePartMaterial(part.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-obsidian-800 text-slate-200 text-[10px] rounded px-1.5 py-0.5 border border-obsidian-700 focus:outline-none focus:border-laser-cyan/50 cursor-pointer max-w-[140px] truncate"
                  >
                    {Object.values(AEROSPACE_MATERIALS).map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
