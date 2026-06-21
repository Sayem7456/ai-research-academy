/**
 * BayesianUpdateSimulator - Interactive Bayesian updating visualization
 * Phase 10: Mathematics Visualizations
 *
 * Visualizes the Beta-Bernoulli conjugate model: how prior beliefs
 * update as new coin-flip evidence arrives.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

const WIDTH = 380;
const HEIGHT = 220;
const PAD = { top: 10, right: 10, bottom: 30, left: 10 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function logGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaPDF(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0;
  const logB = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logB);
}

function computeBetaPDF(alpha: number, beta: number, n: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  // Sample from epsilon to 1-epsilon to avoid singularities at boundaries
  // (important for Jeffreys prior Beta(0.5,0.5) which diverges at 0 and 1)
  const eps = 0.005;
  for (let i = 0; i <= n; i++) {
    const x = eps + (1 - 2 * eps) * (i / n);
    pts.push({ x, y: betaPDF(x, alpha, beta) });
  }
  return pts;
}

const PRIOR_PRESETS = [
  { name: 'Uniform', alpha: 1, beta: 1, desc: 'No prior knowledge — all values equally likely.' },
  { name: 'Weak (0.5)', alpha: 2, beta: 2, desc: 'Weak belief that p is near 0.5.' },
  { name: 'Strong (0.7)', alpha: 14, beta: 6, desc: 'Strong prior belief that p ≈ 0.7.' },
  { name: 'Jeffreys', alpha: 0.5, beta: 0.5, desc: 'Non-informative Jeffreys prior. U-shaped — favors extremes.' },
];

export default function BayesianUpdateSimulator() {
  const [priorAlpha, setPriorAlpha] = useState(1);
  const [priorBeta, setPriorBeta] = useState(1);
  const [observations, setObservations] = useState<number[]>([]);
  const [trueProb, setTrueProb] = useState(0.6);
  const [showPrior, setShowPrior] = useState(true);

  // Posterior = prior + data
  const successes = observations.filter((o) => o === 1).length;
  const failures = observations.filter((o) => o === 0).length;
  const postAlpha = priorAlpha + successes;
  const postBeta = priorBeta + failures;

  const priorPDF = useMemo(() => computeBetaPDF(priorAlpha, priorBeta, 100), [priorAlpha, priorBeta]);
  const postPDF = useMemo(() => computeBetaPDF(postAlpha, postBeta, 100), [postAlpha, postBeta]);

  const priorMean = priorAlpha / (priorAlpha + priorBeta);
  const postMean = postAlpha / (postAlpha + postBeta);
  const mle = observations.length > 0 ? successes / observations.length : 0.5;

  // Scale
  const allY = [...priorPDF.map((p) => p.y), ...postPDF.map((p) => p.y)];
  const yMax = Math.max(...allY) * 1.15 || 1;

  const scaleX = (x: number) => PAD.left + x * PLOT_W;
  const scaleY = (y: number) => PAD.top + PLOT_H - (y / yMax) * PLOT_H;

  const priorPath = priorPDF.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(' ');
  const postPath = postPDF.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(' ');

  const addObservation = useCallback((value: number) => {
    setObservations((prev) => [...prev, value]);
  }, []);

  const addRandomObservation = useCallback(() => {
    const value = Math.random() < trueProb ? 1 : 0;
    addObservation(value);
  }, [trueProb, addObservation]);

  const addBatch = useCallback((n: number) => {
    const newObs: number[] = [];
    for (let i = 0; i < n; i++) {
      newObs.push(Math.random() < trueProb ? 1 : 0);
    }
    setObservations((prev) => [...prev, ...newObs]);
  }, [trueProb]);

  const reset = () => setObservations([]);

  const setPrior = (preset: typeof PRIOR_PRESETS[number]) => {
    setPriorAlpha(preset.alpha);
    setPriorBeta(preset.beta);
    reset();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Bayesian Update Simulator
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Watch how Bayesian inference updates beliefs about a coin&apos;s bias (p) as you observe flips. Uses the Beta-Bernoulli conjugate model.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <svg width={WIDTH} height={HEIGHT} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
            {/* Axis */}
            <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#6B7280" strokeWidth="1" />
            {/* X-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <text key={v} x={scaleX(v)} y={PAD.top + PLOT_H + 15} fill="#9CA3AF" fontSize="9" textAnchor="middle">{v.toFixed(2)}</text>
            ))}
            <text x={PAD.left + PLOT_W / 2} y={HEIGHT - 2} fill="#6B7280" fontSize="10" textAnchor="middle">p (probability of heads)</text>

            {/* Prior */}
            {showPrior && (
              <motion.path d={priorPath} fill="rgba(156,163,175,0.1)" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="5,3"
                animate={{ d: priorPath }} transition={{ duration: 0.3 }} />
            )}

            {/* Posterior fill */}
            <motion.path
              d={postPath + ` L ${scaleX(1)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`}
              fill="rgba(99, 102, 241, 0.15)" stroke="none"
              animate={{ d: postPath + ` L ${scaleX(1)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z` }}
              transition={{ duration: 0.3 }}
            />

            {/* Posterior line */}
            <motion.path d={postPath} fill="none" stroke="#6366F1" strokeWidth="2.5"
              animate={{ d: postPath }} transition={{ duration: 0.3 }} />

            {/* Prior mean */}
            {showPrior && (
              <line x1={scaleX(priorMean)} y1={PAD.top} x2={scaleX(priorMean)} y2={PAD.top + PLOT_H}
                stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3" />
            )}

            {/* Posterior mean */}
            <line x1={scaleX(postMean)} y1={PAD.top} x2={scaleX(postMean)} y2={PAD.top + PLOT_H}
              stroke="#6366F1" strokeWidth="1.5" strokeDasharray="5,3" />

            {/* MLE */}
            {observations.length > 0 && (
              <line x1={scaleX(mle)} y1={PAD.top} x2={scaleX(mle)} y2={PAD.top + PLOT_H}
                stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2,2" />
            )}

            {/* True value */}
            <line x1={scaleX(trueProb)} y1={PAD.top} x2={scaleX(trueProb)} y2={PAD.top + PLOT_H}
              stroke="#22C55E" strokeWidth="1.5" />
          </svg>

          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {showPrior && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block border-dashed" style={{ borderTop: '1px dashed #9CA3AF' }} /> Prior</span>}
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Posterior</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block border-dashed" style={{ borderTop: '1px dashed #EF4444' }} /> MLE</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> True p</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Flip buttons */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Observe coin flips:</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => addObservation(1)}
                className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer">
                Heads (1)
              </button>
              <button onClick={() => addObservation(0)}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer">
                Tails (0)
              </button>
              <button onClick={addRandomObservation}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                Random Flip
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => addBatch(10)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">+10 random</button>
              <button onClick={() => addBatch(50)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">+50 random</button>
              <button onClick={reset}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">Reset</button>
            </div>
          </div>

          {/* True probability */}
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
              <span>True coin bias (hidden):</span>
              <strong className="text-green-600 dark:text-green-400">{trueProb.toFixed(2)}</strong>
            </label>
            <input type="range" min="0.05" max="0.95" step="0.05" value={trueProb}
              onChange={(e) => { setTrueProb(parseFloat(e.target.value)); reset(); }}
              className="w-full accent-green-500" />
          </div>

          {/* Prior presets */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Prior:</label>
            <div className="flex flex-wrap gap-2">
              {PRIOR_PRESETS.map((p) => (
                <button key={p.name} onClick={() => setPrior(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    priorAlpha === p.alpha && priorBeta === p.beta
                      ? 'bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={showPrior} onChange={() => setShowPrior(!showPrior)} className="rounded" />
            Show prior distribution
          </label>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Prior mean</span>
              <p className="font-bold text-gray-700 dark:text-gray-300">{priorMean.toFixed(3)}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2">
              <span className="text-xs text-indigo-500 dark:text-indigo-400">Posterior mean</span>
              <p className="font-bold text-indigo-700 dark:text-indigo-300">{postMean.toFixed(3)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <span className="text-xs text-red-500 dark:text-red-400">MLE</span>
              <p className="font-bold text-red-700 dark:text-red-300">{observations.length > 0 ? mle.toFixed(3) : '—'}</p>
            </div>
          </div>

          {/* Observation history */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Flips: {observations.length} | Heads: {successes} | Tails: {failures}</p>
            <p>Beta({postAlpha.toFixed(1)}, {postBeta.toFixed(1)})</p>
            {observations.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-1 max-h-12 overflow-y-auto">
                {observations.slice(-50).map((o, i) => (
                  <span key={i} className={`w-4 h-4 rounded text-center leading-4 text-white text-[9px] font-bold ${o === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {o}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Educational */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Bayesian Updating</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Prior</strong> Beta(α,β) + <strong>Data</strong> (s heads, f tails) → <strong>Posterior</strong> Beta(α+s, β+f)
              <br /><br />
              The posterior mean is a weighted average of the prior mean and the MLE.
              With more data, the posterior concentrates around the true value and the prior matters less.
              Notice how the posterior (indigo) moves from the prior (gray) toward the MLE (red) and eventually converges on the true value (green).
            </p>
          </div>

          {/* AI/ML Analogy */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
            <p className="text-amber-800 dark:text-amber-300 text-xs mb-3">
              Bayesian updating is how a model learns from evidence — start with a guess, see data, update your belief.
            </p>
            <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Prior</span>
                <span>→ Your initial belief before seeing data. Like pre-training knowledge or domain expertise injected into a model.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Likelihood</span>
                <span>→ How well the data explains different parameter values. Like the loss function measuring fit.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Posterior</span>
                <span>→ Updated belief after seeing data. The model&apos;s best guess combining prior knowledge + evidence.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">MAP vs MLE</span>
                <span>→ MAP = posterior mode (uses prior). MLE = just data. With lots of data, they converge. With little data, prior helps.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-300">Regularization</span>
                <span>→ L2 regularization = Gaussian prior on weights. L1 = Laplace prior. Bayesian view explains why regularization works!</span>
              </div>
            </div>
            <p className="text-amber-600 dark:text-amber-500 text-xs mt-3 font-medium">
              Bayesian methods are the foundation of active learning, uncertainty estimation, and probabilistic ML models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
