import React, { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { FileManifest } from './FileManifest';
import { AssemblyTree } from './AssemblyTree';
import { FolderGit2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'assembly'>('assembly');

  return (
    <aside 
      className={`border-r border-obsidian-700 bg-obsidian-900/80 backdrop-blur-md flex flex-col transition-all duration-300 relative z-20 ${
        collapsed ? 'w-12' : 'w-80 lg:w-96'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-5 w-7 h-7 rounded-full bg-obsidian-800 border border-obsidian-600 text-slate-400 hover:text-laser-cyan flex items-center justify-center z-30 shadow-md hover:border-laser-cyan/50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center py-6 space-y-6">
          <button 
            onClick={() => { setCollapsed(false); setSidebarTab('files'); }}
            title="Files & Ingestion"
            className="p-2 text-slate-400 hover:text-laser-cyan rounded-lg hover:bg-obsidian-800"
          >
            <FolderGit2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setCollapsed(false); setSidebarTab('assembly'); }}
            title="Assembly Tree"
            className="p-2 text-slate-400 hover:text-laser-cyan rounded-lg hover:bg-obsidian-800"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Top Switcher Tabs */}
          <div className="flex border-b border-obsidian-700 bg-obsidian-850/50 p-1">
            <button
              onClick={() => setSidebarTab('assembly')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-colors ${
                sidebarTab === 'assembly'
                  ? 'bg-obsidian-800 text-laser-cyan border border-laser-cyan/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ASSEMBLY TREE</span>
            </button>
            <button
              onClick={() => setSidebarTab('files')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-colors ${
                sidebarTab === 'files'
                  ? 'bg-obsidian-800 text-laser-cyan border border-laser-cyan/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>FILES & INGESTION</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {sidebarTab === 'files' ? (
              <div className="flex-1 overflow-y-auto">
                <FileDropzone />
                <FileManifest />
              </div>
            ) : (
              <AssemblyTree />
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
