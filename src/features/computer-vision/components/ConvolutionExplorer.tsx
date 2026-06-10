'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EDGE_KERNEL = [
  [-1, -1, -1],
  [-1, 8, -1],
  [-1, -1, -1],
];
const BLUR_KERNEL = [
  [1/9, 1/9, 1/9],
  [1/9, 1/9, 1/9],
  [1/9, 1/9, 1/9],
];
const SHARPEN_KERNEL = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
];

const SAMPLE_INPUT = [
  [50, 80, 120, 160, 200, 220, 200, 160],
  [60, 90, 130, 170, 210, 230, 210, 170],
  [70, 100, 140, 180, 220, 240, 220, 180],
  [80, 110, 150, 190, 230, 250, 230, 190],
  [90, 120, 160, 200, 240, 255, 240, 200],
  [100, 130, 170, 210, 250, 240, 210, 170],
  [80, 110, 150, 190, 230, 210, 180, 140],
  [60, 90, 130, 170, 210, 190, 160, 120],
];

function conv2D(input: number[][], kernel: number[][], stride: number, padding: number): number[][] {
  const kSize = kernel.length;
  const padded = padding > 0
    ? Array(input.length + 2 * padding).fill(0).map(() => Array(input[0].length + 2 * padding).fill(0))
    : input.map(r => [...r]);
  if (padding > 0) {
    for (let i = 0; i < input.length; i++)
      for (let j = 0; j < input[0].length; j++)
        padded[i + padding][j + padding] = input[i][j];
  }
  const outH = Math.floor((padded.length - kSize) / stride) + 1;
  const outW = Math.floor((padded[0].length - kSize) / stride) + 1;
  const output: number[][] = Array(outH).fill(0).map(() => Array(outW).fill(0));
  for (let i = 0; i < outH; i++) {
    for (let j = 0; j < outW; j++) {
      let sum = 0;
      for (let ki = 0; ki < kSize; ki++)
        for (let kj = 0; kj < kSize; kj++)
          sum += padded[i * stride + ki][j * stride + kj] * kernel[ki][kj];
      output[i][j] = Math.round(Math.max(0, Math.min(255, sum)));
    }
  }
  return output;
}

export default function ConvolutionExplorer() {
  const [selectedKernel, setSelectedKernel] = useState<'edge' | 'blur' | 'sharpen'>('edge');
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(0);
  const [animStep, setAnimStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const kernel = useMemo(() => {
    switch (selectedKernel) {
      case 'edge': return EDGE_KERNEL;
      case 'blur': return BLUR_KERNEL;
      case 'sharpen': return SHARPEN_KERNEL;
    }
  }, [selectedKernel]);

  const output = useMemo(() => conv2D(SAMPLE_INPUT, kernel, stride, padding), [kernel, stride, padding]);
  const totalSteps = output.length * output[0].length;

  const stopPlaying = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPlaying(false);
  }, []);

  const startPlaying = useCallback(() => {
    setIsPlaying(true);
    setAnimStep(0);
    intervalRef.current = setInterval(() => {
      setAnimStep(prev => {
        if (prev === null || prev >= totalSteps - 1) {
          stopPlaying();
          return null;
        }
        return prev + 1;
      });
    }, 400);
  }, [totalSteps, stopPlaying]);

  useEffect(() => { return () => stopPlaying(); }, [stopPlaying]);

  const toGrayscale = (val: number) => {
    const g = Math.round(Math.max(0, Math.min(255, val)));
    return `rgb(${g},${g},${g})`;
  };

  const kSize = kernel.length;
  const cellSize = 36;
  const inSize = SAMPLE_INPUT.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Convolution Explorer</h2>
        <p className="text-gray-600 mb-6">
          See how a kernel slides over an input image, computing the dot product at each position.
          Each output cell combines information from a local receptive field.
        </p>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kernel Type</label>
              <div className="flex gap-2 flex-wrap">
                {(['edge', 'blur', 'sharpen'] as const).map((type) => (
                  <button key={type} onClick={() => { setSelectedKernel(type); setAnimStep(null); stopPlaying(); }}
                    className={`px-3 py-2 text-sm rounded transition-colors ${selectedKernel === type ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stride: {stride}</label>
              <input type="range" min="1" max="2" step="1" value={stride}
                onChange={(e) => { setStride(parseInt(e.target.value)); setAnimStep(null); stopPlaying(); }} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Padding: {padding}</label>
              <input type="range" min="0" max="2" step="1" value={padding}
                onChange={(e) => { setPadding(parseInt(e.target.value)); setAnimStep(null); stopPlaying(); }} className="w-full" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={isPlaying ? stopPlaying : startPlaying}
                className={`px-4 py-2 text-sm rounded transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                {isPlaying ? 'Stop' : 'Animate Output'}
              </button>
              <button onClick={() => { setAnimStep(null); stopPlaying(); }}
                className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-sm">Input {inSize}×{inSize}</h3>
            <div className="inline-block border-2 border-gray-300 rounded overflow-hidden">
              {SAMPLE_INPUT.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => (
                    <div key={j} className="w-9 h-9 border border-gray-200 flex items-center justify-center text-[10px] font-mono"
                      style={{ backgroundColor: toGrayscale(val), color: val > 128 ? '#fff' : '#000' }}>
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-sm">Kernel {kSize}×{kSize}</h3>
            <div className="inline-block border-2 border-purple-400 rounded bg-purple-50 overflow-hidden">
              {kernel.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => (
                    <div key={j} className="w-9 h-9 border border-purple-200 flex items-center justify-center text-[10px] font-mono text-purple-900">
                      {val.toFixed(val % 1 === 0 ? 0 : 2)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200 text-xs text-purple-800">
              <strong>Formula:</strong> Σ(input[i,j] × kernel[i,j])
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-sm">Output {output.length}×{output[0].length}</h3>
            <div className="inline-block border-2 border-green-400 rounded overflow-hidden">
              {output.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => {
                    const stepIdx = i * output[0].length + j;
                    const isRevealed = animStep !== null && stepIdx <= animStep;
                    return (
                      <motion.div key={j}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={isRevealed ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="w-9 h-9 border border-green-200 flex items-center justify-center text-[10px] font-mono"
                        style={{ backgroundColor: isRevealed ? toGrayscale(val) : '#f0fdf4', color: val > 128 ? '#fff' : '#000' }}>
                        {isRevealed ? val : '?'}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">How Convolution Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-purple-700">1. Slide:</span> The kernel slides across the input with the given stride.
            </div>
            <div>
              <span className="font-semibold text-purple-700">2. Multiply &amp; Sum:</span> At each position, element-wise multiply kernel values with the overlapping input values, then sum.
            </div>
            <div>
              <span className="font-semibold text-purple-700">3. Output:</span> The result becomes one cell in the output feature map.
            </div>
          </div>
        </div>

        {selectedKernel === 'edge' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm">
            <strong>Edge Detection:</strong> This kernel responds strongly to pixel intensity changes. Bright areas surrounded by dark areas (or vice versa) produce high positive values, highlighting edges.
          </motion.div>
        )}
        {selectedKernel === 'blur' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm">
            <strong>Blur / Box Filter:</strong> Averages each pixel with its neighbors, reducing noise and high-frequency detail. The output appears smoother than the input.
          </motion.div>
        )}
        {selectedKernel === 'sharpen' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm">
            <strong>Sharpen:</strong> Amplifies the center pixel while subtracting neighbors, enhancing edges and making the image appear crisper.
          </motion.div>
        )}
      </div>
    </div>
  );
}
