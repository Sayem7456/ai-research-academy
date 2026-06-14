'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LAYERS = [
  { name: 'Input Embeddings', color: '#3b82f6' },
  { name: 'Positional Encoding', color: '#8b5cf6' },
  { name: 'Multi-Head Attention', color: '#22c55e' },
  { name: 'Add & Norm', color: '#eab308' },
  { name: 'Feed Forward', color: '#ef4444' },
  { name: 'Add & Norm', color: '#f97316' },
  { name: 'Output', color: '#06b6d4' },
];

export default function TransformerAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = LAYERS.length;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAnimating(false);
    setCurrentStep(0);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setCurrentStep(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= totalSteps - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, 1200);
  }, [totalSteps]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stepDetails = [
    {
      title: 'Input Embeddings',
      description: 'Token IDs are converted to dense vectors of dimension d_model.',
      math: 'embedding = Embed(token_id)',
    },
    {
      title: 'Positional Encoding',
      description: 'Sine/cosine functions inject position information since Transformers have no recurrence.',
      math: 'PE(pos, 2i) = sin(pos / 10000^(2i/d))',
    },
    {
      title: 'Multi-Head Self-Attention',
      description: 'Each token attends to all others in parallel. Multiple heads capture different relationships.',
      math: 'head_i = Attention(QW_i^Q, KW_i^K, VW_i^V)',
    },
    {
      title: 'Add & Layer Norm (Residual)',
      description: 'Residual connection preserves original signal. LayerNorm stabilizes training.',
      math: 'output = LayerNorm(x + sublayer(x))',
    },
    {
      title: 'Position-wise Feed Forward',
      description: 'Two linear layers with ReLU/GELU activation. Applied independently to each position.',
      math: 'FFN(x) = max(0, xW₁ + b₁)W₂ + b₂',
    },
    {
      title: 'Add & Layer Norm (Residual)',
      description: 'Second residual connection and normalization after the feed-forward network.',
      math: 'output = LayerNorm(x + FFN(x))',
    },
    {
      title: 'Output',
      description: 'Final representation is projected back to vocabulary size for next token prediction.',
      math: 'logits = output × W_vocab',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Transformer Animation</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Watch how data flows through a Transformer layer. The architecture uses self-attention and feed-forward networks with residual connections.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={isAnimating ? stopAnim : startAnim}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAnimating ? '■ Stop' : '▶ Animate'}
              </button>
              <button
                onClick={() => { stopAnim(); setCurrentStep(0); }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} / {totalSteps}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-4">Architecture Flow</h3>
            <div className="space-y-1">
              {LAYERS.map((layer, i) => (
                <motion.div
                  key={i}
                  animate={{
                    backgroundColor: i <= currentStep ? layer.color + '20' : 'transparent',
                    borderColor: i <= currentStep ? layer.color : '#d1d5db',
                    scale: i === currentStep ? 1.02 : 1,
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: i <= currentStep ? layer.color : '#9ca3af' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{layer.name}</span>
                  </div>
                  {i < LAYERS.length - 1 && i < currentStep && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      className="absolute -bottom-1 left-6 w-0.5 h-2 bg-gray-300"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 rounded-lg border-l-4"
                style={{ borderColor: LAYERS[currentStep].color, backgroundColor: LAYERS[currentStep].color + '10' }}
              >
                <h4 className="font-bold text-lg mb-2">{stepDetails[currentStep].title}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {stepDetails[currentStep].description}
                </p>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <code className="text-sm font-mono text-purple-600 dark:text-purple-400">
                    {stepDetails[currentStep].math}
                  </code>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
          <h3 className="font-semibold text-sm mb-2">Key Concepts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Residual Connections:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Skip connections prevent vanishing gradients in deep networks.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Layer Normalization:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Normalizes across features for stable training dynamics.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Parallel Processing:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Unlike RNNs, all positions are processed simultaneously.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Position Encoding:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Required because self-attention is permutation-invariant.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
