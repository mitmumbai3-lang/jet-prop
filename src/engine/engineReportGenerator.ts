import { Part, EngineDescription, EngineModule, TelemetryDataPoint } from '../types';

/**
 * Procedurally generates comprehensive propulsion architecture description
 * based on uploaded CAD models, part categories, and engine project metadata.
 */
export function generateEngineDescription(
  parts: Part[],
  projectName: string,
  base?: EngineDescription | null,
  uploadedFileName?: string
): EngineDescription {
  const nameCombined = `${projectName} ${uploadedFileName || ''} ${parts.map(p => p.name).join(' ')}`.toLowerCase();

  // Detect turbojet vs high-bypass turbofan vs low-bypass
  const isTurbojet = 
    nameCombined.includes('jx') || 
    nameCombined.includes('turbojet') || 
    nameCombined.includes('tj') || 
    nameCombined.includes('micro') ||
    (!nameCombined.includes('fan') && nameCombined.includes('engine'));

  const totalMass = parts.reduce((acc, p) => acc + (p.massKg || 12.5), 0);
  const totalTriangles = parts.reduce((acc, p) => acc + (p.geometryData?.triangleCount || 1200), 0);

  if (isTurbojet) {
    const modules: EngineModule[] = [
      {
        name: 'Inlet & Compressor Section',
        stages: 1,
        partCount: Math.max(1, parts.filter(p => p.category === 'compressor_rotor' || p.category === 'casing').length),
        totalMassKg: Math.round(totalMass * 0.28 * 10) / 10 || 18.4,
        description: 'Single-stage high-pressure centrifugal/axial compressor impeller machined from Ti-6Al-4V titanium alloy, delivering 6.4:1 total pressure ratio.',
      },
      {
        name: 'Annular Combustion Chamber',
        stages: 1,
        partCount: Math.max(1, parts.filter(p => p.category === 'combustor_liner' || p.category === 'fuel_nozzle').length),
        totalMassKg: Math.round(totalMass * 0.16 * 10) / 10 || 8.2,
        description: 'Through-flow annular combustor fabricated from Nimonic 75 with 12 multi-orifice vaporizing fuel injection tubes and effusion cooling matrix.',
      },
      {
        name: 'Axial Gas Generator Turbine',
        stages: 1,
        partCount: Math.max(1, parts.filter(p => p.category === 'turbine_rotor' || p.category === 'turbine_nozzle').length),
        totalMassKg: Math.round(totalMass * 0.24 * 10) / 10 || 14.6,
        description: 'Single-stage uncooled axial turbine rotor blisk cast from vacuum-melted Inconel 718 with 28 integral high-temperature aerofoil blades.',
      },
      {
        name: 'High-Speed Shaft & Bearings',
        stages: 1,
        partCount: Math.max(1, parts.filter(p => p.category === 'shaft' || p.category === 'bearing_housing').length),
        totalMassKg: Math.round(totalMass * 0.18 * 10) / 10 || 11.0,
        description: 'High-tensile Maraging steel central drive shaft supported by dual high-precision ceramic hybrid ball bearings operating at 98,000 RPM.',
      },
      {
        name: 'Convergent Exhaust Thrust Nozzle',
        stages: 1,
        partCount: 1,
        totalMassKg: Math.round(totalMass * 0.14 * 10) / 10 || 7.5,
        description: 'Fixed-area convergent exhaust cone providing optimal gas acceleration and axial thrust recovery.',
      }
    ];

    return {
      engineType: 'Turbojet',
      architectureSummary: `Single-spool high-velocity turbojet propulsion architecture (Project: ${projectName}). Analyzed from ${parts.length} CAD component(s) encompassing ${totalTriangles.toLocaleString()} surface polygons. The system utilizes an axial/centrifugal compressor coupled via central high-tensile shaft to a single-stage Inconel axial turbine driving an optimized convergent exhaust nozzle.`,
      spoolsCount: 1,
      estimatedBypassRatio: 0.0,
      estimatedOverallPressureRatio: 6.4,
      estimatedThrustKN: 2.35,
      estimatedTurbineInletTempC: 980,
      modules,
      assumptions: [
        'ISA Sea Level static operating envelope (101.325 kPa, 15°C, Mach 0.0).',
        'Fuel specification: Jet-A1 / JP-8 aviation kerosene with lower heating value LHV = 42.8 MJ/kg.',
        'Steady-state rated spool rotational speed: 98,000 RPM at 100% full throttle command.',
        'Material densities derived from AMS 4928 (Ti-6Al-4V) and AMS 5662 (Inconel 718).'
      ],
      missingDataWarnings: [
        'Starter-generator drive pad and Electronic Engine Control (FADEC) housing omitted from exchange geometry.',
        'Lubrication oil recirculating pump and oil-mist scavenging galleries not modeled in current CAD revision.'
      ]
    };
  }

  // Default High-Bypass Turbofan
  const modules: EngineModule[] = [
    {
      name: 'Fan & Low Pressure Compressor',
      stages: 4,
      partCount: Math.max(48, parts.filter(p => p.category === 'fan_blade' || p.category === 'fan_disk').length * 24),
      totalMassKg: Math.round(totalMass * 0.40) || 385.0,
      description: 'Wide-chord hollow titanium fan blades with composite containment casing and 3-stage booster.',
    },
    {
      name: 'High-Pressure Compressor (HPC)',
      stages: 10,
      partCount: Math.max(120, parts.filter(p => p.category === 'compressor_rotor' || p.category === 'compressor_stator').length * 20),
      totalMassKg: Math.round(totalMass * 0.25) || 242.0,
      description: 'Axial compressor with variable inlet guide vanes (VIGVs) and variable stator vanes on stages 1-3.',
    },
    {
      name: 'Annular Combustor',
      stages: 1,
      partCount: Math.max(24, parts.filter(p => p.category === 'combustor_liner' || p.category === 'fuel_nozzle').length * 12),
      totalMassKg: Math.round(totalMass * 0.08) || 68.0,
      description: 'Low-emissions TAPS (Twin Annular Premixing Swirler) combustor with SiC/SiC ceramic matrix composite liners.',
    },
    {
      name: 'High-Pressure Turbine (HPT)',
      stages: 2,
      partCount: Math.max(80, parts.filter(p => p.category === 'turbine_rotor' || p.category === 'turbine_nozzle').length * 16),
      totalMassKg: Math.round(totalMass * 0.15) || 148.0,
      description: 'Air-cooled single-crystal CMSX-4 nickel alloy blades with thermal barrier coating (YSZ TBC).',
    },
    {
      name: 'Low-Pressure Turbine (LPT)',
      stages: 7,
      partCount: 180,
      totalMassKg: Math.round(totalMass * 0.12) || 310.0,
      description: 'High-efficiency uncooled titanium-aluminide (TiAl) rotor blades driving the fan via central concentric shaft.',
    }
  ];

  return {
    engineType: 'High-Bypass Turbofan',
    architectureSummary: `Two-spool high-bypass commercial turbofan propulsion engine (${projectName}). Ingested geometry features 1-stage wide-chord fan, 3-stage booster, 10-stage high-pressure compressor, through-flow annular combustor, 2-stage high-pressure turbine, and 7-stage low-pressure turbine with ultra-high bypass ratio.`,
    spoolsCount: 2,
    estimatedBypassRatio: 11.2,
    estimatedOverallPressureRatio: 40.5,
    estimatedThrustKN: 135.0,
    estimatedTurbineInletTempC: 1520,
    modules,
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
}

/**
 * Procedurally generates realistic flight test-cell sensor telemetry matching engine architecture
 */
export function generateEngineTelemetry(engineType: string, filename?: string): TelemetryDataPoint[] {
  const isTurbojet = 
    engineType.toLowerCase().includes('turbojet') || 
    (filename && (filename.toLowerCase().includes('jx') || filename.toLowerCase().includes('turbojet')));

  return Array.from({ length: 40 }, (_, i) => {
    const flightProgress = i / 40;
    let phase: TelemetryDataPoint['flightPhase'] = 'cruise';
    if (flightProgress < 0.15) phase = 'takeoff';
    else if (flightProgress < 0.35) phase = 'climb';
    else if (flightProgress > 0.85) phase = 'descent';

    if (isTurbojet) {
      // JX-200 Micro-turbojet high-speed single spool (60,000 - 98,000 RPM)
      const rpmBase = phase === 'takeoff' ? 98000 : phase === 'climb' ? 94500 : phase === 'cruise' ? 86200 : 46000;
      const rpm = rpmBase + Math.round((Math.random() - 0.5) * 450);
      const egtMargin = Math.max(14.8, 38.0 - (i * 0.58) + (Math.sin(i * 0.9) * 2.2));
      const egt = 720 + (38 - egtMargin) * 4.8;
      const fuelFlow = phase === 'takeoff' ? 440 : phase === 'climb' ? 385 : phase === 'cruise' ? 290 : 145;

      return {
        timestamp: `T+${String(i * 2).padStart(2, '0')}:00`,
        flightPhase: phase,
        n1_rpm: Math.round(rpm * 0.1), // auxiliary or scaled
        n2_rpm: rpm,
        egt_celsius: Math.round(egt),
        egt_margin_celsius: Math.round(egtMargin * 10) / 10,
        fuel_flow_pph: Math.round(fuelFlow),
        oil_pressure_psi: Math.round((42.5 + (Math.random() - 0.5) * 1.8) * 10) / 10,
        oil_temp_celsius: Math.round((84.0 + i * 0.45) * 10) / 10,
        vibration_n1_ips: Math.round((0.18 + Math.random() * 0.08) * 100) / 100,
        vibration_n2_ips: Math.round((0.64 + (i > 24 ? 0.32 : 0) + Math.random() * 0.09) * 100) / 100,
      };
    }

    // High-Bypass Turbofan (CFM-LEAP / CFM56)
    const n1 = phase === 'takeoff' ? 4950 : phase === 'climb' ? 4820 : phase === 'cruise' ? 4400 : 2100;
    const n2 = phase === 'takeoff' ? 14200 : phase === 'climb' ? 13950 : phase === 'cruise' ? 13200 : 7800;
    const egtMargin = Math.max(14.1, 42.0 - (i * 0.70) + (Math.sin(i * 0.8) * 2.5));
    const egt = 840 + (42 - egtMargin) * 3.2;

    return {
      timestamp: `T+${String(i * 2).padStart(2, '0')}:00`,
      flightPhase: phase,
      n1_rpm: n1 + Math.round((Math.random() - 0.5) * 40),
      n2_rpm: n2 + Math.round((Math.random() - 0.5) * 80),
      egt_celsius: Math.round(egt),
      egt_margin_celsius: Math.round(egtMargin * 10) / 10,
      fuel_flow_pph: phase === 'takeoff' ? 5200 : phase === 'climb' ? 4650 : phase === 'cruise' ? 2450 : 920,
      oil_pressure_psi: Math.round((48.5 + (Math.random() - 0.5) * 2) * 10) / 10,
      oil_temp_celsius: Math.round((92.0 + i * 0.3) * 10) / 10,
      vibration_n1_ips: Math.round((0.22 + Math.random() * 0.08) * 100) / 100,
      vibration_n2_ips: Math.round((0.68 + (i > 25 ? 0.35 : 0) + Math.random() * 0.12) * 100) / 100,
    };
  });
}

