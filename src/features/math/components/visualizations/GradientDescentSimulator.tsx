/**
 * GradientDescentSimulator - Interactive gradient descent on 2D surfaces
 * Phase 10: Mathematics Visualizations
 *
 * Visualize gradient descent on various loss landscapes with adjustable parameters.
 */

'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZE = 340;

type Surface = 'bowl' | 'saddle' | 'rosenbrock' | 'ridge';

const SURFACES: { id: Surface; name: string; description: string }[] = [
  { id: 'bowl', name: 'Convex Bowl', description: 'f(x,y) = x² + y² — single global minimum at origin. Easy to optimize.' },
  { id: 'saddle', name: 'Saddle Point', description: 'f(x,y) = x² - y² — saddle at origin. Gradient is zero but not a minimum.' },
  { id: 'rosenbrock', name: 'Rosenbrock', description: 'f(x,y) = (1-x)² + 100(y-x²)² — narrow curved valley. Challenging for basic GD.' },
  { id: 'ridge', name: 'Elongated Valley', description: 'f(x,y) = x² + 10y² — elongated bowl. Causes zigzagging without momentum.' },
];

function evaluate(surface: Surface, x: number, y: number): number {
  switch (surface) {
    case 'bowl': return x * x + y * y;
    case 'saddle': return x * x - y * y;
    case 'rosenbrock': return (1 - x) ** 2 + 100 * (y - x * x) ** 2;
    case 'ridge': return x * x + 10 * y * y;
  }
}

function gradient(surface: Surface, x: number, y: number): [number, number] {
  switch (surface) {
    case 'bowl': return [2 * x, 2 * y];
    case 'saddle': return [2 * x, -2 * y];
    case 'rosenbrock': return [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)];
    case 'ridge': return [2 * x, 20 * y];
  }
}

function runGD(
  surface: Surface, x0: number, y0: number, lr: number, steps: number, momentum: number
): { path: [number, number][]; values: number[] } {
  const path: [number, number][] = [[x0, y0]];
  const values: number[] = [evaluate(surface, x0, y0)];
  let x = x0, y = y0;
  let vx = 0, vy = 0;

  for (let i = 0; i < steps; i++) {
    const [gx, gy] = gradient(surface, x, y);

    // Clamp gradients for stability
    const maxGrad = 50;
    const cgx = Math.max(-maxGrad, Math.min(maxGrad, gx));
    const cgy = Math.max(-maxGrad, Math.min(maxGrad, gy));

    vx = momentum * vx - lr * cgx;
    vy = momentum * vy - lr * cgy;

    x += vx;
    y += vy;

    // Clamp position for stability
    x = Math.max(-5, Math.min(5, x));
    y = Math.max(-5, Math.min(5, y));

    path.push([x, y]);
    values.push(evaluate(surface, x, y));
  }
  return { path, values };
}

export default function GradientDescentSimulator() {
  const [surface, setSurface] = useState<Surface>('bowl');
  const [lr, setLr] = useState(0.1);
  const [momentum, setMomentum] = useState(0);
  const [steps, setSteps] = useState(50);
  const [startX, setStartX] = useState(3);
  const [startY, setStartY] = useState(3);
  const [animStep, setAnimStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const result = useMemo(() => runGD(surface, startX, startY, lr, steps, momentum), [surface, startX, startY, lr, steps, momentum]);

  // Contour data
  const contourLevels = useMemo(() => {
    const levels: number[] = [];
    const vals = result.values;
    const maxVal = Math.max(...vals.slice(0, 10));
    const minVal = Math.min(...vals);
    for (let i = 0; i < 12; i++) {
      levels.push(minVal + (maxVal - minVal) * (i / 11));
    }
    return levels;
  }, [result]);

  // Grid evaluation for heatmap
  const gridSize = 40;
  const gridRange = 4;
  const heatmap = useMemo(() => {
    const data: number[][] = [];
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < gridSize; i++) {
      const row: number[] = [];
      for (let j = 0; j < gridSize; j++) {
        const x = -gridRange + (2 * gridRange * j) / (gridSize - 1);
        const y = -gridRange + (2 * gridRange * i) / (gridSize - 1);
        const v = evaluate(surface, x, y);
        row.push(v);
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
      data.push(row);
    }
    return { data, min, max };
  }, [surface]);

  const toSvgX = (x: number) => ((x + gridRange) / (2 * gridRange)) * SIZE;
  const toSvgY = (y: number) => SIZE - ((y + gridRange) / (2 * gridRange)) * SIZE;

  const startAnim = useCallback(() => {
    setAnimStep(0);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setAnimStep((prev) => {
          if (prev >= result.path.length - 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 80);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, result.path.length]);

  const currentSurface = SURFACES.find((s) => s.id === surface)!;
  const currentPos = result.path[Math.min(animStep, result.path.length - 1)];
  const currentValue = result.values[Math.min(animStep, result.values.length - 1)];
  const currentGrad = gradient(surface, currentPos[0], currentPos[1]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Gradient Descent Simulator
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Watch gradient descent navigate different loss landscapes. Adjust learning rate, momentum, and starting position.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <svg width={SIZE} height={SIZE} className="border border-gray-200 dark:border-gray-600 rounded-lg">
            {/* Heatmap */}
            {heatmap.data.map((row, i) =>
              row.map((v, j) => {
                const norm = heatmap.max > heatmap.min ? (v - heatmap.min) / (heatmap.max - heatmap.min) : 0;
                const r = Math.round(30 + norm * 200);
                const g = Math.round(60 + (1 - norm) * 150);
                const b = Math.round(200 - norm * 150);
                return (
                  <rect
                    key={`${i}-${j}`}
                    x={toSvgX(-gridRange + (2 * gridRange * j) / (gridSize - 1))}
                    y={toSvgY(-gridRange + (2 * gridRange * (i + 1)) / (gridSize - 1))}
                    width={SIZE / gridSize + 1}
                    height={SIZE / gridSize + 1}
                    fill={`rgb(${r},${g},${b})`}
                    opacity={0.4}
                  />
                );
              })
            )}

            {/* Axes */}
            <line x1={toSvgX(-gridRange)} y1={toSvgY(0)} x2={toSvgX(gridRange)} y2={toSvgY(0)} stroke="#6B7280" strokeWidth="0.5" opacity={0.5} />
            <line x1={toSvgX(0)} y1={toSvgY(-gridRange)} x2={toSvgX(0)} y2={toSvgY(gridRange)} stroke="#6B7280" strokeWidth="0.5" opacity={0.5} />

            {/* Path trail */}
            {result.path.slice(0, animStep + 1).map((p, i) => {
              if (i === 0) return null;
              const prev = result.path[i - 1];
              return (
                <line
                  key={i}
                  x1={toSvgX(prev[0])} y1={toSvgY(prev[1])}
                  x2={toSvgX(p[0])} y2={toSvgY(p[1])}
                  stroke="white" strokeWidth="2" opacity={0.8}
                />
              );
            })}

            {/* Gradient arrow at current position */}
            {(() => {
              const gradScale = 0.03;
              const gx = currentPos[0] - currentGrad[0] * gradScale;
              const gy = currentPos[1] - currentGrad[1] * gradScale;
              return (
                <line
                  x1={toSvgX(currentPos[0])} y1={toSvgY(currentPos[1])}
                  x2={toSvgX(gx)} y2={toSvgY(gy)}
                  stroke="#F59E0B" strokeWidth="2"
                  markerEnd="url(#gd-arrow)"
                />
              );
            })()}

            {/* Start point */}
            <circle cx={toSvgX(result.path[0][0])} cy={toSvgY(result.path[0][1])} r="5" fill="#EF4444" stroke="white" strokeWidth="2" />

            {/* Current position */}
            <motion.circle
              animate={{ cx: toSvgX(currentPos[0]), cy: toSvgY(currentPos[1]) }}
              r="6" fill="white" stroke="#8B5CF6" strokeWidth="2.5"
            />

            <defs>
              <marker id="gd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
              </marker>
            </defs>
          </svg>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Step: {Math.min(animStep, result.path.length - 1)} / {result.path.length - 1}</span>
            <span>f = {currentValue.toFixed(4)}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Surface selector */}
          <div className="flex flex-wrap gap-2">
            {SURFACES.map((s) => (
              <button key={s.id} onClick={() => { setSurface(s.id); setAnimStep(0); setIsRunning(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${surface === s.id ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {s.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currentSurface.description}</p>

          {/* Controls */}
          <div className="space-y-2">
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Learning rate:</span><strong>{lr.toFixed(3)}</strong>
              </label>
              <input type="range" min="0.001" max="0.5" step="0.001" value={lr}
                onChange={(e) => { setLr(parseFloat(e.target.value)); setAnimStep(0); setIsRunning(false); }} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Momentum:</span><strong>{momentum.toFixed(2)}</strong>
              </label>
              <input type="range" min="0" max="0.99" step="0.01" value={momentum}
                onChange={(e) => { setMomentum(parseFloat(e.target.value)); setAnimStep(0); setIsRunning(false); }} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Start X:</span><strong>{startX.toFixed(1)}</strong>
              </label>
              <input type="range" min="-4" max="4" step="0.1" value={startX}
                onChange={(e) => { setStartX(parseFloat(e.target.value)); setAnimStep(0); setIsRunning(false); }} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Start Y:</span><strong>{startY.toFixed(1)}</strong>
              </label>
              <input type="range" min="-4" max="4" step="0.1" value={startY}
                onChange={(e) => { setStartY(parseFloat(e.target.value)); setAnimStep(0); setIsRunning(false); }} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Steps:</span><strong>{steps}</strong>
              </label>
              <input type="range" min="10" max="200" step="10" value={steps}
                onChange={(e) => { setSteps(parseInt(e.target.value)); setAnimStep(0); setIsRunning(false); }} className="w-full accent-purple-500" />
            </div>
          </div>

          {/* Run button */}
          <button onClick={startAnim}
            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
            {isRunning ? 'Running...' : 'Run Gradient Descent'}
          </button>

          {/* Loss curve mini */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Loss over steps</div>
            <svg width="100%" height="60" viewBox="0 0 200 60">
              {(() => {
                const vals = result.values.slice(0, animStep + 1);
                if (vals.length < 2) return null;
                const maxV = Math.max(...vals);
                const minV = Math.min(...vals);
                const range = maxV - minV || 1;
                return (
                  <polyline
                    fill="none" stroke="#8B5CF6" strokeWidth="2"
                    points={vals.map((v, i) =>
                      `${(i / (vals.length - 1)) * 200},${60 - ((v - minV) / range) * 55}`
                    ).join(' ')}
                  />
                );
              })()}
            </svg>
          </div>

          {/* Educational */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Tips</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>High learning rate on Rosenbrock causes divergence — try 0.002</li>
              <li>Momentum smooths zigzagging in the elongated valley</li>
              <li>Saddle point: gradient is zero at center but it&apos;s NOT a minimum</li>
              <li>Yellow arrow shows the negative gradient direction (descent)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
