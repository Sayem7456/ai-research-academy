'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
const EMBED_DIM = 4;
const NUM_HEADS = 2;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function generateProjection(seed: number): number[][] {
  return Array.from({ length: TOKENS.length }, (_, i) =>
    Array.from({ length: EMBED_DIM }, (_, j) =>
      (seededRandom(i * 13 + j * 7 + seed) - 0.5) * 2
    )
  );
}

function matMul(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export default function QKVVisualizer() {
  const [seed, setSeed] = useState(0);
  const [selectedToken, setSelectedToken] = useState(0);
  const [head, setHead] = useState(0);

  const inputEmbeddings = useMemo(() => generateProjection(seed), [seed]);
  const Wq = useMemo(() => generateProjection(seed + 100), [seed]);
  const Wk = useMemo(() => generateProjection(seed + 200), [seed]);
  const Wv = useMemo(() => generateProjection(seed + 300), [seed]);

  const Q = useMemo(() => matMul(inputEmbeddings, Wq), [inputEmbeddings, Wq]);
  const K = useMemo(() => matMul(inputEmbeddings, Wk), [inputEmbeddings, Wk]);
  const V = useMemo(() => matMul(inputEmbeddings, Wv), [inputEmbeddings, Wv]);

  const headSize = EMBED_DIM / NUM_HEADS;
  const qHead = Q.map((row) => row.slice(head * headSize, (head + 1) * headSize));
  const kHead = K.map((row) => row.slice(head * headSize, (head + 1) * headSize));

  const scores = useMemo(() => {
    const s: number[] = [];
    const q = qHead[selectedToken];
    for (let i = 0; i < TOKENS.length; i++) {
      let dot = 0;
      for (let j = 0; j < headSize; j++) {
        dot += q[j] * kHead[i][j];
      }
      s.push(dot / Math.sqrt(headSize));
    }
    return s;
  }, [qHead, kHead, selectedToken, headSize]);

  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore || 1;

  const renderVector = (vec: number[], label: string, color: string) => (
    <div className="flex flex-col items-center">
      <span className="text-xs font-semibold mb-1">{label}</span>
      <div className="flex gap-0.5">
        {vec.map((v, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono text-white"
            style={{
              backgroundColor: color,
              opacity: 0.4 + Math.abs(v) * 0.3,
            }}
          >
            {v.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">QKV Visualizer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Every token is projected into Query, Key, and Value vectors via learned weight matrices.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Token</label>
              <div className="flex gap-1">
                {TOKENS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedToken(i)}
                    className={`px-2 py-1 text-xs font-mono rounded ${
                      selectedToken === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Attention Head</label>
              <div className="flex gap-1">
                {Array.from({ length: NUM_HEADS }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setHead(i)}
                    className={`px-3 py-1 text-xs rounded ${
                      head === i
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Head {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSeed(s => s + 1)}
                className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Randomize
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">
            Token &quot;{TOKENS[selectedToken]}&quot; → Q, K, V Projections
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                {renderVector(Q[selectedToken], 'Q (Query)', '#3b82f6')}
                <p className="text-[10px] text-gray-500 mt-2">What am I looking for?</p>
              </div>
              <div className="text-center">
                {renderVector(K[selectedToken], 'K (Key)', '#22c55e')}
                <p className="text-[10px] text-gray-500 mt-2">What do I contain?</p>
              </div>
              <div className="text-center">
                {renderVector(V[selectedToken], 'V (Value)', '#a855f7')}
                <p className="text-[10px] text-gray-500 mt-2">What do I output?</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">
            Attention Scores (Head {head}): Q · K<sup>T</sup> / √d<sub>k</sub>
          </h3>
          <div className="space-y-2">
            {TOKENS.map((token, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="font-mono text-sm min-w-[60px]">{token}</span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${((scores[i] - minScore) / range) * 100}%` }}
                    className={`h-full rounded-full ${
                      i === selectedToken ? 'bg-blue-600' : 'bg-blue-400'
                    }`}
                  />
                </div>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                  {scores[i].toFixed(3)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-1">Query</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              The token&apos;s &quot;question&quot; — what it&apos;s looking for in other tokens.
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-1">Key</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              The token&apos;s &quot;label&quot; — what information it offers to others.
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-400 mb-1">Value</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              The actual content passed forward when attention is high.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
