'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'qkv' | 'patterns' | 'evolution';

/* ───────── 1. QKV Dot-Product Attention ───────── */

function QKVDemo() {
  const [queryIdx, setQueryIdx] = useState(2);
  const [temperature, setTemperature] = useState(2);
  const numTokens = 6;

  const keys = [
    { x: 0.25, y: 0.75 },
    { x: 0.30, y: 0.70 },
    { x: 0.20, y: 0.80 },
    { x: 0.75, y: 0.25 },
    { x: 0.80, y: 0.20 },
    { x: 0.70, y: 0.30 },
  ];
  const query = keys[queryIdx];

  const scores = keys.map(k => (query.x * k.x + query.y * k.y) / temperature);
  const maxScore = Math.max(...scores.map(Math.abs), 0.01);
  const expSum = scores.reduce((s, v) => s + Math.exp(v), 0);
  const softmax = scores.map(v => Math.exp(v) / expSum);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Dot-Product Attention Mechanics</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Click a token to make it the Query. Its attention to all other tokens (Keys) is computed
        via dot product, scaled by temperature, then normalized with softmax.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <svg width="260" height="220" className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            {keys.map((k, i) => (
              <g key={i}>
                <circle cx={40 + k.x * 180} cy={40 + k.y * 150} r={14}
                  fill={i === queryIdx ? '#3b82f6' : '#e5e7eb'}
                  stroke={i === queryIdx ? '#1d4ed8' : '#9ca3af'}
                  strokeWidth={2}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setQueryIdx(i)}
                />
                <text x={40 + k.x * 180} y={40 + k.y * 150 + 4}
                  textAnchor="middle" fontSize="9"
                  fill={i === queryIdx ? 'white' : '#374151'}>
                  {i}
                </text>
                {i !== queryIdx && (
                  <line x1={40 + query.x * 180} y1={40 + query.y * 150}
                    x2={40 + k.x * 180} y2={40 + k.y * 150}
                    stroke={`rgba(59, 130, 246, ${softmax[i]})`}
                    strokeWidth={softmax[i] * 8}
                    strokeOpacity={0.6}
                  />
                )}
              </g>
            ))}
            <text x="130" y="210" textAnchor="middle" fontSize="9" fill="#9ca3af">Embedding Space</text>
          </svg>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">Temperature: {temperature.toFixed(1)}</label>
              <input type="range" min="0.5" max="5" step="0.5" value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full cursor-pointer" />
              <div className="text-[10px] text-gray-400 mt-0.5">
                Low = sharp, high = smooth distribution
              </div>
            </div>
            <div className="text-xs flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <span>Query token <strong className="text-blue-700 dark:text-blue-300">#{queryIdx}</strong></span>
            </div>
          </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="font-semibold text-xs mb-2">Attention Distribution</h4>
            <div className="flex items-end gap-1 h-24 border-b border-gray-300 dark:border-gray-600 pb-1">
              {softmax.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <motion.div
                    animate={{ height: v * 80 }}
                    className="w-full rounded-t transition-all"
                    style={{ backgroundColor: i === queryIdx ? '#3b82f6' : '#93c5fd' }}>
                  </motion.div>
                  <div className="text-[8px] text-gray-500 mt-0.5">{i}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <span className="text-gray-500">Score(Q,K): </span>
              <span className="font-mono">{scores[queryIdx].toFixed(2)}</span>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <span className="text-gray-500">Max score: </span>
              <span className="font-mono">{maxScore.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <span className="text-gray-500">Entropy: </span>
              <span className="font-mono">
                {(-softmax.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 2. Attention Patterns ───────── */

function AttentionPatterns() {
  const [pattern, setPattern] = useState<'local' | 'dilated' | 'global' | 'strided'>('local');
  const [kernelSize, setKernelSize] = useState(3);
  const gridSize = 9;
  const cellSz = 28;

  const getAttended = (idx: number): number[] => {
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    switch (pattern) {
      case 'local': {
        const half = Math.floor(kernelSize / 2);
        const out: number[] = [];
        for (let dr = -half; dr <= half; dr++)
          for (let dc = -half; dc <= half; dc++) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize)
              out.push(nr * gridSize + nc);
          }
        return out;
      }
      case 'dilated': {
        const out: number[] = [];
        const d = Math.max(1, kernelSize - 1);
        for (let dr = -d; dr <= d; dr += d > 1 ? d - 1 : 1)
          for (let dc = -d; dc <= d; dc += d > 1 ? d - 1 : 1) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize)
              out.push(nr * gridSize + nc);
          }
        return out;
      }
      case 'global': return Array.from({ length: gridSize * gridSize }, (_, i) => i);
      case 'strided': {
        const step = Math.max(2, kernelSize);
        const out: number[] = [idx];
        for (let i = row; i < gridSize; i += step)
          for (let j = col; j < gridSize; j += step)
            if (i !== row || j !== col) out.push(i * gridSize + j);
        return out;
      }
    }
  };

  const [selected, setSelected] = useState(gridSize * 4 + 4);
  const attended = getAttended(selected);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Attention Patterns</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Different attention mechanisms define different receptive fields. Click a patch to see
        which tokens it attends to.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-center mb-1">
            <div className="w-3" />
            {Array.from({ length: gridSize }).map((_, j) => (
              <div key={j} className="text-[7px] text-gray-400 text-center" style={{ width: cellSz }}>{j}</div>
            ))}
          </div>
          {Array.from({ length: gridSize }).map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="text-[7px] text-gray-400 w-3">{i}</div>
              {Array.from({ length: gridSize }).map((_, j) => {
                const idx = i * gridSize + j;
                const isAttended = attended.includes(idx);
                const isSelected = idx === selected;
                return (
                  <button key={`${i}-${j}`}
                    onClick={() => setSelected(idx)}
                    className="border border-gray-200 dark:border-gray-700 transition-all"
                    style={{ width: cellSz, height: cellSz }}>
                    <div className="w-full h-full"
                      style={{
                        backgroundColor: isSelected ? '#3b82f6' :
                          isAttended ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                      }} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['local', 'dilated', 'global', 'strided'] as const).map(p => (
              <button key={p} onClick={() => setPattern(p)}
                className={`px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${
                  pattern === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {pattern !== 'global' && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">Kernel/Step Size: {kernelSize}</label>
              <input type="range" min="2" max="6" step="1" value={kernelSize}
                onChange={e => setKernelSize(parseInt(e.target.value))} className="w-full cursor-pointer" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
              <h4 className="font-semibold mb-1">{pattern}</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                {pattern === 'local' && `Each token attends to a ${kernelSize}×${kernelSize} local window. Like CNN convolution.`}
                {pattern === 'dilated' && `Attends to tokens at regular intervals, expanding receptive field without increasing parameters.`}
                {pattern === 'global' && `Each token attends to ALL other tokens. Maximum context but O(n²) cost. Used in ViT.`}
                {pattern === 'strided' && `Skips every ${Math.max(2, kernelSize)}-th token. Reduces computational cost like strided convolution.`}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <h4 className="font-semibold mb-1">Stats</h4>
              <div className="text-gray-700 dark:text-gray-300 text-[11px] space-y-0.5">
                <div>Attended tokens: <strong>{attended.length}</strong></div>
                <div>Total tokens: <strong>{gridSize * gridSize}</strong></div>
                <div>Sparsity: <strong>{(100 - (attended.length / (gridSize * gridSize)) * 100).toFixed(1)}%</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 3. Evolution of Attention ───────── */

const ATTENTION_MILESTONES = [
  { name: 'SE-Net', year: '2017', venue: 'ILSVRC 2017 Winner', params: '+2%', gain: '~2-3%',
    idea: 'Channel-wise attention via squeeze-and-excitation. GAP → FC → ReLU → FC → Sigmoid → Scale.',
    impact: 'Won ILSVRC 2017 with minimal overhead. Became a standard building block in many architectures.' },
  { name: 'Non-local', year: '2017', venue: 'NeurIPS 2017', params: '+5-10%', gain: '~1-2%',
    idea: 'Computes response at a position as weighted sum of features at all positions. The first self-attention for vision.',
    impact: 'Brought self-attention to video understanding and image recognition. Precursor to ViT.' },
  { name: 'CBAM', year: '2018', venue: 'ECCV 2018', params: '+3%', gain: '~2-3%',
    idea: 'Channel attention + Spatial attention sequentially. Uses both max and average pooling.',
    impact: 'Spatial attention branch was novel. Simple and effective plug-in module.' },
  { name: 'BAM', year: '2018', venue: 'BMVC 2018', params: '+5%', gain: '~2%',
    idea: 'Channel and spatial attention in parallel (not sequential like CBAM). Attention is 3D: channel × spatial.',
    impact: 'Showed parallel attention branches also effective.' },
  { name: 'SENet++', year: '2019', venue: 'arXiv', params: '+3%', gain: '~3-4%',
    idea: 'Replaces GAP with spatial attention-weighted pooling. Combines SE with spatial context.',
    impact: 'Incremental improvement showing GAP replacement can help.' },
  { name: 'ECA-Net', year: '2020', venue: 'CVPR 2020', params: '+0.5%', gain: '~2%',
    idea: '1D convolution over pooled features instead of FC layers. Kernel size determines local cross-channel interaction.',
    impact: 'Showed that dimensionality reduction (in SE) is unnecessary. Extremely lightweight.' },
  { name: 'Coordinate', year: '2021', venue: 'CVPR 2021', params: '+1%', gain: '~2%',
    idea: 'CA embeds positional information into channel attention via 1D horizontal/vertical pooling + concatenation.',
    impact: 'Brought position awareness to attention modules. Used in MobileNetV3.' },
  { name: 'MHA (ViT)', year: '2020', venue: 'ICLR 2021', params: '~100%', gain: '~5-10%',
    idea: 'Multi-head self-attention replaces convolution entirely. Tokens = patches, QKV computed per head.',
    impact: 'Paradigm shift: Transformer-based vision. Inspired DeiT, Swin, MAE, and the modern vision landscape.' },
];

function AttentionEvolution() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Evolution of Attention in CV</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        From lightweight channel recalibration to full Transformer architectures — attention
        mechanisms have fundamentally changed how vision networks process information.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {ATTENTION_MILESTONES.map((v, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-1 p-2 text-xs rounded-t cursor-pointer text-center transition-all border-b-2 whitespace-nowrap ${
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
            <h4 className="font-semibold text-lg">{ATTENTION_MILESTONES[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{ATTENTION_MILESTONES[selected].year} &middot; {ATTENTION_MILESTONES[selected].venue}</span>
          </div>
          <div className="flex gap-3 text-xs ml-4">
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Params ↑</div>
              <div className="text-gray-600 dark:text-gray-400">{ATTENTION_MILESTONES[selected].params}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Gain</div>
              <div className="text-gray-600 dark:text-gray-400">{ATTENTION_MILESTONES[selected].gain}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
          {ATTENTION_MILESTONES[selected].idea}
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-800 text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Impact:</span>
          <span className="text-gray-700 dark:text-gray-300 ml-1">{ATTENTION_MILESTONES[selected].impact}</span>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {ATTENTION_MILESTONES.map((v, i) => (
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

export default function AttentionAdvancedDive() {
  const [section, setSection] = useState<Section>('qkv');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'qkv', label: 'QKV Mechanics', icon: '⚡' },
    { id: 'patterns', label: 'Attention Patterns', icon: '🔲' },
    { id: 'evolution', label: 'Evolution', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Attention Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how attention mechanisms work — from the core QKV dot-product operation
          to different attention patterns and the evolution of CV attention modules.
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t cursor-pointer whitespace-nowrap transition-colors ${
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
          {section === 'qkv' && <QKVDemo />}
          {section === 'patterns' && <AttentionPatterns />}
          {section === 'evolution' && <AttentionEvolution />}
        </motion.div>
      </div>
    </div>
  );
}
