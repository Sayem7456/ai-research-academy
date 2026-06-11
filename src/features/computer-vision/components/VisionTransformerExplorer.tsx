'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function VisionTransformerExplorer() {
  const [patchSize, setPatchSize] = useState(16);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAttention, setShowAttention] = useState(true);
  const [attentionHead, setAttentionHead] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const imageSize = 224;
  const patchesPerSide = imageSize / patchSize;
  const numPatches = patchesPerSide * patchesPerSide;

  const phases = [
    'Input image (224×224×3)',
    'Split into patches',
    'Flatten each patch to a vector',
    'Linear projection to embedding dimension (768)',
    'Add position embeddings + [CLS] token',
    'Process through Transformer encoder (12 layers)',
    'Extract [CLS] token → classify',
  ];

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(0);
    let e = 0;
    intervalRef.current = setInterval(() => {
      e++;
      setAnimPhase(e);
      if (e >= phases.length - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, 1000);
  }, []);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  const attentionData = useMemo(() => {
    const data: number[][] = [];
    const p = Math.min(8, patchesPerSide);
    for (let i = 0; i < p; i++) {
      data[i] = [];
      for (let j = 0; j < p; j++) {
        data[i][j] = Math.round(Math.sin((i + attentionHead) * 0.5 + j * 0.3 + attentionHead * 0.7) * 40 + 50 + seededRandom(i * 13 + j * 7 + attentionHead * 31) * 10);
      }
    }
    return data;
  }, [attentionHead, patchesPerSide]);

  const renderPatchGrid = () => {
    const displaySize = Math.min(patchesPerSide, 14);
    const cellSize = 20;
    const totalSize = cellSize * displaySize;

    return (
      <svg width={totalSize} height={totalSize} className="border border-gray-300 dark:border-gray-600 rounded">
        {Array.from({ length: displaySize }).map((_, i) =>
          Array.from({ length: displaySize }).map((_, j) => {
            const hue = ((i * displaySize + j) * 360) / (displaySize * displaySize);
            const isActive = animPhase >= 2;
            return (
              <motion.rect
                key={`${i}-${j}`}
                x={j * cellSize}
                y={i * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={`hsla(${hue}, ${isActive ? '70%' : '30%'}, ${isActive ? '75%' : '85%'}, ${isActive ? 1 : 0.5})`}
                stroke="#94a3b8"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i * displaySize + j) * 0.003 }}
              />
            );
          })
        )}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Vision Transformer Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ViT treats an image as a sequence of patches and processes them with a standard Transformer
          encoder — no convolutions needed. Explore how images are transformed into patch embeddings.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Patch Size: {patchSize}×{patchSize}</label>
              <input type="range" min="8" max="32" step="8" value={patchSize}
                onChange={(e) => setPatchSize(parseInt(e.target.value))}
                className="w-full" />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{numPatches} patches</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Attention Head</label>
              <input type="range" min="0" max="11" step="1" value={attentionHead}
                onChange={(e) => setAttentionHead(parseInt(e.target.value))}
                className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" checked={showAttention}
                  onChange={(e) => setShowAttention(e.target.checked)}
                  className="w-4 h-4" />
                Show Attention
              </label>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={isAnimating ? stopAnim : startAnim}
                className={`px-4 py-2 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                {isAnimating ? 'Stop' : 'Animate Pipeline'}
              </button>
              <button onClick={() => { stopAnim(); setAnimPhase(0); }}
                className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-2">Image → Patches</h3>
            <div className="relative">
              <motion.div
                animate={animPhase >= 1 ? { opacity: 1 } : { opacity: 0.6 }}
              >
                {renderPatchGrid()}
              </motion.div>
              <AnimatePresence>
                {animPhase >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-purple-600 dark:text-purple-400 font-mono"
                  >
                    Each patch → 768-dim vector
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-2">Embedding</h3>
            <motion.div
              animate={animPhase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.95 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-[2px] flex-wrap justify-center max-w-[160px]">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor: i < numPatches ? `hsl(${(i * 30 + patchSize * 10) % 360}, 70%, 70%)` : '#e5e7eb',
                    }}
                    className="w-5 h-5 rounded-[2px] border border-gray-200 dark:border-gray-700"
                    style={{ opacity: i < numPatches ? 1 : 0.3 }}
                  />
                ))}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">196 × 768</div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-2">Self-Attention</h3>
            {showAttention && (
              <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                {attentionData.slice(0, 8).map((row, i) => (
                  <div key={i} className="flex">
                    {row.map((val, j) => (
                      <motion.div
                        key={j}
                        animate={{ opacity: animPhase >= 4 ? 1 : 0.3 }}
                        className="w-5 h-5 border border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: `rgba(99,102,241,${val / 100})` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Attention scores (head {attentionHead + 1})</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isAnimating && (
            <motion.div key={animPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                  {animPhase + 1}
                </div>
                <p className="text-sm text-indigo-900 dark:text-indigo-200">{phases[animPhase]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400"
          >
            <h3 className="font-semibold text-sm mb-2">Patch Embedding</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Each patch (16×16×3 = 768 pixels) is flattened and linearly projected to a
              768-dimensional embedding. This is equivalent to a 16×16 convolution with 768 output channels.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400"
          >
            <h3 className="font-semibold text-sm mb-2">Position Embeddings</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Since self-attention is permutation-invariant, ViT adds learnable 1D position embeddings
              to retain spatial information. A [CLS] token is prepended for classification.
            </p>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">ViT Pipeline</h3>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-3 rounded border space-y-1">
            <div>Input (224×224×3)</div>
            <div className="text-purple-600 dark:text-purple-400">→ Patch embed (16×16) → 196 patches × 768d</div>
            <div className="text-amber-600 dark:text-amber-400">→ + Position embeddings → 197 × 768 (added [CLS])</div>
            <div className="text-blue-600 dark:text-blue-400">→ Transformer × 12 layers (MSA + FFN)</div>
            <div className="text-green-600 dark:text-green-400">→ Extract [CLS] → MLP → Class scores</div>
          </div>
        </div>
      </div>
    </div>
  );
}
