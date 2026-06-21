'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

type ActivationFn = 'sigmoid' | 'relu' | 'tanh' | 'step';

const fmt = {
  param: (v: number) => v.toFixed(2),
  value: (v: number) => v.toFixed(4),
  coord: (v: number) => v.toFixed(2),
};

const ACTIVATIONS: Record<ActivationFn, { label: string; fn: (x: number) => number; derivative: (x: number) => number; color: string }> = {
  sigmoid: { label: 'Sigmoid', fn: (x) => 1 / (1 + Math.exp(-x)), derivative: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, color: '#6366F1' },
  relu: { label: 'ReLU', fn: (x) => Math.max(0, x), derivative: (x) => x > 0 ? 1 : 0, color: '#22C55E' },
  tanh: { label: 'Tanh', fn: (x) => Math.tanh(x), derivative: (x) => 1 - Math.tanh(x) ** 2, color: '#F59E0B' },
  step: { label: 'Step', fn: (x) => x >= 0 ? 1 : 0, derivative: () => 0, color: '#EF4444' },
};

interface Point { x: number; y: number; label: number }

interface GatePreset {
  name: string;
  description: string;
  points: Point[];
  solvable: boolean;
  recommended?: boolean;
}

const GATES: GatePreset[] = [
  { name: 'AND', description: '1 only when both inputs are 1. Linearly separable — good starting point.', solvable: true, recommended: true, points: [
    { x: 0.2, y: 0.2, label: 0 }, { x: 0.2, y: 0.8, label: 0 },
    { x: 0.8, y: 0.2, label: 0 }, { x: 0.8, y: 0.8, label: 1 },
  ]},
  { name: 'OR', description: '1 when at least one input is 1. Linearly separable.', solvable: true, points: [
    { x: 0.2, y: 0.2, label: 0 }, { x: 0.2, y: 0.8, label: 1 },
    { x: 0.8, y: 0.2, label: 1 }, { x: 0.8, y: 0.8, label: 1 },
  ]},
  { name: 'NAND', description: '0 only when both inputs are 1. Linearly separable.', solvable: true, points: [
    { x: 0.2, y: 0.2, label: 1 }, { x: 0.2, y: 0.8, label: 1 },
    { x: 0.8, y: 0.2, label: 1 }, { x: 0.8, y: 0.8, label: 0 },
  ]},
  { name: 'XOR', description: '1 when inputs differ. NOT linearly separable — single perceptron fails!', solvable: false, points: [
    { x: 0.2, y: 0.2, label: 0 }, { x: 0.2, y: 0.8, label: 1 },
    { x: 0.8, y: 0.2, label: 1 }, { x: 0.8, y: 0.8, label: 0 },
  ]},
];

const SVG_W = 420;
const SVG_H = 320;

function activate(x: number, fn: ActivationFn): number {
  return ACTIVATIONS[fn].fn(x);
}

function computeAccuracy(points: Point[], w1: number, w2: number, bias: number, activation: ActivationFn): number {
  if (points.length === 0) return 0;
  let correct = 0;
  for (const p of points) {
    const z = w1 * p.x + w2 * p.y + bias;
    const pred = activate(z, activation) >= 0.5 ? 1 : 0;
    if (pred === p.label) correct++;
  }
  return correct / points.length;
}

function computeLoss(points: Point[], w1: number, w2: number, bias: number, activation: ActivationFn): number {
  if (points.length === 0) return 0;
  let loss = 0;
  for (const p of points) {
    const z = w1 * p.x + w2 * p.y + bias;
    const a = activate(z, activation);
    const pred = Math.max(1e-7, Math.min(1 - 1e-7, a));
    loss += -(p.label * Math.log(pred) + (1 - p.label) * Math.log(1 - pred));
  }
  return loss / points.length;
}

export default function PerceptronPlayground() {
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(-0.5);
  const [bias, setBias] = useState(0.1);
  const [activation, setActivation] = useState<ActivationFn>('sigmoid');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const [points, setPoints] = useState<Point[]>([
    { x: 0.2, y: 0.8, label: 1 },
    { x: 0.4, y: 0.6, label: 1 },
    { x: 0.3, y: 0.3, label: 0 },
    { x: 0.7, y: 0.2, label: 0 },
    { x: 0.8, y: 0.9, label: 1 },
    { x: 0.6, y: 0.1, label: 0 },
  ]);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainSpeed, setTrainSpeed] = useState(5); // 1=slow, 10=fast
  const [epoch, setEpoch] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const trainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs for latest weights — avoids stale closures in interval callbacks
  const w1Ref = useRef(w1);
  const w2Ref = useRef(w2);
  const biasRef = useRef(bias);
  const activationRef = useRef(activation);
  const pointsRef = useRef(points);
  useEffect(() => { w1Ref.current = w1; }, [w1]);
  useEffect(() => { w2Ref.current = w2; }, [w2]);
  useEffect(() => { biasRef.current = bias; }, [bias]);
  useEffect(() => { activationRef.current = activation; }, [activation]);
  useEffect(() => { pointsRef.current = points; }, [points]);

  // Fix #1: Selected point computation for neuron diagram
  const sp = selectedPoint !== null ? points[selectedPoint] : points[0];
  const zSelected = sp ? w1 * sp.x + w2 * sp.y + bias : w1 * 0.5 + w2 * 0.5 + bias;
  const aSelected = activate(zSelected, activation);

  const accuracy = useMemo(() => computeAccuracy(points, w1, w2, bias, activation), [points, w1, w2, bias, activation]);
  const loss = useMemo(() => computeLoss(points, w1, w2, bias, activation), [points, w1, w2, bias, activation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (trainRef.current) clearInterval(trainRef.current); };
  }, []);

  const loadPreset = useCallback((gate: GatePreset) => {
    setActivePreset(gate.name);
    setPoints(gate.points);
    setSelectedPoint(null);
    setW1(0.5);
    setW2(-0.5);
    setBias(0.1);
    setEpoch(0);
    setLossHistory([]);
    if (trainRef.current) { clearInterval(trainRef.current); trainRef.current = null; setIsTraining(false); }
  }, []);

  // Fix #7: Clear button resets weights too
  const clearAll = useCallback(() => {
    setActivePreset(null);
    setPoints([]);
    setSelectedPoint(null);
    setW1(0.5);
    setW2(-0.5);
    setBias(0.1);
    setEpoch(0);
    setLossHistory([]);
    if (trainRef.current) { clearInterval(trainRef.current); trainRef.current = null; setIsTraining(false); }
  }, []);

  const addPoint = useCallback((label: number) => {
    const x = Math.random() * 0.8 + 0.1;
    const y = Math.random() * 0.8 + 0.1;
    setPoints(prev => [...prev, { x, y, label }]);
    setActivePreset(null);
  }, []);

  const trainStep = useCallback(() => {
    const lr = 0.5;
    const curW1 = w1Ref.current;
    const curW2 = w2Ref.current;
    const curBias = biasRef.current;
    const curAct = activationRef.current;
    const curPts = pointsRef.current;

    let newW1 = curW1, newW2 = curW2, newBias = curBias;
    for (const p of curPts) {
      const z = newW1 * p.x + newW2 * p.y + newBias;
      const a = activate(z, curAct);
      const pred = a >= 0.5 ? 1 : 0;
      const error = p.label - pred;
      newW1 += lr * error * p.x;
      newW2 += lr * error * p.y;
      newBias += lr * error;
    }
    setW1(newW1);
    setW2(newW2);
    setBias(newBias);
    setEpoch(prev => prev + 1);
    const curLoss = computeLoss(curPts, curW1, newW2, newBias, curAct);
    setLossHistory(prev => [...prev.slice(-99), curLoss]);
  }, []);

  // Fix #2: Speed mapping — higher slider = faster training
  const trainInterval = useMemo(() => Math.round(1000 / trainSpeed), [trainSpeed]);

  const startTraining = useCallback(() => {
    if (isTraining) {
      if (trainRef.current) clearInterval(trainRef.current);
      trainRef.current = null;
      setIsTraining(false);
      return;
    }
    setIsTraining(true);
    trainRef.current = setInterval(trainStep, trainInterval);
  }, [isTraining, trainInterval, trainStep]);

  const resetTraining = useCallback(() => {
    if (trainRef.current) clearInterval(trainRef.current);
    trainRef.current = null;
    setIsTraining(false);
    setW1(0.5);
    setW2(-0.5);
    setBias(0.1);
    setEpoch(0);
    setLossHistory([]);
  }, []);

  // Adjust speed without restarting
  useEffect(() => {
    if (isTraining && trainRef.current) {
      clearInterval(trainRef.current);
      trainRef.current = setInterval(trainStep, trainInterval);
    }
  }, [trainInterval, isTraining, trainStep]);

  // Fix #4: Decision boundary — handle w₂ ≈ 0 case
  const boundaryVisible = Math.abs(w1) > 0.01 || Math.abs(w2) > 0.01;

  return (
    <div className="space-y-6">
      {/* Fix #8: Preset Gates with guidance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Preset Logic Gates</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Start with AND (linearly separable), then try XOR (impossible for a single perceptron)</p>
        <div className="flex flex-wrap gap-2">
          {GATES.map(gate => (
            <button key={gate.name} onClick={() => loadPreset(gate)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activePreset === gate.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {gate.name}
              {!gate.solvable && <span className="ml-1 text-[10px]">⚠️</span>}
              {gate.recommended && <span className="ml-1 text-[9px] opacity-60">(recommended)</span>}
            </button>
          ))}
          <button onClick={clearAll}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            Clear
          </button>
        </div>
        {activePreset && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {GATES.find(g => g.name === activePreset)?.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Neuron Diagram + Activation Graph */}
        <div className="space-y-4">
          {/* Fix #1: Neuron Diagram — shows selected point computation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Neuron Computation</h3>
              {sp && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  Point ({fmt.coord(sp.x)}, {fmt.coord(sp.y)}) · Class {sp.label}
                </span>
              )}
            </div>
            <svg viewBox="0 0 360 160" className="w-full">
              {/* Input labels */}
              <text x={30} y={45} fontSize={12} fill="#6B7280" fontWeight="bold">x₁</text>
              <text x={30} y={115} fontSize={12} fill="#6B7280" fontWeight="bold">x₂</text>

              {/* Input values from selected point */}
              {sp && (
                <>
                  <text x={14} y={45} fontSize={9} fill="#9CA3AF">{fmt.coord(sp.x)}</text>
                  <text x={14} y={115} fontSize={9} fill="#9CA3AF">{fmt.coord(sp.y)}</text>
                </>
              )}

              {/* Weight labels on connections */}
              <text x={80} y={38} fontSize={10} fill="#6366F1" fontWeight="bold">×{fmt.param(w1)}</text>
              <text x={80} y={108} fontSize={10} fill="#6366F1" fontWeight="bold">×{fmt.param(w2)}</text>

              {/* Connections */}
              <line x1={50} y1={40} x2={140} y2={80} stroke="#6366F1" strokeWidth={2} />
              <line x1={50} y1={120} x2={140} y2={80} stroke="#6366F1" strokeWidth={2} />

              {/* Bias arrow */}
              <line x1={140} y1={140} x2={140} y2={95} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4,3" />
              <text x={148} y={150} fontSize={9} fill="#F59E0B" fontWeight="bold">b={fmt.param(bias)}</text>

              {/* Sum node */}
              <circle cx={160} cy={80} r={22} fill="#EEF2FF" stroke="#6366F1" strokeWidth={2} />
              <text x={160} y={75} textAnchor="middle" fontSize={10} fill="#3730A3" fontWeight="bold">Σ</text>
              <text x={160} y={90} textAnchor="middle" fontSize={9} fill="#6366F1">z={fmt.value(zSelected)}</text>

              {/* Arrow to activation */}
              <line x1={182} y1={80} x2={210} y2={80} stroke="#6366F1" strokeWidth={2} markerEnd="url(#arrowhead)" />

              {/* Activation node */}
              <rect x={212} y={55} width={60} height={50} rx={8} fill="#F0FDF4" stroke="#22C55E" strokeWidth={2} />
              <text x={242} y={75} textAnchor="middle" fontSize={10} fill="#166534" fontWeight="bold">{ACTIVATIONS[activation].label}</text>
              <text x={242} y={92} textAnchor="middle" fontSize={9} fill="#22C55E">σ={fmt.value(aSelected)}</text>

              {/* Arrow to output */}
              <line x1={272} y1={80} x2={310} y2={80} stroke="#22C55E" strokeWidth={2} markerEnd="url(#arrowhead-green)" />

              {/* Output */}
              <text x={330} y={84} textAnchor="middle" fontSize={14} fill={aSelected >= 0.5 ? '#22C55E' : '#EF4444'} fontWeight="bold">
                {aSelected >= 0.5 ? '1' : '0'}
              </text>

              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="#6366F1" />
                </marker>
                <marker id="arrowhead-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="#22C55E" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Activation Function Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Activation Function</h3>
            <svg viewBox="0 0 300 120" className="w-full">
              <rect width={300} height={120} fill="rgb(243 244 246)" rx="6" />

              {/* Axes */}
              <line x1={50} y1={60} x2={280} y2={60} stroke="#D1D5DB" strokeWidth={1} />
              <line x1={150} y1={10} x2={150} y2={110} stroke="#D1D5DB" strokeWidth={1} />

              {/* Grid */}
              {[20, 40, 80, 100].map(y => (
                <line key={y} x1={50} y1={y} x2={280} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />
              ))}
              {[70, 90, 110, 130, 170, 190, 210, 230].map(x => (
                <line key={x} x1={x} y1={10} x2={x} y2={110} stroke="#E5E7EB" strokeWidth={0.5} />
              ))}

              {/* Activation curve */}
              <polyline
                points={Array.from({ length: 200 }, (_, i) => {
                  const x = 50 + (i / 199) * 230;
                  const zVal = (i / 199) * 6 - 3;
                  const aVal = ACTIVATIONS[activation].fn(zVal);
                  const y = 110 - (aVal / 1.2) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={ACTIVATIONS[activation].color}
                strokeWidth={2.5}
              />

              {/* Current z point */}
              {(() => {
                const zClamped = Math.max(-3, Math.min(3, zSelected));
                const px = 50 + ((zClamped + 3) / 6) * 230;
                const py = 110 - (aSelected / 1.2) * 100;
                return (
                  <>
                    <line x1={px} y1={60} x2={px} y2={py} stroke="#6366F1" strokeWidth={1.5} strokeDasharray="3,3" />
                    <line x1={50} y1={py} x2={px} y2={py} stroke="#6366F1" strokeWidth={1.5} strokeDasharray="3,3" />
                    <circle cx={px} cy={py} r={5} fill="#6366F1" stroke="white" strokeWidth={2} />
                    <text x={px} y={115} textAnchor="middle" fontSize={8} fill="#6366F1">z={fmt.value(zSelected)}</text>
                    <text x={45} y={py + 3} textAnchor="end" fontSize={8} fill="#6366F1">{fmt.value(aSelected)}</text>
                  </>
                );
              })()}

              {/* Labels */}
              <text x={150} y={118} textAnchor="middle" fontSize={8} fill="#9CA3AF">z (input)</text>
              <text x={12} y={60} textAnchor="middle" fontSize={8} fill="#9CA3AF">a</text>
              <text x={60} y={105} fontSize={7} fill="#9CA3AF">-3</text>
              <text x={265} y={105} fontSize={7} fill="#9CA3AF">+3</text>
            </svg>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(ACTIVATIONS) as ActivationFn[]).map(key => (
                <button key={key} onClick={() => setActivation(key)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${activation === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {ACTIVATIONS[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Decision Boundary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Decision Boundary</h3>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showHeatmap} onChange={() => setShowHeatmap(!showHeatmap)} className="rounded w-3 h-3" />
                Heatmap
              </label>
              <label className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showVectors} onChange={() => setShowVectors(!showVectors)} className="rounded w-3 h-3" />
                Weights
              </label>
            </div>
          </div>
          {/* Fix #9: Hint for adding points */}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">Click on the plot to add a point, or use the buttons below</p>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
            <defs>
              <clipPath id="plot-clip">
                <rect x={0} y={0} width={SVG_W} height={SVG_H} rx={8} />
              </clipPath>
            </defs>

            <rect width={SVG_W} height={SVG_H} fill="rgb(243 244 246)" rx="8" clipPath="url(#plot-clip)" />

            {/* Probability heatmap */}
            {showHeatmap && (
              <g clipPath="url(#plot-clip)">
                {Array.from({ length: 40 }, (_, row) =>
                  Array.from({ length: 50 }, (_, col) => {
                    const px = col / 49;
                    const py = row / 39;
                    const z = w1 * px + w2 * py + bias;
                    const a = activate(z, activation);
                    const r = Math.round((1 - a) * 239 + a * 34);
                    const g = Math.round((1 - a) * 68 + a * 197);
                    const b2 = Math.round((1 - a) * 68 + a * 94);
                    return (
                      <rect key={`${row}-${col}`}
                        x={col * (SVG_W / 50)} y={row * (SVG_H / 40)}
                        width={SVG_W / 50 + 1} height={SVG_H / 40 + 1}
                        fill={`rgba(${r},${g},${b2},0.25)`} />
                    );
                  })
                )}
              </g>
            )}

            {/* Fix #5: Weight vectors with labeled origin */}
            {showVectors && (
              <g>
                <line x1={SVG_W / 2} y1={SVG_H / 2}
                  x2={SVG_W / 2 + w1 * 60} y2={SVG_H / 2}
                  stroke="#6366F1" strokeWidth={2.5} markerEnd="url(#arrow-v)" />
                <line x1={SVG_W / 2} y1={SVG_H / 2}
                  x2={SVG_W / 2} y2={SVG_H / 2 + w2 * 60}
                  stroke="#F59E0B" strokeWidth={2.5} markerEnd="url(#arrow-w)" />
                <text x={SVG_W / 2 + w1 * 60 + (w1 >= 0 ? 8 : -8)} y={SVG_H / 2 - 6}
                  fontSize={9} fill="#6366F1" fontWeight="bold" textAnchor={w1 >= 0 ? 'start' : 'end'}>w₁</text>
                <text x={SVG_W / 2 + 8} y={SVG_H / 2 + w2 * 60 + (w2 >= 0 ? 14 : -6)}
                  fontSize={9} fill="#F59E0B" fontWeight="bold">w₂</text>
                <circle cx={SVG_W / 2} cy={SVG_H / 2} r={3} fill="#6B7280" />
                <text x={SVG_W / 2 + 6} y={SVG_H / 2 - 6} fontSize={7} fill="#9CA3AF">center</text>
                <defs>
                  <marker id="arrow-v" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6" fill="#6366F1" />
                  </marker>
                  <marker id="arrow-w" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6" fill="#F59E0B" />
                  </marker>
                </defs>
              </g>
            )}

            {/* Fix #4: Decision boundary — handle w₂ ≈ 0 */}
            {boundaryVisible && Math.abs(w2) > 0.01 && (
              <line
                x1={0} y1={((-bias) / w2) * SVG_H}
                x2={SVG_W} y2={((-bias - w1) / w2) * SVG_H}
                stroke="#6366F1" strokeWidth={2.5} strokeDasharray="6,4"
              />
            )}
            {boundaryVisible && Math.abs(w2) <= 0.01 && Math.abs(w1) > 0.01 && (
              <line
                x1={(-bias / w1) * SVG_W} y1={0}
                x2={(-bias / w1) * SVG_W} y2={SVG_H}
                stroke="#6366F1" strokeWidth={2.5} strokeDasharray="6,4"
              />
            )}
            {!boundaryVisible && (
              <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fontSize={11} fill="#9CA3AF">
                w₁ = w₂ = 0 — no boundary
              </text>
            )}

            {/* Data points — Fix #1: clickable to select */}
            {points.map((p, i) => {
              const pred = activate(w1 * p.x + w2 * p.y + bias, activation) >= 0.5 ? 1 : 0;
              const correct = pred === p.label;
              const isSelected = selectedPoint === i;
              return (
                <g key={i} onClick={() => setSelectedPoint(i)} style={{ cursor: 'pointer' }}>
                  <circle cx={p.x * SVG_W} cy={p.y * SVG_H} r={isSelected ? 10 : 7}
                    fill={p.label === 1 ? '#22C55E' : '#EF4444'}
                    stroke={isSelected ? '#6366F1' : correct ? 'white' : '#FBBF24'}
                    strokeWidth={isSelected ? 3 : correct ? 2 : 3} />
                  {!correct && (
                    <text x={p.x * SVG_W + 10} y={p.y * SVG_H - 8} fontSize={12} fill="#FBBF24" fontWeight="bold">✗</text>
                  )}
                  {isSelected && (
                    <circle cx={p.x * SVG_W} cy={p.y * SVG_H} r={13} fill="none" stroke="#6366F1" strokeWidth={1.5} strokeDasharray="3,2" />
                  )}
                </g>
              );
            })}

            {/* Legend */}
            <g transform={`translate(10, ${SVG_H - 45})`}>
              <circle cx={5} cy={5} r={4} fill="#22C55E" />
              <text x={14} y={8} fontSize={8} fill="#6B7280">Class 1</text>
              <circle cx={70} cy={5} r={4} fill="#EF4444" />
              <text x={79} y={8} fontSize={8} fill="#6B7280">Class 0</text>
              <line x1={135} y1={5} x2={155} y2={5} stroke="#6366F1" strokeWidth={2} strokeDasharray="4,3" />
              <text x={160} y={8} fontSize={8} fill="#6B7280">Boundary</text>
            </g>
          </svg>

          <div className="flex gap-2 mt-3">
            <button onClick={() => addPoint(1)} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer">
              + Class 1
            </button>
            <button onClick={() => addPoint(0)} className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer">
              + Class 0
            </button>
          </div>
        </div>

        {/* Right: Controls + Metrics */}
        <div className="space-y-4">
          {/* Fix #10: Parameters with context */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Parameters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>w₁ (input 1 weight)</span><strong>{fmt.param(w1)}</strong>
                </label>
                <input type="range" min="-3" max="3" step="0.05" value={w1} onChange={(e) => setW1(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                <p className="text-[9px] text-gray-400 dark:text-gray-500">Controls tilt of boundary. 0 = vertical line.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>w₂ (input 2 weight)</span><strong>{fmt.param(w2)}</strong>
                </label>
                <input type="range" min="-3" max="3" step="0.05" value={w2} onChange={(e) => setW2(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                <p className="text-[9px] text-gray-400 dark:text-gray-500">Controls tilt of boundary. 0 = horizontal line.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>b (bias)</span><strong>{fmt.param(bias)}</strong>
                </label>
                <input type="range" min="-3" max="3" step="0.05" value={bias} onChange={(e) => setBias(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                <p className="text-[9px] text-gray-400 dark:text-gray-500">Shifts boundary left/right or up/down.</p>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Metrics</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <span className="text-xs text-green-500 dark:text-green-400 block">Accuracy</span>
                <strong className="text-lg text-green-700 dark:text-green-300">{(accuracy * 100).toFixed(0)}%</strong>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <span className="text-xs text-red-500 dark:text-red-400 block">Loss</span>
                <strong className="text-lg text-red-700 dark:text-red-300">{fmt.value(loss)}</strong>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2 text-center">
                <span className="text-xs text-indigo-500 dark:text-indigo-400 block">Epoch</span>
                <strong className="text-lg text-indigo-700 dark:text-indigo-300">{epoch}</strong>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <span className="text-xs text-amber-500 dark:text-amber-400 block">Misclassified</span>
                <strong className="text-lg text-amber-700 dark:text-amber-300">{points.length - Math.round(accuracy * points.length)}</strong>
              </div>
            </div>

            {/* Fix #6: Mini loss chart with axes */}
            {lossHistory.length > 1 && (
              <div className="mt-3">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Loss over epochs</p>
                <svg viewBox="0 0 200 55" className="w-full">
                  <rect width={200} height={55} fill="rgb(243 244 246)" rx={4} />
                  {/* Y-axis */}
                  <line x1={25} y1={5} x2={25} y2={42} stroke="#D1D5DB" strokeWidth={0.5} />
                  {/* X-axis */}
                  <line x1={25} y1={42} x2={195} y2={42} stroke="#D1D5DB" strokeWidth={0.5} />
                  {/* Y-axis labels */}
                  <text x={22} y={10} textAnchor="end" fontSize={6} fill="#9CA3AF">max</text>
                  <text x={22} y={42} textAnchor="end" fontSize={6} fill="#9CA3AF">0</text>
                  {/* X-axis label */}
                  <text x={110} y={52} textAnchor="middle" fontSize={6} fill="#9CA3AF">epoch →</text>
                  {/* Loss line */}
                  {lossHistory.length > 1 && (
                    <polyline
                      points={lossHistory.map((v, i) => {
                        const maxL = Math.max(...lossHistory, 1);
                        const x = 28 + (i / (lossHistory.length - 1)) * 164;
                        const y = 40 - (v / maxL) * 34;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none" stroke="#EF4444" strokeWidth={1.5}
                    />
                  )}
                </svg>
              </div>
            )}
          </div>

          {/* Training Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Training</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {/* Fix #3: Training button with pulse animation */}
                <button onClick={startTraining}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${isTraining ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {isTraining && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                  {isTraining ? '⏸ Pause' : '▶ Train'}
                </button>
                <button onClick={resetTraining}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  ↺ Reset
                </button>
              </div>
              {/* Fix #2: Speed slider — higher = faster */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Speed</span><strong>{trainSpeed}×</strong>
                </label>
                <input type="range" min="1" max="10" step="1" value={trainSpeed}
                  onChange={(e) => setTrainSpeed(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                <p className="text-[9px] text-gray-400 dark:text-gray-500">1× = slow (1 step/sec), 10× = fast</p>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
            <p>z = <span className="text-indigo-600 dark:text-indigo-400">{fmt.param(w1)}</span>·x₁ + <span className="text-indigo-600 dark:text-indigo-400">{fmt.param(w2)}</span>·x₂ + <span className="text-amber-600 dark:text-amber-400">{fmt.param(bias)}</span></p>
            <p>a = {ACTIVATIONS[activation].label}(z) = <span className="text-green-600 dark:text-green-400">{fmt.value(aSelected)}</span></p>
            <p>ŷ = a ≥ 0.5 ? 1 : 0 = <span className={`font-bold ${aSelected >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>{aSelected >= 0.5 ? 1 : 0}</span></p>
          </div>
        </div>
      </div>

      {/* Educational - Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* How It Works */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How It Works</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            The perceptron computes a weighted sum of inputs plus a bias: z = w₁x₁ + w₂x₂ + b. This is passed through an activation function to produce the output. The decision boundary is the line where z = 0. Points on one side are classified as class 0, the other as class 1. Try the XOR preset — you'll see no single line can separate the classes!
          </p>
        </div>

        {/* AI/ML Analogy */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
          <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Perceptron</span>
              <span>→ A single neuron in any neural network.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Weights</span>
              <span>→ The knobs the network turns during training.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Activation</span>
              <span>→ The decision maker. Without it, just a linear model.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">XOR Problem</span>
              <span>→ Led to multi-layer networks — birth of deep learning.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
