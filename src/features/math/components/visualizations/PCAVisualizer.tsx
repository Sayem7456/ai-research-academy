/**
 * PCAVisualizer - Interactive Principal Component Analysis visualizer
 * Phase 10: Mathematics Visualizations
 *
 * Shows 2D data with principal axes, explained variance, and projections.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

const SIZE = 340;

function generateCluster(cx: number, cy: number, sx: number, sy: number, angle: number, n: number): [number, number][] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller (guard u1 against 0 to avoid log(0) = -Infinity)
    const u1 = Math.random() || Number.EPSILON;
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const lx = z0 * sx;
    const ly = z1 * sy;
    pts.push([cx + lx * cos - ly * sin, cy + lx * sin + ly * cos]);
  }
  return pts;
}

function computePCA(points: [number, number][]) {
  const n = points.length;
  if (n === 0) return { mean: [0, 0] as [number, number], components: [[1, 0], [0, 1]] as [[number, number], [number, number]], variances: [1, 1], explainedVar: [0.5, 0.5] };

  const mean: [number, number] = [
    points.reduce((s, p) => s + p[0], 0) / n,
    points.reduce((s, p) => s + p[1], 0) / n,
  ];

  // Covariance matrix
  let cxx = 0, cxy = 0, cyy = 0;
  for (const p of points) {
    const dx = p[0] - mean[0];
    const dy = p[1] - mean[1];
    cxx += dx * dx;
    cxy += dx * dy;
    cyy += dy * dy;
  }
  cxx /= (n - 1);
  cxy /= (n - 1);
  cyy /= (n - 1);

  // Eigenvalues of 2x2 symmetric matrix
  const trace = cxx + cyy;
  const det = cxx * cyy - cxy * cxy;
  const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const l1 = trace / 2 + disc;
  const l2 = trace / 2 - disc;
  const totalVar = l1 + l2;

  // Eigenvectors
  let v1: [number, number] = [1, 0];
  let v2: [number, number] = [0, 1];
  if (Math.abs(cxy) > 1e-10) {
    v1 = [cxy, l1 - cxx];
    v2 = [cxy, l2 - cxx];
  } else {
    v1 = cxx >= cyy ? [1, 0] : [0, 1];
    v2 = cxx >= cyy ? [0, 1] : [1, 0];
  }
  const n1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
  const n2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
  if (n1 > 1e-10) v1 = [v1[0] / n1, v1[1] / n1];
  if (n2 > 1e-10) v2 = [v2[0] / n2, v2[1] / n2];

  return {
    mean,
    components: [v1, v2] as [[number, number], [number, number]],
    variances: [l1, l2],
    explainedVar: totalVar > 0 ? [l1 / totalVar, l2 / totalVar] : [0.5, 0.5],
  };
}

export default function PCAVisualizer() {
  const [spread, setSpread] = useState(3);
  const [angle, setAngle] = useState(30);
  const [nPoints, setNPoints] = useState(80);
  const [showProjections, setShowProjections] = useState(false);
  const [seed, setSeed] = useState(0);

  const points = useMemo(() => {
    // Reset random seed by depending on seed state
    void seed;
    return generateCluster(0, 0, spread, spread * 0.3, (angle * Math.PI) / 180, nPoints);
  }, [spread, angle, nPoints, seed]);

  const pca = useMemo(() => computePCA(points), [points]);

  // Determine scale
  const maxExtent = useMemo(() => {
    let max = 1;
    for (const p of points) {
      max = Math.max(max, Math.abs(p[0]), Math.abs(p[1]));
    }
    return max * 1.3;
  }, [points]);

  const scale = (SIZE / 2) / maxExtent;
  const center = SIZE / 2;

  const toSvg = useCallback((x: number, y: number): [number, number] => {
    return [center + x * scale, center - y * scale];
  }, [center, scale]);

  const regenerate = () => setSeed((s) => s + 1);

  // Compute projections onto PC1
  const projections = useMemo(() => {
    if (!showProjections) return [];
    const v = pca.components[0];
    return points.map((p) => {
      const dx = p[0] - pca.mean[0];
      const dy = p[1] - pca.mean[1];
      const proj = dx * v[0] + dy * v[1];
      return {
        point: p,
        projected: [pca.mean[0] + proj * v[0], pca.mean[1] + proj * v[1]] as [number, number],
      };
    });
  }, [points, pca, showProjections]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        PCA Visualizer
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Explore how PCA finds the directions of maximum variance in 2D data. The red arrow is PC1 (most variance), green is PC2.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <svg width={SIZE} height={SIZE} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
            {/* Axes */}
            <line x1={0} y1={center} x2={SIZE} y2={center} stroke="#D1D5DB" strokeWidth="0.5" />
            <line x1={center} y1={0} x2={center} y2={SIZE} stroke="#D1D5DB" strokeWidth="0.5" />

            {/* Data points */}
            {points.map((p, i) => {
              const [sx, sy] = toSvg(p[0], p[1]);
              return (
                <motion.circle
                  key={`${seed}-${i}`}
                  cx={sx} cy={sy} r="3"
                  fill="#6366F1" opacity={0.6}
                  initial={{ r: 0 }}
                  animate={{ r: 3 }}
                  transition={{ delay: i * 0.005 }}
                />
              );
            })}

            {/* Mean point */}
            <circle cx={toSvg(...pca.mean)[0]} cy={toSvg(...pca.mean)[1]} r="5" fill="#F59E0B" stroke="white" strokeWidth="2" />

            {/* PC1 */}
            {(() => {
              const len = Math.sqrt(pca.variances[0]) * 2;
              const v = pca.components[0];
              const start = toSvg(pca.mean[0] - v[0] * len, pca.mean[1] - v[1] * len);
              const end = toSvg(pca.mean[0] + v[0] * len, pca.mean[1] + v[1] * len);
              return <line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke="#EF4444" strokeWidth="2.5" />;
            })()}

            {/* PC2 */}
            {(() => {
              const len = Math.sqrt(pca.variances[1]) * 2;
              const v = pca.components[1];
              const start = toSvg(pca.mean[0] - v[0] * len, pca.mean[1] - v[1] * len);
              const end = toSvg(pca.mean[0] + v[0] * len, pca.mean[1] + v[1] * len);
              return <line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]} stroke="#22C55E" strokeWidth="2.5" />;
            })()}

            {/* Projections */}
            {projections.map((proj, i) => {
              const [px, py] = toSvg(...proj.point);
              const [qx, qy] = toSvg(...proj.projected);
              return (
                <line key={i} x1={px} y1={py} x2={qx} y2={qy} stroke="#F59E0B" strokeWidth="0.5" opacity={0.5} />
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          {/* Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Data spread (σ₁):</span>
                <strong>{spread.toFixed(1)}</strong>
              </label>
              <input type="range" min="0.5" max="5" step="0.1" value={spread}
                onChange={(e) => setSpread(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Rotation angle:</span>
                <strong>{angle}°</strong>
              </label>
              <input type="range" min="0" max="180" step="1" value={angle}
                onChange={(e) => setAngle(parseInt(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Number of points:</span>
                <strong>{nPoints}</strong>
              </label>
              <input type="range" min="20" max="200" step="10" value={nPoints}
                onChange={(e) => setNPoints(parseInt(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={regenerate}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
                Regenerate Data
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={showProjections} onChange={() => setShowProjections(!showProjections)} className="rounded" />
                Show projections onto PC1
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <span className="text-red-700 dark:text-red-400 font-medium text-sm">PC1</span>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{(pca.explainedVar[0] * 100).toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Variance explained</p>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                [{pca.components[0][0].toFixed(2)}, {pca.components[0][1].toFixed(2)}]
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <span className="text-green-700 dark:text-green-400 font-medium text-sm">PC2</span>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{(pca.explainedVar[1] * 100).toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Variance explained</p>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                [{pca.components[1][0].toFixed(2)}, {pca.components[1][1].toFixed(2)}]
              </p>
            </div>
          </div>

          {/* Explained variance bar */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Explained Variance</div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-red-500" style={{ width: `${pca.explainedVar[0] * 100}%` }} />
              <div className="bg-green-500" style={{ width: `${pca.explainedVar[1] * 100}%` }} />
            </div>
          </div>

          {/* Educational */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How PCA Works</h4>
            <p className="text-blue-800 dark:text-blue-300">
              PCA finds orthogonal directions (principal components) that capture the most variance in data.
              PC1 points in the direction of maximum spread. PC2 is perpendicular and captures remaining variance.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              • Yellow dot = data mean. Arrow lengths = 2σ along each PC.
              <br />• Enable projections to see how data points project onto PC1.
              <br />• If PC1 explains &gt;95% variance, projecting to 1D loses very little information.
            </p>
          </div>

          {/* AI/ML Analogy */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
            <p className="text-amber-800 dark:text-amber-300 text-xs mb-3">
              PCA is like finding the best camera angle to photograph your data — it finds the viewpoint that captures the most detail.
            </p>
            <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Dimensionality Reduction</span>
                <span>→ Like compressing a high-res photo. You lose some detail but keep the important parts. 100 features → 10 PCs.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Explained Variance</span>
                <span>→ Like a quality meter. 95% means your compressed version captures 95% of the original information.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Noise Removal</span>
                <span>→ Low-variance PCs are often noise. Discarding them actually improves your model by removing distractions.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Visualization</span>
                <span>→ Can&apos;t plot 50D data. PCA projects it to 2D/3D so you can see clusters and patterns with your eyes.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Feature Engineering</span>
                <span>→ PCs become new features. Linear combinations of originals that capture maximum information in fewer dimensions.</span>
              </div>
            </div>
            <p className="text-amber-600 dark:text-amber-500 text-xs mt-3 font-medium">
              PCA is used in image compression, gene expression analysis, stock market modeling, and as a preprocessing step before training any ML model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
