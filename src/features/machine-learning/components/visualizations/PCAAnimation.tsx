/**
 * PCAAnimation - Interactive PCA dimensionality reduction visualization
 * Phase 12: ML Visualizations
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { computePCA, type Point2D } from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

export default function PCAAnimation() {
  const [points, setPoints] = useState<Point2D[]>([
    { x: 3, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 7 },
    { x: 6, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 7 },
  ]);
  const [showPC1, setShowPC1] = useState(true);
  const [showPC2, setShowPC2] = useState(true);
  const [showProjections, setShowProjections] = useState(false);

  const { pc1, pc2, explained } = useMemo(() => computePCA(points), [points]);
  
  const mean = useMemo(() => {
    if (points.length === 0) return { x: 0, y: 0 };
    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    };
  }, [points]);

  const projections = useMemo(() => {
    return points.map(p => {
      const centered = { x: p.x - mean.x, y: p.y - mean.y };
      const proj1 = centered.x * pc1.x + centered.y * pc1.y;
      return {
        pc1: { x: mean.x + proj1 * pc1.x, y: mean.y + proj1 * pc1.y },
      };
    });
  }, [points, mean, pc1]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x, y }]);
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setPoints([
      { x: 3, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 7 },
      { x: 6, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 7 },
    ]);
  }, []);

  const handleRandomData = useCallback(() => {
    const centerX = 3 + Math.random() * 4;
    const centerY = 3 + Math.random() * 4;
    const angle = Math.random() * Math.PI;
    const newPoints: Point2D[] = [];
    
    for (let i = 0; i < 20; i++) {
      const t = (Math.random() - 0.5) * 4;
      const n = (Math.random() - 0.5) * 0.8;
      const x = centerX + t * Math.cos(angle) - n * Math.sin(angle);
      const y = centerY + t * Math.sin(angle) + n * Math.cos(angle);
      newPoints.push({ x, y });
    }
    setPoints(newPoints);
  }, []);

  const pcScale = 2.5;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">PCA Animation</h2>
        <p className="text-gray-600 mb-6">
          Visualize Principal Component Analysis. Red arrow (PC1) captures maximum variance. Blue arrow (PC2) is orthogonal.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            >
              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full">
                {showProjections && projections.map((proj, i) => {
                  const p = points[i];
                  return (
                    <line
                      key={`proj-${i}`}
                      x1={(p.x / RANGE) * WIDTH}
                      y1={HEIGHT - (p.y / RANGE) * HEIGHT}
                      x2={(proj.pc1.x / RANGE) * WIDTH}
                      y2={HEIGHT - (proj.pc1.y / RANGE) * HEIGHT}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2"
                    />
                  );
                })}

                <g>
                  <circle
                    cx={(mean.x / RANGE) * WIDTH}
                    cy={HEIGHT - (mean.y / RANGE) * HEIGHT}
                    r="4"
                    fill="#8b5cf6"
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>

                {showPC1 && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <defs>
                      <marker
                        id="arrowhead1"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
                      </marker>
                    </defs>
                    <line
                      x1={(mean.x / RANGE) * WIDTH}
                      y1={HEIGHT - (mean.y / RANGE) * HEIGHT}
                      x2={((mean.x + pc1.x * pcScale) / RANGE) * WIDTH}
                      y2={HEIGHT - ((mean.y + pc1.y * pcScale) / RANGE) * HEIGHT}
                      stroke="#ef4444"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead1)"
                    />
                  </motion.g>
                )}

                {showPC2 && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <defs>
                      <marker
                        id="arrowhead2"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                      </marker>
                    </defs>
                    <line
                      x1={(mean.x / RANGE) * WIDTH}
                      y1={HEIGHT - (mean.y / RANGE) * HEIGHT}
                      x2={((mean.x + pc2.x * pcScale) / RANGE) * WIDTH}
                      y2={HEIGHT - ((mean.y + pc2.y * pcScale) / RANGE) * HEIGHT}
                      stroke="#3b82f6"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead2)"
                    />
                  </motion.g>
                )}

                <g>
                  {points.map((p, i) => (
                    <motion.circle
                      key={i}
                      cx={(p.x / RANGE) * WIDTH}
                      cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                      r="5"
                      fill="#10b981"
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
                </g>
              </svg>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowPC1(!showPC1)}
                className={`px-4 py-2 rounded ${showPC1 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
              >
                PC1
              </button>
              <button
                onClick={() => setShowPC2(!showPC2)}
                className={`px-4 py-2 rounded ${showPC2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                PC2
              </button>
              <button
                onClick={() => setShowProjections(!showProjections)}
                className={`px-4 py-2 rounded ${showProjections ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
              >
                Projections
              </button>
              <button onClick={handleRandomData} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Random
              </button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">PC1 (First Component)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Direction:</span>
                  <span className="font-mono text-xs">({pc1.x.toFixed(3)}, {pc1.y.toFixed(3)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Variance Explained:</span>
                  <span className="font-mono">{(explained[0] * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">PC2 (Second Component)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Direction:</span>
                  <span className="font-mono text-xs">({pc2.x.toFixed(3)}, {pc2.y.toFixed(3)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Variance Explained:</span>
                  <span className="font-mono">{(explained[1] * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mean:</span>
                  <span className="font-mono text-xs">({mean.x.toFixed(2)}, {mean.y.toFixed(2)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Variance:</span>
                  <span className="font-mono">100%</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-2">How PCA Works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Center data at mean (purple point)</li>
                <li>Find direction of maximum variance (PC1)</li>
                <li>Find orthogonal direction (PC2)</li>
                <li>Project data onto principal components</li>
              </ol>
              <p className="mt-2 text-xs">Gray lines show projections onto PC1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
