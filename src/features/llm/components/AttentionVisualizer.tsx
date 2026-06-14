'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function generateAttentionMatrix(seed: number): number[][] {
  return Array.from({ length: TOKENS.length }, (_, i) =>
    Array.from({ length: TOKENS.length }, (_, j) => {
      const base = seededRandom(i * 13 + j * 7 + seed);
      const positional = Math.abs(i - j) < 2 ? 0.2 : -0.1;
      return Math.max(0, Math.min(1, base + positional));
    })
  );
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export default function AttentionVisualizer() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [seed, setSeed] = useState(0);
  const [showSoftmax, setShowSoftmax] = useState(true);

  const rawMatrix = useMemo(() => generateAttentionMatrix(seed), [seed]);
  const attentionMatrix = useMemo(() => {
    return rawMatrix.map((row) => softmax(row));
  }, [rawMatrix]);

  const currentWeights = attentionMatrix[selectedToken];
  const maxValue = Math.max(...currentWeights);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Attention Visualizer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Self-attention allows each token to attend to all other tokens. The attention weights show how much focus each token places on others.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Controls</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click a token to see what it attends to</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSoftmax(!showSoftmax)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showSoftmax
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Softmax
              </button>
              <button
                onClick={() => setSeed(s => s + 1)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                New
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Token Selection</h3>
          <div className="flex gap-2">
            {TOKENS.map((token, i) => (
              <button
                key={i}
                onClick={() => setSelectedToken(i)}
                className={`px-4 py-2 text-sm font-mono rounded-lg transition-all ${
                  selectedToken === i
                    ? 'bg-blue-600 text-white scale-110 shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm mb-3">Attention Heatmap</h3>
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="p-1 text-xs text-gray-500">From↓ To→</th>
                    {TOKENS.map((t, i) => (
                      <th key={i} className="p-1 text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[50px]">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attentionMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className={`p-1 text-xs font-mono font-semibold ${
                        i === selectedToken ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {TOKENS[i]}
                      </td>
                      {row.map((val, j) => (
                        <td key={j} className="p-0.5">
                          <motion.div
                            className={`w-10 h-10 rounded flex items-center justify-center text-[10px] font-mono cursor-pointer transition-all ${
                              i === selectedToken ? 'ring-2 ring-blue-400' : ''
                            }`}
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${val})`,
                              color: val > 0.5 ? 'white' : 'inherit',
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {val.toFixed(2)}
                          </motion.div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Rows = Query token, Columns = Key token. Row {selectedToken} ({TOKENS[selectedToken]}) highlighted.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">
              Attention from &quot;{TOKENS[selectedToken]}&quot;
            </h3>
            <div className="space-y-2">
              {TOKENS.map((token, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="font-mono text-sm min-w-[60px]">{token}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${currentWeights[i] * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full flex items-center justify-end pr-2 ${
                        currentWeights[i] === maxValue
                          ? 'bg-blue-600'
                          : currentWeights[i] > 0.3
                          ? 'bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-white font-medium">
                        {(currentWeights[i] * 100).toFixed(1)}%
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <h4 className="font-semibold text-xs mb-1">How Attention Works</h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Attention(Q, K, V) = softmax(QK<sup>T</sup> / √d<sub>k</sub>)V
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Each token creates a Query, Key, and Value. Attention scores = dot product of Query and Key, scaled and softmaxed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
