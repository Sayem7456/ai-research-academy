/**
 * EigenvectorVisualizer - Interactive eigenvector/eigenvalue explorer
 * Phase 10: Mathematics Visualizations
 *
 * Shows how a 2x2 matrix transforms the unit circle into an ellipse,
 * highlighting the eigenvectors (directions that don't rotate).
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const SIZE = 340;
const SCALE = 50;
const CENTER = SIZE / 2;

function toSvg(x: number, y: number): [number, number] {
  return [CENTER + x * SCALE, CENTER - y * SCALE];
}

interface Matrix2x2 { a: number; b: number; c: number; d: number; }

function applyM(m: Matrix2x2, x: number, y: number): [number, number] {
  return [m.a * x + m.b * y, m.c * x + m.d * y];
}

function computeEigen(m: Matrix2x2): { values: [number, number]; vectors: [[number, number], [number, number]] | null } {
  const { a, b, c, d } = m;
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  if (disc < 0) {
    return { values: [NaN, NaN], vectors: null };
  }

  const l1 = (trace + Math.sqrt(disc)) / 2;
  const l2 = (trace - Math.sqrt(disc)) / 2;

  let v1: [number, number] = [1, 0];
  let v2: [number, number] = [0, 1];

  if (Math.abs(b) > 1e-10) {
    v1 = [b, l1 - a];
    v2 = [b, l2 - a];
  } else if (Math.abs(c) > 1e-10) {
    v1 = [l1 - d, c];
    v2 = [l2 - d, c];
  } else {
    // Diagonal (or nearly diagonal) matrix: eigenvectors are [1,0] and [0,1]
    // Assign so v1 corresponds to l1 (larger eigenvalue) and v2 to l2
    if (Math.abs(a - l1) < Math.abs(d - l1)) {
      v1 = [1, 0]; v2 = [0, 1]; // a is closer to l1
    } else {
      v1 = [0, 1]; v2 = [1, 0]; // d is closer to l1
    }
  }

  // Normalize
  const norm1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
  const norm2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
  if (norm1 > 1e-10) v1 = [v1[0] / norm1, v1[1] / norm1];
  if (norm2 > 1e-10) v2 = [v2[0] / norm2, v2[1] / norm2];

  return { values: [l1, l2], vectors: [v1, v2] };
}

export default function EigenvectorVisualizer() {
  const [matrix, setMatrix] = useState<Matrix2x2>({ a: 2, b: 1, c: 1, d: 2 });
  const [animT, setAnimT] = useState(1);

  const eigen = useMemo(() => computeEigen(matrix), [matrix]);
  const hasRealEigen = eigen.vectors !== null && !isNaN(eigen.values[0]);

  // Unit circle points
  const circlePoints = useMemo(() => {
    const pts: [number, number][] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const theta = (2 * Math.PI * i) / N;
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      const [tx, ty] = applyM(matrix, x, y);
      const ix = x + animT * (tx - x);
      const iy = y + animT * (ty - y);
      pts.push([ix, iy]);
    }
    return pts;
  }, [matrix, animT]);

  const circlePath = useMemo(() => {
    return circlePoints.map((p, i) => {
      const [sx, sy] = toSvg(p[0], p[1]);
      return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`;
    }).join(' ') + ' Z';
  }, [circlePoints]);

  const updateEntry = (key: keyof Matrix2x2, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) setMatrix((prev) => ({ ...prev, [key]: num }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Eigenvector Visualizer
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Watch the unit circle transform into an ellipse. Eigenvectors are the directions that only stretch — they don&apos;t rotate.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <svg width={SIZE} height={SIZE} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
            {/* Axes */}
            <line x1={0} y1={CENTER} x2={SIZE} y2={CENTER} stroke="#6B7280" strokeWidth="0.5" />
            <line x1={CENTER} y1={0} x2={CENTER} y2={SIZE} stroke="#6B7280" strokeWidth="0.5" />

            {/* Unit circle (original) */}
            <circle cx={CENTER} cy={CENTER} r={SCALE} fill="none" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4,4" />

            {/* Transformed shape */}
            <motion.path
              d={circlePath}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3B82F6"
              strokeWidth="2"
              animate={{ d: circlePath }}
              transition={{ duration: 0.3 }}
            />

            {/* Eigenvectors */}
            {hasRealEigen && eigen.vectors && eigen.vectors.map((v, i) => {
              const lam = eigen.values[i];
              const color = i === 0 ? '#EF4444' : '#22C55E';
              const scaledEnd: [number, number] = [v[0] * lam * animT + v[0] * (1 - animT), v[1] * lam * animT + v[1] * (1 - animT)];
              const [sx, sy] = toSvg(...scaledEnd);
              return (
                <g key={i}>
                  <motion.line
                    animate={{
                      x1: CENTER, y1: CENTER,
                      x2: sx, y2: sy,
                    }}
                    transition={{ duration: 0.3 }}
                    stroke={color} strokeWidth="3"
                  />
                  <motion.circle
                    animate={{ cx: sx, cy: sy }}
                    transition={{ duration: 0.3 }}
                    r="5" fill={color}
                  />
                  <text x={sx + 8} y={sy - 8} fill={color} fontSize="12" fontWeight="bold">
                    v{i + 1} (λ={lam.toFixed(2)})
                  </text>
                </g>
              );
            })}

            {/* Label at center */}
            <text x={CENTER + 4} y={CENTER - 4} fill="#6B7280" fontSize="10">O</text>
          </svg>

          {/* Animation slider */}
          <div className="mt-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Transform: <strong>{(animT * 100).toFixed(0)}%</strong>
            </label>
            <input
              type="range" min="0" max="1" step="0.01"
              value={animT}
              onChange={(e) => setAnimT(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Matrix Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Matrix:</label>
            <div className="grid grid-cols-2 gap-2 max-w-[180px]">
              {(['a', 'b', 'c', 'd'] as (keyof Matrix2x2)[]).map((key) => (
                <input
                  key={key}
                  type="number" step="0.5"
                  value={matrix[key]}
                  onChange={(e) => updateEntry(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center font-mono"
                />
              ))}
            </div>
          </div>

          {/* Eigenvalues */}
          {hasRealEigen ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <span className="text-red-700 dark:text-red-400 font-medium text-sm">λ₁</span>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{eigen.values[0].toFixed(3)}</p>
                  <p className="text-xs text-gray-500">Scale factor for v₁</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <span className="text-green-700 dark:text-green-400 font-medium text-sm">λ₂</span>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{eigen.values[1].toFixed(3)}</p>
                  <p className="text-xs text-gray-500">Scale factor for v₂</p>
                </div>
              </div>

              {eigen.vectors && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p>v₁ = [{eigen.vectors[0][0].toFixed(3)}, {eigen.vectors[0][1].toFixed(3)}]</p>
                  <p>v₂ = [{eigen.vectors[1][0].toFixed(3)}, {eigen.vectors[1][1].toFixed(3)}]</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">Complex eigenvalues</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                This matrix has complex eigenvalues (discriminant &lt; 0), meaning it involves rotation.
                Real eigenvectors only exist when the matrix doesn&apos;t rotate vectors.
              </p>
            </div>
          )}

          {/* Educational Explanation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Key Insight</h4>
            <p className="text-blue-800 dark:text-blue-300">
              The unit circle transforms into an ellipse. <strong>Eigenvectors</strong> are the directions
              that only stretch (by factor λ) without rotating. For <strong>symmetric</strong> matrices
              (where A = Aᵀ), these align with the ellipse&apos;s semi-axes.
            </p>
            <ul className="mt-2 text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>|λ| &gt; 1: stretches in that direction</li>
              <li>|λ| &lt; 1: compresses in that direction</li>
              <li>λ &lt; 0: flips direction</li>
              <li>λ = 0: collapses to lower dimension</li>
              <li>Complex λ: matrix involves rotation (no real eigenvectors)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
