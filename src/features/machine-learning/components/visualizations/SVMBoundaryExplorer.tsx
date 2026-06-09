/**
 * SVMBoundaryExplorer - Interactive SVM margin and decision boundary visualization
 * Phase 12: ML Visualizations
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { computeSVMMargin, type ClassifiedPoint } from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

function trainSVM(points: ClassifiedPoint[], C: number, iterations: number): { w1: number; w2: number; b: number } {
  let w1 = 0, w2 = 0, b = 0;
  const lr = 0.005;
  const n = points.length;
  
  if (n === 0) return { w1, w2, b };
  
  for (let iter = 0; iter < iterations; iter++) {
    for (const p of points) {
      const label = p.label === 1 ? 1 : -1;
      const decision = w1 * p.x + w2 * p.y + b;

      if (label * decision < 1) {
        // SGD on: 0.5 * ||w||^2 + C * hinge_loss
        w1 -= lr * (w1 - C * label * p.x);
        w2 -= lr * (w2 - C * label * p.y);
        b -= lr * (-C * label);
      } else {
        w1 -= lr * w1;
        w2 -= lr * w2;
      }
    }
  }
  
  return { w1, w2, b };
}

export default function SVMBoundaryExplorer() {
  const [points, setPoints] = useState<ClassifiedPoint[]>([
    { x: 2, y: 7, label: 1 },
    { x: 3, y: 8, label: 1 },
    { x: 7, y: 2, label: 0 },
    { x: 8, y: 3, label: 0 },
  ]);
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [C, setC] = useState(1.0);
  const [showMargin, setShowMargin] = useState(true);

  const { w1, w2, b } = useMemo(() => trainSVM(points, C, 1000), [points, C]);
  const { margin, supportVectors } = useMemo(() => computeSVMMargin(points, w1, w2, b), [points, w1, w2, b]);

  const decisionBoundary = useMemo(() => {
    if (Math.abs(w2) < 0.001) return null;
    const x1 = 0, y1 = -(w1 * x1 + b) / w2;
    const x2 = RANGE, y2 = -(w1 * x2 + b) / w2;
    return { x1, y1, x2, y2 };
  }, [w1, w2, b]);

  const marginBoundaries = useMemo(() => {
    if (Math.abs(w2) < 0.001) return null;
    const upper = { x1: 0, y1: -(w1 * 0 + b - 1) / w2, x2: RANGE, y2: -(w1 * RANGE + b - 1) / w2 };
    const lower = { x1: 0, y1: -(w1 * 0 + b + 1) / w2, x2: RANGE, y2: -(w1 * RANGE + b + 1) / w2 };
    return { upper, lower };
  }, [w1, w2, b]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x, y, label: activeClass }]);
  }, [activeClass]);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setPoints([
      { x: 2, y: 7, label: 1 },
      { x: 3, y: 8, label: 1 },
      { x: 7, y: 2, label: 0 },
      { x: 8, y: 3, label: 0 },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">SVM Boundary Explorer</h2>
        <p className="text-gray-600 mb-6">
          Support Vector Machines find maximum margin hyperplane. Support vectors (outlined) define the decision boundary.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            >
              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full">
                {showMargin && marginBoundaries && (
                  <g>
                    <line
                      x1={(marginBoundaries.upper.x1 / RANGE) * WIDTH}
                      y1={HEIGHT - (marginBoundaries.upper.y1 / RANGE) * HEIGHT}
                      x2={(marginBoundaries.upper.x2 / RANGE) * WIDTH}
                      y2={HEIGHT - (marginBoundaries.upper.y2 / RANGE) * HEIGHT}
                      stroke="#9333ea"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <line
                      x1={(marginBoundaries.lower.x1 / RANGE) * WIDTH}
                      y1={HEIGHT - (marginBoundaries.lower.y1 / RANGE) * HEIGHT}
                      x2={(marginBoundaries.lower.x2 / RANGE) * WIDTH}
                      y2={HEIGHT - (marginBoundaries.lower.y2 / RANGE) * HEIGHT}
                      stroke="#9333ea"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                  </g>
                )}

                {decisionBoundary && (
                  <line
                    x1={(decisionBoundary.x1 / RANGE) * WIDTH}
                    y1={HEIGHT - (decisionBoundary.y1 / RANGE) * HEIGHT}
                    x2={(decisionBoundary.x2 / RANGE) * WIDTH}
                    y2={HEIGHT - (decisionBoundary.y2 / RANGE) * HEIGHT}
                    stroke="#8b5cf6"
                    strokeWidth="3"
                  />
                )}

                <g>
                  {points.map((p, i) => {
                    const isSupportVector = supportVectors.includes(p);
                    return (
                      <motion.g key={i}>
                        {isSupportVector && (
                          <circle
                            cx={(p.x / RANGE) * WIDTH}
                            cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                            r="10"
                            fill="none"
                            stroke="#8b5cf6"
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
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePoint(i);
                          }}
                        />
                      </motion.g>
                    );
                  })}
                </g>
              </svg>
            </div>

            <div className="flex gap-2 flex-wrap">
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
              <button
                onClick={() => setShowMargin(!showMargin)}
                className={`px-4 py-2 rounded ${showMargin ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
              >
                Margin
              </button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">SVM Model</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Weights (w):</span>
                  <span className="font-mono text-xs">({w1.toFixed(3)}, {w2.toFixed(3)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Bias (b):</span>
                  <span className="font-mono">{b.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margin:</span>
                  <span className="font-mono">{margin.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Support Vectors:</span>
                  <span className="font-mono">{supportVectors.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class 0:</span>
                  <span className="font-mono">{points.filter(p => p.label === 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class 1:</span>
                  <span className="font-mono">{points.filter(p => p.label === 1).length}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Regularization (C): {C.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={C}
                onChange={(e) => setC(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                Low C: Soft margin (allows misclassifications)<br />
                High C: Hard margin (strict separation)
              </p>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-2">How SVM Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Finds hyperplane that maximizes margin</li>
                <li>Support vectors (circled) lie on margin</li>
                <li>Purple line: decision boundary</li>
                <li>Dashed lines: margin boundaries</li>
                <li>Margin = distance between dashed lines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
