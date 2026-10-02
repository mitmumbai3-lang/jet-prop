import { describe, it, expect } from 'vitest';
import { parseSTL, parseOBJ, parseSTEP, computeMeshMetrics } from '../cadParsers';

describe('CAD Parsers & Metrics', () => {
  it('computes accurate metrics for a simple 3D triangle', () => {
    // 1 triangle in XY plane
    const vertices = new Float32Array([
      0, 0, 0,
      10, 0, 0,
      0, 10, 0,
    ]);
    const metrics = computeMeshMetrics(vertices);
    expect(metrics.surfaceAreaMm2).toBeCloseTo(50, 1);
    expect(metrics.boundingBox.dimensions[0]).toBeCloseTo(10, 1);
    expect(metrics.boundingBox.dimensions[1]).toBeCloseTo(10, 1);
  });

  it('parses ASCII STL files and creates valid vertex and normal buffers', () => {
    const stlText = `solid TestDisc
facet normal 0 0 1
  outer loop
    vertex 0 0 10
    vertex 20 0 10
    vertex 0 20 10
  endloop
endfacet
endsolid TestDisc`;

    const encoder = new TextEncoder();
    const buffer = encoder.encode(stlText).buffer;
    const parsed = parseSTL(buffer, 'test_disc.stl');

    expect(parsed.triangleCount).toBe(1);
    expect(parsed.vertices.length).toBe(9);
    expect(parsed.normals.length).toBe(9);
    expect(parsed.boundingBox.max[2]).toBe(10);
  });

  it('parses OBJ files including quad triangulation', () => {
    const objText = `# Test Rotor Quad
v 0 0 0
v 10 0 0
v 10 10 0
v 0 10 0
f 1 2 3 4
`;
    const parsed = parseOBJ(objText, 'quad_plate.obj');
    // Quad must be triangulated into 2 triangles (6 vertices * 3 = 18 elements)
    expect(parsed.triangleCount).toBe(2);
    expect(parsed.vertices.length).toBe(18);
    expect(parsed.surfaceAreaMm2).toBeCloseTo(100, 1);
  });

  it('parses STEP CAD files and reconstructs aerospace geometric envelope', () => {
    const stepText = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Turbine Blade'),'2;1');
ENDSEC;
DATA;
#10=CARTESIAN_POINT('P1',(0.,0.,0.));
#11=CARTESIAN_POINT('P2',(100.,0.,0.));
#12=CARTESIAN_POINT('P3',(0.,100.,0.));
#13=CARTESIAN_POINT('P4',(0.,0.,50.));
ENDSEC;
END-ISO-10303-21;`;

    const parsed = parseSTEP(stepText, 'hpt_stage.step');
    expect(parsed.triangleCount).toBeGreaterThan(0);
    expect(parsed.vertices.length).toBeGreaterThan(0);
    expect(parsed.boundingBox).toBeDefined();
  });
});
