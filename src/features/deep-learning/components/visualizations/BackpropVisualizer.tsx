'use client';

import React, { useState, useMemo } from 'react';

type Step = 'forward' | 'loss' | 'backward' | 'update';

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: 'forward', label: 'Forward Pass', description: 'Compute z = wx + b, then a = σ(z)' },
  { id: 'loss', label: 'Loss', description: 'L = -(y·log(â) + (1-y)·log(1-â))' },
  { id: 'backward', label: 'Backward', description: 'Compute dL/dw and dL/db via chain rule' },
  { id: 'update', label: 'Update', description: 'w = w - η·dL/dw, b = b - η·dL/db' },
];

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }
function sigmoidDeriv(x: number): number { const s = sigmoid(x); return s * (1 - s); }

export default function BackpropVisualizer() {
  const [step, setStep] = useState<Step>('forward');
  const [x] = useState(2);
  const [y] = useState(1);
  const [w, setW] = useState(0.5);
  const [b, setB] = useState(0.1);
  const [lr] = useState(0.5);
  const [history, setHistory] = useState<Array<{ w: number; b: number; loss: number }>>([]);

  const z = w * x + b;
  const a = sigmoid(z);
  const loss = -(y * Math.log(a + 1e-7) + (1 - y) * Math.log(1 - a + 1e-7));
  const dz = a - y;
  const dw = dz * x;
  const db = dz;

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const runStep = () => {
    const nextIndex = (stepIndex + 1) % STEPS.length;
    setStep(STEPS[nextIndex].id);
    if (STEPS[nextIndex].id === 'update') {
      const newW = w - lr * dw;
      const newB = b - lr * db;
      setW(newW);
      setB(newB);
      setHistory(prev => [...prev, { w: newW, b: newB, loss }]);
    }
  };

  const reset = () => {
    setW(0.5);
    setB(0.1);
    setHistory([]);
    setStep('forward');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Backpropagation Visualizer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Step through the forward pass, loss computation, backward pass, and weight update to see how a single neuron learns.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Computation Graph */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Computation Graph</h3>
          <svg viewBox="0 0 400 280" className="w-full">
            <rect width={400} height={280} fill="rgb(243 244 246)" rx="8" />

            {/* Nodes */}
            {[
              { x: 40, y: 60, label: `x=${x}`, active: stepIndex >= 0 },
              { x: 40, y: 140, label: `w=${w.toFixed(2)}`, active: stepIndex >= 0 },
              { x: 40, y: 220, label: `b=${b.toFixed(2)}`, active: stepIndex >= 0 },
              { x: 140, y: 140, label: `z=${z.toFixed(3)}`, active: stepIndex >= 0 },
              { x: 240, y: 140, label: `a=${a.toFixed(3)}`, active: stepIndex >= 1 },
              { x: 340, y: 140, label: `L=${loss.toFixed(4)}`, active: stepIndex >= 1 },
              { x: 140, y: 220, label: `dw=${dw.toFixed(4)}`, active: stepIndex >= 2 },
              { x: 240, y: 220, label: `db=${db.toFixed(4)}`, active: stepIndex >= 2 },
            ].map((node, i) => (
              <g key={i}>
                <rect x={node.x - 30} y={node.y - 15} width={60} height={30} rx={6}
                  fill={node.active ? '#6366F1' : '#D1D5DB'} stroke="#4F46E5" strokeWidth={1.5} />
                <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                  {node.label}
                </text>
              </g>
            ))}

            {/* Edges */}
            <line x1={70} y1={60} x2={110} y2={140} stroke="#9CA3AF" strokeWidth={1.5} />
            <line x1={70} y1={140} x2={110} y2={140} stroke="#9CA3AF" strokeWidth={1.5} />
            <line x1={70} y1={220} x2={110} y2={140} stroke="#9CA3AF" strokeWidth={1.5} />
            <line x1={170} y1={140} x2={210} y2={140} stroke={stepIndex >= 1 ? '#6366F1' : '#D1D5DB'} strokeWidth={2} />
            <line x1={270} y1={140} x2={310} y2={140} stroke={stepIndex >= 1 ? '#6366F1' : '#D1D5DB'} strokeWidth={2} />

            {stepIndex >= 2 && (
              <>
                <line x1={240} y1={155} x2={140} y2={205} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,4" />
                <line x1={240} y1={155} x2={240} y2={205} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,4" />
                <text x={290} y={40} fontSize={11} fill="#EF4444" fontWeight="bold">Backward (chain rule)</text>
              </>
            )}

            {/* Forward label */}
            {stepIndex === 0 && (
              <text x={200} y={30} textAnchor="middle" fontSize={11} fill="#6366F1" fontWeight="bold">Forward →</text>
            )}
          </svg>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Training Steps</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${i <= stepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {s.label}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {STEPS[stepIndex].description}
            </p>
            <div className="flex gap-2">
              <button onClick={runStep} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                {stepIndex === 3 ? 'Next Epoch' : 'Next Step'}
              </button>
              <button onClick={reset} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                Reset
              </button>
            </div>
          </div>

          {/* Values */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Values</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">z = wx + b</span>
                <strong className="text-gray-900 dark:text-gray-100">{z.toFixed(4)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">a = σ(z)</span>
                <strong className="text-gray-900 dark:text-gray-100">{a.toFixed(4)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Loss</span>
                <strong className="text-red-600 dark:text-red-400">{loss.toFixed(6)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">σ'(z)</span>
                <strong className="text-gray-900 dark:text-gray-100">{sigmoidDeriv(z).toFixed(4)}</strong>
              </div>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Training History</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="text-xs flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Epoch {i + 1}: w={h.w.toFixed(4)}, b={h.b.toFixed(4)}</span>
                    <span className="text-red-500">{h.loss.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Chain Rule</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Backpropagation applies the chain rule: dL/dw = dL/da · da/dz · dz/dw. Each operation stores its local gradient, and we multiply them together going backwards through the network.
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-dark-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Forward</span>
            <span>→ The model makes a prediction. Like a student answering a question.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Loss</span>
            <span>→ Measures how wrong the answer was. Like grading the test.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Backward</span>
            <span>→ Figures out who made the mistake and how much. Like tracing an error back to its source.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Update</span>
            <span>→ Adjusts the weights to do better next time. Like studying from mistakes.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
