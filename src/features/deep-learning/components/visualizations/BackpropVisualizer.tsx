'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, useId } from 'react';

type Step = 'forward' | 'loss' | 'backward' | 'update';
type ActivationFn = 'sigmoid' | 'relu' | 'tanh';

const ACTIVATIONS: Record<ActivationFn, { label: string; fn: (x: number) => number; deriv: (x: number) => number; color: string }> = {
  sigmoid: { label: 'Sigmoid', fn: (x) => 1 / (1 + Math.exp(-x)), deriv: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, color: '#6366F1' },
  relu: { label: 'ReLU', fn: (x) => Math.max(0, x), deriv: (x) => x > 0 ? 1 : 0, color: '#22C55E' },
  tanh: { label: 'Tanh', fn: (x) => Math.tanh(x), deriv: (x) => 1 - Math.tanh(x) ** 2, color: '#F59E0B' },
};

const STEPS: { id: Step; label: string; desc: string }[] = [
  { id: 'forward', label: 'Forward', desc: 'Compute z = wx + b, then a = σ(z)' },
  { id: 'loss', label: 'Loss', desc: 'L = -(y·log(â) + (1-y)·log(1-â))' },
  { id: 'backward', label: 'Backward', desc: 'Compute gradients via chain rule' },
  { id: 'update', label: 'Update', desc: 'w = w - η·dL/dw, b = b - η·dL/db' },
];

interface Sample { x: number; y: number }

const fmt = {
  param: (v: number) => v.toFixed(2),
  value: (v: number) => v.toFixed(4),
  loss: (v: number) => v.toFixed(6),
  grad: (v: number) => v.toFixed(4),
};

function bceLoss(a: number, y: number): number {
  const p = Math.max(1e-7, Math.min(1 - 1e-7, a));
  return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
}

function lossSurface(w: number, b: number, samples: Sample[], act: ActivationFn): number {
  let total = 0;
  for (const s of samples) {
    const a = ACTIVATIONS[act].fn(w * s.x + b);
    total += bceLoss(a, s.y);
  }
  return total / samples.length;
}

export default function BackpropVisualizer() {
  const uid = useId().replace(/:/g, '');
  const [step, setStep] = useState<Step>('forward');
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(0.1);
  const [activation, setActivation] = useState<ActivationFn>('sigmoid');
  const [inputX, setInputX] = useState(2);
  const [inputY, setInputY] = useState(1);
  const [lr, setLr] = useState(0.5);
  const [batchMode, setBatchMode] = useState(false);
  const batchSamples: Sample[] = useMemo(() => [
    { x: inputX, y: inputY },
    { x: 1.5, y: 1 },
    { x: -1, y: 0 },
    { x: 0.5, y: 1 },
  ], [inputX, inputY]);

  const [history, setHistory] = useState<{ w: number; b: number; loss: number }[]>([]);
  const [autoTrain, setAutoTrain] = useState(false);
  const [trainSpeed, setTrainSpeed] = useState(3);
  const trainRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [gvDepth, setGvDepth] = useState(4);
  const [gvActivation, setGvActivation] = useState<ActivationFn>('sigmoid');

  const x = inputX;
  const y = inputY;
  const z = w * x + b;
  const a = ACTIVATIONS[activation].fn(z);
  const loss = bceLoss(a, y);
  const dLda = (a - y) / (a * (1 - a) + 1e-7);
  const daDz = ACTIVATIONS[activation].deriv(z);
  const dzDw = x;
  const dzDb = 1;
  const dw = dLda * daDz * dzDw;
  const db = dLda * daDz * dzDb;

  const batchGrads = useMemo(() => {
    if (!batchMode) return { dw, db };
    let sumDw = 0, sumDb = 0;
    for (const s of batchSamples) {
      const sz = w * s.x + b;
      const sa = ACTIVATIONS[activation].fn(sz);
      const sdz = sa - s.y;
      sumDw += sdz * s.x;
      sumDb += sdz;
    }
    return { dw: sumDw / batchSamples.length, db: sumDb / batchSamples.length };
  }, [batchMode, batchSamples, w, b, activation, dw, db]);

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const gvData = useMemo(() => {
    const layers: { label: string; gradient: number; magnitude: number }[] = [];
    let grad = 1;
    for (let i = 0; i < gvDepth; i++) {
      const z0 = 0.5;
      const localGrad = ACTIVATIONS[gvActivation].deriv(z0);
      grad *= localGrad;
      layers.push({ label: `Layer ${i + 1}`, gradient: grad, magnitude: Math.abs(grad) });
    }
    return layers;
  }, [gvDepth, gvActivation]);

  const lsWMin = -3, lsWMax = 3, lsBMin = -3, lsBMax = 3;
  const lsSvgW = 200, lsSvgH = 200;
  const lsToX = (ww: number) => ((ww - lsWMin) / (lsWMax - lsWMin)) * lsSvgW;
  const lsToY = (bb: number) => ((lsBMax - bb) / (lsBMax - lsBMin)) * lsSvgH;

  const lsContours = useMemo(() => {
    const pts: React.ReactNode[] = [];
    const samplesForLs = batchMode ? batchSamples : [{ x: inputX, y: inputY }];
    for (let iw = 0; iw < 40; iw++) {
      for (let ib = 0; ib < 40; ib++) {
        const ww = lsWMin + (iw / 39) * (lsWMax - lsWMin);
        const bb = lsBMin + (ib / 39) * (lsBMax - lsBMin);
        const v = lossSurface(ww, bb, samplesForLs, activation);
        const norm = Math.min(v / 3, 1);
        const r = Math.round(99 + norm * 140);
        const g = Math.round(102 - norm * 60);
        const bl = Math.round(241 - norm * 170);
        pts.push(<rect key={`ls-${iw}-${ib}`} x={lsToX(ww)} y={lsToY(bb)} width={lsSvgW / 40 + 1} height={lsSvgH / 40 + 1} fill={`rgb(${r},${g},${bl})`} />);
      }
    }
    return pts;
  }, [batchMode, batchSamples, inputX, inputY, activation]);

  const runStep = useCallback(() => {
    const nextIdx = (stepIndex + 1) % STEPS.length;
    setStep(STEPS[nextIdx].id);
    if (STEPS[nextIdx].id === 'update') {
      const g = batchMode ? batchGrads : { dw, db };
      const newW = w - lr * g.dw;
      const newB = b - lr * g.db;
      const newZ = newW * x + newB;
      const newA = ACTIVATIONS[activation].fn(newZ);
      const newLoss = bceLoss(newA, y);
      setW(newW);
      setB(newB);
      setHistory(prev => [...prev, { w: newW, b: newB, loss: newLoss }]);
    }
  }, [stepIndex, w, b, lr, x, y, activation, dw, db, batchMode, batchGrads]);

  const trainInterval = useMemo(() => Math.max(50, 600 / trainSpeed), [trainSpeed]);
  const autoTrainRef = useRef(false);
  const stepRef = useRef(runStep);
  useEffect(() => { stepRef.current = runStep; });

  const toggleAutoTrain = useCallback(() => {
    if (autoTrainRef.current) {
      autoTrainRef.current = false;
      if (trainRef.current) clearInterval(trainRef.current);
      trainRef.current = null;
      setAutoTrain(false);
      return;
    }
    autoTrainRef.current = true;
    setAutoTrain(true);
    trainRef.current = setInterval(() => {
      if (!autoTrainRef.current) return;
      stepRef.current();
    }, trainInterval);
  }, [trainInterval]);

  const reset = useCallback(() => {
    autoTrainRef.current = false;
    if (trainRef.current) clearInterval(trainRef.current);
    trainRef.current = null;
    setAutoTrain(false);
    setW(0.5);
    setB(0.1);
    setHistory([]);
    setStep('forward');
  }, []);

  useEffect(() => {
    return () => { if (trainRef.current) clearInterval(trainRef.current); };
  }, []);

  useEffect(() => {
    if (autoTrainRef.current && trainRef.current) {
      clearInterval(trainRef.current);
      trainRef.current = setInterval(() => {
        if (!autoTrainRef.current) return;
        stepRef.current();
      }, trainInterval);
    }
  }, [trainInterval]);

  const accuracy = useMemo(() => {
    const samples = batchMode ? batchSamples : [{ x, y }];
    let correct = 0;
    for (const s of samples) {
      const pred = ACTIVATIONS[activation].fn(w * s.x + b) >= 0.5 ? 1 : 0;
      if (pred === s.y) correct++;
    }
    return correct / samples.length;
  }, [w, b, x, y, activation, batchMode, batchSamples]);

  const currentDw = batchMode ? batchGrads.dw : dw;
  const currentDb = batchMode ? batchGrads.db : db;

  // Fix #1: Truncate labels to fit in nodes
  const nodeLabels = [
    { nx: 40, ny: 60, text: `x=${fmt.param(x)}`, fill: '#6B7280' },
    { nx: 40, ny: 140, text: `w=${fmt.param(w)}`, fill: '#6366F1' },
    { nx: 40, ny: 220, text: `b=${fmt.param(b)}`, fill: '#F59E0B' },
    { nx: 140, ny: 120, text: `z=${fmt.value(z)}`, fill: '#6366F1' },
    { nx: 240, ny: 120, text: `a=${fmt.value(a)}`, fill: stepIndex >= 1 ? ACTIVATIONS[activation].color : '#D1D5DB' },
    { nx: 340, ny: 120, text: `L=${fmt.loss(loss)}`, fill: stepIndex >= 1 ? '#EF4444' : '#D1D5DB' },
  ];

  // Fix #7: Loss landscape path includes current position
  const lsPathPoints = useMemo(() => {
    const pts = history.map(h => `${lsToX(h.w) + 25},${lsToY(h.b)}`);
    pts.push(`${lsToX(w) + 25},${lsToY(b)}`);
    return pts.join(' ');
  }, [history, w, b]);

  // Fix #5: Dynamic activation label
  const activationLabel = activation === 'sigmoid' ? 'σ' : activation === 'tanh' ? 'tanh' : 'ReLU';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========== LEFT: Computation Graph + Gradient Vanishing ========== */}
        <div className="space-y-4">
          {/* Computation Graph with Gradient Flow */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Computation Graph</h3>
            <svg viewBox="0 0 400 300" className="w-full">
              <rect width={400} height={300} fill="rgb(243 244 246)" rx="8" />

              {/* Fix #10: Forward edges — dimmed during backward/update */}
              <line x1={70} y1={60} x2={110} y2={120} stroke={stepIndex >= 2 ? '#D1D5DB' : '#9CA3AF'} strokeWidth={1.5} opacity={stepIndex >= 2 ? 0.3 : 1} />
              <line x1={70} y1={140} x2={110} y2={120} stroke={stepIndex >= 2 ? '#D1D5DB' : '#9CA3AF'} strokeWidth={1.5} opacity={stepIndex >= 2 ? 0.3 : 1} />
              <line x1={70} y1={220} x2={110} y2={120} stroke={stepIndex >= 2 ? '#D1D5DB' : '#9CA3AF'} strokeWidth={1.5} opacity={stepIndex >= 2 ? 0.3 : 1} />
              <line x1={170} y1={120} x2={210} y2={120} stroke={stepIndex >= 1 ? ACTIVATIONS[activation].color : '#D1D5DB'} strokeWidth={2} opacity={stepIndex >= 2 ? 0.3 : 1} />
              <line x1={270} y1={120} x2={310} y2={120} stroke={stepIndex >= 1 ? ACTIVATIONS[activation].color : '#D1D5DB'} strokeWidth={2} opacity={stepIndex >= 2 ? 0.3 : 1} />

              {/* Gradient flow arrows — backward edges */}
              {stepIndex >= 2 && (
                <g>
                  {/* Fix #3: stroke-dasharray for animated dashes */}
                  <line x1={310} y1={135} x2={270} y2={135} stroke="#EF4444" strokeWidth={Math.max(1, Math.min(4, Math.abs(dLda) * 8))} strokeDasharray="6,4" markerEnd={`url(#${uid}-gflow)`}>
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                  </line>
                  <line x1={270} y1={135} x2={170} y2={135} stroke="#F59E0B" strokeWidth={Math.max(1, Math.min(4, Math.abs(daDz) * 8))} strokeDasharray="6,4" markerEnd={`url(#${uid}-gflow-amber)`}>
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                  </line>
                  <line x1={125} y1={120} x2={70} y2={145} stroke="#6366F1" strokeWidth={Math.max(1, Math.min(4, Math.abs(dzDw) * 1.5))} strokeDasharray="6,4" markerEnd={`url(#${uid}-gflow-indigo)`}>
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                  </line>
                  <line x1={125} y1={120} x2={70} y2={215} stroke="#6366F1" strokeWidth={Math.max(1, Math.min(4, Math.abs(dzDb) * 1.5))} strokeDasharray="6,4" markerEnd={`url(#${uid}-gflow-indigo)`}>
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                  </line>

                  <text x={290} y={128} fontSize={8} fill="#EF4444" fontWeight="bold">dL/da={fmt.grad(dLda)}</text>
                  <text x={210} y={128} fontSize={8} fill="#F59E0B" fontWeight="bold">da/dz={fmt.grad(daDz)}</text>
                  <text x={78} y={138} fontSize={8} fill="#6366F1" fontWeight="bold">dz/dw={fmt.param(dzDw)}</text>
                  <text x={78} y={208} fontSize={8} fill="#6366F1" fontWeight="bold">dz/db={fmt.param(dzDb)}</text>
                  <text x={200} y={28} textAnchor="middle" fontSize={10} fill="#EF4444" fontWeight="bold">← Gradient Flow →</text>
                </g>
              )}

              {stepIndex === 0 && (
                <text x={200} y={25} textAnchor="middle" fontSize={10} fill="#6366F1" fontWeight="bold">Forward →</text>
              )}

              {/* Fix #1: Nodes with properly sized labels */}
              {nodeLabels.map((node, i) => (
                <g key={i}>
                  <rect x={node.nx - 34} y={node.ny - 15} width={68} height={30} rx={6}
                    fill={node.fill} stroke="white" strokeWidth={1.5} />
                  <text x={node.nx} y={node.ny + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                    {node.text}
                  </text>
                </g>
              ))}

              {/* Gradient value nodes */}
              {stepIndex >= 2 && (
                <>
                  <rect x={110} y={195} width={60} height={24} rx={5} fill="#EF4444" stroke="white" strokeWidth={1.5} />
                  <text x={140} y={211} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">dw={fmt.grad(currentDw)}</text>
                  <rect x={210} y={195} width={60} height={24} rx={5} fill="#EF4444" stroke="white" strokeWidth={1.5} />
                  <text x={240} y={211} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">db={fmt.grad(currentDb)}</text>
                </>
              )}

              {/* Fix #4: Unique marker IDs */}
              <defs>
                <marker id={`${uid}-gflow`} markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <path d="M0,0 L6,2.5 L0,5" fill="#EF4444" />
                </marker>
                <marker id={`${uid}-gflow-amber`} markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <path d="M0,0 L6,2.5 L0,5" fill="#F59E0B" />
                </marker>
                <marker id={`${uid}-gflow-indigo`} markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <path d="M0,0 L6,2.5 L0,5" fill="#6366F1" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Gradient Vanishing Demo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gradient Magnitude by Layer</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Watch gradients shrink (vanish) with sigmoid in deep networks</p>
            <div className="flex gap-2 mb-3">
              {(Object.keys(ACTIVATIONS) as ActivationFn[]).map(key => (
                <button key={key} onClick={() => setGvActivation(key)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${gvActivation === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {ACTIVATIONS[key].label}
                </button>
              ))}
            </div>
            <div className="mb-2">
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Network Depth</span><strong>{gvDepth} layers</strong>
              </label>
              <input type="range" min={1} max={8} step={1} value={gvDepth} onChange={e => setGvDepth(parseInt(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            <div className="space-y-1.5">
              {gvData.map((layer, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 w-12 shrink-0">{layer.label}</span>
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(1, layer.magnitude * 100)}%`,
                        backgroundColor: layer.magnitude > 0.5 ? '#22C55E' : layer.magnitude > 0.1 ? '#F59E0B' : '#EF4444',
                      }} />
                  </div>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 w-14 text-right shrink-0">{layer.magnitude.toFixed(4)}</span>
                </div>
              ))}
            </div>
            {gvData.length > 1 && gvData[gvData.length - 1].magnitude < 0.01 && (
              <p className="text-[10px] text-red-500 dark:text-red-400 mt-2">⚠️ Gradients have vanished — this layer learns almost nothing!</p>
            )}
          </div>
        </div>

        {/* ========== CENTER: Chain Rule + Loss Landscape ========== */}
        <div className="space-y-4">
          {/* Fix #8: Chain Rule Breakdown — with preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Chain Rule Breakdown</h3>
            {stepIndex < 2 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 py-3 space-y-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">What happens in the Backward step:</p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono space-y-1">
                  <p>dL/dw = dL/da × da/dz × dz/dw</p>
                  <p className="text-gray-400">= <span className="text-red-400">(â - y)</span> × <span className="text-amber-400">σ'(z)</span> × <span className="text-indigo-400">x</span></p>
                  <p className="text-gray-400">= <span className="text-red-400">error</span> × <span className="text-amber-400">slope</span> × <span className="text-indigo-400">input</span></p>
                </div>
                <p className="text-gray-400 italic">Click "Next Step" to advance to the Backward step</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-mono">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300 font-bold mb-2">dL/dw (gradient for weight)</p>
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">dL/dw = dL/da × da/dz × dz/dw</p>
                    <p className="text-gray-600 dark:text-gray-400">= <span className="text-red-500">(â - y)</span> × <span className="text-amber-500">σ'(z)</span> × <span className="text-indigo-500">x</span></p>
                    <p className="text-gray-600 dark:text-gray-400">= <span className="text-red-500">({fmt.value(a)} - {y})</span> × <span className="text-amber-500">{fmt.grad(daDz)}</span> × <span className="text-indigo-500">{x}</span></p>
                    <p className="text-gray-600 dark:text-gray-400">= <span className="text-red-500">{fmt.grad(dLda)}</span> × <span className="text-amber-500">{fmt.grad(daDz)}</span> × <span className="text-indigo-500">{x}</span></p>
                    <p className="text-gray-900 dark:text-gray-100 font-bold">= {fmt.loss(currentDw)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-700 dark:text-gray-300 font-bold mb-2">dL/db (gradient for bias)</p>
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">dL/db = dL/da × da/dz × dz/db</p>
                    <p className="text-gray-600 dark:text-gray-400">= <span className="text-red-500">({fmt.value(a)} - {y})</span> × <span className="text-amber-500">{fmt.grad(daDz)}</span> × <span className="text-indigo-500">1</span></p>
                    <p className="text-gray-900 dark:text-gray-100 font-bold">= {fmt.loss(currentDb)}</p>
                  </div>
                </div>

                {stepIndex >= 3 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-green-700 dark:text-green-300 font-bold mb-2">Weight Update</p>
                    <div className="space-y-1">
                      <p className="text-green-600 dark:text-green-400">w_new = w - η × dL/dw</p>
                      <p className="text-green-600 dark:text-green-400">= {fmt.value(w)} - {fmt.param(lr)} × {fmt.loss(currentDw)}</p>
                      <p className="text-green-900 dark:text-green-100 font-bold">= {fmt.loss(w - lr * currentDw)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fix #7: Loss Landscape — current position connected to path */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Loss Landscape</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">Red dot = current (w, b). Trail shows path taken during training.</p>
            <svg viewBox={`0 0 ${lsSvgW + 30} ${lsSvgH + 30}`} className="w-full">
              <rect x={25} y={0} width={lsSvgW} height={lsSvgH} fill="rgb(243 244 246)" rx={4} clipPath={`url(#${uid}-ls-clip)`} />
              <defs>
                <clipPath id={`${uid}-ls-clip`}><rect x={25} y={0} width={lsSvgW} height={lsSvgH} /></clipPath>
              </defs>
              <g clipPath={`url(#${uid}-ls-clip)`}>{lsContours}</g>

              <text x={25 + lsSvgW / 2} y={lsSvgH + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">weight (w) →</text>
              <text x={8} y={lsSvgH / 2} textAnchor="middle" fontSize={8} fill="#9CA3AF" transform={`rotate(-90, 8, ${lsSvgH / 2})`}>bias (b) →</text>
              <text x={25} y={lsSvgH + 14} textAnchor="middle" fontSize={7} fill="#9CA3AF">{lsWMin}</text>
              <text x={25 + lsSvgW} y={lsSvgH + 14} textAnchor="middle" fontSize={7} fill="#9CA3AF">{lsWMax}</text>
              <text x={22} y={4} textAnchor="end" fontSize={7} fill="#9CA3AF">{lsBMax}</text>
              <text x={22} y={lsSvgH} textAnchor="end" fontSize={7} fill="#9CA3AF">{lsBMin}</text>

              {history.length > 0 && (
                <polyline points={lsPathPoints} fill="none" stroke="#EF4444" strokeWidth={1.5} strokeLinejoin="round" opacity={0.7} />
              )}

              <circle cx={lsToX(w) + 25} cy={lsToY(b)} r={5} fill="#EF4444" stroke="white" strokeWidth={2} />
              <text x={lsToX(w) + 25 + 8} y={lsToY(b) - 6} fontSize={8} fill="#EF4444" fontWeight="bold">
                ({fmt.param(w)}, {fmt.param(b)})
              </text>

              <circle cx={lsToX(0) + 25} cy={lsToY(0)} r={3} fill="#22C55E" stroke="white" strokeWidth={1.5} />
              <text x={lsToX(0) + 25 + 6} y={lsToY(0) + 3} fontSize={7} fill="#22C55E">min</text>
            </svg>
          </div>

          {/* Fix #6: Loss chart with scale */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Training Progress</h3>
              <svg viewBox="0 0 220 65" className="w-full">
                <rect width={220} height={65} fill="rgb(243 244 246)" rx={4} />
                {/* Axes */}
                <line x1={30} y1={50} x2={210} y2={50} stroke="#D1D5DB" strokeWidth={0.5} />
                <line x1={30} y1={5} x2={30} y2={50} stroke="#D1D5DB" strokeWidth={0.5} />
                {/* Y-axis labels */}
                {(() => {
                  const maxL = Math.max(...history.map(h => h.loss), 0.1);
                  return (
                    <>
                      <text x={27} y={10} textAnchor="end" fontSize={6} fill="#9CA3AF">{maxL.toFixed(2)}</text>
                      <text x={27} y={30} textAnchor="end" fontSize={6} fill="#9CA3AF">{(maxL / 2).toFixed(2)}</text>
                      <text x={27} y={50} textAnchor="end" fontSize={6} fill="#9CA3AF">0</text>
                    </>
                  );
                })()}
                <text x={120} y={60} textAnchor="middle" fontSize={6} fill="#9CA3AF">epoch →</text>
                <text x={15} y={30} textAnchor="middle" fontSize={6} fill="#9CA3AF" transform="rotate(-90, 15, 30)">loss</text>
                {/* Loss line */}
                <polyline
                  points={history.map((h, i) => {
                    const maxL = Math.max(...history.map(h => h.loss), 0.1);
                    const px = 33 + (i / Math.max(history.length - 1, 1)) * 174;
                    const py = 48 - (h.loss / maxL) * 42;
                    return `${px},${py}`;
                  }).join(' ')}
                  fill="none" stroke="#EF4444" strokeWidth={1.5}
                />
                {/* Current loss dot */}
                {(() => {
                  const maxL = Math.max(...history.map(h => h.loss), 0.1);
                  const lastH = history[history.length - 1];
                  const px = 33 + ((history.length - 1) / Math.max(history.length - 1, 1)) * 174;
                  const py = 48 - (lastH.loss / maxL) * 42;
                  return <circle cx={px} cy={py} r={3} fill="#EF4444" />;
                })()}
              </svg>
            </div>
          )}
        </div>

        {/* ========== RIGHT: Controls + Metrics ========== */}
        <div className="space-y-4">
          {/* Fix #2: Step indicators moved to TOP */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Training Steps</h3>
            <div className="flex gap-1.5 mb-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`flex-1 px-2 py-1.5 rounded text-center text-[10px] font-medium ${i <= stepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {s.label}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{STEPS[stepIndex].desc}</p>
          </div>

          {/* Fix #9: Inputs grouped logically */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Data</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>x (input)</span><strong>{fmt.param(inputX)}</strong>
                </label>
                <input type="range" min={-5} max={5} step={0.1} value={inputX} onChange={e => setInputX(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">y (true label)</label>
                <div className="flex gap-2">
                  <button onClick={() => setInputY(0)} className={`flex-1 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${inputY === 0 ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>0</button>
                  <button onClick={() => setInputY(1)} className={`flex-1 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${inputY === 1 ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>1</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Model</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Learning Rate (η)</span><strong>{fmt.param(lr)}</strong>
                </label>
                <input type="range" min={0.01} max={2} step={0.01} value={lr} onChange={e => setLr(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Activation</label>
                <div className="flex gap-2">
                  {(Object.keys(ACTIVATIONS) as ActivationFn[]).map(key => (
                    <button key={key} onClick={() => setActivation(key)}
                      className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${activation === key ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                      style={activation === key ? { backgroundColor: ACTIVATIONS[key].color } : {}}>
                      {ACTIVATIONS[key].label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer group">
                <input type="checkbox" checked={batchMode} onChange={() => setBatchMode(!batchMode)} className="rounded" />
                <span>Batch mode</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">(averages gradients over 4 samples)</span>
              </label>
            </div>
          </div>

          {/* Training Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Training</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={runStep}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                  {stepIndex === 3 ? 'Next Epoch' : 'Next Step →'}
                </button>
                <button onClick={toggleAutoTrain}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${autoTrain ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {autoTrain && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                  {autoTrain ? '⏸ Stop' : '▶ Auto-Train'}
                </button>
                <button onClick={reset}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  ↺
                </button>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Speed</span><strong>{trainSpeed}×</strong>
                </label>
                <input type="range" min={1} max={10} step={1} value={trainSpeed} onChange={e => setTrainSpeed(parseInt(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            </div>
          </div>

          {/* Fix #5: Metrics with dynamic activation label */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Values</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">z = wx + b</span>
                <strong className="text-gray-900 dark:text-gray-100">{fmt.value(z)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">a = {activationLabel}(z)</span>
                <strong className="text-gray-900 dark:text-gray-100">{fmt.value(a)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Loss</span>
                <strong className="text-red-600 dark:text-red-400">{fmt.loss(loss)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Accuracy</span>
                <strong className="text-green-600 dark:text-green-400">{(accuracy * 100).toFixed(0)}%</strong>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[9px] text-gray-400 block">Epoch</span>
                <strong className="text-xs text-gray-700 dark:text-gray-300">{history.length}</strong>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block">w</span>
                <strong className="text-xs text-indigo-600 dark:text-indigo-400">{fmt.param(w)}</strong>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block">b</span>
                <strong className="text-xs text-amber-600 dark:text-amber-400">{fmt.param(b)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational - Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chain Rule Explanation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Chain Rule — The Heart of Backpropagation</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Backpropagation applies the chain rule: <code>dL/dw = dL/da · da/dz · dz/dw</code>. Each operation stores its local gradient, and we multiply them together going backwards. The "Backward" step above shows exactly this multiplication — each factor is color-coded so you can trace where the gradient comes from.
          </p>
        </div>

        {/* AI/ML Analogy */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
          <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Forward</span>
              <span>→ Like a student answering a question.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Loss</span>
              <span>→ Like grading the test.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Backward</span>
              <span>→ Like a teacher showing which step was wrong.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Update</span>
              <span>→ Like practicing the skill they got wrong.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Vanishing</span>
              <span>→ Like telephone — message fades in early layers.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
