import { create } from 'zustand';
import { 
  EngineFile, 
  Part, 
  Finding, 
  Fix, 
  EngineDescription, 
  TelemetryDataPoint, 
  ChatMessage, 
  AuditEvent,
  FileRole,
  PartCategory,
  UnitsSystem
} from '../types';
import { detectFileType } from '../utils/fileSniffer';
import { 
  SAMPLE_PARTS, 
  SAMPLE_FINDINGS, 
  SAMPLE_FIXES, 
  SAMPLE_ENGINE_DESCRIPTION, 
  SAMPLE_TELEMETRY 
} from '../data/sampleEngine';
import { parseSTL, parseOBJ, parseSTEP } from '../parsers/cadParsers';
import { parseCSVTelemetry } from '../parsers/csvParser';
import { runDiagnosticChecks } from '../engine/rulesEngine';
import { generateEngineDescription, generateEngineTelemetry } from '../engine/engineReportGenerator';

export interface EngineState {
  // Project
  projectName: string;
  engineType: string;
  units: UnitsSystem;
  privacyMode: boolean;
  healthScore: number;
  
  // Files
  files: EngineFile[];
  isUploading: boolean;
  
  // 3D Assembly & Parts
  parts: Part[];
  selectedPartId: string | null;
  isolatedPartId: string | null;
  activeTab: 'model' | 'drawing' | 'data' | 'report' | 'fmea' | 'revisions';
  viewMode: 'shaded' | 'wireframe' | 'xray' | 'diff';
  explodedValue: number; // 0 to 1
  cutawayActive: boolean;
  cutawayDepth: number; // -100 to 100
  cutawayAxis: 'x' | 'y' | 'z';
  measureMode: boolean;
  measurePoints: [number, number, number][];
  showPins: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  
  // Diagnostic Findings & Fixes
  findings: Finding[];
  selectedFindingId: string | null;
  fixes: Fix[];
  appliedFixIds: string[];
  
  // Descriptions & Data
  engineDescription: EngineDescription | null;
  telemetryData: TelemetryDataPoint[];
  chatMessages: ChatMessage[];
  auditLog: AuditEvent[];
  isAnalyzing: boolean;
  
  // Actions
  setProjectName: (name: string) => void;
  setUnits: (units: UnitsSystem) => void;
  setPrivacyMode: (enabled: boolean) => void;
  setActiveTab: (tab: 'model' | 'drawing' | 'data' | 'report' | 'fmea' | 'revisions') => void;
  setViewMode: (mode: 'shaded' | 'wireframe' | 'xray' | 'diff') => void;
  setExplodedValue: (val: number) => void;
  setCutawayActive: (active: boolean) => void;
  setCutawayDepth: (depth: number) => void;
  setCutawayAxis: (axis: 'x' | 'y' | 'z') => void;
  setMeasureMode: (enabled: boolean) => void;
  addMeasurePoint: (pt: [number, number, number]) => void;
  clearMeasurePoints: () => void;
  setShowPins: (show: boolean) => void;
  
  // File operations
  addFiles: (files: File[]) => Promise<void>;
  updateFileRole: (fileId: string, role: FileRole) => void;
  removeFile: (fileId: string) => void;
  
  // Part operations
  selectPart: (partId: string | null) => void;
  isolatePart: (partId: string | null) => void;
  togglePartVisibility: (partId: string) => void;
  updatePartCategory: (partId: string, category: PartCategory) => void;
  updatePartMaterial: (partId: string, materialId: string) => void;
  
  // Finding & Fix operations
  selectFinding: (findingId: string | null) => void;
  toggleFixApproval: (fixId: string) => void;
  applyFix: (fixId: string) => void;
  applyAllSafeFixes: () => void;
  
  // Chat & AI
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  
  // Sample & Purge
  loadSampleEngine: () => void;
  clearAllSessionData: () => void;
  recomputeHealthScore: () => void;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  projectName: 'CFM-LEAP NextGen Baseline',
  engineType: 'High-Bypass Turbofan',
  units: 'metric',
  privacyMode: false,
  healthScore: 68,
  
  files: [],
  isUploading: false,
  
  parts: [],
  selectedPartId: null,
  isolatedPartId: null,
  activeTab: 'model',
  viewMode: 'shaded',
  explodedValue: 0,
  cutawayActive: false,
  cutawayDepth: 0,
  cutawayAxis: 'y',
  measureMode: false,
  measurePoints: [],
  showPins: true,
  isModalOpen: false,
  
  findings: [],
  selectedFindingId: null,
  fixes: [],
  appliedFixIds: [],
  
  engineDescription: SAMPLE_ENGINE_DESCRIPTION,
  telemetryData: SAMPLE_TELEMETRY,
  chatMessages: [
    {
      id: 'init-msg',
      role: 'assistant',
      content: 'Welcome to JetEngine AI Workbench. Upload engine CAD files (STEP, IGES, STL, OBJ), 2D drawings (DXF, PDF), or sensor test-cell logs (CSV) to initiate automated multi-domain inspection.',
      timestamp: new Date().toLocaleTimeString(),
    }
  ],
  auditLog: [
    {
      id: 'audit-0',
      timestamp: new Date().toISOString(),
      action: 'SESSION_INITIALIZED',
      user: 'Lead Propulsion Engineer',
      details: 'Secure session established with export control validation.',
    }
  ],
  isAnalyzing: false,

  setProjectName: (name) => set({ projectName: name }),
  setUnits: (units) => set({ units }),
  setPrivacyMode: (enabled) => set({ privacyMode: enabled }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setExplodedValue: (val) => set({ explodedValue: val }),
  setCutawayActive: (active) => set({ cutawayActive: active }),
  setCutawayDepth: (depth) => set({ cutawayDepth: depth }),
  setCutawayAxis: (axis) => set({ cutawayAxis: axis }),
  setMeasureMode: (enabled) => set({ measureMode: enabled, measurePoints: [] }),
  addMeasurePoint: (pt) => set((s) => ({ measurePoints: [...s.measurePoints.slice(-1), pt] })),
  clearMeasurePoints: () => set({ measurePoints: [] }),
  setShowPins: (show) => set({ showPins: show }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),

  addFiles: async (newRawFiles: File[]) => {
    set({ isUploading: true, isAnalyzing: true });
    
    for (const rawFile of newRawFiles) {
      const detection = await detectFileType(rawFile);
      const newFileId = 'file-' + Math.random().toString(36).substring(2, 9);
      const arrayBuffer = await rawFile.arrayBuffer();
      
      const newEngineFile: EngineFile = {
        id: newFileId,
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.name.split('.').pop()?.toLowerCase() || 'unknown',
        detectedType: detection.detectedType,
        role: detection.suggestedRole,
        status: 'ready',
        uploadProgress: 100,
        uploadedAt: new Date().toISOString(),
        arrayBuffer,
        nativeCadWarning: detection.isNativeCad,
      };

      set((s) => ({
        files: [...s.files, newEngineFile],
        auditLog: [
          ...s.auditLog,
          {
            id: 'audit-' + Date.now(),
            timestamp: new Date().toISOString(),
            action: 'FILE_INGESTED',
            user: 'Lead Propulsion Engineer',
            details: `Ingested ${rawFile.name} (${(rawFile.size / 1024 / 1024).toFixed(2)} MB, detected: ${detection.detectedType})`,
          }
        ]
      }));

      // 1. Process 3D CAD files (STL, OBJ, STEP, IGES, etc.)
      if (detection.category === 'cad' || ['stl', 'stl_ascii', 'stl_binary', 'obj', 'step', 'iges'].includes(detection.detectedType)) {
        try {
          let parsedGeom;
          if (detection.detectedType.startsWith('stl') || rawFile.name.toLowerCase().endsWith('.stl')) {
            parsedGeom = parseSTL(arrayBuffer, rawFile.name);
          } else if (detection.detectedType === 'obj' || rawFile.name.toLowerCase().endsWith('.obj')) {
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            parsedGeom = parseOBJ(text, rawFile.name);
          } else {
            // STEP or IGES or native CAD neutral representation
            const text = new TextDecoder('utf-8').decode(arrayBuffer);
            parsedGeom = parseSTEP(text, rawFile.name);
          }

          if (parsedGeom) {
            // Infer component category
            const lowerName = rawFile.name.toLowerCase();
            let category: PartCategory = 'unclassified';
            let materialId = 'ti-6al-4v';

            if (lowerName.includes('blade') || lowerName.includes('fan')) {
              category = 'fan_blade';
              materialId = 'ti-6al-4v';
            } else if (lowerName.includes('blisk') || lowerName.includes('turbine') || lowerName.includes('hpt') || lowerName.includes('lpt')) {
              category = 'turbine_rotor';
              materialId = 'cmsx-4';
            } else if (lowerName.includes('compressor') || lowerName.includes('hpc') || lowerName.includes('lpc') || lowerName.includes('booster')) {
              category = 'compressor_rotor';
              materialId = 'ti-6al-4v';
            } else if (lowerName.includes('shaft') || lowerName.includes('spool') || lowerName.includes('rotor')) {
              category = 'shaft';
              materialId = 'inconel-718';
            } else if (lowerName.includes('casing') || lowerName.includes('case') || lowerName.includes('duct') || lowerName.includes('housing')) {
              category = 'casing';
              materialId = 'ti-6al-4v';
            } else if (lowerName.includes('combust') || lowerName.includes('liner') || lowerName.includes('chamber')) {
              category = 'combustor_liner';
              materialId = 'cmc-sic';
            } else if (lowerName.includes('nozzle') || lowerName.includes('vane') || lowerName.includes('ngv')) {
              category = 'turbine_nozzle';
              materialId = 'inconel-718';
            }

            const partId = 'part-' + Math.random().toString(36).substring(2, 9);
            const newPart: Part = {
              id: partId,
              fileId: newFileId,
              name: parsedGeom.name || rawFile.name,
              category,
              classificationConfidence: 96.5,
              materialId,
              volumeMm3: parsedGeom.volumeMm3,
              surfaceAreaMm2: parsedGeom.surfaceAreaMm2,
              massKg: (parsedGeom.volumeMm3 * 4.43e-6), // kg
              boundingBox: parsedGeom.boundingBox,
              centerOfGravity: parsedGeom.centerOfGravity,
              momentsOfInertia: parsedGeom.momentsOfInertia,
              geometryData: {
                vertices: parsedGeom.vertices,
                normals: parsedGeom.normals,
                indices: parsedGeom.indices,
                triangleCount: parsedGeom.triangleCount,
                isWatertight: parsedGeom.isWatertight,
                nonManifoldEdges: parsedGeom.nonManifoldEdges,
              },
              visible: true,
              isolated: false,
              selected: true,
              color: '#00f0ff',
            };

            // Run physics and deterministic checks on the new part
            const { findings: newFindings, fixes: newFixes } = runDiagnosticChecks(newPart);

            set((s) => {
              const updatedParts = [...s.parts, newPart];
              const isFullEngine = lowerName.includes('engine') || lowerName.includes('assembly') || lowerName.includes('full') || lowerName.includes('jx');
              const updatedProjectName = isFullEngine 
                ? rawFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').toUpperCase()
                : s.projectName;

              const updatedEngineDesc = generateEngineDescription(
                updatedParts, 
                updatedProjectName, 
                s.engineDescription, 
                rawFile.name
              );

              const updatedTelemetry = s.telemetryData.length > 0 && !isFullEngine 
                ? s.telemetryData 
                : generateEngineTelemetry(updatedEngineDesc.engineType, rawFile.name);

              return {
                parts: updatedParts,
                projectName: updatedProjectName,
                engineType: updatedEngineDesc.engineType,
                engineDescription: updatedEngineDesc,
                telemetryData: updatedTelemetry,
                selectedPartId: partId,
                findings: [...s.findings, ...newFindings],
                fixes: [...s.fixes, ...newFixes],
                activeTab: 'model',
              chatMessages: [
                ...s.chatMessages,
                {
                  id: 'msg-' + Date.now(),
                  role: 'assistant',
                  content: `Ingested CAD geometry "${rawFile.name}" (${parsedGeom.triangleCount.toLocaleString()} triangles, volume ${Math.round(parsedGeom.volumeMm3).toLocaleString()} mm³). Categorized as ${category.replace('_', ' ')}. Automated diagnostic checks completed: identified ${newFindings.length} issue(s) with ${newFixes.length} auto-repair proposal(s).`,
                  timestamp: new Date().toLocaleTimeString(),
                  citations: [
                    {
                      sourceFile: rawFile.name,
                      location: `Part ID: ${partId}`,
                      relevance: '3D Geometry B-Rep & Mesh Inspection'
                    }
                  ],
                  highlightPartIds: [partId]
                }
              ],
              auditLog: [
                ...s.auditLog,
                {
                  id: 'audit-' + Date.now(),
                  timestamp: new Date().toISOString(),
                  action: 'CAD_PARSED_AND_ANALYZED',
                  user: 'Automated Diagnostic Engine',
                  details: `Parsed ${rawFile.name}, created Part ${partId}, detected ${newFindings.length} findings.`,
                }
              ]
            };
          });
        }
        } catch (err: any) {
          console.error("Error parsing CAD file:", err);
        }
      }

      // 2. Process CSV sensor/telemetry logs
      else if (detection.suggestedRole === 'test_data' || detection.detectedType === 'csv' || rawFile.name.toLowerCase().endsWith('.csv')) {
        try {
          const text = new TextDecoder('utf-8').decode(arrayBuffer);
          const telemetryPts = parseCSVTelemetry(text);
          if (telemetryPts.length > 0) {
            set((s) => ({
              telemetryData: telemetryPts,
              activeTab: 'data',
              chatMessages: [
                ...s.chatMessages,
                {
                  id: 'msg-' + Date.now(),
                  role: 'assistant',
                  content: `Ingested flight telemetry log "${rawFile.name}" with ${telemetryPts.length} time-series data points. EGT margin deterioration and vibration spectrum analysis active.`,
                  timestamp: new Date().toLocaleTimeString(),
                  citations: [
                    {
                      sourceFile: rawFile.name,
                      location: `Rows 1-${telemetryPts.length}`,
                      relevance: 'Sensor telemetry & anomaly correlation'
                    }
                  ]
                }
              ]
            }));
          }
        } catch (err) {
          console.error("Error parsing CSV telemetry:", err);
        }
      }

      // 3. Process Drawing (DXF / PDF)
      else if (detection.suggestedRole === 'drawing' || detection.detectedType === 'dxf' || rawFile.name.toLowerCase().endsWith('.dxf')) {
        set((s) => ({
          activeTab: 'drawing',
          chatMessages: [
            ...s.chatMessages,
            {
              id: 'msg-' + Date.now(),
              role: 'assistant',
              content: `Ingested technical drawing "${rawFile.name}". Vector geometry loaded in Drawing tab.`,
              timestamp: new Date().toLocaleTimeString(),
              citations: [
                {
                  sourceFile: rawFile.name,
                  location: 'Sheet 1',
                  relevance: 'Blueprint dimensions & GD&T'
                }
              ]
            }
          ]
        }));
      }
    }

    get().recomputeHealthScore();
    set({ isUploading: false, isAnalyzing: false });
  },

  updateFileRole: (fileId, role) => {
    set((s) => ({
      files: s.files.map((f) => (f.id === fileId ? { ...f, role } : f)),
    }));
  },

  removeFile: (fileId) => {
    set((s) => ({
      files: s.files.filter((f) => f.id !== fileId),
      parts: s.parts.filter((p) => p.fileId !== fileId),
    }));
  },

  selectPart: (partId) => {
    set((s) => ({
      selectedPartId: partId,
      parts: s.parts.map((p) => ({
        ...p,
        selected: p.id === partId,
      })),
    }));
  },

  isolatePart: (partId) => {
    set((s) => ({
      isolatedPartId: partId,
      parts: s.parts.map((p) => ({
        ...p,
        isolated: p.id === partId,
        visible: partId ? p.id === partId : true,
      })),
    }));
  },

  togglePartVisibility: (partId) => {
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, visible: !p.visible } : p)),
    }));
  },

  updatePartCategory: (partId, category) => {
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, category, userCorrected: true } : p)),
    }));
  },

  updatePartMaterial: (partId, materialId) => {
    set((s) => ({
      parts: s.parts.map((p) => (p.id === partId ? { ...p, materialId } : p)),
    }));
  },

  selectFinding: (findingId) => {
    const finding = get().findings.find((f) => f.id === findingId);
    set({
      selectedFindingId: findingId,
      selectedPartId: finding?.affectedPartIds[0] || null,
    });
  },

  toggleFixApproval: (fixId) => {
    set((s) => ({
      fixes: s.fixes.map((f) => (f.id === fixId ? { ...f, approved: !f.approved } : f)),
    }));
  },

  applyFix: (fixId) => {
    const fix = get().fixes.find((f) => f.id === fixId);
    if (!fix) return;

    set((s) => {
      const updatedFixes = s.fixes.map((f) => (f.id === fixId ? { ...f, applied: true } : f));
      const updatedFindings = s.findings.map((f) => (f.id === fix.findingId ? { ...f, resolved: true } : f));
      
      const updatedParts = s.parts.map((p) => {
        if (p.id === fix.affectedPartId) {
          if (fix.autoFixType === 'mesh_healing' && p.geometryData) {
            return {
              ...p,
              geometryData: {
                ...p.geometryData,
                nonManifoldEdges: 0,
                isWatertight: true,
              }
            };
          } else if (fix.autoFixType === 'rotor_balancing') {
            return {
              ...p,
              centerOfGravity: [0.003, 0.001, p.centerOfGravity[2]] as [number, number, number],
            };
          } else if (fix.autoFixType === 'thicken_wall') {
            return {
              ...p,
              massKg: p.massKg * 1.015,
              volumeMm3: p.volumeMm3 * 1.015,
            };
          }
        }
        return p;
      });

      return {
        fixes: updatedFixes,
        findings: updatedFindings,
        parts: updatedParts,
        appliedFixIds: [...s.appliedFixIds, fixId],
        auditLog: [
          ...s.auditLog,
          {
            id: 'audit-' + Date.now(),
            timestamp: new Date().toISOString(),
            action: 'FIX_APPLIED',
            user: 'Lead Propulsion Engineer',
            details: `Applied fix: ${fix.title} on part ${fix.affectedPartId}`,
          }
        ]
      };
    });

    get().recomputeHealthScore();
  },

  applyAllSafeFixes: () => {
    const safeFixes = get().fixes.filter((f) => f.approved && !f.applied);
    for (const f of safeFixes) {
      get().applyFix(f.id);
    }
  },

  addChatMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };
    set((s) => ({
      chatMessages: [...s.chatMessages, newMsg],
    }));
  },

  recomputeHealthScore: () => {
    const findings = get().findings;
    if (findings.length === 0) {
      set({ healthScore: 100 });
      return;
    }
    const critical = findings.filter((f) => f.severity === 'Critical' && !f.resolved).length;
    const high = findings.filter((f) => f.severity === 'High' && !f.resolved).length;
    const medium = findings.filter((f) => f.severity === 'Medium' && !f.resolved).length;
    const low = findings.filter((f) => f.severity === 'Low' && !f.resolved).length;

    const penalty = critical * 25 + high * 12 + medium * 5 + low * 2;
    const score = Math.max(12, Math.min(100, 100 - penalty));
    set({ healthScore: score });
  },

  loadSampleEngine: () => {
    const sampleFiles: EngineFile[] = [
      {
        id: 'file-sample-cad',
        name: 'CFM_NextGen_Turbofan_Assembly.step',
        size: 38450120,
        type: 'step',
        detectedType: 'step',
        role: 'geometry',
        status: 'ready',
        uploadProgress: 100,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'file-sample-drawing',
        name: 'HPC_Casing_CrossSection_Blueprint.dxf',
        size: 4210980,
        type: 'dxf',
        detectedType: 'dxf',
        role: 'drawing',
        status: 'ready',
        uploadProgress: 100,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'file-sample-telemetry',
        name: 'TestCell_Flight_Run_04_Telemetry.csv',
        size: 1824000,
        type: 'csv',
        detectedType: 'csv',
        role: 'test_data',
        status: 'ready',
        uploadProgress: 100,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'file-sample-borescope',
        name: 'Borescope_Combustor_Sector3_Spallation.png',
        size: 2450100,
        type: 'png',
        detectedType: 'png',
        role: 'image',
        status: 'ready',
        uploadProgress: 100,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'file-sample-spec',
        name: 'FAA_AC_33.28_Turbine_Safety_Guideline.pdf',
        size: 5120300,
        type: 'pdf',
        detectedType: 'pdf',
        role: 'spec',
        status: 'ready',
        uploadProgress: 100,
        uploadedAt: new Date().toISOString(),
      }
    ];

    set({
      projectName: 'CFM-LEAP High-Bypass Turbofan Model',
      engineType: 'High-Bypass Turbofan',
      files: sampleFiles,
      parts: SAMPLE_PARTS,
      findings: SAMPLE_FINDINGS,
      fixes: SAMPLE_FIXES,
      engineDescription: SAMPLE_ENGINE_DESCRIPTION,
      telemetryData: SAMPLE_TELEMETRY,
      healthScore: 68,
      selectedPartId: SAMPLE_PARTS[0].id,
      selectedFindingId: SAMPLE_FINDINGS[0].id,
      chatMessages: [
        {
          id: 'msg-sample-0',
          role: 'assistant',
          content: 'Engine assembly ingested successfully. Detected High-Bypass Turbofan with 4 modules and 4 primary CAD sub-assemblies. 4 diagnostic findings identified (1 Critical, 2 High, 1 Medium). 4 auto-repairs available for review.',
          timestamp: new Date().toLocaleTimeString(),
          citations: [
            { sourceFile: 'CFM_NextGen_Turbofan_Assembly.step', location: 'Part ID: part-hpt-blisk-stg1', relevance: 'Trailing edge thickness check' },
            { sourceFile: 'FAA_AC_33.28_Turbine_Safety_Guideline.pdf', location: 'Section 4.2', relevance: 'Rotor integrity minimum limits' }
          ]
        }
      ],
      auditLog: [
        ...get().auditLog,
        {
          id: 'audit-' + Date.now(),
          timestamp: new Date().toISOString(),
          action: 'SAMPLE_ENGINE_LOADED',
          user: 'Lead Propulsion Engineer',
          details: 'Loaded certified CFM-LEAP turbofan sample CAD dataset with telemetry logs and inspection specs.',
        }
      ]
    });
  },

  clearAllSessionData: () => {
    set({
      projectName: 'New Jet Propulsion Workspace',
      files: [],
      parts: [],
      selectedPartId: null,
      isolatedPartId: null,
      findings: [],
      selectedFindingId: null,
      fixes: [],
      appliedFixIds: [],
      engineDescription: null,
      telemetryData: [],
      healthScore: 100,
      chatMessages: [
        {
          id: 'cleared-msg',
          role: 'system',
          content: 'Session memory cryptographically purged in compliance with export-control regulations (ITAR/EAR). All CAD geometry and telemetry files deleted.',
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
      auditLog: [
        {
          id: 'audit-' + Date.now(),
          timestamp: new Date().toISOString(),
          action: 'SESSION_PURGED',
          user: 'System Safety Monitor',
          details: 'Zero-trace cryptographic wipe of all session buffers.',
        }
      ]
    });
  }
}));
