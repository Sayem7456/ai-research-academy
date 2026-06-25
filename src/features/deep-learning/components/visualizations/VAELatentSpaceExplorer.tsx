'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */
interface LatentPoint {
  x: number;
  y: number;
  label: number;
}

interface TrainingState {
  isTraining: boolean;
  epoch: number;
  maxEpochs: number;
  lr: number;
  batchSize: number;
  klWeight: number;
  losses: { recon: number[]; kl: number[] };
}

/* ──────────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────────── */
const CLASS_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'];
const CLASS_NAMES = ['Circle', 'Square', 'Triangle', 'Diamond', 'Star'];
const PIXEL_GRID = 8;
const MANIFOLD_RES = 20;
const SVG_W = 500;
const SVG_H = 400;
const X_MIN = -3, X_MAX = 3, Y_MIN = -3, Y_MAX = 3;

const TUTORIAL_STEPS = [
  { title: 'Latent Space', body: 'This 2D map is the latent space — each point represents a compressed "idea". Similar concepts cluster together.' },
  { title: 'Decode a Point', body: 'Click any point on the scatter plot to decode it. The preview panel shows what the VAE produces from that latent code.' },
  { title: 'Encoder (μ, σ)', body: 'The encoder maps input to a Gaussian distribution with mean μ and spread σ. This is not a single point — it\'s a region.' },
  { title: 'Sampling (Reparameterization)', body: 'We sample z = μ + σ·ε where ε ~ N(0,1). This stochastic step lets the VAE generate diverse outputs. Adjust σ to control diversity.' },
  { title: 'Interpolation', body: 'Pick two points and slide between them. Smooth movement in latent space → smooth transitions in output. This is the core VAE insight.' },
  { title: 'KL Divergence (β)', body: 'β controls how tightly clusters form. Low β = loose clusters, better reconstruction. High β = tight clusters, smoother space but blurrier outputs.' },
];

/* ──────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────── */
function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

function sampleLatent(meanX: number, meanY: number, std: number): [number, number] {
  return [meanX + gaussianRandom() * std, meanY + gaussianRandom() * std];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function toSvgX(x: number) { return ((x - X_MIN) / (X_MAX - X_MIN)) * SVG_W; }
function toSvgY(y: number) { return ((Y_MAX - y) / (Y_MAX - Y_MIN)) * SVG_H; }

/* ──────────────────────────────────────────────────────────────────
   Pixel-grid shape generators (8×8 grayscale patterns)
   Each returns an 8×8 number[][] with values 0-255.
   ────────────────────────────────────────────────────────────────── */
function circleGrid(): number[][] {
  const g: number[][] = Array.from({ length: PIXEL_GRID }, () => Array(PIXEL_GRID).fill(0));
  for (let r = 0; r < PIXEL_GRID; r++)
    for (let c = 0; c < PIXEL_GRID; c++) {
      const dx = c - 3.5, dy = r - 3.5;
      g[r][c] = Math.sqrt(dx * dx + dy * dy) <= 3.2 ? 240 : 20;
    }
  return g;
}

function squareGrid(): number[][] {
  const g: number[][] = Array.from({ length: PIXEL_GRID }, () => Array(PIXEL_GRID).fill(0));
  for (let r = 1; r < 7; r++)
    for (let c = 1; c < 7; c++) g[r][c] = 230;
  return g;
}

function triangleGrid(): number[][] {
  const g: number[][] = Array.from({ length: PIXEL_GRID }, () => Array(PIXEL_GRID).fill(0));
  for (let r = 0; r < 7; r++) {
    const left = 3 - Math.floor(r * 0.6);
    const right = 4 + Math.floor(r * 0.6);
    for (let c = left; c <= right; c++) if (c >= 0 && c < 8) g[r][c] = 220;
  }
  return g;
}

function diamondGrid(): number[][] {
  const g: number[][] = Array.from({ length: PIXEL_GRID }, () => Array(PIXEL_GRID).fill(0));
  for (let r = 0; r < 8; r++) {
    const dist = Math.abs(r - 3.5);
    const halfW = Math.round(3.5 - dist);
    for (let c = 3 - halfW; c <= 3 + halfW; c++) if (c >= 0 && c < 8) g[r][c] = 235;
  }
  return g;
}

function starGrid(): number[][] {
  const g: number[][] = Array.from({ length: PIXEL_GRID }, () => Array(PIXEL_GRID).fill(0));
  const pts: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    pts.push([3.5 + 3.2 * Math.cos(angle), 3.5 + 3.2 * Math.sin(angle)]);
    const inner = ((i * 72 + 36) - 90) * Math.PI / 180;
    pts.push([3.5 + 1.4 * Math.cos(inner), 3.5 + 1.4 * Math.sin(inner)]);
  }
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [yi, xi] = pts[i], [yj, xj] = pts[j];
        if ((yi > c) !== (yj > c) && r < ((xj - xi) * (c - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) g[r][c] = 240;
    }
  return g;
}

const SHAPE_GRIDS = [circleGrid, squareGrid, triangleGrid, diamondGrid, starGrid];

function decodeToPixels(zx: number, zy: number): number[][] {
  const angle = Math.atan2(zy, zx);
  const dist = Math.sqrt(zx * zx + zy * zy);
  const classIdx = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 5) % 5;
  const brightness = clamp(dist / 2, 0.15, 1);
  const base = SHAPE_GRIDS[classIdx]();
  return base.map(row => row.map(v => Math.round(v * brightness)));
}

function pixelGridToColor(grid: number[][]): string {
  const avg = grid.flat().reduce((a, b) => a + b, 0) / (PIXEL_GRID * PIXEL_GRID);
  const v = Math.round(clamp(avg, 0, 255));
  return `rgb(${v},${v},${v})`;
}

function getClassFromLatent(zx: number, zy: number): number {
  const angle = Math.atan2(zy, zx);
  return Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 5) % 5;
}

function formatLoss(v: number): string {
  return v < 1 ? v.toFixed(3) : v < 100 ? v.toFixed(1) : v.toFixed(0);
}

/* ──────────────────────────────────────────────────────────────────
   PixelGrid — renders an 8×8 decoded grid as SVG rects
   ────────────────────────────────────────────────────────────────── */
function PixelGrid({ grid, size = 64, className = '', highlight = false }: {
  grid: number[][]; size?: number; className?: string; highlight?: boolean;
}) {
  const cellSize = size / PIXEL_GRID;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`${className} rounded-sm`}>
      {grid.map((row, r) =>
        row.map((v, c) => (
          <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize}
            width={cellSize} height={cellSize}
            fill={`rgb(${v},${v},${v})`} />
        ))
      )}
      {highlight && <rect width={size} height={size} fill="none" stroke="#6366F1" strokeWidth={2} rx={2} />}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────
   LossChart — small line chart for training losses
   ────────────────────────────────────────────────────────────────── */
function LossChart({ recon, kl, w = 300, h = 100 }: { recon: number[]; kl: number[]; w?: number; h?: number }) {
  if (recon.length < 2) return <div className="text-[10px] text-gray-400 dark:text-gray-500 h-[100px] flex items-center justify-center">Loss data will appear after training starts</div>;
  const allVals = [...recon, ...kl];
  const maxVal = Math.max(...allVals, 1);
  const pad = 4;
  const plotW = w - pad * 2, plotH = h - pad * 2;
  const toPath = (data: number[]) =>
    data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * plotW;
      const y = pad + (1 - v / maxVal) * plotH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <rect width={w} height={h} fill="rgb(249 250 251)" rx={4} className="dark:fill-gray-700" />
      <path d={toPath(recon)} fill="none" stroke="#3B82F6" strokeWidth={1.5} />
      <path d={toPath(kl)} fill="none" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3,2" />
      <text x={pad + 2} y={pad + 10} fontSize={8} fill="#3B82F6">Recon</text>
      <text x={pad + 40} y={pad + 10} fontSize={8} fill="#EF4444">KL</text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────────── */
export default function VAELatentSpaceExplorer() {
  /* ── Points ── */
  const [latentPoints, setLatentPoints] = useState<LatentPoint[]>(() =>
    Array.from({ length: 60 }, (_, i) => {
      const label = i % 5;
      const angle = (label / 5) * Math.PI * 2;
      const [x, y] = sampleLatent(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0.3);
      return { x, y, label };
    })
  );

  /* ── Selection & interpolation ── */
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [interpolation, setInterpolation] = useState<[LatentPoint, LatentPoint] | null>(null);
  const [interpT, setInterpT] = useState(0.5);

  /* ── Sampling ── */
  const [reparamStd, setReparamStd] = useState(0.3);
  const [samplingMode, setSamplingMode] = useState<'encoder' | 'prior'>('encoder');
  const [generatedSamples, setGeneratedSamples] = useState<{ encoder: number[][][]; prior: number[][][] }>({ encoder: [], prior: [] });

  /* ── Training ── */
  const [training, setTraining] = useState<TrainingState>({
    isTraining: false, epoch: 0, maxEpochs: 100, lr: 0.1, batchSize: 16, klWeight: 1.0,
    losses: { recon: [], kl: [] },
  });
  const trainingRef = useRef(training);
  trainingRef.current = training;
  const pointsRef = useRef(latentPoints);
  pointsRef.current = latentPoints;

  /* ── Visualization toggles ── */
  const [showManifold, setShowManifold] = useState(false);

  /* ── Tutorial ── */
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);

  /* ── Manifold grid ── */
  const manifoldGrid = useMemo(() => {
    const grid: { color: string; classIdx: number }[][] = [];
    for (let r = 0; r < MANIFOLD_RES; r++) {
      const row: { color: string; classIdx: number }[] = [];
      for (let c = 0; c < MANIFOLD_RES; c++) {
        const zx = X_MIN + (c / (MANIFOLD_RES - 1)) * (X_MAX - X_MIN);
        const zy = Y_MAX - (r / (MANIFOLD_RES - 1)) * (Y_MAX - Y_MIN);
        const pixels = decodeToPixels(zx, zy);
        const classIdx = getClassFromLatent(zx, zy);
        row.push({ color: pixelGridToColor(pixels), classIdx });
      }
      grid.push(row);
    }
    return grid;
  }, []);

  /* ── Decoded preview for selected point ── */
  const selectedPixels = useMemo(() => {
    if (selectedPoint === null || selectedPoint >= latentPoints.length) return null;
    const p = latentPoints[selectedPoint];
    return decodeToPixels(p.x, p.y);
  }, [selectedPoint, latentPoints]);

  /* ── Interpolation filmstrip ── */
  const filmstrip = useMemo(() => {
    if (!interpolation) return [];
    const [p1, p2] = interpolation;
    return Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      const zx = p1.x + (p2.x - p1.x) * t;
      const zy = p1.y + (p2.y - p1.y) * t;
      return { t, pixels: decodeToPixels(zx, zy), zx, zy };
    });
  }, [interpolation]);

  /* ── Interpolated point ── */
  const interpPoint = useMemo(() => {
    if (!interpolation) return null;
    const [p1, p2] = interpolation;
    return { x: p1.x + (p2.x - p1.x) * interpT, y: p1.y + (p2.y - p1.y) * interpT };
  }, [interpolation, interpT]);

  /* ── Actions ── */
  const addRandomPoint = useCallback(() => {
    const label = Math.floor(Math.random() * 5);
    const angle = (label / 5) * Math.PI * 2;
    const [x, y] = sampleLatent(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, reparamStd);
    setLatentPoints(prev => [...prev, { x, y, label }]);
  }, [reparamStd]);

  const startInterpolation = useCallback(() => {
    if (latentPoints.length < 2) return;
    const i = Math.floor(Math.random() * latentPoints.length);
    let j = Math.floor(Math.random() * latentPoints.length);
    while (j === i && latentPoints.length > 1) j = Math.floor(Math.random() * latentPoints.length);
    setInterpolation([latentPoints[i], latentPoints[j]]);
    setInterpT(0);
  }, [latentPoints]);

  const generateSamples = useCallback(() => {
    const encoder: number[][][] = [];
    const prior: number[][][] = [];
    for (let i = 0; i < 10; i++) {
      const label = i % 5;
      const angle = (label / 5) * Math.PI * 2;
      const [ex, ey] = sampleLatent(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, reparamStd);
      encoder.push(decodeToPixels(ex, ey));
      const [px, py] = [gaussianRandom(), gaussianRandom()];
      prior.push(decodeToPixels(px, py));
    }
    setGeneratedSamples({ encoder, prior });
  }, [reparamStd]);

  const resetAll = useCallback(() => {
    setLatentPoints([]);
    setSelectedPoint(null);
    setInterpolation(null);
    setGeneratedSamples({ encoder: [], prior: [] });
    setTraining(prev => ({ ...prev, isTraining: false, epoch: 0, losses: { recon: [], kl: [] } }));
  }, []);

  /* ── Training logic ── */
  useEffect(() => {
    if (!training.isTraining) return;
    const id = setInterval(() => {
      setTraining(prev => {
        if (prev.epoch >= prev.maxEpochs) return { ...prev, isTraining: false };
        const newEpoch = prev.epoch + 1;
        const t = newEpoch / prev.maxEpochs;
        const reconLoss = 120 * Math.exp(-t * 3 * prev.lr) + 10 + Math.random() * 5;
        const klLoss = 5 * t * prev.klWeight + Math.random() * 2;
        return {
          ...prev,
          epoch: newEpoch,
          losses: {
            recon: [...prev.losses.recon, reconLoss],
            kl: [...prev.losses.kl, klLoss],
          },
        };
      });
      setLatentPoints(prev => {
        const t = (trainingRef.current.epoch + 1) / trainingRef.current.maxEpochs;
        const lr = trainingRef.current.lr;
        const beta = trainingRef.current.klWeight;
        const batchSize = trainingRef.current.batchSize;
        const moveFraction = Math.min(batchSize / Math.max(prev.length, 1), 1);
        const indicesToMove = new Set<number>();
        while (indicesToMove.size < Math.ceil(prev.length * moveFraction)) {
          indicesToMove.add(Math.floor(Math.random() * prev.length));
        }
        return prev.map((p, i) => {
          if (!indicesToMove.has(i)) return p;
          const angle = (p.label / 5) * Math.PI * 2;
          const targetX = Math.cos(angle) * 1.2;
          const targetY = Math.sin(angle) * 1.2;
          const pullStrength = lr * 0.3 * (1 + beta * 0.5);
          const noise = 0.15 * (1 - t) * (1 / (1 + beta));
          return {
            ...p,
            x: clamp(p.x + (targetX - p.x) * pullStrength + gaussianRandom() * noise, X_MIN + 0.3, X_MAX - 0.3),
            y: clamp(p.y + (targetY - p.y) * pullStrength + gaussianRandom() * noise, Y_MIN + 0.3, Y_MAX - 0.3),
          };
        });
      });
    }, 200);
    return () => clearInterval(id);
  }, [training.isTraining]);

  const startTraining = useCallback(() => {
    setTraining(prev => ({ ...prev, isTraining: true }));
  }, []);

  const pauseTraining = useCallback(() => {
    setTraining(prev => ({ ...prev, isTraining: false }));
  }, []);

  /* ── Tutorial highlight ── */
  const getHighlight = (section: string) => {
    if (tutorialStep === null) return '';
    const map: Record<number, string> = {
      0: 'scatter',
      1: 'preview',
      2: 'architecture',
      3: 'sampling',
      4: 'interpolation',
      5: 'beta',
    };
    return map[tutorialStep] === section
      ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-gray-800'
      : '';
  };

  /* ── Render ── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">VAE Latent Space Explorer</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Explore how VAEs compress data into a latent space and decode it back into pixel patterns
          </p>
        </div>
        <button
          onClick={() => setTutorialStep(tutorialStep === null ? 0 : null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            tutorialStep !== null
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {tutorialStep !== null ? 'Exit Tutorial' : 'Tutorial'}
        </button>
      </div>

      {/* Tutorial bar */}
      {tutorialStep !== null && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <button key={i} onClick={() => setTutorialStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === tutorialStep ? 'bg-indigo-600 scale-125' : i < tutorialStep ? 'bg-indigo-300 dark:bg-indigo-600' : 'bg-indigo-200 dark:bg-indigo-800'}`} />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))} disabled={tutorialStep === 0}
                className="px-2 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-indigo-200 dark:border-indigo-700 rounded disabled:opacity-30 cursor-pointer">Prev</button>
              <button onClick={() => setTutorialStep(Math.min(TUTORIAL_STEPS.length - 1, tutorialStep + 1))} disabled={tutorialStep === TUTORIAL_STEPS.length - 1}
                className="px-2 py-0.5 text-[10px] bg-white dark:bg-gray-700 border border-indigo-200 dark:border-indigo-700 rounded disabled:opacity-30 cursor-pointer">Next</button>
            </div>
          </div>
          <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">{TUTORIAL_STEPS[tutorialStep].title}</p>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">{TUTORIAL_STEPS[tutorialStep].body}</p>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Scatter plot */}
        <div className={`lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${getHighlight('scatter')}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Latent Space (z₁, z₂)</h3>
            <button onClick={() => setShowManifold(!showManifold)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                showManifold ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {showManifold ? 'Hide Manifold' : 'Show Manifold'}
            </button>
          </div>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
            <rect width={SVG_W} height={SVG_H} fill="rgb(243 244 246)" rx={8} className="dark:fill-gray-900" />

            {/* Manifold heatmap */}
            {showManifold && manifoldGrid.map((row, r) =>
              row.map((cell, c) => {
                const cellW = SVG_W / MANIFOLD_RES;
                const cellH = SVG_H / MANIFOLD_RES;
                const opacity = 0.55;
                return (
                  <rect key={`m-${r}-${c}`} x={c * cellW} y={r * cellH} width={cellW + 0.5} height={cellH + 0.5}
                    fill={CLASS_COLORS[cell.classIdx]} opacity={opacity} />
                );
              })
            )}

            {/* Grid lines */}
            {[0].map(v => (
              <g key={v}>
                <line x1={toSvgX(v)} y1={0} x2={toSvgX(v)} y2={SVG_H} stroke="#D1D5DB" strokeWidth={1} />
                <line x1={0} y1={toSvgY(v)} x2={SVG_W} y2={toSvgY(v)} stroke="#D1D5DB" strokeWidth={1} />
              </g>
            ))}

            {/* Axes */}
            <text x={SVG_W - 15} y={toSvgY(0) - 5} fontSize={10} fill="#9CA3AF">z₁</text>
            <text x={toSvgX(0) + 5} y={15} fontSize={10} fill="#9CA3AF">z₂</text>

            {/* Points */}
            {latentPoints.map((p, i) => {
              const isSelected = selectedPoint === i;
              return (
                <g key={i} onClick={() => setSelectedPoint(i)} style={{ cursor: 'pointer' }}>
                  <circle cx={toSvgX(p.x)} cy={toSvgY(p.y)}
                    r={isSelected ? 9 : 5}
                    fill={CLASS_COLORS[p.label]}
                    stroke={isSelected ? '#6366F1' : 'white'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={0.85} />
                </g>
              );
            })}

            {/* Interpolation line */}
            {interpolation && (
              <g>
                <line x1={toSvgX(interpolation[0].x)} y1={toSvgY(interpolation[0].y)}
                  x2={toSvgX(interpolation[1].x)} y2={toSvgY(interpolation[1].y)}
                  stroke="#6366F1" strokeWidth={2} strokeDasharray="4,4" />
                {interpPoint && (
                  <circle cx={toSvgX(interpPoint.x)} cy={toSvgY(interpPoint.y)} r={8}
                    fill="#6366F1" stroke="white" strokeWidth={2} />
                )}
                <circle cx={toSvgX(interpolation[0].x)} cy={toSvgY(interpolation[0].y)} r={6}
                  fill={CLASS_COLORS[interpolation[0].label]} stroke="#6366F1" strokeWidth={2} />
                <circle cx={toSvgX(interpolation[1].x)} cy={toSvgY(interpolation[1].y)} r={6}
                  fill={CLASS_COLORS[interpolation[1].label]} stroke="#6366F1" strokeWidth={2} />
              </g>
            )}

            {/* Legend */}
            {CLASS_COLORS.map((c, i) => (
              <g key={i}>
                <circle cx={12 + i * 28} cy={SVG_H - 12} r={4} fill={c} />
                <text x={20 + i * 28} y={SVG_H - 8} fontSize={8} fill="#6B7280">{CLASS_NAMES[i]}</text>
              </g>
            ))}
          </svg>

          {/* Points info */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
            <span>{latentPoints.length} points</span>
            {selectedPoint !== null && selectedPoint < latentPoints.length && (
              <span>Selected: ({latentPoints[selectedPoint].x.toFixed(2)}, {latentPoints[selectedPoint].y.toFixed(2)}) → {CLASS_NAMES[latentPoints[selectedPoint].label]}</span>
            )}
          </div>
        </div>

        {/* Right: Controls + Preview */}
        <div className="lg:col-span-2 space-y-3">
          {/* Decoded preview */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${getHighlight('preview')}`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Decoded Output</h3>
            {selectedPixels ? (
              <div className="flex items-center gap-4">
                <PixelGrid grid={selectedPixels} size={80} highlight />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p><span className="font-semibold text-gray-800 dark:text-gray-200">Class:</span> {CLASS_NAMES[latentPoints[selectedPoint!].label]}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-200">Position:</span> ({latentPoints[selectedPoint!].x.toFixed(3)}, {latentPoints[selectedPoint!].y.toFixed(3)})</p>
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Click other points to decode them</p>
                </div>
              </div>
            ) : (
              <div className="h-[88px] flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                Click a point on the scatter plot to decode
              </div>
            )}
          </div>

          {/* Interpolation filmstrip */}
          {filmstrip.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Interpolation Filmstrip</h3>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {filmstrip.map((f, i) => (
                  <div key={i} className="flex flex-col items-center shrink-0">
                    <PixelGrid grid={f.pixels} size={36} />
                    <span className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5">t={f.t.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sampling controls */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${getHighlight('sampling')}`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sampling Controls</h3>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Reparameterization σ</span><strong>{reparamStd.toFixed(2)}</strong>
                </label>
                <input type="range" min="0.05" max="1" step="0.05" value={reparamStd}
                  onChange={(e) => setReparamStd(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1" />
              </div>
              {interpolation && (
                <div>
                  <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>Interpolation t</span><strong>{interpT.toFixed(2)}</strong>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={interpT}
                    onChange={(e) => setInterpT(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-1" />
                </div>
              )}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button onClick={addRandomPoint} className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-colors cursor-pointer">Sample</button>
              <button onClick={startInterpolation} className="px-2.5 py-1 bg-purple-600 text-white rounded text-[11px] font-medium hover:bg-purple-700 transition-colors cursor-pointer">Interpolate</button>
              <button onClick={resetAll} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">Reset</button>
            </div>
          </div>

          {/* Sampling mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sampling Mode</h3>
            <div className="flex gap-1 mb-2">
              {(['encoder', 'prior'] as const).map(mode => (
                <button key={mode} onClick={() => setSamplingMode(mode)}
                  className={`flex-1 px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    samplingMode === mode ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                  {mode === 'encoder' ? 'From Encoder' : 'From Prior N(0,I)'}
                </button>
              ))}
            </div>
            <button onClick={generateSamples} className="w-full px-2.5 py-1.5 bg-emerald-600 text-white rounded text-[11px] font-medium hover:bg-emerald-700 transition-colors cursor-pointer mb-2">
              Generate 10 Samples
            </button>
            {generatedSamples.encoder.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-medium">From Encoder:</p>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {generatedSamples.encoder.map((g, i) => <PixelGrid key={`e-${i}`} grid={g} size={28} />)}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 mt-2 font-medium">From Prior N(0,I):</p>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {generatedSamples.prior.map((g, i) => <PixelGrid key={`p-${i}`} grid={g} size={28} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${getHighlight('architecture')}`}>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">VAE Architecture</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {/* Input */}
          <div className="shrink-0 w-[72px] h-[52px] rounded-lg border-2 border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Input</span>
            <span className="text-[8px] text-indigo-500 dark:text-indigo-400">8x8 px</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-lg shrink-0">&#x2192;</span>
          {/* Encoder */}
          <div className="shrink-0 w-[88px] h-[52px] rounded-lg border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Encoder</span>
            <span className="text-[8px] text-blue-500 dark:text-blue-400">f(x) &#x2192; &#x03BC;, &#x03C3;</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-lg shrink-0">&#x2192;</span>
          {/* Reparameterize */}
          <div className="shrink-0 w-[90px] h-[52px] rounded-lg border-2 border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 flex flex-col items-center justify-center relative">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Reparam.</span>
            <span className="text-[8px] text-purple-500 dark:text-purple-400">z = &#x03BC; + &#x03C3;&#x2297;&#x03B5;</span>
            {/* ε input from above */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full border border-dashed border-pink-400 dark:border-pink-500 bg-pink-50 dark:bg-pink-900/30">
              <span className="text-[8px] text-pink-600 dark:text-pink-400 font-medium">&#x03B5; ~ N(0,I)</span>
            </div>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-lg shrink-0">&#x2192;</span>
          {/* z */}
          <div className="shrink-0 w-[36px] h-[52px] rounded-lg border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-300">z</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-lg shrink-0">&#x2192;</span>
          {/* Decoder */}
          <div className="shrink-0 w-[88px] h-[52px] rounded-lg border-2 border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Decoder</span>
            <span className="text-[8px] text-blue-500 dark:text-blue-400">g(z) &#x2192; x&#x0302;</span>
          </div>
          <span className="text-gray-400 dark:text-gray-500 text-lg shrink-0">&#x2192;</span>
          {/* Output */}
          <div className="shrink-0 w-[72px] h-[52px] rounded-lg border-2 border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Output</span>
            <span className="text-[8px] text-indigo-500 dark:text-indigo-400">x&#x0302; (8x8)</span>
          </div>
        </div>
      </div>

      {/* Training controls + loss chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${getHighlight('beta')}`}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Training Simulation</h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Learning Rate</span><strong>{training.lr}</strong>
              </label>
              <input type="range" min="0.01" max="0.5" step="0.01" value={training.lr}
                onChange={(e) => setTraining(prev => ({ ...prev, lr: parseFloat(e.target.value) }))}
                className="w-full accent-indigo-500 h-1" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span>β (KL Weight)</span><strong>{training.klWeight.toFixed(1)}</strong>
              </label>
              <input type="range" min="0" max="5" step="0.1" value={training.klWeight}
                onChange={(e) => setTraining(prev => ({ ...prev, klWeight: parseFloat(e.target.value) }))}
                className="w-full accent-amber-500 h-1" />
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                {training.klWeight < 0.5 ? 'Low — better recon, possible holes' : training.klWeight <= 1.5 ? 'Standard VAE — balanced' : 'High — smoother space, blurrier'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Batch Size</label>
              <div className="flex gap-1">
                {[8, 16, 32, 64].map(bs => (
                  <button key={bs} onClick={() => setTraining(prev => ({ ...prev, batchSize: bs }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      training.batchSize === bs ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>{bs}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Max Epochs</label>
              <div className="flex gap-1">
                {[50, 100, 200].map(ep => (
                  <button key={ep} onClick={() => setTraining(prev => ({ ...prev, maxEpochs: ep }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      training.maxEpochs === ep ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>{ep}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {!training.isTraining ? (
              <button onClick={startTraining} className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 active:scale-95 transition-all cursor-pointer">
                Train
              </button>
            ) : (
              <button onClick={pauseTraining} className="flex-1 px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 active:scale-95 transition-all cursor-pointer">
                Pause
              </button>
            )}
            <button onClick={() => { setTraining(prev => ({ ...prev, isTraining: false, epoch: 0, losses: { recon: [], kl: [] } })); setLatentPoints(prev => prev.map(p => ({ ...p, x: p.x + gaussianRandom() * 0.5, y: p.y + gaussianRandom() * 0.5 }))); }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer">
              Scramble
            </button>
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              <span>Epoch {training.epoch}/{training.maxEpochs}</span>
              <span>{training.epoch > 0 ? ((training.epoch / training.maxEpochs) * 100).toFixed(0) : '0'}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${training.maxEpochs > 0 ? (training.epoch / training.maxEpochs) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Loss chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Loss Curves</h3>
          <LossChart recon={training.losses.recon} kl={training.losses.kl} />
          {training.losses.recon.length > 0 && (
            <div className="flex gap-4 mt-2 text-[10px]">
              <span className="text-blue-600 dark:text-blue-400">Recon: {formatLoss(training.losses.recon[training.losses.recon.length - 1])}</span>
              <span className="text-red-500 dark:text-red-400">KL: {formatLoss(training.losses.kl[training.losses.kl.length - 1])}</span>
            </div>
          )}
        </div>
      </div>

      {/* Educational boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1 text-sm">How VAEs Work</h4>
          <div className="space-y-1.5 text-[11px] text-blue-700 dark:text-blue-400">
            <p><strong className="text-blue-800 dark:text-blue-300">Encoder:</strong> Maps input x to a Gaussian distribution N(μ, σ²) in latent space — not a single point, but a region.</p>
            <p><strong className="text-blue-800 dark:text-blue-300">Reparameterization:</strong> Samples z = μ + σ·ε where ε ~ N(0,1). This lets gradients flow through the sampling step.</p>
            <p><strong className="text-blue-800 dark:text-blue-300">Decoder:</strong> Reconstructs x̂ = g(z) from the latent code. The reconstruction loss pushes outputs toward inputs.</p>
            <p><strong className="text-blue-800 dark:text-blue-300">KL Divergence:</strong> Forces the latent distribution toward N(0,I), preventing "holes" and enabling generation from the prior.</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-1 text-sm">Key Concepts</h4>
          <div className="space-y-1.5 text-[11px] text-amber-700 dark:text-amber-400">
            <p><strong className="text-amber-800 dark:text-amber-300">Latent Space:</strong> A compressed "idea space" where similar concepts cluster. Moving smoothly here creates smooth output transitions.</p>
            <p><strong className="text-amber-800 dark:text-amber-300">Generation:</strong> Sample any point from N(0,I) and decode it — the VAE creates a valid output it has never seen before.</p>
            <p><strong className="text-amber-800 dark:text-amber-300">Interpolation:</strong> z₁ → z₂ produces a smooth morph. The decoder fills in plausible intermediate states.</p>
            <p><strong className="text-amber-800 dark:text-amber-300">β-VAE:</strong> Higher β forces tighter clusters and more disentangled representations but may blur details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
