'use client';

import React, { useState, useMemo } from 'react';

type Optimizer = 'sgd' | 'momentum' | 'adam';

interface Point { x: number; y: number; z: number }

function lossFunc(x: number, y: number): number {
  return 0.5 * (x * x + 3 * y * y) + 0.3 * Math.sin(2 * x) * Math.sin(2 * y);
}

function lossGrad(x: number, y: number): [number, number] {
  const dx = x + 0.6 * Math.cos(2 * x) * Math.sin(2 * y);
  const dy = 6 * y + 0.6 * Math.sin(2 * x) * Math.cos(2 * y);
  return [dx, dy];
}

export default function LossLandscapeExplorer() {
  const [optimizer, setOptimizer] = useState<Optimizer>('sgd');
  const [lr, setLr] = useState(0.1);
  const [path, setPath] = useState<Point[]>([{ x: 2.5, y: 1.8, z: lossFunc(2.5, 1.8) }]);
  const [velX, setVelX] = useState(0);
  const [velY, setVelY] = useState(0);
  const [mX, setMX] = useState(0);
  const [mY, setMY] = useState(0);
  const [vX, setVX] = useState(0);
  const [vY, setVY] = useState(0);

  const current = path[path.length - 1];
  const [dx, dy] = lossGrad(current.x, current.y);

  const svgW = 400;
  const svgH = 300;
  const xMin = -3, xMax = 3, yMin = -2, yMax = 2;

  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * svgW;
  const toSvgY = (y: number) => ((yMax - y) / (yMax - yMin)) * svgH;

  const contours = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let level = 0; level <= 15; level++) {
      const threshold = level * 1.5;
      for (let ix = 0; ix < 80; ix++) {
        for (let iy = 0; iy < 60; iy++) {
          const x = xMin + (ix / 80) * (xMax - xMin);
          const y = yMax - (iy / 60) * (yMax - yMin);
          const v = lossFunc(x, y);
          const dx2 = lossFunc(x + 0.05, y) - v;
          const dy2 = lossFunc(x, y + 0.05) - v;
          if (Math.abs(dx2) < 0.3 && Math.abs(v - threshold) < 0.15) {
            lines.push(<circle key={`c${level}-${ix}-${iy}`} cx={toSvgX(x)} cy={toSvgY(y)} r={1} fill={`rgba(99, 102, 241, ${0.15 + level * 0.03})`} />);
          }
        }
      }
    }
    return lines;
  }, []);

  const step = () => {
    let nx: number, ny: number;
    const t = path.length;
    const beta = 0.9;
    const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;

    switch (optimizer) {
      case 'sgd':
        nx = current.x - lr * dx;
        ny = current.y - lr * dy;
        break;
      case 'momentum':
        const newVX = beta * velX + dx;
        const newVY = beta * velY + dy;
        nx = current.x - lr * newVX;
        ny = current.y - lr * newVY;
        setVelX(newVX);
        setVelY(newVY);
        break;
      case 'adam':
        const newMX = beta1 * mX + (1 - beta1) * dx;
        const newMY = beta1 * mY + (1 - beta1) * dy;
        const newVX2 = beta2 * vX + (1 - beta2) * dx * dx;
        const newVY2 = beta2 * vY + (1 - beta2) * dy * dy;
        const mHatX = newMX / (1 - Math.pow(beta1, t));
        const mHatY = newMY / (1 - Math.pow(beta1, t));
        const vHatX = newVX2 / (1 - Math.pow(beta2, t));
        const vHatY = newVY2 / (1 - Math.pow(beta2, t));
        nx = current.x - lr * mHatX / (Math.sqrt(vHatX) + eps);
        ny = current.y - lr * mHatY / (Math.sqrt(vHatY) + eps);
        setMX(newMX);
        setMY(newMY);
        setVX(newVX2);
        setVY(newVY2);
        break;
    }

    nx = Math.max(xMin, Math.min(xMax, nx));
    ny = Math.max(yMin, Math.min(yMax, ny));
    setPath(prev => [...prev, { x: nx, y: ny, z: lossFunc(nx, ny) }]);
  };

  const reset = () => {
    setPath([{ x: 2.5, y: 1.8, z: lossFunc(2.5, 1.8) }]);
    setVelX(0); setVelY(0);
    setMX(0); setMY(0);
    setVX(0); setVY(0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loss Landscape Explorer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Visualize how different optimizers navigate a 2D loss surface. Watch SGD, Momentum, and Adam find the minimum.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Loss Surface</h3>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <defs>
              <radialGradient id="bg-grad">
                <stop offset="0%" stopColor="#EEF2FF" />
                <stop offset="100%" stopColor="#C7D2FE" />
              </radialGradient>
            </defs>
            <rect width={svgW} height={svgH} fill="url(#bg-grad)" rx="8" />
            {contours}

            {path.length > 1 && (
              <polyline
                points={path.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ')}
                fill="none"
                stroke="#EF4444"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            )}

            {path.map((p, i) => (
              <circle key={i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={i === path.length - 1 ? 6 : 3}
                fill={i === path.length - 1 ? '#EF4444' : '#F87171'} stroke="white" strokeWidth={1.5} />
            ))}

            <circle cx={toSvgX(0)} cy={toSvgY(0)} r={5} fill="#22C55E" stroke="white" strokeWidth={2} />
            <text x={toSvgX(0) + 10} y={toSvgY(0) + 4} fontSize={10} fill="#16A34A" fontWeight="bold">Min</text>
          </svg>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Optimizer</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(['sgd', 'momentum', 'adam'] as Optimizer[]).map(opt => (
                <button key={opt} onClick={() => { setOptimizer(opt); reset(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer uppercase ${optimizer === opt ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Learning Rate</span><strong>{lr.toFixed(3)}</strong>
                </label>
                <input type="range" min="0.01" max="0.5" step="0.01" value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current State</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Position</span>
                <strong className="text-gray-900 dark:text-gray-100">({current.x.toFixed(3)}, {current.y.toFixed(3)})</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Loss</span>
                <strong className="text-red-600 dark:text-red-400">{current.z.toFixed(6)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Gradient</span>
                <strong className="text-gray-900 dark:text-gray-100">({dx.toFixed(3)}, {dy.toFixed(3)})</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Steps</span>
                <strong className="text-gray-900 dark:text-gray-100">{path.length - 1}</strong>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={step} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
              Step
            </button>
            <button onClick={() => { for (let i = 0; i < 50; i++) step(); }} className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
              Run 50 Steps
            </button>
            <button onClick={reset} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Optimizers Explained</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>SGD</strong>: Basic gradient descent. Can get stuck or oscillate. <strong>Momentum</strong>: Adds velocity to smooth updates and escape local minima. <strong>Adam</strong>: Adaptive learning rates per parameter + momentum. Converges fast but may generalize worse.
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Loss Surface</span>
            <span>→ The terrain your model navigates. Valleys are good solutions, plateaus are dead zones.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Learning Rate</span>
            <span>→ Step size. Too big: overshoot. Too small: takes forever. This is the #1 hyperparameter to tune.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Adam</span>
            <span>→ The default optimizer in PyTorch. Works well out of the box for most problems.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
