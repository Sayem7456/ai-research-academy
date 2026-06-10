'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WIDTH = 480;
const HEIGHT = 480;
const RANGE = 10;
const TICK_VALUES = [0, 2, 4, 6, 8, 10];

type Point = { x: number; y: number; label: 0 | 1 };

interface ModelParams {
  w1: number;
  w2: number;
  b: number;
}

interface HistoryEntry extends ModelParams {
  loss: number;
  iteration: number;
}

interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function predict(x: number, y: number, params: ModelParams): number {
  return sigmoid(params.w1 * x + params.w2 * y + params.b);
}

function logLoss(points: Point[], params: ModelParams): number {
  if (points.length === 0) return 0;
  const epsilon = 1e-15;
  const sum = points.reduce((acc, p) => {
    const pred = Math.max(epsilon, Math.min(1 - epsilon, predict(p.x, p.y, params)));
    return acc - (p.label * Math.log(pred) + (1 - p.label) * Math.log(1 - pred));
  }, 0);
  return sum / points.length;
}

function computeConfusionMatrix(points: Point[], params: ModelParams): ConfusionMatrix {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const p of points) {
    const pred = predict(p.x, p.y, params) >= 0.5 ? 1 : 0;
    if (p.label === 1 && pred === 1) tp++;
    else if (p.label === 0 && pred === 1) fp++;
    else if (p.label === 0 && pred === 0) tn++;
    else if (p.label === 1 && pred === 0) fn++;
  }
  const accuracy = points.length > 0 ? ((tp + tn) / points.length) * 100 : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, tn, fn, accuracy, precision, recall, f1 };
}

function trainLogisticRegression(
  points: Point[],
  learningRate: number,
  iterations: number,
  regLambda: number
): { params: ModelParams; history: HistoryEntry[] } {
  let w1 = 0, w2 = 0, b = 0;
  const history: HistoryEntry[] = [];
  const n = points.length;

  if (n === 0) {
    const params = { w1, w2, b };
    history.push({ ...params, loss: 0, iteration: 0 });
    return { params, history };
  }

  const step = Math.max(1, Math.floor(iterations / 60));

  for (let i = 0; i < iterations; i++) {
    let dw1 = 0, dw2 = 0, db = 0;

    for (const p of points) {
      const pred = predict(p.x, p.y, { w1, w2, b });
      const error = pred - p.label;
      dw1 += error * p.x;
      dw2 += error * p.y;
      db += error;
    }

    if (regLambda > 0) {
      dw1 += regLambda * w1;
      dw2 += regLambda * w2;
    }

    w1 -= (learningRate / n) * dw1;
    w2 -= (learningRate / n) * dw2;
    b -= (learningRate / n) * db;

    if (i % step === 0 || i === iterations - 1 || i === 0) {
      const params = { w1, w2, b };
      history.push({ ...params, loss: logLoss(points, params), iteration: i });
    }
  }

  return { params: { w1, w2, b }, history };
}

function toSVGX(x: number): number {
  return (x / RANGE) * WIDTH;
}
function toSVGY(y: number): number {
  return HEIGHT - (y / RANGE) * HEIGHT;
}

export default function LogisticRegressionPlayground() {
  const [points, setPoints] = useState<Point[]>([
    { x: 2, y: 7, label: 1 },
    { x: 3, y: 8, label: 1 },
    { x: 4.5, y: 6, label: 1 },
    { x: 7, y: 2, label: 0 },
    { x: 8, y: 3, label: 0 },
    { x: 6, y: 4.5, label: 0 },
  ]);
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [learningRate, setLearningRate] = useState(0.1);
  const [iterations, setIterations] = useState(200);
  const [regLambda, setRegLambda] = useState(0);

  const [isTraining, setIsTraining] = useState(false);
  const [animStep, setAnimStep] = useState(-1);
  const trainingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showLossChart, setShowLossChart] = useState(false);
  const [showConfusionMatrix, setShowConfusionMatrix] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopTraining = useCallback(() => {
    if (trainingRef.current) { clearInterval(trainingRef.current); trainingRef.current = null; }
    setIsTraining(false);
  }, []);

  useEffect(() => { return () => stopTraining(); }, [stopTraining]);

  const trainResult = useMemo(
    () => trainLogisticRegression(points, learningRate, iterations, regLambda),
    [points, learningRate, iterations, regLambda]
  );

  const currentParams: ModelParams = useMemo(() => {
    if (animStep >= 0 && animStep < trainResult.history.length) {
      const h = trainResult.history[animStep];
      return { w1: h.w1, w2: h.w2, b: h.b };
    }
    return trainResult.params;
  }, [trainResult, animStep]);

  const currentLoss = useMemo(() => {
    if (animStep >= 0 && animStep < trainResult.history.length) {
      return trainResult.history[animStep].loss;
    }
    return logLoss(points, currentParams);
  }, [trainResult, animStep, points, currentParams]);

  const confMatrix = useMemo(
    () => computeConfusionMatrix(points, currentParams),
    [points, currentParams]
  );

  const heatmapResolution = 40;
  const heatmapData = useMemo(() => {
    const data: number[][] = [];
    for (let i = 0; i < heatmapResolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < heatmapResolution; j++) {
        const x = (j / (heatmapResolution - 1)) * RANGE;
        const y = RANGE - (i / (heatmapResolution - 1)) * RANGE;
        const prob = predict(x, y, currentParams);
        row.push(prob);
      }
      data.push(row);
    }
    return data;
  }, [currentParams]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellWidth = WIDTH / heatmapResolution;
    const cellHeight = HEIGHT / heatmapResolution;

    for (let i = 0; i < heatmapResolution; i++) {
      for (let j = 0; j < heatmapResolution; j++) {
        const prob = heatmapData[i][j];
        const r = Math.floor(239 * (1 - prob) + 99 * prob);
        const g = Math.floor(246 * (1 - prob) + 102 * prob);
        const b = Math.floor(255 * (1 - prob) + 241 * prob);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      }
    }
  }, [heatmapData]);

  const boundaryPoints = useMemo(() => {
    const { w1, w2, b } = currentParams;
    if (Math.abs(w2) < 1e-6) return null;
    const x0 = 0, y0 = -(w1 * x0 + b) / w2;
    const x1 = RANGE, y1 = -(w1 * x1 + b) / w2;
    return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
  }, [currentParams]);

  const startTraining = useCallback(() => {
    stopTraining();
    setAnimStep(0);
    setIsTraining(true);
    const totalSteps = trainResult.history.length;
    let step = 0;
    trainingRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) { stopTraining(); setAnimStep(totalSteps - 1); return; }
      setAnimStep(step);
    }, Math.max(30, Math.min(200, 4000 / totalSteps)));
  }, [trainResult.history.length, stopTraining]);

  useEffect(() => { setAnimStep(-1); }, [points, learningRate, iterations, regLambda]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, label: activeClass }]);
  }, [activeClass]);

  const handleRemovePoint = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (points.length <= 2) return;
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, [points.length]);

  const handleReset = useCallback(() => {
    stopTraining(); setAnimStep(-1);
    setPoints([
      { x: 2, y: 7, label: 1 }, { x: 3, y: 8, label: 1 }, { x: 4.5, y: 6, label: 1 },
      { x: 7, y: 2, label: 0 }, { x: 8, y: 3, label: 0 }, { x: 6, y: 4.5, label: 0 },
    ]);
  }, [stopTraining]);

  const handleRandomData = useCallback(() => {
    stopTraining(); setAnimStep(-1);
    const newPoints: Point[] = [];
    const centerX0 = 3 + Math.random() * 2;
    const centerY0 = 3 + Math.random() * 2;
    const centerX1 = 6 + Math.random() * 2;
    const centerY1 = 6 + Math.random() * 2;
    for (let i = 0; i < 10; i++) {
      const x = centerX0 + (Math.random() - 0.5) * 3;
      const y = centerY0 + (Math.random() - 0.5) * 3;
      newPoints.push({ x: Math.max(0.5, Math.min(9.5, x)), y: Math.max(0.5, Math.min(9.5, y)), label: 0 });
    }
    for (let i = 0; i < 10; i++) {
      const x = centerX1 + (Math.random() - 0.5) * 3;
      const y = centerY1 + (Math.random() - 0.5) * 3;
      newPoints.push({ x: Math.max(0.5, Math.min(9.5, x)), y: Math.max(0.5, Math.min(9.5, y)), label: 1 });
    }
    setPoints(newPoints);
  }, [stopTraining]);

  const toggleButton = isTraining ? 'Pause Training' : (animStep >= 0 ? 'Replay Training' : 'Start Training');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-4">Logistic Regression Playground</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Click to add points. Right-click to remove. Select a class, then click to place points. Train a binary classifier with adjustable decision boundary.
        </p>

        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex gap-1">
            <button onClick={() => setActiveClass(1)} className={`px-3 py-1.5 text-sm rounded ${activeClass === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>Class 1 (Blue)</button>
            <button onClick={() => setActiveClass(0)} className={`px-3 py-1.5 text-sm rounded ${activeClass === 0 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>Class 0 (Red)</button>
          </div>
          <button onClick={handleReset} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Reset</button>
          <button onClick={handleRandomData} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Random Data</button>
          <button onClick={() => { if (isTraining) stopTraining(); else startTraining(); }} disabled={trainResult.history.length === 0 || points.length < 2} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">{toggleButton}</button>
          <button onClick={() => setShowLossChart(v => !v)} className={`px-3 py-1.5 text-sm rounded ${showLossChart ? 'bg-purple-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Loss History</button>
          <button onClick={() => setShowConfusionMatrix(v => !v)} className={`px-3 py-1.5 text-sm rounded ${showConfusionMatrix ? 'bg-purple-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Confusion</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4">
            <div onClick={handleCanvasClick} className="relative w-full max-w-[520px] aspect-square bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair select-none">
              <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full" />
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
                <g stroke="#e5e7eb" strokeWidth="1">
                  {[...Array(11)].map((_, i) => (<React.Fragment key={i}><line x1={(i * WIDTH) / 10} y1={0} x2={(i * WIDTH) / 10} y2={HEIGHT} /><line x1={0} y1={(i * HEIGHT) / 10} x2={WIDTH} y2={(i * HEIGHT) / 10} /></React.Fragment>))}
                </g>
                {TICK_VALUES.map(v => (<React.Fragment key={`t-${v}`}><text x={(v / RANGE) * WIDTH} y={HEIGHT - 4} textAnchor="middle" fontSize="10" fill="#6b7280">{v}</text><text x={4} y={HEIGHT - (v / RANGE) * HEIGHT + 3} textAnchor="start" fontSize="10" fill="#6b7280">{v}</text></React.Fragment>))}
                <text x={WIDTH / 2} y={HEIGHT - 16} textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="500">x</text>
                <text x={14} y={HEIGHT / 2 + 4} textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="500" transform={`rotate(-90, 14, ${HEIGHT / 2})`}>y</text>

                {boundaryPoints && (
                  <line
                    x1={toSVGX(boundaryPoints[0].x)}
                    y1={toSVGY(boundaryPoints[0].y)}
                    x2={toSVGX(boundaryPoints[1].x)}
                    y2={toSVGY(boundaryPoints[1].y)}
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                )}

                {points.map((p, i) => (
                  <motion.g key={i} style={{ pointerEvents: 'auto' }}>
                    <motion.circle
                      cx={toSVGX(p.x)}
                      cy={toSVGY(p.y)}
                      r="6"
                      fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onContextMenu={(e) => handleRemovePoint(i, e)}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      whileHover={{ scale: 1.3 }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                    {hoveredPoint === i && (
                      <g>
                        <rect x={toSVGX(p.x) + 10} y={toSVGY(p.y) - 30} width="90" height="28" fill="white" stroke="#ccc" strokeWidth="1" rx="3" />
                        <text x={toSVGX(p.x) + 15} y={toSVGY(p.y) - 18} fontSize="9" fill="#333">
                          ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                        </text>
                        <text x={toSVGX(p.x) + 15} y={toSVGY(p.y) - 8} fontSize="9" fill="#666">
                          P={predict(p.x, p.y, currentParams).toFixed(3)}
                        </text>
                      </g>
                    )}
                  </motion.g>
                ))}

                {points.length === 0 && (
                  <>
                    <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="white" fillOpacity="0.85" rx="4" />
                    <text x={WIDTH / 2} y={HEIGHT / 2 - 10} textAnchor="middle" fontSize="14" fill="#6b7280">No data points yet</text>
                    <text x={WIDTH / 2} y={HEIGHT / 2 + 14} textAnchor="middle" fontSize="12" fill="#9ca3af">Select a class and click to add points</text>
                  </>
                )}
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-lg p-3 ${isTraining || animStep >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
              <h3 className="font-semibold text-sm mb-2">Model Performance</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Accuracy:</span><span className="font-mono">{confMatrix.accuracy.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Precision:</span><span className="font-mono">{confMatrix.precision.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Recall:</span><span className="font-mono">{confMatrix.recall.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">F1 Score:</span><span className="font-mono">{confMatrix.f1.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Log Loss:</span><span className="font-mono">{currentLoss.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Data Points:</span><span className="font-mono">{points.length}</span></div>
                {animStep >= 0 && (<div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-600"><span className="text-gray-500 dark:text-gray-400">Step:</span><span className="font-mono">{animStep + 1} / {trainResult.history.length}</span></div>)}
              </div>
            </div>

            {showConfusionMatrix && (
              <div className="rounded-lg p-3 bg-purple-50 dark:bg-purple-950/30">
                <h3 className="font-semibold text-sm mb-2">Confusion Matrix</h3>
                <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-center">
                    <div className="text-gray-500 dark:text-gray-400">True Neg</div>
                    <div className="font-mono text-lg">{confMatrix.tn}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-center">
                    <div className="text-gray-500 dark:text-gray-400">False Pos</div>
                    <div className="font-mono text-lg">{confMatrix.fp}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-center">
                    <div className="text-gray-500 dark:text-gray-400">False Neg</div>
                    <div className="font-mono text-lg">{confMatrix.fn}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 text-center">
                    <div className="text-gray-500 dark:text-gray-400">True Pos</div>
                    <div className="font-mono text-lg">{confMatrix.tp}</div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Predicted: cols, Actual: rows</p>
              </div>
            )}

            <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30">
              <h3 className="font-semibold text-sm mb-2">Decision Boundary</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">w₁:</span><span className="font-mono">{currentParams.w1.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">w₂:</span><span className="font-mono">{currentParams.w2.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">b (bias):</span><span className="font-mono">{currentParams.b.toFixed(4)}</span></div>
              </div>
              <p className="text-[10px] mt-2 text-gray-600 dark:text-gray-400 font-mono">P(y=1) = σ(w₁x + w₂y + b)</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Green line: w₁x + w₂y + b = 0</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Learning Rate: {learningRate.toFixed(3)}</label>
                <input type="range" min="0.01" max="1" step="0.01" value={learningRate} onChange={e => setLearningRate(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Iterations: {iterations}</label>
                <input type="range" min="50" max="500" step="50" value={iterations} onChange={e => setIterations(parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Regularization (λ): {regLambda.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.05" value={regLambda} onChange={e => setRegLambda(parseFloat(e.target.value))} className="w-full" />
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">L2 penalty prevents overfitting</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded space-y-1">
              <p className="font-semibold text-xs">Probability Heatmap:</p>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 bg-[rgb(239,246,255)] border" />
                <span>Class 0 (Low)</span>
                <div className="w-3 h-3 bg-[rgb(99,102,241)] border ml-2" />
                <span>Class 1 (High)</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showLossChart && trainResult.history.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
              <h3 className="font-semibold mb-1 text-sm">Training Progress (Log Loss over Iterations)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Loss should decrease. If it rises, lower the learning rate.</p>
              <div className="h-48 bg-gray-50 dark:bg-gray-900 rounded p-4">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                  <line x1="30" y1="0" x2="30" y2="130" stroke="#ccc" strokeWidth="1" />
                  <line x1="30" y1="130" x2="400" y2="130" stroke="#ccc" strokeWidth="1" />
                  {trainResult.history.length > 1 && (() => {
                    const maxLoss = Math.max(...trainResult.history.map(h => h.loss));
                    const minLoss = Math.min(...trainResult.history.map(h => h.loss));
                    const range = maxLoss - minLoss || 1;
                    const xScale = 360 / (trainResult.history.length - 1);
                    const pathData = trainResult.history.map((h, i) => {
                      const x = 35 + i * xScale;
                      const y = 120 - ((h.loss - minLoss) / range) * 110;
                      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                    }).join(' ');
                    return <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />;
                  })()}
                  <text x="200" y="148" textAnchor="middle" fontSize="10" fill="#666">Iteration</text>
                  <text x="10" y="70" textAnchor="middle" fontSize="10" fill="#666" transform="rotate(-90, 10, 70)">Loss</text>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <details className="group">
            <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
              How Logistic Regression Works
            </summary>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                Logistic regression models the <strong>probability</strong> that a data point belongs to class 1 using the <strong>sigmoid function</strong>:
              </p>
              <code className="block bg-white dark:bg-gray-800 p-2 rounded text-xs font-mono">
                P(y=1 | x) = σ(w₁x + w₂y + b) = 1 / (1 + e^(-(w₁x + w₂y + b)))
              </code>
              <p>
                The <strong>decision boundary</strong> (green dashed line) is where P(y=1) = 0.5, i.e., w₁x + w₂y + b = 0.
                Points on one side are classified as 0, on the other as 1.
              </p>
              <p>
                <strong>Gradient descent</strong> minimizes <strong>log loss</strong> (cross-entropy):
              </p>
              <code className="block bg-white dark:bg-gray-800 p-2 rounded text-xs font-mono">
                Loss = -(1/n) Σ [y·log(p) + (1-y)·log(1-p)]
              </code>
              <ul className="text-xs list-disc pl-4 space-y-0.5 text-gray-500 dark:text-gray-400">
                <li><strong>Precision</strong>: of predicted positives, how many are correct? TP/(TP+FP)</li>
                <li><strong>Recall</strong>: of actual positives, how many did we find? TP/(TP+FN)</li>
                <li><strong>F1 Score</strong>: harmonic mean of precision and recall</li>
                <li><strong>Regularization (λ)</strong>: penalizes large weights to prevent overfitting</li>
              </ul>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Class balance: {points.filter(p => p.label === 0).length} red, {points.filter(p => p.label === 1).length} blue
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
