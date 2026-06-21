'use client';

import React, { useState, useMemo } from 'react';

type Strategy = 'extraction' | 'finetune-top' | 'finetune-all' | 'train-scratch';

interface LayerInfo {
  name: string;
  frozen: boolean;
  params: string;
  trainable: boolean;
}

const STRATEGIES: Record<Strategy, { name: string; description: string; layers: LayerInfo[] }> = {
  extraction: {
    name: 'Feature Extraction',
    description: 'Freeze all pre-trained layers. Only train the new classifier head. Fast, works with small datasets.',
    layers: [
      { name: 'Conv1 (pre-trained)', frozen: true, params: '9.4K', trainable: false },
      { name: 'Conv2 (pre-trained)', frozen: true, params: '36.9K', trainable: false },
      { name: 'Conv3 (pre-trained)', frozen: true, params: '73.9K', trainable: false },
      { name: 'Conv4 (pre-trained)', frozen: true, params: '147.6K', trainable: false },
      { name: 'Conv5 (pre-trained)', frozen: true, params: '295.2K', trainable: false },
      { name: 'FC Layer (new)', frozen: false, params: '513K', trainable: true },
    ],
  },
  'finetune-top': {
    name: 'Fine-tune Top Layers',
    description: 'Unfreeze last 2 layers. Use small learning rate to avoid destroying pre-trained features.',
    layers: [
      { name: 'Conv1 (pre-trained)', frozen: true, params: '9.4K', trainable: false },
      { name: 'Conv2 (pre-trained)', frozen: true, params: '36.9K', trainable: false },
      { name: 'Conv3 (pre-trained)', frozen: true, params: '73.9K', trainable: false },
      { name: 'Conv4 (unfrozen)', frozen: false, params: '147.6K', trainable: true },
      { name: 'Conv5 (unfrozen)', frozen: false, params: '295.2K', trainable: true },
      { name: 'FC Layer (new)', frozen: false, params: '513K', trainable: true },
    ],
  },
  'finetune-all': {
    name: 'Fine-tune All Layers',
    description: 'Unfreeze everything. Use very small learning rate. Best when you have enough data.',
    layers: [
      { name: 'Conv1 (unfrozen)', frozen: false, params: '9.4K', trainable: true },
      { name: 'Conv2 (unfrozen)', frozen: false, params: '36.9K', trainable: true },
      { name: 'Conv3 (unfrozen)', frozen: false, params: '73.9K', trainable: true },
      { name: 'Conv4 (unfrozen)', frozen: false, params: '147.6K', trainable: true },
      { name: 'Conv5 (unfrozen)', frozen: false, params: '295.2K', trainable: true },
      { name: 'FC Layer (new)', frozen: false, params: '513K', trainable: true },
    ],
  },
  'train-scratch': {
    name: 'Train from Scratch',
    description: 'No pre-training. All layers trained randomly. Needs lots of data and compute.',
    layers: [
      { name: 'Conv1 (random)', frozen: false, params: '9.4K', trainable: true },
      { name: 'Conv2 (random)', frozen: false, params: '36.9K', trainable: true },
      { name: 'Conv3 (random)', frozen: false, params: '73.9K', trainable: true },
      { name: 'Conv4 (random)', frozen: false, params: '147.6K', trainable: true },
      { name: 'Conv5 (random)', frozen: false, params: '295.2K', trainable: true },
      { name: 'FC Layer (new)', frozen: false, params: '513K', trainable: true },
    ],
  },
};

export default function TransferLearningPlayground() {
  const [strategy, setStrategy] = useState<Strategy>('extraction');
  const [datasetSize, setDatasetSize] = useState(100);

  const config = STRATEGIES[strategy];
  const trainableParams = config.layers.filter(l => l.trainable).length;
  const totalParams = config.layers.length;
  const trainablePercent = (trainableParams / totalParams * 100).toFixed(0);

  const estimatedAccuracy = useMemo(() => {
    let base = strategy === 'train-scratch' ? 40 : 75;
    if (strategy === 'finetune-all') base = datasetSize > 500 ? 92 : 78;
    if (strategy === 'finetune-top') base = datasetSize > 100 ? 88 : 82;
    if (strategy === 'extraction') base = datasetSize > 50 ? 85 : 78;
    const sizeBonus = Math.min(datasetSize / 1000, 15);
    const seed = strategy.length + datasetSize;
    const noise = ((seed * 9301 + 49297) % 233280 / 233280 - 0.5) * 3;
    return Math.min(98, base + sizeBonus + noise).toFixed(1);
  }, [strategy, datasetSize]);

  const svgW = 500;
  const svgH = 300;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transfer Learning Playground</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Compare different transfer learning strategies. See how freezing/unfreezing layers and dataset size affect performance.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Model Architecture</h3>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <rect width={svgW} height={svgH} fill="rgb(243 244 246)" rx="8" />

            {config.layers.map((layer, i) => {
              const y = 20 + i * 42;
              const w = 300 - i * 20;
              const x = (svgW - w) / 2;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={w} height={32} rx={4}
                    fill={layer.frozen ? '#9CA3AF' : layer.trainable ? '#22C55E' : '#6366F1'}
                    stroke={layer.frozen ? '#6B7280' : layer.trainable ? '#16A34A' : '#4F46E5'}
                    strokeWidth={1.5} />
                  <text x={x + w / 2} y={y + 14} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                    {layer.name}
                  </text>
                  <text x={x + w / 2} y={y + 26} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.8)">
                    {layer.params} {layer.frozen ? '🔒' : '🔓'}
                  </text>
                </g>
              );
            })}

            <text x={svgW / 2} y={svgH - 15} textAnchor="middle" fontSize={10} fill="#6B7280">
              {trainableParams}/{totalParams} layers trainable ({trainablePercent}%)
            </text>
          </svg>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Strategy</h3>
            <div className="space-y-2">
              {(Object.keys(STRATEGIES) as Strategy[]).map(s => (
                <button key={s} onClick={() => setStrategy(s)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${strategy === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {STRATEGIES[s].name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Dataset Size</span><strong>{datasetSize} samples</strong>
            </label>
            <input type="range" min="10" max="2000" step="10" value={datasetSize}
              onChange={(e) => setDatasetSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{config.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{config.description}</p>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <span className="text-xs text-green-600 dark:text-green-400 block">Estimated Accuracy</span>
              <strong className="text-2xl text-green-700 dark:text-green-300">{estimatedAccuracy}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Transfer Learning Strategy Guide</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Small dataset + similar task:</strong> Feature extraction. <strong>Small dataset + different task:</strong> Fine-tune top layers only. <strong>Large dataset + similar task:</strong> Fine-tune all layers with small LR. <strong>Large dataset + different task:</strong> Consider training from scratch.
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Pre-trained Model</span>
            <span>→ Like a skilled chef who knows how to cook. You're teaching them a new cuisine (your specific task).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Feature Extraction</span>
            <span>→ "I'll use your knife skills but learn my own recipes." Keep the fundamentals, change the application.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Fine-tuning</span>
            <span>→ "I'll adapt your style to my taste." Adjust the pre-trained weights slightly for your specific needs.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">From Scratch</span>
            <span>→ "I'll teach a beginner from zero." Possible but requires much more data and time.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
