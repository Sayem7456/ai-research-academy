/**
 * LinearRegressionPlayground - Interactive linear regression visualization
 * Phase 12: ML Visualizations
 *
 * Users can add/remove points, adjust learning rate, and watch gradient descent in action.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Line, LineChart, ResponsiveContainer } from 'recharts';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

type Point = { x: number; y: number };

function mse(points: Point[], m: number, b: number): number {
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, p) => {
    const pred = m * p.x + b;
    return acc + (p.y - pred) ** 2;
  }, 0);
  return sum / points.length;
}

function gradientDescent(
  points: Point[],
  learningRate: number,
  iterations: number
): { m: number; b: number; history: { m: number; b: number; loss: number; iteration: number }[] } {
  let m = 0;
  let b = 0;
  const history = [];
  const n = points.length;

  if (n === 0) return { m, b, history: [{ m, b, loss: 0, iteration: 0 }] };

  for (let i = 0; i < iterations; i++) {
    let dm = 0;
    let db = 0;

    for (const p of points) {
      const pred = m * p.x + b;
      const error = pred - p.y;
      dm += (2 / n) * error * p.x;
      db += (2 / n) * error;
    }

    m -= learningRate * dm;
    b -= learningRate * db;

    if (i % 5 === 0 || i === iterations - 1) {
      history.push({ m, b, loss: mse(points, m, b), iteration: i });
    }
  }

  return { m, b, history };
}

export default function LinearRegressionPlayground() {
  const [points, setPoints] = useState<Point[]>([
    { x: 2, y: 3 },
    { x: 4, y: 5 },
    { x: 6, y: 7 },
    { x: 8, y: 9 },
  ]);
  const [learningRate, setLearningRate] = useState(0.01);
  const [iterations, setIterations] = useState(100);
  const [showGradientDescent, setShowGradientDescent] = useState(false);

  const result = useMemo(() => {
    return gradientDescent(points, learningRate, iterations);
  }, [points, learningRate, iterations]);

  const { m, b, history } = result;

  const lineData = useMemo(() => {
    return [
      { x: 0, y: b },
      { x: RANGE, y: m * RANGE + b },
    ];
  }, [m, b]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints((prev) => [...prev, { x, y }]);
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setPoints([
      { x: 2, y: 3 },
      { x: 4, y: 5 },
      { x: 6, y: 7 },
      { x: 8, y: 9 },
    ]);
  }, []);

  const handleRandomData = useCallback(() => {
    const newPoints: Point[] = [];
    const trueM = 1 + Math.random();
    const trueB = Math.random() * 5;
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * RANGE;
      const y = trueM * x + trueB + (Math.random() - 0.5) * 3;
      newPoints.push({ x, y });
    }
    setPoints(newPoints);
  }, []);

  const loss = mse(points, m, b);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Linear Regression Playground</h2>
        <p className="text-gray-600 mb-6">
          Click to add points. Watch gradient descent find the best-fit line: y = mx + b
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Canvas */}
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            >
              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full">
                {/* Grid */}
                <g stroke="#e5e7eb" strokeWidth="1">
                  {[...Array(11)].map((_, i) => (
                    <React.Fragment key={i}>
                      <line x1={(i * WIDTH) / 10} y1={0} x2={(i * WIDTH) / 10} y2={HEIGHT} />
                      <line x1={0} y1={(i * HEIGHT) / 10} x2={WIDTH} y2={(i * HEIGHT) / 10} />
                    </React.Fragment>
                  ))}
                </g>

                {/* Regression line */}
                <line
                  x1={(lineData[0].x / RANGE) * WIDTH}
                  y1={HEIGHT - (lineData[0].y / RANGE) * HEIGHT}
                  x2={(lineData[1].x / RANGE) * WIDTH}
                  y2={HEIGHT - (lineData[1].y / RANGE) * HEIGHT}
                  stroke="#3b82f6"
                  strokeWidth="3"
                />

                {/* Data points */}
                {points.map((p, i) => (
                  <motion.circle
                    key={i}
                    cx={(p.x / RANGE) * WIDTH}
                    cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                    r="6"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePoint(i);
                    }}
                    whileHover={{ scale: 1.3 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                ))}
              </svg>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                onClick={handleRandomData}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Random Data
              </button>
              <button
                onClick={() => setShowGradientDescent(!showGradientDescent)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {showGradientDescent ? 'Hide' : 'Show'} Training
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Model Parameters</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Slope (m):</span>
                  <span className="font-mono">{m.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Intercept (b):</span>
                  <span className="font-mono">{b.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loss (MSE):</span>
                  <span className="font-mono">{loss.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Learning Rate: {learningRate.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="0.001"
                  max="0.1"
                  step="0.001"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Iterations: {iterations}
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-1">How it works:</p>
              <p>Gradient descent minimizes MSE by iteratively adjusting m and b:</p>
              <code className="block mt-2 bg-white p-2 rounded text-xs">
                m = m - α × ∂MSE/∂m<br />
                b = b - α × ∂MSE/∂b
              </code>
            </div>
          </div>
        </div>

        {/* Loss history chart */}
        {showGradientDescent && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6"
          >
            <h3 className="font-semibold mb-3">Training Progress (Loss over Iterations)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" label={{ value: 'Iteration', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Loss (MSE)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
