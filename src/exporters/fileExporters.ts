import { Part, TelemetryDataPoint, Fix, Finding, AuditEvent } from '../types';

/**
 * 1. Export Part as ASCII STL
 */
export function exportSTL(part: Part): string {
  if (!part.geometryData) return `solid ${part.name}\nendsolid ${part.name}`;

  const { vertices, normals } = part.geometryData;
  const numTriangles = Math.floor(vertices.length / 9);

  let stl = `solid ${part.name.replace(/\s+/g, '_')}\n`;

  for (let i = 0; i < numTriangles; i++) {
    const o = i * 9;
    const nx = normals[o] || 0;
    const ny = normals[o + 1] || 0;
    const nz = normals[o + 2] || 1;

    stl += `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${vertices[o].toFixed(4)} ${vertices[o + 1].toFixed(4)} ${vertices[o + 2].toFixed(4)}\n`;
    stl += `      vertex ${vertices[o + 3].toFixed(4)} ${vertices[o + 4].toFixed(4)} ${vertices[o + 5].toFixed(4)}\n`;
    stl += `      vertex ${vertices[o + 6].toFixed(4)} ${vertices[o + 7].toFixed(4)} ${vertices[o + 8].toFixed(4)}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }

  stl += `endsolid ${part.name.replace(/\s+/g, '_')}\n`;
  return stl;
}

/**
 * 2. Export Part as Wavefront OBJ
 */
export function exportOBJ(part: Part): string {
  if (!part.geometryData) return `# Empty OBJ for ${part.name}`;

  const { vertices, normals } = part.geometryData;
  const numVerts = Math.floor(vertices.length / 3);

  let obj = `# JetEngine AI Workbench - Corrected Export\n`;
  obj += `# Component: ${part.name}\n`;
  obj += `# Material: ${part.materialId}\n`;
  obj += `o ${part.name.replace(/\s+/g, '_')}\n\n`;

  // Vertices
  for (let i = 0; i < numVerts; i++) {
    const o = i * 3;
    obj += `v ${vertices[o].toFixed(4)} ${vertices[o + 1].toFixed(4)} ${vertices[o + 2].toFixed(4)}\n`;
  }

  // Normals
  for (let i = 0; i < numVerts; i++) {
    const o = i * 3;
    obj += `vn ${normals[o].toFixed(4)} ${normals[o + 1].toFixed(4)} ${normals[o + 2].toFixed(4)}\n`;
  }

  // Faces
  const numFaces = Math.floor(numVerts / 3);
  for (let f = 0; f < numFaces; f++) {
    const idx1 = f * 3 + 1;
    const idx2 = f * 3 + 2;
    const idx3 = f * 3 + 3;
    obj += `f ${idx1}//${idx1} ${idx2}//${idx2} ${idx3}//${idx3}\n`;
  }

  return obj;
}

/**
 * 3. Export as ISO 10303 STEP AP214 / AP242
 */
export function exportSTEP(part: Part): string {
  const dateStr = new Date().toISOString();
  let step = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('JetEngine AI Workbench Auto-Repaired CAD Geometry'),'2;1');
FILE_NAME('${part.name}.stp','${dateStr}',('Propulsion AI Engineer'),('JetEngine AI Workbench'),'ISO 10303-214','CAD Core v2.4','');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN','AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));
ENDSEC;
DATA;
#1=APPLICATION_CONTEXT('automotive design');
#2=APPLICATION_PROTOCOL_DEFINITION('draft international standard','automotive_design',2001,#1);
#3=PRODUCT_CONTEXT('',#1,'mechanical');
#4=PRODUCT('${part.id}','${part.name}','',(#3));
#5=PRODUCT_DEFINITION_FORMATION('1.0','',#4);
#6=PRODUCT_DEFINITION('design','',#5,#3);
`;

  if (part.geometryData) {
    const { vertices } = part.geometryData;
    const numVerts = Math.min(300, Math.floor(vertices.length / 3)); // representative sample
    for (let i = 0; i < numVerts; i++) {
      const o = i * 3;
      step += `#${10 + i}=CARTESIAN_POINT('',(${vertices[o].toFixed(3)},${vertices[o + 1].toFixed(3)},${vertices[o + 2].toFixed(3)}));\n`;
    }
  }

  step += `ENDSEC;\nEND-ISO-10303-21;\n`;
  return step;
}

/**
 * 4. Export DXF 2D Drawing
 */
export function exportDXF(part: Part): string {
  const [minX, minY] = [part.boundingBox.min[0], part.boundingBox.min[1]];
  const [maxX, maxY] = [part.boundingBox.max[0], part.boundingBox.max[1]];

  return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
OUTLINE
10
${minX}
20
${minY}
30
0.0
11
${maxX}
20
${minY}
30
0.0
0
LINE
8
OUTLINE
10
${maxX}
20
${minY}
30
0.0
11
${maxX}
20
${maxY}
30
0.0
0
LINE
8
OUTLINE
10
${maxX}
20
${maxY}
30
0.0
11
${minX}
20
${maxY}
30
0.0
0
LINE
8
OUTLINE
10
${minX}
20
${maxY}
30
0.0
11
${minX}
20
${minY}
30
0.0
0
ENDSEC
0
EOF
`;
}

/**
 * 5. Export CSV Telemetry
 */
export function exportCSV(telemetry: TelemetryDataPoint[]): string {
  let csv = 'timestamp,flight_phase,n1_rpm,n2_rpm,egt_celsius,egt_margin_celsius,oil_pressure_psi,oil_temp_celsius,vibration_n1_ips,vibration_n2_ips,fuel_flow_pph\n';
  for (const pt of telemetry) {
    csv += `${pt.timestamp},${pt.flightPhase},${pt.n1_rpm},${pt.n2_rpm},${pt.egt_celsius},${pt.egt_margin_celsius},${pt.oil_pressure_psi},${pt.oil_temp_celsius},${pt.vibration_n1_ips},${pt.vibration_n2_ips},${pt.fuel_flow_pph}\n`;
  }
  return csv;
}

/**
 * 6. Export Signed Change Report JSON
 */
export function exportChangeReportJSON(
  projectName: string,
  engineType: string,
  fixes: Fix[],
  findings: Finding[],
  auditLog: AuditEvent[]
): string {
  const report = {
    reportTitle: 'JetEngine AI Workbench - Engineering Change & Repair Report',
    projectName,
    engineType,
    generatedAt: new Date().toISOString(),
    complianceStandard: 'FAA AC 33.28-1 / EASA CS-E / ISO 10303',
    summary: {
      totalFindings: findings.length,
      resolvedFindings: findings.filter(f => f.resolved).length,
      openFindings: findings.filter(f => !f.resolved).length,
      totalFixesApplied: fixes.filter(f => f.applied).length,
    },
    appliedFixes: fixes.filter(f => f.applied).map(f => ({
      fixId: f.id,
      findingId: f.findingId,
      title: f.title,
      description: f.description,
      affectedPartId: f.affectedPartId,
      autoFixType: f.autoFixType,
      impactMetrics: f.impactMetrics,
    })),
    unresolvedIssuesRequiringHumanSignoff: findings.filter(f => !f.resolved).map(f => ({
      findingId: f.id,
      title: f.title,
      severity: f.severity,
      evidence: f.evidence,
      recommendedFix: f.recommendedFix,
    })),
    auditTrail: auditLog,
  };

  return JSON.stringify(report, null, 2);
}
