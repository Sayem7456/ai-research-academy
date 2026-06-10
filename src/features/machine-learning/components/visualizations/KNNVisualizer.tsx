'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  knnPredict,
  looAccuracy,
  type ClassifiedPoint,
  type Point2D,
  type DistanceMetric,
  type KNNWeighting,
} from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;
const MAX_K = 15;

function generateBlobs(): ClassifiedPoint[] {
  const points: ClassifiedPoint[] = [];
  for (let i = 0; i < 15; i++) {
    points.push({ x: 3 + (Math.random() - 0.5) * 3, y: 7 + (Math.random() - 0.5) * 3, label: 1 });
    points.push({ x: 7 + (Math.random() - 0.5) * 3, y: 3 + (Math.random() - 0.5) * 3, label: 0 });
  }
  return points;
}

function generateMoons(): ClassifiedPoint[] {
  const points: ClassifiedPoint[] = [];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI;
    const r = 2 + Math.random() * 1.5;
    points.push({ x: 5 + Math.cos(angle) * r, y: 5 + Math.sin(angle) * r, label: 1 });
  }
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI;
    const r = 2 + Math.random() * 1.5;
    points.push({ x: 4 + Math.cos(angle + Math.PI) * r, y: 6.5 + Math.sin(angle + Math.PI) * r, label: 0 });
  }
  return points;
}

function generateCircles(): ClassifiedPoint[] {
  const points: ClassifiedPoint[] = [];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * 2 * Math.PI;
    points.push({ x: 5 + Math.cos(angle) * (1 + Math.random() * 1.2), y: 5 + Math.sin(angle) * (1 + Math.random() * 1.2), label: 1 });
  }
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * 2 * Math.PI;
    points.push({ x: 5 + Math.cos(angle) * (3 + Math.random() * 1.2), y: 5 + Math.sin(angle) * (3 + Math.random() * 1.2), label: 0 });
  }
  return points;
}

function generateXOR(): ClassifiedPoint[] {
  const points: ClassifiedPoint[] = [];
  for (let i = 0; i < 8; i++) {
    points.push({ x: 2.5 + (Math.random() - 0.5) * 2.5, y: 2.5 + (Math.random() - 0.5) * 2.5, label: 1 });
    points.push({ x: 7.5 + (Math.random() - 0.5) * 2.5, y: 7.5 + (Math.random() - 0.5) * 2.5, label: 1 });
    points.push({ x: 2.5 + (Math.random() - 0.5) * 2.5, y: 7.5 + (Math.random() - 0.5) * 2.5, label: 0 });
    points.push({ x: 7.5 + (Math.random() - 0.5) * 2.5, y: 2.5 + (Math.random() - 0.5) * 2.5, label: 0 });
  }
  return points;
}

function AccuracyChart({ data, currentK }: { data: { k: number; accuracy: number }[]; currentK: number }) {
  if (data.length < 2) return null;

  const w = 260;
  const h = 110;
  const pad = { t: 8, r: 8, b: 22, l: 32 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;

  const maxAcc = Math.max(...data.map(d => d.accuracy), 50);
  const minAcc = Math.max(0, Math.min(...data.map(d => d.accuracy)));
  const range = Math.max(maxAcc - minAcc, 1);

  const x = (k: number) => pad.l + ((k - 1) / (data.length - 1)) * plotW;
  const y = (acc: number) => pad.t + (1 - (acc - minAcc) / range) * plotH;

  const d = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.k)},${y(p.accuracy)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[260px]">
      <text x={8} y={h / 2 + 4} textAnchor="middle" fill="#9ca3af" fontSize="9" transform={`rotate(-90, 8, ${h / 2 + 4})`}>Acc %</text>
      <path d={d} fill="none" stroke="#6366f1" strokeWidth="1.5" />
      {data.map(p => (
        <circle
          key={p.k}
          cx={x(p.k)} cy={y(p.accuracy)}
          r={p.k === currentK ? 4 : 2.5}
          fill={p.k === currentK ? '#6366f1' : '#a5b4fc'}
          stroke={p.k === currentK ? '#fff' : 'none'}
          strokeWidth={p.k === currentK ? 1.5 : 0}
        >
          <title>K={p.k}: {p.accuracy.toFixed(1)}%</title>
        </circle>
      ))}
      {data.filter(p => p.k % 2 === 1 || p.k === data.length).map(p => (
        <text key={p.k} x={x(p.k)} y={h - 4} textAnchor="middle" fill="#9ca3af" fontSize="8">{p.k}</text>
      ))}
      <text x={w / 2} y={h - 4} textAnchor="middle" fill="#9ca3af" fontSize="8">K</text>
    </svg>
  );
}

export default function KNNVisualizer() {
  const [points, setPoints] = useState<ClassifiedPoint[]>(generateBlobs);
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [k, setK] = useState(3);
  const [testPoint, setTestPoint] = useState<Point2D | null>(null);
  const [metric, setMetric] = useState<DistanceMetric>('euclidean');
  const [weighting, setWeighting] = useState<KNNWeighting>('uniform');
  const [keyboardPos, setKeyboardPos] = useState<Point2D>({ x: 5, y: 5 });
  const [isFocused, setIsFocused] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);

  const maxK = Math.min(MAX_K, Math.max(1, points.length));

  const prediction = useMemo(() => {
    if (!testPoint || points.length === 0) return null;
    return knnPredict(testPoint, points, Math.min(k, points.length), metric, weighting);
  }, [testPoint, points, k, metric, weighting]);

  const heatmapResolution = 30;
  const heatmapData = useMemo(() => {
    if (points.length === 0) return [];
    const data: { x: number; y: number; prediction: number; confidence: number }[] = [];
    for (let i = 0; i < heatmapResolution; i++) {
      for (let j = 0; j < heatmapResolution; j++) {
        const x = (j / (heatmapResolution - 1)) * RANGE;
        const y = (i / (heatmapResolution - 1)) * RANGE;
        const result = knnPredict({ x, y }, points, Math.min(k, points.length), metric, weighting);
        const total = Object.values(result.votes).reduce((a, b) => a + b, 0);
        data.push({ x, y, prediction: result.prediction, confidence: total > 0 ? (result.votes[result.prediction] || 0) / total : 0 });
      }
    }
    return data;
  }, [points, k, metric, weighting]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const cellSize = WIDTH / heatmapResolution;
    for (const cell of heatmapData) {
      const px = (cell.x / RANGE) * WIDTH;
      const py = HEIGHT - (cell.y / RANGE) * HEIGHT;
      const alpha = showConfidence ? 0.04 + cell.confidence * 0.22 : 0.1;
      ctx.fillStyle = cell.prediction === 1 ? `rgba(59, 130, 246, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(px - cellSize / 2, py - cellSize / 2, cellSize, cellSize);
    }
  }, [heatmapData, showConfidence]);

  const accuracy = useMemo(() => {
    if (points.length < 2) return null;
    return looAccuracy(points, Math.min(k, points.length - 1), metric, weighting);
  }, [points, k, metric, weighting]);

  const accuracyByK = useMemo(() => {
    if (points.length < 3) return [];
    const max = Math.min(MAX_K, points.length - 1);
    const results: { k: number; accuracy: number }[] = [];
    for (let kv = 1; kv <= max; kv++) {
      results.push({ k: kv, accuracy: looAccuracy(points, kv, metric, weighting).accuracy });
    }
    return results;
  }, [points, metric, weighting]);

  const bestK = useMemo(() => {
    if (accuracyByK.length === 0) return null;
    return accuracyByK.reduce((best, curr) => (curr.accuracy > best.accuracy ? curr : best));
  }, [accuracyByK]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x, y, label: activeClass }]);
    setTestPoint(null);
  }, [activeClass]);

  const handleTestPointMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setTestPoint({ x, y });
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.5;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setKeyboardPos(prev => ({ ...prev, y: Math.min(RANGE, prev.y + step) }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setKeyboardPos(prev => ({ ...prev, y: Math.max(0, prev.y - step) }));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setKeyboardPos(prev => ({ x: Math.max(0, prev.x - step), y: prev.y }));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setKeyboardPos(prev => ({ x: Math.min(RANGE, prev.x + step), y: prev.y }));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        setPoints(prev => [...prev, { x: keyboardPos.x, y: keyboardPos.y, label: activeClass }]);
        setTestPoint(null);
        break;
    }
  }, [keyboardPos, activeClass]);

  const loadDataset = useCallback((fn: () => ClassifiedPoint[]) => {
    setPoints(fn());
    setTestPoint(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">K-Nearest Neighbors Visualizer</h2>
        <p className="text-gray-600 mb-6">
          Click the canvas to add training points. Move cursor to test predictions. Adjust K and settings below.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left Column: Canvas ── */}
          <div className="space-y-3">
            {/* Dataset presets */}
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 mr-1 self-center">Data:</span>
              <button onClick={() => loadDataset(generateBlobs)} className="px-2.5 py-1 rounded text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors">Blobs</button>
              <button onClick={() => loadDataset(generateMoons)} className="px-2.5 py-1 rounded text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors">Moons</button>
              <button onClick={() => loadDataset(generateCircles)} className="px-2.5 py-1 rounded text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors">Circles</button>
              <button onClick={() => loadDataset(generateXOR)} className="px-2.5 py-1 rounded text-xs bg-gray-600 text-white hover:bg-gray-700 transition-colors">XOR</button>
              <button onClick={() => { setPoints(generateBlobs); setTestPoint(null); }} className="px-2.5 py-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600 transition-colors">Reset</button>
            </div>

            {/* Canvas */}
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseMove={handleTestPointMove}
              onMouseLeave={() => setTestPoint(null)}
              tabIndex={0}
              role="application"
              aria-label="KNN visualization canvas. Use arrow keys to move the cursor and Enter or Space to add a point."
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            >
              <canvas width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full" ref={canvasRef} />

              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full pointer-events-none">
                {prediction && prediction.neighbors.map((neighbor, i) => (
                  <line
                    key={i}
                    x1={testPoint ? (testPoint.x / RANGE) * WIDTH : 0}
                    y1={testPoint ? HEIGHT - (testPoint.y / RANGE) * HEIGHT : 0}
                    x2={(neighbor.x / RANGE) * WIDTH}
                    y2={HEIGHT - (neighbor.y / RANGE) * HEIGHT}
                    stroke="#9333ea" strokeWidth="1" strokeDasharray="4"
                  />
                ))}

                {points.map((p, i) => {
                  const isNeighbor = prediction?.neighbors.includes(p);
                  const dist = prediction
                    ? prediction.distances[prediction.neighbors.indexOf(p)]
                    : null;
                  return (
                    <motion.g key={i}>
                      {isNeighbor && (
                        <circle
                          cx={(p.x / RANGE) * WIDTH} cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                          r="12" fill="none" stroke="#9333ea" strokeWidth="2"
                        />
                      )}
                      <circle
                        cx={(p.x / RANGE) * WIDTH} cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                        r="6" fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                        stroke="white" strokeWidth="2"
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleRemovePoint(i); }}
                        role="button" tabIndex={0}
                        aria-label={`${p.label === 1 ? 'Blue' : 'Red'} point at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}). Press Delete to remove.`}
                        onKeyDown={(e) => {
                          if (['Enter', ' ', 'Delete', 'Backspace'].includes(e.key)) {
                            e.stopPropagation();
                            handleRemovePoint(i);
                          }
                        }}
                      />
                      {isNeighbor && dist !== null && (
                        <text
                          x={(p.x / RANGE) * WIDTH} y={HEIGHT - (p.y / RANGE) * HEIGHT - 10}
                          textAnchor="middle" fill="#9333ea" fontSize="9"
                        >
                          {dist.toFixed(2)}
                        </text>
                      )}
                    </motion.g>
                  );
                })}

                {testPoint && (
                  <motion.circle
                    cx={(testPoint.x / RANGE) * WIDTH} cy={HEIGHT - (testPoint.y / RANGE) * HEIGHT}
                    r="8" fill={prediction?.prediction === 1 ? '#3b82f6' : '#ef4444'}
                    stroke="#9333ea" strokeWidth="3"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                  />
                )}

                {isFocused && (
                  <motion.circle
                    cx={(keyboardPos.x / RANGE) * WIDTH} cy={HEIGHT - (keyboardPos.y / RANGE) * HEIGHT}
                    r="5" fill="none" stroke="#9333ea" strokeWidth="2" strokeDasharray="3"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  />
                )}
              </svg>
            </div>

            {/* Class selection */}
            <div className="flex gap-2">
              <span className="text-xs text-gray-400 self-center">Add:</span>
              <button onClick={() => setActiveClass(1)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeClass === 1 ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Class 1 (Blue)
              </button>
              <button onClick={() => setActiveClass(0)} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeClass === 0 ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Class 0 (Red)
              </button>
            </div>
          </div>

          {/* ── Right Column: Panels ── */}
          <div className="space-y-4">
            {/* Model Settings — consolidated */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">Model Settings</h3>

              {/* K slider */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-xs font-medium text-gray-600">K (Neighbors):</span>
                  <span className="font-mono font-bold text-blue-700">{k}</span>
                </div>
                <input type="range" min="1" max={maxK} step="1" value={k} onChange={e => setK(parseInt(e.target.value))} className="w-full" />
                {bestK && <p className="text-xs text-gray-500 mt-0.5">Best K: <span className="font-semibold">{bestK.k}</span> ({bestK.accuracy.toFixed(1)}% acc)</p>}
              </div>

              {/* Controls grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Distance</label>
                  <div className="flex gap-1">
                    <button onClick={() => setMetric('euclidean')} className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${metric === 'euclidean' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      Euclidean
                    </button>
                    <button onClick={() => setMetric('manhattan')} className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${metric === 'manhattan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      Manhattan
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weighting</label>
                  <div className="flex gap-1">
                    <button onClick={() => setWeighting('uniform')} className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${weighting === 'uniform' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      Uniform
                    </button>
                    <button onClick={() => setWeighting('distance')} className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${weighting === 'distance' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      Weighted
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats row + confidence toggle */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>{points.length} pts</span>
                  <span className="text-blue-600">{points.filter(p => p.label === 1).length} blue</span>
                  <span className="text-red-600">{points.filter(p => p.label === 0).length} red</span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={showConfidence} onChange={e => setShowConfidence(e.target.checked)} className="accent-blue-600" />
                  Confidence
                </label>
              </div>
            </div>

            {/* Current Prediction */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Current Prediction</h3>
              {testPoint && prediction ? (
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Class:</span>
                    <span className={`font-mono font-bold text-base ${prediction.prediction === 1 ? 'text-blue-600' : 'text-red-600'}`}>
                      {prediction.prediction}
                    </span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <span className="font-mono text-sm">
                      {(() => {
                        const total = Object.values(prediction.votes).reduce((a, b) => a + b, 0);
                        return total > 0 ? `${((prediction.votes[prediction.prediction] || 0) / total * 100).toFixed(0)}%` : 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    {Object.entries(prediction.votes).map(([cls, votes]) => (
                      <span key={cls} className={`${cls === '1' ? 'text-blue-600' : 'text-red-600'}`}>
                        Class {cls}: {weighting === 'uniform' ? votes.toFixed(0) : votes.toFixed(2)}{weighting === 'distance' ? 'w' : 'v'}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">
                    pos: ({testPoint.x.toFixed(2)}, {testPoint.y.toFixed(2)}) &middot; {metric} &middot; {weighting}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Move cursor over the canvas</p>
              )}
            </div>

            {/* Performance — combined LOOCV + Chart */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Performance (LOOCV)</h3>
              {accuracy && (
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className={`text-2xl font-bold font-mono ${accuracy.accuracy >= 80 ? 'text-green-600' : accuracy.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {accuracy.accuracy.toFixed(0)}<span className="text-sm">%</span>
                    </div>
                    <div className="text-xs text-gray-500">{accuracy.correct}/{accuracy.total} correct</div>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-xs mt-1.5">
                      <span />
                      <span className="text-center text-gray-400">P0</span>
                      <span className="text-center text-gray-400">P1</span>
                      <span className="text-gray-500">A0</span>
                      <span className="text-center font-mono bg-green-100 rounded text-green-700">{accuracy.confusion.tn}</span>
                      <span className="text-center font-mono bg-red-100 rounded text-red-700">{accuracy.confusion.fp}</span>
                      <span className="text-gray-500">A1</span>
                      <span className="text-center font-mono bg-red-100 rounded text-red-700">{accuracy.confusion.fn}</span>
                      <span className="text-center font-mono bg-green-100 rounded text-green-700">{accuracy.confusion.tp}</span>
                    </div>
                  </div>
                  {accuracyByK.length >= 2 && (
                    <div className="flex-1 min-w-0">
                      <AccuracyChart data={accuracyByK} currentK={k} />
                      <p className="text-xs text-gray-400 mt-0.5">K vs Accuracy — hover dots</p>
                    </div>
                  )}
                </div>
              )}
              {!accuracy && <p className="text-xs text-gray-500">Add at least 2 points to evaluate</p>}
            </div>

            {/* Quick ref */}
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
              <span className="font-medium text-gray-500">How it works:</span> Find <strong>K</strong> nearest points,
              majority vote predicts the class. Purple lines connect test point to its K neighbors.
              Distance values shown near each neighbor. <a href="/content/ml/ml-knn" className="text-indigo-500 hover:text-indigo-600 underline">Full lesson →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
