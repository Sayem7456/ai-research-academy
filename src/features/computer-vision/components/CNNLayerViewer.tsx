'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type LayerType = 'conv' | 'relu' | 'pool' | 'flatten' | 'fc';

interface LayerInfo {
  type: LayerType;
  name: string;
  color: string;
  description: string;
}

const PIPELINE: LayerInfo[] = [
  { type: 'conv', name: 'Conv 3×3', color: 'bg-purple-500', description: 'Convolution extracts features using learnable filters' },
  { type: 'relu', name: 'ReLU', color: 'bg-yellow-500', description: 'Non-linear activation f(x)=max(0,x)' },
  { type: 'pool', name: 'Max Pool 2×2', color: 'bg-green-500', description: 'Downsampling reduces spatial dimensions' },
  { type: 'conv', name: 'Conv 3×3', color: 'bg-purple-500', description: 'Second convolution learns higher-level features' },
  { type: 'relu', name: 'ReLU', color: 'bg-yellow-500', description: 'Element-wise non-linear activation' },
  { type: 'pool', name: 'Max Pool 2×2', color: 'bg-green-500', description: 'Further downsampling' },
  { type: 'flatten', name: 'Flatten', color: 'bg-orange-500', description: 'Reshapes 2D feature maps into 1D vector' },
  { type: 'fc', name: 'FC 128', color: 'bg-red-500', description: 'Fully connected layer for classification' },
  { type: 'fc', name: 'Output', color: 'bg-blue-500', description: 'Final class probabilities (softmax)' },
];

const LAYER_WIDTHS: Record<LayerType, number> = {
  conv: 100,
  relu: 60,
  pool: 80,
  flatten: 50,
  fc: 90,
};

function generateRandomMap(size: number, seed: number): number[][] {
  const map: number[][] = [];
  for (let i = 0; i < size; i++) {
    map[i] = [];
    for (let j = 0; j < size; j++) {
      map[i][j] = Math.round(Math.sin(i * seed + j * 0.5 + seed) * 60 + 100 + Math.random() * 30);
    }
  }
  return map;
}

function applyMaxPool(map: number[][], poolSize: number): number[][] {
  const outSize = Math.floor(map.length / poolSize);
  const out: number[][] = [];
  for (let i = 0; i < outSize; i++) {
    out[i] = [];
    for (let j = 0; j < outSize; j++) {
      let max = -Infinity;
      for (let pi = 0; pi < poolSize; pi++)
        for (let pj = 0; pj < poolSize; pj++)
          max = Math.max(max, map[i * poolSize + pi][j * poolSize + pj]);
      out[i][j] = max;
    }
  }
  return out;
}

function applyPoolLayer(map: number[][], convCount: number): number[][] {
  const seed = 3 + convCount * 7;
  const size = convCount % 2 === 0 ? map.length : Math.max(2, Math.floor(map.length / 2));
  const result: number[][] = [];
  for (let i = 0; i < size; i++) {
    result[i] = [];
    for (let j = 0; j < size; j++) {
      result[i][j] = Math.round(Math.sin(i * seed + j * 0.7 + seed) * 40 + 120);
    }
  }
  return result;
}

function applyConvLayer(map: number[][], convCount: number): number[][] {
  const size = map.length;
  const seed = 5 + convCount * 3;
  const result: number[][] = [];
  for (let i = 0; i < size; i++) {
    result[i] = [];
    for (let j = 0; j < size; j++) {
      const sum = (
        map[(i - 1 + size) % size][(j - 1 + size) % size] * 0.2 +
        map[(i - 1 + size) % size][j] * 0.4 +
        map[(i - 1 + size) % size][(j + 1) % size] * 0.2 +
        map[i][(j - 1 + size) % size] * 0.4 +
        map[i][j] * 1.0 +
        map[i][(j + 1) % size] * 0.4 +
        map[(i + 1) % size][(j - 1 + size) % size] * 0.2 +
        map[(i + 1) % size][j] * 0.4 +
        map[(i + 1) % size][(j + 1) % size] * 0.2
      );
      result[i][j] = Math.round(Math.max(0, Math.min(255, sum * 0.6 + Math.sin(i * seed + j * 0.3) * 30)));
    }
  }
  return result;
}

export default function CNNLayerViewer() {
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const layer = PIPELINE[activeLayer];

  const featureMaps = useMemo(() => {
    const maps: { size: number; data: number[][] }[] = [];
    let cCount = 0;
    let mapSize = 8;
    let currentMap = generateRandomMap(mapSize, 1);
    maps.push({ size: mapSize, data: currentMap });

    for (let i = 0; i < PIPELINE.length; i++) {
      const l = PIPELINE[i];
      if (l.type === 'conv') {
        cCount++;
        currentMap = applyConvLayer(currentMap, cCount);
        mapSize = currentMap.length;
      } else if (l.type === 'pool') {
        currentMap = applyPoolLayer(currentMap, cCount);
        mapSize = currentMap.length;
      } else if (l.type === 'flatten') {
        mapSize = 1;
        currentMap = [[Math.round(Math.random() * 100 + 50)]];
      } else if (l.type === 'fc') {
        mapSize = 1;
        currentMap = [[Math.round(Math.random() * 80 + 10)]];
      }
      maps.push({ size: mapSize, data: currentMap });
    }
    return maps;
  }, []);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAutoPlay(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    setIsAutoPlay(true);
    setActiveLayer(0);
    intervalRef.current = setInterval(() => {
      setActiveLayer(prev => {
        if (prev >= PIPELINE.length - 1) {
          stopAutoPlay();
          return PIPELINE.length - 1;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stopAutoPlay]);

  useEffect(() => { return () => stopAutoPlay(); }, [stopAutoPlay]);

  const currentMap = featureMaps[activeLayer];
  const maxDim = 160;
  const mapCellSize = currentMap ? Math.max(8, Math.min(Math.floor(maxDim / currentMap.size), 32)) : 8;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">CNN Layer Viewer</h2>
        <p className="text-gray-600 mb-6">
          Explore how data transforms as it flows through a CNN. Each layer changes the shape and
          content of the feature maps. Click on any layer to see its effect.
        </p>

        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={isAutoPlay ? stopAutoPlay : startAutoPlay}
            className={`px-4 py-2 text-sm rounded transition-colors ${isAutoPlay ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}
          >
            {isAutoPlay ? 'Stop Pipeline' : 'Run Pipeline'}
          </button>
          {activeLayer > 0 && (
            <button onClick={() => setActiveLayer(0)} className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
              Reset
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto pb-4 gap-1 mb-6">
          {PIPELINE.map((l, i) => (
            <motion.button
              key={i}
              onClick={() => { setActiveLayer(i); stopAutoPlay(); }}
              whileHover={{ scale: 1.05 }}
              animate={i === activeLayer ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
              className={`flex-shrink-0 px-3 py-2 rounded text-xs font-medium text-white transition-shadow ${l.color} ${i === activeLayer ? 'shadow-lg ring-2 ring-blue-400' : 'opacity-60 hover:opacity-90'}`}
              style={{ width: LAYER_WIDTHS[l.type] }}
            >
              {l.name}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center">
            <h3 className="font-semibold mb-2 text-sm">Feature Map</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLayer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="inline-block border-2 border-gray-300 rounded overflow-hidden"
              >
                {currentMap.data.map((row, i) => (
                  <div key={i} className="flex">
                    {row.map((val, j) => {
                      const g = Math.round(Math.max(0, Math.min(255, val)));
                      return (
                        <div key={j}
                          className="flex items-center justify-center border border-gray-200 text-[8px] font-mono"
                          style={{ width: mapCellSize, height: mapCellSize, backgroundColor: `rgb(${g},${g},${g})`, color: g > 128 ? '#000' : '#fff' }}
                        >
                          {mapCellSize >= 12 ? val : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="text-xs text-gray-500 mt-2 font-mono">
              {currentMap.size}×{currentMap.size}
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              key={`info-${activeLayer}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-blue-50 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                <h3 className="font-semibold text-lg">{layer.name}</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">{layer.description}</p>

              <div className="bg-white rounded p-3 text-xs space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold">Layer Type:</span>
                  <span className="font-mono uppercase">{layer.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Input Size:</span>
                  <span className="font-mono">
                    {activeLayer > 0 ? `${featureMaps[activeLayer - 1].size}×${featureMaps[activeLayer - 1].size}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Output Size:</span>
                  <span className="font-mono">{currentMap.size}×{currentMap.size}</span>
                </div>
              </div>
            </motion.div>

            {layer.type === 'conv' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-purple-50 rounded text-xs text-purple-800">
                <strong>Convolution:</strong> Extracts patterns like edges, textures, and shapes. Multiple filters learn different features.
              </motion.div>
            )}
            {layer.type === 'relu' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-yellow-50 rounded text-xs text-yellow-800">
                <strong>ReLU (max(0,x)):</strong> Removes negative values, introducing non-linearity without affecting the receptive field.
              </motion.div>
            )}
            {layer.type === 'pool' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-green-50 rounded text-xs text-green-800">
                <strong>Max Pooling:</strong> Downsamples by taking the maximum value in each 2×2 window, reducing computation and providing translation invariance.
              </motion.div>
            )}
            {layer.type === 'flatten' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-orange-50 rounded text-xs text-orange-800">
                <strong>Flatten:</strong> Converts the 2D feature map into a 1D vector so fully connected layers can process it.
              </motion.div>
            )}
            {layer.type === 'fc' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 rounded text-xs text-red-800">
                <strong>Fully Connected:</strong> Every neuron connects to every neuron in the previous layer. The final layer outputs class scores.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
