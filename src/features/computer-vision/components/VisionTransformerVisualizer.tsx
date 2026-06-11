'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';

const VIT_ARCHITECTURE: Architecture = {
  title: 'Vision Transformer (ViT)',
  description: 'Apply Transformer architecture directly to image patches',
  layers: [
    {
      id: 'input',
      type: 'input',
      name: 'Input Image',
      shape: '224×224×3',
      description: 'RGB image input',
    },
    {
      id: 'patch',
      type: 'conv',
      name: 'Patch Embedding',
      params: { patches: '16×16', num: '196' },
      shape: '196×768',
      description: 'Split image into 14×14 = 196 patches, flatten and embed',
    },
    {
      id: 'pos',
      type: 'norm',
      name: 'Position Embedding',
      shape: '197×768',
      description: 'Add learnable position embeddings + [CLS] token',
    },
    {
      id: 'enc1',
      type: 'attention',
      name: 'Transformer Block ×1',
      params: { heads: '12', layers: '1' },
      shape: '197×768',
      description: 'Multi-head self-attention + FFN',
    },
    {
      id: 'enc2',
      type: 'attention',
      name: 'Transformer Block ×2-11',
      params: { heads: '12', layers: '10' },
      shape: '197×768',
      description: '10 more transformer blocks (total 12)',
    },
    {
      id: 'enc3',
      type: 'attention',
      name: 'Transformer Block ×12',
      params: { heads: '12', layers: '1' },
      shape: '197×768',
      description: 'Final transformer block',
    },
    {
      id: 'norm',
      type: 'norm',
      name: 'Layer Norm',
      shape: '197×768',
      description: 'Normalize before classification',
    },
    {
      id: 'cls',
      type: 'fc',
      name: 'MLP Head',
      params: { hidden: '3072' },
      shape: '1×768 → 1000',
      description: 'Extract [CLS] token and classify',
    },
    {
      id: 'output',
      type: 'output',
      name: 'Output',
      shape: '1000',
      description: 'Class probabilities',
    },
  ],
};

export default function VisionTransformerVisualizer() {
  const [patchSize, setPatchSize] = useState(16);
  const imageSize = 224;
  const numPatches = Math.pow(imageSize / patchSize, 2);

  const renderPatchGrid = () => {
    const patchesPerSide = imageSize / patchSize;
    const displaySize = Math.min(patchesPerSide, 14);
    const cellSize = Math.min(40, Math.floor(560 / displaySize));
    const totalSize = cellSize * displaySize;

    return (
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-semibold mb-2">Patch Extraction</h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {patchesPerSide}×{patchesPerSide} = {numPatches} patches
        </div>
        <svg width={totalSize} height={totalSize} className="border-2 border-gray-300 dark:border-gray-600 rounded">
          {Array.from({ length: displaySize }).map((_, i) =>
            Array.from({ length: displaySize }).map((_, j) => (
              <motion.rect
                key={`${i}-${j}`}
                x={j * cellSize}
                y={i * cellSize}
                width={cellSize - 2}
                height={cellSize - 2}
                fill={`hsl(${(i * displaySize + j) * (360 / (displaySize * displaySize))}, 70%, 80%)`}
                stroke="#666"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i * displaySize + j) * 0.01 }}
              />
            ))
          )}
        </svg>
        {patchesPerSide > 14 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Showing {displaySize}×{displaySize} of {patchesPerSide}×{patchesPerSide} patches
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Vision Transformer (ViT)</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ViT applies the Transformer architecture (originally designed for NLP) directly to images
          by treating image patches as tokens.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Key Innovation</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Instead of using convolutional layers, ViT splits the image into fixed-size patches,
            linearly embeds them, and processes them with a standard Transformer encoder.
          </p>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono bg-white dark:bg-gray-800 p-2 rounded">
            <div>1. Image (224×224×3) → Split into patches (16×16)</div>
            <div>2. Patches (196) → Linear embedding (196×768)</div>
            <div>3. Add position embeddings + [CLS] token</div>
            <div>4. Pass through Transformer encoder (12 layers)</div>
            <div>5. Extract [CLS] token → Classify</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Patch Size: {patchSize}×{patchSize}
              </label>
              <input
                type="range"
                min="8"
                max="32"
                step="8"
                value={patchSize}
                onChange={(e) => setPatchSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Smaller patches = more tokens = higher computation
              </div>
            </div>
            {renderPatchGrid()}
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400"
            >
              <h4 className="font-semibold text-sm mb-2">Self-Attention</h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Each patch attends to all other patches, capturing global context unlike CNNs
                which use local receptive fields.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-l-4 border-orange-400"
            >
              <h4 className="font-semibold text-sm mb-2">[CLS] Token</h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                A learnable classification token prepended to the sequence. Its final representation
                is used for classification (similar to BERT).
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400"
            >
              <h4 className="font-semibold text-sm mb-2">Position Embeddings</h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                1D learnable position embeddings are added to patch embeddings to retain spatial
                information (patches are otherwise orderless).
              </p>
            </motion.div>
          </div>
        </div>

        <ArchitectureViewer
          architecture={VIT_ARCHITECTURE}
          interactive={true}
          showDetails={true}
        />

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">ViT vs CNN</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">CNN (Traditional)</h4>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>✓ Strong inductive bias (locality, translation equivariance)</li>
                <li>✓ Works well with limited data</li>
                <li>✗ Limited global context (small receptive fields)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">ViT (Transformer)</h4>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>✓ Global attention from the start</li>
                <li>✓ Scales better with large datasets</li>
                <li>✗ Needs more data to train (less inductive bias)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Key Results</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Pre-trained on large datasets (ImageNet-21k, JFT-300M), ViT matches or exceeds CNN performance.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>ViT-Huge achieves 88.55% on ImageNet with less compute during pre-training than ResNet.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>ViT has inspired many follow-ups: DeiT, Swin Transformer, BEiT, MAE.</span>
            </li>
          </ul>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            <strong>Paper:</strong> "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale" (Dosovitskiy et al., 2020)
          </p>
        </div>
      </div>
    </div>
  );
}
