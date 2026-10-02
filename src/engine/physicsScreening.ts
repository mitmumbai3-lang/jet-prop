import { Material } from '../types';

export interface BraytonCycleResult {
  compressorExitTempK: number;
  turbineExitTempK: number;
  nozzleExitVelocityMps: number;
  specificThrustNsKg: number;
  thrustKN: number;
  sfcKgKNs: number;
  thermalEfficiency: number;
  isValid: boolean;
  warnings: string[];
}

/**
 * Brayton Thermodynamic Cycle Screening for Jet Engines
 */
export function calculateBraytonCycle(
  opr: number = 40.0, // Overall Pressure Ratio
  titKelvin: number = 1750.0, // Turbine Inlet Temperature (K)
  massFlowKgS: number = 120.0, // Core Air Mass Flow (kg/s)
  gamma: number = 1.4, // Ratio of specific heats
  cp: number = 1005 // J/(kg*K)
): BraytonCycleResult {
  const T0 = 288.15; // ISA sea level temperature (K)
  const P0 = 101325; // ISA sea level pressure (Pa)
  const etaCompressor = 0.88;
  const etaTurbine = 0.91;
  const etaNozzle = 0.98;

  // Compressor delivery temperature (T3)
  const idealPRRatio = Math.pow(opr, (gamma - 1) / gamma);
  const T3 = T0 * (1 + (idealPRRatio - 1) / etaCompressor);

  // Turbine inlet temperature (T4)
  const T4 = titKelvin;

  // Turbine work equals compressor work
  const turbineWork = cp * (T3 - T0);
  const T5 = T4 - (turbineWork / (cp * etaTurbine));

  // Exhaust expansion through nozzle
  const deltaH = Math.max(0, cp * (T5 - T0) * etaNozzle);
  const Vj = Math.sqrt(2 * deltaH); // Jet velocity (m/s)

  // Net Thrust = m_dot * (Vj - V0) [V0 = 0 at sea level static]
  const thrustN = massFlowKgS * Vj;
  const thrustKN = thrustN / 1000;

  // Thermodynamic thermal efficiency eta_th = (1 - 1/r_c^((gamma-1)/gamma)) * eta_c * eta_t
  const thermalEfficiency = (1 - 1 / idealPRRatio) * etaCompressor * etaTurbine;

  // Heat added in combustor Q_in = m_dot * cp * (T4 - T3)
  const qIn = massFlowKgS * cp * Math.max(1, T4 - T3);

  // Specific Fuel Consumption estimate (assuming fuel LHV = 43.1 MJ/kg)
  const fuelFlowKgS = qIn / (43.1e6 * 0.99); // 99% combustor efficiency
  const sfcKgKNs = (fuelFlowKgS / Math.max(1, thrustKN)) * 1000;

  const warnings: string[] = [];
  if (T3 > 950) {
    warnings.push(`Compressor exit temperature T3 = ${Math.round(T3)} K exceeds titanium fire threshold (920 K). Core cooling or nickel alloy required.`);
  }
  if (T4 > 1850) {
    warnings.push(`Turbine inlet temperature T4 = ${Math.round(T4)} K exceeds uncooled single-crystal capability. Active film cooling required.`);
  }

  return {
    compressorExitTempK: Math.round(T3),
    turbineExitTempK: Math.round(T5),
    nozzleExitVelocityMps: Math.round(Vj),
    specificThrustNsKg: Math.round(Vj),
    thrustKN: Math.round(thrustKN * 10) / 10,
    sfcKgKNs: Math.round(sfcKgKNs * 1000) / 1000,
    thermalEfficiency: Math.round(thermalEfficiency * 1000) / 10,
    isValid: T3 > T0 && T5 > T0 && thrustKN > 0,
    warnings,
  };
}

/**
 * Campbell Diagram Resonance Screening
 * Checks if engine rotational harmonics intersect with blade natural frequencies
 */
export function checkCampbellResonance(
  naturalFreqHz: number,
  maxRpm: number = 14200,
  statorVaneCounts: number[] = [18, 24, 32]
): {
  hasResonanceRisk: boolean;
  criticalHarmonics: { order: number; resonanceRpm: number; speedPercent: number }[];
} {
  const criticalHarmonics: { order: number; resonanceRpm: number; speedPercent: number }[] = [];

  // Common excitation engine orders (1X unbalance, 2X ovalization, 3X, and stator passing frequencies)
  const ordersToCheck = [1, 2, 3, 4, ...statorVaneCounts];

  for (const order of ordersToCheck) {
    // Resonance occurs when order * (RPM / 60) == naturalFreqHz
    const resonanceRpm = (naturalFreqHz * 60) / order;
    if (resonanceRpm >= maxRpm * 0.5 && resonanceRpm <= maxRpm * 1.05) {
      criticalHarmonics.push({
        order,
        resonanceRpm: Math.round(resonanceRpm),
        speedPercent: Math.round((resonanceRpm / maxRpm) * 100),
      });
    }
  }

  return {
    hasResonanceRisk: criticalHarmonics.length > 0,
    criticalHarmonics,
  };
}

/**
 * Larson-Miller Parameter Creep Rupture Screening
 */
export function calculateCreepLifeHours(
  tempCelsius: number,
  stressMPa: number,
  material: Material
): {
  lmp: number;
  estimatedLifeHours: number;
  creepRisk: 'Low' | 'Moderate' | 'Critical';
} {
  const tempK = tempCelsius + 273.15;
  const C = 20; // Material constant for Ni-base superalloys

  // Approximate LMP curve: LMP = A - B * log10(stress)
  // For CMSX-4: at 1000°C and 200 MPa, LMP ~ 27,500
  const lmp = Math.max(15000, 31000 - 3200 * Math.log10(Math.max(10, stressMPa)));

  // LMP = (T in K) * (C + log10(tr)) => log10(tr) = (LMP / T) - C
  const logTr = (lmp / tempK) - C;
  const estimatedLifeHours = Math.max(1, Math.min(100000, Math.pow(10, logTr)));

  let creepRisk: 'Low' | 'Moderate' | 'Critical' = 'Low';
  if (estimatedLifeHours < 2000) creepRisk = 'Critical';
  else if (estimatedLifeHours < 8000) creepRisk = 'Moderate';

  return {
    lmp: Math.round(lmp),
    estimatedLifeHours: Math.round(estimatedLifeHours),
    creepRisk,
  };
}
