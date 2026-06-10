'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const SAMPLE_FEATURE_MAP = [
  [10, 25, 80, 95, 30, 45],
  [15, 20, 70, 85, 35, 40],
  [50, 60, 12, 18, 90, 100],
  [55, 65, 8, 14, 85, 95],
  [20, 30, 60, 70, 5, 15],
  [25, 35, 65, 75, 10, 20],
];

export default function PoolingSimulator() {
  const [poolType, setPoolType] = useState<'max' | 'avg'>('max');
  const [poolSize, setPoolSize] = useState(2);
  const [stride, setStride] = useState(2);
  const [animRow, setAnimRow] = useState<number | null>(null);
  const [animCol, setAnimCol] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputSize = SAMPLE_FEATURE_MAP.length;
  const outSize = Math.floor((inputSize - poolSize) / stride) + 1;

  const output = useMemo(() => {
    const out: number[][] = [];
    for (let i = 0; i < outSize; i++) {
      out[i] = [];
      for (let j = 0; j < outSize; j++) {
        const window: number[] = [];
        for (let pi = 0; pi < poolSize; pi++)
          for (let pj = 0; pj < poolSize; pj++)
            window.push(SAMPLE_FEATURE_MAP[i * stride + pi][j * stride + pj]);
        out[i][j] = poolType === 'max' ? Math.max(...window) : Math.round(window.reduce((a, b) => a + b, 0) / window.length);
      }
    }
    return out;
  }, [poolType, poolSize, stride, outSize]);

  const totalSteps = outSize * outSize;

  const stopPlaying = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPlaying(false);
    setAnimRow(null);
    setAnimCol(null);
  }, []);

  const startPlaying = useCallback(() => {
    setIsPlaying(true);
    let step = 0;
    setAnimRow(0);
    setAnimCol(0);
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) { stopPlaying(); return; }
      const r = Math.floor(step / outSize);
      const c = step % outSize;
      setAnimRow(r);
      setAnimCol(c);
    }, 600);
  }, [totalSteps, outSize, stopPlaying]);

  useEffect(() => { return () => stopPlaying(); }, [stopPlaying]);

  const isWindowActive = (i: number, j: number) => {
    if (animRow === null || animCol === null) return false;
    const startR = animRow * stride;
    const startC = animCol * stride;
    return i >= startR && i < startR + poolSize && j >= startC && j < startC + poolSize;
  };

  const cellSize = 40;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Pooling Simulator</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Pooling reduces the spatial dimensions of feature maps while retaining the most important
          information. Watch how a pooling window slides across the input.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pooling Type</label>
              <div className="flex gap-2">
                {(['max', 'avg'] as const).map((type) => (
                  <button key={type} onClick={() => { setPoolType(type); stopPlaying(); }}
                    className={`px-3 py-2 text-sm rounded transition-colors ${poolType === type ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pool Size: {poolSize}</label>
              <input type="range" min="2" max="3" step="1" value={poolSize}
                onChange={(e) => { setPoolSize(parseInt(e.target.value)); stopPlaying(); }} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stride: {stride}</label>
              <input type="range" min="1" max="3" step="1" value={stride}
                onChange={(e) => { setStride(parseInt(e.target.value)); stopPlaying(); }} className="w-full" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={isPlaying ? stopPlaying : startPlaying}
                className={`px-4 py-2 text-sm rounded transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                {isPlaying ? 'Stop' : 'Animate Window'}
              </button>
              <button onClick={stopPlaying}
                className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-sm">Input Feature Map ({inputSize}×{inputSize})</h3>
            <div className="inline-block border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              {SAMPLE_FEATURE_MAP.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => {
                    const active = isWindowActive(i, j);
                    return (
                      <motion.div key={j}
                        animate={active ? { scale: 1.1, backgroundColor: '#fef3c7', borderColor: '#f59e0b' } : { scale: 1, backgroundColor: 'white', borderColor: '#e5e7eb' }}
                        transition={{ duration: 0.2 }}
                        className="w-10 h-10 border flex items-center justify-center text-xs font-mono text-gray-800"
                        style={{ borderColor: active ? '#f59e0b' : '#e5e7eb' }}
                      >
                        {val}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
            {(animRow !== null && animCol !== null) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded">
                Pooling window at ({animRow * stride}:{animRow * stride + poolSize - 1}, {animCol * stride}:{animCol * stride + poolSize - 1})
              </motion.div>
            )}
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-sm">
              Output ({outSize}×{outSize}) — {poolType === 'max' ? 'Maximum of each window' : 'Average of each window'}
            </h3>
            <div className="inline-block border-2 border-green-400 rounded overflow-hidden">
              {output.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => {
                    const isCurrent = animRow === i && animCol === j;
                    return (
                      <motion.div key={j}
                        animate={isCurrent ? { scale: 1.2, backgroundColor: '#d1fae5', borderColor: '#10b981' } : { scale: 1, backgroundColor: '#f0fdf4', borderColor: '#d1d5db' }}
                        transition={{ duration: 0.2 }}
                        className="w-10 h-10 border flex items-center justify-center text-xs font-mono font-bold text-green-800"
                      >
                        {val}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {inputSize}×{inputSize} → {outSize}×{outSize} ({(outSize / inputSize * 100).toFixed(0)}% size)
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Why Pooling?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-semibold text-green-700">Reduces Dimensions:</span> Shrinks the spatial size, reducing the number of parameters and computation.
            </div>
            <div>
              <span className="font-semibold text-green-700">Translation Invariance:</span> Small shifts in the input produce the same pooled output, making the network more robust.
            </div>
            <div>
              <span className="font-semibold text-green-700">Feature Selection:</span> {poolType === 'max' ? 'Max pooling selects the strongest activation in each window.' : 'Average pooling smooths the feature map, preserving overall information.'}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
            <strong>Max Pooling:</strong> Takes the maximum value in each pooling window. Best for edge detection and sharp features.
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded text-xs">
            <strong>Average Pooling:</strong> Takes the mean of all values in the window. Best for smooth features and reducing noise.
          </motion.div>
        </div>
      </div>
    </div>
  );
}
