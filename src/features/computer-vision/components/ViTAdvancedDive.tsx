'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'attention' | 'position' | 'variants';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ───────── 1. Self-Attention Explorer ───────── */

function AttentionExplorer() {
  const [queryIdx, setQueryIdx] = useState(6);
  const [numHeads, setNumHeads] = useState(4);
  const gridSize = 8;
  const totalTokens = gridSize * gridSize + 1;
  const cellSize = 32;

  const qkScores = Array.from({ length: totalTokens }, (_, i) =>
    Array.from({ length: totalTokens }, (_, j) =>
      round2(seededRandom(i * 127 + j * 31 + numHeads * 53) * 0.8 + 0.2)
    )
  );

  const attnWeights = qkScores[queryIdx];

  const maxW = Math.max(...attnWeights, 0.01);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Self-Attention Explorer</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Click a patch token (or the [CLS] token) to see its attention weights to all other tokens.
        Each row of the attention matrix shows how much a query attends to each key.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: gridSize }).map((_, j) => (
              <div key={j} className="text-[8px] text-gray-400 text-center" style={{ width: cellSize }}>
                {j}
              </div>
            ))}
            <div className="text-[8px] text-gray-400 text-center ml-1" style={{ width: cellSize }}>
              CLS
            </div>
          </div>
          {Array.from({ length: gridSize }).map((_, i) => (
            <div key={i} className="flex items-center gap-1 mb-1">
              <div className="text-[8px] text-gray-400 w-3">{i}</div>
              {Array.from({ length: gridSize }).map((_, j) => {
                const idx = i * gridSize + j;
                const w = attnWeights[idx] / maxW;
                return (
                  <button key={`${i}-${j}`}
                    onClick={() => setQueryIdx(idx)}
                    className={`rounded transition-all border ${queryIdx === idx ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700' : 'border-gray-200 dark:border-gray-600'}`}
                    style={{ width: cellSize, height: cellSize }}>
                    <div className="w-full h-full rounded"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${0.15 + w * 0.85})` }} />
                  </button>
                );
              })}
            </div>
          ))}
          <div className="flex items-center gap-1 mt-1">
            <div className="text-[8px] text-gray-400 w-3" />
            <button onClick={() => setQueryIdx(totalTokens - 1)}
              className={`rounded transition-all border ${queryIdx === totalTokens - 1 ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700' : 'border-gray-200 dark:border-gray-600'}`}
              style={{ width: cellSize, height: cellSize }}>
              <div className="w-full h-full rounded bg-purple-200 dark:bg-purple-800" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
            <h4 className="font-semibold text-sm mb-2">
              Query Token: {queryIdx === totalTokens - 1 ? '[CLS]' : `Patch #${queryIdx} (row ${Math.floor(queryIdx / gridSize)}, col ${queryIdx % gridSize})`}
            </h4>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Heads:</span>
                <select value={numHeads} onChange={e => setNumHeads(parseInt(e.target.value))}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs">
                  {[1, 2, 4, 8].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Attention weights (softmax) — darker = higher weight
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {attnWeights.map((w, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="rounded-t"
                    style={{ width: 12, height: 20 + w * 40,
                      backgroundColor: w > 0.7 ? '#3b82f6' : w > 0.4 ? '#93c5fd' : '#e5e7eb' }} />
                  <div className="text-[6px] text-gray-400 mt-0.5">{round2(w)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
              <h4 className="font-semibold mb-1">QKV Computation</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                For each token, ViT computes Query (Q), Key (K), and Value (V) vectors.
                Attention = softmax(QK^T / √d) × V, where d is the head dimension.
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400 text-xs">
              <h4 className="font-semibold mb-1">Multi-Head Attention</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                With {numHeads} heads, each head learns different attention patterns (e.g., local vs global).
                Final output is a concatenation of all head outputs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 2. Position Encoding Visualizer ───────── */

function PositionEncoding() {
  const [freq, setFreq] = useState(6);
  const [dim, setDim] = useState(0);
  const numPatches = 196;
  const dModel = 768;

  const positions = Array.from({ length: numPatches }, (_, pos) => {
    const omega = 1 / Math.pow(10000, (2 * dim) / dModel);
    return Math.sin(pos * omega * (freq / 6));
  });

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Position Encoding</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        ViT uses 1D learnable position embeddings (summed with patch embeddings). This is a
        visualization of the original sinusoidal encoding inspired by the original Transformer.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-sm mb-2">Sinusoidal Encoding (dim={dim})</h4>
            <svg width="100%" height="140" viewBox="0 0 700 140" className="overflow-visible">
              {positions.map((val, pos) => (
                <rect key={pos}
                  x={(pos / numPatches) * 690 + 5}
                  y={70 - val * 60}
                  width={Math.max(2, 690 / numPatches)}
                  height={Math.max(2, val * 120)}
                  fill={val > 0 ? '#3b82f6' : '#ef4444'}
                  opacity={0.8}
                />
              ))}
              <line x1="5" y1="70" x2="695" y2="70" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="5" y="20" fontSize="9" fill="#6b7280">+1</text>
              <text x="5" y="130" fontSize="9" fill="#6b7280">-1</text>
              <text x="350" y="135" fontSize="9" fill="#6b7280" textAnchor="middle">Patch Position</text>
            </svg>
            <div className="text-[10px] text-gray-400 text-center">
              PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">Frequency: {freq.toFixed(1)}</label>
              <input type="range" min="0.5" max="20" step="0.5" value={freq}
                onChange={e => setFreq(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">Dimension: {dim}</label>
              <input type="range" min="0" max="dModel" step="2" value={dim}
                onChange={e => setDim(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-full lg:w-64 space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
            <h4 className="font-semibold mb-1">Why Position Encoding?</h4>
            <p className="text-gray-700 dark:text-gray-300 text-[11px]">
              Self-attention is permutation-invariant — without position information,
              &ldquo;dog chases cat&rdquo; and &ldquo;cat chases dog&rdquo; look identical.
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400 text-xs">
            <h4 className="font-semibold mb-1">Frequency Roll-off</h4>
            <p className="text-gray-700 dark:text-gray-300 text-[11px]">
              Low dimensions encode fine-grained absolute positions (high frequency).
              High dimensions encode coarse relative positions (low frequency).
              Try increasing the dimension slider!
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <h4 className="font-semibold mb-1">Learnable vs Sinusoidal</h4>
            <p className="text-gray-700 dark:text-gray-300 text-[11px]">
              ViT uses learnable position embeddings (trained with the rest of the model) rather
              than fixed sinusoidal encodings, giving more flexibility for the task.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 3. Architecture Variants ───────── */

const VIT_VARIANTS = [
  { name: 'ViT-B/16', year: '2020', params: '86M', imgNet: '77.9%', idea: 'Base variant: 12 layers, 12 heads, hidden 768. Patches of 16×16. The original ViT that established the paradigm.',
    highlight: 'First to show pure Transformer can match CNNs on ImageNet.' },
  { name: 'ViT-L/16', year: '2020', params: '307M', imgNet: '76.5%', idea: 'Large variant: 24 layers, 16 heads, hidden 1024. Shows scaling behavior — better with more pre-training data.',
    highlight: 'Performance improves dramatically with JFT-300M pre-training.' },
  { name: 'ViT-H/14', year: '2020', params: '632M', imgNet: '88.55%', idea: 'Huge variant: 32 layers, 16 heads, hidden 1280. Smaller 14×14 patches = more tokens. Best accuracy.',
    highlight: 'Achieved SOTA on ImageNet with less training compute than Big Transfer.' },
  { name: 'DeiT', year: '2021', params: '86M', imgNet: '83.1%', idea: 'Data-efficient ViT. Introduces a teacher-student distillation strategy with attention-based distillation token.',
    highlight: 'Matches ViT accuracy without requiring external pretraining data (JFT-300M).' },
  { name: 'Swin-T', year: '2021', params: '29M', imgNet: '81.3%', idea: 'Hierarchical Transformer using shifted windows. Computes attention within local windows, then shifts them across layers.',
    highlight: 'Brings hierarchical feature maps (like CNN) to ViT — better for detection/segmentation.' },
  { name: 'MAE', year: '2021', params: '632M', imgNet: '87.8%', idea: 'Masked Autoencoder. Randomly mask 75% of patches and reconstruct. Very efficient pre-training.',
    highlight: 'Shows that masking is a powerful self-supervised learning signal for vision.' },
  { name: 'CvT', year: '2021', params: '20M', imgNet: '82.5%', idea: 'Convolutional ViT. Introduces convolutional token embedding and convolutional projection in attention blocks.',
    highlight: 'Combines CNN inductive bias with Transformer expressiveness.' },
];

function ViTVariants() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Architecture Variants</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Since the original ViT paper, many variants have improved upon the architecture — addressing
        data efficiency, hierarchical representations, and self-supervised learning.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {VIT_VARIANTS.map((v, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-1 p-2 text-xs rounded-t text-center transition-all border-b-2 whitespace-nowrap ${
              selected === i
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 font-semibold text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <div>{v.name}</div>
            <div className="text-[10px] opacity-75">{v.year}</div>
          </button>
        ))}
      </div>

      <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{VIT_VARIANTS[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{VIT_VARIANTS[selected].year}</span>
          </div>
          <div className="flex gap-4 text-xs ml-4">
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Params</div>
              <div className="text-gray-600 dark:text-gray-400">{VIT_VARIANTS[selected].params}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">ImageNet</div>
              <div className="text-gray-600 dark:text-gray-400">{VIT_VARIANTS[selected].imgNet}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
          {VIT_VARIANTS[selected].idea}
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Key Insight:</span>
          <span className="text-gray-700 dark:text-gray-300 ml-1">{VIT_VARIANTS[selected].highlight}</span>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {VIT_VARIANTS.map((v, i) => (
          <div key={i} className={`flex-1 text-center ${i <= selected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {i > 0 && <span className="mx-1">{'—'}</span>}
            <span className={i <= selected ? 'font-semibold' : ''}>{v.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Main Component ───────── */

export default function ViTAdvancedDive() {
  const [section, setSection] = useState<Section>('attention');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'attention', label: 'Attention Explorer', icon: '🔍' },
    { id: 'position', label: 'Position Encoding', icon: '📐' },
    { id: 'variants', label: 'Variants', icon: '🧬' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">ViT Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how Vision Transformers work under the hood — from self-attention and
          position encoding to the evolution of architecture variants.
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t whitespace-nowrap transition-colors ${
                section === s.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === 'attention' && <AttentionExplorer />}
          {section === 'position' && <PositionEncoding />}
          {section === 'variants' && <ViTVariants />}
        </motion.div>
      </div>
    </div>
  );
}
