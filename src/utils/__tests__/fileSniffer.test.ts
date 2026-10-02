import { describe, it, expect } from 'vitest';
import { detectFileType } from '../fileSniffer';

describe('fileSniffer', () => {
  it('correctly detects STEP CAD files from ISO-10303 content', async () => {
    const stepContent = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Jet Engine Compressor Stage'),'2;1');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));
ENDSEC;
DATA;
#10=CARTESIAN_POINT('',(0.,0.,0.));
ENDSEC;
END-ISO-10303-21;`;
    const file = new File([stepContent], 'compressor_stage.step', { type: 'application/step' });
    const result = await detectFileType(file);
    
    expect(result.detectedType).toBe('step');
    expect(result.category).toBe('cad');
    expect(result.suggestedRole).toBe('geometry');
    expect(result.isNativeCad).toBe(false);
  });

  it('correctly detects ASCII STL files', async () => {
    const stlContent = `solid TurbineBlade
  facet normal 0.0 0.0 1.0
    outer loop
      vertex 0.0 0.0 0.0
      vertex 10.0 0.0 0.0
      vertex 0.0 10.0 0.0
    endloop
  endfacet
endsolid TurbineBlade`;
    const file = new File([stlContent], 'blade.stl', { type: 'model/stl' });
    const result = await detectFileType(file);

    expect(result.detectedType).toBe('stl_ascii');
    expect(result.suggestedRole).toBe('geometry');
  });

  it('correctly flags proprietary native CAD files for honest fallback', async () => {
    const dummyContent = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0x00, 0x00]);
    const file = new File([dummyContent], 'impeller.sldprt', { type: 'application/octet-stream' });
    const result = await detectFileType(file);

    expect(result.isNativeCad).toBe(true);
    expect(result.notes).toContain('ISO STEP AP214');
  });

  it('correctly tags CSV sensor logs as test_data', async () => {
    const csvContent = `timestamp,flight_phase,n1_rpm,n2_rpm,egt_celsius,oil_pressure_psi
2026-10-01T12:00:00,takeoff,4950,14200,890,48.5
2026-10-01T12:05:00,climb,4820,13950,865,49.1`;
    const file = new File([csvContent], 'test_cell_run_04.csv', { type: 'text/csv' });
    const result = await detectFileType(file);

    expect(result.detectedType).toBe('csv');
    expect(result.suggestedRole).toBe('test_data');
  });

  it('correctly detects engineering drawing PDFs', async () => {
    // Magic bytes %PDF-
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35]);
    const file = new File([pdfHeader], 'casing_assembly_drawing.pdf', { type: 'application/pdf' });
    const result = await detectFileType(file);

    expect(result.detectedType).toBe('pdf');
    expect(result.suggestedRole).toBe('drawing');
  });
});
