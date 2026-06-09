/**
 * KNNVisualizer - Interactive K-Nearest Neighbors visualization
 * Phase 12: ML Visualizations
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { knnPredict, type ClassifiedPoint, type Point2D } from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

export default function KNNVisualizer() {
  const [points, setPoints] = useState<ClassifiedPoint[]>([
    { x: 2, y: 7, label: 1 },
    { x: 3, y: 8, label: 1 },
    { x: 2.5, y: 6.5, label: 1 },
    { x: 7, y: 2, label: 0 },
    { x: 8, y: 3, label: 0 },
    { x: 7.5, y: 2.5, label: 0 },
  ]);
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [k, setK] = useState(3);
  const [testPoint, setTestPoint] = useState<Point2D | null>(null);

  const prediction = useMemo(() => {
    if (!testPoint || points.length === 0) return null;
    return knnPredict(testPoint, points, Math.min(k, points.length));
  }, [testPoint, points, k]);

  const heatmapResolution = 30;
  const heatmapData = useMemo(() => {
    if (points.length === 0) return [];
    const data: { x: number; y: number; prediction: number }[] = [];
    for (let i = 0; i < heatmapResolution; i++) {
      for (let j = 0; j < heatmapResolution; j++) {
        const x = (j / (heatmapResolution - 1)) * RANGE;
        const y = (i / (heatmapResolution - 1)) * RANGE;
        const { prediction } = knnPredict({ x, y }, points, Math.min(k, points.length));
        data.push({ x, y, prediction });
      }
    }
    return data;
  }, [points, k]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints((prev) => [...prev, { x, y, label: activeClass }]);
  }, [activeClass]);

  const handleTestPointMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setTestPoint({ x, y });
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setPoints([
      { x: 2, y: 7, label: 1 },
      { x: 3, y: 8, label: 1 },
      { x: 2.5, y: 6.5, label: 1 },
      { x: 7, y: 2, label: 0 },
      { x: 8, y: 3, label: 0 },
      { x: 7.5, y: 2.5, label: 0 },
    ]);
    setTestPoint(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">K-Nearest Neighbors Visualizer</h2>
        <p className="text-gray-600 mb-6">
          Click to add training points. Move cursor to test prediction. Adjust K to see how neighbors influence classification.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={handleTestPointMove}
              onMouseLeave={() => setTestPoint(null)}
            >
              <canvas
                width={WIDTH}
                height={HEIGHT}
                className="absolute inset-0 w-full h-full"
                ref={(canvas) => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;

                  const cellSize = WIDTH / heatmapResolution;
                  for (const cell of heatmapData) {
                    const px = (cell.x / RANGE) * WIDTH;
                    const py = HEIGHT - (cell.y / RANGE) * HEIGHT;
                    ctx.fillStyle = cell.prediction === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                    ctx.fillRect(px - cellSize / 2, py - cellSize / 2, cellSize, cellSize);
                  }
                }}
              />

              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full pointer-events-none">
                {prediction && prediction.neighbors.map((neighbor, i) => (
                  <line
                    key={i}
                    x1={testPoint ? (testPoint.x / RANGE) * WIDTH : 0}
                    y1={testPoint ? HEIGHT - (testPoint.y / RANGE) * HEIGHT : 0}
                    x2={(neighbor.x / RANGE) * WIDTH}
                    y2={HEIGHT - (neighbor.y / RANGE) * HEIGHT}
                    stroke="#9333ea"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                ))}

                {points.map((p, i) => {
                  const isNeighbor = prediction?.neighbors.includes(p);
                  return (
                    <motion.g key={i}>
                      {isNeighbor && (
                        <circle
                          cx={(p.x / RANGE) * WIDTH}
                          cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                          r="12"
                          fill="none"
                          stroke="#9333ea"
                          strokeWidth="2"
                        />
                      )}
                      <circle
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
                      />
                    </motion.g>
                  );
                })}

                {testPoint && (
                  <motion.circle
                    cx={(testPoint.x / RANGE) * WIDTH}
                    cy={HEIGHT - (testPoint.y / RANGE) * HEIGHT}
                    r="8"
                    fill={prediction?.prediction === 1 ? '#3b82f6' : '#ef4444'}
                    stroke="#9333ea"
                    strokeWidth="3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </svg>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveClass(1)}
                className={`px-4 py-2 rounded ${activeClass === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Class 1
              </button>
              <button
                onClick={() => setActiveClass(0)}
                className={`px-4 py-2 rounded ${activeClass === 0 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
              >
                Class 0
              </button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Prediction</h3>
              {testPoint && prediction ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Predicted Class:</span>
                    <span className={`font-mono font-bold ${prediction.prediction === 1 ? 'text-blue-600' : 'text-red-600'}`}>
                      {prediction.prediction}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>K Neighbors:</span>
                    <span className="font-mono">{prediction.neighbors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Point:</span>
                    <span className="font-mono text-xs">({testPoint.x.toFixed(2)}, {testPoint.y.toFixed(2)})</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Move cursor over canvas to test prediction</p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Model Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Training Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class 0 (Red):</span>
                  <span className="font-mono">{points.filter(p => p.label === 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class 1 (Blue):</span>
                  <span className="font-mono">{points.filter(p => p.label === 1).length}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                K (Number of Neighbors): {k}
              </label>
              <input
                type="range"
                min="1"
                max={Math.max(15, points.length)}
                step="1"
                value={k}
                onChange={(e) => setK(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                Small K: Sensitive to noise, complex boundaries<br />
                Large K: Smoother boundaries, may underfit
              </p>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-1">How KNN Works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Find K nearest training points</li>
                <li>Count votes from each class</li>
                <li>Predict majority class</li>
              </ol>
              <p className="mt-2 text-xs">Purple lines show K nearest neighbors to test point.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
