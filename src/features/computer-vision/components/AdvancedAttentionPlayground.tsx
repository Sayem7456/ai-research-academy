'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'se' | 'cbam' | 'self-attention' | 'qkv' | 'patterns' | 'evolution' | 'mha' | 'gqa' | 'sparse' | 'flash' | 'cross' | 'window';

/* ═══════════════════════════════════════════════════════════
   1. Multi-Head Self-Attention Explorer
   ═══════════════════════════════════════════════════════════ */

function MultiHeadExplorer() {
  const [numHeads, setNumHeads] = useState(4);
  const [selectedHead, setSelectedHead] = useState(0);
  const [seqLen, setSeqLen] = useState(6);
  const [showConcat, setShowConcat] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const [seed, setSeed] = useState(42);

  const headPatterns = useMemo(() => {
    return Array.from({ length: numHeads }, (_, h) =>
      Array.from({ length: seqLen }, (_, i) => {
        const raw = Array.from({ length: seqLen }, (_, j) => {
          const localBias = Math.abs(i - j) < 2 ? 0.3 : 0;
          const headBias = Math.sin((h + 1) * 0.5 + i * 0.3) * 0.2;
          const noise = seededRandom(i * 13 + j * 7 + h * 31 + seed) * 0.4;
          return localBias + headBias + noise;
        });
        const max = Math.max(...raw);
        const exps = raw.map(v => Math.exp(v - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
      })
    );
  }, [numHeads, seqLen, seed]);

  const concatWeights = useMemo(() => {
    if (!showConcat) return null;
    return Array.from({ length: seqLen }, (_, i) =>
      Array.from({ length: seqLen }, (_, j) => {
        let sum = 0;
        for (let h = 0; h < numHeads; h++) sum += headPatterns[h][i][j];
        return sum / numHeads;
      })
    );
  }, [headPatterns, numHeads, seqLen, showConcat]);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Multi-Head Self-Attention</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The core attention mechanism in Transformers. Multiple heads learn different attention
        patterns simultaneously, then outputs are concatenated and projected.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">General Vision Tasks</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Classification, detection, segmentation. Multi-head captures diverse patterns (edges, textures, shapes) simultaneously.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Long Sequences</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            O(n²) complexity makes it impractical for {`>`}1K tokens. 4K image patches = 16M attention pairs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="font-semibold text-sm">Configuration</h4>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Heads: <span className="text-blue-600 dark:text-blue-400">{numHeads}</span>
              </label>
              <input type="range" min="1" max="8" step="1" value={numHeads}
                onChange={e => { setNumHeads(parseInt(e.target.value)); setSelectedHead(0); }}
                className="w-full cursor-pointer" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>d_head = {Math.round(768 / numHeads)}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Seq Len: <span className="text-blue-600 dark:text-blue-400">{seqLen}</span>
              </label>
              <input type="range" min="4" max="12" step="1" value={seqLen}
                onChange={e => setSeqLen(parseInt(e.target.value))}
                className="w-full cursor-pointer" />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={showConcat}
                onChange={e => setShowConcat(e.target.checked)} className="cursor-pointer" />
              Show concatenated output
            </label>
            <button onClick={() => { setSeed(s => s + 1); setSelectedHead(0); }}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer w-full">
              ↻ New Patterns
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-2">Pipeline</h4>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-mono space-y-1">
              <div>Input X → Linear → Q, K, V</div>
              <div className="text-blue-600 dark:text-blue-400">Split into {numHeads} heads (d_k = {Math.round(768/numHeads)})</div>
              <div className="text-purple-600 dark:text-purple-400">Attn(Q,K,V) = softmax(QK^T/√d_k)V</div>
              <div className="text-green-600 dark:text-green-400">Concat → Linear → Output</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: numHeads }, (_, h) => (
              <button key={h} onClick={() => setSelectedHead(h)}
                className={`px-3 py-1 text-xs rounded cursor-pointer transition-all ${
                  selectedHead === h
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                H{h + 1}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">
              Head {selectedHead + 1} Attention
              <span className="text-gray-400 font-normal ml-2">(d_k = {Math.round(768/numHeads)})</span>
            </h4>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-[2px] mb-[2px]">
                <div className="w-5" />
                {Array.from({ length: seqLen }, (_, j) => (
                  <div key={j} className="w-7 text-center text-[7px] text-gray-400">K{j}</div>
                ))}
              </div>
              {Array.from({ length: seqLen }, (_, i) => (
                <div key={i} className="flex items-center gap-[2px] mb-[2px]">
                  <div className="w-5 text-[7px] text-gray-400 text-right pr-1">Q{i}</div>
                  {Array.from({ length: seqLen }, (_, j) => (
                    <div key={j}
                      className="w-7 h-7 rounded cursor-pointer transition-all hover:scale-110 flex items-center justify-center text-[8px]"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${headPatterns[selectedHead][i][j]})` }}
                      title={`Q{i}→K${j}: ${headPatterns[selectedHead][i][j].toFixed(3)}`}>
                      {headPatterns[selectedHead][i][j] > 0.3 && (
                        <span className="text-white font-bold">{headPatterns[selectedHead][i][j].toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">All {numHeads} Heads</h4>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(numHeads, 4)}, 1fr)` }}>
              {Array.from({ length: numHeads }, (_, h) => (
                <div key={h} className={`text-center p-2 rounded-lg cursor-pointer transition-all ${
                  h === selectedHead ? 'bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-400' : ''
                }`} onClick={() => setSelectedHead(h)}>
                  <div className="text-[8px] text-gray-400 mb-1">H{h + 1}</div>
                  <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${seqLen}, 1fr)` }}>
                    {headPatterns[h].flat().map((v, i) => (
                      <div key={i} className="aspect-square rounded-[1px]"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${v})` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showConcat && concatWeights && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-xs mb-3">Concatenated Output</h4>
              <div className="flex justify-center">
                <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${seqLen}, 1fr)` }}>
                  {concatWeights.flat().map((v, i) => (
                    <div key={i} className="w-7 h-7 rounded"
                      style={{ backgroundColor: `rgba(16, 185, 129, ${v})` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 flex items-center justify-between cursor-pointer hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 transition-all">
          <span className="font-semibold text-sm">Learn Multi-Head Attention</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Tab selector */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
                        <h4 className="font-semibold text-sm mb-2">🏥 Hospital Analogy</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine a patient walks into a hospital. Instead of one doctor doing everything,
                          <strong> {numHeads} specialists</strong> each examine different aspects:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Array.from({ length: numHeads }, (_, i) => (
                            <div key={i} className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg text-[10px] min-w-[48px]">
                              <div className="text-lg mb-1">{['👁️', '🫁', '❤️', '🧠', '🦴', '🩸', '🦷', '🫀'][i % 8]}</div>
                              <div className="font-medium">Head {i + 1}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          Each specialist (head) looks at the <strong>same patient</strong> (input) but focuses on
                          <strong> different symptoms</strong> (attention patterns). Finally, all findings are
                          <strong> combined into a diagnosis</strong> (concatenated output).
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                        <strong>Why multiple heads?</strong> A single attention head might only capture one type of
                        relationship (e.g., syntax). Multiple heads can simultaneously capture syntax, semantics,
                        position, and other patterns — just like how multiple specialists catch different issues.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Input Projection', desc: 'The input matrix X (seq_len × d_model) is multiplied by 3 weight matrices to create Query (Q), Key (K), and Value (V).', formula: 'Q = X·W_Q, K = X·W_K, V = X·W_V' },
                          { step: 2, title: 'Split into Heads', desc: 'Q, K, V are reshaped from (seq_len × d_model) into (num_heads × seq_len × d_head), where d_head = d_model / num_heads.', formula: 'Shape: (N, T, D) → (N, H, T, D/H)' },
                          { step: 3, title: 'Scaled Dot-Product', desc: 'Each head computes attention independently: multiply Q by K^T, scale by sqrt(d_head), apply softmax, multiply by V.', formula: 'Attn(Q,K,V) = softmax(QK^T / √d_k) · V' },
                          { step: 4, title: 'Concatenate + Project', desc: 'All head outputs are concatenated back to (seq_len × d_model) and passed through a final linear layer W_O.', formula: 'Output = Concat(heads) · W_O' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Using PyTorch's built-in MultiheadAttention</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

# Create multi-head attention layer
mha = nn.MultiheadAttention(
    embed_dim=768,   # d_model
    num_heads=12,    # number of attention heads
    batch_first=True # input shape: (batch, seq, embed)
)

# Input: batch_size=2, seq_len=10, embed_dim=768
x = torch.randn(2, 10, 768)

# Self-attention: Q=K=V=x
attn_output, attn_weights = mha(x, x, x)

print(attn_output.shape)  # (2, 10, 768)
print(attn_weights.shape) # (2, 12, 10, 10)

# Cross-attention: Q from decoder, K/V from encoder
encoder_out = torch.randn(2, 20, 768)  # longer sequence
cross_out, _ = mha(
    query=x,        # (2, 10, 768) - decoder
    key=encoder_out, # (2, 20, 768) - encoder
    value=encoder_out # (2, 20, 768) - encoder
)
print(cross_out.shape)  # (2, 10, 768)`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Multi-Head Attention from scratch — no nn.MultiheadAttention</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model=768, num_heads=12):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_head = d_model // num_heads

        # Linear projections for Q, K, V
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x):
        B, T, _ = x.shape

        # Step 1: Project to Q, K, V
        Q = self.W_q(x)  # (B, T, d_model)
        K = self.W_k(x)
        V = self.W_v(x)

        # Step 2: Split into heads
        # (B, T, d_model) → (B, num_heads, T, d_head)
        Q = Q.view(B, T, self.num_heads, self.d_head).transpose(1, 2)
        K = K.view(B, T, self.num_heads, self.d_head).transpose(1, 2)
        V = V.view(B, T, self.num_heads, self.d_head).transpose(1, 2)

        # Step 3: Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1))
        scores = scores / math.sqrt(self.d_head)
        attn = torch.softmax(scores, dim=-1)
        context = torch.matmul(attn, V)  # (B, H, T, d_head)

        # Step 4: Concatenate heads
        context = context.transpose(1, 2).contiguous()
        context = context.view(B, T, self.d_model)  # (B, T, d_model)

        # Step 5: Output projection
        return self.W_o(context)

# Usage
mha = MultiHeadAttention(d_model=768, num_heads=12)
x = torch.randn(2, 10, 768)
out = mha(x)
print(out.shape)  # (2, 10, 768)`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. Grouped Query Attention (GQA)
   ═══════════════════════════════════════════════════════════ */

function GroupedQueryAttention() {
  const [numQ, setNumQ] = useState(8);
  const [numKV, setNumKV] = useState(2);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const headsPerGroup = numQ / numKV;

  const groupColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-lime-500',
  ];

  const kvCachePerHead = 256;
  const mhaCache = numQ * kvCachePerHead * 2;
  const gqaCache = numKV * kvCachePerHead * 2;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Grouped Query Attention (GQA)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Used in LLaMA 2/3, Mistral, and Gemma. Multiple query heads share the same KV heads,
        reducing KV cache memory while maintaining quality.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Autoregressive Generation</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            LLMs (ChatGPT, LLaMA) during text generation. KV cache reduced 4-8x, enabling longer context windows.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Short Sequences / Training</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Short sequences or batch training. KV sharing limits expressiveness; no memory benefit without caching.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="font-semibold text-sm">Configuration</h4>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Query Heads: <span className="text-blue-600 dark:text-blue-400">{numQ}</span>
              </label>
              <input type="range" min="2" max="16" step="2" value={numQ}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  setNumQ(v);
                  if (numKV > v) setNumKV(Math.max(1, Math.floor(v / 2)));
                }}
                className="w-full cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                KV Heads: <span className="text-emerald-600 dark:text-emerald-400">{numKV}</span>
              </label>
              <input type="range" min="1" max={numQ} step="1" value={numKV}
                onChange={e => setNumKV(parseInt(e.target.value))}
                className="w-full cursor-pointer" />
              <div className="text-[10px] text-gray-400 mt-1">
                {headsPerGroup} query heads share each KV head
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-3">KV Cache Savings</h4>
            <div className="text-[10px] text-gray-400 mb-3">Assuming seq_len=256, fp16 (2 bytes per value)</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>MHA ({numQ} KV heads)</span>
                  <span className="font-mono text-rose-500">{mhaCache} MB</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>GQA ({numKV} KV heads)</span>
                  <span className="font-mono text-emerald-500">{gqaCache} MB</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(gqaCache / mhaCache) * 100}%` }} />
                </div>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                {((1 - gqaCache / mhaCache) * 100).toFixed(0)}% memory reduction with GQA
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
            <h4 className="font-semibold mb-1">Special Cases</h4>
            <div className="text-gray-700 dark:text-gray-300 space-y-1">
              <div>• <strong>MHA:</strong> numKV = numQ (standard multi-head)</div>
              <div>• <strong>GQA:</strong> 1 &lt; numKV &lt; numQ (grouped)</div>
              <div>• <strong>MQA:</strong> numKV = 1 (multi-query, extreme sharing)</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">Head Assignment Map</h4>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-gray-400 mb-1">Query Heads ({numQ})</div>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: numQ }, (_, q) => {
                    const group = Math.floor(q / headsPerGroup);
                    return (
                      <div key={q}
                        className={`w-9 h-9 rounded-lg cursor-pointer flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                          group === selectedGroup ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-90'
                        } ${groupColors[group % groupColors.length]}`}
                        onClick={() => setSelectedGroup(group)}>
                        Q{q}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center text-gray-400 text-lg">↓ share KV</div>

              <div>
                <div className="text-[10px] text-gray-400 mb-1">KV Heads ({numKV})</div>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: numKV }, (_, kv) => (
                    <div key={kv}
                      className={`w-12 h-10 rounded-lg cursor-pointer flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                        kv === selectedGroup ? 'ring-2 ring-offset-1 ring-emerald-500 scale-110' : 'opacity-70 hover:opacity-90'
                      } ${groupColors[kv % groupColors.length]}`}
                      onClick={() => setSelectedGroup(kv)}>
                      KV{kv}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-l-4 ${
            groupColors[selectedGroup % groupColors.length].replace('bg-', 'border-')
          } bg-blue-50 dark:bg-blue-950/30`}>
            <h4 className="font-semibold text-sm mb-2">
              Group {selectedGroup + 1}
            </h4>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              Query heads <strong>{selectedGroup * headsPerGroup + 1}–{(selectedGroup + 1) * headsPerGroup}</strong> all
              share <strong>KV Head {selectedGroup}</strong>. This means they attend to the same
              key-value representations, trading some expressiveness for significant memory savings.
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <h4 className="font-semibold mb-1">Used In</h4>
            <div className="text-gray-700 dark:text-gray-300 space-y-1">
              <div>• LLaMA 2 (32Q / 8KV)</div>
              <div>• LLaMA 3 (64Q / 8KV)</div>
              <div>• Mistral (32Q / 8KV)</div>
              <div>• Gemma 2 (16Q / 8KV)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 flex items-center justify-between cursor-pointer hover:from-emerald-100 hover:to-blue-100 dark:hover:from-emerald-950/50 dark:hover:to-blue-950/50 transition-all">
          <span className="font-semibold text-sm">Learn Grouped Query Attention</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Tab selector */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
                        <h4 className="font-semibold text-sm mb-2">🏢 Company Analogy</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine a company with <strong>{numQ} managers</strong> (query heads) who each need to
                          communicate with international clients. Instead of hiring {numQ} separate translators,
                          they <strong>share {numKV} translators</strong> (KV heads):
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                            <div className="text-[10px] text-gray-400 mb-1">Managers (Q heads)</div>
                            <div className="flex flex-wrap justify-center gap-1">
                              {Array.from({ length: numQ }, (_, i) => (
                                <div key={i} className={`w-6 h-6 rounded text-white text-[8px] flex items-center justify-center ${groupColors[Math.floor(i / headsPerGroup) % groupColors.length]}`}>
                                  M{i + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-center">
                            <div className="text-[10px] text-gray-400 mb-1">Translators (KV heads)</div>
                            <div className="flex flex-wrap justify-center gap-1">
                              {Array.from({ length: numKV }, (_, i) => (
                                <div key={i} className={`w-8 h-7 rounded text-white text-[9px] flex items-center justify-center font-bold ${groupColors[i % groupColors.length]}`}>
                                  T{i + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {numQ > numKV
                            ? <>Managers 1–{headsPerGroup} share Translator 1, managers {headsPerGroup + 1}–{numQ} share Translator 2. The company saves <strong>{((1 - numKV / numQ) * 100).toFixed(0)}% on translation costs</strong> while still getting work done!</>
                            : <>With {numQ} managers and {numKV} translators, each manager has their own translator — standard multi-head attention with no sharing.</>
                          }
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                        <strong>Why GQA?</strong> In autoregressive generation (like ChatGPT), the KV cache grows
                        linearly with number of heads. GQA reduces this by sharing KV heads, cutting memory usage
                        by up to 8x with minimal quality loss.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Same as MHA', desc: 'Input is projected to Q, K, V using learned weight matrices. The key difference is in step 2.', formula: 'Q = X·W_Q, K = X·W_K, V = X·W_V' },
                          { step: 2, title: 'Group Query Heads', desc: `With ${numQ} query heads and ${numKV} KV heads, every ${headsPerGroup} query heads share the same K and V.`, formula: `Q shape: (${numQ}, T, d_head), KV shape: (${numKV}, T, d_head)` },
                          { step: 3, title: 'Repeat KV for Groups', desc: 'Before attention, KV tensors are repeated so each query head in a group gets its own copy of the shared KV.', formula: `K repeated ${headsPerGroup}x → (${numQ}, T, d_head)` },
                          { step: 4, title: 'Standard Attention', desc: 'Now standard scaled dot-product attention proceeds. The computation is identical to MHA, but KV was computed fewer times.', formula: 'Attn(Q, K_repeated, V_repeated)' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
                        <strong>Memory Formula:</strong> KV Cache = 2 × num_kv_heads × d_head × seq_len × batch_size × precision_bytes
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">GQA by repeating KV (simulates shared KV heads)</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

class GroupedQueryAttention(nn.Module):
    def __init__(self, d_model=768, num_q_heads=8, num_kv_heads=2):
        super().__init__()
        self.num_q_heads = num_q_heads
        self.num_kv_heads = num_kv_heads
        self.num_groups = num_q_heads // num_kv_heads
        self.d_head = d_model // num_q_heads

        self.W_q = nn.Linear(d_model, num_q_heads * self.d_head)
        self.W_k = nn.Linear(d_model, num_kv_heads * self.d_head)
        self.W_v = nn.Linear(d_model, num_kv_heads * self.d_head)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x):
        B, T, _ = x.shape

        Q = self.W_q(x).view(B, T, self.num_q_heads, self.d_head).transpose(1, 2)
        K = self.W_k(x).view(B, T, self.num_kv_heads, self.d_head).transpose(1, 2)
        V = self.W_v(x).view(B, T, self.num_kv_heads, self.d_head).transpose(1, 2)

        # Repeat KV heads to match Q heads
        K = K.repeat_interleave(self.num_groups, dim=1)  # (B, num_q_heads, T, d_head)
        V = V.repeat_interleave(self.num_groups, dim=1)

        # Standard attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_head ** 0.5)
        attn = torch.softmax(scores, dim=-1)
        context = torch.matmul(attn, V)

        context = context.transpose(1, 2).contiguous().view(B, T, -1)
        return self.W_o(context)

# Usage: 8 query heads, 2 KV heads → 75% KV cache reduction
gqa = GroupedQueryAttention(d_model=768, num_q_heads=8, num_kv_heads=2)
x = torch.randn(2, 10, 768)
out = gqa(x)
print(out.shape)  # (2, 10, 768)`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">GQA without repeat — efficient KV sharing</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

class GQA_Efficient(nn.Module):
    """GQA that avoids explicit KV repeat using group index."""
    def __init__(self, d_model=768, num_q_heads=8, num_kv_heads=2):
        super().__init__()
        self.d_model = d_model
        self.num_q_heads = num_q_heads
        self.num_kv_heads = num_kv_heads
        self.d_head = d_model // num_q_heads

        self.W_q = nn.Linear(d_model, num_q_heads * self.d_head)
        self.W_k = nn.Linear(d_model, num_kv_heads * self.d_head)
        self.W_v = nn.Linear(d_model, num_kv_heads * self.d_head)
        self.W_o = nn.Linear(num_q_heads * self.d_head, d_model)

    def forward(self, x):
        B, T, _ = x.shape

        Q = self.W_q(x).view(B, T, self.num_q_heads, self.d_head)
        K = self.W_k(x).view(B, T, self.num_kv_heads, self.d_head)
        V = self.W_v(x).view(B, T, self.num_kv_heads, self.d_head)

        # Map each Q head to its KV group
        # head 0,1,2,3 → group 0; head 4,5,6,7 → group 1
        group_size = self.num_q_heads // self.num_kv_heads

        # Reshape for grouped attention
        Q = Q.view(B, T, self.num_kv_heads, group_size, self.d_head)
        # Q shape: (B, T, num_kv_heads, group_size, d_head)

        # K, V: (B, T, num_kv_heads, d_head) → (B, T, num_kv_heads, 1, d_head)
        K = K.unsqueeze(3)
        V = V.unsqueeze(3)

        # Compute attention: Q @ K^T for each group
        # (B, T, num_kv_heads, group_size, d_head) @ (B, T, num_kv_heads, 1, d_head)^T
        scores = torch.einsum('bthgd,bthkd->bthgk', Q, K)
        scores = scores / (self.d_head ** 0.5)
        attn = torch.softmax(scores, dim=-1)

        # Apply attention to V
        context = torch.einsum('bthgk,bthkd->bthgd', attn, V)
        context = context.reshape(B, T, self.num_q_heads * self.d_head)

        return self.W_o(context)

# Memory savings: only num_kv_heads KV tensors cached
gqa = GQA_Efficient(d_model=768, num_q_heads=8, num_kv_heads=2)
x = torch.randn(2, 10, 768)
out = gqa(x)
print(out.shape)  # (2, 10, 768)

# Compare parameter counts
import math
mha_params = 768 * 768 * 3 + 768 * 768  # Q,K,V + O
gqa_params = 768 * (8*96) + 768 * (2*96) + 768 * (2*96) + 768 * 768
print(f"MHA params: {mha_params:,}")
print(f"GQA params: {gqa_params:,}")`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. Sparse Attention Patterns
   ═══════════════════════════════════════════════════════════ */

function SparseAttention() {
  const [pattern, setPattern] = useState<'local' | 'dilated' | 'random' | 'longformer' | 'bigbird'>('local');
  const [windowSize, setWindowSize] = useState(3);
  const [dilationRate, setDilationRate] = useState(2);
  const [gridSize] = useState(8);
  const [selected, setSelected] = useState(27);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const [randomSeed, setRandomSeed] = useState(0);

  const getAttended = (idx: number): number[] => {
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    const result: number[] = [idx];

    switch (pattern) {
      case 'local': {
        const half = Math.floor(windowSize / 2);
        for (let dr = -half; dr <= half; dr++)
          for (let dc = -half; dc <= half; dc++) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize)
              result.push(nr * gridSize + nc);
          }
        return [...new Set(result)];
      }
      case 'dilated': {
        const d = Math.max(1, dilationRate);
        for (let dr = -gridSize; dr <= gridSize; dr += d)
          for (let dc = -gridSize; dc <= gridSize; dc += d) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize)
              result.push(nr * gridSize + nc);
          }
        return [...new Set(result)];
      }
      case 'random': {
        for (let i = 0; i < gridSize * gridSize; i++) {
          if (seededRandom(idx * 127 + i * 31 + randomSeed) > 0.7) result.push(i);
        }
        return [...new Set(result)];
      }
      case 'longformer': {
        const half = Math.floor(windowSize / 2);
        for (let dc = -half; dc <= half; dc++) {
          const nc = col + dc;
          if (nc >= 0 && nc < gridSize) result.push(row * gridSize + nc);
        }
        const colHalf = Math.floor(windowSize / 2);
        for (let dr = -colHalf; dr <= colHalf; dr++) {
          const nr = row + dr;
          if (nr >= 0 && nr < gridSize) result.push(nr * gridSize + col);
        }
        for (let i = 0; i < Math.ceil(gridSize * 0.25); i++) {
          const ri = Math.floor(seededRandom(idx * 53 + i * 17 + randomSeed) * gridSize * gridSize);
          result.push(ri);
        }
        return [...new Set(result)];
      }
      case 'bigbird': {
        const half = Math.floor(windowSize / 2);
        for (let dc = -half; dc <= half; dc++) {
          const nc = col + dc;
          if (nc >= 0 && nc < gridSize) result.push(row * gridSize + nc);
        }
        const d = Math.max(2, dilationRate);
        for (let dr = -gridSize; dr <= gridSize; dr += d) {
          const nr = row + dr;
          if (nr >= 0 && nr < gridSize) result.push(nr * gridSize + col);
        }
        for (let i = 0; i < Math.ceil(gridSize * 0.5); i++) {
          const ri = Math.floor(seededRandom(idx * 79 + i * 23 + randomSeed) * gridSize * gridSize);
          result.push(ri);
        }
        return [...new Set(result)];
      }
    }
  };

  const attended = useMemo(() => getAttended(selected), [selected, pattern, windowSize, gridSize, dilationRate, randomSeed]);
  const totalTokens = gridSize * gridSize;
  const sparsity = ((1 - attended.length / totalTokens) * 100).toFixed(1);

  const patterns = [
    { id: 'local' as const, name: 'Local', desc: 'Fixed window, O(n·w)' },
    { id: 'dilated' as const, name: 'Dilated', desc: 'Strided, larger RF' },
    { id: 'random' as const, name: 'Random', desc: 'Stochastic, O(n·k)' },
    { id: 'longformer' as const, name: 'Longformer', desc: 'Local + global + random' },
    { id: 'bigbird' as const, name: 'BigBird', desc: 'Local + dilated + random' },
  ];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Sparse Attention Patterns</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Reduces O(n²) complexity by only attending to a subset of tokens. Different patterns
        offer different trade-offs between receptive field and computation.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Long Documents / Video</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Books, legal docs, video frames. Local context dominates; Longformer handles 16K+ tokens efficiently.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Global Reasoning Tasks</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Tasks requiring all-to-all context from layer 1 (e.g., small image classification). ViT outperforms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {patterns.map(p => (
              <button key={p.id} onClick={() => setPattern(p.id)}
                className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-all ${
                  pattern === p.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                <div>{p.name}</div>
                <div className="text-[9px] opacity-75">{p.desc}</div>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            {(pattern === 'local' || pattern === 'longformer' || pattern === 'bigbird') && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Window Size: <span className="text-blue-600 dark:text-blue-400">{windowSize}</span>
                </label>
                <input type="range" min="2" max="6" step="1" value={windowSize}
                  onChange={e => setWindowSize(parseInt(e.target.value))}
                  className="w-full cursor-pointer" />
              </div>
            )}
            {(pattern === 'dilated' || pattern === 'bigbird') && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Dilation Rate: <span className="text-blue-600 dark:text-blue-400">{dilationRate}</span>
                </label>
                <input type="range" min="1" max="4" step="1" value={dilationRate}
                  onChange={e => setDilationRate(parseInt(e.target.value))}
                  className="w-full cursor-pointer" />
              </div>
            )}
            {(pattern === 'random' || pattern === 'longformer' || pattern === 'bigbird') && (
              <button onClick={() => setRandomSeed(s => s + 1)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer w-full">
                ↻ New Random Pattern
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Statistics</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{attended.length}</div>
                <div className="text-[10px] text-gray-400">Attended</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-300">{totalTokens}</div>
                <div className="text-[10px] text-gray-400">Total</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{sparsity}%</div>
                <div className="text-[10px] text-gray-400">Sparse</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs text-gray-700 dark:text-gray-300">
            {pattern === 'local' && `Each token attends to a ${windowSize}×${windowSize} local window. Like convolution but learned. Used in Longformer.`}
            {pattern === 'dilated' && `Attends at regular intervals with dilation rate ${dilationRate}. Combines local detail with wider context.`}
            {pattern === 'random' && `Each token attends to ~25% of others stochastically. Provides global connectivity with high probability.`}
            {pattern === 'longformer' && `Combines local window + column attention + random tokens. Used for long document understanding.`}
            {pattern === 'bigbird' && `Combines local window + dilated + random. Theoretical guarantees: includes all Transformer functions.`}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">Attention Grid (click to select)</h4>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-4" />
                {Array.from({ length: gridSize }, (_, j) => (
                  <div key={j} className="text-[7px] text-gray-400 w-7 text-center">{j}</div>
                ))}
              </div>
              {Array.from({ length: gridSize }, (_, i) => (
                <div key={i} className="flex items-center gap-1 mb-[2px]">
                  <div className="text-[7px] text-gray-400 w-4 text-right pr-1">{i}</div>
                  {Array.from({ length: gridSize }, (_, j) => {
                    const idx = i * gridSize + j;
                    const isAttended = attended.includes(idx);
                    const isSelected = idx === selected;
                    return (
                      <div key={j}
                        onClick={() => setSelected(idx)}
                        className={`w-7 h-7 rounded cursor-pointer transition-all hover:scale-105 flex items-center justify-center text-[8px] font-bold ${
                          isSelected
                            ? 'bg-blue-500 text-white ring-2 ring-blue-300 hover:bg-blue-600'
                            : isAttended
                            ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-300 dark:hover:bg-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}>
                        {isSelected ? '●' : isAttended ? '✓' : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-3 text-[10px]">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded" /> Selected
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded" /> Attended
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded" /> Masked
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <h4 className="font-semibold mb-2">Complexity Comparison</h4>
            <div className="text-[9px] text-gray-500 mb-2 font-mono">
              n=tokens, w=window, k=random, d=dilation, r=row/col
            </div>
            <div className="space-y-1 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
              <div>Full:       O(n² · d)</div>
              <div>Local:      O(n · w² · d)</div>
              <div>Dilated:    O(n · k · d)</div>
              <div>Longformer: O(n · (w+k+r) · d)</div>
              <div>BigBird:    O(n · (w+d+k) · d)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 flex items-center justify-between cursor-pointer hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-950/50 dark:hover:to-blue-950/50 transition-all">
          <span className="font-semibold text-sm">Learn Sparse Attention</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
                        <h4 className="font-semibold text-sm mb-2">🎓 Classroom Analogy</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine a <strong>100-person classroom</strong>. In full attention, everyone talks
                          to everyone — chaos! In sparse attention, students follow rules:
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-purple-600 mb-1">Local Window</div>
                            <div className="text-gray-600 dark:text-gray-400">Talk only to your 8 nearest neighbors (deskmates)</div>
                          </div>
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-blue-600 mb-1">Dilated</div>
                            <div className="text-gray-600 dark:text-gray-400">Skip every 2nd person, talk to every 3rd</div>
                          </div>
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-emerald-600 mb-1">Random</div>
                            <div className="text-gray-600 dark:text-gray-400">Randomly pick 25% of classmates to talk to</div>
                          </div>
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-amber-600 mb-1">Longformer</div>
                            <div className="text-gray-600 dark:text-gray-400">Neighbors + column + random = best of all</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          The <strong>result</strong>: same information flows, but 10x fewer conversations!
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                        <strong>Why sparse?</strong> Full attention is O(n²) — a 100K token document requires
                        10 billion operations. Sparse patterns reduce this to O(n·k) where k ≪ n, making
                        long sequences feasible.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Define Pattern', desc: 'Choose which tokens can attend to which others. This creates an attention mask.', formula: 'mask[i][j] = 1 if token i attends to j' },
                          { step: 2, title: 'Compute Q, K, V', desc: 'Same as standard attention — project input to Query, Key, Value matrices.', formula: 'Q = X·W_Q, K = X·W_K, V = X·W_V' },
                          { step: 3, title: 'Apply Mask', desc: 'Before softmax, set masked positions to -∞ so they get zero attention weight.', formula: 'scores = QK^T / √d + mask (mask has -∞ for masked)' },
                          { step: 4, title: 'Sparse MatMul', desc: 'Only compute attention for unmasked positions. Can use sparse tensor formats.', formula: 'Attn = softmax(scores) · V (sparse)' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
                        <strong>Key insight:</strong> The mask is the same for ALL queries — it defines a fixed
                        receptive field. Some patterns (like random) provide probabilistic global connectivity.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Using PyTorch's built-in attention with mask</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn
import torch.nn.functional as F

def sparse_attention(Q, K, V, mask):
    """Apply attention with a boolean mask."""
    # mask: (seq_len, seq_len) with True = attend, False = mask
    scores = torch.matmul(Q, K.transpose(-2, -1))
    scores = scores / (Q.shape[-1] ** 0.5)

    # Set masked positions to -infinity
    scores = scores.masked_fill(~mask, float('-inf'))

    attn = F.softmax(scores, dim=-1)
    # Replace NaN (all-masked rows) with 0
    attn = attn.nan_to_num(0)
    return torch.matmul(attn, V)

# Example: Local window attention (window size 3)
seq_len = 8
window = 3
mask = torch.zeros(seq_len, seq_len, dtype=torch.bool)
for i in range(seq_len):
    for j in range(seq_len):
        if abs(i - j) <= window // 2:
            mask[i, j] = True

Q = torch.randn(1, seq_len, 64)
K = torch.randn(1, seq_len, 64)
V = torch.randn(1, seq_len, 64)

out = sparse_attention(Q, K, V, mask)
print(out.shape)  # (1, 8, 64)

# Count attended tokens per position
print(f"Tokens per position: {mask.sum(dim=1).tolist()}")`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Longformer-style attention from scratch</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn
import torch.nn.functional as F

class LongformerAttention(nn.Module):
    """Longformer: local + global attention combined."""
    def __init__(self, d_model=256, num_heads=4, window_size=3, num_global=1):
        super().__init__()
        self.d_head = d_model // num_heads
        self.num_heads = num_heads
        self.window_size = window_size
        self.num_global = num_global  # [CLS] + first k tokens

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def _create_mask(self, seq_len):
        """Local window mask + global tokens."""
        mask = torch.zeros(seq_len, seq_len, dtype=torch.bool)
        half_w = self.window_size // 2

        # Local attention
        for i in range(seq_len):
            start = max(0, i - half_w)
            end = min(seq_len, i + half_w + 1)
            mask[i, start:end] = True

        # Global tokens: everyone attends to them, they attend to everyone
        for g in range(self.num_global):
            mask[g, :] = True  # global token sees all
            mask[:, g] = True  # all see global token

        return mask

    def forward(self, x):
        B, T, _ = x.shape
        mask = self._create_mask(T).to(x.device)

        Q = self.W_q(x).view(B, T, self.num_heads, self.d_head).transpose(1, 2)
        K = self.W_k(x).view(B, T, self.num_heads, self.d_head).transpose(1, 2)
        V = self.W_v(x).view(B, T, self.num_heads, self.d_head).transpose(1, 2)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_head ** 0.5)
        scores = scores.masked_fill(~mask.unsqueeze(0).unsqueeze(0), float('-inf'))
        attn = F.softmax(scores, dim=-1).nan_to_num(0)
        context = torch.matmul(attn, V)

        context = context.transpose(1, 2).contiguous().view(B, T, -1)
        return self.W_o(context)

# Usage
model = LongformerAttention(d_model=256, num_heads=4, window_size=3, num_global=1)
x = torch.randn(1, 8, 256)  # seq_len=8
out = model(x)
print(out.shape)  # (1, 8, 256)`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. Flash Attention
   ═══════════════════════════════════════════════════════════ */

function FlashAttentionViz() {
  const [blockSize, setBlockSize] = useState(2);
  const [seqLen] = useState(8);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [blockIdx, setBlockIdx] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const numBlocks = Math.ceil(seqLen / blockSize);

  const standardReads = seqLen * seqLen;
  const flashReads = seqLen + Math.ceil(seqLen * seqLen / blockSize);

  const blocks = useMemo(() => {
    const b: { row: number; col: number; x: number; y: number }[] = [];
    for (let bi = 0; bi < numBlocks; bi++) {
      for (let bj = 0; bj < numBlocks; bj++) {
        b.push({ row: bi, col: bj, x: bj * blockSize, y: bi * blockSize });
      }
    }
    return b;
  }, [numBlocks, blockSize]);

  const phases = [
    { label: 'Tiled Q', desc: 'Load Q tile from HBM to SRAM', color: 'bg-blue-400' },
    { label: 'Tiled K', desc: 'Load K tile, compute local scores', color: 'bg-purple-400' },
    { label: 'Online Softmax', desc: 'Compute softmax incrementally', color: 'bg-amber-400' },
    { label: 'Tiled V', desc: 'Load V tile, accumulate output', color: 'bg-emerald-400' },
  ];

  const startAnim = () => {
    stopAnim();
    setIsAnimating(true);
    setAnimPhase(0);
    setBlockIdx(0);
    let phase = 0;
    let block = 0;
    intervalRef.current = setInterval(() => {
      phase++;
      if (phase >= phases.length) {
        phase = 0;
        block++;
        if (block >= blocks.length) { stopAnim(); return; }
        setBlockIdx(block);
      }
      setAnimPhase(phase);
    }, 800);
  };

  const stopAnim = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setAnimPhase(0);
    setBlockIdx(0);
  };

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const currentBlock = blocks[blockIdx % blocks.length];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Flash Attention</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        IO-aware exact attention algorithm that tiles computation to minimize HBM reads/writes.
        Same result as standard attention, but 2-4x faster and memory-efficient.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">GPU Training / Inference</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Any GPU attention task. 2-4x speedup, 5-20x memory savings. Default in PyTorch 2.0+ SDPA.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Short Sequences / CPU</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Tiling overhead exceeds benefit for short sequences. CUDA-only; no CPU path. Use standard attention for &lt;256 tokens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="font-semibold text-sm">Configuration</h4>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Block Size: <span className="text-blue-600 dark:text-blue-400">{blockSize}</span>
              </label>
              <input type="range" min="1" max="4" step="1" value={blockSize}
                onChange={e => { setBlockSize(parseInt(e.target.value)); stopAnim(); }}
                className="w-full cursor-pointer" />
              <div className="text-[10px] text-gray-400 mt-1">
                {numBlocks}×{numBlocks} = {numBlocks * numBlocks} tiles
              </div>
            </div>
            <div className="flex gap-2">
              {!isAnimating ? (
                <button onClick={startAnim}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer flex-1">
                  ▶ Animate Pipeline
                </button>
              ) : (
                <button onClick={stopAnim}
                  className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 cursor-pointer flex-1">
                  ⏹ Stop
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {phases.map((phase, i) => (
              <motion.div key={i}
                onClick={() => { setAnimPhase(i); setIsAnimating(false); }}
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                  animPhase === i
                    ? `${phase.color}/10 border-current ${phase.color}`
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    animPhase === i ? `${phase.color} text-white` : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>{i + 1}</div>
                  <span className="text-sm font-semibold">{phase.label}</span>
                </div>
                {animPhase === i && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-7">{phase.desc}</motion.p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400 text-xs text-gray-700 dark:text-gray-300">
            <h4 className="font-semibold mb-1">Key Insight</h4>
            Standard attention materializes the full N×N attention matrix in HBM.
            Flash Attention computes in tiles that fit in SRAM, never materializing the full matrix.
            Uses online softmax (Milakov & Gimelshein 2018) for exact results.
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">Tiling Visualization ({blockSize}×{blockSize} blocks)</h4>
            <div className="flex flex-col items-center">
              <div className="flex gap-1 mb-1">
                {Array.from({ length: seqLen }, (_, j) => (
                  <div key={j} className="text-[7px] text-gray-400 w-6 text-center">{j}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  {Array.from({ length: seqLen }, (_, i) => (
                    <div key={i} className="text-[7px] text-gray-400 h-6 flex items-center justify-end pr-1">{i}</div>
                  ))}
                </div>
                <div className="border border-gray-300 dark:border-gray-600 rounded p-1 inline-grid gap-[1px]"
                  style={{ gridTemplateColumns: `repeat(${seqLen}, 1fr)` }}>
                  {Array.from({ length: seqLen * seqLen }, (_, idx) => {
                    const row = Math.floor(idx / seqLen);
                    const col = idx % seqLen;
                    const blockRow = Math.floor(row / blockSize);
                    const blockCol = Math.floor(col / blockSize);
                    const isCurrentBlock = blockRow === currentBlock.row && blockCol === currentBlock.col;
                    const isInRow = blockRow === currentBlock.row;
                    const isInCol = blockCol === currentBlock.col;
                    const isQLoad = animPhase === 0 && isInRow;
                    const isKLoad = animPhase === 1 && isInCol;
                    const isVLoad = animPhase === 3 && isInCol;
                    return (
                      <div key={idx}
                        className={`w-6 h-6 rounded-[2px] transition-all ${
                          animPhase === 2 && isCurrentBlock ? 'bg-amber-400' :
                          isCurrentBlock ? 'bg-blue-500' :
                          isQLoad ? 'bg-blue-200 dark:bg-blue-800' :
                          isKLoad ? 'bg-purple-200 dark:bg-purple-800' :
                          isVLoad ? 'bg-emerald-200 dark:bg-emerald-800' :
                          isInRow && animPhase === 0 ? 'bg-blue-100 dark:bg-blue-900/40' :
                          isInCol && (animPhase === 1 || animPhase === 3) ? 'bg-purple-100 dark:bg-purple-900/40' :
                          'bg-gray-100 dark:bg-gray-700'
                        }`} />
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 mt-3 text-[10px] flex-wrap justify-center">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded" /> Current tile</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded" /> Q row</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-200 dark:bg-purple-800 rounded" /> K col</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-200 dark:bg-emerald-800 rounded" /> V col</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded" /> Softmax</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-3">HBM Access Comparison</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Standard Attention</span>
                  <span className="font-mono text-rose-500">{standardReads} reads</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Flash Attention</span>
                  <span className="font-mono text-emerald-500">{flashReads} reads</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, (flashReads / standardReads) * 100)}%` }} />
                </div>
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {((1 - flashReads / standardReads) * 100).toFixed(0)}% fewer HBM accesses
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-semibold mb-1">SRAM</h4>
              <div className="text-gray-700 dark:text-gray-300">
                ~20 MB on A100. 19 TB/s bandwidth. Fits tile computation.
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
              <h4 className="font-semibold mb-1">HBM</h4>
              <div className="text-gray-700 dark:text-gray-300">
                ~80 GB on A100. 2 TB/s bandwidth. Bottleneck for standard attention.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 flex items-center justify-between cursor-pointer hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/50 dark:hover:to-orange-950/50 transition-all">
          <span className="font-semibold text-sm">Learn Flash Attention</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
                        <h4 className="font-semibold text-sm mb-2">📖 Reading a Textbook Analogy</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine reading a <strong>1000-page textbook</strong>. You have two options:
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                            <div className="font-bold text-rose-600 text-[10px] mb-1">Standard (Naive)</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              Try to hold the ENTIRE book in your hands at once. Drop it? Start over.
                              Your desk (HBM) is too small!
                            </div>
                          </div>
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                            <div className="font-bold text-emerald-600 text-[10px] mb-1">Flash (Smart)</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              Read one chapter at a time. Take notes (partial softmax).
                              Accumulate summaries. Final answer = sum of chapter summaries.
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          Flash Attention doesn't reduce computation — it reduces <strong>memory I/O</strong>.
                          Same math, fewer trips to slow memory. Like reading chapters instead of the whole book at once.
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                        <strong>Key insight:</strong> The bottleneck in attention is memory bandwidth, not compute.
                        GPU compute is fast, but moving data between HBM (slow) and SRAM (fast) is expensive.
                        Flash Attention minimizes this movement.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Tile Q', desc: 'Load a block of Q rows from HBM to SRAM. Block fits in ~20MB SRAM.', formula: 'Q_block = Q[i:i+block_size, :]' },
                          { step: 2, title: 'Iterate over K,V blocks', desc: 'For each K,V block, compute local scores and accumulate. Never store full N×N matrix.', formula: 'for j in range(num_blocks): scores = Q_block @ K[j].T' },
                          { step: 3, title: 'Online Softmax', desc: 'Maintain running max and sum to compute softmax incrementally. Uses the online softmax trick.', formula: 'm_new = max(m_old, row_max(scores))' },
                          { step: 4, title: 'Accumulate Output', desc: 'Write final output blocks back to HBM. Total HBM reads = O(N²/B) instead of O(N²).', formula: 'O[i:i+block_size] = output_block' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
                        <strong>Online Softmax Trick:</strong> Instead of computing softmax twice (once for max, once for sum),
                        maintain running statistics. Update incrementally: m_new = max(m_old, batch_max),
                        l_new = l_old * exp(m_old - m_new) + sum(exp(scores - m_new)).
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">PyTorch 2.0+ SDPA (uses Flash Attention automatically)</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn.functional as F

# Method 1: PyTorch 2.0+ scaled_dot_product_attention
# Automatically selects Flash/Memory-Efficient/Math backend
Q = torch.randn(2, 8, 128, 64, device='cuda')  # (B, H, T, d)
K = torch.randn(2, 8, 256, 64, device='cuda')
V = torch.randn(2, 8, 256, 64, device='cuda')

# Flash Attention (best for GPU, non-causal)
out = F.scaled_dot_product_attention(Q, K, V, is_causal=False)
print(out.shape)  # (2, 8, 128, 64)

# Causal mask (for autoregressive generation)
out_causal = F.scaled_dot_product_attention(Q, K, V, is_causal=True)

# Method 2: Check which backend is used
with torch.backends.cuda.sdp_kernel(
    enable_flash=True,
    enable_math=False,
    enable_mem_efficient=False
):
    out_flash = F.scaled_dot_product_attention(Q, K, V)
    print("Using Flash Attention backend")

# Method 3: xFormers (if installed)
# out = xformers.ops.memory_efficient_attention(Q, K, V)`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Flash Attention tiling logic (simplified Python)</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch

def flash_attention_simplified(Q, K, V, block_size=64):
    """
    Simplified Flash Attention implementation.
    Real implementation is in CUDA/C++ for performance.
    This shows the algorithmic logic.
    """
    B, H, T, d = Q.shape
    O = torch.zeros_like(Q)
    L = torch.zeros(B, H, T, 1, device=Q.device)  # log-sum-exp
    M = torch.full((B, H, T, 1), float('-inf'), device=Q.device)  # running max

    scale = d ** -0.5

    # Number of blocks
    num_blocks_q = (T + block_size - 1) // block_size

    for i in range(num_blocks_q):
        # Load Q block: rows i*block_size to (i+1)*block_size
        q_start = i * block_size
        q_end = min((i + 1) * block_size, T)
        Q_block = Q[:, :, q_start:q_end, :]  # (B, H, block, d)

        # Temporary output for this block
        O_block = torch.zeros(B, H, q_end - q_start, d, device=Q.device)
        L_block = torch.zeros(B, H, q_end - q_start, 1, device=Q.device)
        M_block = torch.full((B, H, q_end - q_start, 1), float('-inf'), device=Q.device)

        for j in range(num_blocks_q):
            # Load K, V block
            k_start = j * block_size
            k_end = min((j + 1) * block_size, T)
            K_block = K[:, :, k_start:k_end, :]  # (B, H, block, d)
            V_block = V[:, :, k_start:k_end, :]

            # Compute local attention scores
            S_block = torch.matmul(Q_block, K_block.transpose(-2, -1)) * scale

            # Online softmax update
            M_new = torch.maximum(M_block, S_block.max(dim=-1, keepdim=True).values)
            exp_old = torch.exp(M_block - M_new)
            exp_new = torch.exp(S_block - M_new)

            # Update log-sum-exp
            L_new = L_block * exp_old + exp_new.sum(dim=-1, keepdim=True)

            # Update output
            O_block = (O_block * L_block * exp_old + torch.matmul(exp_new, V_block)) / L_new

            M_block = M_new
            L_block = L_new

        # Write block output back
        O[:, :, q_start:q_end, :] = O_block
        L[:, :, q_start:q_end, :] = L_block
        M[:, :, q_start:q_end, :] = M_block

    return O

# Test
Q = torch.randn(1, 4, 128, 64)
K = torch.randn(1, 4, 128, 64)
V = torch.randn(1, 4, 128, 64)

out = flash_attention_simplified(Q, K, V, block_size=32)
print(out.shape)  # (1, 4, 128, 64)

# Compare with standard attention
out_std = torch.nn.functional.scaled_dot_product_attention(Q, K, V)
print(f"Max diff: {(out - out_std).abs().max().item():.6f}")`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. Cross-Attention
   ═══════════════════════════════════════════════════════════ */

function CrossAttentionDemo() {
  const [selectedQuery, setSelectedQuery] = useState(0);
  const [seed, setSeed] = useState(0);
  const [seqLenQ] = useState(6);
  const [seqLenKV] = useState(8);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');

  const sourceTokens = ['Le', 'chat', 'est', 'assis', 'sur', 'le', 'tapis', '[SEP]'];
  const targetTokens = ['The', 'cat', 'is', 'sitting', 'on', 'mat'];

  const crossWeights = useMemo(() => {
    const s = seed;
    return Array.from({ length: seqLenQ }, (_, i) =>
      Array.from({ length: seqLenKV }, (_, j) => {
        const semanticSim = seededRandom(i * 37 + j * 53 + s) * 0.5;
        const positionalBias = Math.exp(-Math.abs(i - j * seqLenQ / seqLenKV) * 0.3) * 0.3;
        return Math.min(1, semanticSim + positionalBias + seededRandom(i * 11 + j * 19 + s) * 0.2);
      })
    );
  }, [seqLenQ, seqLenKV, seed]);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Cross-Attention</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Queries come from one sequence (e.g., target language), while Keys and Values come from
        another (e.g., source image). Used in image captioning, translation, and diffusion models.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Multi-Modal Fusion</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Image captioning, Stable Diffusion, Visual QA, translation. Bridges two modalities/languages.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Single-Modal Tasks</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Self-attention tasks (Q=K=V from same source). Cross-attention adds unnecessary complexity and parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">Architecture</h4>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-mono space-y-1">
              <div className="text-blue-600 dark:text-blue-400">Q = Target × W_Q (from decoder)</div>
              <div className="text-purple-600 dark:text-purple-400">K = Source × W_K (from encoder)</div>
              <div className="text-emerald-600 dark:text-emerald-400">V = Source × W_V (from encoder)</div>
              <div className="text-amber-600 dark:text-amber-400">Attn = softmax(QK^T/√d)V</div>
            </div>
            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-900 rounded text-[10px]">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-700 dark:text-blue-300">Q ({seqLenQ}×d)</div>
                <span className="text-gray-400">×</span>
                <div className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded text-purple-700 dark:text-purple-300">Kᵀ (d×{seqLenKV})</div>
                <span className="text-gray-400">→</span>
                <div className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-amber-700 dark:text-amber-300">Scores ({seqLenQ}×{seqLenKV})</div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-amber-700 dark:text-amber-300">Softmax</div>
                <span className="text-gray-400">×</span>
                <div className="bg-emerald-100 dark:bg-emerald-900 px-2 py-1 rounded text-emerald-700 dark:text-emerald-300">V ({seqLenKV}×d)</div>
                <span className="text-gray-400">→</span>
                <div className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-700 dark:text-blue-300">Output ({seqLenQ}×d)</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-xs">Attention Heatmap</h4>
              <button onClick={() => { setSeed(s => s + 1); setSelectedQuery(0); }}
                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 cursor-pointer transition-all">
                🎲 New Weights
              </button>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1 ml-12">
                {sourceTokens.slice(0, seqLenKV).map((t, j) => (
                  <div key={j} className="text-[8px] text-purple-600 dark:text-purple-400 w-8 text-center truncate">{t}</div>
                ))}
              </div>
              {crossWeights.map((row, i) => (
                <div key={i} className="flex items-center gap-1 mb-[2px]">
                  <div className={`text-[8px] w-12 text-right pr-1 truncate ${
                    i === selectedQuery ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'
                  }`}>{targetTokens[i]}</div>
                  {row.map((v, j) => (
                    <div key={j}
                      className={`w-8 h-6 rounded cursor-pointer transition-all hover:scale-110 ${
                        i === selectedQuery
                          ? 'bg-blue-400 dark:bg-blue-500 ring-1 ring-blue-600 dark:ring-blue-300'
                          : 'hover:bg-purple-300 dark:hover:bg-purple-600'
                      }`}
                      style={{ backgroundColor: i === selectedQuery ? undefined : `rgba(168, 85, 247, ${v})` }}
                      onClick={() => setSelectedQuery(i)}
                      title={`${targetTokens[i]} → ${sourceTokens[j]}: ${v.toFixed(2)}`} />
                  ))}
                </div>
              ))}
              <div className="flex items-center gap-1 mt-1 ml-12">
                <div className="text-[8px] text-gray-400 w-12" />
                {Array.from({ length: seqLenKV }, (_, j) => (
                  <div key={j} className="text-[7px] text-gray-400 w-8 text-center">src{j}</div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>← Weak</span>
              <span>Strong →</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">
              Target #{selectedQuery}: "{targetTokens[selectedQuery]}" → Source Weights
            </h4>
            <div className="flex items-end gap-1 h-24 border-b border-gray-300 dark:border-gray-600 pb-1">
              {crossWeights[selectedQuery].map((w, j) => (
                <div key={j} className="flex-1 flex flex-col items-center">
                  <motion.div
                    animate={{ height: w * 80 }}
                    className={`w-full rounded-t cursor-pointer transition-colors ${
                      j === selectedQuery ? 'bg-blue-500' : 'hover:bg-purple-400'
                    }`}
                    style={{ backgroundColor: j === selectedQuery ? undefined : (w > 0.6 ? '#a855f7' : w > 0.3 ? '#c4b5fd' : '#e9d5ff') }}
                    title={`${targetTokens[selectedQuery]} → ${sourceTokens[j]}: ${w.toFixed(2)}`} />
                  <div className="text-[7px] text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full text-center">{sourceTokens[j]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
              <h4 className="font-semibold mb-1">Image Captioning</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                Q = word tokens, K/V = image patches. Each word attends to relevant image regions.
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400 text-xs">
              <h4 className="font-semibold mb-1">Translation</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                Q = target tokens, K/V = source tokens. Words attend to aligned source words.
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400 text-xs">
              <h4 className="font-semibold mb-1">Diffusion (Stable Diffusion)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                Q = image latents, K/V = text embeddings. Each spatial position attends to relevant text tokens.
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
              <h4 className="font-semibold mb-1">Visual QA</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                Q = question tokens, K/V = image features. Question guides visual attention.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 flex items-center justify-between cursor-pointer hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-950/50 dark:hover:to-purple-950/50 transition-all">
          <span className="font-semibold text-sm">Learn Cross-Attention</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
                        <h4 className="font-semibold text-sm mb-2">📖 Translator Analogy</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine a <strong>French-to-English translator</strong> working with a document:
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-blue-600 text-[10px] mb-2">Source Sequence (French)</div>
                            <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-400">
                              <div>Le chat est assis sur le tapis</div>
                              <div className="text-purple-500 font-mono">K/V — what you're reading</div>
                            </div>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-emerald-600 text-[10px] mb-2">Target Sequence (English)</div>
                            <div className="space-y-1 text-[10px] text-gray-600 dark:text-gray-400">
                              <div>The cat is sitting on the mat</div>
                              <div className="text-blue-500 font-mono">Q — what you're writing</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          When writing "cat", the translator <strong>looks back</strong> at "chat" in the French text.
                          When writing "mat", it looks at "tapis". Each English word <strong>attends</strong> to
                          relevant French words — this is cross-attention!
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                        <strong>Key difference from self-attention:</strong> In self-attention, Q=K=V all come from
                        the same sequence. In cross-attention, Q comes from one sequence (target), while K and V
                        come from a different sequence (source). This bridges two modalities or languages.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Separate Projections', desc: 'Source and target sequences are projected separately. Source → K, V. Target → Q.', formula: 'K = src·W_K, V = src·W_V, Q = tgt·W_Q' },
                          { step: 2, title: 'Different Sequence Lengths', desc: 'Source can have different length than target. E.g., 8 French words → 6 English words.', formula: 'Q: (B, T_tgt, d), K/V: (B, T_src, d)' },
                          { step: 3, title: 'Cross-Attention Scores', desc: 'Each target token (Q) computes attention to ALL source tokens (K).', formula: 'scores = Q @ K^T / √d  → (B, H, T_tgt, T_src)' },
                          { step: 4, title: 'Weighted Source Values', desc: 'Target tokens get weighted combinations of source values based on attention.', formula: 'output = softmax(scores) @ V → (B, T_tgt, d)' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-xs">
                        <strong>Key insight:</strong> Cross-attention is the "bridge" between two representations.
                        In Stable Diffusion, it bridges text (CLIP embeddings) with image latents.
                        In translation, it bridges source and target languages.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Cross-Attention with PyTorch nn.MultiheadAttention</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

# Cross-attention: Q from decoder, K/V from encoder
cross_attn = nn.MultiheadAttention(
    embed_dim=768,
    num_heads=12,
    batch_first=True
)

# Source sequence (e.g., image features from encoder)
encoder_output = torch.randn(2, 20, 768)  # (batch, src_len, d)

# Target sequence (e.g., text tokens from decoder)
decoder_input = torch.randn(2, 10, 768)  # (batch, tgt_len, d)

# Cross-attention: Q=target, K=V=source
out, weights = cross_attn(
    query=decoder_input,   # target attends to source
    key=encoder_output,    # source provides keys
    value=encoder_output   # source provides values
)
print(out.shape)    # (2, 10, 768) - one value per target token
print(weights.shape) # (2, 10, 20) - attention matrix

# In Stable Diffusion:
# Q = image latent patches (spatial)
# K, V = text embeddings from CLIP
# Each image patch "reads" relevant text tokens
text_emb = torch.randn(2, 77, 768)  # CLIP text
image_latent = torch.randn(2, 256, 768)  # 16x16 patches
out, _ = cross_attn(image_latent, text_emb, text_emb)
print(out.shape)  # (2, 256, 768) - each patch attends to text`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Cross-Attention from scratch — clear Q/K/V separation</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn
import math

class CrossAttention(nn.Module):
    """Cross-Attention: Q from one sequence, K/V from another."""
    def __init__(self, d_model=768, num_heads=12):
        super().__init__()
        self.num_heads = num_heads
        self.d_head = d_model // num_heads

        # Separate projections for Q (target) and K,V (source)
        self.W_q = nn.Linear(d_model, d_model)  # target → Q
        self.W_k = nn.Linear(d_model, d_model)  # source → K
        self.W_v = nn.Linear(d_model, d_model)  # source → V
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, target, source):
        """
        target: (B, T_tgt, d_model) - e.g., English words
        source: (B, T_src, d_model) - e.g., French words
        """
        B, T_tgt, _ = target.shape
        T_src = source.shape[1]

        # Q from TARGET, K/V from SOURCE
        Q = self.W_q(target)  # (B, T_tgt, d)
        K = self.W_k(source)  # (B, T_src, d)
        V = self.W_v(source)  # (B, T_src, d)

        # Reshape for multi-head
        Q = Q.view(B, T_tgt, self.num_heads, self.d_head).transpose(1, 2)
        K = K.view(B, T_src, self.num_heads, self.d_head).transpose(1, 2)
        V = V.view(B, T_src, self.num_heads, self.d_head).transpose(1, 2)

        # Attention: (B, H, T_tgt, T_src)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_head)
        attn = torch.softmax(scores, dim=-1)

        # Output: (B, H, T_tgt, d_head)
        context = torch.matmul(attn, V)

        # Reshape and project
        context = context.transpose(1, 2).contiguous().view(B, T_tgt, -1)
        return self.W_o(context), attn

# Usage: Image captioning
model = CrossAttention(d_model=768, num_heads=12)
image_features = torch.randn(2, 20, 768)  # 20 image patches
text_tokens = torch.randn(2, 10, 768)     # 10 text tokens

# Q=write text, K/V=read image
out, attn = model(target=text_tokens, source=image_features)
print(out.shape)   # (2, 10, 768)
print(attn.shape)  # (2, 12, 10, 20) - text attends to image`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. Window Attention (Swin Transformer)
   ═══════════════════════════════════════════════════════════ */

function WindowAttention() {
  const [windowSize, setWindowSize] = useState(4);
  const [shifted, setShifted] = useState(false);
  const [gridSize] = useState(8);
  const [selected, setSelected] = useState(20);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');

  const getWindows = () => {
    const windows: { id: number; cells: number[] }[] = [];
    const offset = shifted ? Math.floor(windowSize / 2) : 0;
    let id = 0;

    for (let wy = 0; wy < gridSize; wy += windowSize) {
      for (let wx = 0; wx < gridSize; wx += windowSize) {
        const cells: number[] = [];
        for (let dy = 0; dy < windowSize; dy++) {
          for (let dx = 0; dx < windowSize; dx++) {
            const cy = (wy + dy + offset) % gridSize;
            const cx = (wx + dx + offset) % gridSize;
            cells.push(cy * gridSize + cx);
          }
        }
        windows.push({ id: id++, cells });
      }
    }
    return windows;
  };

  const windows = useMemo(() => getWindows(), [windowSize, shifted, gridSize]);
  const selectedWindow = windows.find(w => w.cells.includes(selected));

  const windowColors = [
    'bg-blue-200 dark:bg-blue-900', 'bg-emerald-200 dark:bg-emerald-900',
    'bg-amber-200 dark:bg-amber-900', 'bg-rose-200 dark:bg-rose-900',
    'bg-violet-200 dark:bg-violet-900', 'bg-cyan-200 dark:bg-cyan-900',
    'bg-pink-200 dark:bg-pink-900', 'bg-lime-200 dark:bg-lime-900',
    'bg-teal-200 dark:bg-teal-900', 'bg-orange-200 dark:bg-orange-900',
    'bg-indigo-200 dark:bg-indigo-900', 'bg-fuchsia-200 dark:bg-fuchsia-900',
    'bg-sky-200 dark:bg-sky-900', 'bg-red-200 dark:bg-red-900',
    'bg-yellow-200 dark:bg-yellow-900', 'bg-lime-200 dark:bg-lime-900',
  ];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Window Attention (Swin Transformer)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Computes attention within local windows, then shifts windows across layers for cross-window
        connections. Reduces complexity from O(n²) to O(n·w²).
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">High-Res Image Tasks</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Object detection, semantic segmentation, instance segmentation. Hierarchical features + efficient attention.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">NLP / Small Images</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Text tasks (no spatial structure), small images (28×28 MNIST). Window partitioning adds overhead without benefit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="font-semibold text-sm">Configuration</h4>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Window Size: <span className="text-blue-600 dark:text-blue-400">{windowSize}</span>
              </label>
              <input type="range" min="2" max="4" step="1" value={windowSize}
                onChange={e => setWindowSize(parseInt(e.target.value))}
                className="w-full cursor-pointer" />
              <div className="text-[10px] text-gray-400 mt-1">
                {(gridSize / windowSize) * (gridSize / windowSize)} windows, {windowSize * windowSize} tokens each
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={shifted}
                onChange={e => setShifted(e.target.checked)} className="cursor-pointer" />
              Shifted window (W-MSA)
            </label>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-2">Swin Transformer Block</h4>
            <div className="text-[10px] text-gray-700 dark:text-gray-300 space-y-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border-l-2 border-blue-400">
                <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Block 1: W-MSA</div>
                <div className="font-mono">Window MSA → LayerNorm + Residual → FFN + Residual</div>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border-l-2 border-amber-400">
                <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Block 2: SW-MSA (Shifted)</div>
                <div className="font-mono">Shift → Window MSA → Unshift → LayerNorm + Residual → FFN + Residual</div>
              </div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">
                Alternating W-MSA and SW-MSA enables cross-window connections while maintaining O(n·w²) complexity.
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400 text-xs text-gray-700 dark:text-gray-300">
            <h4 className="font-semibold mb-1">Complexity</h4>
            <div className="font-mono mt-1">
              <div>Standard: O(n² · d) = O({gridSize * gridSize}² · d)</div>
              <div>Window:   O(n · w² · d) = O({gridSize * gridSize} · {windowSize}² · d)</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Savings: {((1 - (gridSize * gridSize * windowSize * windowSize) / (gridSize * gridSize * gridSize * gridSize)) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">
              {shifted ? 'Shifted Windows (W-MSA)' : 'Window Attention (MSA)'}
            </h4>
            <div className="flex flex-col items-center">
              <div className="flex gap-1 mb-1">
                {Array.from({ length: gridSize }, (_, j) => (
                  <div key={j} className="text-[7px] text-gray-400 w-7 text-center">{j}</div>
                ))}
              </div>
              <div className="flex gap-1">
                <div className="flex flex-col gap-1">
                  {Array.from({ length: gridSize }, (_, i) => (
                    <div key={i} className="text-[7px] text-gray-400 h-7 flex items-center justify-end pr-1">{i}</div>
                  ))}
                </div>
                <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                  {Array.from({ length: gridSize * gridSize }, (_, idx) => {
                    const winIdx = windows.findIndex(w => w.cells.includes(idx));
                    const isSelected = idx === selected;
                    const isInSelectedWindow = selectedWindow?.cells.includes(idx) ?? false;
                    const color = winIdx >= 0 ? windowColors[winIdx % windowColors.length] : 'bg-gray-200 dark:bg-gray-700';
                    return (
                      <div key={idx}
                        onClick={() => setSelected(idx)}
                        className={`w-7 h-7 rounded cursor-pointer transition-all hover:scale-105 flex items-center justify-center text-[9px] font-bold ${
                          isSelected ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-500 text-white' :
                          isInSelectedWindow ? `${color} text-gray-700 dark:text-gray-300` :
                          `${color} opacity-40`
                        }`}>
                        {isSelected ? '●' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {selectedWindow && (
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Token {selected} is in Window {selectedWindow.id + 1}
                (attends to {selectedWindow.cells.length} tokens instead of {gridSize * gridSize}).
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-xs mb-3">Window Comparison</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Standard Self-Attention</span>
                  <span className="font-mono text-rose-500">{gridSize * gridSize * gridSize * gridSize} ops</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Window Attention (w={windowSize})</span>
                  <span className="font-mono text-emerald-500">{gridSize * gridSize * windowSize * windowSize} ops</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${((gridSize * gridSize * windowSize * windowSize) / (gridSize * gridSize * gridSize * gridSize)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-semibold mb-1">MSA (Window)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">Attention within non-overlapping windows. O(n·w²) complexity.</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
              <h4 className="font-semibold mb-1">W-MSA (Shifted)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">Shifts windows by w/2. Enables cross-window connections.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 flex items-center justify-between cursor-pointer hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-950/50 dark:hover:to-blue-950/50 transition-all">
          <span className="font-semibold text-sm">Learn Window Attention</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border-l-4 border-cyan-400">
                        <h4 className="font-semibold text-sm mb-2">🏛️ Theater Seating Analogy</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine a <strong>theater with {gridSize * gridSize} seats</strong> ({gridSize}×{gridSize} grid). In standard attention,
                          every person talks to every other — chaos! Instead:
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-cyan-600 text-[10px] mb-2">Step 1: Window MSA</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              Divide into {windowSize}×{windowSize} windows. Each group of {windowSize * windowSize} people only talks to their neighbors.
                              Fast and efficient!
                            </div>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-amber-600 text-[10px] mb-2">Step 2: Shifted W-MSA</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              Shift the windows by {Math.floor(windowSize / 2)} seats. Now different people are neighbors!
                              Information crosses window boundaries.
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          By alternating between regular and shifted windows, <strong>every seat eventually
                          communicates with every other</strong>, but in O(n·w²) instead of O(n²) time!
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                        <strong>Why Swin?</strong> Vision Transformers need spatial locality (like CNNs) but also
                        global context (like ViT). Window attention provides locality, shifted windows provide
                        global connectivity — best of both worlds!
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Partition into Windows', desc: 'Reshape feature map (H×W×C) into (H/w × W/w, w², C) — each window becomes a sequence of w² tokens.', formula: 'x: (B, H, W, C) → (B, N_windows, w², C)' },
                          { step: 2, title: 'Window Self-Attention', desc: 'Apply standard self-attention WITHIN each window. Each window processes independently.', formula: 'Attn_w = MSA(x_w) for each window w' },
                          { step: 3, title: 'Shift Windows (W-MSA)', desc: 'Cyclically shift feature map by (w//2, w//2). Creates new windows that cross original boundaries.', formula: 'x_shifted = torch.roll(x, shifts=(w//2, w//2), dims=(1,2))' },
                          { step: 4, title: 'Masked Attention', desc: 'Apply attention mask so shifted windows only attend within their new boundaries (cyclic).', formula: 'Attn_shifted = MSA(x_shifted, attn_mask)' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
                        <strong>Computational savings:</strong> With w={windowSize}, each token attends to {windowSize * windowSize} others instead of {gridSize * gridSize}.
                        That's a <strong>{((1 - (windowSize * windowSize) / (gridSize * gridSize)) * 100).toFixed(0)}% reduction</strong> in attention computation per layer!
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Window attention using PyTorch reshape + standard attention</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

def window_partition(x, window_size):
    """Partition feature map into windows."""
    B, H, W, C = x.shape
    x = x.view(B, H // window_size, window_size,
               W // window_size, window_size, C)
    # (B, num_h, w, num_w, w, C) → (B, num_h*num_w, w*w, C)
    windows = x.permute(0, 1, 3, 2, 4, 5).contiguous()
    windows = windows.view(-1, window_size * window_size, C)
    return windows  # (num_windows*B, w*w, C)

def window_reverse(windows, window_size, H, W):
    """Reverse window partition."""
    B = windows.shape[0] // (H * W // window_size // window_size)
    x = windows.view(B, H // window_size, W // window_size,
                     window_size, window_size, -1)
    x = x.permute(0, 1, 3, 2, 4, 5).contiguous()
    x = x.view(B, H, W, -1)
    return x

class WindowAttention(nn.Module):
    def __init__(self, dim, window_size, num_heads=8):
        super().__init__()
        self.dim = dim
        self.window_size = window_size
        self.num_heads = num_heads
        head_dim = dim // num_heads
        self.scale = head_dim ** -0.5

        self.qkv = nn.Linear(dim, dim * 3)
        self.proj = nn.Linear(dim, dim)

    def forward(self, x):
        B_, N, C = x.shape
        qkv = self.qkv(x).reshape(B_, N, 3, self.num_heads, C // self.num_heads)
        q, k, v = qkv.unbind(2)
        q, k, v = map(lambda t: t.transpose(1, 2), (q, k, v))

        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        x = (attn @ v).transpose(1, 2).reshape(B_, N, C)
        return self.proj(x)

# Usage
dim, window_size = 256, 7
attn = WindowAttention(dim, window_size)
x = torch.randn(1, 8*8, dim)  # 8x8 feature map flattened
out = attn(x)
print(out.shape)  # (1, 64, 256)`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Full Swin Block with shifted window support</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

class SwinAttentionBlock(nn.Module):
    """Swin Transformer block: W-MSA + SW-MSA."""
    def __init__(self, dim, window_size=7, shift_size=0, num_heads=8):
        super().__init__()
        self.dim = dim
        self.window_size = window_size
        self.shift_size = shift_size

        self.norm1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, num_heads, batch_first=True)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * 4),
            nn.GELU(),
            nn.Linear(dim * 4, dim)
        )

    def _create_mask(self, H, W):
        """Create attention mask for shifted window."""
        if self.shift_size == 0:
            return None

        img_mask = torch.zeros((1, H, W, 1))
        h_slices = (
            slice(0, -self.window_size),
            slice(-self.window_size, -self.shift_size),
            slice(-self.shift_size, None),
        )
        w_slices = (
            slice(0, -self.window_size),
            slice(-self.window_size, -self.shift_size),
            slice(-self.shift_size, None),
        )
        cnt = 0
        for h in h_slices:
            for w in w_slices:
                img_mask[:, h, w, :] = cnt
                cnt += 1

        # Partition into windows
        mask_windows = window_partition(img_mask, self.window_size)
        mask_windows = mask_windows.view(-1, self.window_size ** 2)
        attn_mask = mask_windows.unsqueeze(1) - mask_windows.unsqueeze(2)
        attn_mask = attn_mask.masked_fill(attn_mask != 0, -100.0)
        attn_mask = attn_mask.masked_fill(attn_mask == 0, 0.0)
        return attn_mask

    def forward(self, x, H, W):
        B, L, C = x.shape
        residual = x

        # Cyclic shift
        if self.shift_size > 0:
            x = x.view(B, H, W, C)
            x = torch.roll(x, shifts=(-self.shift_size, -self.shift_size), dims=(1, 2))
            x = x.view(B, H * W, C)

        # Window attention
        x_norm = self.norm1(x)
        attn_mask = self._create_mask(H, W).to(x.device) if self.shift_size > 0 else None
        x_attn, _ = self.attn(x_norm, x_norm, x_norm, attn_mask=attn_mask)

        x = residual + x_attn

        # Shift back
        if self.shift_size > 0:
            x = x.view(B, H, W, C)
            x = torch.roll(x, shifts=(self.shift_size, self.shift_size), dims=(1, 2))
            x = x.view(B, H * W, C)

        x = x + self.mlp(self.norm2(x))
        return x

# Usage: Alternating W-MSA and SW-MSA
dim, window_size = 256, 7
block_regular = SwinAttentionBlock(dim, window_size, shift_size=0)
block_shifted = SwinAttentionBlock(dim, window_size, shift_size=window_size//2)

x = torch.randn(1, 64, dim)  # 8x8 = 64 tokens
x = block_regular(x, H=8, W=8)   # Window MSA
x = block_shifted(x, H=8, W=8)   # Shifted Window MSA
print(x.shape)  # (1, 64, 256)`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. SE-Net (Squeeze-and-Excitation)
   ═══════════════════════════════════════════════════════════ */

function SENetExplorer() {
  const [reduction, setReduction] = useState(2);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [seed, setSeed] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const NUM_CHANNELS = 8;
  const phases = ['Input', 'Squeeze (GAP)', 'Excite (MLP)', 'Scale (×W)'];

  const featureMaps = useMemo(() => {
    return Array.from({ length: NUM_CHANNELS }, (_, c) =>
      Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => {
          const base = Math.sin(c * 0.8) * 0.3 + 0.5;
          const noise = seededRandom(c * 13 + i * 7 + j * 3 + seed) * 0.3;
          return Math.min(255, Math.max(0, (base + noise) * 255));
        })
      )
    );
  }, [seed]);

  const pooled = useMemo(() => featureMaps.map(ch => ch.flat().reduce((a, b) => a + b, 0) / 36), [featureMaps]);

  const weights = useMemo(() => {
    const r = Math.max(1, Math.floor(NUM_CHANNELS / reduction));
    const w1 = Array.from({ length: r }, (_, row) =>
      Array.from({ length: NUM_CHANNELS }, (_, col) => seededRandom(row * NUM_CHANNELS + col + seed) * 2 - 1)
    );
    const w2 = Array.from({ length: NUM_CHANNELS }, (_, row) =>
      Array.from({ length: r }, (_, col) => seededRandom(row * r + col + seed + 500) * 2 - 1)
    );
    const z = pooled.map(p => (p / 255) * 2 - 1);
    const hidden = Array.from({ length: r }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < NUM_CHANNELS; j++) sum += w1[i][j] * z[j];
      return Math.max(0, sum);
    });
    return Array.from({ length: NUM_CHANNELS }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < r; j++) sum += w2[i][j] * hidden[j];
      return 1 / (1 + Math.exp(-sum));
    });
  }, [pooled, reduction, seed]);

  const startAnim = () => {
    stopAnim();
    setIsAnimating(true);
    setAnimPhase(0);
    let phase = 0;
    intervalRef.current = setInterval(() => {
      phase++;
      if (phase >= phases.length) { stopAnim(); return; }
      setAnimPhase(phase);
    }, 1200);
  };

  const stopAnim = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setAnimPhase(0);
  };

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">SE-Net (Squeeze-and-Excitation)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Learns channel-wise importance weights by squeezing spatial dims, then exciting through a bottleneck MLP.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Channel Redundancy</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            When some feature channels are noisy or irrelevant. SE-Net suppresses useless channels with minimal parameters (+2-3%).
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Spatial-Critical Tasks</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Object detection/segmentation need spatial precision. SE-Net only does channel gating — use CBAM or non-local instead.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Reduction Ratio: <span className="text-blue-600 dark:text-blue-400">{reduction}</span>
          </label>
          <input type="range" min="1" max="4" step="1" value={reduction}
            onChange={e => setReduction(parseInt(e.target.value))}
            className="w-full cursor-pointer" />
        </div>
        <div className="flex gap-2 items-end">
          {!isAnimating ? (
            <button onClick={startAnim}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
              ▶ Animate Pipeline
            </button>
          ) : (
            <button onClick={stopAnim}
              className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 cursor-pointer">
              ⏹ Stop
            </button>
          )}
          <button onClick={() => setSeed(s => s + 1)}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">
            ↻ New Data
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {phases.map((p, i) => (
          <div key={i}
            className={`flex-1 text-center py-1.5 text-[10px] rounded font-medium transition-all ${
              animPhase >= i
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
            {p}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {featureMaps.map((ch, ci) => {
          const w = weights[ci];
          const isScaled = animPhase >= 3;
          return (
            <div key={ci} className="text-center">
              <svg viewBox="0 0 60 60" className="w-full rounded border border-gray-200 dark:border-gray-700"
                style={{ opacity: isScaled ? 0.3 + w * 0.7 : 0.7 }}>
                {ch.flat().map((v, pi) => {
                  const base = v / 255;
                  const r = isScaled ? Math.round(base * w * 255) : Math.round(base * 59);
                  const g = isScaled ? Math.round(base * w * 130) : Math.round(base * 130);
                  const b = isScaled ? Math.round(base * w * 246) : Math.round(base * 246);
                  return (
                    <rect key={pi} x={(pi % 6) * 10} y={Math.floor(pi / 6) * 10} width="10" height="10"
                      fill={`rgb(${r}, ${g}, ${b})`} />
                  );
                })}
              </svg>
              <span className="text-[9px] text-gray-500">C{ci}{isScaled ? ` ×${w.toFixed(2)}` : ''}</span>
            </div>
          );
        })}
      </div>

      {animPhase === 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Squeeze Output (per-channel)</h4>
          <div className="grid grid-cols-4 gap-2">
            {pooled.map((v, i) => (
              <div key={i} className="text-center">
                <div className="h-16 rounded bg-blue-100 dark:bg-blue-900/40 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${(v / 255) * 100}%` }} />
                </div>
                <span className="text-[8px] text-gray-500 mt-0.5 block">C{i}: {v.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {animPhase >= 2 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Computation Detail</h4>
          <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            <p><span className="font-mono text-blue-600 dark:text-blue-400">Squeeze:</span> z = (1/HW) Σ F(i,j) → {pooled.map((v, i) => `C${i}:${v.toFixed(1)}`).join(', ')}</p>
            <p><span className="font-mono text-blue-600 dark:text-blue-400">Excitation:</span> σ(W₂ · δ(W₁ · z)), r = {reduction}</p>
            <p><span className="font-mono text-blue-600 dark:text-blue-400">Scale:</span> F̃ = s · F, where s = [{weights.map(w => w.toFixed(3)).join(', ')}]</p>
          </div>
        </div>
      )}

      <button onClick={() => setShowLearn(!showLearn)}
        className="mt-4 w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-center gap-2">
        {showLearn ? '▾ Hide' : '▸ Learn More'} About SE-Net
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[['analogy', '💡 Analogy'], ['steps', '📝 How It Works'], ['simple', '🐍 PyTorch'], ['scratch', '🔧 From Scratch']].map(([id, label]) => (
                  <button key={id} onClick={() => setLearnTab(id as typeof learnTab)}
                    className={`px-3 py-1 text-xs rounded cursor-pointer ${
                      learnTab === id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}>{label}</button>
                ))}
              </div>
              {learnTab === 'analogy' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-semibold">Hospital Specialists:</p>
                  <p>An ER doctor sees a patient with 8 symptoms. Instead of treating all equally, <strong>Squeeze</strong> is like summarizing each symptom into one number ("How bad is this symptom overall?"). <strong>Excitation</strong> is the doctor consulting guidelines to assign importance: "Fever = 0.9 (critical), headache = 0.3 (minor)". <strong>Scale</strong> is prioritizing treatment: spend 90% effort on fever, 30% on headache.</p>
                </div>
              )}
              {learnTab === 'steps' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>Step 1 — Squeeze:</strong> Global Average Pooling collapses each H×W feature map to a single number. C channels → C-dim vector.</p>
                  <p><strong>Step 2 — Excitation:</strong> Two FC layers with bottleneck: FC(C → C/r) → ReLU → FC(C/r → C) → Sigmoid. Produces C weights in [0,1].</p>
                  <p><strong>Step 3 — Scale:</strong> Multiply each channel by its weight. Important channels are amplified, noisy ones suppressed.</p>
                  <p className="text-xs text-gray-500">Total overhead: only +2-3% parameters. r=16 is standard (bottleneck = 48 dims for ResNet-50).</p>
                </div>
              )}
              {learnTab === 'simple' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch.nn as nn

class SELayer(nn.Module):
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.squeeze = nn.AdaptiveAvgPool2d(1)  # H,W → 1,1
        self.excite = nn.Sequential(
            nn.Linear(channels, channels // reduction),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c, _, _ = x.shape
        z = self.squeeze(x).view(b, c)          # Squeeze
        s = self.excite(z).view(b, c, 1, 1)     # Excite
        return x * s                              # Scale

# Usage
se = SELayer(256, reduction=16)
x = torch.randn(1, 256, 32, 32)
out = se(x)  # Same shape, channels re-weighted`}</div>
              )}
              {learnTab === 'scratch' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn as nn

class SENetScratch(nn.Module):
    def __init__(self, in_channels, reduction=2):
        super().__init__()
        mid = max(1, in_channels // reduction)
        # Two FC layers simulating the bottleneck MLP
        self.fc1 = nn.Linear(in_channels, mid)
        self.fc2 = nn.Linear(mid, in_channels)

    def forward(self, x):
        B, C, H, W = x.shape
        # Step 1: Squeeze — Global Average Pooling
        z = x.mean(dim=[2, 3])  # (B, C)
        # Step 2: Excitation — MLP + Sigmoid
        h = torch.relu(self.fc1(z))   # (B, mid)
        s = torch.sigmoid(self.fc2(h)) # (B, C)
        # Step 3: Scale — channel-wise multiplication
        return x * s.view(B, C, 1, 1)

# Verify
model = SENetScratch(64, reduction=4)
x = torch.randn(2, 64, 16, 16)
print(model(x).shape)  # (2, 64, 16, 16)
print(f"Params: {sum(p.numel() for p in model.parameters())}")`}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. CBAM (Convolutional Block Attention Module)
   ═══════════════════════════════════════════════════════════ */

function CBAMExplorer() {
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [seed, setSeed] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const NUM_CHANNELS = 8;
  const phases = ['Input Feature Maps', 'Channel Attention', 'Spatial Attention', 'Refined Output'];

  const featureMaps = useMemo(() => {
    return Array.from({ length: NUM_CHANNELS }, (_, c) =>
      Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => {
          const base = Math.sin(c * 0.8) * 0.3 + 0.5;
          const noise = seededRandom(c * 13 + i * 7 + j * 3 + seed) * 0.3;
          return Math.min(255, Math.max(0, (base + noise) * 255));
        })
      )
    );
  }, [seed]);

  const channelWeights = useMemo(() => {
    const r = Math.max(1, Math.floor(NUM_CHANNELS / 2));
    const avgPooled = featureMaps.map(ch => ch.flat().reduce((a, b) => a + b, 0) / 36);
    const maxPooled = featureMaps.map(ch => Math.max(...ch.flat()));
    const w1 = Array.from({ length: r }, (_, row) =>
      Array.from({ length: NUM_CHANNELS }, (_, col) => seededRandom(row * NUM_CHANNELS + col + seed) * 2 - 1)
    );
    const w2 = Array.from({ length: NUM_CHANNELS }, (_, row) =>
      Array.from({ length: r }, (_, col) => seededRandom(row * r + col + seed + 500) * 2 - 1)
    );
    const avgZ = avgPooled.map(p => (p / 255) * 2 - 1);
    const maxZ = maxPooled.map(p => (p / 255) * 2 - 1);
    const avgHidden = Array.from({ length: r }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < NUM_CHANNELS; j++) sum += w1[i][j] * avgZ[j];
      return Math.max(0, sum);
    });
    const maxHidden = Array.from({ length: r }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < NUM_CHANNELS; j++) sum += w1[i][j] * maxZ[j];
      return Math.max(0, sum);
    });
    const avgGate = Array.from({ length: NUM_CHANNELS }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < r; j++) sum += w2[i][j] * avgHidden[j];
      return sum;
    });
    const maxGate = Array.from({ length: NUM_CHANNELS }, (_, i) => {
      let sum = 0;
      for (let j = 0; j < r; j++) sum += w2[i][j] * maxHidden[j];
      return sum;
    });
    return avgGate.map((a, i) => 1 / (1 + Math.exp(-(a + maxGate[i]))));
  }, [featureMaps, seed]);

  const spatialMap = useMemo(() => {
    const avgAcrossCh = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => {
        let sum = 0;
        for (let c = 0; c < NUM_CHANNELS; c++) sum += featureMaps[c][i][j];
        return sum / NUM_CHANNELS / 255;
      })
    );
    const maxAcrossCh = Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) => {
        let mx = 0;
        for (let c = 0; c < NUM_CHANNELS; c++) mx = Math.max(mx, featureMaps[c][i][j]);
        return mx / 255;
      })
    );
    return avgAcrossCh.map((row, i) =>
      row.map((avg, j) => 1 / (1 + Math.exp(-((avg + maxAcrossCh[i][j]) * 4 - 2))))
    );
  }, [featureMaps]);

  const startAnim = () => {
    stopAnim();
    setIsAnimating(true);
    setAnimPhase(0);
    let phase = 0;
    intervalRef.current = setInterval(() => {
      phase++;
      if (phase >= phases.length) { stopAnim(); return; }
      setAnimPhase(phase);
    }, 1200);
  };

  const stopAnim = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setAnimPhase(0);
  };

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">CBAM (Convolutional Block Attention Module)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Extends SE-Net by adding spatial attention. Sequentially applies channel attention then spatial attention for fine-grained feature refinement.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Detection & Segmentation</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            When you need both "which channels matter" AND "where to look". Spatial attention helps localize objects precisely.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Simple Classification</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            If spatial info doesn't matter (e.g., image-level classification), SE-Net alone is simpler and faster. CBAM adds unnecessary compute.
          </p>
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4">
        {!isAnimating ? (
          <button onClick={startAnim}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
            ▶ Animate Pipeline
          </button>
        ) : (
          <button onClick={stopAnim}
            className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 cursor-pointer">
            ⏹ Stop
          </button>
        )}
        <button onClick={() => setSeed(s => s + 1)}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">
          ↻ New Data
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {phases.map((p, i) => (
          <div key={i}
            className={`flex-1 text-center py-1.5 text-[10px] rounded font-medium transition-all ${
              animPhase >= i
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>{p}</div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {featureMaps.map((ch, ci) => {
          const cw = animPhase >= 1 ? channelWeights[ci] : 1;
          return (
            <div key={ci} className="text-center">
              <svg viewBox="0 0 60 60" className="w-full rounded border border-gray-200 dark:border-gray-700"
                style={{ opacity: 0.3 + cw * 0.7 }}>
                {ch.flat().map((v, pi) => {
                  const si = Math.floor(pi / 6), sj = pi % 6;
                  const sAlpha = animPhase >= 2 ? spatialMap[si][sj] : 1;
                  const base = v / 255;
                  const intensity = base * cw * sAlpha;
                  const r = Math.round(intensity * 59);
                  const g = Math.round(intensity * 130);
                  const b = Math.round(intensity * 246);
                  return (
                    <rect key={pi} x={sj * 10} y={si * 10} width="10" height="10"
                      fill={`rgb(${r}, ${g}, ${b})`} />
                  );
                })}
              </svg>
              <span className="text-[9px] text-gray-500">C{ci}{animPhase >= 1 ? ` ×${cw.toFixed(2)}` : ''}</span>
            </div>
          );
        })}
      </div>

      {animPhase === 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Channel Attention Output</h4>
          <div className="grid grid-cols-4 gap-2">
            {channelWeights.map((w, i) => (
              <div key={i} className="text-center">
                <div className="h-16 rounded bg-blue-100 dark:bg-blue-900/40 relative overflow-hidden">
                  <div className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${w * 100}%` }} />
                </div>
                <span className="text-[8px] text-gray-500 mt-0.5 block">C{i}: {w.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {animPhase === 2 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Spatial Attention Map (6×6)</h4>
          <div className="flex justify-center">
            <div className="grid gap-px" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {spatialMap.flat().map((v, i) => (
                <div key={i} className="aspect-square rounded-sm flex items-center justify-center text-[7px]"
                  style={{ backgroundColor: `rgba(34, 197, 94, ${v})`, color: v > 0.5 ? 'white' : 'inherit' }}>
                  {v.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-1 text-center">Green intensity = spatial importance</p>
        </div>
      )}

      {animPhase >= 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Computation Detail</h4>
          <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            {animPhase >= 1 && <p><span className="font-mono text-blue-600 dark:text-blue-400">Channel Attn:</span> Mc(F) = σ(MLP(AvgPool(F)) + MLP(MaxPool(F)))</p>}
            {animPhase >= 2 && <p><span className="font-mono text-blue-600 dark:text-blue-400">Spatial Attn:</span> Ms(F) = σ(f⁷ˣ⁷([AvgPool(F); MaxPool(F)]))</p>}
            {animPhase >= 2 && <p><span className="font-mono text-blue-600 dark:text-blue-400">Sequential:</span> F&apos; = Mc(F) × F,  F&apos;&apos; = Ms(F&apos;) × F&apos;</p>}
          </div>
        </div>
      )}

      <button onClick={() => setShowLearn(!showLearn)}
        className="mt-4 w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-center gap-2">
        {showLearn ? '▾ Hide' : '▸ Learn More'} About CBAM
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[['analogy', '💡 Analogy'], ['steps', '📝 How It Works'], ['simple', '🐍 PyTorch'], ['scratch', '🔧 From Scratch']].map(([id, label]) => (
                  <button key={id} onClick={() => setLearnTab(id as typeof learnTab)}
                    className={`px-3 py-1 text-xs rounded cursor-pointer ${
                      learnTab === id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}>{label}</button>
                ))}
              </div>
              {learnTab === 'analogy' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-semibold">Photography Editor:</p>
                  <p>Editing a group photo: <strong>Channel Attention</strong> is like deciding "focus on faces (channel 3), ignore background (channel 7)". <strong>Spatial Attention</strong> is like drawing a mask: "face region = important, sky = irrelevant". CBAM does both in sequence — first filters WHAT to keep, then WHERE to look.</p>
                </div>
              )}
              {learnTab === 'steps' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>Step 1 — Channel Attention:</strong> Compute both AvgPool and MaxPool along spatial dims → each produces C-dim vector. Pass both through shared MLP → element-wise sum → Sigmoid → C channel weights.</p>
                  <p><strong>Step 2 — Apply Channel:</strong> Multiply each channel by its weight → refined features F&apos;.</p>
                  <p><strong>Step 3 — Spatial Attention:</strong> Along channel axis, compute AvgPool and MaxPool → concatenate → 7×7 Conv → Sigmoid → H×W spatial map.</p>
                  <p><strong>Step 4 — Apply Spatial:</strong> Multiply each pixel by its spatial weight → final output F&apos;&apos;.</p>
                </div>
              )}
              {learnTab === 'simple' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch.nn as nn

class ChannelAttention(nn.Module):
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(channels, channels // reduction),
            nn.ReLU(),
            nn.Linear(channels // reduction, channels),
            nn.Sigmoid()
        )

    def forward(self, x):
        w = self.mlp(x).unsqueeze(-1).unsqueeze(-1)
        return x * w

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2)

    def forward(self, x):
        avg = x.mean(dim=1, keepdim=True)
        max_val = x.max(dim=1, keepdim=True)[0]
        attn = torch.sigmoid(self.conv(torch.cat([avg, max_val], dim=1)))
        return x * attn

# Usage
x = torch.randn(1, 256, 32, 32)
x = ChannelAttention(256)(x)  # Channel gate
x = SpatialAttention(7)(x)     # Spatial gate`}</div>
              )}
              {learnTab === 'scratch' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn as nn

class CBAMScratch(nn.Module):
    def __init__(self, channels, reduction=16, kernel_size=7):
        super().__init__()
        mid = max(1, channels // reduction)
        # Channel attention (shared MLP)
        self.ch_fc1 = nn.Linear(channels, mid)
        self.ch_fc2 = nn.Linear(mid, channels)
        # Spatial attention
        self.sp_conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2)

    def channel_att(self, x):
        B, C = x.shape[:2]
        avg = x.mean(dim=[2, 3])  # (B, C)
        mx = x.amax(dim=[2, 3])   # (B, C)
        # Shared MLP
        w = torch.sigmoid(
            self.ch_fc2(torch.relu(self.ch_fc1(avg))) +
            self.ch_fc2(torch.relu(self.ch_fc1(mx)))
        )
        return x * w.view(B, C, 1, 1)

    def spatial_att(self, x):
        avg = x.mean(dim=1, keepdim=True)
        mx = x.amax(dim=1, keepdim=True)
        attn = torch.sigmoid(self.sp_conv(torch.cat([avg, mx], dim=1)))
        return x * attn

    def forward(self, x):
        x = self.channel_att(x)  # F' = Mc(F) * F
        x = self.spatial_att(x)  # F'' = Ms(F') * F'
        return x

model = CBAMScratch(64, reduction=4)
x = torch.randn(2, 64, 16, 16)
print(model(x).shape)  # (2, 64, 16, 16)`}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   9. Self-Attention (Non-local) Explorer
   ═══════════════════════════════════════════════════════════ */

function SelfAttentionExplorer() {
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [seed, setSeed] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const NUM_CHANNELS = 8;
  const phases = ['Input', 'Q, K, V', 'Scores (QKᵀ)', 'Output (AV)'];

  const featureMaps = useMemo(() => {
    return Array.from({ length: NUM_CHANNELS }, (_, c) =>
      Array.from({ length: 6 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => {
          const base = Math.sin(c * 0.8) * 0.3 + 0.5;
          const noise = seededRandom(c * 13 + i * 7 + j * 3 + seed) * 0.3;
          return Math.min(255, Math.max(0, (base + noise) * 255));
        })
      )
    );
  }, [seed]);

  const qkv = useMemo(() => {
    const wq = Array.from({ length: NUM_CHANNELS }, (_, i) =>
      Array.from({ length: NUM_CHANNELS }, (_, j) => seededRandom(i * 13 + j * 7 + seed) * 2 - 1)
    );
    const wk = Array.from({ length: NUM_CHANNELS }, (_, i) =>
      Array.from({ length: NUM_CHANNELS }, (_, j) => seededRandom(i * 17 + j * 11 + seed + 200) * 2 - 1)
    );
    const wv = Array.from({ length: NUM_CHANNELS }, (_, i) =>
      Array.from({ length: NUM_CHANNELS }, (_, j) => seededRandom(i * 23 + j * 19 + seed + 400) * 2 - 1)
    );
    const z = featureMaps.map(ch => ch.flat().reduce((a, b) => a + b, 0) / 36 / 255);
    const Q = wq.map(row => row.reduce((s, v, j) => s + v * z[j], 0));
    const K = wk.map(row => row.reduce((s, v, j) => s + v * z[j], 0));
    const V = wv.map(row => row.reduce((s, v, j) => s + v * z[j], 0));
    return { Q, K, V, wq, wk, wv };
  }, [featureMaps, seed]);

  const rawScores = useMemo(() =>
    Array.from({ length: NUM_CHANNELS }, (_, i) =>
      Array.from({ length: NUM_CHANNELS }, (_, j) => qkv.Q[i] * qkv.K[j] / Math.sqrt(NUM_CHANNELS))
    ), [qkv]);

  const attnMatrix = useMemo(() =>
    rawScores.map(row => {
      const max = Math.max(...row);
      const exps = row.map(v => Math.exp(v - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps.map(e => e / sum);
    }), [rawScores]);

  const weightedFeatures = useMemo(() => {
    return featureMaps.map((ch, ci) => {
      const outVal = attnMatrix[ci].reduce((s, w, k) => s + w * qkv.V[k], 0);
      return ch.map(row => row.map(v => (v / 255) * (0.3 + Math.abs(outVal) * 0.7) * 255));
    });
  }, [featureMaps, attnMatrix, qkv]);

  const startAnim = () => {
    stopAnim();
    setIsAnimating(true);
    setAnimPhase(0);
    let phase = 0;
    intervalRef.current = setInterval(() => {
      phase++;
      if (phase >= phases.length) { stopAnim(); return; }
      setAnimPhase(phase);
    }, 1200);
  };

  const stopAnim = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setAnimPhase(0);
  };

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Self-Attention (Non-local)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Models global dependencies across all spatial positions. Every position attends to every other, capturing long-range relationships.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Long-Range Dependencies</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Pose estimation (body parts far apart), video understanding (temporal relationships), semantic segmentation.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">High-Resolution Images</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            O(n²) in spatial size. 512×512 feature map = 262K positions → 69B attention pairs. Use window or sparse attention.
          </p>
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4">
        {!isAnimating ? (
          <button onClick={startAnim}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
            ▶ Animate Pipeline
          </button>
        ) : (
          <button onClick={stopAnim}
            className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 cursor-pointer">
            ⏹ Stop
          </button>
        )}
        <button onClick={() => setSeed(s => s + 1)}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">
          ↻ New Data
        </button>
      </div>

      <div className="flex gap-1 mb-4">
        {phases.map((p, i) => (
          <div key={i}
            className={`flex-1 text-center py-1.5 text-[10px] rounded font-medium transition-all ${
              animPhase >= i
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>{p}</div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {(animPhase < 3 ? featureMaps : weightedFeatures).map((ch, ci) => (
          <div key={ci} className="text-center">
            <svg viewBox="0 0 60 60" className="w-full rounded border border-gray-200 dark:border-gray-700">
              {ch.flat().map((v, pi) => (
                <rect key={pi} x={(pi % 6) * 10} y={Math.floor(pi / 6) * 10} width="10" height="10"
                  fill={`rgba(59, 130, 246, ${Math.min(1, Math.max(0, v / 255))})`} />
              ))}
            </svg>
            <span className="text-[9px] text-gray-500">P{ci}</span>
          </div>
        ))}
      </div>

      {animPhase === 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Q, K, V Projections (per position)</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Query (Q)', values: qkv.Q, bg: '#dbeafe', bar: '#3b82f6' },
              { label: 'Key (K)', values: qkv.K, bg: '#d1fae5', bar: '#10b981' },
              { label: 'Value (V)', values: qkv.V, bg: '#ede9fe', bar: '#8b5cf6' },
            ].map(({ label, values, bg, bar }) => (
              <div key={label}>
                <div className="text-[9px] font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</div>
                <div className="grid grid-cols-4 gap-1">
                  {values.map((v, i) => (
                    <div key={i} className="text-center">
                      <div className="h-8 rounded relative overflow-hidden" style={{ backgroundColor: bg }}>
                        <div className="absolute bottom-0 w-full rounded-t transition-all"
                          style={{ height: `${Math.min(100, Math.abs(v) * 50)}%`, backgroundColor: bar }} />
                      </div>
                      <span className="text-[7px] text-gray-500">{v.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {animPhase === 2 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Raw Scores vs Softmax</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] font-medium text-gray-600 dark:text-gray-400 mb-1">Raw Scores (Q·Kᵀ/√d)</div>
              <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${NUM_CHANNELS}, 1fr)` }}>
                {rawScores.flat().map((v, i) => (
                  <div key={i} className="aspect-square rounded-sm flex items-center justify-center text-[6px]"
                    style={{ backgroundColor: `rgba(251, 191, 36, ${Math.min(1, Math.abs(v) * 2)})`, color: Math.abs(v) > 0.5 ? 'white' : 'inherit' }}>
                    {v.toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-medium text-gray-600 dark:text-gray-400 mb-1">After Softmax (rows sum to 1)</div>
              <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${NUM_CHANNELS}, 1fr)` }}>
                {attnMatrix.flat().map((v, i) => (
                  <div key={i} className="aspect-square rounded-sm flex items-center justify-center text-[6px]"
                    style={{ backgroundColor: `rgba(59, 130, 246, ${v})`, color: v > 0.5 ? 'white' : 'inherit' }}>
                    {v.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-2">Left: raw dot-product scores. Right: softmax normalized to probabilities. Yellow → blue = score → probability.</p>
        </div>
      )}

      {animPhase >= 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Computation Detail</h4>
          <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            {animPhase >= 1 && <p><span className="font-mono text-blue-600 dark:text-blue-400">Q, K, V:</span> Linear projections of input X → Q=XWq, K=XWk, V=XWv</p>}
            {animPhase >= 2 && <p><span className="font-mono text-blue-600 dark:text-blue-400">Scores:</span> A = softmax(QKᵀ / √d_k), d_k = {NUM_CHANNELS}</p>}
            {animPhase >= 3 && <p><span className="font-mono text-blue-600 dark:text-blue-400">Output:</span> Z = AV, weighted sum of values using attention weights</p>}
          </div>
        </div>
      )}

      <button onClick={() => setShowLearn(!showLearn)}
        className="mt-4 w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-center gap-2">
        {showLearn ? '▾ Hide' : '▸ Learn More'} About Self-Attention
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[['analogy', '💡 Analogy'], ['steps', '📝 How It Works'], ['simple', '🐍 PyTorch'], ['scratch', '🔧 From Scratch']].map(([id, label]) => (
                  <button key={id} onClick={() => setLearnTab(id as typeof learnTab)}
                    className={`px-3 py-1 text-xs rounded cursor-pointer ${
                      learnTab === id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}>{label}</button>
                ))}
              </div>
              {learnTab === 'analogy' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-semibold">Classroom Discussion:</p>
                  <p>Students (positions) each have notes (features). <strong>Self-attention</strong> is like each student asking: "Who here has info I need?" (Query). Everyone else shows their credentials (Key). Students weight attention by relevance, then collect notes (Value). Result: everyone updates their understanding based on the whole class — not just neighbors.</p>
                </div>
              )}
              {learnTab === 'steps' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>Step 1 — Project:</strong> Input X is multiplied by three weight matrices: Q=XWq, K=XWk, V=XWv. Each is N×d_k.</p>
                  <p><strong>Step 2 — Score:</strong> Compute attention matrix: scores = QKᵀ / √d_k. Scaling prevents dot products from growing too large with dimension.</p>
                  <p><strong>Step 3 — Normalize:</strong> Apply softmax row-wise so each row sums to 1. This gives probability distribution over keys for each query.</p>
                  <p><strong>Step 4 — Aggregate:</strong> Output Z = softmax(scores) × V. Each position gets a weighted mix of all values.</p>
                </div>
              )}
              {learnTab === 'simple' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch.nn as nn

class SelfAttention2D(nn.Module):
    def __init__(self, channels, heads=4):
        super().__init__()
        self.heads = heads
        self.d_k = channels // heads
        self.qkv = nn.Conv2d(channels, channels * 3, 1)
        self.proj = nn.Conv2d(channels, channels, 1)

    def forward(self, x):
        B, C, H, W = x.shape
        qkv = self.qkv(x).reshape(B, 3, self.heads, self.d_k, H*W)
        q, k, v = qkv[:, 0], qkv[:, 1], qkv[:, 2]
        # Scaled dot-product attention
        attn = (q.transpose(-2,-1) @ k) / (self.d_k ** 0.5)
        attn = attn.softmax(dim=-1)
        out = (v @ attn.transpose(-2,-1)).reshape(B, C, H, W)
        return self.proj(out)

x = torch.randn(1, 256, 16, 16)
print(SelfAttention2D(256)(x).shape)  # (1, 256, 16, 16)`}</div>
              )}
              {learnTab === 'scratch' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn as nn
import math

class SelfAttentionScratch(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.Wq = nn.Linear(dim, dim)
        self.Wk = nn.Linear(dim, dim)
        self.Wv = nn.Linear(dim, dim)
        self.scale = math.sqrt(dim)

    def forward(self, x):
        B, N, C = x.shape  # (batch, tokens, dim)
        Q = self.Wq(x)  # (B, N, C)
        K = self.Wk(x)
        V = self.Wv(x)
        # Scaled dot-product
        scores = torch.bmm(Q, K.transpose(1, 2)) / self.scale
        attn = torch.softmax(scores, dim=-1)  # (B, N, N)
        out = torch.bmm(attn, V)              # (B, N, C)
        return out, attn

model = SelfAttentionScratch(256)
x = torch.randn(2, 64, 256)  # 2 samples, 64 tokens, 256 dim
out, attn = model(x)
print(out.shape)   # (2, 64, 256)
print(attn.shape)  # (2, 64, 64) — full attention matrix`}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   10. QKV Dot-Product Attention
   ═══════════════════════════════════════════════════════════ */

function QKVDemo() {
  const [queryIdx, setQueryIdx] = useState(2);
  const [temperature, setTemperature] = useState(2);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');

  const keys = useMemo(() => [
    { x: 0.2, y: 0.8 }, { x: 0.7, y: 0.3 }, { x: 0.5, y: 0.6 },
    { x: 0.9, y: 0.1 }, { x: 0.1, y: 0.4 }, { x: 0.6, y: 0.9 },
  ], []);

  const query = keys[queryIdx];
  const scores = keys.map(k => (query.x * k.x + query.y * k.y) / temperature);
  const expScores = scores.map(s => Math.exp(s));
  const expSum = expScores.reduce((a, b) => a + b, 0);
  const softmax = expScores.map(e => e / expSum);
  const maxScore = Math.max(...scores.map(Math.abs));
  const entropy = -softmax.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">QKV Dot-Product Attention</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Click any token to make it the query. See how dot-product scores produce attention weights via softmax.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Understanding Mechanism</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Foundational building block. Every Transformer uses this. Understanding dot-product attention is prerequisite to all variants.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Production Use</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Single-head, no masking, no optimization. Use multi-head + Flash Attention for real applications.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Embedding Space (click to query)</h4>
          <svg viewBox="0 0 300 260" className="w-full">
            {keys.map((k, i) => (
              <g key={i}>
                <line x1={40 + query.x * 220} y1={40 + query.y * 180}
                  x2={40 + k.x * 220} y2={40 + k.y * 180}
                  stroke="#3b82f6" strokeWidth={softmax[i] * 8} opacity={softmax[i] * 0.8} />
                <circle cx={40 + k.x * 220} cy={40 + k.y * 180} r={i === queryIdx ? 14 : 10}
                  fill={i === queryIdx ? '#3b82f6' : '#9ca3af'}
                  stroke={i === queryIdx ? '#1d4ed8' : '#6b7280'} strokeWidth="2"
                  className="cursor-pointer" onClick={() => setQueryIdx(i)} />
                <text x={40 + k.x * 220} y={40 + k.y * 180 + (i === queryIdx ? 28 : 22)} textAnchor="middle"
                  className="text-[10px] fill-gray-500">T{i}</text>
              </g>
            ))}
          </svg>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Temperature:</span>
            <input type="range" min="0.5" max="5" step="0.5" value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="flex-1 cursor-pointer" />
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{temperature}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Temperature τ divides raw scores before softmax: <span className="font-mono">softmax(scores / τ)</span>.
            Low τ → sharper peaks (confident), High τ → smoother (uncertain).
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Attention Distribution <span className="font-normal text-gray-500">Query: T{queryIdx}</span>
            </h4>
            <div className="space-y-1.5">
              {softmax.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] w-6 text-gray-500">T{i}</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <motion.div className="h-full bg-blue-500 rounded" initial={{ width: 0 }}
                      animate={{ width: `${w * 100}%` }} transition={{ duration: 0.4 }} />
                  </div>
                  <span className="text-[10px] font-mono w-10 text-right">{(w * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
              <div className="text-[10px] text-gray-500">Q·Q (self)</div>
              <div className="font-mono text-sm">{scores[queryIdx].toFixed(3)}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
              <div className="text-[10px] text-gray-500">Max score</div>
              <div className="font-mono text-sm">{maxScore.toFixed(3)}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
              <div className="text-[10px] text-gray-500">Entropy</div>
              <div className="font-mono text-sm">{entropy.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setShowLearn(!showLearn)}
        className="mt-4 w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-center gap-2">
        {showLearn ? '▾ Hide' : '▸ Learn More'} About QKV
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[['analogy', '💡 Analogy'], ['steps', '📝 How It Works'], ['simple', '🐍 PyTorch'], ['scratch', '🔧 From Scratch']].map(([id, label]) => (
                  <button key={id} onClick={() => setLearnTab(id as typeof learnTab)}
                    className={`px-3 py-1 text-xs rounded cursor-pointer ${
                      learnTab === id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}>{label}</button>
                ))}
              </div>
              {learnTab === 'analogy' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-semibold">Library Search:</p>
                  <p>You want info about "deep learning" (<strong>Query</strong>). Each book has a title (<strong>Key</strong>) and content (<strong>Value</strong>). You compute relevance: dot your query with each title → high score = relevant book. Softmax turns scores into probabilities. Final result: weighted mix of book contents, with the most relevant books contributing most.</p>
                </div>
              )}
              {learnTab === 'steps' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>Step 1:</strong> Q, K, V are linear projections of input. Q asks "what am I looking for?", K says "what do I contain?", V is the actual content.</p>
                  <p><strong>Step 2:</strong> Score = Q · Kᵀ (dot product). Measures similarity between query and each key.</p>
                  <p><strong>Step 3:</strong> Scale by √d_k to prevent large values that push softmax into saturation.</p>
                  <p><strong>Step 4:</strong> Softmax normalizes scores to probabilities. Output = weighted sum of V.</p>
                </div>
              )}
              {learnTab === 'simple' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn.functional as F

def dot_product_attention(Q, K, V):
    """
    Q: (batch, seq_len, dim)
    K: (batch, seq_len, dim)
    V: (batch, seq_len, dim)
    """
    d_k = Q.size(-1)
    scores = torch.bmm(Q, K.transpose(1, 2)) / (d_k ** 0.5)
    weights = F.softmax(scores, dim=-1)
    return torch.bmm(weights, V), weights

# Example
batch, seq, dim = 1, 4, 8
Q = torch.randn(batch, seq, dim)
K = torch.randn(batch, seq, dim)
V = torch.randn(batch, seq, dim)
out, attn = dot_product_attention(Q, K, V)
print(out.shape)  # (1, 4, 8)`}</div>
              )}
              {learnTab === 'scratch' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn as nn
import math

class DotProductAttention(nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.Wq = nn.Linear(dim, dim)
        self.Wk = nn.Linear(dim, dim)
        self.Wv = nn.Linear(dim, dim)
        self.scale = math.sqrt(dim)

    def forward(self, x):
        Q = self.Wq(x)
        K = self.Wk(x)
        V = self.Wv(x)
        scores = Q @ K.transpose(-2, -1) / self.scale
        attn = torch.softmax(scores, dim=-1)
        return attn @ V, attn

# Test
model = DotProductAttention(64)
x = torch.randn(1, 10, 64)  # 10 tokens, dim 64
out, weights = model(x)
print(out.shape)    # (1, 10, 64)
print(weights.shape) # (1, 10, 10)`}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   11. Attention Patterns
   ═══════════════════════════════════════════════════════════ */

function AttentionPatterns() {
  const [pattern, setPattern] = useState<'local' | 'dilated' | 'global' | 'strided'>('local');
  const [kernelSize, setKernelSize] = useState(3);
  const [selected, setSelected] = useState(40);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const gridSize = 9;

  const getAttended = (idx: number): number[] => {
    const row = Math.floor(idx / gridSize), col = idx % gridSize;
    const result: number[] = [idx];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (r === row && c === col) continue;
        const d = Math.max(Math.abs(r - row), Math.abs(c - col));
        if (pattern === 'local' && d <= Math.floor(kernelSize / 2)) result.push(r * gridSize + c);
        if (pattern === 'dilated' && (r - row) % Math.max(1, kernelSize - 1) === 0 && (c - col) % Math.max(1, kernelSize - 1) === 0) result.push(r * gridSize + c);
        if (pattern === 'global') result.push(r * gridSize + c);
        if (pattern === 'strided' && (r * gridSize + c - idx) % Math.max(2, kernelSize) === 0) result.push(r * gridSize + c);
      }
    }
    return result;
  };

  const attended = getAttended(selected);

  const descriptions: Record<string, string> = {
    local: `Each token attends to its ${kernelSize}×${kernelSize} local neighborhood. Captures nearby patterns like edges and textures.`,
    dilated: `Attends to tokens at dilated intervals (step=${Math.max(1, kernelSize - 1)}). Expands receptive field without increasing params.`,
    global: 'Every token attends to all others. Maximum context but O(n²) cost.',
    strided: `Every ${Math.max(2, kernelSize)}-th token is attended. Coarse sampling for efficiency.`,
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Attention Patterns</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Visualize how different attention patterns connect tokens on a 9×9 grid. Click any cell to change the query.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-600 font-bold text-xs">✓ BEST</span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Efficiency Trade-offs</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Local/dilated patterns reduce O(n²) to O(n×k²). Window attention (Swin) uses local patterns for linear complexity.
          </p>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose-600 font-bold text-xs">✗ WORST</span>
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Long Dependencies</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            Local attention cannot capture relationships between distant tokens. Use global or cross-window attention for long-range.
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {(['local', 'dilated', 'global', 'strided'] as const).map(p => (
          <button key={p} onClick={() => setPattern(p)}
            className={`flex-1 py-1.5 text-xs rounded cursor-pointer ${
              pattern === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
        ))}
      </div>

      {pattern !== 'global' && (
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Kernel/Step Size: <span className="text-blue-600 dark:text-blue-400">{kernelSize}</span>
          </label>
          <input type="range" min="2" max="6" step="1" value={kernelSize}
            onChange={e => setKernelSize(parseInt(e.target.value))}
            className="w-full cursor-pointer" />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex justify-center">
          <div className="inline-grid gap-px" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const isSelected = i === selected;
              const isAttended = attended.includes(i);
              return (
                <button key={i} onClick={() => setSelected(i)}
                  className={`w-7 h-7 rounded-sm cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' :
                    isAttended ? 'bg-blue-400/30 text-blue-700 dark:text-blue-300 hover:bg-blue-400/50' :
                    'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`} />
              );
            })}
          </div>
        </div>
        {pattern !== 'global' && (
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span>Window: {kernelSize}×{kernelSize}</span>
              <span>·</span>
              <span>Reach: ±{Math.floor(kernelSize / 2)} cells</span>
              {pattern === 'dilated' && <><span>·</span><span>Step: {kernelSize - 1}</span></>}
              {pattern === 'strided' && <><span>·</span><span>Every {kernelSize}-th</span></>}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">{descriptions[pattern]}</p>
        <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
          <span>Attended: {attended.length}</span>
          <span>Total: {gridSize * gridSize}</span>
          <span>Sparsity: {(100 - (attended.length / (gridSize * gridSize)) * 100).toFixed(0)}%</span>
        </div>
      </div>

      <button onClick={() => setShowLearn(!showLearn)}
        className="mt-4 w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-center gap-2">
        {showLearn ? '▾ Hide' : '▸ Learn More'} About Patterns
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[['analogy', '💡 Analogy'], ['steps', '📝 How It Works'], ['simple', '🐍 PyTorch'], ['scratch', '🔧 From Scratch']].map(([id, label]) => (
                  <button key={id} onClick={() => setLearnTab(id as typeof learnTab)}
                    className={`px-3 py-1 text-xs rounded cursor-pointer ${
                      learnTab === id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}>{label}</button>
                ))}
              </div>
              {learnTab === 'analogy' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-semibold">Gossip Network:</p>
                  <p><strong>Local:</strong> You only talk to neighbors (3×3 block). <strong>Dilated:</strong> You skip every other person (wider reach). <strong>Global:</strong> Everyone talks to everyone (town hall). <strong>Strided:</strong> Only every Nth person is contacted (efficient broadcast). Real networks use combinations — local within groups, global between representatives.</p>
                </div>
              )}
              {learnTab === 'steps' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>Local:</strong> Standard convolution-like attention. Token at (r,c) attends to all (r±d, c±d) where d ≤ ⌊k/2⌋.</p>
                  <p><strong>Dilated:</strong> Like dilated convolution. Skips positions at intervals of (k-1). Captures wider context with same number of connections.</p>
                  <p><strong>Global:</strong> Full N×N attention matrix. Every token sees everything. Maximum context, maximum cost.</p>
                  <p><strong>Strided:</strong> Only every k-th token is attended. Reduces connections by factor of k but may miss important tokens.</p>
                </div>
              )}
              {learnTab === 'simple' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn as nn

class LocalAttention(nn.Module):
    def __init__(self, dim, window_size=7):
        super().__init__()
        self.w = window_size
        self.attn = nn.MultiheadAttention(dim, num_heads=4, batch_first=True)

    def forward(self, x):
        B, N, C = x.shape
        # Create block-diagonal mask for local windows
        mask = torch.zeros(N, N, dtype=torch.bool)
        for i in range(N):
            for j in range(N):
                if abs(i - j) > self.w // 2:
                    mask[i, j] = True  # True = masked out
        out, _ = self.attn(x, x, x, attn_mask=mask)
        return out

# Dilated: use stride > 1 in the window
# Global: no mask (full attention)
# Strided: subsample tokens before attention`}</div>
              )}
              {learnTab === 'scratch' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch
import torch.nn as nn
import math

def local_attention_mask(seq_len, window_size):
    """Create mask for local window attention."""
    mask = torch.full((seq_len, seq_len), float('-inf'))
    for i in range(seq_len):
        for j in range(seq_len):
            if abs(i - j) <= window_size // 2:
                mask[i, j] = 0.0
    return mask

def dilated_mask(seq_len, kernel_size, dilation):
    """Create mask for dilated attention."""
    mask = torch.full((seq_len, seq_len), float('-inf'))
    for i in range(seq_len):
        for j in range(seq_len):
            if (i - j) % dilation == 0 and abs(i - j) <= kernel_size // 2 * dilation:
                mask[i, j] = 0.0
    return mask

# Apply masks with scaled dot-product attention
x = torch.randn(1, 16, 64)
mask = local_attention_mask(16, window_size=5)
attn = nn.MultiheadAttention(64, 4, batch_first=True)
out, _ = attn(x, x, x, attn_mask=mask)
print(out.shape)  # (1, 16, 64)`}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   12. Attention Evolution Timeline
   ═══════════════════════════════════════════════════════════ */

function AttentionEvolution() {
  const [selected, setSelected] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');

  const milestones = [
    { name: 'SE-Net', year: 2018, venue: 'CVPR', params: '+2-3%', gain: '~1-2%', idea: 'Channel-wise recalibration via squeeze-excitation', impact: 'Won ImageNet 2017. Spawned dozens of channel attention variants.' },
    { name: 'Non-local', year: 2018, venue: 'CVPR', params: '+50%', gain: '~1-3%', idea: 'Global self-attention for video understanding', impact: 'Brought NLP self-attention to vision. Foundation for ViT.' },
    { name: 'CBAM', year: 2018, venue: 'ECCV', params: '+3-5%', gain: '~1-2%', idea: 'Sequential channel + spatial attention', impact: 'Demonstrated spatial attention value. Widely adopted in detection.' },
    { name: 'BAM', year: 2018, venue: 'arXiv', params: '+4%', gain: '~1%', idea: 'Parallel channel + spatial attention', impact: 'Showed parallel vs sequential design trade-offs.' },
    { name: 'SENet++', year: 2019, venue: 'arXiv', params: '+3%', gain: '~0.5%', idea: 'Residual SE connections and compound scaling', impact: 'Improved SE with architectural refinements.' },
    { name: 'ECA-Net', year: 2020, venue: 'CVPR', params: '<1%', gain: '~1%', idea: 'Efficient channel attention via 1D convolution', impact: 'Near-zero overhead. Proved channel attention can be ultra-lightweight.' },
    { name: 'Coordinate Attn', year: 2021, venue: 'CVPR', params: '+2%', gain: '~1-2%', idea: 'Embed spatial coordinates into channel attention', impact: 'Better spatial awareness for mobile detectors.' },
    { name: 'ViT (MHA)', year: 2021, venue: 'ICLR', params: 'Baseline', gain: '~5-10%', idea: 'Pure Transformer for image classification', impact: 'Paradigm shift: attention replaced convolutions as primary primitive.' },
  ];

  const m = milestones[selected];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Evolution of Attention in Vision</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Timeline of key attention mechanisms in computer vision, from simple channel gating to full Transformers.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {milestones.map((ms, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`px-3 py-1.5 text-xs rounded cursor-pointer whitespace-nowrap transition-all ${
              selected === i
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}>
            <span className="font-medium">{ms.name}</span>
            <span className="ml-1 opacity-60">{ms.year}</span>
          </button>
        ))}
      </div>

      <motion.div key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-semibold text-blue-600 dark:text-blue-400">{m.name}</span>
          <span className="text-xs text-gray-500">{m.year} · {m.venue}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
            <div className="text-[10px] text-gray-500">Params</div>
            <div className="font-mono text-sm font-semibold">{m.params}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-center">
            <div className="text-[10px] text-gray-500">Gain</div>
            <div className="font-mono text-sm font-semibold">{m.gain}</div>
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{m.idea}</p>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded border-l-4 border-blue-500">
          <p className="text-xs text-gray-600 dark:text-gray-400">{m.impact}</p>
        </div>
      </motion.div>

      <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
        {milestones.map((ms, i) => (
          <React.Fragment key={i}>
            <span className={`text-[10px] whitespace-nowrap ${i <= selected ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400'}`}>
              {ms.year}
            </span>
            {i < milestones.length - 1 && <span className="text-gray-300 dark:text-gray-600">---</span>}
          </React.Fragment>
        ))}
      </div>

      <button onClick={() => setShowLearn(!showLearn)}
        className="mt-4 w-full px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 cursor-pointer flex items-center justify-center gap-2">
        {showLearn ? '▾ Hide' : '▸ Learn More'} About Evolution
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[['analogy', '💡 Analogy'], ['steps', '📝 How It Works'], ['simple', '🐍 PyTorch'], ['scratch', '🔧 From Scratch']].map(([id, label]) => (
                  <button key={id} onClick={() => setLearnTab(id as typeof learnTab)}
                    className={`px-3 py-1 text-xs rounded cursor-pointer ${
                      learnTab === id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-500 hover:text-gray-700'
                    }`}>{label}</button>
                ))}
              </div>
              {learnTab === 'analogy' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p className="font-semibold">Evolution of Communication:</p>
                  <p><strong>SE-Net</strong> = choosing which phone lines to prioritize. <strong>CBAM</strong> = prioritizing lines AND directing calls to specific rooms. <strong>Non-local</strong> = everyone in a building can call anyone else directly. <strong>ViT</strong> = replacing the phone system entirely with a chat room where everyone broadcasts to everyone.</p>
                </div>
              )}
              {learnTab === 'steps' && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>2018 — Channel Attention:</strong> SE-Net showed that recalibrating feature channels is cheap (+2% params) and effective (+1-2% accuracy).</p>
                  <p><strong>2018 — Spatial + Channel:</strong> CBAM added spatial attention on top, showing that WHERE to look matters as much as WHAT to look at.</p>
                  <p><strong>2018 — Global Dependencies:</strong> Non-local brought NLP self-attention to vision, enabling long-range relationships at the cost of O(n²).</p>
                  <p><strong>2021 — Pure Attention:</strong> ViT replaced convolutions entirely with Transformer blocks, achieving SOTA with enough data.</p>
                </div>
              )}
              {learnTab === 'simple' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`import torch.nn as nn

# 2018: SE-Net (Channel Attention)
se = nn.Sequential(
    nn.AdaptiveAvgPool2d(1),
    nn.Flatten(),
    nn.Linear(256, 16), nn.ReLU(), nn.Linear(16, 256), nn.Sigmoid()
)

# 2018: CBAM (Channel + Spatial)
channel_att = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(),
    nn.Linear(256, 16), nn.ReLU(), nn.Linear(16, 256), nn.Sigmoid())
spatial_att = nn.Conv2d(2, 1, 7, padding=3)

# 2018: Non-local (Global Self-Attention)
non_local = nn.MultiheadAttention(256, num_heads=8, batch_first=True)

# 2021: ViT (Pure Transformer)
vit_block = nn.TransformerEncoderLayer(d_model=768, nhead=12, batch_first=True)`}</div>
              )}
              {learnTab === 'scratch' && (
                <div className="text-xs font-mono bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`# Evolution of attention — key implementations
import torch
import torch.nn as nn
import math

# Stage 1: SE-Net (2018) — Channel recalibration
class SEBlock(nn.Module):
    def __init__(self, ch, r=16):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
            nn.Linear(ch, ch//r), nn.ReLU(), nn.Linear(ch//r, ch), nn.Sigmoid())
    def forward(self, x):
        return x * self.fc(x).view(x.size(0), -1, 1, 1)

# Stage 2: Non-local (2018) — Global self-attention
class NonLocal(nn.Module):
    def __init__(self, ch):
        super().__init__()
        self.theta = nn.Conv2d(ch, ch//2, 1)
        self.phi = nn.Conv2d(ch, ch//2, 1)
        self.g = nn.Conv2d(ch, ch//2, 1)
        self.W = nn.Conv2d(ch//2, ch, 1)
    def forward(self, x):
        B, C, H, W = x.shape
        q = self.theta(x).view(B, -1, H*W).permute(0,2,1)
        k = self.phi(x).view(B, -1, H*W)
        v = self.g(x).view(B, -1, H*W)
        attn = torch.softmax(q @ k / math.sqrt(C//2), dim=-1)
        out = (v @ attn.permute(0,2,1)).view(B, -1, H, W)
        return x + self.W(out)

# Stage 3: ViT Block (2021) — Pure attention
class ViTBlock(nn.Module):
    def __init__(self, dim, heads=12):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, heads, batch_first=True)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(nn.Linear(dim, dim*4), nn.GELU(), nn.Linear(dim*4, dim))
    def forward(self, x):
        h = self.norm1(x)
        x = x + self.attn(h, h, h)[0]
        return x + self.mlp(self.norm2(x))

# Test
x = torch.randn(1, 64, 256)
print("SE:", SEBlock(256)(torch.randn(1,256,8,8)).shape)
print("NonLocal:", NonLocal(256)(torch.randn(1,256,8,8)).shape)
print("ViT:", ViTBlock(256)(x).shape)`}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */

export default function AdvancedAttentionPlayground() {
  const [section, setSection] = useState<Section>('mha');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'se', label: 'SE-Net', icon: '📊' },
    { id: 'cbam', label: 'CBAM', icon: '🎯' },
    { id: 'self-attention', label: 'Self-Attn', icon: '🔗' },
    { id: 'qkv', label: 'QKV', icon: '⚡' },
    { id: 'patterns', label: 'Patterns', icon: '🔲' },
    { id: 'evolution', label: 'Evolution', icon: '📜' },
    { id: 'mha', label: 'Multi-Head', icon: '🔀' },
    { id: 'gqa', label: 'Grouped Query', icon: '📦' },
    { id: 'sparse', label: 'Sparse', icon: '🔲' },
    { id: 'flash', label: 'Flash Attn', icon: '⚡' },
    { id: 'cross', label: 'Cross-Attn', icon: '🔗' },
    { id: 'window', label: 'Window', icon: '🪟' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Attention Mechanisms</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Interactive playground covering all attention mechanisms — from foundational SE-Net, CBAM, and QKV mechanics
          to advanced Multi-Head, GQA, Flash, and Window attention. Each section includes analogies, step-by-step
          explanations, and both simple PyTorch and from-scratch implementations.
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
          {section === 'se' && <SENetExplorer />}
          {section === 'cbam' && <CBAMExplorer />}
          {section === 'self-attention' && <SelfAttentionExplorer />}
          {section === 'qkv' && <QKVDemo />}
          {section === 'patterns' && <AttentionPatterns />}
          {section === 'evolution' && <AttentionEvolution />}
          {section === 'mha' && <MultiHeadExplorer />}
          {section === 'gqa' && <GroupedQueryAttention />}
          {section === 'sparse' && <SparseAttention />}
          {section === 'flash' && <FlashAttentionViz />}
          {section === 'cross' && <CrossAttentionDemo />}
          {section === 'window' && <WindowAttention />}
        </motion.div>
      </div>
    </div>
  );
}
