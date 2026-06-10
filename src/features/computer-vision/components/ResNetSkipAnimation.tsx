'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResNetSkipAnimation() {
  const [showSkip, setShowSkip] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);
  const [depth, setDepth] = useState(18);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phases = [
    'Input enters the residual block',
    'Pathway 1: Input goes through Conv → ReLU → Conv layers',
    'Pathway 2 (skip): Input bypasses layers via shortcut connection',
    'Output = F(x) + x — the two paths merge via element-wise addition',
  ];

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
    setAnimPhase(0);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(0);
    intervalRef.current = setInterval(() => {
      setAnimPhase(prev => {
        if (prev >= phases.length - 1) {
          stopAnim();
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  }, [stopAnim]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  const depths = [18, 34, 50, 101, 152];
  const depthColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">ResNet Skip Connection Animation</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Skip connections (residual connections) allow gradients to flow directly through the network,
          enabling training of very deep architectures. Watch how the skip path bypasses the conv layers.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={showSkip}
                onChange={(e) => setShowSkip(e.target.checked)}
                className="w-4 h-4" />
              Show Skip Connection
            </label>
            <button onClick={isAnimating ? stopAnim : startAnim}
              className={`px-4 py-2 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
              {isAnimating ? 'Stop Animation' : 'Animate Flow'}
            </button>
            <div className="ml-4">
              <label className="block text-xs font-medium mb-1">ResNet Depth</label>
              <div className="flex gap-1">
                {depths.map((d) => (
                  <button key={d} onClick={() => setDepth(d)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${depth === d ? 'text-white ring-2 ring-blue-400' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'} ${depthColors[depths.indexOf(d)]}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center gap-0">
            <div className="flex flex-col items-center z-10">
              <motion.div
                animate={animPhase >= 0 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.5 }}
                className="w-20 h-10 bg-blue-100 border-2 border-blue-400 rounded flex items-center justify-center text-xs font-semibold"
              >
                Input x
              </motion.div>
            </div>

            <div className="flex flex-col items-center relative">
              {showSkip && (
                <motion.div
                  animate={animPhase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.9 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1"
                >
                  <motion.div
                    animate={animPhase === 2 ? { x: [0, 60], opacity: [1, 0.7] } : {}}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 z-20"
                  >
                    skip path
                  </motion.div>
                </motion.div>
              )}

              <div className="flex flex-col gap-2 py-6 px-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 mx-4 relative">
                <motion.div
                  animate={animPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.4, y: -5 }}
                  className="px-6 py-2 bg-purple-100 border-2 border-purple-400 rounded text-xs font-semibold text-center"
                >
                  Conv 3×3
                </motion.div>
                <motion.div
                  animate={animPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.4, y: -5 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-2 bg-yellow-100 border-2 border-yellow-400 rounded text-xs font-semibold text-center"
                >
                  ReLU
                </motion.div>
                <motion.div
                  animate={animPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.4, y: -5 }}
                  transition={{ delay: 0.4 }}
                  className="px-6 py-2 bg-purple-100 border-2 border-purple-400 rounded text-xs font-semibold text-center"
                >
                  Conv 3×3
                </motion.div>
              </div>

              {showSkip && animPhase >= 2 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="absolute top-0 left-0 h-full border-t-2 border-emerald-400 pointer-events-none"
                  style={{ borderStyle: 'dashed', transform: 'translateY(-52px)' }}
                />
              )}

              <motion.div
                animate={animPhase >= 3 ? {
                  scale: [1, 1.15, 1],
                  backgroundColor: ['#fef3c7', '#d1fae5', '#fef3c7'],
                } : {}}
                transition={{ duration: 0.8 }}
                className="mt-2 w-24 h-12 bg-yellow-50 border-2 border-yellow-400 rounded flex items-center justify-center text-xs font-semibold"
              >
                H(x) = F(x) + x
              </motion.div>
            </div>

            <div className="flex flex-col items-center z-10">
              <motion.div
                animate={animPhase >= 3 ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.5 }}
                className="w-20 h-10 bg-emerald-100 border-2 border-emerald-400 rounded flex items-center justify-center text-xs font-semibold"
              >
                Output
              </motion.div>
            </div>
          </div>

          {showSkip && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
              <line x1="0" y1="0" x2="100" y2="0" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isAnimating && (
            <motion.div key={animPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                  {animPhase + 1}
                </div>
                <p className="text-sm text-indigo-900">{phases[animPhase]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400"
          >
            <h3 className="font-semibold text-sm mb-2">The Residual Formula</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="font-mono text-purple-700">H(x) = F(x) + x</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Instead of learning H(x) directly, the block learns the residual F(x) = H(x) - x.
                If the identity is optimal, the block can simply set F(x) = 0.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400"
          >
            <h3 className="font-semibold text-sm mb-2">Why ResNet-{depth}?</h3>
            <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
              <div>ResNet-{depth} has {depth} weight layers.</div>
              {depth <= 34 && <div>Uses basic residual blocks (two 3×3 convs).</div>}
              {depth >= 50 && <div>Uses bottleneck blocks (1×1 → 3×3 → 1×1) for efficiency.</div>}
              <div className="text-emerald-700 font-medium mt-1">
                Skip connections make training {depth}-layer networks possible!
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Key Insight</h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p>Without skip connections, deeper networks suffer from the <strong>degradation problem</strong> — accuracy saturates then degrades rapidly as depth increases. Skip connections provide a direct gradient highway, allowing effective training of networks with 50+ layers.</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <strong>Paper:</strong> "Deep Residual Learning for Image Recognition" (He et al., 2015)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
