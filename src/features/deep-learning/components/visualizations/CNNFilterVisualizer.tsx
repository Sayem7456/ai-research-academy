'use client';

import React, { useState, useMemo } from 'react';

type FilterType = 'edge-h' | 'edge-v' | 'sharpen' | 'blur' | 'emboss';

const FILTERS: Record<FilterType, { name: string; matrix: number[][]; description: string }> = {
  'edge-h': {
    name: 'Edge Horizontal',
    matrix: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
    description: 'Detects horizontal edges by computing the vertical gradient.'
  },
  'edge-v': {
    name: 'Edge Vertical',
    matrix: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
    description: 'Detects vertical edges by computing the horizontal gradient.'
  },
  sharpen: {
    name: 'Sharpen',
    matrix: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    description: 'Enhances edges by subtracting the blurred version from the original.'
  },
  blur: {
    name: 'Gaussian Blur',
    matrix: [[1, 2, 1], [2, 4, 2], [1, 2, 1]],
    description: 'Smooths the image by averaging neighboring pixels with Gaussian weights.'
  },
  emboss: {
    name: 'Emboss',
    matrix: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]],
    description: 'Creates a 3D raised effect by computing directional gradients.'
  },
};

function applyFilter(img: number[][], filter: number[][]): number[][] {
  const h = img.length;
  const w = img[0].length;
  const result: number[][] = Array.from({ length: h - 2 }, () => new Array(w - 2).fill(0));
  for (let i = 0; i < h - 2; i++) {
    for (let j = 0; j < w - 2; j++) {
      let sum = 0;
      for (let fi = 0; fi < 3; fi++) {
        for (let fj = 0; fj < 3; fj++) {
          sum += img[i + fi][j + fj] * filter[fi][fj];
        }
      }
      result[i][j] = Math.max(0, Math.min(255, sum));
    }
  }
  return result;
}

export default function CNNFilterVisualizer() {
  const [filterType, setFilterType] = useState<FilterType>('edge-h');
  const [stride, setStride] = useState(1);
  const [showOriginal, setShowOriginal] = useState(true);

  const size = 12;
  const inputImg = useMemo(() => {
    const img: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        const cx = i - size / 2;
        const cy = j - size / 2;
        const v = Math.max(0, 200 - (cx * cx + cy * cy) * 3 + Math.sin(i * 0.8) * 30 + Math.cos(j * 0.6) * 20);
        row.push(v);
      }
      img.push(row);
    }
    return img;
  }, []);

  const filter = FILTERS[filterType].matrix;
  const outputImg = useMemo(() => applyFilter(inputImg, filter), [inputImg, filter]);

  const cellSize = 28;
  const gap = 2;

  const renderGrid = (img: number[][], label: string, highlight: boolean) => (
    <div>
      <p className={`text-xs font-medium mb-2 ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>{label}</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${img[0].length}, ${cellSize}px)`, gap: `${gap}px` }}>
        {img.flat().map((v, i) => (
          <div key={i} style={{ width: cellSize, height: cellSize, backgroundColor: `rgb(${v}, ${v}, ${v})`, borderRadius: 2 }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">CNN Filter Visualizer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        See how 3×3 convolutional filters transform an input image. Each filter detects different features — edges, textures, or patterns.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Convolution Operation</h3>
          <div className="flex flex-col items-center gap-4">
            {showOriginal && renderGrid(inputImg, 'Input (12×12)', false)}
            <div className="text-2xl text-gray-400">↓</div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">{FILTERS[filterType].name} Filter (3×3)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 32px)', gap: '2px' }}>
                {filter.flat().map((v, i) => (
                  <div key={i} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: v > 0 ? `rgba(99, 102, 241, ${Math.min(v / 5, 1)})` : `rgba(239, 68, 68, ${Math.min(Math.abs(v) / 5, 1)})`, borderRadius: 2, color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                    {v}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-2xl text-gray-400">↓</div>
            {renderGrid(outputImg, `Output (${outputImg.length}×${outputImg[0].length})`, true)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter Type</h3>
            <div className="space-y-2">
              {(Object.keys(FILTERS) as FilterType[]).map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${filterType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {FILTERS[type].name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Parameters</h3>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Stride</span><strong>{stride}</strong>
              </label>
              <input type="range" min="1" max="3" step="1" value={stride} onChange={(e) => setStride(parseInt(e.target.value))} className="w-full accent-indigo-500" />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-3 cursor-pointer">
              <input type="checkbox" checked={showOriginal} onChange={() => setShowOriginal(!showOriginal)} className="rounded" />
              Show input image
            </label>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{FILTERS[filterType].name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{FILTERS[filterType].description}</p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <p>Parameters: {(3 * 3 + 1).toLocaleString()} (3×3 kernel + 1 bias)</p>
              <p>Output size: {outputImg.length}×{outputImg[0].length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How CNN Filters Work</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          A convolutional filter slides over the input, computing a dot product at each position. The filter weights are learned during training — early layers learn simple patterns (edges), deeper layers learn complex features (faces, objects). A CNN with 64 filters in the first layer learns 64 different edge detectors automatically.
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Filter</span>
            <span>→ A tiny detective that looks for one specific pattern. Edge detectors find boundaries. Texture detectors find repeating patterns.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Feature Map</span>
            <span>→ The output shows where the pattern was found. Bright pixels = strong match. This is what the network "sees".</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Stacking Layers</span>
            <span>→ Layer 1 detects edges. Layer 2 combines edges into textures. Layer 3 combines textures into parts. Layer 4 recognizes objects.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
