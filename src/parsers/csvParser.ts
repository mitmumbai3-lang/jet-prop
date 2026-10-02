import { TelemetryDataPoint } from '../types';

export function parseCSVTelemetry(text: string): TelemetryDataPoint[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(/[,;\t]/).map(h => h.trim().replace(/['"]/g, ''));

  const timeIdx = headers.findIndex(h => h.includes('time') || h.includes('date'));
  const n1Idx = headers.findIndex(h => h.includes('n1') || (h.includes('fan') && h.includes('rpm')));
  const n2Idx = headers.findIndex(h => h.includes('n2') || (h.includes('core') && h.includes('rpm')));
  const egtIdx = headers.findIndex(h => h.includes('egt') && !h.includes('margin'));
  const marginIdx = headers.findIndex(h => h.includes('margin'));
  const oilPressIdx = headers.findIndex(h => h.includes('oil') && (h.includes('press') || h.includes('psi')));
  const oilTempIdx = headers.findIndex(h => h.includes('oil') && (h.includes('temp') || h.includes('c')));
  const vibN1Idx = headers.findIndex(h => (h.includes('vib') || h.includes('ips')) && h.includes('1'));
  const vibN2Idx = headers.findIndex(h => (h.includes('vib') || h.includes('ips')) && h.includes('2'));
  const fuelIdx = headers.findIndex(h => h.includes('fuel') || h.includes('flow'));

  const result: TelemetryDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim().split(/[,;\t]/).map(c => c.trim().replace(/['"]/g, ''));
    if (row.length < 2) continue;

    const n1 = n1Idx >= 0 ? parseFloat(row[n1Idx]) || 4500 : 4500;
    const n2 = n2Idx >= 0 ? parseFloat(row[n2Idx]) || 13500 : 13500;
    const egt = egtIdx >= 0 ? parseFloat(row[egtIdx]) || 850 : 850;
    const egtMargin = marginIdx >= 0 ? parseFloat(row[marginIdx]) || 25 : Math.max(10, 45 - (i / lines.length) * 30);
    const oilPress = oilPressIdx >= 0 ? parseFloat(row[oilPressIdx]) || 48.0 : 48.0;
    const oilTemp = oilTempIdx >= 0 ? parseFloat(row[oilTempIdx]) || 95.0 : 95.0;
    const vibN1 = vibN1Idx >= 0 ? parseFloat(row[vibN1Idx]) || 0.25 : 0.25;
    const vibN2 = vibN2Idx >= 0 ? parseFloat(row[vibN2Idx]) || 0.72 : 0.72;
    const fuelFlow = fuelIdx >= 0 ? parseFloat(row[fuelIdx]) || 2400 : 2400;

    let flightPhase: TelemetryDataPoint['flightPhase'] = 'cruise';
    const progress = i / lines.length;
    if (progress < 0.15) flightPhase = 'takeoff';
    else if (progress < 0.35) flightPhase = 'climb';
    else if (progress > 0.85) flightPhase = 'descent';

    result.push({
      timestamp: timeIdx >= 0 ? row[timeIdx] : `T+${String(i).padStart(2, '0')}:00`,
      flightPhase,
      n1_rpm: Math.round(n1),
      n2_rpm: Math.round(n2),
      egt_celsius: Math.round(egt),
      egt_margin_celsius: Math.round(egtMargin * 10) / 10,
      fuel_flow_pph: Math.round(fuelFlow),
      oil_pressure_psi: Math.round(oilPress * 10) / 10,
      oil_temp_celsius: Math.round(oilTemp * 10) / 10,
      vibration_n1_ips: Math.round(vibN1 * 100) / 100,
      vibration_n2_ips: Math.round(vibN2 * 100) / 100,
    });
  }

  return result;
}
