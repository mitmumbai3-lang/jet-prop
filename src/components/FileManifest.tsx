import React from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { 
  FileText, 
  Box, 
  Activity, 
  FileCheck2, 
  Trash2, 
  AlertTriangle,
  Image as ImageIcon,
  Compass
} from 'lucide-react';
import { FileRole } from '../types';

export const FileManifest: React.FC = () => {
  const { files, removeFile, updateFileRole } = useEngineStore();

  if (files.length === 0) {
    return null;
  }

  const getRoleIcon = (role: FileRole) => {
    switch (role) {
      case 'geometry':
        return <Box className="w-3.5 h-3.5 text-laser-cyan" />;
      case 'drawing':
        return <Compass className="w-3.5 h-3.5 text-laser-amber" />;
      case 'test_data':
        return <Activity className="w-3.5 h-3.5 text-laser-green" />;
      case 'spec':
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
          <span>PROJECT FILE MANIFEST</span>
          <span className="px-1.5 py-0.2 rounded-full bg-obsidian-800 text-laser-cyan text-[10px]">
            {files.length}
          </span>
        </h3>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {files.map((file) => (
          <div
            key={file.id}
            className="group p-2 rounded-lg bg-obsidian-850/80 border border-obsidian-700 hover:border-obsidian-600 transition-all flex flex-col space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                {getRoleIcon(file.role)}
                <span className="text-xs font-mono text-slate-200 truncate font-medium" title={file.name}>
                  {file.name}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-400">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => removeFile(file.id)}
                  title="Remove file from project"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-laser-red text-slate-500 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Type badge and Role selector */}
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono uppercase px-1.5 py-0.5 rounded bg-obsidian-800 text-slate-300 border border-obsidian-700">
                {file.detectedType}
              </span>

              <div className="flex items-center space-x-1">
                <span className="text-slate-400 font-mono">Role:</span>
                <select
                  value={file.role}
                  onChange={(e) => updateFileRole(file.id, e.target.value as FileRole)}
                  className="bg-obsidian-800 text-laser-cyan font-mono text-[10px] rounded px-1.5 py-0.5 border border-obsidian-700 focus:outline-none focus:border-laser-cyan/50 cursor-pointer"
                >
                  <option value="geometry">Geometry (3D)</option>
                  <option value="drawing">Drawing (2D)</option>
                  <option value="test_data">Telemetry (CSV)</option>
                  <option value="spec">Specification</option>
                  <option value="image">Borescope Image</option>
                  <option value="other">Other Data</option>
                </select>
              </div>
            </div>

            {/* Honest Fallback Notice for Native CAD */}
            {file.nativeCadWarning && (
              <div className="flex items-start space-x-1 text-[10px] text-laser-amber bg-laser-amber/10 p-1.5 rounded border border-laser-amber/20">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Proprietary CAD detected. Direct writes are closed-spec; fixes will export as standard ISO 10303 STEP AP214 with a full change report.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
