/**
 * LogisticRegressionPlayground - Interactive logistic regression visualization
 * Phase 12: ML Visualizations
 *
 * Binary classification with sigmoid decision boundary and probability visualization.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

type Point = { x: number; y: number; label: 0 | 1 };

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function predict(x: number, y: number, w1: number, w2: number, b: number): number {
  return sigmoid(w1 * x + w2 * y + b);
}

function logLoss(points: Point[], w1: number, w2: number, b: number): number {
  if (points.length === 0) return 0;
  const epsilon = 1e-15;
  const sum = points.reduce((acc, p) => {
    const pred = Math.max(epsilon, Math.min(1 - epsilon, predict(p.x, p.y, w1, w2, b)));
    return acc - (p.label * Math.log(pred) + (1 - p.label) * Math.log(1 - pred));
  }, 0);
  return sum / points.length;
}

function trainLogisticRegression(
  points: Point[],
  learningRate: number,
  iterations: number
): { w1: number; w2: number; b: number; history: number[] } {
  let w1 = 0, w2 = 0, b = 0;
  const history: number[] = [];
  const n = points.length;

  if (n === 0) return { w1, w2, b, history: [0] };

  for (let i = 0; i < iterations; i++) {
    let dw1 = 0, dw2 = 0, db = 0;

    for (const p of points) {
      const pred = predict(p.x, p.y, w1, w2, b);
      const error = pred - p.label;
      dw1 += error * p.x;
      dw2 += error * p.y;
      db += error;
    }

    w1 -= (learningRate / n) * dw1;
    w2 -= (learningRate / n) * dw2;
    b -= (learningRate / n) * db;

    if (i % 10 === 0 || i === iterations - 1) {
      history.push(logLoss(points, w1, w2, b));
    }
  }

  return { w1, w2, b, history };
}

export default function LogisticRegressionPlayground() {
  const [points, setPoints] = useState<Point[]>([
    { x: 2, y: 7, label: 1 },
    { x: 3, y: 8, label: 1 },
    { x: 7, y: 2, label: 0 },
    { x: 8, y: 3, label: 0 },
  ]);
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [learningRate, setLearningRate] = useState(0.1);
  const [iterations, setIterations] = useState(200);

  const { w1, w2, b } = useMemo(() => {
    return trainLogisticRegression(points, learningRate, iterations);
  }, [points, learningRate, iterations]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints((prev) => [...prev, { x, y, label: activeClass }]);
  }, [activeClass]);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setPoints([
      { x: 2, y: 7, label: 1 },
      { x: 3, y: 8, label: 1 },
      { x: 7, y: 2, label: 0 },
      { x: 8, y: 3, label: 0 },
    ]);
  }, []);

  const handleRandomData = useCallback(() => {
    const newPoints: Point[] = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * RANGE;
      const y = Math.random() * RANGE;
      const label = (x + y > RANGE) ? 1 : 0;
      newPoints.push({ x, y, label: label as 0 | 1 });
    }
    setPoints(newPoints);
  }, []);

  const loss = logLoss(points, w1, w2, b);
  const accuracy = useMemo(() => {
    if (points.length === 0) return 0;
    const correct = points.filter(p => {
      const pred = predict(p.x, p.y, w1, w2, b);
      return (pred >= 0.5 ? 1 : 0) === p.label;
    }).length;
    return (correct / points.length) * 100;
  }, [points, w1, w2, b]);

  const heatmapResolution = 30;
  const heatmapData = useMemo(() => {
    const data: number[][] = [];
    for (let i = 0; i < heatmapResolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < heatmapResolution; j++) {
        const x = (j / (heatmapResolution - 1)) * RANGE;
        const y = RANGE - (i / (heatmapResolution - 1)) * RANGE;
        const prob = predict(x, y, w1, w2, b);
        row.push(prob);
      }
      data.push(row);
    }
    return data;
  }, [w1, w2, b]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Logistic Regression Playground</h2>
        <p className="text-gray-600 mb-6">
          Click to add points. Train a binary classifier with adjustable decision boundary.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Canvas */}
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            >
              <canvas
                width={WIDTH}
                height={HEIGHT}
                className="absolute inset-0 w-full h-full"
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;

                  const cellWidth = WIDTH / heatmapResolution;
                  const cellHeight = HEIGHT / heatmapResolution;

                  for (let i = 0; i < heatmapResolution; i++) {
                    for (let j = 0; j < heatmapResolution; j++) {
                      const prob = heatmapData[i][j];
                      const r = Math.floor(239 * (1 - prob) + 59 * prob);
                      const g = Math.floor(246 * (1 - prob) + 130 * prob);
                      const b = Math.floor(255 * (1 - prob) + 246 * prob);
                      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                      ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
                    }
                  }
                }}
              />

              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full pointer-events-none">
                {points.map((p, i) => (
                  <motion.circle
                    key={i}
                    cx={(p.x / RANGE) * WIDTH}
                    cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                    r="6"
                    fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                    stroke="white"
                    strokeWidth="2"
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
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
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveClass(1)}
                  className={`px-4 py-2 rounded ${
                    activeClass === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Class 1 (Blue)
                </button>
                <button
                  onClick={() => setActiveClass(0)}
                  className={`px-4 py-2 rounded ${
                    activeClass === 0 ? 'bg-red-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Class 0 (Red)
                </button>
              </div>
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
                Random
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Model Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-mono">{accuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Log Loss:</span>
                  <span className="font-mono">{loss.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Decision Boundary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>w₁:</span>
                  <span className="font-mono">{w1.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>w₂:</span>
                  <span className="font-mono">{w2.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>b:</span>
                  <span className="font-mono">{b.toFixed(4)}</span>
                </div>
              </div>
              <p className="text-xs mt-2 text-gray-600">
                Decision boundary: w₁x + w₂y + b = 0
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Learning Rate: {learningRate.toFixed(3)}
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
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
                  min="50"
                  max="500"
                  step="50"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-1">Color Legend:</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-blue-100 border" />
                <span>Low probability (Class 0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-300 border" />
                <span>High probability (Class 1)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
