import { describe, it, expect } from 'vitest';
import { runDiagnosticChecks } from '../rulesEngine';
import { Part } from '../../types';

describe('Rules Engine', () => {
  it('detects non-manifold boundary edges and creates fix proposals', () => {
    const mockPart: Part = {
      id: 'part-test-01',
      fileId: 'file-01',
      name: 'Turbine Rotor Disc',
      category: 'turbine_rotor',
      classificationConfidence: 98,
      materialId: 'ti-6al-4v',
      volumeMm3: 500000,
      surfaceAreaMm2: 120000,
      massKg: 2.21,
      boundingBox: { min: [-100, -100, -10], max: [100, 100, 10], dimensions: [200, 200, 20] },
      centerOfGravity: [0, 0, 0],
      momentsOfInertia: [0.1, 0.1, 0.2],
      geometryData: {
        vertices: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0]),
        normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        triangleCount: 1,
        isWatertight: false,
        nonManifoldEdges: 3, // open boundary
      },
      visible: true,
      isolated: false,
      selected: false,
    };

    const { findings, fixes } = runDiagnosticChecks(mockPart);
    expect(findings.length).toBeGreaterThan(0);
    const meshFinding = findings.find(f => f.id.includes('FIND-MESH'));
    expect(meshFinding).toBeDefined();
    expect(meshFinding?.severity).toBe('Medium');
    expect(meshFinding?.isAutoFixable).toBe(true);

    const meshFix = fixes.find(f => f.autoFixType === 'mesh_healing');
    expect(meshFix).toBeDefined();
  });

  it('detects rotor dynamic unbalance when CG offset exceeds limit', () => {
    const mockShaft: Part = {
      id: 'part-shaft-test',
      fileId: 'file-02',
      name: 'N2 Core Shaft',
      category: 'shaft',
      classificationConfidence: 99,
      materialId: 'inconel-718',
      volumeMm3: 400000,
      surfaceAreaMm2: 90000,
      massKg: 3.2,
      boundingBox: { min: [-20, -20, -150], max: [20, 20, 150], dimensions: [40, 40, 300] },
      centerOfGravity: [0.045, -0.010, 0], // e = 0.046 mm > 0.015 limit
      momentsOfInertia: [0.05, 0.05, 0.01],
      visible: true,
      isolated: false,
      selected: false,
    };

    const { findings, fixes } = runDiagnosticChecks(mockShaft);
    const balFinding = findings.find(f => f.id.includes('FIND-BAL'));
    expect(balFinding).toBeDefined();
    expect(balFinding?.title).toContain('ISO 1940-1');
    expect(balFinding?.applicableStandard).toContain('ISO 1940-1');
    expect(balFinding?.evidence).toContain('Center-of-gravity');

    const balFix = fixes.find(f => f.autoFixType === 'rotor_balancing');
    expect(balFix).toBeDefined();
  });
});
