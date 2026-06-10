'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine,
} from 'recharts';
import {
  Point, Coefficients, RegType, HistoryEntry,
  predict, computeMSE, computeStats, gradientDescent, olsClosedForm,
  computeBands, computeResiduals, sampleCurve, coeffsToFormula,
} from '@/features/machine-learning/utils/regressionUtils';
import { avg } from '@/features/machine-learning/utils/index';

const WIDTH = 480;
const HEIGHT = 480;
const RANGE = 10;

const TICK_VALUES = [0, 2, 4, 6, 8, 10];

function clampPoint(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function toSVGX(x: number): number {
  return (x / RANGE) * WIDTH;
}
function toSVGY(y: number): number {
  return HEIGHT - (y / RANGE) * HEIGHT;
}

function linearSample(coeffs: Coefficients, degree: number): { x1: number; y1: number; x2: number; y2: number } {
  if (degree === 1) {
    const y0 = predict(coeffs, 0);
    const y10 = predict(coeffs, RANGE);
    return {
      x1: 0, y1: clampPoint(y0, -RANGE, 2 * RANGE),
      x2: RANGE, y2: clampPoint(y10, -RANGE, 2 * RANGE),
    };
  }
  return { x1: 0, y1: 0, x2: RANGE, y2: RANGE };
}

export default function LinearRegressionPlayground() {
  // --- Data state ---
  const [points, setPoints] = useState<Point[]>([
    { x: 2, y: 3.5 }, { x: 3, y: 4.2 }, { x: 4, y: 5.8 },
    { x: 5, y: 4.9 }, { x: 6, y: 7.1 }, { x: 7, y: 8.0 },
    { x: 8, y: 9.2 },
  ]);

  // --- Hyper-parameter state ---
  const [learningRate, setLearningRate] = useState(0.01);
  const [iterations, setIterations] = useState(100);
  const [degree, setDegree] = useState(1);
  const [regType, setRegType] = useState<RegType>('none');
  const [regLambda, setRegLambda] = useState(0.1);

  // --- Training animation state ---
  const [isTraining, setIsTraining] = useState(false);
  const [animStep, setAnimStep] = useState(-1);
  const trainingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Display toggles ---
  const [showLossChart, setShowLossChart] = useState(false);
  const [showResidualPlot, setShowResidualPlot] = useState(false);
  const [showConfidenceBands, setShowConfidenceBands] = useState(false);
  const [showOlsSolution, setShowOlsSolution] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const stopTraining = useCallback(() => {
    if (trainingRef.current) { clearInterval(trainingRef.current); trainingRef.current = null; }
    setIsTraining(false);
  }, []);

  useEffect(() => { return () => stopTraining(); }, [stopTraining]);

  // --- Compute gradient descent ---
  const gdResult = useMemo(
    () => gradientDescent(points, learningRate, iterations, degree, regType, regLambda),
    [points, learningRate, iterations, degree, regType, regLambda],
  );

  const currentCoeffs: Coefficients = useMemo(() => {
    if (animStep >= 0) return gdResult.history[animStep].coeffs as Coefficients;
    return gdResult.coeffs as Coefficients;
  }, [gdResult, animStep]);

  const currentLoss = useMemo(
    () => (animStep >= 0 ? gdResult.history[animStep].loss : computeMSE(points, currentCoeffs)),
    [gdResult, animStep, points, currentCoeffs],
  );

  // --- Stats ---
  const stats = useMemo(() => computeStats(points, currentCoeffs), [points, currentCoeffs]);

  // --- OLS closed-form solution ---
  const olsCoeffs = useMemo(
    () => olsClosedForm(points, degree, regType, regLambda),
    [points, degree, regType, regLambda],
  );
  const olsStats = useMemo(() => computeStats(points, olsCoeffs), [points, olsCoeffs]);

  // --- Line / curve data ---
  const curvePoints = useMemo(() => {
    const raw = sampleCurve(currentCoeffs, 0, RANGE, degree === 1 ? 2 : 100);
    return raw.map(p => ({
      ...p,
      y: clampPoint(p.y, -RANGE, 2 * RANGE),
    }));
  }, [currentCoeffs, degree]);

  const olsCurvePoints = useMemo(() => {
    const raw = sampleCurve(olsCoeffs, 0, RANGE, degree === 1 ? 2 : 100);
    return raw.map(p => ({
      ...p,
      y: clampPoint(p.y, -RANGE, 2 * RANGE),
    }));
  }, [olsCoeffs, degree]);

  // --- Bands (confidence / prediction) ---
  const bands = useMemo(
    () => (degree === 1 ? computeBands(currentCoeffs, stats) : []),
    [currentCoeffs, stats, degree],
  );
  const olsBands = useMemo(
    () => (degree === 1 ? computeBands(olsCoeffs, olsStats) : []),
    [olsCoeffs, olsStats, degree],
  );

  // --- Residuals ---
  const residuals = useMemo(() => computeResiduals(points, currentCoeffs), [points, currentCoeffs]);

  // --- Formula string ---
  const formula = useMemo(() => coeffsToFormula(currentCoeffs), [currentCoeffs]);
  const olsFormula = useMemo(() => coeffsToOLSFormula(olsCoeffs, degree, regType), [olsCoeffs, degree, regType]);

  // --- Helper: "coefficients to formula with λ info"---
  function coeffsToOLSFormula(c: Coefficients, d: number, r: RegType): string {
    const base = coeffsToFormula(c);
    if (r === 'l2' && regLambda > 0) return `${base} (Ridge λ=${regLambda})`;
    return `OLS: ${base}`;
  }

  // --- Training controls ---
  const startTraining = useCallback(() => {
    stopTraining();
    setAnimStep(0);
    setIsTraining(true);
    const totalSteps = gdResult.history.length;
    let step = 0;
    trainingRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) { stopTraining(); setAnimStep(totalSteps - 1); return; }
      setAnimStep(step);
    }, Math.max(30, Math.min(200, 4000 / totalSteps)));
  }, [gdResult.history.length, stopTraining]);

  useEffect(() => { setAnimStep(-1); }, [points, learningRate, iterations, degree, regType, regLambda]);

  // --- Handlers ---
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }]);
  }, []);

  const handleRemovePoint = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (points.length <= 1) return;
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, [points.length]);

  const handleReset = useCallback(() => {
    stopTraining(); setAnimStep(-1);
    setPoints([{ x: 2, y: 3.5 }, { x: 3, y: 4.2 }, { x: 4, y: 5.8 }, { x: 5, y: 4.9 }, { x: 6, y: 7.1 }, { x: 7, y: 8.0 }, { x: 8, y: 9.2 }]);
  }, [stopTraining]);

  const handleRandomData = useCallback(() => {
    stopTraining(); setAnimStep(-1);
    const newPoints: Point[] = [];
    const trueM = 0.8 + Math.random() * 0.8;
    const trueB = 1 + Math.random() * 3;
    const n = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      const x = 1 + Math.random() * (RANGE - 2);
      const y = trueM * x + trueB + (Math.random() - 0.5) * 4;
      newPoints.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
    setPoints(newPoints);
  }, [stopTraining]);

  const handleAddOutlier = useCallback(() => {
    stopTraining(); setAnimStep(-1);
    const x = 1 + Math.random() * 8;
    const yMean = points.reduce((s, p) => s + p.y, 0) / points.length;
    const offset = 5 + Math.random() * 5;
    const y = yMean + (Math.random() > 0.5 ? offset : -offset);
    setPoints(prev => [...prev, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }]);
  }, [points, stopTraining]);

  const xVals = useMemo(() => points.map(p => p.x), [points]);
  const yVals = useMemo(() => points.map(p => p.y), [points]);

  const toggleButton = isTraining ? 'Pause Training' : (animStep >= 0 ? 'Replay Training' : 'Start Training');

  // --- SVG rendering ---
  const renderBand = (bandData: typeof bands, prefix: string, ciColor: string, piColor: string) => {
    if (bandData.length < 2) return null;
    const ciPath = bandData.map((p, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${cmd}${toSVGX(p.x)},${toSVGY(p.ciLow)}`;
    }).join(' ') + ' ' + bandData.slice().reverse().map((p, i) => {
      const cmd = i === 0 ? 'L' : 'L';
      return `${cmd}${toSVGX(p.x)},${toSVGY(p.ciHigh)}`;
    }).join(' ') + ' Z';

    const piPath = bandData.map((p, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${cmd}${toSVGX(p.x)},${toSVGY(p.piLow)}`;
    }).join(' ') + ' ' + bandData.slice().reverse().map((p, i) => {
      const cmd = i === 0 ? 'L' : 'L';
      return `${cmd}${toSVGX(p.x)},${toSVGY(p.piHigh)}`;
    }).join(' ') + ' Z';

    return (
      <>
        <path d={piPath} fill={piColor} opacity={0.15} />
        <path d={ciPath} fill={ciColor} opacity={0.25} />
      </>
    );
  };

  const renderCurve = (pts: typeof curvePoints, color: string, strokeWidth = 3, dasharray?: string) => {
    if (pts.length < 2) return null;
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toSVGX(p.x)},${toSVGY(p.y)}`).join(' ');
    return <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dasharray} />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-4">Linear Regression Playground</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Click to add points. Right-click a point to remove it. Watch gradient descent find the best-fit curve.
        </p>

        {/* Compact toolbar */}
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <button onClick={handleReset} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Reset</button>
          <button onClick={handleRandomData} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Random Data</button>
          <button onClick={handleAddOutlier} disabled={points.length < 3} className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">+ Outlier</button>
          <button onClick={() => { if (isTraining) stopTraining(); else startTraining(); }} disabled={gdResult.history.length === 0 || points.length === 0} className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">{toggleButton}</button>
          <button onClick={() => setShowLossChart(v => !v)} className={`px-3 py-1.5 text-sm rounded ${showLossChart ? 'bg-purple-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Loss History</button>
          <button onClick={() => setShowResidualPlot(v => !v)} className={`px-3 py-1.5 text-sm rounded ${showResidualPlot ? 'bg-purple-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Residuals</button>
          <button onClick={() => setShowConfidenceBands(v => !v)} className={`px-3 py-1.5 text-sm rounded ${showConfidenceBands ? 'bg-purple-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>CI Bands</button>
          <button onClick={() => setShowOlsSolution(v => !v)} className={`px-3 py-1.5 text-sm rounded ${showOlsSolution ? 'bg-purple-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>OLS</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_380px] gap-6">
          {/* --- SVG CANVAS --- */}
          <div className="space-y-4">
            <div ref={canvasRef} onClick={handleCanvasClick} className="relative w-full max-w-[520px] aspect-square bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair select-none">
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Grid */}
                <g stroke="#e5e7eb" strokeWidth="1">
                  {[...Array(11)].map((_, i) => (<React.Fragment key={i}><line x1={(i * WIDTH) / 10} y1={0} x2={(i * WIDTH) / 10} y2={HEIGHT} /><line x1={0} y1={(i * HEIGHT) / 10} x2={WIDTH} y2={(i * HEIGHT) / 10} /></React.Fragment>))}
                </g>
                {/* Axis ticks */}
                {TICK_VALUES.map(v => (<React.Fragment key={`t-${v}`}><text x={(v / RANGE) * WIDTH} y={HEIGHT - 4} textAnchor="middle" fontSize="10" fill="#6b7280">{v}</text><text x={4} y={HEIGHT - (v / RANGE) * HEIGHT + 3} textAnchor="start" fontSize="10" fill="#6b7280">{v}</text></React.Fragment>))}
                {/* Axis labels */}
                <text x={WIDTH / 2} y={HEIGHT - 16} textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="500">x</text>
                <text x={14} y={HEIGHT / 2 + 4} textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="500" transform={`rotate(-90, 14, ${HEIGHT / 2})`}>y</text>

                {/* CI / PI bands */}
                {showConfidenceBands && degree === 1 && renderBand(bands, 'gd', '#3b82f6', '#3b82f6')}
                {showConfidenceBands && showOlsSolution && degree === 1 && renderBand(olsBands, 'ols', '#10b981', '#10b981')}

                {/* OLS solution */}
                {showOlsSolution && renderCurve(olsCurvePoints, '#10b981', 2, '6 3')}

                {/* Regression curve */}
                {renderCurve(curvePoints, '#3b82f6', 3)}

                {/* Data points */}
                {points.map((p, i) => (<motion.circle key={i} cx={(p.x / RANGE) * WIDTH} cy={HEIGHT - (p.y / RANGE) * HEIGHT} r="6" fill="#ef4444" stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }} onContextMenu={(e) => handleRemovePoint(i, e)} whileHover={{ scale: 1.3, fill: '#dc2626' }} initial={{ scale: 0 }} animate={{ scale: 1 }} />))}

                {/* Empty state */}
                {points.length === 0 && (<><rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="white" fillOpacity="0.85" rx="4" /><text x={WIDTH / 2} y={HEIGHT / 2 - 10} textAnchor="middle" fontSize="14" fill="#6b7280">No data points yet</text><text x={WIDTH / 2} y={HEIGHT / 2 + 14} textAnchor="middle" fontSize="12" fill="#9ca3af">Click anywhere on the grid to add points</text></>)}
              </svg>
            </div>
          </div>

          {/* --- SIDEBAR --- */}
          <div className="space-y-4">
            {/* Model parameters */}
            <div className={`rounded-lg p-3 ${isTraining || animStep >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
              <h3 className="font-semibold text-sm mb-2">Model (Gradient Descent)</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Formula:</span><span className="font-mono text-right ml-2">{formula}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Loss (MSE):</span><span className="font-mono">{currentLoss.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">R²:</span><span className="font-mono">{stats.r2.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Adj. R²:</span><span className="font-mono">{stats.adjR2.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">RMSE:</span><span className="font-mono">{stats.rmse.toFixed(4)}</span></div>
                {animStep >= 0 && (<div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-600"><span className="text-gray-500 dark:text-gray-400">Step:</span><span className="font-mono">{animStep + 1} / {gdResult.history.length}</span></div>)}
                {points.length > 0 && degree === 1 && stats.k <= points.length && (<div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">DF:</span><span className="font-mono">{points.length - stats.k}</span></div>)}
              </div>
            </div>

            {/* OLS stats */}
            {showOlsSolution && (<div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30">
              <h3 className="font-semibold text-sm mb-2">OLS (Closed Form) {regType === 'l2' ? 'Ridge' : 'OLS'}</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Formula:</span><span className="font-mono text-right ml-2">{coeffsToFormula(olsCoeffs)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">MSE:</span><span className="font-mono">{olsStats.mse.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">R²:</span><span className="font-mono">{olsStats.r2.toFixed(4)}</span></div>
              </div>
            </div>)}

            {/* Hyper-parameters */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Learning Rate (α): {learningRate.toFixed(3)}</label>
                <input type="range" min="0.001" max="0.1" step="0.001" value={learningRate} onChange={e => setLearningRate(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Iterations: {iterations}</label>
                <input type="range" min="10" max="500" step="10" value={iterations} onChange={e => setIterations(parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Polynomial Degree: {degree}</label>
                <input type="range" min="1" max="5" step="1" value={degree} onChange={e => setDegree(parseInt(e.target.value))} className="w-full" />
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Degree 1 = linear line; higher = polynomial curve</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Regularization</label>
                  <select value={regType} onChange={e => setRegType(e.target.value as RegType)} className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded p-1.5 bg-white dark:bg-gray-800">
                    <option value="none">None</option>
                    <option value="l2">L2 (Ridge)</option>
                    <option value="l1">L1 (LASSO)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">λ (strength): {regLambda.toFixed(2)}</label>
                  <input type="range" min="0" max="2" step="0.05" value={regLambda} onChange={e => setRegLambda(parseFloat(e.target.value))} disabled={regType === 'none'} className="w-full" />
                </div>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 space-y-0.5">
                <p><strong>L2 (Ridge)</strong>: Shrinks coefficients, keeps all features. Good for multicollinearity.</p>
                <p><strong>L1 (LASSO)</strong>: Can zero out coefficients. Good for feature selection.</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded space-y-0.5">
              <p>Data points: <strong>{points.length}</strong></p>
              <p>Mean x: {xVals.length ? avg(xVals).toFixed(2) : '—'} &middot; Mean y: {yVals.length ? avg(yVals).toFixed(2) : '—'}</p>
            </div>
          </div>
        </div>

        {/* --- Residual plot --- */}
        <AnimatePresence>
          {showResidualPlot && residuals.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
              <h3 className="font-semibold mb-1 text-sm">Residual Plot</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Fitted values vs residuals. Ideally: random scatter around y=0 with no pattern.</p>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fitted" name="Fitted" label={{ value: 'Fitted (ŷ)', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="residual" name="Residual" label={{ value: 'Residual (y − ŷ)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? v.toFixed(4) : v} />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="4 2" />
                  <Scatter data={residuals} fill="#ef4444" />
                </ScatterChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Loss chart --- */}
        <AnimatePresence>
          {showLossChart && gdResult.history.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
              <h3 className="font-semibold mb-1 text-sm">Training Progress (Loss over Iterations)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">MSE should decrease as gradient descent runs. A flat or rising line means divergence.</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={gdResult.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="iteration" label={{ value: 'Iteration', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'MSE Loss', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(v) => typeof v === 'number' ? v.toFixed(6) : v} />
                  <Line type="monotone" dataKey="loss" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  {animStep >= 0 && (<Line type="monotone" data={gdResult.history.slice(0, animStep + 1)} dataKey="loss" stroke="#7c3aed" strokeWidth={3} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}