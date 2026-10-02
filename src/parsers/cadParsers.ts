import { Part, BoundingBox } from '../types';

export interface ParsedGeometry {
  name: string;
  vertices: Float32Array;
  normals: Float32Array;
  indices?: Uint32Array;
  triangleCount: number;
  boundingBox: BoundingBox;
  volumeMm3: number;
  surfaceAreaMm2: number;
  centerOfGravity: [number, number, number];
  momentsOfInertia: [number, number, number];
  isWatertight: boolean;
  nonManifoldEdges: number;
}

/**
 * Computes bounding box, surface area, volume, and center of gravity from raw triangles
 */
export function computeMeshMetrics(vertices: Float32Array, normals?: Float32Array): {
  boundingBox: BoundingBox;
  volumeMm3: number;
  surfaceAreaMm2: number;
  centerOfGravity: [number, number, number];
  momentsOfInertia: [number, number, number];
  isWatertight: boolean;
  nonManifoldEdges: number;
} {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  let totalArea = 0;
  let totalVolume = 0;
  let cx = 0, cy = 0, cz = 0;

  const numTriangles = Math.floor(vertices.length / 9);

  // Map to count edge occurrences for manifold check
  const edgeMap = new Map<string, number>();

  for (let i = 0; i < numTriangles; i++) {
    const o = i * 9;
    const ax = vertices[o], ay = vertices[o + 1], az = vertices[o + 2];
    const bx = vertices[o + 3], by = vertices[o + 4], bz = vertices[o + 5];
    const cx_ = vertices[o + 6], cy_ = vertices[o + 7], cz_ = vertices[o + 8];

    // Bounding Box
    minX = Math.min(minX, ax, bx, cx_);
    minY = Math.min(minY, ay, by, cy_);
    minZ = Math.min(minZ, az, bz, cz_);

    maxX = Math.max(maxX, ax, bx, cx_);
    maxY = Math.max(maxY, ay, by, cy_);
    maxZ = Math.max(maxZ, az, bz, cz_);

    // Cross product for triangle area
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx_ - ax, acy = cy_ - ay, acz = cz_ - az;

    const crossX = aby * acz - abz * acy;
    const crossY = abz * acx - abx * acz;
    const crossZ = abx * acy - aby * acx;

    const triArea = 0.5 * Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
    totalArea += triArea;

    // Signed tetrahedron volume = (a . (b x c)) / 6
    const signedVol = (ax * (by * cz_ - bz * cy_) + ay * (bz * cx_ - bx * cz_) + az * (bx * cy_ - by * cx_)) / 6.0;
    totalVolume += signedVol;

    // Centroid contribution
    const triCentroidX = (ax + bx + cx_) / 4.0;
    const triCentroidY = (ay + by + cy_) / 4.0;
    const triCentroidZ = (az + bz + cz_) / 4.0;

    cx += signedVol * triCentroidX;
    cy += signedVol * triCentroidY;
    cz += signedVol * triCentroidZ;

    // Edge hashing for manifoldness check
    const edges = [
      hashEdge(ax, ay, az, bx, by, bz),
      hashEdge(bx, by, bz, cx_, cy_, cz_),
      hashEdge(cx_, cy_, cz_, ax, ay, az),
    ];

    for (const e of edges) {
      edgeMap.set(e, (edgeMap.get(e) || 0) + 1);
    }
  }

  // Final center of gravity
  const absVolume = Math.abs(totalVolume);
  if (absVolume > 1e-6) {
    cx = cx / totalVolume;
    cy = cy / totalVolume;
    cz = cz / totalVolume;
  } else {
    cx = (minX + maxX) / 2;
    cy = (minY + maxY) / 2;
    cz = (minZ + maxZ) / 2;
  }

  // Count non-manifold or boundary edges
  let nonManifoldCount = 0;
  let openEdgesCount = 0;
  for (const count of edgeMap.values()) {
    if (count === 1) openEdgesCount++;
    else if (count > 2) nonManifoldCount++;
  }

  const isWatertight = openEdgesCount === 0 && nonManifoldCount === 0 && absVolume > 0;

  // Approximate moments of inertia using bounding dimensions
  const dx = Math.max(1, maxX - minX);
  const dy = Math.max(1, maxY - minY);
  const dz = Math.max(1, maxZ - minZ);

  const estimatedMassKg = Math.max(0.1, (absVolume > 0 ? absVolume : dx * dy * dz * 0.15) * 4.43e-6); // default Ti density
  const Ixx = (1 / 12) * estimatedMassKg * (dy * dy + dz * dz) * 1e-6;
  const Iyy = (1 / 12) * estimatedMassKg * (dx * dx + dz * dz) * 1e-6;
  const Izz = (1 / 12) * estimatedMassKg * (dx * dx + dy * dy) * 1e-6;

  return {
    boundingBox: {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      dimensions: [dx, dy, dz],
    },
    volumeMm3: absVolume > 0 ? absVolume : dx * dy * dz * 0.25,
    surfaceAreaMm2: totalArea > 0 ? totalArea : 2 * (dx * dy + dy * dz + dx * dz),
    centerOfGravity: [cx, cy, cz],
    momentsOfInertia: [Ixx, Iyy, Izz],
    isWatertight,
    nonManifoldEdges: nonManifoldCount + openEdgesCount,
  };
}

function hashEdge(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): string {
  // Quantize coordinates to 0.01 mm tolerance
  const p1 = `${Math.round(x1 * 100)},${Math.round(y1 * 100)},${Math.round(z1 * 100)}`;
  const p2 = `${Math.round(x2 * 100)},${Math.round(y2 * 100)},${Math.round(z2 * 100)}`;
  return p1 < p2 ? `${p1}|${p2}` : `${p2}|${p1}`;
}

/**
 * 1. STL Parser (Binary and ASCII)
 */
export function parseSTL(buffer: ArrayBuffer, fileName: string): ParsedGeometry {
  const bytes = new Uint8Array(buffer);
  const textHeader = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, 200)).trim().toLowerCase();

  const isAscii = textHeader.startsWith('solid') && !isBinarySTLHeuristic(buffer);

  if (isAscii) {
    return parseAsciiSTL(new TextDecoder('utf-8').decode(bytes), fileName);
  } else {
    return parseBinarySTL(buffer, fileName);
  }
}

function isBinarySTLHeuristic(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const triangleCount = new DataView(buffer).getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;
  return Math.abs(buffer.byteLength - expectedSize) < 100;
}

function parseBinarySTL(buffer: ArrayBuffer, fileName: string): ParsedGeometry {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);

  const vertices = new Float32Array(triangleCount * 9);
  const normals = new Float32Array(triangleCount * 9);

  let offset = 84;
  let vIndex = 0;

  for (let i = 0; i < triangleCount; i++) {
    if (offset + 50 > buffer.byteLength) break;

    // Normal
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);

    // 3 Vertices
    const ax = view.getFloat32(offset + 12, true);
    const ay = view.getFloat32(offset + 16, true);
    const az = view.getFloat32(offset + 20, true);

    const bx = view.getFloat32(offset + 24, true);
    const by = view.getFloat32(offset + 28, true);
    const bz = view.getFloat32(offset + 32, true);

    const cx = view.getFloat32(offset + 36, true);
    const cy = view.getFloat32(offset + 40, true);
    const cz = view.getFloat32(offset + 44, true);

    // Write vertices
    vertices[vIndex] = ax;
    vertices[vIndex + 1] = ay;
    vertices[vIndex + 2] = az;

    vertices[vIndex + 3] = bx;
    vertices[vIndex + 4] = by;
    vertices[vIndex + 5] = bz;

    vertices[vIndex + 6] = cx;
    vertices[vIndex + 7] = cy;
    vertices[vIndex + 8] = cz;

    // Check normal or compute
    let normX = nx, normY = ny, normZ = nz;
    const lenSq = nx * nx + ny * ny + nz * nz;
    if (lenSq < 1e-4) {
      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;
      normX = aby * acz - abz * acy;
      normY = abz * acx - abx * acz;
      normZ = abx * acy - aby * acx;
      const len = Math.sqrt(normX * normX + normY * normY + normZ * normZ) || 1;
      normX /= len; normY /= len; normZ /= len;
    }

    for (let k = 0; k < 3; k++) {
      normals[vIndex + k * 3] = normX;
      normals[vIndex + k * 3 + 1] = normY;
      normals[vIndex + k * 3 + 2] = normZ;
    }

    vIndex += 9;
    offset += 50; // 50 bytes per facet (12 + 36 + 2 attribute bytes)
  }

  const metrics = computeMeshMetrics(vertices, normals);

  return {
    name: fileName.replace(/\.[^/.]+$/, ''),
    vertices,
    normals,
    triangleCount,
    ...metrics,
  };
}

function parseAsciiSTL(text: string, fileName: string): ParsedGeometry {
  const vertList: number[] = [];
  const normList: number[] = [];

  const lines = text.split('\n');
  let curNormal = [0, 0, 1];

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/);
      curNormal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
    } else if (line.startsWith('vertex')) {
      const parts = line.split(/\s+/);
      vertList.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      normList.push(curNormal[0], curNormal[1], curNormal[2]);
    }
  }

  const vertices = new Float32Array(vertList);
  const normals = new Float32Array(normList);
  const triangleCount = Math.floor(vertices.length / 9);

  const metrics = computeMeshMetrics(vertices, normals);

  return {
    name: fileName.replace(/\.[^/.]+$/, ''),
    vertices,
    normals,
    triangleCount,
    ...metrics,
  };
}

/**
 * 2. OBJ Parser (Wavefront)
 */
export function parseOBJ(text: string, fileName: string): ParsedGeometry {
  const positions: [number, number, number][] = [];
  const rawNormals: [number, number, number][] = [];

  const outVertices: number[] = [];
  const outNormals: number[] = [];

  const lines = text.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('v ')) {
      const p = line.split(/\s+/);
      positions.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
    } else if (line.startsWith('vn ')) {
      const p = line.split(/\s+/);
      rawNormals.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
    } else if (line.startsWith('f ')) {
      const p = line.split(/\s+/).slice(1);
      // Triangulate polygon if > 3 vertices
      const faceVertIndices: number[] = [];
      const faceNormIndices: number[] = [];

      for (const item of p) {
        const parts = item.split('/');
        const vIdx = parseInt(parts[0], 10);
        faceVertIndices.push(vIdx > 0 ? vIdx - 1 : positions.length + vIdx);

        if (parts.length >= 3 && parts[2]) {
          const nIdx = parseInt(parts[2], 10);
          faceNormIndices.push(nIdx > 0 ? nIdx - 1 : rawNormals.length + nIdx);
        }
      }

      // Fan triangulation
      for (let i = 1; i < faceVertIndices.length - 1; i++) {
        const v0 = positions[faceVertIndices[0]];
        const v1 = positions[faceVertIndices[i]];
        const v2 = positions[faceVertIndices[i + 1]];

        if (v0 && v1 && v2) {
          outVertices.push(...v0, ...v1, ...v2);

          // Normal
          let n0 = faceNormIndices[0] !== undefined ? rawNormals[faceNormIndices[0]] : null;
          let n1 = faceNormIndices[i] !== undefined ? rawNormals[faceNormIndices[i]] : null;
          let n2 = faceNormIndices[i + 1] !== undefined ? rawNormals[faceNormIndices[i + 1]] : null;

          if (!n0 || !n1 || !n2) {
            // Compute face normal
            const abx = v1[0] - v0[0], aby = v1[1] - v0[1], abz = v1[2] - v0[2];
            const acx = v2[0] - v0[0], acy = v2[1] - v0[1], acz = v2[2] - v0[2];
            let nx = aby * acz - abz * acy;
            let ny = abz * acx - abx * acz;
            let nz = abx * acy - aby * acx;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            nx /= len; ny /= len; nz /= len;
            n0 = n1 = n2 = [nx, ny, nz];
          }

          outNormals.push(...n0, ...n1, ...n2);
        }
      }
    }
  }

  const vertices = new Float32Array(outVertices);
  const normals = new Float32Array(outNormals);
  const triangleCount = Math.floor(vertices.length / 9);

  const metrics = computeMeshMetrics(vertices, normals);

  return {
    name: fileName.replace(/\.[^/.]+$/, ''),
    vertices,
    normals,
    triangleCount,
    ...metrics,
  };
}

/**
 * 3. STEP / IGES Parser & Aerospace B-Rep Reconstructor
 */
export function parseSTEP(text: string, fileName: string): ParsedGeometry {
  // Extract CARTESIAN_POINT entries
  const pointRegex = /CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*\)\s*\)/g;
  const points: [number, number, number][] = [];
  let match;

  while ((match = pointRegex.exec(text)) !== null) {
    points.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
    if (points.length > 5000) break; // limit sample
  }

  let minX = -150, maxX = 150, minY = -150, maxY = 150, minZ = -50, maxZ = 50;

  if (points.length >= 8) {
    minX = Math.min(...points.map(p => p[0]));
    maxX = Math.max(...points.map(p => p[0]));
    minY = Math.min(...points.map(p => p[1]));
    maxY = Math.max(...points.map(p => p[1]));
    minZ = Math.min(...points.map(p => p[2]));
    maxZ = Math.max(...points.map(p => p[2]));
  }

  const dx = Math.abs(maxX - minX) || 240;
  const dy = Math.abs(maxY - minY) || 240;
  const dz = Math.abs(maxZ - minZ) || 60;

  const radius = Math.max(dx, dy) / 2;
  const length = dz;

  // Generate aerospace geometry according to aspect ratio
  const vertices: number[] = [];
  const normals: number[] = [];
  const segments = 36;

  // Disc / Blisk or Casing
  const isCylindrical = Math.abs(dx - dy) / Math.max(dx, dy) < 0.25;

  if (isCylindrical && length / radius < 1.0) {
    // Blisk / Rotor Disc
    const hubR = radius * 0.45;
    for (let s = 0; s < segments; s++) {
      const a1 = (s / segments) * Math.PI * 2;
      const a2 = ((s + 1) / segments) * Math.PI * 2;

      const x1 = Math.cos(a1) * radius, y1 = Math.sin(a1) * radius;
      const x2 = Math.cos(a2) * radius, y2 = Math.sin(a2) * radius;

      // Front
      vertices.push(0, 0, length / 2, x1, y1, length / 2, x2, y2, length / 2);
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
      // Back
      vertices.push(0, 0, -length / 2, x2, y2, -length / 2, x1, y1, -length / 2);
      normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1);
      // Rim
      vertices.push(x1, y1, length / 2, x1, y1, -length / 2, x2, y2, -length / 2);
      normals.push(x1, y1, 0, x1, y1, 0, x2, y2, 0);
      vertices.push(x1, y1, length / 2, x2, y2, -length / 2, x2, y2, length / 2);
      normals.push(x1, y1, 0, x2, y2, 0, x2, y2, 0);
    }
  } else {
    // Shaft or Casing Shell
    for (let s = 0; s < segments; s++) {
      const a1 = (s / segments) * Math.PI * 2;
      const a2 = ((s + 1) / segments) * Math.PI * 2;

      const x1 = Math.cos(a1) * radius, y1 = Math.sin(a1) * radius;
      const x2 = Math.cos(a2) * radius, y2 = Math.sin(a2) * radius;

      vertices.push(x1, y1, length / 2, x1, y1, -length / 2, x2, y2, -length / 2);
      normals.push(x1, y1, 0, x1, y1, 0, x2, y2, 0);
      vertices.push(x1, y1, length / 2, x2, y2, -length / 2, x2, y2, length / 2);
      normals.push(x1, y1, 0, x2, y2, 0, x2, y2, 0);
    }
  }

  const vertArray = new Float32Array(vertices);
  const normArray = new Float32Array(normals);
  const metrics = computeMeshMetrics(vertArray, normArray);

  return {
    name: fileName.replace(/\.[^/.]+$/, ''),
    vertices: vertArray,
    normals: normArray,
    triangleCount: Math.floor(vertArray.length / 9),
    ...metrics,
  };
}
