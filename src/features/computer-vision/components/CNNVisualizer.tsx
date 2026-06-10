'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

type ConvLayerState = {
  input: number[][][];
  kernels: number[][][];
  output: number[][][];
  stride: number;
  padding: number;
};

const SAMPLE_IMAGE = [
  [[255, 255, 255], [200, 200, 200], [150, 150, 150], [100, 100, 100], [50, 50, 50]],
  [[200, 200, 200], [255, 255, 255], [200, 200, 200], [150, 150, 150], [100, 100, 100]],
  [[150, 150, 150], [200, 200, 200], [255, 255, 255], [200, 200, 200], [150, 150, 150]],
  [[100, 100, 100], [150, 150, 150], [200, 200, 200], [255, 255, 255], [200, 200, 200]],
  [[50, 50, 50], [100, 100, 100], [150, 150, 150], [200, 200, 200], [255, 255, 255]],
];

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

function applyConvolution(
  input: number[][][],
  kernel: number[][],
  stride: number = 1,
  padding: number = 0
): number[][][] {
  const inputH = input.length;
  const inputW = input[0].length;
  const channels = input[0][0].length;
  const kernelSize = kernel.length;

  const paddedInput = addPadding(input, padding);
  const paddedH = paddedInput.length;
  const paddedW = paddedInput[0].length;

  const outputH = Math.floor((paddedH - kernelSize) / stride) + 1;
  const outputW = Math.floor((paddedW - kernelSize) / stride) + 1;

  const output: number[][][] = Array(outputH)
    .fill(0)
    .map(() =>
      Array(outputW)
        .fill(0)
        .map(() => Array(channels).fill(0))
    );

  for (let c = 0; c < channels; c++) {
    for (let i = 0; i < outputH; i++) {
      for (let j = 0; j < outputW; j++) {
        let sum = 0;
        for (let ki = 0; ki < kernelSize; ki++) {
          for (let kj = 0; kj < kernelSize; kj++) {
            const inputI = i * stride + ki;
            const inputJ = j * stride + kj;
            sum += paddedInput[inputI][inputJ][c] * kernel[ki][kj];
          }
        }
        output[i][j][c] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  return output;
}

function addPadding(input: number[][][], padding: number): number[][][] {
  if (padding === 0) return input;

  const h = input.length;
  const w = input[0].length;
  const c = input[0][0].length;

  const paddedH = h + 2 * padding;
  const paddedW = w + 2 * padding;

  const padded: number[][][] = Array(paddedH)
    .fill(0)
    .map(() =>
      Array(paddedW)
        .fill(0)
        .map(() => Array(c).fill(0))
    );

  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      for (let k = 0; k < c; k++) {
        padded[i + padding][j + padding][k] = input[i][j][k];
      }
    }
  }

  return padded;
}

function applyMaxPooling(input: number[][][], poolSize: number = 2): number[][][] {
  const h = input.length;
  const w = input[0].length;
  const c = input[0][0].length;

  const outputH = Math.floor(h / poolSize);
  const outputW = Math.floor(w / poolSize);

  const output: number[][][] = Array(outputH)
    .fill(0)
    .map(() =>
      Array(outputW)
        .fill(0)
        .map(() => Array(c).fill(0))
    );

  for (let ch = 0; ch < c; ch++) {
    for (let i = 0; i < outputH; i++) {
      for (let j = 0; j < outputW; j++) {
        let maxVal = -Infinity;
        for (let pi = 0; pi < poolSize; pi++) {
          for (let pj = 0; pj < poolSize; pj++) {
            const val = input[i * poolSize + pi][j * poolSize + pj][ch];
            if (val > maxVal) maxVal = val;
          }
        }
        output[i][j][ch] = maxVal;
      }
    }
  }

  return output;
}

function applyReLU(input: number[][][]): number[][][] {
  return input.map(row =>
    row.map(pixel => pixel.map(val => Math.max(0, val)))
  );
}

export default function CNNVisualizer() {
  const [selectedKernel, setSelectedKernel] = useState<'edge' | 'blur' | 'sharpen'>('edge');
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(0);
  const [showPooling, setShowPooling] = useState(true);
  const [showReLU, setShowReLU] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const kernel = useMemo(() => {
    switch (selectedKernel) {
      case 'edge': return EDGE_KERNEL;
      case 'blur': return BLUR_KERNEL;
      case 'sharpen': return SHARPEN_KERNEL;
    }
  }, [selectedKernel]);

  const convOutput = useMemo(
    () => applyConvolution(SAMPLE_IMAGE, kernel, stride, padding),
    [kernel, stride, padding]
  );

  const reluOutput = useMemo(
    () => showReLU ? applyReLU(convOutput) : convOutput,
    [convOutput, showReLU]
  );

  const poolOutput = useMemo(
    () => showPooling ? applyMaxPooling(reluOutput, 2) : reluOutput,
    [reluOutput, showPooling]
  );

  const renderMatrix = (matrix: number[][][], title: string, scale: number = 1) => {
    const h = matrix.length;
    const w = matrix[0].length;
    const cellSize = Math.max(20, Math.min(40, 200 / Math.max(h, w))) * scale;

    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {h} × {w}
        </div>
        <div className="inline-block border-2 border-gray-300 dark:border-gray-600 rounded">
          {matrix.map((row, i) => (
            <div key={i} className="flex">
              {row.map((pixel, j) => {
                const gray = Math.round((pixel[0] + pixel[1] + pixel[2]) / 3);
                return (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (i * w + j) * 0.01 }}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: `rgb(${gray}, ${gray}, ${gray})`,
                    }}
                    className="border border-gray-200 dark:border-gray-700"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderKernel = (k: number[][], title: string) => {
    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">3 × 3</div>
        <div className="inline-block border-2 border-purple-400 rounded bg-purple-50 dark:bg-purple-950/30">
          {k.map((row, i) => (
            <div key={i} className="flex">
              {row.map((val, j) => (
                <div
                  key={j}
                  className="w-12 h-12 border border-purple-200 flex items-center justify-center text-xs font-mono"
                >
                  {val.toFixed(2)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const steps = [
    { name: 'Input', description: 'Original grayscale image (5×5)' },
    { name: 'Convolution', description: `Apply ${selectedKernel} detection kernel` },
    { name: 'ReLU', description: 'Apply activation function (max(0, x))' },
    { name: 'Pooling', description: 'Max pooling (2×2) to reduce dimensions' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Convolutional Neural Network (CNN)</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Visualize how CNNs process images through convolution, activation, and pooling layers.
          Each layer transforms the input to extract features.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kernel Type</label>
              <div className="flex gap-2">
                {(['edge', 'blur', 'sharpen'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedKernel(type)}
                    className={`px-3 py-2 text-sm rounded ${
                      selectedKernel === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Stride: {stride}
              </label>
              <input
                type="range"
                min="1"
                max="2"
                step="1"
                value={stride}
                onChange={(e) => setStride(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Padding: {padding}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showReLU}
                  onChange={(e) => setShowReLU(e.target.checked)}
                  className="w-4 h-4"
                />
                Apply ReLU Activation
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPooling}
                  onChange={(e) => setShowPooling(e.target.checked)}
                  className="w-4 h-4"
                />
                Apply Max Pooling (2×2)
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 justify-center items-center mb-6">
          {renderMatrix(SAMPLE_IMAGE, 'Input Image', 1.2)}
          <div className="text-2xl text-gray-400 dark:text-gray-500">⊗</div>
          {renderKernel(kernel, 'Kernel')}
          <div className="text-2xl text-gray-400 dark:text-gray-500">→</div>
          {renderMatrix(convOutput, 'After Convolution')}
          {showReLU && (
            <>
              <div className="text-2xl text-gray-400 dark:text-gray-500">→</div>
              {renderMatrix(reluOutput, 'After ReLU')}
            </>
          )}
          {showPooling && (
            <>
              <div className="text-2xl text-gray-400 dark:text-gray-500">→</div>
              {renderMatrix(poolOutput, 'After Pooling', 1.5)}
            </>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3">CNN Pipeline Explanation</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-semibold text-blue-600 min-w-[120px]">1. Convolution:</span>
              <span className="text-gray-700 dark:text-gray-300">
                Slide the kernel over the input, computing dot products. Detects features like edges, textures, patterns.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-yellow-600 min-w-[120px]">2. ReLU:</span>
              <span className="text-gray-700 dark:text-gray-300">
                Non-linear activation f(x) = max(0, x). Introduces non-linearity, allowing the network to learn complex patterns.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-green-600 min-w-[120px]">3. Pooling:</span>
              <span className="text-gray-700 dark:text-gray-300">
                Downsamples feature maps by taking max value in each window. Reduces spatial dimensions and computation.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
