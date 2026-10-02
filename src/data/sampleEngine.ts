import { Part, Finding, Fix, EngineDescription, TelemetryDataPoint } from '../types';

/**
 * Procedural geometry generators for realistic jet engine CAD parts
 */
function createTurbineBliskGeometry(numBlades: number = 24, radius: number = 220, bladeLength: number = 75) {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertOffset = 0;

  // 1. Central Disk Hub (Cylinder)
  const segments = 48;
  const hubRadius = radius - bladeLength;
  const hubThickness = 45;

  for (let s = 0; s < segments; s++) {
    const theta1 = (s / segments) * Math.PI * 2;
    const theta2 = ((s + 1) / segments) * Math.PI * 2;

    const x1 = Math.cos(theta1) * hubRadius;
    const y1 = Math.sin(theta1) * hubRadius;
    const x2 = Math.cos(theta2) * hubRadius;
    const y2 = Math.sin(theta2) * hubRadius;

    // Front face
    vertices.push(0, 0, hubThickness / 2, x1, y1, hubThickness / 2, x2, y2, hubThickness / 2);
    normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    // Back face
    vertices.push(0, 0, -hubThickness / 2, x2, y2, -hubThickness / 2, x1, y1, -hubThickness / 2);
    normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    // Outer rim cylinder
    vertices.push(x1, y1, hubThickness / 2, x1, y1, -hubThickness / 2, x2, y2, -hubThickness / 2);
    normals.push(x1, y1, 0, x1, y1, 0, x2, y2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    vertices.push(x1, y1, hubThickness / 2, x2, y2, -hubThickness / 2, x2, y2, hubThickness / 2);
    normals.push(x1, y1, 0, x2, y2, 0, x2, y2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;
  }

  // 2. Airfoil Blades with aerodynamic twist
  for (let b = 0; b < numBlades; b++) {
    const bladeAngle = (b / numBlades) * Math.PI * 2;
    const chord = 32;

    for (let rStep = 0; rStep < 4; rStep++) {
      const r1 = hubRadius + (rStep / 4) * bladeLength;
      const r2 = hubRadius + ((rStep + 1) / 4) * bladeLength;
      const twist1 = (rStep / 4) * 0.45; // 25 degree twist
      const twist2 = ((rStep + 1) / 4) * 0.45;

      const pX1 = Math.cos(bladeAngle) * r1;
      const pY1 = Math.sin(bladeAngle) * r1;
      const pX2 = Math.cos(bladeAngle) * r2;
      const pY2 = Math.sin(bladeAngle) * r2;

      // Airfoil camber offset
      const cx1 = Math.cos(bladeAngle + Math.PI / 2 + twist1) * (chord * (1 - rStep * 0.15));
      const cy1 = Math.sin(bladeAngle + Math.PI / 2 + twist1) * (chord * (1 - rStep * 0.15));
      const cx2 = Math.cos(bladeAngle + Math.PI / 2 + twist2) * (chord * (1 - (rStep + 1) * 0.15));
      const cy2 = Math.sin(bladeAngle + Math.PI / 2 + twist2) * (chord * (1 - (rStep + 1) * 0.15));

      // Blade quad
      vertices.push(pX1, pY1, 0, pX1 + cx1, pY1 + cy1, 10, pX2 + cx2, pY2 + cy2, 10);
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
      vertOffset += 3;

      vertices.push(pX1, pY1, 0, pX2 + cx2, pY2 + cy2, 10, pX2, pY2, 0);
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
      vertOffset += 3;
    }
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    triangleCount: indices.length / 3,
    isWatertight: false,
    nonManifoldEdges: 14,
  };
}

function createCylindricalCasingGeometry(radius: number = 240, length: number = 320, thickness: number = 8) {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertOffset = 0;
  const segments = 48;

  for (let s = 0; s < segments; s++) {
    const theta1 = (s / segments) * Math.PI * 2;
    const theta2 = ((s + 1) / segments) * Math.PI * 2;

    const x1 = Math.cos(theta1) * radius;
    const y1 = Math.sin(theta1) * radius;
    const x2 = Math.cos(theta2) * radius;
    const y2 = Math.sin(theta2) * radius;

    const xi1 = Math.cos(theta1) * (radius - thickness);
    const yi1 = Math.sin(theta1) * (radius - thickness);
    const xi2 = Math.cos(theta2) * (radius - thickness);
    const yi2 = Math.sin(theta2) * (radius - thickness);

    const z1 = -length / 2;
    const z2 = length / 2;

    // Outer wall
    vertices.push(x1, y1, z1, x1, y1, z2, x2, y2, z2);
    normals.push(x1, y1, 0, x1, y1, 0, x2, y2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    vertices.push(x1, y1, z1, x2, y2, z2, x2, y2, z1);
    normals.push(x1, y1, 0, x2, y2, 0, x2, y2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    // Inner wall
    vertices.push(xi1, yi1, z2, xi1, yi1, z1, xi2, yi2, z1);
    normals.push(-xi1, -yi1, 0, -xi1, -yi1, 0, -xi2, -yi2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    vertices.push(xi1, yi1, z2, xi2, yi2, z1, xi2, yi2, z2);
    normals.push(-xi1, -yi1, 0, -xi2, -yi2, 0, -xi2, -yi2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    triangleCount: indices.length / 3,
    isWatertight: true,
    nonManifoldEdges: 0,
  };
}

function createRotorShaftGeometry(radius: number = 42, length: number = 580) {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertOffset = 0;
  const segments = 36;

  for (let s = 0; s < segments; s++) {
    const theta1 = (s / segments) * Math.PI * 2;
    const theta2 = ((s + 1) / segments) * Math.PI * 2;

    const x1 = Math.cos(theta1) * radius;
    const y1 = Math.sin(theta1) * radius;
    const x2 = Math.cos(theta2) * radius;
    const y2 = Math.sin(theta2) * radius;

    const z1 = -length / 2;
    const z2 = length / 2;

    vertices.push(x1, y1, z1, x1, y1, z2, x2, y2, z2);
    normals.push(x1, y1, 0, x1, y1, 0, x2, y2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;

    vertices.push(x1, y1, z1, x2, y2, z2, x2, y2, z1);
    normals.push(x1, y1, 0, x2, y2, 0, x2, y2, 0);
    indices.push(vertOffset, vertOffset + 1, vertOffset + 2);
    vertOffset += 3;
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    triangleCount: indices.length / 3,
    isWatertight: true,
    nonManifoldEdges: 0,
  };
}

export const SAMPLE_PARTS: Part[] = [
  {
    id: 'part-hpt-blisk-stg1',
    fileId: 'file-sample-cad',
    name: 'HPT Stage 1 High-Pressure Turbine Blisk',
    category: 'turbine_rotor',
    classificationConfidence: 98.4,
    materialId: 'cmsx-4',
    volumeMm3: 1420500,
    surfaceAreaMm2: 382400,
    massKg: 12.35,
    boundingBox: {
      min: [-220, -220, -25],
      max: [220, 220, 25],
      dimensions: [440, 440, 50],
    },
    centerOfGravity: [0.08, -0.04, 2.1],
    momentsOfInertia: [0.312, 0.312, 0.618],
    geometryData: createTurbineBliskGeometry(24, 220, 75),
    visible: true,
    isolated: false,
    selected: false,
    color: '#00f0ff',
  },
  {
    id: 'part-casing-hpc',
    fileId: 'file-sample-cad',
    name: 'High-Pressure Compressor Stator Casing',
    category: 'casing',
    classificationConfidence: 96.2,
    materialId: 'ti-6al-4v',
    volumeMm3: 2150000,
    surfaceAreaMm2: 520000,
    massKg: 9.52,
    boundingBox: {
      min: [-240, -240, -160],
      max: [240, 240, 160],
      dimensions: [480, 480, 320],
    },
    centerOfGravity: [0, 0, 0],
    momentsOfInertia: [0.82, 0.82, 1.45],
    geometryData: createCylindricalCasingGeometry(235, 320, 6),
    visible: true,
    isolated: false,
    selected: false,
    color: '#4a5568',
  },
  {
    id: 'part-shaft-n2',
    fileId: 'file-sample-cad',
    name: 'N2 High-Pressure Spool Central Shaft',
    category: 'shaft',
    classificationConfidence: 99.1,
    materialId: 'inconel-718',
    volumeMm3: 985000,
    surfaceAreaMm2: 182000,
    massKg: 8.06,
    boundingBox: {
      min: [-42, -42, -290],
      max: [42, 42, 290],
      dimensions: [84, 84, 580],
    },
    centerOfGravity: [0.048, -0.012, 12.4],
    momentsOfInertia: [0.038, 0.038, 0.007],
    geometryData: createRotorShaftGeometry(42, 580),
    visible: true,
    isolated: false,
    selected: false,
    color: '#ff7300',
  },
  {
    id: 'part-hpc-rotor-stg3',
    fileId: 'file-sample-cad',
    name: 'HPC Stage 3 Compressor Bladed Disc',
    category: 'compressor_rotor',
    classificationConfidence: 94.7,
    materialId: 'ti-6al-4v',
    volumeMm3: 1120000,
    surfaceAreaMm2: 295000,
    massKg: 4.96,
    boundingBox: {
      min: [-190, -190, -18],
      max: [190, 190, 18],
      dimensions: [380, 380, 36],
    },
    centerOfGravity: [0.01, 0.02, -85.0],
    momentsOfInertia: [0.18, 0.18, 0.35],
    geometryData: createTurbineBliskGeometry(32, 190, 52),
    visible: true,
    isolated: false,
    selected: false,
    color: '#00ff88',
  },
];

export const SAMPLE_FINDINGS: Finding[] = [
  {
    id: 'FIND-001',
    title: 'HPT Stage 1: Trailing Edge Wall Thickness Below Safety Minimum',
    affectedPartIds: ['part-hpt-blisk-stg1'],
    category: 'structural',
    severity: 'Critical',
    confidence: 96.8,
    evidence: 'Measured trailing edge thickness t_te = 0.42 mm (Design limit t_min >= 0.85 mm). High stress concentration Kt = 3.82 calculated under centrifugal hoop load at 14,200 RPM.',
    valueOrigin: 'Measured',
    pinCoordinates: [160, 120, 15],
    probableCause: 'Tessellation truncation during neutral CAD export or aggressive aerodynamic camber optimization without manufacturing thickness constraint.',
    consequenceIfUnresolved: 'Creep rupture or high-cycle thermal-mechanical fatigue blade liberation under full takeoff thrust (TIT = 1,480°C). Airworthiness hazard.',
    recommendedFix: 'Thicken trailing edge airfoil profile from 0.42 mm to 0.90 mm with a parabolic blend radius over the spanwise 70-100% blade height.',
    isAutoFixable: true,
    applicableStandard: 'FAA AC 33.28-1 / EASA CS-E 740 (Rotor Integrity)',
    resolved: false,
  },
  {
    id: 'FIND-002',
    title: 'N2 Shaft: Dynamic Mass Unbalance Exceeds ISO 1940-1 Grade G2.5',
    affectedPartIds: ['part-shaft-n2'],
    category: 'vibration',
    severity: 'High',
    confidence: 94.2,
    evidence: 'CG eccentric offset e = 0.048 mm from longitudinal center-axis. At 14,200 RPM, residual unbalance generates 4.1 kN rotating centrifugal force on #3 bearing.',
    valueOrigin: 'Calculated',
    pinCoordinates: [0, 35, 120],
    probableCause: 'Non-symmetric inner spline bore relief cut and asymmetric lubrication passage drillings.',
    consequenceIfUnresolved: 'Accelerated bearing fatigue, cage spalling, and cabin airframe vibration spike exceeding 1.2 IPS.',
    recommendedFix: 'Rebalance rotor by precision milling a 12mm x 4mm balancing relief flat at theta = 214° on the forward balancing plane flange.',
    isAutoFixable: true,
    applicableStandard: 'ISO 1940-1 / MIL-STD-167-1 (Mechanical Vibrations)',
    resolved: false,
  },
  {
    id: 'FIND-003',
    title: 'HPC Stage 3: Blade Tip Radial Running Clearance Insufficient',
    affectedPartIds: ['part-hpc-rotor-stg3', 'part-casing-hpc'],
    category: 'aerodynamic',
    severity: 'High',
    confidence: 91.5,
    evidence: 'Cold radial clearance delta_r = 0.62 mm. Under thermal expansion calculation (alpha = 8.6e-6 /K, delta_T = 320°C) and centrifugal growth, running clearance reduces to 0.08 mm.',
    valueOrigin: 'Calculated',
    pinCoordinates: [-185, 45, -85],
    probableCause: 'Thermal pinch point during throttle burst (snap takeoff) where rotor thermal growth outpaces casing expansion.',
    consequenceIfUnresolved: 'Rotor blade tip rub against abrasive abradable seal, causing titanium fire risk and aerodynamic stall.',
    recommendedFix: 'Adjust cold blade tip radius by -0.45 mm to maintain minimum hot running clearance of 0.55 mm.',
    isAutoFixable: true,
    applicableStandard: 'FAA FAR Part 33.75 / Rolls-Royce Turbomachinery Design Guide',
    resolved: false,
  },
  {
    id: 'FIND-004',
    title: 'HPT Stage 1 Blisk: 14 Non-Manifold Edges and 6 Inverted Normals',
    affectedPartIds: ['part-hpt-blisk-stg1'],
    category: 'manufacturing',
    severity: 'Medium',
    confidence: 99.0,
    evidence: 'Topological analysis detected 14 unclosed facet boundaries and 6 flipped face normal vectors at blade root fillets.',
    valueOrigin: 'Measured',
    pinCoordinates: [110, -85, 20],
    probableCause: 'STEP/IGES B-rep triangulation stitching tolerance mismatch (> 0.005 mm).',
    consequenceIfUnresolved: 'Causes slicing errors in 5-axis CAM machining toolpath generation and additive manufacturing DMLS printing.',
    recommendedFix: 'Automated mesh healing: stitch open boundary vertices within 0.01 mm tolerance and unify normal orientations outwards.',
    isAutoFixable: true,
    applicableStandard: 'ISO 10303-242 / ASME Y14.41',
    resolved: false,
  }
];

export const SAMPLE_FIXES: Fix[] = [
  {
    id: 'FIX-001',
    findingId: 'FIND-001',
    title: 'Reinforce HPT Stage 1 Trailing Edge Thickness',
    description: 'Offset airfoil suction and pressure surface facets along chordal normal vectors to expand trailing edge radius to 0.90 mm.',
    affectedPartId: 'part-hpt-blisk-stg1',
    autoFixType: 'thicken_wall',
    impactMetrics: [
      { metric: 'Trailing Edge Thickness', before: '0.42 mm', after: '0.90 mm', deltaPercent: 114.3 },
      { metric: 'Stress Concentration Kt', before: '3.82', after: '1.95', deltaPercent: -48.9 },
      { metric: 'Part Mass Delta', before: '12.35 kg', after: '12.48 kg', deltaPercent: 1.05 }
    ],
    approved: true,
    applied: false,
  },
  {
    id: 'FIX-002',
    findingId: 'FIND-002',
    title: 'Dynamic Mass Balancing of N2 Shaft',
    description: 'Add compensating material balance pocket at theta = 214° on balancing ring land to bring CG eccentric offset within ISO G2.5 limits.',
    affectedPartId: 'part-shaft-n2',
    autoFixType: 'rotor_balancing',
    impactMetrics: [
      { metric: 'CG Offset (e)', before: '0.048 mm', after: '0.006 mm', deltaPercent: -87.5 },
      { metric: 'Bearing Load @ 14.2k RPM', before: '4.10 kN', after: '0.51 kN', deltaPercent: -87.5 },
      { metric: 'Balance Grade', before: 'G10 (Fail)', after: 'G1.8 (Pass)' }
    ],
    approved: true,
    applied: false,
  },
  {
    id: 'FIX-003',
    findingId: 'FIND-003',
    title: 'Recut Blade Tip Radial Profile for Thermal Growth Clearance',
    description: 'Turn blade tip diameter down by 0.45 mm to satisfy hot operating clearance envelope.',
    affectedPartId: 'part-hpc-rotor-stg3',
    autoFixType: 'adjust_clearance',
    impactMetrics: [
      { metric: 'Cold Tip Clearance', before: '0.62 mm', after: '1.07 mm', deltaPercent: 72.5 },
      { metric: 'Hot Running Clearance', before: '0.08 mm', after: '0.53 mm', deltaPercent: 562.5 },
      { metric: 'Rub Risk', before: 'Severe (Red)', after: 'Nominal (Green)' }
    ],
    approved: false,
    applied: false,
  },
  {
    id: 'FIX-004',
    findingId: 'FIND-004',
    title: 'Mesh Healing & Normal Unification',
    description: 'Weld coincident vertices, close 14 boundary edges, and flip 6 inverted face normal vectors.',
    affectedPartId: 'part-hpt-blisk-stg1',
    autoFixType: 'mesh_healing',
    impactMetrics: [
      { metric: 'Non-Manifold Edges', before: '14', after: '0', deltaPercent: -100 },
      { metric: 'Inverted Normals', before: '6', after: '0', deltaPercent: -100 },
      { metric: 'Watertightness', before: 'False', after: 'True' }
    ],
    approved: true,
    applied: false,
  }
];

export const SAMPLE_ENGINE_DESCRIPTION: EngineDescription = {
  engineType: 'High-Bypass Turbofan',
  architectureSummary: 'Two-spool high-bypass commercial propulsion engine with 1-stage fan, 3-stage booster, 10-stage high-pressure compressor (HPC), through-flow annular combustor, 2-stage high-pressure turbine (HPT), and 7-stage low-pressure turbine (LPT).',
  spoolsCount: 2,
  estimatedBypassRatio: 11.2,
  estimatedOverallPressureRatio: 40.5,
  estimatedThrustKN: 135.0,
  estimatedTurbineInletTempC: 1520,
  modules: [
    {
      name: 'Fan & Low Pressure Compressor',
      stages: 4,
      partCount: 48,
      totalMassKg: 385.0,
      description: 'Wide-chord hollow titanium fan blades with composite containment casing and 3-stage booster.',
    },
    {
      name: 'High-Pressure Compressor (HPC)',
      stages: 10,
      partCount: 164,
      totalMassKg: 242.0,
      description: 'Axial compressor with variable inlet guide vanes (VIGVs) and variable stator vanes on stages 1-3.',
    },
    {
      name: 'Annular Combustor',
      stages: 1,
      partCount: 36,
      totalMassKg: 68.0,
      description: 'Low-emissions TAPS (Twin Annular Premixing Swirler) combustor with SiC/SiC ceramic matrix composite liners.',
    },
    {
      name: 'High-Pressure Turbine (HPT)',
      stages: 2,
      partCount: 96,
      totalMassKg: 148.0,
      description: 'Air-cooled single-crystal CMSX-4 nickel alloy blades with thermal barrier coating (YSZ TBC).',
    },
    {
      name: 'Low-Pressure Turbine (LPT)',
      stages: 7,
      partCount: 210,
      totalMassKg: 310.0,
      description: 'High-efficiency uncooled titanium-aluminide (TiAl) rotor blades driving the fan via central concentric shaft.',
    }
  ],
  assumptions: [
    'Calculations assume ISA Sea Level conditions (101.325 kPa, 15°C, Mach 0.0).',
    'Component masses computed using aerospace alloy density values from AMS/ASTM specifications.',
    'Thermal expansion estimates assume steady-state climb power setting at 95% N2.'
  ],
  missingDataWarnings: [
    'Combustor fuel nozzle spray angle and swirler geometry not present in CAD exchange file.',
    'Borescope inspection report for combustor rear liner section 3 is missing.'
  ]
};

export const SAMPLE_TELEMETRY: TelemetryDataPoint[] = Array.from({ length: 40 }, (_, i) => {
  const flightProgress = i / 40;
  let phase: TelemetryDataPoint['flightPhase'] = 'cruise';
  if (flightProgress < 0.15) phase = 'takeoff';
  else if (flightProgress < 0.35) phase = 'climb';
  else if (flightProgress > 0.85) phase = 'descent';

  const n1 = phase === 'takeoff' ? 4950 : phase === 'climb' ? 4820 : phase === 'cruise' ? 4400 : 2100;
  const n2 = phase === 'takeoff' ? 14200 : phase === 'climb' ? 13950 : phase === 'cruise' ? 13200 : 7800;
  
  // Simulated gradual EGT degradation
  const egtMargin = Math.max(14, 42 - (i * 0.7) + (Math.sin(i * 0.8) * 2.5));
  const egt = 840 + (42 - egtMargin) * 3.2;

  return {
    timestamp: `T+${String(i * 2).padStart(2, '0')}:00`,
    flightPhase: phase,
    n1_rpm: n1 + Math.round((Math.random() - 0.5) * 40),
    n2_rpm: n2 + Math.round((Math.random() - 0.5) * 80),
    egt_celsius: Math.round(egt),
    egt_margin_celsius: Math.round(egtMargin * 10) / 10,
    fuel_flow_pph: phase === 'takeoff' ? 5200 : phase === 'cruise' ? 2450 : 920,
    oil_pressure_psi: 48.5 + (Math.random() - 0.5) * 2,
    oil_temp_celsius: 92.0 + i * 0.3,
    vibration_n1_ips: 0.22 + (Math.random() * 0.08),
    vibration_n2_ips: 0.68 + (i > 25 ? 0.35 : 0) + (Math.random() * 0.12), // spike in N2 vibration
  };
});
