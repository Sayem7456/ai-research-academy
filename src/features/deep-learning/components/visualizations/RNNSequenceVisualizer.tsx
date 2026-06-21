'use client';

import React, { useState, useMemo, useCallback } from 'react';

type CellType = 'rnn' | 'lstm' | 'gru';

interface GateActivations {
  forget?: number;
  input?: number;
  output?: number;
  reset?: number;
  update?: number;
  candidate?: number;
}

interface StepState {
  hiddenState: number[];
  cellState?: number[];
  gates: GateActivations;
  memoryRetention: number;
  hiddenMag: number;
  gradientMag: number;
  inputVector?: number[];
  prevHidden?: number[];
  weightedSum?: number[];
  rawGateValues?: GateActivations;
}

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

const PRESETS = [
  { id: 'basic', label: 'Simple: I love cats', tokens: ['I', 'love', 'cats'], desc: 'Basic positive sentiment' },
  { id: 'negation', label: 'Negation: I do not love cats', tokens: ['I', 'do', 'not', 'love', 'cats'], desc: 'Negation flips meaning — RNN often misses this' },
  { id: 'long', label: 'Long context: The cat sat on the mat and it was very fluffy', tokens: ['The', 'cat', 'sat', 'on', 'the', 'mat', 'and', 'it', 'was', 'very', 'fluffy'], desc: 'Long-range dependency — must remember "cat" at the end' },
  { id: 'flip', label: 'Sentiment flip: Great start but terrible ending', tokens: ['Great', 'start', 'but', 'terrible', 'ending'], desc: 'Sentiment reverses mid-sentence' },
  { id: 'repeat', label: 'Repeat: The the the the the', tokens: ['The', 'the', 'the', 'the', 'the'], desc: 'Repetition — tests if model tracks position' },
] as const;

// ─── Seeded RNG ────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ─── Sigmoid / Tanh ────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function tanhFn(x: number): number {
  return Math.tanh(x);
}

// ─── Simulation Engine ─────────────────────────────────────────────────────

function simulateSequence(
  sequence: string[],
  cellType: CellType,
  seed: number = 42,
): StepState[] {
  const rng = seededRandom(seed);
  const hiddenSize = 4;
  const results: StepState[] = [];

  const randWeight = () => (rng() - 0.5) * 2;

  const Wx = Array.from({ length: hiddenSize }, () => Array.from({ length: hiddenSize }, randWeight));
  const Wh = Array.from({ length: hiddenSize }, () => Array.from({ length: hiddenSize }, randWeight));
  const wx = Array.from({ length: hiddenSize }, randWeight);

  let h = new Array(hiddenSize).fill(0).map(() => (rng() - 0.5) * 0.1);
  let c = new Array(hiddenSize).fill(0).map(() => (rng() - 0.5) * 0.1);

  // Gradient magnitudes (simulated decay)
  let gradRnn = 1.0;
  const gradDecayRnn = 0.65;
  const gradDecayLstm = 0.95;
  const gradDecayGru = 0.8;

  for (let t = 0; t < sequence.length; t++) {
    const tokenVal = sequence[t].charCodeAt(0) % 10 / 10;
    const x = wx.map((w, i) => w * tokenVal + Math.sin(t + i) * 0.5);

    if (cellType === 'rnn') {
      const hNew = new Array(hiddenSize).fill(0);
      const weightedSums = new Array(hiddenSize).fill(0);
      for (let i = 0; i < hiddenSize; i++) {
        let sum = 0;
        for (let j = 0; j < hiddenSize; j++) {
          sum += Wx[i][j] * x[j] + Wh[i][j] * h[j];
        }
        weightedSums[i] = sum;
        hNew[i] = tanhFn(sum);
      }
      const prevH = [...h];
      h = hNew;
      const hiddenMag = h.reduce((s, v) => s + Math.abs(v), 0) / hiddenSize;

      // Gradient decays exponentially in vanilla RNN
      if (t > 0) gradRnn *= gradDecayRnn;

      results.push({
        hiddenState: [...h],
        gates: {},
        memoryRetention: hiddenMag,
        hiddenMag,
        gradientMag: gradRnn,
        inputVector: [...x],
        prevHidden: prevH,
        weightedSum: weightedSums,
      });
    } else if (cellType === 'lstm') {
      const fGate = new Array(hiddenSize).fill(0);
      const iGate = new Array(hiddenSize).fill(0);
      const oGate = new Array(hiddenSize).fill(0);
      const cTilde = new Array(hiddenSize).fill(0);
      const cNew = new Array(hiddenSize).fill(0);
      const hNew = new Array(hiddenSize).fill(0);
      const rawF = new Array(hiddenSize).fill(0);
      const rawI = new Array(hiddenSize).fill(0);
      const rawO = new Array(hiddenSize).fill(0);
      const rawC = new Array(hiddenSize).fill(0);

      for (let i = 0; i < hiddenSize; i++) {
        let sumF = 0, sumI = 0, sumO = 0, sumC = 0;
        for (let j = 0; j < hiddenSize; j++) {
          sumF += Wx[i][j] * x[j] + Wh[i][j] * h[j];
          sumI += Wx[(i + 1) % hiddenSize][j] * x[j] + Wh[(i + 1) % hiddenSize][j] * h[j];
          sumO += Wx[(i + 2) % hiddenSize][j] * x[j] + Wh[(i + 2) % hiddenSize][j] * h[j];
          sumC += Wx[(i + 3) % hiddenSize][j] * x[j] + Wh[(i + 3) % hiddenSize][j] * h[j];
        }
        rawF[i] = sumF;
        rawI[i] = sumI;
        rawO[i] = sumO;
        rawC[i] = sumC;
        fGate[i] = sigmoid(sumF);
        iGate[i] = sigmoid(sumI);
        oGate[i] = sigmoid(sumO);
        cTilde[i] = tanhFn(sumC);
        cNew[i] = fGate[i] * c[i] + iGate[i] * cTilde[i];
        hNew[i] = oGate[i] * tanhFn(cNew[i]);
      }

      const prevH = [...h];
      const prevC = [...c];
      c = cNew;
      h = hNew;

      const avgForget = fGate.reduce((s, v) => s + v, 0) / hiddenSize;
      const avgInput = iGate.reduce((s, v) => s + v, 0) / hiddenSize;
      const avgOutput = oGate.reduce((s, v) => s + v, 0) / hiddenSize;
      const hiddenMag = h.reduce((s, v) => s + Math.abs(v), 0) / hiddenSize;

      // LSTM: gradient preserved through cell state (forget gate controls flow)
      if (t > 0) gradRnn *= avgForget * gradDecayLstm + (1 - avgForget) * 0.1;

      results.push({
        hiddenState: [...h],
        cellState: [...c],
        gates: { forget: avgForget, input: avgInput, output: avgOutput },
        memoryRetention: avgForget,
        hiddenMag,
        gradientMag: gradRnn,
        inputVector: [...x],
        prevHidden: prevH,
        weightedSum: [...prevC],
        rawGateValues: { forget: rawF.reduce((s, v) => s + v, 0) / hiddenSize, input: rawI.reduce((s, v) => s + v, 0) / hiddenSize, output: rawO.reduce((s, v) => s + v, 0) / hiddenSize, candidate: rawC.reduce((s, v) => s + v, 0) / hiddenSize },
      });
    } else {
      const rGate = new Array(hiddenSize).fill(0);
      const zGate = new Array(hiddenSize).fill(0);
      const hTilde = new Array(hiddenSize).fill(0);
      const hNew = new Array(hiddenSize).fill(0);
      const rawR = new Array(hiddenSize).fill(0);
      const rawZ = new Array(hiddenSize).fill(0);

      for (let i = 0; i < hiddenSize; i++) {
        let sumR = 0, sumZ = 0;
        for (let j = 0; j < hiddenSize; j++) {
          sumR += Wx[i][j] * x[j] + Wh[i][j] * h[j];
          sumZ += Wx[(i + 1) % hiddenSize][j] * x[j] + Wh[(i + 1) % hiddenSize][j] * h[j];
        }
        rawR[i] = sumR;
        rawZ[i] = sumZ;
        rGate[i] = sigmoid(sumR);
        zGate[i] = sigmoid(sumZ);
        let sumHt = 0;
        for (let j = 0; j < hiddenSize; j++) {
          sumHt += Wx[(i + 3) % hiddenSize][j] * x[j] + rGate[i] * Wh[(i + 3) % hiddenSize][j] * h[j];
        }
        hTilde[i] = tanhFn(sumHt);
        hNew[i] = (1 - zGate[i]) * h[i] + zGate[i] * hTilde[i];
      }

      const prevH = [...h];
      h = hNew;

      const avgReset = rGate.reduce((s, v) => s + v, 0) / hiddenSize;
      const avgUpdate = zGate.reduce((s, v) => s + v, 0) / hiddenSize;
      const hiddenMag = h.reduce((s, v) => s + Math.abs(v), 0) / hiddenSize;

      // GRU: gradient preserved through update gate
      if (t > 0) gradRnn *= (1 - avgUpdate) * gradDecayGru + avgUpdate * 0.1;

      results.push({
        hiddenState: [...h],
        gates: { reset: avgReset, update: avgUpdate },
        memoryRetention: 1 - avgUpdate,
        hiddenMag,
        gradientMag: gradRnn,
        inputVector: [...x],
        prevHidden: prevH,
        rawGateValues: { reset: rawR.reduce((s, v) => s + v, 0) / hiddenSize, update: rawZ.reduce((s, v) => s + v, 0) / hiddenSize },
      });
    }
  }

  return results;
}

// ─── Single Visualization Panel ────────────────────────────────────────────

function VisualizationPanel({
  sequence,
  cellType,
  activeStep,
  compact = false,
}: {
  sequence: string[];
  cellType: CellType;
  activeStep: number;
  compact?: boolean;
}) {
  const svgW = compact ? 500 : 700;
  const stepW = svgW / (sequence.length + 1);
  const cellW = compact ? 56 : 70;
  const cellH = compact ? 40 : 50;
  // Fixed layout: cells in top half, gradient flow in bottom strip
  const svgH = compact ? 320 : 420;
  const cellY = svgH * 0.38;
  const gradY = svgH - 40;

  const simulation = useMemo(
    () => simulateSequence(sequence, cellType),
    [sequence, cellType],
  );

  const currentStep = simulation[activeStep];

  const renderCell = useCallback((x: number, y: number, step: number) => {
    const isActive = step <= activeStep;
    const isCurrent = step === activeStep;
    const color = isActive ? (isCurrent ? '#6366F1' : '#818CF8') : '#D1D5DB';
    const textColor = isActive ? 'white' : '#9CA3AF';
    const state = simulation[step];
    const fontSize = compact ? 6 : 7;
    const labelFontSize = compact ? 8 : 9;

    if (cellType === 'rnn') {
      return (
        <g key={step}>
          <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW} height={cellH} rx={6} fill={color} stroke={isCurrent ? '#4F46E5' : '#6366F1'} strokeWidth={isCurrent ? 2 : 1.5} />
          <text x={x} y={y - 2} textAnchor="middle" fontSize={labelFontSize} fill={textColor} fontWeight="bold">h{step}</text>
          {isActive && (
            <g>
              <rect x={x - 14} y={y + 4} width={28} height={5} rx={2.5} fill="rgba(255,255,255,0.3)" />
              <rect x={x - 14} y={y + 4} width={28 * state.hiddenMag} height={5} rx={2.5} fill="white" />
            </g>
          )}
          {isActive && (
            <text x={x} y={y + 18} textAnchor="middle" fontSize={fontSize} fill="#818CF8" fontWeight="bold">
              |h|={state.hiddenMag.toFixed(2)}
            </text>
          )}
        </g>
      );
    }

    if (cellType === 'lstm') {
      const gateW = cellW / 3;
      const fVal = state.gates.forget ?? 0;
      const iVal = state.gates.input ?? 0;
      const oVal = state.gates.output ?? 0;

      return (
        <g key={step}>
          <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW} height={cellH} rx={6} fill={color} stroke={isCurrent ? '#4F46E5' : '#6366F1'} strokeWidth={isCurrent ? 2 : 1.5} />
          {[
            { label: 'F', val: fVal, gi: 0 },
            { label: 'I', val: iVal, gi: 1 },
            { label: 'O', val: oVal, gi: 2 },
          ].map(({ label, val, gi }) => (
            <g key={`gate-${gi}`}>
              <rect x={x - cellW / 2 + gi * gateW} y={y - cellH / 2} width={gateW} height={cellH * 0.45} rx={2} fill={isActive ? '#4F46E5' : '#E5E7EB'} />
              {isActive && (
                <rect x={x - cellW / 2 + gi * gateW + 1} y={y - cellH / 2 + 1 + (cellH * 0.45 - 3) * (1 - val)} width={gateW - 2} height={(cellH * 0.45 - 3) * val} rx={1.5} fill={gi === 0 ? '#22C55E' : gi === 1 ? '#F59E0B' : '#3B82F6'} opacity={0.8} />
              )}
              <text x={x - cellW / 2 + gi * gateW + gateW / 2} y={y - cellH / 2 + cellH * 0.22 + 2} textAnchor="middle" fontSize={fontSize - 1} fill={textColor} fontWeight="bold">
                {label}
              </text>
              {isActive && (
                <text x={x - cellW / 2 + gi * gateW + gateW / 2} y={y - cellH / 2 + cellH * 0.45 - 1} textAnchor="middle" fontSize={fontSize - 1} fill="white" opacity={0.9}>
                  {val.toFixed(2)}
                </text>
              )}
            </g>
          ))}
          <rect x={x - cellW / 2 + 1} y={y + 1} width={cellW - 2} height={cellH * 0.35} rx={2} fill={isActive ? '#A5B4FC' : '#F3F4F6'} />
          {isActive && state.cellState && (
            <text x={x} y={y + cellH * 0.35 + 2} textAnchor="middle" fontSize={fontSize - 1} fill="#3730A3" fontWeight="bold">
              c={state.cellState[0]?.toFixed(2) ?? '0.00'}
            </text>
          )}
          {isActive && (
            <text x={x} y={y + cellH / 2 + 12} textAnchor="middle" fontSize={fontSize - 1} fill="#6366F1" fontWeight="bold">
              mem={state.memoryRetention.toFixed(2)}
            </text>
          )}
        </g>
      );
    }

    // GRU
    const rVal = state.gates.reset ?? 0;
    const zVal = state.gates.update ?? 0;

    return (
      <g key={step}>
        <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW} height={cellH} rx={6} fill={color} stroke={isCurrent ? '#4F46E5' : '#6366F1'} strokeWidth={isCurrent ? 2 : 1.5} />
        <rect x={x - cellW / 2} y={y - cellH / 2} width={cellW / 2} height={cellH * 0.45} rx={2} fill={isActive ? '#4F46E5' : '#E5E7EB'} />
        {isActive && (
          <rect x={x - cellW / 2 + 1} y={y - cellH / 2 + 1 + (cellH * 0.45 - 3) * (1 - rVal)} width={cellW / 2 - 2} height={(cellH * 0.45 - 3) * rVal} rx={1.5} fill="#EC4899" opacity={0.8} />
        )}
        <text x={x - cellW / 4} y={y - cellH / 2 + cellH * 0.22 + 2} textAnchor="middle" fontSize={fontSize - 1} fill={textColor} fontWeight="bold">R</text>
        {isActive && (
          <text x={x - cellW / 4} y={y - cellH / 2 + cellH * 0.45 - 1} textAnchor="middle" fontSize={fontSize - 1} fill="white" opacity={0.9}>{rVal.toFixed(2)}</text>
        )}
        <rect x={x} y={y - cellH / 2} width={cellW / 2} height={cellH * 0.45} rx={2} fill={isActive ? '#4F46E5' : '#E5E7EB'} />
        {isActive && (
          <rect x={x + 1} y={y - cellH / 2 + 1 + (cellH * 0.45 - 3) * (1 - zVal)} width={cellW / 2 - 2} height={(cellH * 0.45 - 3) * zVal} rx={1.5} fill="#8B5CF6" opacity={0.8} />
        )}
        <text x={x + cellW / 4} y={y - cellH / 2 + cellH * 0.22 + 2} textAnchor="middle" fontSize={fontSize - 1} fill={textColor} fontWeight="bold">Z</text>
        {isActive && (
          <text x={x + cellW / 4} y={y - cellH / 2 + cellH * 0.45 - 1} textAnchor="middle" fontSize={fontSize - 1} fill="white" opacity={0.9}>{zVal.toFixed(2)}</text>
        )}
        <text x={x} y={y + 4} textAnchor="middle" fontSize={fontSize} fill={isActive ? '#3730A3' : '#9CA3AF'} fontWeight="bold">GRU</text>
        {isActive && (
          <text x={x} y={y + cellH / 2 + 12} textAnchor="middle" fontSize={fontSize - 1} fill="#6366F1" fontWeight="bold">
            |h|={state.hiddenMag.toFixed(2)}
          </text>
        )}
      </g>
    );
  }, [activeStep, cellType, simulation, cellW, cellH, compact]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">{cellType}</h3>
          {currentStep && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Step {activeStep + 1}/{sequence.length}: &quot;{sequence[activeStep]}&quot;
            </span>
          )}
        </div>
      )}
      {compact && (
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{cellType}</h4>
          {currentStep && (
            <span className="text-[9px] text-gray-500 dark:text-gray-400">
              {sequence[activeStep]}
            </span>
          )}
        </div>
      )}

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        <rect width={svgW} height={svgH} fill="rgb(243 244 246)" rx="8" />

        <defs>
          <marker id={`arrow-${cellType}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#6366F1" />
          </marker>
          <marker id={`arrow-o-${cellType}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#F97316" />
          </marker>
          <marker id={`arrow-g-${cellType}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#22C55E" />
          </marker>
        </defs>

        {/* Input tokens */}
        {sequence.map((token, i) => {
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;
          return (
            <g key={`input-${i}`}>
              <rect x={stepW * (i + 1) - 24} y={cellY - 80} width={48} height={26} rx={5}
                fill={isActive ? '#22C55E' : '#E5E7EB'} stroke={isCurrent ? '#16A34A' : isActive ? '#16A34A' : '#D1D5DB'} strokeWidth={isCurrent ? 2 : 1} />
              <text x={stepW * (i + 1)} y={cellY - 63} textAnchor="middle" fontSize={compact ? 10 : 12} fill={isActive ? 'white' : '#9CA3AF'} fontWeight="bold">
                {token}
              </text>
              {isActive && (
                <line x1={stepW * (i + 1)} y1={cellY - 54} x2={stepW * (i + 1)} y2={cellY - cellY * 0.18}
                  stroke="#F97316" strokeWidth={1.5} strokeDasharray="4,2" markerEnd={`url(#arrow-o-${cellType})`} opacity={0.7} />
              )}
            </g>
          );
        })}

        {/* Hidden state flow arrows */}
        {sequence.map((_, i) => {
          if (i === 0 || i > activeStep) return null;
          return (
            <g key={`flow-${i}`}>
              <line x1={stepW * i + cellW / 2 + 2} y1={cellY} x2={stepW * (i + 1) - cellW / 2 - 2} y2={cellY}
                stroke="#6366F1" strokeWidth={2} markerEnd={`url(#arrow-${cellType})`}
                strokeDasharray="6,3" opacity={0.8}>
                <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
              </line>
              <text x={stepW * i + (stepW / 2)} y={cellY - 6} textAnchor="middle" fontSize={compact ? 7 : 8} fill="#6366F1" fontWeight="bold" opacity={0.8}>
                h{i - 1}
              </text>
            </g>
          );
        })}

        {/* Cells */}
        {sequence.map((_, i) => (
          <g key={`cell-${i}`}>
            {renderCell(stepW * (i + 1), cellY, i)}
          </g>
        ))}

        {/* Cell state flow for LSTM */}
        {cellType === 'lstm' && sequence.map((_, i) => {
          if (i === 0 || i > activeStep) return null;
          return (
            <line key={`cflow-${i}`} x1={stepW * i + cellW / 2 + 2} y1={cellY + 28} x2={stepW * (i + 1) - cellW / 2 - 2} y2={cellY + 28}
              stroke="#22C55E" strokeWidth={1.5} strokeDasharray="4,2" markerEnd={`url(#arrow-g-${cellType})`} opacity={0.6}>
              <animate attributeName="stroke-dashoffset" from="12" to="0" dur="1.5s" repeatCount="indefinite" />
            </line>
          );
        })}
        {cellType === 'lstm' && activeStep > 0 && (
          <text x={svgW / 2} y={cellY + 42} textAnchor="middle" fontSize={compact ? 7 : 8} fill="#22C55E" fontWeight="bold" opacity={0.7}>
            Cell State — information highway
          </text>
        )}

        {/* Separator line */}
        {activeStep > 0 && (
          <line x1={20} y1={gradY - 32} x2={svgW - 20} y2={gradY - 32} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4,3" />
        )}

        {/* Gradient flow arrows (backward) */}
        {activeStep > 0 && (
          <g>
            <text x={svgW / 2} y={gradY - 20} textAnchor="middle" fontSize={compact ? 7 : 8} fill="#EF4444" fontWeight="bold" opacity={0.8}>
              Gradient Flow (backward)
            </text>
            {sequence.map((_, i) => {
              if (i === 0 || i > activeStep) return null;
              const state = simulation[i];
              const gradNorm = Math.min(1, state.gradientMag);
              const barH = compact ? 12 : 16;
              const barW = Math.max(4, (stepW - cellW - 10) * gradNorm);
              return (
                <g key={`grad-${i}`}>
                  <rect x={stepW * (i + 1) - barW / 2} y={gradY - barH / 2} width={barW} height={barH} rx={3}
                    fill={gradNorm > 0.7 ? '#22C55E' : gradNorm > 0.3 ? '#F59E0B' : '#EF4444'} opacity={0.7} />
                  <text x={stepW * (i + 1)} y={gradY + barH / 2 + (compact ? 10 : 14)} textAnchor="middle"
                    fontSize={compact ? 6 : 7} fill="#EF4444" fontWeight="bold">
                    {state.gradientMag.toFixed(2)}
                  </text>
                  {/* Arrow pointing backward */}
                  {i > 0 && (
                    <line x1={stepW * (i + 1) + barW / 2 + 2} y1={gradY} x2={stepW * i + 35} y2={gradY}
                      stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.5} />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Weight sharing indicator */}
        {!compact && activeStep > 0 && (
          <g>
            <rect x={10} y={10} width={compact ? 100 : 130} height={compact ? 24 : 30} rx={4} fill="white" stroke="#D1D5DB" strokeWidth={1} opacity={0.9} />
            <text x={15} y={compact ? 26 : 28} fontSize={compact ? 7 : 8} fill="#6B7280" fontWeight="bold">
              Weights: W_xh, W_hh
            </text>
            <text x={15} y={compact ? 34 : 40} fontSize={compact ? 6 : 7} fill="#9CA3AF">
              (shared across all steps)
            </text>
          </g>
        )}

        {/* Output arrow */}
        {activeStep === sequence.length - 1 && (
          <g>
            <line x1={stepW * sequence.length + cellW / 2 + 2} y1={cellY} x2={stepW * sequence.length + cellW / 2 + 30} y2={cellY}
              stroke="#EF4444" strokeWidth={2} markerEnd={`url(#arrow-${cellType})`} />
            <rect x={stepW * sequence.length + cellW / 2 + 30} y={cellY - 12} width={24} height={24} rx={5} fill="#EF4444" />
            <text x={stepW * sequence.length + cellW / 2 + 42} y={cellY + 4} textAnchor="middle" fontSize={compact ? 8 : 9} fill="white" fontWeight="bold">y</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Cell Detail Panel ────────────────────────────────────────────────────

function CellDetailPanel({
  step,
  cellType,
  sequence,
  simulation,
}: {
  step: number;
  cellType: CellType;
  sequence: string[];
  simulation: StepState[];
}) {
  const state = simulation[step];
  if (!state) return null;

  const fmt = (arr?: number[]) => arr?.map(v => v.toFixed(3)).join(', ') ?? '—';
  const fmtScalar = (v?: number) => v?.toFixed(4) ?? '—';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Step {step + 1}: &quot;{sequence[step]}&quot; — Detailed Computation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Input Vector */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block mb-1 font-medium">Input Vector x_t</span>
          <span className="text-[9px] text-indigo-700 dark:text-indigo-300 font-mono">[{fmt(state.inputVector)}]</span>
          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 block mt-1">
            token &quot;{sequence[step]}&quot; → charCode mod 10 / 10 = {(sequence[step].charCodeAt(0) % 10 / 10).toFixed(1)}
          </span>
        </div>

        {/* Previous Hidden State */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <span className="text-[10px] text-green-500 dark:text-green-400 block mb-1 font-medium">Previous h_{step}</span>
          <span className="text-[9px] text-green-700 dark:text-green-300 font-mono">[{fmt(state.prevHidden)}]</span>
          <span className="text-[9px] text-green-500 dark:text-green-400 block mt-1">
            |h| = {state.hiddenMag.toFixed(4)}
          </span>
        </div>

        {/* Gate Computations */}
        {cellType === 'lstm' && (
          <div className="md:col-span-2 space-y-2">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block">LSTM Gate Computations</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-green-100 dark:bg-green-800/30 rounded p-2">
                <span className="text-[9px] text-green-600 block">Forget Gate: σ(W_f·[h,x]+b_f)</span>
                <span className="text-[9px] text-green-700 dark:text-green-300 font-mono">{fmtScalar(state.rawGateValues?.forget)}</span>
                <span className="text-[8px] text-green-500">→ f = {fmtScalar(state.gates.forget)}</span>
              </div>
              <div className="bg-amber-100 dark:bg-amber-800/30 rounded p-2">
                <span className="text-[9px] text-amber-600 block">Input Gate: σ(W_i·[h,x]+b_i)</span>
                <span className="text-[9px] text-amber-700 dark:text-amber-300 font-mono">{fmtScalar(state.rawGateValues?.input)}</span>
                <span className="text-[8px] text-amber-500">→ i = {fmtScalar(state.gates.input)}</span>
              </div>
              <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-2">
                <span className="text-[9px] text-blue-600 block">Output Gate: σ(W_o·[h,x]+b_o)</span>
                <span className="text-[9px] text-blue-700 dark:text-blue-300 font-mono">{fmtScalar(state.rawGateValues?.output)}</span>
                <span className="text-[8px] text-blue-500">→ o = {fmtScalar(state.gates.output)}</span>
              </div>
              <div className="bg-purple-100 dark:bg-purple-800/30 rounded p-2">
                <span className="text-[9px] text-purple-600 block">Candidate: tanh(W_c·[h,x]+b_c)</span>
                <span className="text-[9px] text-purple-700 dark:text-purple-300 font-mono">{fmtScalar(state.rawGateValues?.candidate)}</span>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700/50 rounded p-2 text-[9px] text-gray-600 dark:text-gray-400">
              <span className="font-medium">c_t = f ⊙ c_{'{t-1}'} + i ⊙ c̃ = </span>
              <span className="font-mono">{fmtScalar(state.gates.forget)} ⊙ c_{'{t-1}'} + {fmtScalar(state.gates.input)} ⊙ {fmtScalar(state.rawGateValues?.candidate)}</span>
              <span className="block mt-1">Cell state: [{fmt(state.cellState)}]</span>
            </div>
          </div>
        )}

        {cellType === 'gru' && (
          <div className="md:col-span-2 space-y-2">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block">GRU Gate Computations</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-pink-100 dark:bg-pink-800/30 rounded p-2">
                <span className="text-[9px] text-pink-600 block">Reset Gate: σ(W_r·[h,x]+b_r)</span>
                <span className="text-[9px] text-pink-700 dark:text-pink-300 font-mono">{fmtScalar(state.rawGateValues?.reset)}</span>
                <span className="text-[8px] text-pink-500">→ r = {fmtScalar(state.gates.reset)}</span>
              </div>
              <div className="bg-violet-100 dark:bg-violet-800/30 rounded p-2">
                <span className="text-[9px] text-violet-600 block">Update Gate: σ(W_z·[h,x]+b_z)</span>
                <span className="text-[9px] text-violet-700 dark:text-violet-300 font-mono">{fmtScalar(state.rawGateValues?.update)}</span>
                <span className="text-[8px] text-violet-500">→ z = {fmtScalar(state.gates.update)}</span>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700/50 rounded p-2 text-[9px] text-gray-600 dark:text-gray-400">
              <span className="font-medium">h_t = (1-z) ⊙ h_{'{t-1}'} + z ⊙ tanh(W·[r⊙h, x])</span>
            </div>
          </div>
        )}

        {cellType === 'rnn' && (
          <div className="md:col-span-2 space-y-2">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block">RNN Computation</span>
            <div className="bg-gray-100 dark:bg-gray-700/50 rounded p-2 text-[9px] text-gray-600 dark:text-gray-400">
              <span className="font-medium">h_t = tanh(W_xh · x_t + W_hh · h_{'{t-1}'} + b)</span>
              <span className="block mt-1 font-mono">Weighted sums: [{fmt(state.weightedSum)}]</span>
            </div>
          </div>
        )}

        {/* Output */}
        <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block mb-1 font-medium">Output: New Hidden State h_t</span>
          <span className="text-[9px] text-indigo-700 dark:text-indigo-300 font-mono">[{fmt(state.hiddenState)}]</span>
          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 block mt-1">
            |h_t| = {state.hiddenMag.toFixed(4)} | gradient = {state.gradientMag.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap View ─────────────────────────────────────────────────────────

function HeatmapView({
  sequence,
  cellType,
  activeStep,
}: {
  sequence: string[];
  cellType: CellType;
  activeStep: number;
}) {
  const simulation = useMemo(
    () => simulateSequence(sequence, cellType),
    [sequence, cellType],
  );

  const hiddenSize = 4;
  const cellW = 40;
  const cellH = 24;
  const padLeft = 50;
  const padTop = 30;
  const padRight = 20;
  const padBottom = 40;
  const minW = 400;
  const computedW = padLeft + sequence.length * cellW + padRight;
  const svgW = Math.max(minW, computedW);
  const svgH = padTop + hiddenSize * cellH + padBottom;

  const getColor = (val: number) => {
    const normalized = (val + 1) / 2;
    if (normalized > 0.6) return `rgba(34, 197, 94, ${Math.min(1, normalized)})`;
    if (normalized < 0.4) return `rgba(239, 68, 68, ${Math.min(1, 1 - normalized)})`;
    return `rgba(234, 179, 8, ${Math.min(1, Math.abs(normalized - 0.5) * 2)})`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Hidden State Heatmap</h3>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
        Rows = neurons, columns = timesteps. Color intensity shows activation level.
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minWidth: sequence.length > 10 ? '400px' : undefined }}>
          <rect x={0} y={0} width={svgW} height={svgH} fill="rgb(243 244 246)" rx="6" />

        {/* Column headers (tokens) */}
        {sequence.slice(0, activeStep + 1).map((token, t) => (
          <text key={`hm-col-${t}`} x={padLeft + t * cellW + cellW / 2} y={padTop - 8} fontSize={8} fill="#6B7280" textAnchor="middle">
            {token.slice(0, 4)}
          </text>
        ))}

        {/* Row labels and cells */}
        {Array.from({ length: hiddenSize }).map((_, row) => (
          <g key={`hm-row-${row}`}>
            <text x={padLeft - 5} y={padTop + row * cellH + cellH / 2 + 3} fontSize={8} fill="#6B7280" textAnchor="end">
              n{row}
            </text>
            {simulation.slice(0, activeStep + 1).map((state, t) => (
              <rect
                key={`hm-cell-${row}-${t}`}
                x={padLeft + t * cellW + 2}
                y={padTop + row * cellH + 2}
                width={cellW - 4}
                height={cellH - 4}
                rx={3}
                fill={getColor(state.hiddenState[row])}
                opacity={0.8}
              />
            ))}
          </g>
        ))}

        {/* Future steps (grayed out) */}
        {Array.from({ length: hiddenSize }).map((_, row) =>
          sequence.slice(activeStep + 1).map((_, t) => (
            <rect
              key={`hm-future-${row}-${t}`}
              x={padLeft + (activeStep + 1 + t) * cellW + 2}
              y={padTop + row * cellH + 2}
              width={cellW - 4}
              height={cellH - 4}
              rx={3}
              fill="#E5E7EB"
              opacity={0.4}
            />
          ))
        )}

        {/* Legend */}
        <rect x={padLeft} y={svgH - 25} width={12} height={12} rx={2} fill="rgba(34, 197, 94, 0.8)" />
        <text x={padLeft + 16} y={svgH - 16} fontSize={8} fill="#6B7280">High</text>
        <rect x={padLeft + 50} y={svgH - 25} width={12} height={12} rx={2} fill="rgba(234, 179, 8, 0.8)" />
        <text x={padLeft + 66} y={svgH - 16} fontSize={8} fill="#6B7280">Mid</text>
        <rect x={padLeft + 100} y={svgH - 25} width={12} height={12} rx={2} fill="rgba(239, 68, 68, 0.8)" />
        <text x={padLeft + 116} y={svgH - 16} fontSize={8} fill="#6B7280">Low</text>
      </svg>
      </div>
    </div>
  );
}

// ─── Embedding Visualization ──────────────────────────────────────────────

function EmbeddingVisualization({
  sequence,
  activeStep,
}: {
  sequence: string[];
  activeStep: number;
}) {
  const embeddings = useMemo(() => {
    const rng = seededRandom(42);
    return sequence.map((token) => {
      const vec = Array.from({ length: 4 }, () => (rng() - 0.5) * 2);
      return { token, vector: vec };
    });
  }, [sequence]);

  const cellW = 80;
  const cellH = 60;
  const gap = 12;
  // Dynamic width based on sequence length
  const minW = 600;
  const computedW = 40 + sequence.length * (cellW + gap);
  const svgW = Math.max(minW, computedW);
  const svgH = 120;

  const getColor = (val: number) => {
    if (val > 0.3) return '#22C55E';
    if (val < -0.3) return '#EF4444';
    return '#9CA3AF';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Token Embeddings</h3>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
        Each token is mapped to a 4-dimensional vector before entering the RNN cell. These are learned during training.
      </p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minWidth: sequence.length > 6 ? '600px' : undefined }}>
          <rect x={0} y={0} width={svgW} height={svgH} fill="rgb(243 244 246)" rx="6" />

        {embeddings.slice(0, activeStep + 1).map((emb, t) => {
          const x = 20 + t * (cellW + gap);
          return (
            <g key={`emb-${t}`}>
              {/* Token label */}
              <text x={x + cellW / 2} y={14} fontSize={9} fill="#374151" textAnchor="middle" fontWeight="bold">
                {emb.token.slice(0, 6)}
              </text>

              {/* Vector cells */}
              {emb.vector.map((val, i) => (
                <rect
                  key={`emb-${t}-${i}`}
                  x={x + 4 + i * 18}
                  y={22}
                  width={16}
                  height={cellH - 10}
                  rx={2}
                  fill={getColor(val)}
                  opacity={0.7}
                />
              ))}

              {/* Values */}
              {emb.vector.map((val, i) => (
                <text
                  key={`emb-val-${t}-${i}`}
                  x={x + 12 + i * 18}
                  y={cellH + 18}
                  fontSize={6}
                  fill="#6B7280"
                  textAnchor="middle"
                >
                  {val.toFixed(1)}
                </text>
              ))}
            </g>
          );
        })}

        {/* Future embeddings (grayed out) */}
        {embeddings.slice(activeStep + 1).map((emb, t) => {
          const x = 20 + (activeStep + 1 + t) * (cellW + gap);
          return (
            <g key={`emb-future-${t}`} opacity={0.3}>
              <text x={x + cellW / 2} y={14} fontSize={9} fill="#9CA3AF" textAnchor="middle">
                {emb.token.slice(0, 6)}
              </text>
              {emb.vector.map((_val, i) => (
                <rect
                  key={`emb-future-${t}-${i}`}
                  x={x + 4 + i * 18}
                  y={22}
                  width={16}
                  height={cellH - 10}
                  rx={2}
                  fill="#E5E7EB"
                />
              ))}
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function RNNSequenceVisualizer() {
  const [cellType, setCellType] = useState<CellType>('lstm');
  const [activeStep, setActiveStep] = useState(0);
  const [inputText, setInputText] = useState('I love deep learning !');
  const [sequence, setSequence] = useState(['I', 'love', 'deep', 'learning', '!']);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEmbeddings, setShowEmbeddings] = useState(true);

  const handleApplyInput = useCallback(() => {
    const tokens = inputText.trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      setSequence(tokens);
      setActiveStep(0);
      setSelectedCell(null);
    }
  }, [inputText]);

  const handlePreset = useCallback((preset: typeof PRESETS[number]) => {
    setInputText(preset.tokens.join(' '));
    setSequence([...preset.tokens]);
    setActiveStep(0);
    setActivePreset(preset.id);
    setSelectedCell(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApplyInput();
  }, [handleApplyInput]);

  const simulation = useMemo(
    () => simulateSequence(sequence, cellType),
    [sequence, cellType],
  );
  const currentStep = simulation[activeStep];

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sequence Input</h3>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={comparisonMode}
              onChange={() => { setComparisonMode(!comparisonMode); setActiveStep(0); setSelectedCell(null); }}
              className="rounded w-3.5 h-3.5" />
            Compare RNN vs LSTM vs GRU
          </label>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type tokens separated by spaces..."
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button onClick={handleApplyInput}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
            Apply
          </button>
        </div>

        {/* Cell Type + Presets row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Cell:</span>
            {(['rnn', 'lstm', 'gru'] as CellType[]).map(type => (
              <button key={type} onClick={() => { setCellType(type); setActiveStep(0); setSelectedCell(null); }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer uppercase ${cellType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {type}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(preset => (
              <button key={preset.id} onClick={() => handlePreset(preset)}
                title={preset.desc}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  activePreset === preset.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {preset.label.split(':')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      {!comparisonMode && (
        <>
          <VisualizationPanel sequence={sequence} cellType={cellType} activeStep={activeStep} />

          {/* Gate Activation Details */}
          {currentStep && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Gate Activations — Step {activeStep + 1}: &quot;{sequence[activeStep]}&quot;
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cellType === 'rnn' && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block mb-1">Hidden State |h|</span>
                    <div className="w-full bg-indigo-100 dark:bg-indigo-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, currentStep.hiddenMag * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-1 block">{currentStep.hiddenMag.toFixed(3)}</span>
                  </div>
                )}
                {cellType === 'lstm' && currentStep.gates.forget !== undefined && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-green-500 dark:text-green-400 block mb-1">Forget Gate (f)</span>
                      <div className="w-full bg-green-100 dark:bg-green-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentStep.gates.forget ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-green-700 dark:text-green-300 mt-1 block">{(currentStep.gates.forget ?? 0).toFixed(3)}</span>
                      <span className="text-[9px] text-green-600 dark:text-green-500">{(currentStep.gates.forget ?? 0) > 0.5 ? 'Keep memory' : 'Forget old'}</span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-amber-500 dark:text-amber-400 block mb-1">Input Gate (i)</span>
                      <div className="w-full bg-amber-100 dark:bg-amber-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentStep.gates.input ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1 block">{(currentStep.gates.input ?? 0).toFixed(3)}</span>
                      <span className="text-[9px] text-amber-600 dark:text-amber-500">{(currentStep.gates.input ?? 0) > 0.5 ? 'Write new' : 'Skip input'}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-blue-500 dark:text-blue-400 block mb-1">Output Gate (o)</span>
                      <div className="w-full bg-blue-100 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentStep.gates.output ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-1 block">{(currentStep.gates.output ?? 0).toFixed(3)}</span>
                      <span className="text-[9px] text-blue-600 dark:text-blue-500">{(currentStep.gates.output ?? 0) > 0.5 ? 'Output active' : 'Output blocked'}</span>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-purple-500 dark:text-purple-400 block mb-1">Memory Retention</span>
                      <div className="w-full bg-purple-100 dark:bg-purple-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${currentStep.memoryRetention * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-1 block">{currentStep.memoryRetention.toFixed(3)}</span>
                      <span className="text-[9px] text-purple-600 dark:text-purple-500">c={currentStep.cellState?.[0]?.toFixed(2) ?? '0.00'}</span>
                    </div>
                  </>
                )}
                {cellType === 'gru' && currentStep.gates.reset !== undefined && (
                  <>
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-pink-500 dark:text-pink-400 block mb-1">Reset Gate (r)</span>
                      <div className="w-full bg-pink-100 dark:bg-pink-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentStep.gates.reset ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-pink-700 dark:text-pink-300 mt-1 block">{(currentStep.gates.reset ?? 0).toFixed(3)}</span>
                      <span className="text-[9px] text-pink-600 dark:text-pink-500">{(currentStep.gates.reset ?? 0) > 0.5 ? 'Use past' : 'Ignore past'}</span>
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-violet-500 dark:text-violet-400 block mb-1">Update Gate (z)</span>
                      <div className="w-full bg-violet-100 dark:bg-violet-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${(currentStep.gates.update ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300 mt-1 block">{(currentStep.gates.update ?? 0).toFixed(3)}</span>
                      <span className="text-[9px] text-violet-600 dark:text-violet-500">{(currentStep.gates.update ?? 0) > 0.5 ? 'Update state' : 'Keep old state'}</span>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block mb-1">Memory Retention</span>
                      <div className="w-full bg-indigo-100 dark:bg-indigo-800 rounded-full h-3 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${currentStep.memoryRetention * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-1 block">{currentStep.memoryRetention.toFixed(3)}</span>
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-500">1 - z = retention</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Hidden State |h|</span>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div className="bg-gray-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, currentStep.hiddenMag * 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 block">{currentStep.hiddenMag.toFixed(3)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-3 text-[10px] text-gray-500 dark:text-gray-400 text-center">
                {cellType === 'lstm' && (
                  <>
                    {(currentStep.gates.forget ?? 0) > 0.7 && (currentStep.gates.input ?? 0) > 0.7
                      ? 'Both forgetting old and writing new — major state update'
                      : (currentStep.gates.forget ?? 0) > 0.7
                      ? 'Keeping most of the old memory'
                      : (currentStep.gates.input ?? 0) > 0.7
                      ? 'Writing significant new information'
                      : 'Minimal change to cell state'}
                  </>
                )}
                {cellType === 'gru' && (
                  <>
                    {(currentStep.gates.update ?? 0) > 0.7
                      ? 'Strong update — mostly new information'
                      : (currentStep.gates.update ?? 0) < 0.3
                      ? 'Weak update — keeping old state'
                      : 'Balanced mix of old and new'}
                  </>
                )}
                {cellType === 'rnn' && (
                  <>
                    {currentStep.hiddenMag > 0.6
                      ? 'Strong activation — high signal through network'
                      : currentStep.hiddenMag < 0.2
                      ? 'Weak signal — potential vanishing gradient'
                      : 'Moderate activation'}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
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
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Inspect Step:</span>
              <select
                value={selectedCell ?? ''}
                onChange={(e) => setSelectedCell(e.target.value === '' ? null : Number(e.target.value))}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <option value="">None</option>
                {sequence.map((token, i) => (
                  <option key={i} value={i}>Step {i + 1}: {token}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cell Detail Panel */}
          {selectedCell !== null && (
            <CellDetailPanel
              step={selectedCell}
              cellType={cellType}
              sequence={sequence}
              simulation={simulation}
            />
          )}

          {/* Heatmap + Embedding toggles */}
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${showHeatmap ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
              {showHeatmap ? 'Hide' : 'Show'} Heatmap
            </button>
            <button onClick={() => setShowEmbeddings(!showEmbeddings)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${showEmbeddings ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
              {showEmbeddings ? 'Hide' : 'Show'} Embeddings
            </button>
          </div>

          {/* Heatmap View */}
          {showHeatmap && (
            <HeatmapView sequence={sequence} cellType={cellType} activeStep={activeStep} />
          )}

          {/* Embedding Visualization */}
          {showEmbeddings && (
            <EmbeddingVisualization sequence={sequence} activeStep={activeStep} />
          )}
        </>
      )}

      {/* Comparison Mode */}
      {comparisonMode && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <VisualizationPanel sequence={sequence} cellType="rnn" activeStep={activeStep} compact />
            <VisualizationPanel sequence={sequence} cellType="lstm" activeStep={activeStep} compact />
            <VisualizationPanel sequence={sequence} cellType="gru" activeStep={activeStep} compact />
          </div>

          {/* Comparison Gate Summary */}
          {(() => {
            const rnnSim = simulateSequence(sequence, 'rnn');
            const lstmSim = simulateSequence(sequence, 'lstm');
            const gruSim = simulateSequence(sequence, 'gru');
            const rs = rnnSim[activeStep];
            const ls = lstmSim[activeStep];
            const gs = gruSim[activeStep];

            return (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Comparison at Step {activeStep + 1}: &quot;{sequence[activeStep]}&quot;
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* RNN */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block mb-1 font-medium">RNN |h|</span>
                    <div className="w-full bg-indigo-100 dark:bg-indigo-800 rounded-full h-3 overflow-hidden mb-1">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, rs.hiddenMag * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{rs.hiddenMag.toFixed(3)}</span>
                    <span className="text-[9px] text-indigo-500 block mt-1">No gates</span>
                  </div>
                  {/* LSTM */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-green-500 dark:text-green-400 block mb-1 font-medium">LSTM</span>
                    <div className="grid grid-cols-3 gap-1 mb-1">
                      <div>
                        <span className="text-[8px] text-green-600 block">F</span>
                        <div className="w-full bg-green-100 dark:bg-green-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${(ls.gates.forget ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-green-700 dark:text-green-300">{(ls.gates.forget ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-amber-600 block">I</span>
                        <div className="w-full bg-amber-100 dark:bg-amber-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(ls.gates.input ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300">{(ls.gates.input ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-blue-600 block">O</span>
                        <div className="w-full bg-blue-100 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(ls.gates.output ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-blue-700 dark:text-blue-300">{(ls.gates.output ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-green-600 block">mem={ls.memoryRetention.toFixed(2)}</span>
                  </div>
                  {/* GRU */}
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-pink-500 dark:text-pink-400 block mb-1 font-medium">GRU</span>
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <div>
                        <span className="text-[8px] text-pink-600 block">R</span>
                        <div className="w-full bg-pink-100 dark:bg-pink-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-pink-500 h-full rounded-full" style={{ width: `${(gs.gates.reset ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-pink-700 dark:text-pink-300">{(gs.gates.reset ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-violet-600 block">Z</span>
                        <div className="w-full bg-violet-100 dark:bg-violet-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-violet-500 h-full rounded-full" style={{ width: `${(gs.gates.update ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-violet-700 dark:text-violet-300">{(gs.gates.update ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-pink-600 block">mem={gs.memoryRetention.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  {(() => {
                    const memDiff = ls.memoryRetention - rs.memoryRetention;
                    if (memDiff > 0.2) return 'LSTM retains significantly more memory than RNN — gates are working!';
                    if (memDiff > 0.05) return 'LSTM retains slightly more memory than RNN';
                    return 'Both models show similar memory retention at this step';
                  })()}
                </div>
              </div>
            );
          })()}

          {/* Comparison Controls */}
          <div className="flex items-center gap-3">
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
        </>
      )}

      {/* Vanishing Gradient Demo */}
      {!comparisonMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Vanishing Gradient — 10-Step Comparison</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4">
            See how gradient magnitude decays over 10 steps. RNN gradients vanish exponentially, while LSTM preserves them through the cell state highway.
          </p>
          {(() => {
            const longSeq = Array.from({ length: 10 }, (_, i) => `w${i + 1}`);
            const rnnSim = simulateSequence(longSeq, 'rnn');
            const lstmSim = simulateSequence(longSeq, 'lstm');
            const gruSim = simulateSequence(longSeq, 'gru');

            const chartW = 600;
            const chartH = 200;
            const padLeft = 50;
            const padRight = 20;
            const padTop = 30;
            const padBottom = 35;
            const plotW = chartW - padLeft - padRight;
            const plotH = chartH - padTop - padBottom;

            const toX = (step: number) => padLeft + (step / 9) * plotW;
            const toY = (grad: number) => padTop + plotH - grad * plotH;

            const rnnPath = rnnSim.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(s.gradientMag)}`).join(' ');
            const lstmPath = lstmSim.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(s.gradientMag)}`).join(' ');
            const gruPath = gruSim.map((s, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(s.gradientMag)}`).join(' ');

            return (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
                <rect x={0} y={0} width={chartW} height={chartH} fill="rgb(243 244 246)" rx="6" />

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                  const y = toY(frac);
                  return (
                    <g key={`vg-grid-${i}`}>
                      <line x1={padLeft} y1={y} x2={chartW - padRight} y2={y} stroke="#E5E7EB" strokeWidth={1} />
                      <text x={padLeft - 5} y={y + 3} fontSize={8} fill="#9CA3AF" textAnchor="end">{frac.toFixed(2)}</text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {longSeq.map((_, i) => (
                  <text key={`vg-xlabel-${i}`} x={toX(i)} y={chartH - 10} fontSize={7} fill="#9CA3AF" textAnchor="middle">Step {i + 1}</text>
                ))}

                {/* Paths */}
                <path d={rnnPath} fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" />
                <path d={lstmPath} fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" />
                <path d={gruPath} fill="none" stroke="#8B5CF6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

                {/* Data points */}
                {rnnSim.map((s, i) => (
                  <circle key={`rnn-dot-${i}`} cx={toX(i)} cy={toY(s.gradientMag)} r={3} fill="#EF4444" />
                ))}
                {lstmSim.map((s, i) => (
                  <circle key={`lstm-dot-${i}`} cx={toX(i)} cy={toY(s.gradientMag)} r={3} fill="#22C55E" />
                ))}
                {gruSim.map((s, i) => (
                  <circle key={`gru-dot-${i}`} cx={toX(i)} cy={toY(s.gradientMag)} r={3} fill="#8B5CF6" />
                ))}

                {/* Legend */}
                <line x1={padLeft + 10} y1={15} x2={padLeft + 30} y2={15} stroke="#EF4444" strokeWidth={2.5} />
                <text x={padLeft + 35} y={18} fontSize={9} fill="#6B7280">RNN</text>
                <line x1={padLeft + 70} y1={15} x2={padLeft + 90} y2={15} stroke="#22C55E" strokeWidth={2.5} />
                <text x={padLeft + 95} y={18} fontSize={9} fill="#6B7280">LSTM</text>
                <line x1={padLeft + 130} y1={15} x2={padLeft + 150} y2={15} stroke="#8B5CF6" strokeWidth={2.5} />
                <text x={padLeft + 155} y={18} fontSize={9} fill="#6B7280">GRU</text>

                {/* Axis labels */}
                <text x={chartW / 2} y={chartH - 2} fontSize={9} fill="#6B7280" textAnchor="middle">Time Step</text>
                <text x={12} y={chartH / 2} fontSize={9} fill="#6B7280" textAnchor="middle" transform={`rotate(-90, 12, ${chartH / 2})`}>Gradient Magnitude</text>
              </svg>
            );
          })()}

          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <span className="text-[10px] text-red-500 block">RNN final gradient</span>
              <span className="text-xs font-bold text-red-700 dark:text-red-300">{simulateSequence(sequence, 'rnn')[Math.min(activeStep, sequence.length - 1)]?.gradientMag.toFixed(4) ?? '0'}</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
              <span className="text-[10px] text-green-500 block">LSTM final gradient</span>
              <span className="text-xs font-bold text-green-700 dark:text-green-300">{simulateSequence(sequence, 'lstm')[Math.min(activeStep, sequence.length - 1)]?.gradientMag.toFixed(4) ?? '0'}</span>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
              <span className="text-[10px] text-purple-500 block">GRU final gradient</span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{simulateSequence(sequence, 'gru')[Math.min(activeStep, sequence.length - 1)]?.gradientMag.toFixed(4) ?? '0'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cell Info (single mode only) */}
      {!comparisonMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {CELL_CONFIGS[cellType].name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{CELL_CONFIGS[cellType].description}</p>
            <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
              Gates: {CELL_CONFIGS[cellType].gates.join(', ')}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How RNNs Process Sequences</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              At each step, the cell takes the current input and previous hidden state, computes a new hidden state, and passes it forward. The hidden state acts as a &quot;memory&quot; of what the network has seen so far. LSTMs add a separate cell state and gates to control what to remember and what to forget.
            </p>
          </div>
        </div>
      )}

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">RNN</span>
            <span>→ Like reading a book one word at a time, remembering what you&apos;ve read so far. But you forget the beginning by the time you reach the end.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">LSTM Gates</span>
            <span>→ Like a smart note-taking system. Forget gate: &quot;Is this old info still relevant?&quot; Input gate: &quot;Should I write this down?&quot; Output gate: &quot;What do I need right now?&quot;</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Hidden State</span>
            <span>→ The network&apos;s working memory. It carries information from the past and influences future decisions.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Memory Retention</span>
            <span>→ How much of the original information survives after each step. High retention = long memory. Low retention = forgetting.</span>
          </div>
          {comparisonMode && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-300">Comparison</span>
              <span>→ Side-by-side reveals WHY gated architectures exist. Watch how LSTM and GRU preserve memory while vanilla RNN lets it decay.</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Vanishing Gradient</span>
            <span>→ Like a game of telephone — by the time the message passes through 10 people, it&apos;s completely garbled. LSTM adds a &quot;direct line&quot; (cell state) so the original message stays clear.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Weight Sharing</span>
            <span>→ Like using the same recipe for every chapter of a cookbook. The rules don&apos;t change — only the ingredients (inputs) do.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
