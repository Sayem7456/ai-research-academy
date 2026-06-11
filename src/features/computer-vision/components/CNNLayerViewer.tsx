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
  conv: 110,
  relu: 70,
  pool: 100,
  flatten: 70,
  fc: 90,
};

function generateMap(size: number, seed: number): number[][] {
  const map: number[][] = [];
  for (let i = 0; i < size; i++) {
    map[i] = [];
    for (let j = 0; j < size; j++) {
      map[i][j] = Math.round(Math.sin(i * seed + j * 0.5 + seed) * 60 + 100);
    }
  }
  return map;
}

function applyConv(map: number[][], convCount: number): number[][] {
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

function applyReLU(map: number[][]): number[][] {
  return map.map(row => row.map(v => Math.max(0, v)));
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

function flattenMap(map: number[][]): number[] {
  const flat: number[] = [];
  for (const row of map) {
    for (const v of row) {
      flat.push(v);
    }
  }
  return flat;
}

function applyFC(flat: number[], fcSeed: number): number[] {
  return flat.map(v => {
    const w = Math.sin(v * 0.1 + fcSeed) * 0.5 + 0.5;
    return Math.round(v * w * 0.3 + 10);
  });
}

export default function CNNLayerViewer() {
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'fast'>('slow');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const layer = PIPELINE[activeLayer];

  const layers = useMemo(() => {
    const result: {
      output: number[][];
      input: number[][];
      flat?: number[];
      fcOut?: number[];
    }[] = [];

    let map = generateMap(8, 1);

    for (let i = 0; i < PIPELINE.length; i++) {
      const l = PIPELINE[i];
      const input = map;
      let output: number[][];

      if (l.type === 'conv') {
        output = applyConv(input, i);
      } else if (l.type === 'relu') {
        output = applyReLU(input);
      } else if (l.type === 'pool') {
        output = applyMaxPool(input, 2);
      } else if (l.type === 'flatten') {
        output = input;
      } else {
        output = input;
      }

      result.push({ input, output });
      map = output;
    }

    return result;
  }, []);

  const current = layers[activeLayer];
  const currentOutput = current.output;
  const currentInput = current.input;

  const maxDim = 160;
  const mapCellSize = Math.max(8, Math.min(Math.floor(maxDim / currentOutput.length), 32));

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAutoPlay(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    setIsAutoPlay(true);
    setActiveLayer(0);
    let e = 0;
    const delay = speed === 'slow' ? 2000 : 300;
    intervalRef.current = setInterval(() => {
      e++;
      if (e >= PIPELINE.length) {
        stopAutoPlay();
        setActiveLayer(PIPELINE.length - 1);
        return;
      }
      setActiveLayer(e);
    }, delay);
  }, [stopAutoPlay, speed]);

  useEffect(() => { return () => stopAutoPlay(); }, [stopAutoPlay]);

  const renderMap = (data: number[][], cellSize: number) => (
    <div className="inline-block border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden">
      {data.map((row, i) => (
        <div key={i} className="flex">
          {row.map((val, j) => {
            const g = Math.round(Math.max(0, Math.min(255, val)));
            return (
              <div key={j}
                className="flex items-center justify-center border border-gray-200 dark:border-gray-700 text-[8px] font-mono"
                style={{ width: cellSize, height: cellSize, backgroundColor: `rgb(${g},${g},${g})`, color: g > 128 ? '#000' : '#fff' }}
              >
                {cellSize >= 12 ? val : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const flattened = useMemo(() => flattenMap(currentOutput), [currentOutput]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">CNN Layer Viewer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
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
            <button onClick={() => setActiveLayer(0)} className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:opacity-90 transition-colors">
              Reset
            </button>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Layer {activeLayer + 1} of {PIPELINE.length}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-auto">
            <span className={speed === 'slow' ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>Slow</span>
            <button
              onClick={() => setSpeed(s => s === 'slow' ? 'fast' : 'slow')}
              className={`relative w-10 h-5 rounded-full transition-colors ${speed === 'fast' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${speed === 'fast' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className={speed === 'fast' ? 'font-semibold text-gray-900 dark:text-gray-100' : ''}>Fast</span>
          </div>
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
            <h3 className="font-semibold mb-2 text-sm">Output Feature Map</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLayer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {layer.type === 'flatten' ? (
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden p-2 max-w-full">
                    <div className="flex flex-wrap gap-0.5">
                      {flattened.slice(0, 64).map((val, i) => {
                        const g = Math.round(Math.max(0, Math.min(255, val)));
                        return (
                          <div key={i}
                            className="w-[18px] h-[18px] flex items-center justify-center text-[6px] font-mono"
                            style={{ backgroundColor: `rgb(${g},${g},${g})`, color: g > 128 ? '#000' : '#fff' }}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                    {flattened.length > 64 && (
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1 text-center">
                        ... {flattened.length - 64} more
                      </div>
                    )}
                  </div>
                ) : layer.type === 'fc' ? (
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden p-2">
                    <div className="flex gap-1 items-end h-24">
                      {(() => {
                        const vals = applyFC(flattened, activeLayer);
                        const maxV = Math.max(...vals, 1);
                        return vals.slice(0, 16).map((val, i) => (
                          <div key={i} className="flex flex-col items-center gap-0.5">
                            <div
                              className="w-4 rounded-t"
                              style={{
                                height: `${(val / maxV) * 80}px`,
                                backgroundColor: activeLayer === PIPELINE.length - 1 ? '#3b82f6' : '#ef4444',
                                opacity: 0.8,
                              }}
                            />
                            <span className="text-[6px] font-mono text-gray-500 dark:text-gray-400">{val}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    {activeLayer === PIPELINE.length - 1 && (
                      <div className="text-[9px] text-blue-600 dark:text-blue-400 mt-1 text-center">
                        Class scores (argmax = prediction)
                      </div>
                    )}
                  </div>
                ) : (
                  renderMap(currentOutput, mapCellSize)
                )}
              </motion.div>
            </AnimatePresence>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
              {layer.type === 'flatten' ? `${flattened.length}-d vector` :
               layer.type === 'fc' ? `${applyFC(flattened, activeLayer).length}-d vector` :
               `${currentOutput.length}×${currentOutput.length}`}
            </div>

            {/* Show input size too */}
            {activeLayer > 0 && currentInput.length !== currentOutput.length && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                Input: {currentInput.length}×{currentInput.length}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <motion.div
              key={`info-${activeLayer}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                <h3 className="font-semibold text-lg">{layer.name}</h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{layer.description}</p>

              <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span className="font-semibold">Layer Type:</span>
                  <span className="font-mono uppercase">{layer.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Input Size:</span>
                  <span className="font-mono">
                    {currentInput.length}×{currentInput.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Output Size:</span>
                  <span className="font-mono">
                    {layer.type === 'flatten' ? `${flattened.length}` :
                     layer.type === 'fc' ? `${applyFC(flattened, activeLayer).length}` :
                     `${currentOutput.length}×${currentOutput.length}`}
                  </span>
                </div>
              </div>
            </motion.div>

            {layer.type === 'conv' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded text-xs text-purple-800 dark:text-purple-200">
                <strong>Convolution:</strong> Extracts patterns like edges, textures, and shapes. Multiple filters learn different features. The kernel slides over the input, computing weighted sums.
              </motion.div>
            )}
            {layer.type === 'relu' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <strong>ReLU (max(0,x)):</strong> Removes negative values, introducing non-linearity without affecting the receptive field. All negative activations become 0.
              </motion.div>
            )}
            {layer.type === 'pool' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-green-50 dark:bg-green-950/30 rounded text-xs text-green-800 dark:text-green-200">
                <strong>Max Pooling:</strong> Downsamples by taking the maximum value in each 2×2 window, reducing computation and providing translation invariance. Spatial dimensions halve.
              </motion.div>
            )}
            {layer.type === 'flatten' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded text-xs text-orange-800 dark:text-orange-200">
                <strong>Flatten:</strong> Converts the 2D feature map into a 1D vector so fully connected layers can process it. A {currentInput.length}×{currentInput.length} map becomes {flattened.length} values.
              </motion.div>
            )}
            {layer.type === 'fc' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-800 dark:text-red-200">
                <strong>Fully Connected:</strong> Every neuron connects to every neuron in the previous layer. The final layer outputs class scores (softmax) for prediction.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
