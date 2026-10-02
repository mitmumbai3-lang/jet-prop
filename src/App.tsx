import React, { useState, useEffect } from 'react';
import { useEngineStore } from './store/useEngineStore';
import { Header } from './components/Header';
import { Navigation, MainNavPage } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { ViewportHeader } from './components/ViewportHeader';
import { ThreeViewport } from './components/ThreeViewport';
import { DrawingView } from './components/DrawingView';
import { TelemetryView } from './components/TelemetryView';
import { EngineReportView } from './components/EngineReportView';
import { FmeaView } from './components/FmeaView';
import { RightPanel } from './components/RightPanel';
import { PhysicsStudioPage } from './components/PhysicsStudioPage';
import { AutoRepairStudioPage } from './components/AutoRepairStudioPage';
import { StandardsPage } from './components/StandardsPage';
import { FinalResultsPage } from './components/FinalResultsPage';
import { AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<MainNavPage>('workspace');
  const { activeTab, appliedFixIds, loadSampleEngine, parts } = useEngineStore();

  // Load in-memory benchmark engine on mount if empty so user immediately experiences 3D jet engine assembly
  useEffect(() => {
    if (parts.length === 0) {
      loadSampleEngine();
    }
  }, []);

  // Trigger celebratory confetti when safe fixes are applied
  useEffect(() => {
    if (appliedFixIds.length >= 3) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00f0ff', '#00ff88', '#ff7300']
      });
    }
  }, [appliedFixIds.length]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-obsidian-950 text-slate-100 font-sans">
      {/* Top Header */}
      <Header />

      {/* Multi-Page Navigation Bar */}
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Mandatory Engineering Safety Disclaimer Banner (Section 9) */}
      <div className="bg-laser-amber/10 border-b border-laser-amber/20 px-4 py-1 flex items-center justify-between text-[11px] font-mono text-laser-amber/90 select-none">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-laser-amber flex-shrink-0" />
          <span>
            <strong>ENGINEERING DECISION SUPPORT ONLY:</strong> Not an airworthiness or flight approval. Critical findings require formal certification and test rig validation.
          </span>
        </div>
        <div className="hidden lg:flex items-center space-x-3 text-slate-400">
          <span>TOLERANCES: ISO 2768-m</span>
          <span>•</span>
          <span>B-REP KERNEL: VIRTUALIZED OPEN CASCADE</span>
        </div>
      </div>

      {/* Sub-Pages & Workspace Display */}
      <div className="flex-1 overflow-hidden relative">
        {currentPage === 'workspace' && (
          <div className="flex h-full w-full overflow-hidden relative">
            {/* Left Sidebar (Manifest + Assembly Tree) */}
            <Sidebar />

            {/* Center Viewport Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-obsidian-950 relative overflow-hidden">
              <ViewportHeader />

              <div className="flex-1 relative overflow-hidden">
                {activeTab === 'model' && <ThreeViewport />}
                {activeTab === 'drawing' && <DrawingView />}
                {activeTab === 'data' && <TelemetryView />}
                {activeTab === 'report' && <EngineReportView />}
                {activeTab === 'fmea' && <FmeaView />}
              </div>
            </main>

            {/* Right Panel (Findings, Auto-Fix, AI Chat) */}
            <RightPanel />
          </div>
        )}

        {currentPage === 'physics' && <PhysicsStudioPage />}

        {currentPage === 'repair' && <AutoRepairStudioPage />}

        {currentPage === 'standards' && <StandardsPage />}

        {currentPage === 'results' && <FinalResultsPage />}
      </div>
    </div>
  );
};

export default App;
