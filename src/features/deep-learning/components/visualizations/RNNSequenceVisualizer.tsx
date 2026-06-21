'use client';

import React, { useState } from 'react';

type CellType = 'rnn' | 'lstm' | 'gru';

const CELL_CONFIGS: Record<CellType, { name: string; gates: string[]; description: string }> = {
  rnn: {
    name: 'Vanilla RNN',
    gates: ['hidden'],
    description: 'Simple recurrent cell: h_t = tanh(W·[h_{t-1}, x_t] + b). Prone to vanishing gradients.'
  },
  lstm: {
    name: 'LSTM',
    gates: ['forget', 'input', 'cell', 'output'],
    description: 'Long Short-Term Memory: uses gates to control information flow. Handles long-range dependencies.'
  },
  gru: {
    name: 'GRU',
    gates: ['reset', 'update', 'candidate'],
    description: 'Gated Recurrent Unit: simplified LSTM with fewer parameters. Often similar performance.'
  },
};

export default function RNNSequenceVisualizer() {
  const [cellType, setCellType] = useState<CellType>('lstm');
  const [sequence] = useState(['I', 'love', 'deep', 'learning', '!']);
  const [activeStep, setActiveStep] = useState(0);

  const svgW = 600;
  const svgH = 350;

  const stepW = svgW / (sequence.length + 1);
  const cellY = svgH / 2;

  const renderCell = (x: number, y: number, step: number) => {
    const isActive = step <= activeStep;
    const cellW = 60;
    const cellH = 40;
    const color = isActive ? '#6366F1' : '#D1D5DB';
    const textColor = isActive ? 'white' : '#9CA3AF';

    if (cellType === 'rnn') {
      return (
        <g key={step}>
          <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW} height={cellH} rx={6} fill={color} stroke="#4F46E5" strokeWidth={1.5} />
          <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fill={textColor} fontWeight="bold">h{step}</text>
        </g>
      );
    }

    if (cellType === 'lstm') {
      const gateW = cellW / 3;
      return (
        <g key={step}>
          <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW} height={cellH} rx={6} fill={color} stroke="#4F46E5" strokeWidth={1.5} />
          {['f', 'i', 'o'].map((g, gi) => (
            <g key={g}>
              <rect x={x - cellW / 2 + gi * gateW} y={y - cellH / 2} width={gateW} height={cellH / 2} rx={3} fill={isActive ? '#818CF8' : '#E5E7EB'} />
              <text x={x - cellW / 2 + gi * gateW + gateW / 2} y={y - 2} textAnchor="middle" fontSize={8} fill={textColor}>{g === 'f' ? 'Forget' : g === 'i' ? 'Input' : 'Output'}</text>
            </g>
          ))}
          <rect x={x - cellW / 2 + 2} y={y} width={cellW - 4} height={cellH / 2 - 2} rx={3} fill={isActive ? '#A5B4FC' : '#F3F4F6'} />
          <text x={x} y={y + cellH / 4 + 2} textAnchor="middle" fontSize={8} fill={isActive ? '#3730A3' : '#9CA3AF'}>Cell State</text>
        </g>
      );
    }

    // GRU
    return (
      <g key={step}>
        <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW} height={cellH} rx={6} fill={color} stroke="#4F46E5" strokeWidth={1.5} />
        <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW / 2} height={cellH / 2} rx={3} fill={isActive ? '#818CF8' : '#E5E7EB'} />
        <text x={x - cellW / 4} y={y - 2} textAnchor="middle" fontSize={8} fill={textColor}>Reset</text>
        <rect x={x} y={y - cellH / 2} width={cellW / 2} height={cellH / 2} rx={3} fill={isActive ? '#818CF8' : '#E5E7EB'} />
        <text x={x + cellW / 4} y={y - 2} textAnchor="middle" fontSize={8} fill={textColor}>Update</text>
        <text x={x} y={y + cellH / 4 + 2} textAnchor="middle" fontSize={8} fill={isActive ? '#3730A3' : '#9CA3AF'}>GRU</text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">RNN Sequence Visualizer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Watch how RNN cells process a sequence token by token, maintaining a hidden state that carries information forward.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
          <rect width={svgW} height={svgH} fill="rgb(243 244 246)" rx="8" />

          {/* Input tokens */}
          {sequence.map((token, i) => (
            <g key={`input-${i}`}>
              <rect x={stepW * (i + 1) - 25} y={cellY - 80} width={50} height={28} rx={4}
                fill={i <= activeStep ? '#22C55E' : '#E5E7EB'} stroke={i <= activeStep ? '#16A34A' : '#D1D5DB'} />
              <text x={stepW * (i + 1)} y={cellY - 62} textAnchor="middle" fontSize={11} fill={i <= activeStep ? 'white' : '#9CA3AF'} fontWeight="bold">
                {token}
              </text>
            </g>
          ))}

          {/* Cells */}
          {sequence.map((_, i) => (
            <g key={`cell-${i}`}>
              {renderCell(stepW * (i + 1), cellY, i)}
              {i > 0 && i <= activeStep && (
                <line x1={stepW * i + 30} y1={cellY} x2={stepW * (i + 1) - 30} y2={cellY}
                  stroke="#6366F1" strokeWidth={2} markerEnd="url(#arrow)" />
              )}
            </g>
          ))}

          {/* Hidden state flow */}
          {sequence.map((_, i) => {
            if (i === 0 || i > activeStep) return null;
            return (
              <text key={`hflow-${i}`} x={stepW * (i + 1)} y={cellY + 40} textAnchor="middle" fontSize={9} fill="#6366F1">
                h{i}
              </text>
            );
          })}

          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#6366F1" />
            </marker>
          </defs>
        </svg>

        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-50" disabled={activeStep === 0}>
            ← Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">Step {activeStep + 1} of {sequence.length}</span>
          <button onClick={() => setActiveStep(Math.min(sequence.length - 1, activeStep + 1))}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-50" disabled={activeStep === sequence.length - 1}>
            Next →
          </button>
          <button onClick={() => setActiveStep(sequence.length - 1)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
            Run All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cell Type</h3>
          <div className="flex flex-wrap gap-2">
            {(['rnn', 'lstm', 'gru'] as CellType[]).map(type => (
              <button key={type} onClick={() => { setCellType(type); setActiveStep(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer uppercase ${cellType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">{CELL_CONFIGS[cellType].description}</p>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <p>Gates: {CELL_CONFIGS[cellType].gates.join(', ')}</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How RNNs Process Sequences</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            At each step, the cell takes the current input and previous hidden state, computes a new hidden state, and passes it forward. The hidden state acts as a "memory" of what the network has seen so far. LSTMs add a separate cell state and gates to control what to remember and what to forget.
          </p>
        </div>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">RNN</span>
            <span>→ Like reading a book one word at a time, remembering what you've read so far. But you forget the beginning by the time you reach the end.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">LSTM Gates</span>
            <span>→ Like a smart note-taking system. Forget gate: "Is this old info still relevant?" Input gate: "Should I write this down?" Output gate: "What do I need right now?"</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Hidden State</span>
            <span>→ The network's working memory. It carries information from the past and influences future decisions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
