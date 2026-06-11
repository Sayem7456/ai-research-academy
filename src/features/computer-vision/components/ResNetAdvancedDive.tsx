'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

type Section = 'gradient' | 'degradation' | 'math' | 'variants';

/* ───────── Gradient Flow Simulator ───────── */

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function simulateGradients(depth: number, residual: boolean, seed: number): number[] {
  const grads: number[] = [];
  let g = 1;
  for (let i = 0; i < depth; i++) {
    const layerGrad = seededRandom(seed + i * 7) * 0.3 + 0.1;
    const skipBoost = residual ? 1 + layerGrad : layerGrad;
    g *= skipBoost;
    if (!residual && g < 0.001) g = 0.001;
    if (residual && g > 3) g = 3;
    grads.push(g);
  }
  const max = Math.max(...grads, 0.01);
  return grads.map(v => v / max);
}

function GradientFlowSimulator() {
  const [depth, setDepth] = useState(30);
  const [residual, setResidual] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animLayer, setAnimLayer] = useState(0);
  const [speed, setSpeed] = useState<'slow' | 'fast'>('slow');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seed = 42;

  const grads = useMemo(() => simulateGradients(depth, residual, seed), [depth, residual, seed]);

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimLayer(0);
    const delay = speed === 'slow' ? 120 : 30;
    let e = 0;
    intervalRef.current = setInterval(() => {
      e++;
      if (e >= depth) { stopAnim(); setAnimLayer(depth - 1); return; }
      setAnimLayer(e);
    }, delay);
  }, [depth, stopAnim, speed]);

  const toggleAnim = useCallback(() => {
    if (isAnimating) { stopAnim(); }
    else { startAnim(); }
  }, [isAnimating, stopAnim, startAnim]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const inputGrad = grads[depth - 1] ?? 0;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Gradient Flow Simulator</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Gradients backpropagate from the output layer. {residual
          ? 'With skip connections, gradients flow directly — the +1 identity term prevents vanishing.'
          : 'Without skip connections, repeated multiplication causes gradients to vanish progressively.'}
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div>
          <label className="block text-xs font-medium mb-1">Network Depth: {depth}</label>
          <input type="range" min="5" max="100" step="1" value={depth}
            onChange={e => { setDepth(parseInt(e.target.value)); setAnimLayer(0); }} className="w-32" />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" checked={residual}
            onChange={e => { setResidual(e.target.checked); setAnimLayer(0); }} className="w-4 h-4" />
          Skip Connections
        </label>
        <div className="flex items-center gap-2">
          <button onClick={toggleAnim}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
            {isAnimating ? 'Stop' : '▶ Animate Backward Pass'}
          </button>
          {(isAnimating || animLayer > 0) && (
            <button onClick={() => { stopAnim(); setAnimLayer(0); }}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90 transition-colors">
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-auto">
          <span className={speed === 'slow' ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>Slow</span>
          <button onClick={() => setSpeed(s => s === 'slow' ? 'fast' : 'slow')}
            className={`relative w-9 h-4 rounded-full transition-colors ${speed === 'fast' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${speed === 'fast' ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className={speed === 'fast' ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>Fast</span>
        </div>
      </div>

      <div className={`flex items-end gap-[1px] h-40 border-b border-gray-300 dark:border-gray-600 ${residual ? 'bg-green-50/30 dark:bg-green-950/10' : 'bg-red-50/30 dark:bg-red-950/10'} rounded p-2`}>
        {grads.map((g, i) => {
          const revealed = !isAnimating || i <= animLayer;
          const isCurrent = isAnimating && i === animLayer;
          return (
            <div key={i} className="flex-1 flex flex-col items-center" title={`Layer ${i + 1}: ${(g * 100).toFixed(0)}%`}>
              <motion.div
                animate={{ height: revealed ? `${g * 100}%` : '2%' }}
                transition={{ duration: 0.3 }}
                className={`w-full rounded-t ${isCurrent ? 'ring-2 ring-yellow-400' : ''}`}
                style={{
                  backgroundColor: residual
                    ? `hsl(120, 50%, ${30 + g * 35}%)`
                    : `hsl(0, ${g * 70}%, ${15 + g * 45}%)`,
                  opacity: g * 0.6 + 0.4,
                }}
              />
              {depth <= 30 && i % 5 === 0 && (
                <div className="text-[6px] text-gray-400 dark:text-gray-500 mt-0.5">{i + 1}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>Output</span>
        <span>Input</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-semibold text-gray-700 dark:text-gray-300">Gradient at output layer</div>
          <div className="text-2xl font-bold font-mono mt-1">1.00</div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-semibold text-gray-700 dark:text-gray-300">Gradient at input layer</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${residual ? 'text-green-600' : 'text-red-600'}`}>
            {inputGrad.toFixed(3)}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-0.5">
            {residual ? 'Strong (skip connections preserve flow)' : 'Vanished (plain network)'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Degradation Problem Chart ───────── */

function DegradationChart() {
  const [depth, setDepth] = useState(20);
  const [showResNet, setShowResNet] = useState(true);
  const [showPlain, setShowPlain] = useState(true);

  const plainError = (d: number) => {
    if (d <= 18) return 28 + d * 0.2;
    if (d <= 56) return 31.6 + (d - 18) * 0.3;
    return 45 + (d - 56) * 0.15;
  };

  const resNetError = (d: number) => {
    if (d <= 18) return 27 + d * 0.15;
    if (d <= 34) return 29.6 + (d - 18) * 0.08;
    if (d <= 50) return 30.8 + (d - 34) * 0.02;
    if (d <= 101) return 31.2 + (d - 50) * 0.015;
    return 32.5 + (d - 101) * 0.01;
  };

  const maxDepth = 152;
  const depths = Array.from({ length: maxDepth }, (_, i) => i + 1);
  const minErr = 20;
  const maxErr = 50;
  const errRange = maxErr - minErr;

  const toY = (err: number) => `${Math.max(0, Math.min(100, ((err - minErr) / errRange) * 100))}%`;

  const yLabels = [20, 30, 40, 50];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Degradation Problem</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Deeper plain networks exhibit <em>higher</em> training error — the degradation problem.
        ResNets solve this by learning residual functions with identity skip connections.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div>
          <input type="range" min="1" max="152" step="1" value={depth}
            onChange={e => setDepth(parseInt(e.target.value))} className="w-32" />
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{depth} layers</span>
        </div>
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input type="checkbox" checked={showPlain} onChange={e => setShowPlain(e.target.checked)} className="w-4 h-4" />
          <span className="text-red-600 font-medium">Plain</span>
        </label>
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input type="checkbox" checked={showResNet} onChange={e => setShowResNet(e.target.checked)} className="w-4 h-4" />
          <span className="text-emerald-600 font-medium">ResNet</span>
        </label>
      </div>

      <div className="relative h-48 border-b border-l border-gray-300 dark:border-gray-600 ml-8">
        {/* Horizontal gridlines + Y-axis labels */}
        {yLabels.map(err => {
          const yPos = ((err - minErr) / errRange) * 100;
          return (
            <div key={err}>
              <div className="absolute inset-x-0 border-t border-dashed border-gray-200 dark:border-gray-700"
                style={{ top: `${yPos}%` }} />
              <div className="absolute -left-8 text-[10px] text-gray-500 dark:text-gray-400"
                style={{ top: `${yPos}%`, transform: 'translateY(-50%)' }}>
                {err}%
              </div>
            </div>
          );
        })}

        {/* Vertical dashed line at current depth */}
        <div className="absolute top-0 bottom-0 border-l border-dashed border-blue-400/50"
          style={{ left: `${(depth / maxDepth) * 100}%`, zIndex: 5 }} />

        {/* X-axis labels */}
        {depths.filter(d => d % 20 === 0 || d === maxDepth).map(d => (
          <div key={d} className="absolute bottom-0 text-[8px] text-gray-400 dark:text-gray-500"
            style={{ left: `${(d / maxDepth) * 100}%`, transform: 'translateX(-50%)' }}>
            {d}
          </div>
        ))}

        {/* Plain curve */}
        {showPlain && (
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <polyline
              points={depths.map(d =>
                `${(d / maxDepth) * 100}%,${toY(plainError(d))}`
              ).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {depth <= 152 && (
              <circle cx={`${(depth / maxDepth) * 100}%`} cy={toY(plainError(depth))}
                r="4" fill="#ef4444" stroke="white" strokeWidth="2" />
            )}
          </svg>
        )}

        {/* ResNet curve */}
        {showResNet && (
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <polyline
              points={depths.map(d =>
                `${(d / maxDepth) * 100}%,${toY(resNetError(d))}`
              ).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {depth <= 152 && (
              <circle cx={`${(depth / maxDepth) * 100}%`} cy={toY(resNetError(depth))}
                r="4" fill="#10b981" stroke="white" strokeWidth="2" />
            )}
          </svg>
        )}

        {/* Annotations */}
        {showPlain && (() => {
          const err = plainError(depth);
          const clampedY = Math.max(2, Math.min(95, ((err - minErr) / errRange) * 100 - 6));
          return (
            <div className="absolute text-[10px] text-red-600 font-semibold whitespace-nowrap"
              style={{ left: `${(depth / maxDepth) * 100}%`, top: `${clampedY}%`, transform: 'translateX(-50%)' }}>
              {err > maxErr ? `>${maxErr.toFixed(0)}%` : `${err.toFixed(1)}%`}
            </div>
          );
        })()}
        {showResNet && (() => {
          const err = resNetError(depth);
          const clampedY = Math.max(2, Math.min(95, ((err - minErr) / errRange) * 100 - 6));
          return (
            <div className="absolute text-[10px] text-emerald-600 font-semibold whitespace-nowrap"
              style={{ left: `${(depth / maxDepth) * 100}%`, top: `${clampedY}%`, transform: 'translateX(-50%)' }}>
              {err.toFixed(1)}%
            </div>
          );
        })()}

        {/* Overflow indicator for plain network */}
        {showPlain && plainError(depth) > maxErr && (
          <div className="absolute bottom-1 right-2 text-[8px] text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
            Plain error exceeds chart range
          </div>
        )}
      </div>

      <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-1">
        Network Depth (layers) → &nbsp;|&nbsp; Data from He et al. (2015) CIFAR-10 experiments
      </div>
    </div>
  );
}

/* ───────── Math Chain Rule Deep Dive ───────── */

function MathDeepDive() {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'fast'>('slow');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = [
    { label: 'Forward Pass', content: 'Input x passes through the residual block: y = F(x) + x', highlight: 'y = F(x) + x' },
    { label: 'Loss Computation', content: 'Loss L is computed at the output: L = ℓ(y, y_truth)', highlight: 'L = ℓ(y)' },
    { label: 'Gradient w.r.t. Output', content: '∂L/∂y — gradient at the block output', highlight: '∂L/∂y' },
    { label: 'Chain Rule Through Addition', content: '∂L/∂x = ∂L/∂y · ∂y/∂x = ∂L/∂y · (∂F/∂x + 1)', highlight: '∂L/∂x = ∂L/∂y · (∂F/∂x + 1)' },
    { label: 'The +1 Term', content: 'The identity term (+1) allows gradients to flow directly through the skip connection, bypassing F entirely.', highlight: '+ 1' },
    { label: 'Deep Network Recurrence', content: 'In a deep ResNet: ∂L/∂x_l = ∂L/∂x_L · (1 + Σ ∂F/∂x) — the gradient is a sum, not a product!', highlight: '∂L/∂x_l = ∂L/∂x_L · (1 + Σ ∂F/∂x)' },
  ];

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setStep(0);
    const delay = speed === 'slow' ? 1800 : 400;
    let s = 0;
    intervalRef.current = setInterval(() => {
      s++;
      if (s >= steps.length) { stopAnim(); setStep(steps.length - 1); return; }
      setStep(s);
    }, delay);
  }, [stopAnim, steps.length, speed]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  const showSkipGrad = step >= 4;
  const showFgrad = step >= 3;
  const showBackprop = step >= 2;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Gradient Chain Rule Deep Dive</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The mathematical reason skip connections work: the gradient splits at the addition gate,
        producing an identity term (∂x/∂x = 1) that creates a direct highway for gradients.
      </p>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={isAnimating ? stopAnim : startAnim}
          className={`px-4 py-2 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
          {isAnimating ? '■ Stop' : '▶ Step Through'}
        </button>
        <button onClick={() => { stopAnim(); setStep(0); }}
          className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90 transition-colors">
          Reset
        </button>
        {!isAnimating && (
          <>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="px-2.5 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90 disabled:opacity-30 transition-colors">
              Prev
            </button>
            <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1}
              className="px-2.5 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90 disabled:opacity-30 transition-colors">
              Next
            </button>
          </>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-auto">
          <span className={speed === 'slow' ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>Slow</span>
          <button onClick={() => setSpeed(s => s === 'slow' ? 'fast' : 'slow')}
            className={`relative w-9 h-4 rounded-full transition-colors ${speed === 'fast' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${speed === 'fast' ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className={speed === 'fast' ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>Fast</span>
        </div>
      </div>

      {/* Step indicator — clickable */}
      <div className="flex gap-1 mb-4">
        {steps.map((s, i) => (
          <button key={i} onClick={() => { if (!isAnimating) setStep(i); }}
            className={`flex-1 h-2 rounded transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
            style={{ opacity: i <= step ? 1 : 0.4 }}
            title={s.label} />
        ))}
      </div>

      {/* Forward/Backward diagram */}
      <div className="relative mb-4 p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Top row: Input → F(x) → ⊕ → Output */}
        <div className="flex items-center justify-center gap-2">
          <motion.div className="text-center p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded border-2 border-blue-400 text-xs font-semibold w-16"
            animate={{ opacity: step >= 0 ? 1 : 0.3 }}>
            Input
            <div className="text-[9px] font-mono font-normal text-gray-600 dark:text-gray-400">x</div>
          </motion.div>

          <svg className="w-5 h-0.5 text-gray-400 flex-shrink-0">
            <line x1="0" y1="0.5" x2="18" y2="0.5" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="20,0.5 16,-2 16,3" fill="currentColor" />
          </svg>

          <motion.div className="text-center p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded border-2 border-purple-400 text-xs font-semibold w-20"
            animate={{ opacity: step >= 0 ? 1 : 0.3 }}>
            F(x)
            <div className="text-[9px] font-mono font-normal text-gray-600 dark:text-gray-400">Conv</div>
          </motion.div>

          <svg className="w-5 h-0.5 text-gray-400 flex-shrink-0">
            <line x1="0" y1="0.5" x2="18" y2="0.5" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="20,0.5 16,-2 16,3" fill="currentColor" />
          </svg>

          <div className="relative">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 text-xs font-bold text-yellow-700 dark:text-yellow-300">
              ⊕
            </div>
            {showSkipGrad && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-5 -right-5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold px-1 py-0.5 rounded border border-emerald-400 whitespace-nowrap">
                +1
              </motion.div>
            )}
          </div>

          <svg className="w-5 h-0.5 text-gray-400 flex-shrink-0">
            <line x1="0" y1="0.5" x2="18" y2="0.5" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="20,0.5 16,-2 16,3" fill="currentColor" />
          </svg>

          <motion.div className="text-center p-2.5 bg-yellow-100 dark:bg-yellow-900/40 rounded border-2 border-yellow-400 text-xs font-semibold w-16"
            animate={{ opacity: step >= 0 ? 1 : 0.3 }}>
            Output
            <div className="text-[9px] font-mono font-normal text-gray-600 dark:text-gray-400">F+x</div>
          </motion.div>
        </div>

        {/* Skip connection path (below) */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="w-16" /> {/* spacer matching Input width */}
          <svg className="w-5 h-3 text-gray-400 flex-shrink-0">
            <line x1="10" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
          </svg>
          <div className="w-20" /> {/* spacer matching F(x) width */}
          <svg className="w-20 h-3 text-gray-400 flex-shrink-0">
            <line x1="0" y1="10" x2="80" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
          </svg>
          <div className="flex items-center justify-center w-8 h-8" /> {/* spacer matching ⊕ width */}
        </div>

        {/* Skip connection label */}
        <div className="absolute text-[9px] text-blue-500 font-mono"
          style={{ bottom: '32px', left: 'calc(50% - 10px)' }}>
          skip
        </div>

        {/* Backward gradient paths */}
        {showBackprop && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute text-[9px] text-red-500 font-mono font-bold"
            style={{ bottom: '8px', left: 'calc(50% + 72px)' }}>
            ∂L/∂y
          </motion.div>
        )}
        {showFgrad && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute text-[9px] text-red-500 font-mono font-bold"
            style={{ bottom: '8px', left: 'calc(50% - 80px)' }}>
            ∂L/∂y · ∂F/∂x
          </motion.div>
        )}
        {showSkipGrad && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold"
            style={{ bottom: '42px', left: 'calc(50% - 64px)' }}>
            ∂L/∂y · 1
          </motion.div>
        )}
      </div>

      {/* Step content */}
      <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
            {step + 1}
          </div>
          <span className="font-semibold text-sm text-indigo-900 dark:text-indigo-200">{steps[step].label}</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{steps[step].content}</p>
        <div className="text-lg font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800 p-2 rounded border border-indigo-200 dark:border-indigo-800 text-center">
          {steps[step].highlight}
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Skip Variant Explorer ───────── */

const VARIANTS = [
  {
    name: 'Identity Shortcut',
    used: 'ResNet-18, ResNet-34',
    formula: 'y = F(x) + x',
    params: 'None',
    pros: 'No additional parameters, simplest form',
    cons: 'Requires matching dimensions (use padding/stride)',
    gradient: '∂L/∂x = ∂L/∂y · (∂F/∂x + 1)',
    color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    why: 'Used in shallow ResNets (18, 34) where dimensions match naturally between blocks.',
  },
  {
    name: 'Projection Shortcut',
    used: 'ResNet-50, ResNet-101, ResNet-152',
    formula: 'y = F(x) + W·x',
    params: '1×1 conv in skip',
    pros: 'Handles dimension mismatches seamlessly',
    cons: 'Adds parameters and FLOPs',
    gradient: '∂L/∂x = ∂L/∂y · (∂F/∂x + W)',
    color: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30',
    why: 'Used in deeper ResNets where spatial dimensions change across blocks.',
  },
  {
    name: 'Pre-activation (Full Pre)',
    used: 'ResNet-v2',
    formula: 'y = x + F(BN(ReLU(x)))',
    params: 'None',
    pros: 'Better gradient flow, easier optimization',
    cons: 'Changes layer ordering convention (BN/ReLU before weights)',
    gradient: '∂L/∂x = ∂L/∂y · (∂F/∂x + 1)',
    color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30',
    why: 'Moving BN/ReLU before Conv prevents gradient from passing through activation after addition.',
  },
  {
    name: 'Post-activation (Original)',
    used: 'ResNet-v1 (original paper)',
    formula: 'y = ReLU(F(x) + x)',
    params: 'None',
    pros: 'Original formulation, well-studied',
    cons: 'ReLU after addition can zero out the entire path',
    gradient: '∂L/∂x = ∂L/∂y · ReLU\'(F(x)+x) · (∂F/∂x + 1)',
    color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30',
    why: 'ReLU gates the gradient: if F(x)+x < 0, output is 0 and no gradient flows through this block.',
  },
];

function VariantDiagram({ variant }: { variant: typeof VARIANTS[0] }) {
  const bw = 60, bh = 28;

  const renderBlock = (x: number, y: number, label: string, sub: string, color: string) => (
    <g>
      <rect x={x - bw / 2} y={y - bh / 2} width={bw} height={bh} rx={4}
        fill={color} stroke={color} strokeOpacity={0.6} />
      <text x={x} y={y - 2} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{label}</text>
      {sub && <text x={x} y={y + 10} textAnchor="middle" fontSize="7" fill="white" opacity={0.8}>{sub}</text>}
    </g>
  );

  const renderArrow = (x1: number, x2: number, y: number) => (
    <line x1={x1} y1={y} x2={x2} y2={y} stroke="#9ca3af" strokeWidth="1.5" />
  );

  const ix = 50, fx = 140, sumx = 230, ox = 300;
  const topY = 18, skipY = 50, botY = 82;

  return (
    <div className="flex justify-center mb-3">
      <svg width="340" height={variant.name === 'Post-activation (Original)' ? 130 : 100} viewBox={variant.name === 'Post-activation (Original)' ? `0 0 340 130` : `0 0 340 100`}>
        {/* Input */}
        {renderBlock(ix, topY, 'Input', 'x', '#3b82f6')}

        {/* F(x) block */}
        {variant.name === 'Pre-activation (Full Pre)'
          ? renderBlock(fx, topY, 'BN→ReLU→Conv', 'F(x)', '#8b5cf6')
          : renderBlock(fx, topY, 'Conv Layers', 'F(x)', '#8b5cf6')}

        {/* Sum */}
        <circle cx={sumx} cy={topY} r={10} fill="#fde68a" stroke="#f59e0b" />
        <text x={sumx} y={topY + 1} textAnchor="middle" fontSize="9" fill="#92400e" fontWeight="bold">⊕</text>

        {/* Output */}
        {variant.name === 'Post-activation (Original)'
          ? renderBlock(ox, botY, 'ReLU', 'y', '#f97316')
          : renderBlock(ox, topY, 'Output', 'y', '#f59e0b')}

        {/* Main path: x → F → ⊕ */}
        {renderArrow(ix + bw / 2 + 2, fx - bw / 2 - 2, topY)}
        {renderArrow(fx + bw / 2 + 2, sumx - 12, topY)}

        {/* Skip connection */}
        <line x1={ix} y1={topY + bh / 2} x2={ix} y2={skipY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" />
        {variant.name === 'Projection Shortcut' ? (
          <>
            {renderBlock(ix, skipY, '1×1 Conv', 'W', '#a855f7')}
            <line x1={ix} y1={skipY + bh / 2} x2={ix} y2={sumx + 12} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" />
            <text x={ix + 26} y={skipY} textAnchor="middle" fontSize="7" fill="#a855f7" fontWeight="bold">W·x</text>
          </>
        ) : (
          <>
            <line x1={ix} y1={skipY} x2={sumx - 12} y2={skipY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 2" />
            <text x={(ix + sumx) / 2 - 6} y={skipY - 4} textAnchor="middle" fontSize="7" fill="#6b7280">x</text>
            {/* +1 badge */}
            <rect x={(ix + sumx) / 2 + 10} y={skipY - 8} width={16} height={12} rx={3}
              fill="#d1fae5" stroke="#10b981" />
            <text x={(ix + sumx) / 2 + 18} y={skipY + 1} textAnchor="middle" fontSize="8" fill="#047857" fontWeight="bold">+1</text>
          </>
        )}

        {/* Post-activation: arrow from ⊕ down to ReLU */}
        {variant.name === 'Post-activation (Original)' && (
          <>
            <line x1={sumx} y1={topY + 10} x2={sumx} y2={botY - bh / 2 - 2} stroke="#9ca3af" strokeWidth="1.5" />
            <text x={sumx + 18} y={(topY + botY) / 2 + 1} textAnchor="middle" fontSize="7" fill="#6b7280">F+x</text>
          </>
        )}

        {/* Pre-activation: add BN/ReLU indicators */}
        {variant.name === 'Pre-activation (Full Pre)' && (
          <text x={(ix + fx) / 2} y={topY - 14} textAnchor="middle" fontSize="7" fill="#6b7280">BN→ReLU applied before weights</text>
        )}
      </svg>
    </div>
  );
}

function VariantExplorer() {
  const [selected, setSelected] = useState(0);
  const v = VARIANTS[selected];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Skip Connection Variants</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Different ResNet implementations use different shortcut designs. Each affects
        gradient flow, parameter count, and optimization behavior.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {VARIANTS.map((variant, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`p-3 text-xs rounded border-2 text-left transition-all ${
              selected === i ? `${variant.color} border-current ring-2 ring-blue-400` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            <div className={`font-semibold ${selected === i ? '' : 'text-gray-900 dark:text-gray-100'}`}>{variant.name}</div>
            <div className="text-[10px] mt-0.5 opacity-75">{variant.used}</div>
          </button>
        ))}
      </div>

      <div className={`p-4 rounded-lg border-l-4 ${v.color}`}>
        <h4 className="font-semibold text-sm mb-2">{v.name}</h4>

        <VariantDiagram variant={v} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">Formula</div>
            <div className="font-mono mt-0.5 text-gray-800 dark:text-gray-200">{v.formula}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">Parameters</div>
            <div className="mt-0.5 text-gray-600 dark:text-gray-400">{v.params}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">Gradient</div>
            <div className="font-mono mt-0.5 text-green-700 dark:text-green-300">{v.gradient}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">Used In</div>
            <div className="mt-0.5 text-gray-600 dark:text-gray-400">{v.used}</div>
          </div>
        </div>

        <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          {v.why}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-green-700 dark:text-green-400">✓</span> {v.pros}
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-red-600">✗</span> {v.cons}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Main Component ───────── */

export default function ResNetAdvancedDive() {
  const [section, setSection] = useState<Section>('gradient');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'gradient', label: 'Gradient Flow', icon: '📊' },
    { id: 'degradation', label: 'Degradation', icon: '📈' },
    { id: 'math', label: 'Chain Rule', icon: '∑' },
    { id: 'variants', label: 'Skip Variants', icon: '🔀' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore why skip connections work — from gradient dynamics and the degradation problem
          to the underlying mathematics and architectural variants.
        </p>

        {/* Section tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t whitespace-nowrap transition-colors ${
                section === s.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === 'gradient' && <GradientFlowSimulator />}
          {section === 'degradation' && <DegradationChart />}
          {section === 'math' && <MathDeepDive />}
          {section === 'variants' && <VariantExplorer />}
        </motion.div>
      </div>
    </div>
  );
}
