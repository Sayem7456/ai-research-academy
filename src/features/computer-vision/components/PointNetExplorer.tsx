'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Point3D {
  x: number; y: number; z: number; label: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function generatePointCloud(shape: 'cube' | 'sphere' | 'plane', numPoints: number, seed: number): Point3D[] {
  const points: Point3D[] = [];
  for (let i = 0; i < numPoints; i++) {
    const r = seededRandom(seed + i * 3);
    const r2 = seededRandom(seed + i * 3 + 1);
    const r3 = seededRandom(seed + i * 3 + 2);
    if (shape === 'cube') {
      const face = Math.floor(r * 6);
      let x = (r2 - 0.5) * 2;
      let y = (r3 - 0.5) * 2;
      let z = (seededRandom(seed + i * 3 + 3) - 0.5) * 2;
      if (face === 0) x = -1;
      else if (face === 1) x = 1;
      else if (face === 2) y = -1;
      else if (face === 3) y = 1;
      else if (face === 4) z = -1;
      else z = 1;
      points.push({ x, y, z, label: 'cube' });
    } else if (shape === 'sphere') {
      const theta = r * Math.PI * 2;
      const phi = Math.acos(2 * r2 - 1);
      const rad = 0.8 + r3 * 0.4;
      points.push({
        x: rad * Math.sin(phi) * Math.cos(theta),
        y: rad * Math.sin(phi) * Math.sin(theta),
        z: rad * Math.cos(phi),
        label: 'sphere',
      });
    } else {
      points.push({
        x: (r2 - 0.5) * 2,
        y: (r3 - 0.5) * 2,
        z: (seededRandom(seed + i * 3 + 3) - 0.5) * 0.2 + 0.5,
        label: 'plane',
      });
    }
  }
  return points;
}

function project3D(p: Point3D, angleX: number, angleY: number): { sx: number; sy: number; depth: number } {
  const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
  const y1 = p.y * cosX - p.z * sinX;
  const z1 = p.y * sinX + p.z * cosX;
  const x2 = p.x * cosY + z1 * sinY;
  const z2 = -p.x * sinY + z1 * cosY;
  return {
    sx: x2 * 120 + 150,
    sy: y1 * 120 + 120,
    depth: (z2 + 2) / 4,
  };
}

function rotateX(p: Point3D, angle: number): Point3D {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c, label: p.label };
}

function rotateY(p: Point3D, angle: number): Point3D {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c, label: p.label };
}

function rotateZ(p: Point3D, angle: number): Point3D {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z, label: p.label };
}

const PHASE_LABELS = [
  'Raw Input Cloud',
  'T-Net Alignment',
  'Per-Point MLP Features',
  'Max Pooling Aggregation',
  'Classification Output',
];

const PHASE_DESCRIPTIONS = [
  'Unordered point cloud of N points with (x, y, z) coordinates.',
  'Spatial Transformer Network predicts an affine transform to align the input, providing rotation/translation invariance.',
  'Shared MLPs (1×1 convolutions) process each point independently, lifting to a 64 → 128 → 1024-d feature space.',
  'Max pooling aggregates per-point features into a single global feature vector (permutation-invariant).',
  'The global feature vector feeds into a classifier head for object classification or segmentation.',
];

export default function PointNetExplorer() {
  const [shape, setShape] = useState<'cube' | 'sphere' | 'plane'>('cube');
  const [numPoints, setNumPoints] = useState(200);
  const [angleX, setAngleX] = useState(0.5);
  const [angleY, setAngleY] = useState(0.3);
  const [useTNet, setUseTNet] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [phase, setPhase] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seed = 42;
  const totalPhases = PHASE_LABELS.length - 1;

  const points = useMemo(() => generatePointCloud(shape, numPoints, seed), [shape, numPoints, seed]);

  /* T-Net: simulate a learned rotation alignment */
  const misalignAngle = useMemo(() => 0.8 + seededRandom(seed + 999) * 0.4, [seed]);

  const misaligned = useMemo(() => {
    if (!useTNet) return points;
    return points.map(p => rotateZ(rotateY(rotateX(p, misalignAngle), misalignAngle * 0.6), misalignAngle * 0.3));
  }, [points, useTNet, misalignAngle]);

  const tNetAligned = useMemo(() => {
    if (!useTNet) return points;
    return points.map(p => rotateZ(rotateY(rotateX(p, -misalignAngle * 0.85), -misalignAngle * 0.5), -misalignAngle * 0.25));
  }, [points, useTNet, misalignAngle]);

  /* Which points to show based on phase */
  const activePoints = useMemo(() => {
    switch (phase) {
      case 0: return points;                           /* raw input */
      case 1: return useTNet ? misaligned : points;     /* misaligned before T-Net */
      default: return tNetAligned;                      /* aligned */
    }
  }, [phase, points, useTNet, misaligned, tNetAligned]);

  /* Per-point colors based on phase */
  const pointColor = useCallback((label: string, i: number): string => {
    if (phase === 2) {
      const h = ((i / points.length) * 360 + shape === 'cube' ? 0 : shape === 'sphere' ? 120 : 240) % 360;
      return `hsl(${h}, 70%, 55%)`;
    }
    return label === 'cube' ? '#3b82f6' : label === 'sphere' ? '#10b981' : '#f59e0b';
  }, [phase, points.length, shape]);

  const projected = useMemo(() => activePoints.map(p => ({
    ...p,
    ...project3D(p, angleX, angleY),
  })), [activePoints, angleX, angleY]);

  /* Auto-rotate interval */
  useEffect(() => {
    if (isAutoRotating) {
      intervalRef.current = setInterval(() => {
        setAngleX(prev => prev + 0.02);
        setAngleY(prev => prev + 0.015);
      }, 50);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isAutoRotating]);

  /* Phase animation */
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      phaseIntervalRef.current = setInterval(() => {
        setPhase(prev => {
          if (prev >= totalPhases) {
            setIsAnimating(false);
            return totalPhases;
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      if (phaseIntervalRef.current) { clearInterval(phaseIntervalRef.current); phaseIntervalRef.current = null; }
    }
    return () => { if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current); };
  }, [isAnimating, totalPhases]);

  const handleStart = () => {
    setPhase(0);
    setIsAnimating(true);
  };

  const handleStop = () => {
    setIsAnimating(false);
  };

  const handleReset = () => {
    setIsAnimating(false);
    setPhase(0);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAutoRotating) {
      const rect = e.currentTarget.getBoundingClientRect();
      setAngleY(((e.clientX - rect.left) / rect.width - 0.5) * 2);
      setAngleX(((e.clientY - rect.top) / rect.height - 0.5) * 1.5);
    }
  }, [isAutoRotating]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">3D Vision — PointNet</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          PointNet (Qi et al., 2017) is a pioneering deep learning architecture for processing
          unordered 3D point clouds. It uses shared MLPs, a symmetric aggregation function (max
          pooling), and a spatial transformer network for invariance.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Settings</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {(['cube', 'sphere', 'plane'] as const).map((s) => (
                <button key={s} onClick={() => { setShape(s); setSelectedPoint(null); }}
                  className={`px-3 py-1.5 text-xs rounded capitalize ${
                    shape === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mr-1">Points: {numPoints}</label>
              <input type="range" min="50" max="500" step="50" value={numPoints}
                onChange={(e) => setNumPoints(parseInt(e.target.value))}
                className="w-20 align-middle" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={useTNet}
                onChange={(e) => setUseTNet(e.target.checked)}
                className="w-4 h-4" />
              Spatial Transformer (T-Net)
            </label>
            <button onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`px-3 py-1.5 text-xs rounded ${
                isAutoRotating ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              } hover:opacity-90`}>
              {isAutoRotating ? 'Stop Rotate' : 'Auto-Rotate'}
            </button>
          </div>

          {/* Phase navigation */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!isAnimating && phase === 0 && (
              <button onClick={handleStart}
                className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700">
                Start Animation
              </button>
            )}
            {isAnimating && (
              <button onClick={handleStop}
                className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700">
                Stop
              </button>
            )}
            {(!isAnimating && phase > 0) && (
              <>
                <button onClick={handleStart}
                  className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700">
                  Restart
                </button>
                <button onClick={() => setPhase(prev => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90">
                  Prev
                </button>
                <button onClick={() => setPhase(prev => Math.min(totalPhases, prev + 1))}
                  className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90">
                  Next
                </button>
              </>
            )}
            {(!isAnimating && phase > 0) && (
              <button onClick={handleReset}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:opacity-90">
                Reset
              </button>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              Phase {phase} of {totalPhases}
            </span>
          </div>

          {/* Phase indicator bar */}
          <div className="mt-3 flex gap-1">
            {Array.from({ length: totalPhases + 1 }).map((_, i) => (
              <button key={i} onClick={() => { setPhase(i); setIsAnimating(false); }}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i <= phase ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                } ${i === phase ? 'ring-2 ring-blue-300' : ''}`}
                title={PHASE_LABELS[i]}
              />
            ))}
          </div>
          <div className="mt-1 text-xs text-blue-700 dark:text-blue-300 font-medium">
            {PHASE_LABELS[phase]}
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {PHASE_DESCRIPTIONS[phase]}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-900 max-w-full"
            style={{ width: 300, height: 240 }}
            onMouseMove={handleMouseMove}>
            {projected.map((p, i) => (
              <div key={i}
                onClick={() => setSelectedPoint(selectedPoint === i ? null : i)}
                className="absolute rounded-full cursor-pointer"
                style={{
                  left: p.sx - (p.depth * 2 + 1),
                  top: p.sy - (p.depth * 2 + 1),
                  width: p.depth * 4 + 2,
                  height: p.depth * 4 + 2,
                  backgroundColor: pointColor(p.label, i),
                  opacity: phase === 1 && useTNet ? p.depth * 0.5 + 0.3 : p.depth * 0.5 + 0.3,
                  zIndex: Math.round(p.depth * 100),
                  transition: 'background-color 0.3s',
                  outline: selectedPoint === i ? '2px solid #fbbf24' : 'none',
                  outlineOffset: 1,
                }}
                title={`(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`}
              />
            ))}
            {/* T-Net overlay on phase 1 */}
            {phase === 1 && useTNet && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-yellow-600/70 text-white text-[9px] px-2 py-1 rounded">
                  T-Net aligning...
                </div>
              </div>
            )}
            {/* Max pooling overlay on phase 3 */}
            {phase === 3 && (
              <div className="absolute bottom-2 left-2 right-2 bg-indigo-600/80 text-white text-[8px] px-2 py-1 rounded text-center">
                Max Pooling → Global Feature Vector (1024-d)
              </div>
            )}
            <div className="absolute bottom-2 right-2 text-[8px] text-gray-400">
              {shape} — {numPoints} pts
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400">
              <h3 className="font-semibold text-sm mb-1">PointNet Architecture</h3>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div><strong>Input:</strong> N × 3 (unordered point cloud)</div>
                <div><strong>MLP:</strong> Shared 1×1 convolutions on each point (64 → 128 → 1024)</div>
                <div><strong>Symmetric:</strong> Max pooling aggregates per-point features</div>
                <div><strong>Output:</strong> Global feature vector (1024-d) for classification</div>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
              <h3 className="font-semibold text-sm mb-1">Invariance Properties</h3>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div><strong>Permutation:</strong> Max pooling is symmetric — order of points does not matter</div>
                <div><strong>Rotation:</strong> T-Net predicts an affine transform to align input</div>
                <div><strong>Translation:</strong> Network learns translation-invariant features</div>
              </div>
            </div>

            {/* Phase-specific info panel */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
              <h3 className="font-semibold text-sm mb-1">Current Phase: {PHASE_LABELS[phase]}</h3>
              <div className="text-xs text-gray-700 dark:text-gray-300">
                {phase === 0 && 'Explore the raw point cloud. Each point has only (x, y, z) — no order, no structure.'}
                {phase === 1 && `T-Net applies a learned ${(misalignAngle * 0.85 * 180 / Math.PI).toFixed(0)}° rotation to align the point cloud, providing rotation invariance.`}
                {phase === 2 && 'Each point is now represented by a high-dimensional feature vector (color-coded). Shared MLPs process all points independently.'}
                {phase === 3 && 'Max pooling selects the most salient feature across all points, collapsing N×1024 → 1×1024. This makes the network permutation-invariant.'}
                {phase === 4 && 'The 1024-d global feature feeds into a classifier (fully connected layers) to predict the object class.'}
              </div>
            </div>

            {selectedPoint !== null && projected[selectedPoint] && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400"
              >
                <h3 className="font-semibold text-sm mb-1">Selected Point</h3>
                <div className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  x: {projected[selectedPoint].x.toFixed(3)},
                  y: {projected[selectedPoint].y.toFixed(3)},
                  z: {projected[selectedPoint].z.toFixed(3)}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
            <h3 className="font-semibold text-sm mb-2">Key Innovation</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              PointNet was the first to process raw point clouds directly, avoiding voxelization.
              Each point is processed independently by shared MLPs, then aggregated.
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400">
            <h3 className="font-semibold text-sm mb-2">Limitation</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              PointNet processes each point independently — it does not capture local
              neighborhood structure. PointNet++ addresses this with hierarchical grouping.
            </p>
          </div>
          <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-lg border-l-4 border-teal-400">
            <h3 className="font-semibold text-sm mb-2">Applications</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Autonomous driving (LiDAR), robotics (grasping), AR/VR (scene understanding),
              and 3D object classification/segmentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
