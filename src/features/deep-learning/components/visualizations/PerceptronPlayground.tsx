'use client';

import React, { useState, useMemo, useCallback } from 'react';

type ActivationFn = 'sigmoid' | 'relu' | 'tanh' | 'step';

const ACTIVATIONS: Record<ActivationFn, { fn: (x: number) => string; label: string; derivative: (x: number) => string }> = {
  sigmoid: { fn: (x) => `1/(1+e^(-${x.toFixed(2)})) = ${(1 / (1 + Math.exp(-x))).toFixed(3)}`, label: 'Sigmoid', derivative: (x) => { const s = 1 / (1 + Math.exp(-x)); return `${s.toFixed(3)} * (1 - ${s.toFixed(3)}) = ${(s * (1 - s)).toFixed(3)}`; } },
  relu: { fn: (x) => `max(0, ${x.toFixed(2)}) = ${Math.max(0, x).toFixed(3)}`, label: 'ReLU', derivative: (x) => `${x > 0 ? '1' : '0'}` },
  tanh: { fn: (x) => `tanh(${x.toFixed(2)}) = ${Math.tanh(x).toFixed(3)}`, label: 'Tanh', derivative: (x) => { const t = Math.tanh(x); return `1 - ${t.toFixed(3)}² = ${(1 - t * t).toFixed(3)}`; } },
  step: { fn: (x) => `${x.toFixed(2)} >= 0 ? 1 : 0 = ${x >= 0 ? 1 : 0}`, label: 'Step', derivative: () => '0 (undefined at 0)' },
};

function activate(x: number, fn: ActivationFn): number {
  switch (fn) {
    case 'sigmoid': return 1 / (1 + Math.exp(-x));
    case 'relu': return Math.max(0, x);
    case 'tanh': return Math.tanh(x);
    case 'step': return x >= 0 ? 1 : 0;
  }
}

export default function PerceptronPlayground() {
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(-0.5);
  const [bias, setBias] = useState(0.1);
  const [activation, setActivation] = useState<ActivationFn>('sigmoid');
  const [inputs, setInputs] = useState({ x1: 1, x2: 0 });

  const z = useMemo(() => w1 * inputs.x1 + w2 * inputs.x2 + bias, [w1, w2, bias, inputs]);
  const output = useMemo(() => activate(z, activation), [z, activation]);

  const activationInfo = ACTIVATIONS[activation];

  const [points, setPoints] = useState<Array<{ x: number; y: number; label: number }>>([
    { x: 0.2, y: 0.8, label: 1 },
    { x: 0.4, y: 0.6, label: 1 },
    { x: 0.3, y: 0.3, label: 0 },
    { x: 0.7, y: 0.2, label: 0 },
    { x: 0.8, y: 0.9, label: 1 },
    { x: 0.6, y: 0.1, label: 0 },
  ]);

  const addPoint = useCallback((label: number) => {
    const x = Math.random() * 0.8 + 0.1;
    const y = Math.random() * 0.8 + 0.1;
    setPoints(prev => [...prev, { x, y, label }]);
  }, []);

  const canvasW = 400;
  const canvasH = 300;

  const scaledW1 = w1 * 100;
  const scaledW2 = w2 * 100;
  const scaledBias = bias * 100;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Perceptron Playground</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        A single neuron computes z = w₁·x₁ + w₂·x₂ + b, then applies an activation function. Adjust weights and bias to see the decision boundary move.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Decision Boundary</h3>
          <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full">
            <rect width={canvasW} height={canvasH} fill="rgb(243 244 246)" rx="8" />

            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x * canvasW}
                cy={p.y * canvasH}
                r={6}
                fill={p.label === 1 ? '#22C55E' : '#EF4444'}
                stroke="white"
                strokeWidth={2}
              />
            ))}

            {Math.abs(scaledW2) > 0.01 && (
              <line
                x1={0}
                y1={((-scaledBias) / scaledW2) * canvasH}
                x2={canvasW}
                y2={((-scaledBias - scaledW1) / scaledW2) * canvasH}
                stroke="#6366F1"
                strokeWidth={3}
              />
            )}
          </svg>
          <div className="flex gap-2 mt-3">
            <button onClick={() => addPoint(1)} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer">
              + Class 1
            </button>
            <button onClick={() => addPoint(0)} className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer">
              + Class 0
            </button>
            <button onClick={() => setPoints([])} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              Clear
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Weights */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Parameters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>w₁ (input 1)</span><strong>{w1.toFixed(2)}</strong>
                </label>
                <input type="range" min="-2" max="2" step="0.1" value={w1} onChange={(e) => setW1(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>w₂ (input 2)</span><strong>{w2.toFixed(2)}</strong>
                </label>
                <input type="range" min="-2" max="2" step="0.1" value={w2} onChange={(e) => setW2(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>b (bias)</span><strong>{bias.toFixed(2)}</strong>
                </label>
                <input type="range" min="-2" max="2" step="0.1" value={bias} onChange={(e) => setBias(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            </div>
          </div>

          {/* Activation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Activation Function</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(Object.keys(ACTIVATIONS) as ActivationFn[]).map((key) => (
                <button key={key} onClick={() => setActivation(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activation === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {ACTIVATIONS[key].label}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>f(z) = {activationInfo.fn(z)}</p>
              <p>f'(z) = {activationInfo.derivative(z)}</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Test Input</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div><span className="text-xs text-gray-500 dark:text-gray-400 block">x₁</span><strong className="text-lg">{inputs.x1}</strong></div>
              <div><span className="text-xs text-gray-500 dark:text-gray-400 block">x₂</span><strong className="text-lg">{inputs.x2}</strong></div>
              <div><span className="text-xs text-gray-500 dark:text-gray-400 block">Output</span><strong className="text-lg text-indigo-600 dark:text-indigo-400">{output.toFixed(3)}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => setInputs(p => ({ ...p, x1: p.x1 === 0 ? 1 : 0 }))} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Toggle x₁ ({inputs.x1})
              </button>
              <button onClick={() => setInputs(p => ({ ...p, x2: p.x2 === 0 ? 1 : 0 }))} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Toggle x₂ ({inputs.x2})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How It Works</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          The perceptron computes a weighted sum of inputs plus a bias: z = w₁x₁ + w₂x₂ + b. This is passed through an activation function to produce the output. The decision boundary is the line where z = 0. Points on one side are classified as class 0, the other as class 1.
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Perceptron</span>
            <span>→ A single neuron in any neural network. The simplest unit that can learn.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Weights</span>
            <span>→ The knobs the network turns during training. Each weight controls how important one input is.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Activation</span>
            <span>→ The decision maker. Without it, the network is just a linear model. ReLU is the standard for hidden layers.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Bias</span>
            <span>→ Shifts the decision boundary. Without bias, the line always passes through the origin.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
