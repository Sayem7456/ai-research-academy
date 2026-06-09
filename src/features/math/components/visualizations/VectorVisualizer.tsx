/**
 * VectorVisualizer - Interactive 2D vector operations viewer
 * Phase 10: Mathematics Visualizations
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const SIZE = 320;
const SCALE = 30;
const CENTER = SIZE / 2;

type Vec2 = [number, number];

function toSvg(x: number, y: number): [number, number] {
  return [CENTER + x * SCALE, CENTER - y * SCALE];
}

function vecAdd(a: Vec2, b: Vec2): Vec2 { return [a[0] + b[0], a[1] + b[1]]; }
function vecScale(v: Vec2, s: number): Vec2 { return [v[0] * s, v[1] * s]; }
function vecDot(a: Vec2, b: Vec2): number { return a[0] * b[0] + a[1] * b[1]; }
function vecLen(v: Vec2): number { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
function vecAngle(a: Vec2, b: Vec2): number {
  const cos = vecDot(a, b) / (vecLen(a) * vecLen(b));
  return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
}

function ArrowLine({ from, to, color, label, dashed = false }: {
  from: Vec2; to: Vec2; color: string; label?: string; dashed?: boolean;
}) {
  const [x1, y1] = toSvg(...from);
  const [x2, y2] = toSvg(...to);
  return (
    <g>
      <motion.line
        animate={{ x1, y1, x2, y2 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={dashed ? '6,3' : undefined}
        markerEnd={`url(#arrow-${color.replace('#', '')})`}
      />
      {label && (
        <text x={x2 + 6} y={y2 - 6} fill={color} fontSize="12" fontWeight="bold">{label}</text>
      )}
    </g>
  );
}

export default function VectorVisualizer() {
  const [vecA, setVecA] = useState<Vec2>([3, 1]);
  const [vecB, setVecB] = useState<Vec2>([1, 3]);
  const [operation, setOperation] = useState<'add' | 'scale' | 'dot'>('add');
  const [scalar, setScalar] = useState(2);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>, which: 'a' | 'b') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) - CENTER) / SCALE * 2) / 2;
    const y = Math.round((CENTER - (e.clientY - rect.top)) / SCALE * 2) / 2;
    if (which === 'a') setVecA([x, y]);
    else setVecB([x, y]);
  }, []);

  const sum = vecAdd(vecA, vecB);
  const scaled = vecScale(vecA, scalar);
  const dot = vecDot(vecA, vecB);
  const angle = vecAngle(vecA, vecB);
  const lenA = vecLen(vecA);
  const lenB = vecLen(vecB);

  // Projection of A onto B
  const projLen = dot / vecLen(vecB);
  const proj = vecScale(vecB, projLen / vecLen(vecB));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Vector Operations Visualizer
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Click on the canvas to position vectors. Explore addition, scaling, and dot product.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <svg
            width={SIZE} height={SIZE}
            className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 cursor-crosshair"
            onClick={(e) => handleCanvasClick(e, 'a')}
            onContextMenu={(e) => { e.preventDefault(); handleCanvasClick(e, 'b'); }}
          >
            {/* Axes */}
            <line x1={0} y1={CENTER} x2={SIZE} y2={CENTER} stroke="#6B7280" strokeWidth="1" />
            <line x1={CENTER} y1={0} x2={CENTER} y2={SIZE} stroke="#6B7280" strokeWidth="1" />
            {/* Grid ticks */}
            {Array.from({ length: 11 }, (_, i) => i - 5).filter(i => i !== 0).map(i => (
              <g key={i}>
                <line x1={toSvg(i, 0)[0]} y1={CENTER - 3} x2={toSvg(i, 0)[0]} y2={CENTER + 3} stroke="#9CA3AF" strokeWidth="0.5" />
                <line x1={CENTER - 3} y1={toSvg(0, i)[1]} x2={CENTER + 3} y2={toSvg(0, i)[1]} stroke="#9CA3AF" strokeWidth="0.5" />
              </g>
            ))}

            <defs>
              <marker id="arrow-EF4444" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" /></marker>
              <marker id="arrow-3B82F6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" /></marker>
              <marker id="arrow-8B5CF6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" /></marker>
              <marker id="arrow-22C55E" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#22C55E" /></marker>
              <marker id="arrow-F59E0B" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" /></marker>
            </defs>

            <ArrowLine from={[0, 0]} to={vecA} color="#EF4444" label="a" />
            <ArrowLine from={[0, 0]} to={vecB} color="#3B82F6" label="b" />

            {operation === 'add' && (
              <>
                <ArrowLine from={vecA} to={sum} color="#3B82F6" dashed />
                <ArrowLine from={[0, 0]} to={sum} color="#8B5CF6" label="a+b" />
              </>
            )}

            {operation === 'scale' && (
              <ArrowLine from={[0, 0]} to={scaled} color="#22C55E" label={`${scalar}a`} />
            )}

            {operation === 'dot' && (
              <>
                {/* Angle arc */}
                <motion.path
                  d={`M ${toSvg(0.8 * vecA[0] / lenA, 0.8 * vecA[1] / lenA)[0]} ${toSvg(0.8 * vecA[0] / lenA, 0.8 * vecA[1] / lenA)[1]}`}
                  stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity={0.6}
                />
                {/* Projection line */}
                <ArrowLine from={[0, 0]} to={proj} color="#F59E0B" label="proj" />
                <line
                  x1={toSvg(...vecA)[0]} y1={toSvg(...vecA)[1]}
                  x2={toSvg(...proj)[0]} y2={toSvg(...proj)[1]}
                  stroke="#F59E0B" strokeWidth="1" strokeDasharray="3,3"
                />
              </>
            )}
          </svg>
          <p className="text-xs text-gray-500 mt-1">Left-click: move <strong className="text-red-500">a</strong> | Right-click: move <strong className="text-blue-500">b</strong></p>
        </div>

        <div className="space-y-4">
          {/* Operation Tabs */}
          <div className="flex gap-2">
            {(['add', 'scale', 'dot'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setOperation(op)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  operation === op
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {op === 'add' ? 'Addition' : op === 'scale' ? 'Scaling' : 'Dot Product'}
              </button>
            ))}
          </div>

          {/* Vector Values */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <span className="text-red-700 dark:text-red-400 font-medium">Vector a</span>
              <p className="font-mono text-gray-900 dark:text-gray-100">[{vecA[0]}, {vecA[1]}]</p>
              <p className="text-xs text-gray-500">|a| = {lenA.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <span className="text-blue-700 dark:text-blue-400 font-medium">Vector b</span>
              <p className="font-mono text-gray-900 dark:text-gray-100">[{vecB[0]}, {vecB[1]}]</p>
              <p className="text-xs text-gray-500">|b| = {lenB.toFixed(2)}</p>
            </div>
          </div>

          {/* Scalar slider for scale mode */}
          {operation === 'scale' && (
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Scalar: <strong>{scalar.toFixed(1)}</strong>
              </label>
              <input
                type="range" min="-3" max="3" step="0.1"
                value={scalar}
                onChange={(e) => setScalar(parseFloat(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>
          )}

          {/* Result */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-sm">
            {operation === 'add' && (
              <>
                <h4 className="font-semibold text-purple-900 dark:text-purple-300">a + b</h4>
                <p className="font-mono">[{vecA[0]} + {vecB[0]}, {vecA[1]} + {vecB[1]}] = <strong>[{sum[0]}, {sum[1]}]</strong></p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Vector addition places b&apos;s tail at a&apos;s head (parallelogram rule). The result is the diagonal.</p>
              </>
            )}
            {operation === 'scale' && (
              <>
                <h4 className="font-semibold text-purple-900 dark:text-purple-300">{scalar.toFixed(1)} × a</h4>
                <p className="font-mono">{scalar.toFixed(1)} × [{vecA[0]}, {vecA[1]}] = <strong>[{scaled[0].toFixed(1)}, {scaled[1].toFixed(1)}]</strong></p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Scalar multiplication stretches (|s|&gt;1) or shrinks (|s|&lt;1) the vector. Negative scalars flip direction.</p>
              </>
            )}
            {operation === 'dot' && (
              <>
                <h4 className="font-semibold text-purple-900 dark:text-purple-300">a · b</h4>
                <p className="font-mono">{vecA[0]}×{vecB[0]} + {vecA[1]}×{vecB[1]} = <strong>{dot.toFixed(2)}</strong></p>
                <p className="mt-1">Angle: {angle.toFixed(1)}°</p>
                <p className="mt-1">= |a||b|cos(θ) = {lenA.toFixed(2)} × {lenB.toFixed(2)} × {Math.cos(angle * Math.PI / 180).toFixed(3)}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">The dot product measures how much two vectors point in the same direction. Zero means perpendicular (orthogonal).</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
