import { UnitsSystem } from '../types';

/**
 * Format length / dimension value according to selected unit system
 */
export function formatLength(mm: number, units: UnitsSystem, precision = 2): string {
  if (units === 'imperial') {
    const inches = mm / 25.4;
    return `${inches.toFixed(precision)} in`;
  }
  return `${mm.toFixed(precision)} mm`;
}

/**
 * Format mass value according to selected unit system
 */
export function formatMass(kg: number, units: UnitsSystem, precision = 2): string {
  if (units === 'imperial') {
    const lbm = kg * 2.20462;
    return `${lbm.toFixed(precision)} lbm`;
  }
  return `${kg.toFixed(precision)} kg`;
}

/**
 * Format thrust value according to selected unit system
 */
export function formatThrust(kN: number, units: UnitsSystem, precision = 1): string {
  if (units === 'imperial') {
    const lbf = kN * 224.809;
    return `${Math.round(lbf).toLocaleString()} lbf`;
  }
  return `${kN.toFixed(precision)} kN`;
}

/**
 * Format temperature value according to selected unit system
 */
export function formatTemp(celsius: number, units: UnitsSystem): string {
  if (units === 'imperial') {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * Format stress value according to selected unit system
 */
export function formatStress(mpa: number, units: UnitsSystem, precision = 1): string {
  if (units === 'imperial') {
    const ksi = mpa * 0.145038;
    return `${ksi.toFixed(precision)} ksi`;
  }
  return `${mpa.toFixed(precision)} MPa`;
}

/**
 * Format mass flow rate
 */
export function formatMassFlow(kgPerSec: number, units: UnitsSystem, precision = 1): string {
  if (units === 'imperial') {
    const lbmPerSec = kgPerSec * 2.20462;
    return `${lbmPerSec.toFixed(precision)} lbm/s`;
  }
  return `${kgPerSec.toFixed(precision)} kg/s`;
}

/**
 * Format specific fuel consumption
 */
export function formatSFC(sfcKgKNs: number, units: UnitsSystem): string {
  if (units === 'imperial') {
    // 1 kg/(kN·s) ~ 35.3039 lbm/(lbf·hr) / 3600 ~ 0.980665 lb/(lbf·h)
    const tsfc = sfcKgKNs * 35.3039;
    return `${tsfc.toFixed(3)} lb/(lbf·h)`;
  }
  return `${sfcKgKNs.toFixed(3)} kg/(kN·s)`;
}

/**
 * Format oil/gas pressure
 */
export function formatPressure(psi: number, units: UnitsSystem, precision = 1): string {
  if (units === 'metric') {
    const kpa = psi * 6.89476;
    return `${kpa.toFixed(0)} kPa (${psi.toFixed(precision)} PSI)`;
  }
  return `${psi.toFixed(precision)} PSI`;
}

/**
 * Format vibration velocity
 */
export function formatVibration(ips: number, units: UnitsSystem, precision = 2): string {
  if (units === 'metric') {
    const mms = ips * 25.4;
    return `${mms.toFixed(1)} mm/s (${ips.toFixed(precision)} IPS)`;
  }
  return `${ips.toFixed(precision)} IPS`;
}

/**
 * Format fuel flow
 */
export function formatFuelFlow(pph: number, units: UnitsSystem): string {
  if (units === 'metric') {
    const kgh = pph * 0.453592;
    return `${Math.round(kgh).toLocaleString()} kg/h`;
  }
  return `${Math.round(pph).toLocaleString()} pph`;
}

