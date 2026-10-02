import { FileRole } from '../types';

export interface DetectionResult {
  detectedType: string;
  category: 'cad' | 'drawing' | 'data' | 'document' | 'image' | 'unknown';
  suggestedRole: FileRole;
  isNativeCad: boolean;
  notes?: string;
}

/**
 * Sniffs the content of a file (both magic bytes and text content) to accurately determine its type
 */
export async function detectFileType(file: File): Promise<DetectionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Read first 2KB for inspection
  const sliceSize = Math.min(file.size, 2048);
  const buffer = await file.slice(0, sliceSize).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const textSample = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // 1. PDF Magic Bytes: %PDF-
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    const isDrawing = file.name.toLowerCase().includes('drawing') || file.name.toLowerCase().includes('dwg') || file.name.toLowerCase().includes('print');
    return {
      detectedType: 'pdf',
      category: isDrawing ? 'drawing' : 'document',
      suggestedRole: isDrawing ? 'drawing' : 'spec',
      isNativeCad: false,
      notes: isDrawing ? 'Engineering Drawing (PDF vector format)' : 'Specification / Maintenance Manual',
    };
  }

  // 2. PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return {
      detectedType: 'png',
      category: 'image',
      suggestedRole: 'image',
      isNativeCad: false,
      notes: 'Borescope / Visual Inspection Image',
    };
  }

  // 3. JPEG Magic Bytes: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return {
      detectedType: 'jpeg',
      category: 'image',
      suggestedRole: 'image',
      isNativeCad: false,
      notes: 'Borescope / Visual Inspection Image',
    };
  }

  // 4. STEP CAD (.step, .stp): ISO-10303-21
  if (textSample.includes('ISO-10303-21') || textSample.includes('FILE_DESCRIPTION') || textSample.includes('FILE_SCHEMA')) {
    return {
      detectedType: 'step',
      category: 'cad',
      suggestedRole: 'geometry',
      isNativeCad: false,
      notes: 'Standard ISO 10303 STEP B-Rep Geometry',
    };
  }

  // 5. IGES CAD (.igs, .iges)
  if (textSample.length >= 80 && (textSample[72] === 'S' || textSample[72] === 'G' || textSample.includes('Start Section'))) {
    return {
      detectedType: 'iges',
      category: 'cad',
      suggestedRole: 'geometry',
      isNativeCad: false,
      notes: 'Initial Graphics Exchange Specification (IGES)',
    };
  }

  // 6. STL ASCII or Binary
  if (textSample.trim().toLowerCase().startsWith('solid') && textSample.includes('facet normal')) {
    return {
      detectedType: 'stl_ascii',
      category: 'cad',
      suggestedRole: 'geometry',
      isNativeCad: false,
      notes: 'Stereolithography Mesh (ASCII)',
    };
  }

  if (file.size >= 84) {
    // Check if binary STL: byte 80-83 is uint32 triangle count
    const triangleCount = new DataView(buffer).getUint32(80, true);
    const expectedSize = 84 + triangleCount * 50;
    if (file.size === expectedSize || Math.abs(file.size - expectedSize) < 100) {
      return {
        detectedType: 'stl_binary',
        category: 'cad',
        suggestedRole: 'geometry',
        isNativeCad: false,
        notes: `Stereolithography Mesh (Binary, ${triangleCount} triangles)`,
      };
    }
  }

  // 7. OBJ 3D Model
  if (
    (textSample.includes('\nv ') || textSample.startsWith('v ')) &&
    (textSample.includes('\nf ') || textSample.includes('\nvn '))
  ) {
    return {
      detectedType: 'obj',
      category: 'cad',
      suggestedRole: 'geometry',
      isNativeCad: false,
      notes: 'Wavefront 3D Geometry (Polygonal Mesh)',
    };
  }

  // 8. DXF Drawing
  if (textSample.includes('SECTION') && (textSample.includes('ENTITIES') || textSample.includes('HEADER'))) {
    return {
      detectedType: 'dxf',
      category: 'drawing',
      suggestedRole: 'drawing',
      isNativeCad: false,
      notes: 'AutoCAD DXF 2D/3D Drawing',
    };
  }

  // 9. Proprietary Native CAD: SolidWorks, CATIA, Inventor, Creo, Parasolid
  const isOleHeader = bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  if (['sldprt', 'sldasm', 'catpart', 'catproduct', 'prt', 'ipt', 'iam', 'x_t', 'x_b'].includes(extension) || isOleHeader) {
    return {
      detectedType: extension || 'native_cad',
      category: 'cad',
      suggestedRole: 'geometry',
      isNativeCad: true,
      notes: 'Proprietary CAD. Will parse via neutral conversion; fixes will export as standard ISO STEP AP214.',
    };
  }

  // 10. Sensor / Test Cell Telemetry CSV or JSON
  if (extension === 'csv' || textSample.includes('n1') || textSample.includes('egt') || textSample.includes('vibration') || textSample.includes('rpm')) {
    return {
      detectedType: 'csv',
      category: 'data',
      suggestedRole: 'test_data',
      isNativeCad: false,
      notes: 'Test-cell sensor log / flight telemetry data',
    };
  }

  if (extension === 'json' || textSample.trim().startsWith('{') || textSample.trim().startsWith('[')) {
    return {
      detectedType: 'json',
      category: 'data',
      suggestedRole: 'test_data',
      isNativeCad: false,
      notes: 'Structured engineering data or inspection record',
    };
  }

  // Fallback to extension matching
  return {
    detectedType: extension || 'unknown',
    category: 'unknown',
    suggestedRole: 'other',
    isNativeCad: false,
    notes: 'Generic file format',
  };
}
