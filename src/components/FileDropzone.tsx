import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode2, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEngineStore } from '../store/useEngineStore';
import anime from 'animejs';

export const FileDropzone: React.FC = () => {
  const { addFiles, isUploading } = useEngineStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
      if (dropzoneRef.current) {
        anime({
          targets: dropzoneRef.current,
          scale: 1.01,
          borderColor: '#00f0ff',
          duration: 300,
          easing: 'easeOutQuad',
        });
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (dropzoneRef.current) {
      anime({
        targets: dropzoneRef.current,
        scale: 1.0,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        duration: 300,
        easing: 'easeOutQuad',
      });
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (dropzoneRef.current) {
      anime({
        targets: dropzoneRef.current,
        scale: 1.0,
        duration: 300,
      });
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await addFiles(filesArray);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await addFiles(filesArray);
    }
  };

  return (
    <div className="p-3">
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-xl border border-dashed p-6 transition-all text-center overflow-hidden ${
          isDragOver
            ? 'border-laser-cyan bg-laser-cyan/10 shadow-glow-cyan'
            : 'border-obsidian-600 hover:border-laser-cyan/50 bg-obsidian-900/60 hover:bg-obsidian-850'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept=".step,.stp,.iges,.igs,.stl,.obj,.dxf,.pdf,.csv,.json,.png,.jpg,.jpeg,.sldprt,.sldasm,.catpart,.prt"
        />

        {/* Anime.js inspired background grid scan line */}
        <div className="absolute inset-0 bg-tech-dots opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-xl bg-obsidian-800 border border-laser-cyan/30 flex items-center justify-center text-laser-cyan group-hover:scale-110 group-hover:shadow-glow-cyan transition-all duration-300">
            <UploadCloud className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <p className="text-xs font-mono font-semibold tracking-wide text-slate-200">
              DROP ENGINE CAD OR TELEMETRY FILES
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              or <span className="text-laser-cyan underline decoration-laser-cyan/40 underline-offset-2">browse filesystem</span> (up to 500 MB/file)
            </p>
          </div>

          {/* Supported Format Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-xs pt-1">
            {['STEP', 'IGES', 'STL', 'OBJ', 'DXF', 'CSV', 'PDF', 'IMAGES'].map((fmt) => (
              <span
                key={fmt}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-obsidian-800/90 text-slate-300 border border-obsidian-700 group-hover:border-obsidian-600"
              >
                {fmt}
              </span>
            ))}
          </div>

          {isUploading && (
            <div className="w-full max-w-xs bg-obsidian-800 rounded-full h-1.5 overflow-hidden border border-obsidian-700 mt-2">
              <div className="bg-laser-cyan h-full animate-pulse w-3/4 rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* High-Precision Detection Status & Quick Benchmark Engine */}
      <div className="mt-3 p-3 rounded-xl bg-obsidian-850/80 border border-obsidian-700/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-laser-cyan animate-pulse" />
            HIGH-PRECISION DETECTION ENGINES
          </span>
          <span className="text-[9px] font-mono text-laser-green bg-laser-green/10 border border-laser-green/30 px-1.5 py-0.5 rounded font-bold">
            ACTIVE
          </span>
        </div>

        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex items-center justify-between p-1.5 rounded bg-obsidian-900 border border-obsidian-750">
            <span className="text-slate-300">B-Rep Manifold &amp; Thinning:</span>
            <span className="text-laser-cyan font-bold">ISO 2768-m (&lt;0.85 mm)</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-obsidian-900 border border-obsidian-750">
            <span className="text-slate-300">Rotor Dynamic Balance:</span>
            <span className="text-laser-amber font-bold">ISO 1940-1 G2.5</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-obsidian-900 border border-obsidian-750">
            <span className="text-slate-300">Aerothermal Creep &amp; Resonance:</span>
            <span className="text-laser-green font-bold">EASA CS-E 740 / FAA AC 33.28</span>
          </div>
        </div>

        {/* In-Memory Benchmark Loader */}
        <div className="pt-1.5 border-t border-obsidian-750">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const { loadSampleEngine } = useEngineStore.getState();
              loadSampleEngine();
            }}
            className="w-full py-2 px-3 rounded-lg bg-laser-cyan/15 hover:bg-laser-cyan/25 text-laser-cyan border border-laser-cyan/40 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all shadow-glow-cyan"
          >
            <span>LOAD IN-MEMORY BENCHMARK ENGINE</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-1 font-mono">
            Zero disk dependencies • Procedural 3D B-Rep &amp; Telemetry
          </p>
        </div>
      </div>
    </div>
  );
};
