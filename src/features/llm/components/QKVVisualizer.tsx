'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  dotProduct,
  magnitude,
  cosineSimilarity,
  projectTo2D,
  softmax,
  matMul,
} from '@/features/llm/utils/qkv';

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

function generateWeightMatrix(seed: number): number[][] {
  return Array.from({ length: EMBED_DIM }, (_, i) =>
    Array.from({ length: EMBED_DIM }, (_, j) =>
      (seededRandom(i * 17 + j * 11 + seed) - 0.5) * 2
    )
  );
}

function colorForWeight(val: number): string {
  if (val > 0) return `rgba(59, 130, 246, ${Math.min(1, Math.abs(val) * 0.5)})`;
  return `rgba(239, 68, 68, ${Math.min(1, Math.abs(val) * 0.5)})`;
}

export default function QKVVisualizer() {
  const [seed, setSeed] = useState(0);
  const [selectedToken, setSelectedToken] = useState(0);
  const [head, setHead] = useState(0);
  const [activeTab, setActiveTab] = useState<'vectors' | 'weights' | 'compare' | 'sliders'>('vectors');
  const [selectedWeightMatrix, setSelectedWeightMatrix] = useState<'Wq' | 'Wk' | 'Wv'>('Wq');
  const [compareToken, setCompareToken] = useState(1);
  const [customQ, setCustomQ] = useState<number[] | null>(null);
  const [customK, setCustomK] = useState<number[] | null>(null);

  const inputEmbeddings = useMemo(() => generateProjection(seed), [seed]);
  const Wq = useMemo(() => generateWeightMatrix(seed + 100), [seed]);
  const Wk = useMemo(() => generateWeightMatrix(seed + 200), [seed]);
  const Wv = useMemo(() => generateWeightMatrix(seed + 300), [seed]);

  const Q = useMemo(() => matMul(inputEmbeddings, Wq), [inputEmbeddings, Wq]);
  const K = useMemo(() => matMul(inputEmbeddings, Wk), [inputEmbeddings, Wk]);
  const V = useMemo(() => matMul(inputEmbeddings, Wv), [inputEmbeddings, Wv]);

  const headSize = EMBED_DIM / NUM_HEADS;
  const qHead = Q.map((row) => row.slice(head * headSize, (head + 1) * headSize));
  const kHead = K.map((row) => row.slice(head * headSize, (head + 1) * headSize));
  const vHead = V.map((row) => row.slice(head * headSize, (head + 1) * headSize));

  const activeQ = customQ || qHead[selectedToken];
  const activeK = customK || kHead[selectedToken];

  const scores = useMemo(() => {
    const s: number[] = [];
    for (let i = 0; i < TOKENS.length; i++) {
      let dot = 0;
      for (let j = 0; j < headSize; j++) {
        dot += activeQ[j] * kHead[i][j];
      }
      s.push(dot / Math.sqrt(headSize));
    }
    return s;
  }, [activeQ, kHead, headSize]);

  const attentionWeights = useMemo(() => softmax(scores), [scores]);

  const output = useMemo(() => {
    const out = Array(headSize).fill(0);
    for (let i = 0; i < TOKENS.length; i++) {
      for (let j = 0; j < headSize; j++) {
        out[j] += attentionWeights[i] * vHead[i][j];
      }
    }
    return out;
  }, [attentionWeights, vHead]);

  const weightSum = attentionWeights.reduce((a, b) => a + b, 0);

  const qHeadCompare = Q.map((row) => row.slice(head * headSize, (head + 1) * headSize));
  const kHeadCompare = K.map((row) => row.slice(head * headSize, (head + 1) * headSize));

  const scoresCompare = useMemo(() => {
    const s: number[] = [];
    const q = qHeadCompare[compareToken];
    for (let i = 0; i < TOKENS.length; i++) {
      let dot = 0;
      for (let j = 0; j < headSize; j++) {
        dot += q[j] * kHeadCompare[i][j];
      }
      s.push(dot / Math.sqrt(headSize));
    }
    return s;
  }, [qHeadCompare, kHeadCompare, compareToken, headSize]);

  const weightsCompare = useMemo(() => softmax(scoresCompare), [scoresCompare]);

  const vectorProjection = useMemo(() => {
    const allVecs = [...qHead, ...kHead, ...vHead];
    const projected = projectTo2D(allVecs);
    return {
      q: projected.slice(0, TOKENS.length),
      k: projected.slice(TOKENS.length, TOKENS.length * 2),
      v: projected.slice(TOKENS.length * 2, TOKENS.length * 3),
    };
  }, [qHead, kHead, vHead]);

  const cosSim = cosineSimilarity(activeQ, kHead[selectedToken]);
  const dotProd = dotProduct(activeQ, activeK);
  const magQ = magnitude(activeQ);
  const magK = magnitude(activeK);

  const resetSliders = useCallback(() => {
    setCustomQ(null);
    setCustomK(null);
  }, []);

  const updateCustomQ = useCallback((dim: number, val: number) => {
    setCustomQ((prev) => {
      const base = prev || qHead[selectedToken];
      const next = [...base];
      next[dim] = val;
      return next;
    });
  }, [qHead, selectedToken]);

  const updateCustomK = useCallback((dim: number, val: number) => {
    setCustomK((prev) => {
      const base = prev || kHead[selectedToken];
      const next = [...base];
      next[dim] = val;
      return next;
    });
  }, [kHead, selectedToken]);

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
          Explore Query, Key, and Value vectors in depth. Visualize vector geometry, inspect weight matrices,
          compare attention heads, and manipulate Q/K in real-time.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Token</label>
                <div className="flex gap-1">
                  {TOKENS.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedToken(i); setCustomQ(null); setCustomK(null); }}
                      className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                        selectedToken === i
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-500">Head</label>
                <div className="flex gap-1">
                  {Array.from({ length: NUM_HEADS }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { setHead(i); setCustomQ(null); setCustomK(null); }}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        head === i
                          ? 'bg-purple-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Head {i}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="px-3 py-1 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Randomize
              </button>
            </div>
            <div className="flex gap-1">
              {(['vectors', 'weights', 'compare', 'sliders'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-amber-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {tab === 'vectors' ? 'Vector Space' : tab === 'weights' ? 'Weight Matrix' : tab === 'compare' ? 'Compare Heads' : 'Q/K Sliders'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'vectors' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-sm mb-3">Q, K, V Projections</h3>
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

            <div>
              <h3 className="font-semibold text-sm mb-3">Vector Space (2D Projection)</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <svg viewBox="-3 -3 6 6" className="w-full h-72 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <line x1="-3" y1="0" x2="3" y2="0" stroke="#e5e7eb" strokeWidth="0.04" />
                  <line x1="0" y1="-3" x2="0" y2="3" stroke="#e5e7eb" strokeWidth="0.04" />

                  {vectorProjection.q.map((p, i) => {
                    if (i === selectedToken) return null;
                    return <circle key={`q-bg-${i}`} cx={p.x} cy={p.y} r="0.06" fill="#93c5fd" opacity="0.4" />;
                  })}
                  {vectorProjection.k.map((p, i) => {
                    if (i === selectedToken) return null;
                    return <circle key={`k-bg-${i}`} cx={p.x} cy={p.y} r="0.06" fill="#86efac" opacity="0.4" />;
                  })}
                  {vectorProjection.v.map((p, i) => {
                    if (i === selectedToken) return null;
                    return <circle key={`v-bg-${i}`} cx={p.x} cy={p.y} r="0.06" fill="#d8b4fe" opacity="0.4" />;
                  })}

                  <line
                    x1={0} y1={0}
                    x2={vectorProjection.q[selectedToken].x} y2={vectorProjection.q[selectedToken].y}
                    stroke="#3b82f6" strokeWidth="0.08"
                  />
                  <circle cx={vectorProjection.q[selectedToken].x} cy={vectorProjection.q[selectedToken].y} r="0.18" fill="#3b82f6" />
                  <text
                    x={vectorProjection.q[selectedToken].x + (vectorProjection.q[selectedToken].x >= 0 ? 0.25 : -0.25)}
                    y={vectorProjection.q[selectedToken].y + 0.05}
                    fontSize="0.28" fill="#1d4ed8" fontWeight="bold" fontFamily="monospace"
                    textAnchor={vectorProjection.q[selectedToken].x >= 0 ? 'start' : 'end'}
                  >
                    Q
                  </text>

                  <line
                    x1={0} y1={0}
                    x2={vectorProjection.k[selectedToken].x} y2={vectorProjection.k[selectedToken].y}
                    stroke="#22c55e" strokeWidth="0.08"
                  />
                  <circle cx={vectorProjection.k[selectedToken].x} cy={vectorProjection.k[selectedToken].y} r="0.18" fill="#22c55e" />
                  <text
                    x={vectorProjection.k[selectedToken].x + (vectorProjection.k[selectedToken].x >= 0 ? 0.25 : -0.25)}
                    y={vectorProjection.k[selectedToken].y + 0.05}
                    fontSize="0.28" fill="#15803d" fontWeight="bold" fontFamily="monospace"
                    textAnchor={vectorProjection.k[selectedToken].x >= 0 ? 'start' : 'end'}
                  >
                    K
                  </text>

                  <line
                    x1={0} y1={0}
                    x2={vectorProjection.v[selectedToken].x} y2={vectorProjection.v[selectedToken].y}
                    stroke="#a855f7" strokeWidth="0.08"
                  />
                  <circle cx={vectorProjection.v[selectedToken].x} cy={vectorProjection.v[selectedToken].y} r="0.18" fill="#a855f7" />
                  <text
                    x={vectorProjection.v[selectedToken].x + (vectorProjection.v[selectedToken].x >= 0 ? 0.25 : -0.25)}
                    y={vectorProjection.v[selectedToken].y + 0.05}
                    fontSize="0.28" fill="#7e22ce" fontWeight="bold" fontFamily="monospace"
                    textAnchor={vectorProjection.v[selectedToken].x >= 0 ? 'start' : 'end'}
                  >
                    V
                  </text>

                  <circle cx={0} cy={0} r="0.1" fill="#374151" />
                </svg>
                <div className="flex justify-center gap-6 mt-3">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">Q (Query)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">K (Key)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">V (Value)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span className="text-gray-400">Other tokens</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Showing &quot;{TOKENS[selectedToken]}&quot; vectors. Faint dots = other tokens in the same space.
                </p>
              </div>

              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-xs mb-2">Geometric Interpretation</h4>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Q · K = |Q| × |K| × cos(θ)</strong></p>
                  <p>Dot product: <span className="font-mono">{dotProd.toFixed(3)}</span></p>
                  <p>|Q| = <span className="font-mono">{magQ.toFixed(3)}</span>, |K| = <span className="font-mono">{magK.toFixed(3)}</span></p>
                  <p>cos(θ) = <span className="font-mono">{cosSim.toFixed(3)}</span></p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Vectors pointing in the same direction have cos(θ) ≈ 1 (high attention).
                    Orthogonal vectors have cos(θ) ≈ 0 (no attention).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weights' && (
          <div className="mb-6">
            <h3 className="font-semibold text-sm mb-3">Weight Matrix Explorer</h3>
            <div className="flex gap-2 mb-4">
              {(['Wq', 'Wk', 'Wv'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setSelectedWeightMatrix(w)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedWeightMatrix === w
                      ? 'bg-amber-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-xs font-semibold mb-2 text-gray-500">
                  {selectedWeightMatrix} Matrix ({EMBED_DIM}×{EMBED_DIM})
                </h4>
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1 text-[10px] text-gray-500">In ↓ / Out →</th>
                      {Array.from({ length: EMBED_DIM }, (_, i) => (
                        <th key={i} className="p-1 text-[10px] font-mono text-gray-500 min-w-[40px]">dim{i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedWeightMatrix === 'Wq' ? Wq : selectedWeightMatrix === 'Wk' ? Wk : Wv).map((row, i) => (
                      <tr key={i}>
                        <td className="p-1 text-[10px] font-mono text-gray-500">dim{i}</td>
                        {row.map((val, j) => (
                          <td key={j} className="p-0.5">
                            <div
                              className="w-9 h-9 rounded flex items-center justify-center text-[9px] font-mono cursor-default"
                              style={{ backgroundColor: colorForWeight(val), color: Math.abs(val) > 0.6 ? 'white' : 'inherit' }}
                              title={`Input dim${i} → Output dim${j}: ${val.toFixed(3)}`}
                            >
                              {val.toFixed(2)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-gray-400 mt-2">
                  Blue = positive weight, Red = negative weight. Deeper color = larger magnitude.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-xs font-semibold mb-2 text-gray-500">How It Works</h4>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-2">
                  <p>
                    <strong>{selectedWeightMatrix}</strong> is a learned matrix that projects input embeddings into the {
                      selectedWeightMatrix === 'Wq' ? 'Query' : selectedWeightMatrix === 'Wk' ? 'Key' : 'Value'
                    } space.
                  </p>
                  <p className="font-mono text-[10px] bg-white dark:bg-gray-800 p-1.5 rounded">
                    {selectedWeightMatrix === 'Wq' ? 'Q' : selectedWeightMatrix === 'Wk' ? 'K' : 'V'} = Input × {selectedWeightMatrix}
                  </p>
                  <p>
                    Each row of {selectedWeightMatrix} corresponds to an input dimension. Each column corresponds to an output dimension.
                  </p>
                  <p>
                    <strong>Row 0:</strong> How input dim 0 contributes to each output dim.<br />
                    <strong>Column 0:</strong> How each input dim contributes to output dim 0.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Click a cell in the matrix above to see its title tooltip with the exact connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="mb-6">
            <h3 className="font-semibold text-sm mb-3">Multi-Head Comparison</h3>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1 text-gray-500">Compare token:</label>
              <div className="flex gap-1">
                {TOKENS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setCompareToken(i)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                      compareToken === i
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((h) => {
                const qH = Q.map((row) => row.slice(h * headSize, (h + 1) * headSize));
                const kH = K.map((row) => row.slice(h * headSize, (h + 1) * headSize));
                const sc: number[] = [];
                const qv = qH[compareToken];
                for (let i = 0; i < TOKENS.length; i++) {
                  let dot = 0;
                  for (let j = 0; j < headSize; j++) dot += qv[j] * kH[i][j];
                  sc.push(dot / Math.sqrt(headSize));
                }
                const wt = softmax(sc);
                const maxIdx = wt.indexOf(Math.max(...wt));

                return (
                  <div key={h} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-400">
                      Head {h} {h === head && <span className="text-[10px] text-gray-400">(active)</span>}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <span className="text-[10px] text-gray-500">Q</span>
                        <div className="flex gap-0.5">
                          {qH[compareToken].map((v, j) => (
                            <div key={j} className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-mono text-white bg-blue-500" style={{ opacity: 0.4 + Math.abs(v) * 0.3 }}>
                              {v.toFixed(1)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500">K</span>
                        <div className="flex gap-0.5">
                          {kH[compareToken].map((v, j) => (
                            <div key={j} className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-mono text-white bg-green-500" style={{ opacity: 0.4 + Math.abs(v) * 0.3 }}>
                              {v.toFixed(1)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {TOKENS.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] w-8">{t}</span>
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${wt[i] * 100}%` }}
                              className={`h-full rounded-full ${i === maxIdx ? 'bg-purple-600' : 'bg-purple-300 dark:bg-purple-800'}`}
                            />
                          </div>
                          <span className="text-[9px] font-mono w-8 text-right">{(wt[i] * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Top focus: <strong>{TOKENS[maxIdx]}</strong> ({(wt[maxIdx] * 100).toFixed(1)}%)
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <h4 className="font-semibold text-xs mb-1">Why Multiple Heads?</h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                Each head has its own {selectedWeightMatrix === 'Wq' ? 'Wq' : selectedWeightMatrix === 'Wk' ? 'Wk' : 'Wv'} matrices, so it learns
                different patterns. Head 0 might focus on positional proximity while Head 1 tracks syntactic roles.
                Their outputs are concatenated, giving the model multiple &quot;views&quot; of the same input.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sliders' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Interactive Q/K Sliders</h3>
              <button
                onClick={resetSliders}
                className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reset to Learned Values
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3">
                  Q (Query) — &quot;What am I looking for?&quot;
                </h4>
                <div className="space-y-3">
                  {activeQ.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500 w-8">dim{i}</span>
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.05}
                        value={v}
                        onChange={(e) => updateCustomQ(i, Number(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 w-10 text-right">
                        {v.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-3">
                  K (Key) — &quot;What do I contain?&quot;
                </h4>
                <div className="space-y-3">
                  {activeK.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500 w-8">dim{i}</span>
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.05}
                        value={v}
                        onChange={(e) => updateCustomK(i, Number(e.target.value))}
                        className="flex-1 accent-green-600"
                      />
                      <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 w-10 text-right">
                        {v.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-xs font-semibold mb-3">Live Result</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <span className="text-[10px] text-gray-500 block">Dot Product</span>
                  <span className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{dotProd.toFixed(3)}</span>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <span className="text-[10px] text-gray-500 block">cos(θ)</span>
                  <span className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{cosSim.toFixed(3)}</span>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                  <span className="text-[10px] text-gray-500 block">Scaled Score</span>
                  <span className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{(dotProd / Math.sqrt(headSize)).toFixed(3)}</span>
                </div>
              </div>

              <h4 className="text-xs font-semibold mb-2">Attention Weights (all tokens)</h4>
              <div className="space-y-1">
                {TOKENS.map((token, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] w-8">{token}</span>
                    <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${attentionWeights[i] * 100}%` }}
                        className={`h-full rounded-full transition-all duration-200 ${
                          i === selectedToken ? 'bg-blue-600' : 'bg-blue-400'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono w-10 text-right">{(attentionWeights[i] * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Sum: {weightSum.toFixed(4)} (should be 1.0)
              </p>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-xs font-semibold mb-2">Output Vector</h4>
              <div className="flex gap-0.5">
                {output.map((v, j) => (
                  <div
                    key={j}
                    className="w-10 h-10 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${0.4 + Math.abs(v) * 0.3})` }}
                  >
                    {v.toFixed(3)}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                This is the weighted sum of V vectors using the attention weights above.
                Drag the Q/K sliders to see how the output changes in real-time.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'vectors' && (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">
                Attention Scores & Weights (Head {head})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Raw scores (Q · K<sup>T</sup> / √d<sub>k</sub>) → Softmax → Attention weights (sum = {weightSum.toFixed(2)})
              </p>
              <div className="space-y-2">
                {TOKENS.map((token, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-sm min-w-[60px]">{token}</span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${attentionWeights[i] * 100}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          i === selectedToken ? 'bg-blue-600' : 'bg-blue-400'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 min-w-[50px] text-right">
                      {scores[i].toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-gray-700 dark:text-gray-300 min-w-[50px] text-right font-medium">
                      {(attentionWeights[i] * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Left = raw score, Right = softmax weight. Bars show weight (not raw score).
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">Output: Attention Weights × V</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                The final output is a weighted sum of Value vectors, where weights come from softmax(Q · K<sup>T</sup> / √d<sub>k</sub>).
              </p>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 mb-2 block">Weighted Vectors</span>
                    <div className="space-y-1">
                      {TOKENS.map((token, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-500 w-8">{token}</span>
                          <span className="text-[10px] text-purple-500 font-mono">×</span>
                          <span className="text-[10px] text-gray-700 dark:text-gray-300 font-mono font-medium">
                            {attentionWeights[i].toFixed(3)}
                          </span>
                          <div className="flex gap-0.5">
                            {vHead[i].map((v, j) => (
                              <div
                                key={j}
                                className="w-5 h-5 rounded flex items-center justify-center text-[7px] font-mono"
                                style={{
                                  backgroundColor: `rgba(168, 85, 247, ${Math.abs(v) * 0.4})`,
                                  color: Math.abs(v) > 0.5 ? 'white' : 'inherit',
                                }}
                              >
                                {(attentionWeights[i] * v).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 mb-2 block">Summed Output</span>
                    <div className="flex gap-0.5">
                      {output.map((v, j) => (
                        <div
                          key={j}
                          className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${0.4 + Math.abs(v) * 0.3})`,
                          }}
                        >
                          {v.toFixed(2)}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      New representation of &quot;{TOKENS[selectedToken]}&quot; after one head.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

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

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">The Full Formula</h4>
          <p className="text-sm font-mono text-center py-2 text-gray-800 dark:text-gray-200">
            Attention(Q, K, V) = softmax(QK<sup>T</sup> / √d<sub>k</sub>)V
          </p>
          <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1 mt-2">
            <p><strong>Step 1:</strong> Dot product Q · K for each token pair → raw scores</p>
            <p><strong>Step 2:</strong> Scale by √d<sub>k</sub> (currently √{headSize} ≈ {Math.sqrt(headSize).toFixed(2)}) → scaled scores</p>
            <p><strong>Step 3:</strong> Apply softmax → attention weights (sum to 1.0)</p>
            <p><strong>Step 4:</strong> Multiply weights × V → output representation</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Why Scale by √d<sub>k</sub>?</h4>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            When d<sub>k</sub> is large, dot products grow in magnitude, pushing softmax into saturated regions
            with near-zero gradients. Dividing by √d<sub>k</sub> keeps variance stable, ensuring smooth training.
          </p>
        </div>
      </div>
    </div>
  );
}
