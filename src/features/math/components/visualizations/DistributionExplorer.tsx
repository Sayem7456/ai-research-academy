/**
 * DistributionExplorer - Interactive probability distribution viewer
 * Phase 10: Mathematics Visualizations
 *
 * Visualize common probability distributions with adjustable parameters.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

type DistType = 'gaussian' | 'uniform' | 'binomial' | 'poisson' | 'exponential' | 'beta';

const DISTRIBUTIONS: { id: DistType; name: string; params: { key: string; label: string; min: number; max: number; step: number; default: number }[] }[] = [
  { id: 'gaussian', name: 'Gaussian', params: [
    { key: 'mu', label: 'Mean (μ)', min: -5, max: 5, step: 0.1, default: 0 },
    { key: 'sigma', label: 'Std Dev (σ)', min: 0.1, max: 5, step: 0.1, default: 1 },
  ]},
  { id: 'uniform', name: 'Uniform', params: [
    { key: 'a', label: 'Lower (a)', min: -5, max: 5, step: 0.1, default: -2 },
    { key: 'b', label: 'Upper (b)', min: -5, max: 10, step: 0.1, default: 2 },
  ]},
  { id: 'binomial', name: 'Binomial', params: [
    { key: 'n', label: 'Trials (n)', min: 1, max: 50, step: 1, default: 20 },
    { key: 'p', label: 'Probability (p)', min: 0.01, max: 0.99, step: 0.01, default: 0.5 },
  ]},
  { id: 'poisson', name: 'Poisson', params: [
    { key: 'lambda', label: 'Rate (λ)', min: 0.1, max: 20, step: 0.1, default: 5 },
  ]},
  { id: 'exponential', name: 'Exponential', params: [
    { key: 'lambda', label: 'Rate (λ)', min: 0.1, max: 5, step: 0.1, default: 1 },
  ]},
  { id: 'beta', name: 'Beta', params: [
    { key: 'alpha', label: 'Alpha (α)', min: 0.1, max: 20, step: 0.1, default: 2 },
    { key: 'beta', label: 'Beta (β)', min: 0.1, max: 20, step: 0.1, default: 5 },
  ]},
];

function gaussianPDF(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

function uniformPDF(x: number, a: number, b: number): number {
  if (a >= b) return 0; // Guard against invalid parameters
  return x >= a && x <= b ? 1 / (b - a) : 0;
}

function exponentialPDF(x: number, lambda: number): number {
  return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
}

function betaPDF(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0;
  // Use log-gamma for numerical stability
  const logBeta = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta);
}

function logGamma(z: number): number {
  // Stirling's approximation
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  let logCoeff = 0;
  for (let i = 0; i < k; i++) logCoeff += Math.log(n - i) - Math.log(i + 1);
  return Math.exp(logCoeff + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

function poissonPMF(k: number, lambda: number): number {
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

const WIDTH = 340;
const HEIGHT = 200;
const PAD = { top: 10, right: 10, bottom: 30, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

export default function DistributionExplorer() {
  const [distId, setDistId] = useState<DistType>('gaussian');
  const [params, setParams] = useState<Record<string, number>>({});
  const [showCDF, setShowCDF] = useState(false);

  const dist = DISTRIBUTIONS.find((d) => d.id === distId)!;

  // Initialize params on distribution change
  React.useEffect(() => {
    const p: Record<string, number> = {};
    dist.params.forEach((param) => { p[param.key] = param.default; });
    setParams(p);
  }, [distId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDiscrete = distId === 'binomial' || distId === 'poisson';

  // Compute distribution data
  const { points, mean, variance, xRange, yMax } = useMemo(() => {
    let xMin = -5, xMax = 5;
    let fn: (x: number) => number;
    let m = 0, v = 0;

    switch (distId) {
      case 'gaussian':
        fn = (x) => gaussianPDF(x, params.mu ?? 0, params.sigma ?? 1);
        m = params.mu ?? 0;
        v = (params.sigma ?? 1) ** 2;
        xMin = m - 4 * (params.sigma ?? 1);
        xMax = m + 4 * (params.sigma ?? 1);
        break;
      case 'uniform': {
        const ua = params.a ?? -2, ub = params.b ?? 2;
        fn = (x) => uniformPDF(x, ua, ub);
        m = ua < ub ? (ua + ub) / 2 : 0;
        v = ua < ub ? (ub - ua) ** 2 / 12 : 0;
        xMin = (ua < ub ? ua : Math.min(ua, ub)) - 1;
        xMax = (ua < ub ? ub : Math.max(ua, ub)) + 1;
        break;
      }
      case 'exponential':
        fn = (x) => exponentialPDF(x, params.lambda ?? 1);
        m = 1 / (params.lambda ?? 1);
        v = 1 / (params.lambda ?? 1) ** 2;
        xMin = 0;
        xMax = 5 / (params.lambda ?? 1);
        break;
      case 'beta': {
        const ba = params.alpha ?? 2, bb = params.beta ?? 5;
        fn = (x) => betaPDF(x, ba, bb);
        m = ba / (ba + bb);
        v = (ba * bb) / ((ba + bb) ** 2 * (ba + bb + 1));
        // Sample from epsilon to 1-epsilon to avoid boundary singularities
        // when α<1 or β<1 (PDF diverges at 0 and/or 1)
        xMin = 0.005; xMax = 0.995;
        break;
      }
      default:
        fn = () => 0;
    }

    const pts: { x: number; y: number; cdf: number }[] = [];
    const N = 200;
    let cumSum = 0;
    const dx = (xMax - xMin) / N;
    let maxY = 0;

    for (let i = 0; i <= N; i++) {
      const x = xMin + dx * i;
      const y = fn(x);
      cumSum += y * dx;
      pts.push({ x, y, cdf: cumSum });
      maxY = Math.max(maxY, y);
    }

    return { points: pts, mean: m, variance: v, xRange: [xMin, xMax] as [number, number], yMax: maxY * 1.15 };
  }, [distId, params]);

  // Discrete distributions
  const discretePoints = useMemo(() => {
    if (!isDiscrete) return [];
    const pts: { x: number; y: number; cdf: number }[] = [];
    let cumSum = 0;

    if (distId === 'binomial') {
      const n = Math.round(params.n ?? 20);
      const p = params.p ?? 0.5;
      for (let k = 0; k <= n; k++) {
        const y = binomialPMF(k, n, p);
        cumSum += y;
        pts.push({ x: k, y, cdf: cumSum });
      }
    } else if (distId === 'poisson') {
      const lambda = params.lambda ?? 5;
      const maxK = Math.ceil(lambda + 5 * Math.sqrt(lambda) + 5);
      for (let k = 0; k <= maxK; k++) {
        const y = poissonPMF(k, lambda);
        cumSum += y;
        pts.push({ x: k, y, cdf: cumSum });
      }
    }

    return pts;
  }, [distId, params, isDiscrete]);

  // SVG scales
  const allPoints = isDiscrete ? discretePoints : points;
  const actualYMax = isDiscrete
    ? Math.max(...discretePoints.map((p) => p.y)) * 1.15
    : yMax;
  const actualXRange: [number, number] = isDiscrete
    ? [Math.min(...discretePoints.map((p) => p.x)) - 1, Math.max(...discretePoints.map((p) => p.x)) + 1]
    : xRange;

  const scaleX = (x: number) => PAD.left + ((x - actualXRange[0]) / (actualXRange[1] - actualXRange[0])) * PLOT_W;
  const scaleY = (y: number) => PAD.top + PLOT_H - (y / actualYMax) * PLOT_H;

  // Compute mean/variance for discrete
  const discreteMean = isDiscrete ? discretePoints.reduce((s, p) => s + p.x * p.y, 0) : mean;
  const discreteVar = isDiscrete ? discretePoints.reduce((s, p) => s + (p.x - discreteMean) ** 2 * p.y, 0) : variance;

  // PDF path
  const pdfPath = allPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`
  ).join(' ');

  // CDF path
  const cdfPath = allPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.cdf * actualYMax).toFixed(1)}`
  ).join(' ');

  // Fill area under PDF
  const fillPath = pdfPath + ` L ${scaleX(allPoints[allPoints.length - 1]?.x ?? 0).toFixed(1)} ${scaleY(0).toFixed(1)} L ${scaleX(allPoints[0]?.x ?? 0).toFixed(1)} ${scaleY(0).toFixed(1)} Z`;

  const updateParam = (key: string, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Probability Distribution Explorer
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Explore common probability distributions by adjusting their parameters. See how shape, mean, and variance change.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <svg width={WIDTH} height={HEIGHT} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
            {/* Axes */}
            <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#6B7280" strokeWidth="1" />
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#6B7280" strokeWidth="1" />

            {/* Fill */}
            {!isDiscrete && (
              <motion.path d={fillPath} fill="rgba(99, 102, 241, 0.15)" stroke="none"
                animate={{ d: fillPath }} transition={{ duration: 0.3 }} />
            )}

            {/* PDF */}
            {isDiscrete ? (
              discretePoints.map((p, i) => (
                <motion.rect
                  key={i}
                  animate={{
                    x: scaleX(p.x) - 4,
                    y: scaleY(p.y),
                    height: PAD.top + PLOT_H - scaleY(p.y),
                  }}
                  transition={{ duration: 0.3 }}
                  width="8" fill="#6366F1" opacity={0.7} rx="1"
                />
              ))
            ) : (
              <motion.path d={pdfPath} fill="none" stroke="#6366F1" strokeWidth="2"
                animate={{ d: pdfPath }} transition={{ duration: 0.3 }} />
            )}

            {/* CDF */}
            {showCDF && (
              <motion.path d={cdfPath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,4"
                animate={{ d: cdfPath }} transition={{ duration: 0.3 }} />
            )}

            {/* Mean line */}
            <line x1={scaleX(discreteMean)} y1={PAD.top} x2={scaleX(discreteMean)} y2={PAD.top + PLOT_H}
              stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x={scaleX(discreteMean) + 3} y={PAD.top + 12} fill="#EF4444" fontSize="10">μ</text>

            {/* X-axis labels */}
            {(() => {
              const ticks = 6;
              return Array.from({ length: ticks }, (_, i) => {
                const x = actualXRange[0] + (actualXRange[1] - actualXRange[0]) * (i / (ticks - 1));
                return (
                  <text key={i} x={scaleX(x)} y={PAD.top + PLOT_H + 15} fill="#9CA3AF" fontSize="9" textAnchor="middle">
                    {x.toFixed(isDiscrete ? 0 : 1)}
                  </text>
                );
              });
            })()}
          </svg>

          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block" /> PDF/PMF</span>
            {showCDF && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block border-dashed" style={{ borderTop: '1px dashed #F59E0B' }} /> CDF</span>}
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block border-dashed" style={{ borderTop: '1px dashed #EF4444' }} /> Mean</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Distribution selector */}
          <div className="flex flex-wrap gap-2">
            {DISTRIBUTIONS.map((d) => (
              <button key={d.id} onClick={() => setDistId(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${distId === d.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {d.name}
              </button>
            ))}
          </div>

          {/* Parameter sliders */}
          {dist.params.map((p) => (
            <div key={p.key}>
              <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                <span>{p.label}:</span>
                <strong>{(params[p.key] ?? p.default).toFixed(p.step < 1 ? (p.step < 0.1 ? 2 : 1) : 0)}</strong>
              </label>
              <input type="range" min={p.min} max={p.max} step={p.step}
                value={params[p.key] ?? p.default}
                onChange={(e) => updateParam(p.key, parseFloat(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
          ))}

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={showCDF} onChange={() => setShowCDF(!showCDF)} className="rounded" />
            Show CDF (cumulative distribution)
          </label>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Mean (μ)</span>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{discreteMean.toFixed(3)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Variance (σ²)</span>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{discreteVar.toFixed(3)}</p>
            </div>
          </div>

          {/* Educational */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">{dist.name} Distribution</h4>
            <p className="text-blue-800 dark:text-blue-300 text-xs">
              {distId === 'gaussian' && 'The bell curve. Appears everywhere due to the Central Limit Theorem. Defined by mean μ (center) and σ (spread). 68% of data falls within ±1σ.'}
              {distId === 'uniform' && 'All values between a and b are equally likely. Maximum entropy distribution for bounded support. Used for random initialization.'}
              {distId === 'binomial' && 'Number of successes in n independent trials, each with probability p. Used in A/B testing and classification evaluation.'}
              {distId === 'poisson' && 'Number of events in a fixed interval with rate λ. Used for modeling counts: arrivals, clicks, defects. Mean equals variance.'}
              {distId === 'exponential' && 'Time between events in a Poisson process. Memoryless: P(X > s + t | X > s) = P(X > t). Used in survival analysis and queuing.'}
              {distId === 'beta' && 'Distribution over probabilities [0,1]. Conjugate prior for Bernoulli/Binomial likelihoods. α and β act like pseudo-counts of successes and failures.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
