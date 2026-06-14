'use client';

import React, { useState, useMemo } from 'react';
import { TOKENS, ATTENTION_LAYERS } from '@/features/llm/data/attentionPatterns';
import { softmax, applyCausalMask, computeRollout } from '@/features/llm/utils/attention';

function blendHeads(matrices: number[][][], activeIndices: number[]): number[][] {
  if (activeIndices.length === 0) {
    const n = matrices[0].length;
    return Array.from({ length: n }, () => Array(n).fill(1 / n));
  }
  const n = matrices[0].length;
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const idx of activeIndices) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result[i][j] += matrices[idx][i][j] / activeIndices.length;
      }
    }
  }
  return result;
}

function cellColor(val: number, headColors: string[], activeCount: number): string {
  if (activeCount <= 1) {
    return `rgba(59, 130, 246, ${val})`;
  }
  const r = Math.round(59 + val * 100);
  const g = Math.round(130 * (1 - val * 0.3));
  const b = Math.round(246 - val * 80);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0.15, val)})`;
}

export default function AttentionVisualizer() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [activeHeads, setActiveHeads] = useState<number[]>([0]);
  const [useCausal, setUseCausal] = useState(false);
  const [showSoftmax, setShowSoftmax] = useState(true);
  const [inspectedCell, setInspectedCell] = useState<[number, number] | null>(null);
  const [view, setView] = useState<'heatmap' | 'rollout'>('heatmap');

  const layerData = ATTENTION_LAYERS[selectedLayer];
  const headMatrices = layerData.heads.map((h) => h.weights);
  const rawBlended = useMemo(
    () => blendHeads(headMatrices, activeHeads),
    [headMatrices, activeHeads]
  );
  const blendedMatrix = useMemo(
    () => (useCausal ? rawBlended.map((row, i) => applyCausalMask([row])[0]) : rawBlended),
    [rawBlended, useCausal]
  );
  const attentionMatrix = useMemo(
    () => (showSoftmax ? blendedMatrix.map((row) => softmax(row)) : blendedMatrix),
    [blendedMatrix, showSoftmax]
  );

  const rolloutMatrix = useMemo(
    () => computeRollout(ATTENTION_LAYERS.map((l) => l.heads.map((h) => h.weights)), useCausal),
    [useCausal]
  );

  const currentWeights = attentionMatrix[selectedToken];
  const maxValue = Math.max(...currentWeights);
  const rawSum = currentWeights.reduce((a, b) => a + b, 0);
  const activeHeadData = activeHeads.map((i) => layerData.heads[i]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Attention Visualizer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how Transformer attention works across multiple heads and layers.
          Toggle heads, switch layers, and see how attention compounds through the network.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold mb-1">View</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click a token to inspect its attention</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('heatmap')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  view === 'heatmap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                Attention Heatmap
              </button>
              <button
                onClick={() => setView('rollout')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  view === 'rollout'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                Attention Rollout
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold mb-1">Controls</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Layer:</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={selectedLayer}
                    onChange={(e) => setSelectedLayer(Number(e.target.value))}
                    className="w-24 accent-blue-600"
                  />
                  <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{selectedLayer + 1}/6</span>
                </div>
                <button
                  onClick={() => setUseCausal(!useCausal)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    useCausal
                      ? 'bg-amber-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                  title={useCausal ? 'GPT-style: tokens can only attend to previous tokens' : 'BERT-style: tokens can attend to all other tokens'}
                >
                  {useCausal ? '🔒 Causal (GPT)' : '↔ Bidirectional (BERT)'}
                </button>
                <button
                  onClick={() => setShowSoftmax(!showSoftmax)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    showSoftmax
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Softmax {showSoftmax ? 'On' : 'Off'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Heads:</span>
              <div className="flex gap-1">
                {layerData.heads.map((head, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setActiveHeads((prev) =>
                        prev.includes(i) ? prev.filter((h) => h !== i) : [...prev, i]
                      )
                    }
                    className="w-5 h-5 rounded-full border-2 transition-all text-[8px] flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: activeHeads.includes(i) ? head.color : 'transparent',
                      borderColor: head.color,
                      color: activeHeads.includes(i) ? 'white' : head.color,
                    }}
                    title={`${head.label} (Head ${i + 1})`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-sm mb-2">Active Heads</h3>
          <div className="flex flex-wrap gap-2">
            {activeHeadData.length === 0 ? (
              <span className="text-xs text-gray-400 italic">No heads selected — select at least one above</span>
            ) : (
              activeHeadData.map((head, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-[11px] rounded-full font-medium"
                  style={{ backgroundColor: head.color + '20', color: head.color, border: `1px solid ${head.color}40` }}
                >
                  H{activeHeads[idx] + 1}: {head.label}
                </span>
              ))
            )}
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
          {view === 'heatmap' ? (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-3">Attention Heatmap</h3>
                <div className="overflow-x-auto">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1 text-xs text-gray-500">Query ↓ / Key →</th>
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
                          {row.map((val, j) => {
                            const isMasked = useCausal && j > i;
                            return (
                              <td key={j} className="p-0.5">
                                <div
                                  className={`w-10 h-10 rounded flex items-center justify-center text-[10px] font-mono cursor-pointer transition-all ${
                                    isMasked
                                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                      : inspectedCell?.[0] === i && inspectedCell?.[1] === j
                                      ? 'ring-2 ring-amber-400 scale-110'
                                      : inspectedCell
                                      ? 'ring-1 ring-gray-300 dark:ring-gray-600'
                                      : i === selectedToken
                                      ? 'ring-2 ring-blue-400'
                                      : ''
                                  }`}
                                  style={
                                    isMasked
                                      ? undefined
                                      : {
                                          backgroundColor: cellColor(val, activeHeadData.map((h) => h.color), activeHeads.length),
                                          color: val > 0.5 ? 'white' : 'inherit',
                                        }
                                  }
                                  onClick={() =>
                                    isMasked
                                      ? undefined
                                      : setInspectedCell(
                                          inspectedCell?.[0] === i && inspectedCell?.[1] === j ? null : [i, j]
                                        )
                                  }
                                >
                                  {isMasked ? '—' : val.toFixed(2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Rows = Query, Columns = Key. Row {selectedToken} ({TOKENS[selectedToken]}) highlighted.
                  {useCausal && ' Gray cells are masked (GPT-style causal attention).'}
                  Click a cell to inspect.
                </p>
                {inspectedCell && !useCausal || (inspectedCell && !(useCausal && inspectedCell[1] > inspectedCell[0])) ? (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        &quot;{TOKENS[inspectedCell[0]]}&quot; → &quot;{TOKENS[inspectedCell[1]]}&quot;
                      </span>
                      <button
                        onClick={() => setInspectedCell(null)}
                        className="text-amber-600 hover:text-amber-800 dark:text-amber-400 text-xs"
                      >
                        ✕ close
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Attention weight: <strong>{attentionMatrix[inspectedCell[0]][inspectedCell[1]].toFixed(4)}</strong>
                      {!showSoftmax && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">(raw score, pre-softmax)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      Token &quot;{TOKENS[inspectedCell[0]]}&quot; allocates {(
                        attentionMatrix[inspectedCell[0]][inspectedCell[1]] * 100
                      ).toFixed(1)}% of its attention to &quot;{TOKENS[inspectedCell[1]]}&quot;.
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">
                  Attention from &quot;{TOKENS[selectedToken]}&quot;
                </h3>
                {!showSoftmax && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-2">
                    Softmax disabled — showing raw scores (sum = {rawSum.toFixed(2)}, not normalized to 1.0)
                  </p>
                )}
                <div className="space-y-2">
                  {TOKENS.map((token, i) => {
                    const isMasked = useCausal && i > selectedToken;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="font-mono text-sm min-w-[60px]">{token}</span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          {isMasked ? (
                            <div className="h-full flex items-center pl-2 text-[10px] text-gray-400 italic">
                              masked
                            </div>
                          ) : (
                            <div
                              style={{ width: `${currentWeights[i] * 100}%` }}
                              className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-300 ${
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
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <h4 className="font-semibold text-xs mb-1">How Attention Works</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                    Attention(Q, K, V) = softmax(QK<sup>T</sup> / √d<sub>k</sub>)V
                    {useCausal && <span className="ml-2 text-amber-600">+ Mask</span>}
                  </p>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>Query (Q)</strong> — &quot;What am I looking for?&quot;</p>
                    <p><strong>Key (K)</strong> — &quot;What do I contain?&quot;</p>
                    <p><strong>Value (V)</strong> — &quot;What do I give when attended to?&quot;</p>
                    <p><strong>Scaling</strong> — Prevents saturated softmax gradients.</p>
                    {useCausal && (
                      <p className="text-amber-600 dark:text-amber-400">
                        <strong>Mask</strong> — Sets future token scores to −∞ before softmax, preventing information leakage.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-1">Multi-Head Attention</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                    This visualization shows <strong>{activeHeads.length} head{activeHeads.length !== 1 ? 's' : ''}</strong> blended
                    together. Each head learns different relationship types. Toggle heads above to see individual patterns.
                  </p>
                </div>

                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-1">
                    Layer {selectedLayer + 1} of 6
                  </h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                    {selectedLayer === 0 && 'Early layers capture surface-level patterns: positional adjacency, determiner-noun pairs, and local syntax.'}
                    {selectedLayer === 1 && 'Layer 2 begins to capture short-range syntactic relationships: subject-verb agreement and prepositional phrases.'}
                    {selectedLayer === 2 && 'Middle layers blend syntax and semantics. Some heads track long-range dependencies while others remain local.'}
                    {selectedLayer === 3 && 'Layer 4 shifts toward semantic roles: who did what to whom, and where. Syntactic heads become more specialized.'}
                    {selectedLayer === 4 && 'Late layers capture abstract semantic relationships and coreference. Attention patterns become more diffuse.'}
                    {selectedLayer === 5 && 'The final layer produces task-ready representations. Attention is highly distributed, encoding full sentence meaning.'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-sm mb-3">Attention Rollout</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Rollout shows how attention compounds across all 6 layers.
                  Each layer&apos;s output becomes the next layer&apos;s input, so attention &quot;flows&quot; through the network.
                  Residual connections (50% identity) ensure early-layer information persists.
                </p>
                <div className="overflow-x-auto">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1 text-xs text-gray-500">From ↓ / To →</th>
                        {TOKENS.map((t, i) => (
                          <th key={i} className="p-1 text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[50px]">
                            {t}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rolloutMatrix.map((row, i) => (
                        <tr key={i}>
                          <td className={`p-1 text-xs font-mono font-semibold ${
                            i === selectedToken ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {TOKENS[i]}
                          </td>
                          {row.map((val, j) => (
                            <td key={j} className="p-0.5">
                              <div
                                className={`w-10 h-10 rounded flex items-center justify-center text-[10px] font-mono cursor-pointer transition-all ${
                                  i === selectedToken
                                    ? 'ring-2 ring-blue-400'
                                    : ''
                                }`}
                                style={{
                                  backgroundColor: `rgba(16, 185, 129, ${val})`,
                                  color: val > 0.5 ? 'white' : 'inherit',
                                }}
                                onClick={() =>
                                  setInspectedCell(
                                    inspectedCell?.[0] === i && inspectedCell?.[1] === j ? null : [i, j]
                                  )
                                }
                              >
                                {val.toFixed(2)}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Green = cumulative attention after 6 layers. Each cell shows how much a token (row)
                  ultimately depends on another token (column) after all layers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">
                  Rollout from &quot;{TOKENS[selectedToken]}&quot;
                </h3>
                <div className="space-y-2">
                  {TOKENS.map((token, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="font-mono text-sm min-w-[60px]">{token}</span>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${rolloutMatrix[selectedToken][i] * 100}%` }}
                          className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-300 ${
                            rolloutMatrix[selectedToken][i] === Math.max(...rolloutMatrix[selectedToken])
                              ? 'bg-emerald-600'
                              : rolloutMatrix[selectedToken][i] > 0.2
                              ? 'bg-emerald-400'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span className="text-[10px] font-mono text-white font-medium">
                            {(rolloutMatrix[selectedToken][i] * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <h4 className="font-semibold text-xs mb-1">What is Attention Rollout?</h4>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                    <p>In a deep Transformer, attention compounds across layers:</p>
                    <p className="font-mono text-[10px] bg-white dark:bg-gray-800 p-1.5 rounded">
                      A<sub>eff</sub> = 0.5 · A<sub>head</sub> + 0.5 · I
                    </p>
                    <p>
                      <strong>Residual connections</strong> (the 0.5 · I term) ensure each token retains 50% of its
                      own representation, preventing information loss across deep networks.
                    </p>
                    <p className="font-mono text-[10px] bg-white dark:bg-gray-800 p-1.5 rounded">
                      Rollout = A<sub>eff</sub><sup>(6)</sup> × A<sub>eff</sub><sup>(5)</sup> × ... × A<sub>eff</sub><sup>(1)</sup>
                    </p>
                    <p>
                      This matrix shows the <strong>effective influence</strong> each input token has on each
                      output token after passing through all 6 layers.
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-1">Why Rollout Matters</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                    Individual layer attention shows <em>local</em> patterns. Rollout shows <em>global</em> information flow.
                    For example, in &quot;The cat sat on the mat,&quot; the word &quot;mat&quot; might attend to &quot;sat&quot;
                    in layer 3, which attended to &quot;cat&quot; in layer 1 — so &quot;mat&quot; indirectly depends on &quot;cat&quot; through
                    the network. Rollout captures these multi-hop dependencies.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
