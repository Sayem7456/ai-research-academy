'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const MAX_LEN = 10;
const EMBED_DIM = 8;

function positionalEncoding(pos: number, i: number, dModel: number): number {
  const denominator = Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
  return i % 2 === 0 ? Math.sin(pos / denominator) : Math.cos(pos / denominator);
}

export default function PositionalEncodingExplorer() {
  const [selectedPos, setSelectedPos] = useState(0);
  const [showWaveform, setShowWaveform] = useState(true);

  const peMatrix = useMemo(() => {
    return Array.from({ length: MAX_LEN }, (_, pos) =>
      Array.from({ length: EMBED_DIM }, (_, i) =>
        positionalEncoding(pos, i, EMBED_DIM)
      )
    );
  }, []);

  const maxValue = Math.max(...peMatrix.flat().map(Math.abs));

  const renderHeatmap = () => (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-1 text-xs text-gray-500">Dim↓ Pos→</th>
            {Array.from({ length: MAX_LEN }, (_, i) => (
              <th key={i} className="p-1 text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[50px]">
                pos {i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: EMBED_DIM }, (_, dim) => (
            <tr key={dim}>
              <td className="p-1 text-xs font-mono text-gray-600 dark:text-gray-400">
                dim {dim}
              </td>
              {peMatrix.map((row, pos) => (
                <td key={pos} className="p-0.5">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-[10px] font-mono cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: row[dim] > 0
                        ? `rgba(34, 197, 94, ${Math.abs(row[dim]) / maxValue})`
                        : `rgba(239, 68, 68, ${Math.abs(row[dim]) / maxValue})`,
                      color: Math.abs(row[dim]) > maxValue * 0.5 ? 'white' : 'inherit',
                    }}
                  >
                    {row[dim].toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWaveform = () => (
    <div className="space-y-3">
      {Array.from({ length: EMBED_DIM }, (_, dim) => {
        const isSine = dim % 2 === 0;
        return (
          <div key={dim} className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500 w-12">
              {isSine ? 'sin' : 'cos'}({dim})
            </span>
            <div className="flex-1 h-8 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden relative">
              <svg viewBox={`0 0 ${MAX_LEN * 40} 80`} className="w-full h-full">
                <path
                  d={Array.from({ length: MAX_LEN }, (_, pos) => {
                    const x = pos * 40 + 20;
                    const y = 40 - peMatrix[pos][dim] * 30;
                    return `${pos === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={isSine ? '#22c55e' : '#3b82f6'}
                  strokeWidth="2"
                />
                {peMatrix.map((row, pos) => (
                  <circle
                    key={pos}
                    cx={pos * 40 + 20}
                    cy={40 - row[dim] * 30}
                    r={pos === selectedPos ? 5 : 3}
                    fill={pos === selectedPos ? '#f59e0b' : isSine ? '#22c55e' : '#3b82f6'}
                    className="cursor-pointer"
                  />
                ))}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Positional Encoding Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Transformers have no inherent sense of order. Positional encodings inject position information using sinusoidal functions.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Controls</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click a position to highlight it across dimensions
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWaveform(true)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showWaveform ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Waveform
              </button>
              <button
                onClick={() => setShowWaveform(false)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  !showWaveform ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Heatmap
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Position Selection</h3>
          <div className="flex gap-2">
            {Array.from({ length: MAX_LEN }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedPos(i)}
                className={`w-10 h-10 text-sm font-mono rounded-lg transition-all ${
                  selectedPos === i
                    ? 'bg-amber-500 text-white scale-110 shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Position {selectedPos} Encoding Vector</h3>
          <div className="flex gap-1 justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {peMatrix[selectedPos].map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-[10px] font-mono text-white font-medium"
                  style={{
                    backgroundColor: val > 0 ? '#22c55e' : '#ef4444',
                    opacity: 0.5 + Math.abs(val) * 0.5,
                  }}
                >
                  {val.toFixed(2)}
                </div>
                <span className="text-[9px] text-gray-500 mt-1">{i % 2 === 0 ? 'sin' : 'cos'}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">
            {showWaveform ? 'Sinusoidal Waves per Dimension' : 'Full PE Matrix'}
          </h3>
          {showWaveform ? renderWaveform() : renderHeatmap()}
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
          <h3 className="font-semibold text-sm mb-2">Why Sinusoidal?</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300">
            Sinusoidal encodings have a key property: PE(pos+k) can be expressed as a linear function of PE(pos).
            This allows the model to learn to attend by relative positions. Different frequencies capture both
            fine-grained and coarse positional information.
          </p>
        </div>
      </div>
    </div>
  );
}
