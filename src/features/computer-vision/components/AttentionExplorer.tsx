'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const NUM_CHANNELS = 8;
const FEAT_H = 6;
const FEAT_W = 6;

function generateFeatureMaps(seed: number): number[][][] {
  return Array.from({ length: NUM_CHANNELS }, (_, c) =>
    Array.from({ length: FEAT_H }, () =>
      Array.from({ length: FEAT_W }, () => {
        const base = Math.sin(c * 0.8) * 0.3 + 0.5;
        return Math.round((base + seededRandom(c * 37 + seed) * 0.3) * 255);
      })
    )
  );
}

function globalAvgPool(maps: number[][][]): number[] {
  return maps.map(map => {
    let sum = 0, count = 0;
    for (const row of map) for (const v of row) { sum += v; count++; }
    return sum / count;
  });
}

function excite(pooled: number[], reduction: number, seed: number): number[] {
  const r = Math.max(1, Math.floor(NUM_CHANNELS / reduction));
  const w1 = Array.from({ length: r }, (_, i) => seededRandom(i * 7 + seed) * 0.2 + 0.1);
  const w2 = Array.from({ length: NUM_CHANNELS }, (_, i) => seededRandom(i * 13 + seed + 1) * 0.2 + 0.1);
  const hidden = pooled.map((v, i) => Math.tanh(v / 255 * 2 - 1) * w1[i % r]);
  const gate = hidden.map((_, i) => {
    const z = hidden.reduce((s, h, j) => s + h * w2[(i + j) % NUM_CHANNELS], 0);
    return 1 / (1 + Math.exp(-z));
  });
  const minG = Math.min(...gate);
  const maxG = Math.max(...gate);
  return gate.map(g => (g - minG) / (maxG - minG || 1));
}

export default function AttentionExplorer() {
  const [attentionType, setAttentionType] = useState<'se' | 'cbam' | 'self'>('se');
  const [reduction, setReduction] = useState(2);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seed, setSeed] = useState(0);

  const featureMaps = useMemo(() => generateFeatureMaps(seed), [seed]);
  const pooled = useMemo(() => globalAvgPool(featureMaps), [featureMaps]);
  const weights = useMemo(() => excite(pooled, reduction, seed), [pooled, reduction, seed]);
  const maxWeight = Math.max(...weights, 0.01);

  const cbamChannelWeights = useMemo(() => {
    const avgPooled = globalAvgPool(featureMaps);
    const maxPooled = featureMaps.map(map => {
      let max = 0;
      for (const row of map) for (const v of row) if (v > max) max = v;
      return max;
    });
    const r = Math.max(1, Math.floor(NUM_CHANNELS / 2));
    const w1 = Array.from({ length: r }, (_, i) => seededRandom(i * 7 + seed + 10));
    const w2 = Array.from({ length: NUM_CHANNELS }, (_, i) => seededRandom(i * 13 + seed + 20));
    const hiddenAvg = avgPooled.map((v, i) => Math.tanh(v / 255 * 2 - 1) * w1[i % r]);
    const hiddenMax = maxPooled.map((v, i) => Math.tanh(v / 255 * 2 - 1) * w1[i % r]);
    const gate = avgPooled.map((_, i) => {
      const zAvg = hiddenAvg.reduce((s, h, j) => s + h * w2[(i + j) % NUM_CHANNELS], 0);
      const zMax = hiddenMax.reduce((s, h, j) => s + h * w2[(i + j) % NUM_CHANNELS], 0);
      return 1 / (1 + Math.exp(-(zAvg + zMax)));
    });
    const minG = Math.min(...gate);
    const maxG = Math.max(...gate);
    return gate.map(g => (g - minG) / (maxG - minG || 1));
  }, [featureMaps, seed]);

  const spatialAttentionMap = useMemo(() => {
    const map: number[][] = [];
    for (let y = 0; y < FEAT_H; y++) {
      map[y] = [];
      for (let x = 0; x < FEAT_W; x++) {
        map[y][x] = seededRandom(y * 17 + x * 11 + seed + 100) * 0.6 + 0.4;
      }
    }
    return map;
  }, [seed]);

  const cbamMaxWeight = Math.max(...cbamChannelWeights, 0.01);

  const selfAttentionMatrix = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) =>
      Array.from({ length: 8 }, (_, j) =>
        seededRandom(i * 13 + j * 7 + seed) * 0.8 + 0.2
      )
    );
  }, [seed]);

  const weightedOutputFeatures = useMemo(() => {
    return featureMaps.map((map, ci) =>
      map.map(row =>
        row.map(v => {
          const attnBoost = selfAttentionMatrix[ci % 8].reduce((s, a, j) => s + a * seededRandom(j * 5 + seed + ci * 3), 0) / 8;
          return Math.min(255, Math.max(0, Math.round(v * (0.7 + attnBoost * 0.6))));
        })
      )
    );
  }, [featureMaps, selfAttentionMatrix, seed]);

  const phases = attentionType === 'se'
    ? ['Input Feature Maps', 'Squeeze (Global Avg Pooling)', 'Excitation (FC → ReLU → FC → Sigmoid)', 'Scale (Channel-wise multiply)']
    : attentionType === 'cbam'
    ? ['Input Feature Maps', 'Channel Attention', 'Spatial Attention', 'Refined Output']
    : ['Input Feature Maps', 'Query, Key, Value Projections', 'Attention Scores (Q·K^T)', 'Weighted Sum (Attention·V)'];

  const totalPhases = phases.length;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
    setAnimPhase(0);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(0);
    let e = 0;
    intervalRef.current = setInterval(() => {
      e++;
      setAnimPhase(e);
      if (e >= totalPhases - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, 1000);
  }, [totalPhases]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Attention Mechanisms in CV</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Attention allows networks to focus on important features. SE-Net recalibrates channels,
          CBAM adds spatial attention, and self-attention models global dependencies.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <div className="flex gap-1">
              {(['se', 'cbam', 'self'] as const).map(type => (
                <button key={type} onClick={() => { setAttentionType(type); stopAnim(); }}
                  className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                    attentionType === type ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}>
                  {type === 'se' ? 'SE-Net' : type === 'cbam' ? 'CBAM' : 'Self-Attn'}
                </button>
              ))}
            </div>
          </div>
          {attentionType === 'se' && (
            <div>
              <label className="block text-sm font-medium mb-1">Reduction: {reduction}</label>
              <input type="range" min="1" max="4" step="1" value={reduction}
                onChange={e => setReduction(parseInt(e.target.value))} className="w-full" />
            </div>
          )}
          <div className="flex items-end gap-2">
            <button onClick={isAnimating ? stopAnim : startAnim}
              className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
              {isAnimating ? '■ Stop' : '▶ Animate'}
            </button>
            <button onClick={() => { stopAnim(); setSeed(s => s + 1); }}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              New
            </button>
          </div>
          <div className="flex items-center">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Phase: <span className="font-semibold">{animPhase}/{totalPhases - 1}</span>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        {isAnimating && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                {animPhase}
              </div>
              <span className="text-sm text-indigo-900 dark:text-indigo-200">{phases[animPhase]}</span>
            </div>
          </motion.div>
        )}

        {/* Feature Maps Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm mb-2">
              {attentionType === 'se'
                ? (animPhase === 0 ? 'Input Feature Maps' :
                   animPhase === 1 ? 'Squeezed Vector (GAP)' :
                   animPhase === 2 ? 'Excitation Weights' : 'Scaled Features')
                : attentionType === 'cbam'
                ? (animPhase === 0 ? 'Input Feature Maps' :
                   animPhase === 1 ? 'Channel Attention Weights' :
                   animPhase === 2 ? 'Spatial Attention Map' : 'Refined Output')
                : (animPhase === 0 ? 'Input Feature Maps' :
                   animPhase === 1 ? 'Q, K, V Projections' :
                   animPhase === 2 ? 'Attention Scores (Q·K^T)' : 'Weighted Sum (Attention·V)')
              }
            </h3>
            <div className="grid grid-cols-4 gap-1">
              {featureMaps.map((map, ci) => (
                attentionType === 'se' && animPhase === 1 ? (
                  <div key={ci} className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden flex flex-col items-center justify-center"
                    style={{ aspectRatio: '1 / 1' }}>
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `rgb(${Math.round(pooled[ci])}, ${Math.round(pooled[ci] * 0.3)}, ${Math.round(255 - pooled[ci])})` }}>
                      <span className="text-[8px] font-mono text-white font-bold drop-shadow-sm">
                        {Math.round(pooled[ci])}
                      </span>
                    </div>
                    <div className="text-[8px] text-center text-gray-500 dark:text-gray-400 pb-0.5 pt-0.5">
                      C{ci + 1}
                    </div>
                  </div>
                ) : (
                  <div key={ci} className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden"
                    style={{
                      opacity: attentionType === 'se' && animPhase >= 3 ? weights[ci] :
                               attentionType === 'cbam' && animPhase >= 1 ? cbamChannelWeights[ci] :
                               attentionType === 'self' && animPhase >= 3 ? 0.85 + seededRandom(ci * 7 + seed + 200) * 0.15 :
                               1,
                      transform: attentionType === 'se' && animPhase >= 3 ? `scale(${0.8 + weights[ci] * 0.2})` :
                                 attentionType === 'cbam' && animPhase >= 1 ? `scale(${0.85 + cbamChannelWeights[ci] * 0.15})` :
                                 attentionType === 'self' && animPhase >= 3 ? `scale(${0.9 + seededRandom(ci * 3 + seed + 300) * 0.1})` :
                                 'scale(1)',
                      transition: 'all 0.5s ease',
                    }}>
                    <svg viewBox={`0 0 ${FEAT_W} ${FEAT_H}`} className="w-full relative">
                      {(attentionType === 'self' && animPhase >= 3 ? weightedOutputFeatures[ci] : map).map((row, y) => row.map((val, x) => (
                        <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1}
                          fill={`rgb(${val}, ${Math.round(val * 0.3)}, ${Math.round(255 - val)})`} />
                      )))}
                      {attentionType === 'cbam' && animPhase >= 2 && spatialAttentionMap.map((row, y) => row.map((v, x) => (
                        <rect key={`sp-${y}-${x}`} x={x} y={y} width={1} height={1}
                          fill={`rgba(34, 197, 94, ${(1 - v) * 0.5})`} />
                      )))}
                    </svg>
                    <div className="text-[8px] text-center text-gray-500 dark:text-gray-400 pb-0.5">
                      C{ci + 1}
                      {(attentionType === 'se' && animPhase >= 3) && (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-0.5">
                          ×{weights[ci].toFixed(2)}
                        </span>
                      )}
                      {(attentionType === 'cbam' && animPhase >= 1) && (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-0.5">
                          ×{cbamChannelWeights[ci].toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Bar chart for weights / attention score matrix */}
          <div>
            <h3 className="font-semibold text-sm mb-2">
              {attentionType === 'se'
                ? (animPhase <= 1 ? 'Squeezed Values (GAP)' :
                   animPhase === 2 ? 'Excitation Weights' : 'Scaled Weights')
               : attentionType === 'cbam'
                 ? (animPhase <= 1 ? 'Channel Attention Weights' :
                    animPhase === 2 ? 'Spatial Attention Map' : 'Refined Output')
                 : (animPhase === 0 ? 'Awaiting Input' :
                    animPhase === 1 ? 'Q, K, V Projections' :
                    animPhase === 2 ? 'Attention Score Map' : 'Weighted Output')}
            </h3>
            {attentionType === 'cbam' && animPhase === 2 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-white dark:bg-gray-800">
                <svg viewBox={`0 0 ${FEAT_W} ${FEAT_H}`} className="w-full">
                  {spatialAttentionMap.map((row, y) => row.map((v, x) => (
                    <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1}
                      fill={`rgba(34, 197, 94, ${v})`}
                      stroke="#e5e7eb"
                      strokeWidth="0.05"
                    />
                  )))}
                </svg>
              </div>
            ) : attentionType !== 'self' && !(attentionType === 'se' && animPhase === 1) ? (
              <div className="flex items-end gap-1 h-32 border-b border-gray-300 dark:border-gray-600 pb-1">
                {(attentionType === 'cbam' ? cbamChannelWeights : weights).map((w, i) => {
                  const phase = animPhase;
                  const revealed = attentionType === 'se' ? phase >= 2 : phase >= 1;
                  const targetH = revealed ? (w / (attentionType === 'cbam' ? cbamMaxWeight : maxWeight)) * 100 : 2;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <motion.div
                        animate={{ height: targetH }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="w-full rounded-t cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: w > 0.6 ? '#22c55e' : w > 0.3 ? '#eab308' : '#ef4444',
                          opacity: w * 0.5 + 0.5,
                        }}
                      />
                      <div className="text-[8px] text-gray-500 dark:text-gray-400">C{i + 1}</div>
                      {revealed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-[7px] font-mono text-gray-600 dark:text-gray-400">
                          {w.toFixed(2)}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : attentionType === 'se' && animPhase === 1 ? (
              <div className="flex items-end gap-1 h-32 border-b border-gray-300 dark:border-gray-600 pb-1">
                {pooled.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <motion.div
                      animate={{ height: (v / Math.max(...pooled, 1)) * 100 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="w-full rounded-t"
                      style={{ backgroundColor: '#93c5fd' }}
                    />
                    <div className="text-[8px] text-gray-500 dark:text-gray-400">C{i + 1}</div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-[7px] font-mono text-gray-600 dark:text-gray-400">
                      {Math.round(v)}
                    </motion.div>
                  </div>
                ))}
              </div>
            ) : attentionType === 'self' && animPhase === 0 ? (
              <div className="flex items-center justify-center h-32 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                <span className="text-xs text-gray-400 dark:text-gray-500">Awaiting attention computation...</span>
              </div>
            ) : attentionType === 'self' && animPhase === 1 ? (
              <div className="flex flex-col gap-3 h-32 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 rounded bg-blue-400" />
                  <div className="text-xs font-mono text-blue-700 dark:text-blue-300">Q = X·W<sub>Q</sub></div>
                  <div className="text-[10px] text-gray-400 ml-auto">dim 6→8</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 rounded bg-green-400" />
                  <div className="text-xs font-mono text-green-700 dark:text-green-300">K = X·W<sub>K</sub></div>
                  <div className="text-[10px] text-gray-400 ml-auto">dim 6→8</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-6 rounded bg-purple-400" />
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-300">V = X·W<sub>V</sub></div>
                  <div className="text-[10px] text-gray-400 ml-auto">dim 6→8</div>
                </div>
              </div>
            ) : attentionType === 'self' && animPhase === 2 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-white dark:bg-gray-800">
                <svg viewBox="0 0 80 80" className="w-full">
                  {selfAttentionMatrix.map((row, i) =>
                    row.map((v, j) => (
                      <rect key={`${i}-${j}`} x={i * 10} y={j * 10} width={10} height={10}
                        fill={`rgba(59, 130, 246, ${v})`}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                      />
                    ))
                  )}
                </svg>
              </div>
            ) : attentionType === 'self' && animPhase >= 3 ? (
              <div className="flex flex-col gap-2 h-32 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 p-3 overflow-y-auto">
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Attention·V per channel</div>
                {weightedOutputFeatures.map((ch, ci) => {
                  const avg = ch.reduce((s, row) => s + row.reduce((a, v) => a + v, 0), 0) / (FEAT_H * FEAT_W);
                  return (
                    <div key={ci} className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-500 w-6">C{ci + 1}</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div className="h-full rounded bg-blue-400"
                          style={{ width: `${(avg / 255) * 100}%` }} />
                      </div>
                      <span className="font-mono text-gray-600 dark:text-gray-400 w-8 text-right">{Math.round(avg)}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              <span>{attentionType === 'self' && animPhase === 2 ? 'Low' : attentionType === 'cbam' && animPhase >= 2 ? 'Low' : 'Weak'}</span>
              <span>{attentionType === 'self' && animPhase === 2 ? 'High' : attentionType === 'cbam' && animPhase >= 2 ? 'High' : 'Strong'}</span>
            </div>
          </div>
        </div>

        {/* Computation details */}
        {(attentionType === 'se' && animPhase >= 2) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-semibold text-sm mb-2">SE-Net Attention Computation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Squeeze</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  z = GAP(F) = {pooled.map(v => Math.round(v)).join(', ')}
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Global average pooling converts H×W×C → 1×1×C
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Excitation</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  s = σ(W₂·δ(W₁·z))
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Two FC layers with reduction ratio r={reduction}, ReLU, and Sigmoid
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Scale</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  F̃ = s · F
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Channel-wise multiplication: each channel scaled by its learned weight
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(attentionType === 'cbam' && animPhase >= 1) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
            <h3 className="font-semibold text-sm mb-2">CBAM Computation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-800">
                <span className="font-semibold text-green-700 dark:text-green-400">Channel Attention</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  M_c = σ(MLP(AvgPool(F)) + MLP(MaxPool(F)))
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Avg &amp; max pooled features passed through a shared MLP, then summed and sigmoided
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-800">
                <span className="font-semibold text-green-700 dark:text-green-400">Spatial Attention</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  M_s = σ( f^7×7( [AvgPool(F); MaxPool(F)] ))
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Concatenate avg &amp; max pool across channels, apply 7×7 conv + sigmoid
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-800">
                <span className="font-semibold text-green-700 dark:text-green-400">Sequential Refinement</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  F' = M_c(F) ⊙ F,  F'' = M_s(F') ⊙ F'
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Channel attention first, then spatial attention — applied sequentially
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(attentionType === 'self' && animPhase >= 1) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400">
            <h3 className="font-semibold text-sm mb-2">Self-Attention Computation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800">
                <span className="font-semibold text-red-700 dark:text-red-400">Q, K, V Projections</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  Q = XW_Q, K = XW_K, V = XW_V
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Input projected into Query, Key, Value spaces via learned linear transforms
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800">
                <span className="font-semibold text-red-700 dark:text-red-400">Attention Scores</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  A = softmax(Q·K^T / √d_k)
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Dot product of Q and K, scaled by √d_k, normalized with softmax
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800">
                <span className="font-semibold text-red-700 dark:text-red-400">Weighted Sum</span>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 font-mono">
                  Z = A · V
                </div>
                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                  Attention weights are multiplied by Values; each position gets a weighted sum of all positions
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div animate={attentionType === 'se' ? { scale: 1.02 } : {}}
            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
            <h3 className="font-semibold text-sm mb-2">Squeeze-and-Excitation</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Models channel interdependencies. Squeeze: GAP. Excitation: FC→ReLU→FC→Sigmoid.
              Scale: multiply. Minimal overhead, significant gains.
            </p>
          </motion.div>
          <motion.div animate={attentionType === 'cbam' ? { scale: 1.02 } : {}}
            className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
            <h3 className="font-semibold text-sm mb-2">CBAM</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Channel attention then spatial attention. Spatial branch uses max/avg pool
              across channels + 7×7 conv for spatial attention map.
            </p>
          </motion.div>
          <motion.div animate={attentionType === 'self' ? { scale: 1.02 } : {}}
            className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400">
            <h3 className="font-semibold text-sm mb-2">Self-Attention</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Non-local: every pixel attends to every other via Q,K,V. Captures long-range
              dependencies that CNNs struggle with.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
