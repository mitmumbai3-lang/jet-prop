import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useEngineStore } from '../store/useEngineStore';
import { Part, Finding } from '../types';
import { MapPin, AlertCircle } from 'lucide-react';

interface PartMeshProps {
  part: Part;
  explodedOffset: number;
  viewMode: 'shaded' | 'wireframe' | 'xray' | 'diff';
  clippingPlane?: THREE.Plane;
  isSelected: boolean;
  onSelect: () => void;
}

const PartMesh: React.FC<PartMeshProps> = ({ 
  part, 
  explodedOffset, 
  viewMode, 
  clippingPlane,
  isSelected,
  onSelect 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    if (!part.geometryData) {
      return new THREE.BoxGeometry(20, 20, 20);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(part.geometryData.vertices, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(part.geometryData.normals, 3));
    if (part.geometryData.indices) {
      geom.setIndex(new THREE.BufferAttribute(part.geometryData.indices, 1));
    }
    geom.computeBoundingBox();
    return geom;
  }, [part.geometryData]);

  // Determine material styling
  const material = useMemo(() => {
    const planes = clippingPlane ? [clippingPlane] : [];

    if (viewMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({
        color: isSelected ? '#00f0ff' : part.color || '#94a3b8',
        wireframe: true,
        clippingPlanes: planes,
      });
    }

    if (viewMode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color: isSelected ? '#00f0ff' : part.color || '#64748b',
        transparent: true,
        opacity: isSelected ? 0.75 : 0.28,
        roughness: 0.1,
        metalness: 0.9,
        wireframe: false,
        clippingPlanes: planes,
      });
    }

    if (viewMode === 'diff') {
      // Color-code modified parts
      const isDefective = part.id === 'part-hpt-blisk-stg1';
      return new THREE.MeshStandardMaterial({
        color: isDefective ? '#ff3366' : '#00ff88',
        roughness: 0.3,
        metalness: 0.8,
        clippingPlanes: planes,
      });
    }

    // Default Shaded Aerospace Metallic PBR
    return new THREE.MeshStandardMaterial({
      color: isSelected ? '#00f0ff' : part.color || '#94a3b8',
      roughness: 0.35,
      metalness: 0.85,
      emissive: isSelected ? new THREE.Color('#003847') : new THREE.Color('#000000'),
      clippingPlanes: planes,
      clipShadows: true,
    });
  }, [viewMode, isSelected, part.color, clippingPlane, part.id]);

  if (!part.visible) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, explodedOffset]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    />
  );
};

interface IssuePinProps {
  finding: Finding;
  explodedOffset: number;
  isSelected: boolean;
  onSelect: () => void;
}

const IssuePin: React.FC<IssuePinProps> = ({ finding, explodedOffset, isSelected, onSelect }) => {
  if (!finding.pinCoordinates || finding.resolved) return null;

  const [x, y, z] = finding.pinCoordinates;
  const pinPos: [number, number, number] = [x, y, z + explodedOffset];

  const getColor = () => {
    switch (finding.severity) {
      case 'Critical': return 'bg-laser-red text-white shadow-glow-red border-red-400';
      case 'High': return 'bg-laser-amber text-white shadow-glow-amber border-amber-400';
      case 'Medium': return 'bg-yellow-500 text-black border-yellow-300';
      default: return 'bg-laser-cyan text-black border-cyan-300';
    }
  };

  return (
    <group position={pinPos}>
      <Html distanceFactor={450} center zIndexRange={[50, 0]}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="relative cursor-pointer group"
        >
          {/* Animated pulsing ripple ring */}
          <div className="absolute -inset-2 rounded-full border border-laser-cyan/60 animate-ping pointer-events-none" />
          
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold shadow-lg transition-transform hover:scale-125 ${getColor()}`}>
            <AlertCircle className="w-3 h-3" />
            <span>{finding.id}</span>
          </div>

          {/* Hover popup tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-obsidian-900 border border-laser-cyan/40 text-[10px] text-slate-200 font-mono shadow-2xl z-50 pointer-events-none">
            <div className="font-bold text-laser-cyan truncate">{finding.title}</div>
            <div className="text-slate-400 mt-0.5 truncate">{finding.severity} Severity • Click to view</div>
          </div>
        </div>
      </Html>
    </group>
  );
};

export const ThreeViewport: React.FC = () => {
  const { 
    parts, 
    selectedPartId, 
    selectPart, 
    viewMode, 
    explodedValue, 
    cutawayActive, 
    cutawayDepth, 
    cutawayAxis,
    findings,
    selectedFindingId,
    selectFinding,
    showPins,
    isModalOpen
  } = useEngineStore();

  // Dynamic section cutaway plane
  const clippingPlane = useMemo(() => {
    if (!cutawayActive) return undefined;
    const normal = 
      cutawayAxis === 'x' ? new THREE.Vector3(1, 0, 0) :
      cutawayAxis === 'y' ? new THREE.Vector3(0, 1, 0) :
      new THREE.Vector3(0, 0, 1);
    
    return new THREE.Plane(normal, cutawayDepth * 2);
  }, [cutawayActive, cutawayAxis, cutawayDepth]);

  // Exploded view offsets along Z axis
  const getExplodedZ = (index: number) => {
    // Spreads parts out longitudinally along engine axis
    return (index - 1.5) * explodedValue * 220;
  };

  return (
    <div className="w-full h-full relative bg-obsidian-950 overflow-hidden select-none isolate">
      {/* Anime.js inspired background grid and coordinates HUD */}
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />

      {/* Viewport Canvas */}
      <Canvas
        camera={{ position: [400, 300, 500], fov: 45, near: 1, far: 5000 }}
        gl={{ localClippingEnabled: true, antialias: true }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[300, 400, 300]} intensity={1.2} />
        <directionalLight position={[-300, -200, -300]} intensity={0.4} />
        <pointLight position={[0, 200, 0]} intensity={0.8} color="#00f0ff" />

        {/* CAD Coordinate Ground Grid */}
        <Grid
          position={[0, -260, 0]}
          args={[1200, 1200]}
          cellSize={40}
          cellThickness={1}
          cellColor="#1e293b"
          sectionSize={120}
          sectionThickness={1.5}
          sectionColor="#00f0ff"
          fadeDistance={1400}
        />

        {/* Assembly Parts */}
        <group>
          {parts.map((part, idx) => {
            const zOffset = getExplodedZ(idx);
            return (
              <PartMesh
                key={part.id}
                part={part}
                explodedOffset={zOffset}
                viewMode={viewMode}
                clippingPlane={clippingPlane}
                isSelected={selectedPartId === part.id}
                onSelect={() => selectPart(part.id)}
              />
            );
          })}

          {/* 3D Issue Pins - hidden when modal is open or showPins is false */}
          {showPins && !isModalOpen && findings.map((finding) => {
            const affectedPartIndex = parts.findIndex(p => p.id === finding.affectedPartIds[0]);
            const zOffset = affectedPartIndex >= 0 ? getExplodedZ(affectedPartIndex) : 0;
            return (
              <IssuePin
                key={finding.id}
                finding={finding}
                explodedOffset={zOffset}
                isSelected={selectedFindingId === finding.id}
                onSelect={() => selectFinding(finding.id)}
              />
            );
          })}
        </group>

        <OrbitControls 
          makeDefault 
          dampingFactor={0.08}
          minDistance={100}
          maxDistance={3000}
        />
      </Canvas>

      {/* Floating HUD Coordinate Compass */}
      <div className="absolute bottom-4 left-4 p-2.5 rounded-lg bg-obsidian-900/80 border border-obsidian-700 backdrop-blur-md text-[10px] font-mono text-slate-400 select-none pointer-events-none space-y-1">
        <div className="text-laser-cyan font-bold flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-laser-cyan animate-pulse" />
          <span>VIEWPORT CAD MATRIX</span>
        </div>
        <div>AXIS ORIENTATION: <span className="text-slate-200">ISO-X/Y/Z (AERO)</span></div>
        <div>CLIPPING: <span className="text-slate-200">{cutawayActive ? `ON (${cutawayAxis.toUpperCase()})` : 'OFF'}</span></div>
        <div>EXPLODED: <span className="text-slate-200">{Math.round(explodedValue * 100)}%</span></div>
      </div>
    </div>
  );
};
