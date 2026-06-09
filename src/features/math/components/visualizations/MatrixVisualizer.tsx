/**
 * MatrixVisualizer - Interactive 2D matrix transformation viewer
 * Phase 10: Mathematics Visualizations
 *
 * Shows how a 2x2 matrix transforms the plane, basis vectors, and a test vector.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const SIZE = 300;
const SCALE = 40; // pixels per unit
const CENTER = SIZE / 2;

function toSvg(x: number, y: number): [number, number] {
  return [CENTER + x * SCALE, CENTER - y * SCALE];
}

interface Matrix {
  a: number; b: number;
  c: number; d: number;
}

function applyMatrix(m: Matrix, x: number, y: number): [number, number] {
  return [m.a * x + m.b * y, m.c * x + m.d * y];
}

const PRESETS: { name: string; matrix: Matrix; description: string }[] = [
  { name: 'Identity', matrix: { a: 1, b: 0, c: 0, d: 1 }, description: 'No transformation — every vector stays in place.' },
  { name: 'Rotation 45°', matrix: { a: 0.707, b: -0.707, c: 0.707, d: 0.707 }, description: 'Rotates all vectors 45° counterclockwise. Preserves lengths and angles.' },
  { name: 'Scale 2x', matrix: { a: 2, b: 0, c: 0, d: 2 }, description: 'Doubles the length of every vector. Area scales by det = 4.' },
  { name: 'Shear', matrix: { a: 1, b: 1, c: 0, d: 1 }, description: 'Shifts each point horizontally by its y-coordinate. Preserves area (det = 1).' },
  { name: 'Reflection X', matrix: { a: -1, b: 0, c: 0, d: 1 }, description: 'Flips vectors across the y-axis. Determinant = -1 (reverses orientation).' },
  { name: 'Projection', matrix: { a: 1, b: 0, c: 0, d: 0 }, description: 'Projects all vectors onto the x-axis. Collapses 2D to 1D (det = 0).' },
];

export default function MatrixVisualizer() {
  const [matrix, setMatrix] = useState<Matrix>({ a: 1, b: 0, c: 0, d: 1 });
  const [showGrid, setShowGrid] = useState(true);
  const [testVector, setTestVector] = useState<[number, number]>([2, 1]);
  const [description, setDescription] = useState('The identity matrix — no transformation applied.');

  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  const trace = matrix.a + matrix.d;

  // Transform grid lines
  type GridLine = { original: [[number, number], [number, number]]; transformed: [[number, number], [number, number]] };
  const gridLines = useMemo(() => {
    const lines: GridLine[] = [];
    for (let i = -3; i <= 3; i++) {
      // Vertical lines
      lines.push({
        original: [[i, -4], [i, 4]],
        transformed: [applyMatrix(matrix, i, -4), applyMatrix(matrix, i, 4)],
      });
      // Horizontal lines
      lines.push({
        original: [[-4, i], [4, i]],
        transformed: [applyMatrix(matrix, -4, i), applyMatrix(matrix, 4, i)],
      });
    }
    return lines;
  }, [matrix]);

  const transformedVector = applyMatrix(matrix, testVector[0], testVector[1]);

  // Basis vectors
  const e1 = applyMatrix(matrix, 1, 0);
  const e2 = applyMatrix(matrix, 0, 1);

  const handlePreset = (preset: typeof PRESETS[number]) => {
    setMatrix(preset.matrix);
    setDescription(preset.description);
  };

  const updateEntry = (key: keyof Matrix, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setMatrix((prev) => ({ ...prev, [key]: num }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Matrix Transformation Visualizer
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        See how a 2x2 matrix transforms the plane. Edit the matrix entries or choose a preset.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Canvas */}
        <div className="relative">
          <svg width={SIZE} height={SIZE} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
            {/* Axes */}
            <line x1={0} y1={CENTER} x2={SIZE} y2={CENTER} stroke="#6B7280" strokeWidth="1" />
            <line x1={CENTER} y1={0} x2={CENTER} y2={SIZE} stroke="#6B7280" strokeWidth="1" />

            {/* Grid lines */}
            {showGrid && gridLines.map((line, i) => {
              const [ox1, oy1] = toSvg(line.original[0][0], line.original[0][1]);
              const [ox2, oy2] = toSvg(line.original[1][0], line.original[1][1]);
              const [tx1, ty1] = toSvg(line.transformed[0][0], line.transformed[0][1]);
              const [tx2, ty2] = toSvg(line.transformed[1][0], line.transformed[1][1]);
              return (
                <motion.line
                  key={i}
                  x1={ox1} y1={oy1} x2={ox2} y2={oy2}
                  stroke="#3B82F6" strokeWidth="0.5" opacity={0.3}
                  animate={{
                    x1: tx1,
                    y1: ty1,
                    x2: tx2,
                    y2: ty2,
                  }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              );
            })}

            {/* Original basis vectors (faded) */}
            <line x1={CENTER} y1={CENTER} x2={toSvg(1, 0)[0]} y2={toSvg(1, 0)[1]} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={CENTER} y1={CENTER} x2={toSvg(0, 1)[0]} y2={toSvg(0, 1)[1]} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3" />

            {/* Transformed basis vectors */}
            {(() => {
              const [e1x, e1y] = toSvg(e1[0], e1[1]);
              const [e2x, e2y] = toSvg(e2[0], e2[1]);
              const [tvx, tvy] = toSvg(testVector[0], testVector[1]);
              const [ttvx, ttvy] = toSvg(transformedVector[0], transformedVector[1]);
              return (
                <>
                  <motion.line
                    animate={{ x2: e1x, y2: e1y }}
                    transition={{ duration: 0.5 }}
                    x1={CENTER} y1={CENTER} x2={e1x} y2={e1y}
                    stroke="#EF4444" strokeWidth="2"
                  />
                  <motion.line
                    animate={{ x2: e2x, y2: e2y }}
                    transition={{ duration: 0.5 }}
                    x1={CENTER} y1={CENTER} x2={e2x} y2={e2y}
                    stroke="#22C55E" strokeWidth="2"
                  />

                  {/* Original test vector */}
                  <line
                    x1={CENTER} y1={CENTER}
                    x2={tvx} y2={tvy}
                    stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4,4"
                  />

                  {/* Transformed test vector */}
                  <motion.line
                    animate={{ x2: ttvx, y2: ttvy }}
                    transition={{ duration: 0.5 }}
                    x1={CENTER} y1={CENTER}
                    x2={ttvx} y2={ttvy}
                    stroke="#8B5CF6" strokeWidth="2.5"
                    markerEnd="url(#arrow)"
                  />

                  {/* Labels */}
                  <text x={e1x + 5} y={e1y - 5} fill="#EF4444" fontSize="11" fontWeight="bold">e₁&apos;</text>
                  <text x={e2x + 5} y={e2y - 5} fill="#22C55E" fontSize="11" fontWeight="bold">e₂&apos;</text>
                  <text x={ttvx + 5} y={ttvy - 5} fill="#8B5CF6" fontSize="11" fontWeight="bold">v&apos;</text>
                </>
              );
            })()}

            {/* Arrow marker */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" />
              </marker>
            </defs>
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> e₁ (transformed)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> e₂ (transformed)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-500 inline-block" /> test vector</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block border-dashed" style={{ borderTop: '1px dashed' }} /> original</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Matrix Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Matrix A:</label>
            <div className="grid grid-cols-2 gap-2 max-w-[200px]">
              {(['a', 'b', 'c', 'd'] as (keyof Matrix)[]).map((key) => (
                <input
                  key={key}
                  type="number"
                  step="0.1"
                  value={matrix[key]}
                  onChange={(e) => updateEntry(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center font-mono"
                />
              ))}
            </div>
          </div>

          {/* Properties */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <span className="text-gray-500 dark:text-gray-400">Determinant</span>
              <p className={`font-bold text-lg ${det === 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                {det.toFixed(3)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <span className="text-gray-500 dark:text-gray-400">Trace</span>
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {trace.toFixed(3)}
              </p>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Presets:</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePreset(preset)}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={() => setShowGrid(!showGrid)}
              className="rounded"
            />
            Show grid transformation
          </label>

          {/* Educational Explanation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">What&apos;s happening?</h4>
            <p className="text-blue-800 dark:text-blue-300">{description}</p>
            <div className="mt-2 text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p>• det = {det.toFixed(3)}: {det > 0 ? 'orientation preserved' : det < 0 ? 'orientation reversed' : 'space collapsed to lower dimension'}</p>
              <p>• Area scales by |det| = {Math.abs(det).toFixed(3)}x</p>
              <p>• Input vector [{testVector[0]}, {testVector[1]}] → Output [{transformedVector[0].toFixed(2)}, {transformedVector[1].toFixed(2)}]</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
