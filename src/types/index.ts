// Types and Interfaces for JetEngine AI Workbench

export type EngineType = 
  | 'High-Bypass Turbofan'
  | 'Low-Bypass Turbofan'
  | 'Turbojet'
  | 'Turboprop'
  | 'Turboshaft'
  | 'Ramjet'
  | 'Scramjet';

export type FileRole = 'geometry' | 'drawing' | 'test_data' | 'spec' | 'image' | 'other';
export type FileStatus = 'uploading' | 'parsing' | 'ready' | 'error';
export type UnitsSystem = 'metric' | 'imperial';

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
  dimensions: [number, number, number]; // [width, height, depth]
}

export interface EngineFile {
  id: string;
  name: string;
  size: number;
  type: string; // 'step' | 'stl' | 'obj' | 'dxf' | 'csv' | 'pdf' | 'png' | etc.
  detectedType: string;
  role: FileRole;
  status: FileStatus;
  uploadProgress: number; // 0 - 100
  uploadedAt: string;
  errorMessage?: string;
  arrayBuffer?: ArrayBuffer;
  textData?: string;
  nativeCadWarning?: boolean;
}

export type PartCategory =
  | 'fan_blade'
  | 'fan_disk'
  | 'compressor_rotor'
  | 'compressor_stator'
  | 'combustor_liner'
  | 'fuel_nozzle'
  | 'turbine_rotor'
  | 'turbine_nozzle'
  | 'shaft'
  | 'bearing_housing'
  | 'casing'
  | 'exhaust_nozzle'
  | 'accessory_gearbox'
  | 'unclassified';

export interface Material {
  id: string;
  name: string;
  grade: string;
  densityKgM3: number;
  yieldStrengthMPa: number;
  ultimateStrengthMPa: number;
  elasticModulusGPa: number;
  maxTempC: number;
  thermalExpansionCoeff: number; // /K
}

export interface Part {
  id: string;
  fileId: string;
  name: string;
  category: PartCategory;
  classificationConfidence: number; // 0 - 100
  userCorrected?: boolean;
  materialId: string;
  
  // Geometric properties
  volumeMm3: number;
  surfaceAreaMm2: number;
  massKg: number;
  boundingBox: BoundingBox;
  centerOfGravity: [number, number, number];
  momentsOfInertia: [number, number, number]; // [Ixx, Iyy, Izz]
  
  // Mesh buffer data for 3D visualization
  geometryData?: {
    vertices: Float32Array;
    normals: Float32Array;
    indices?: Uint32Array | Uint16Array;
    triangleCount: number;
    isWatertight: boolean;
    nonManifoldEdges: number;
  };

  // View state
  visible: boolean;
  isolated: boolean;
  selected: boolean;
  color?: string;
}

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type FindingCategory = 
  | 'design' 
  | 'manufacturing' 
  | 'thermal' 
  | 'structural' 
  | 'aerodynamic' 
  | 'vibration' 
  | 'maintenance';

export interface Finding {
  id: string;
  title: string;
  affectedPartIds: string[];
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: number; // 0 - 100
  evidence: string;
  valueOrigin: 'Measured' | 'Calculated' | 'Estimated';
  pinCoordinates?: [number, number, number]; // 3D anchor position
  probableCause: string;
  consequenceIfUnresolved: string;
  recommendedFix: string;
  isAutoFixable: boolean;
  applicableStandard?: string; // e.g. "FAA AC 33.28-1", "EASA CS-E 740", "ASME Y14.5"
  resolved?: boolean;
}

export interface MetricDelta {
  metric: string;
  before: string | number;
  after: string | number;
  unit?: string;
  deltaPercent?: number;
}

export interface Fix {
  id: string;
  findingId: string;
  title: string;
  description: string;
  affectedPartId: string;
  autoFixType: 
    | 'mesh_healing' 
    | 'thicken_wall' 
    | 'adjust_clearance' 
    | 'rotor_balancing' 
    | 'fillet_stress_relief' 
    | 'invert_normals';
  impactMetrics: MetricDelta[];
  approved: boolean;
  applied: boolean;
  beforeGeometry?: Float32Array;
  afterGeometry?: Float32Array;
}

export interface EngineModule {
  name: string;
  stages: number;
  partCount: number;
  totalMassKg: number;
  description: string;
}

export interface EngineDescription {
  engineType: EngineType;
  architectureSummary: string;
  spoolsCount: number;
  estimatedBypassRatio: number;
  estimatedOverallPressureRatio: number;
  estimatedThrustKN: number;
  estimatedTurbineInletTempC: number;
  modules: EngineModule[];
  assumptions: string[];
  missingDataWarnings: string[];
}


export interface TelemetryDataPoint {
  timestamp: string;
  flightPhase: 'idle' | 'takeoff' | 'climb' | 'cruise' | 'descent';
  n1_rpm: number;
  n2_rpm: number;
  egt_celsius: number;
  egt_margin_celsius: number;
  fuel_flow_pph: number;
  oil_pressure_psi: number;
  oil_temp_celsius: number;
  vibration_n1_ips: number;
  vibration_n2_ips: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: {
    sourceFile: string;
    location: string;
    relevance: string;
  }[];
  highlightPartIds?: string[];
  suggestedFixId?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}
