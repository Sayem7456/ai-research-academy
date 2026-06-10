'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';

const UNET_ARCHITECTURE: Architecture = {
  title: 'U-Net Architecture',
  description: 'Encoder-Decoder with skip connections for semantic segmentation',
  layers: [
    {
      id: 'input',
      type: 'input',
      name: 'Input',
      shape: '572×572×1',
      description: 'Grayscale medical image',
    },
    {
      id: 'enc1',
      type: 'conv',
      name: 'Conv Block 1',
      params: { filters: '64' },
      shape: '568×568×64',
      description: '2× 3×3 conv + ReLU',
    },
    {
      id: 'pool1',
      type: 'pool',
      name: 'Max Pool',
      shape: '284×284×64',
      description: '2×2 max pooling',
    },
    {
      id: 'enc2',
      type: 'conv',
      name: 'Conv Block 2',
      params: { filters: '128' },
      shape: '280×280×128',
      description: '2× 3×3 conv + ReLU',
    },
    {
      id: 'pool2',
      type: 'pool',
      name: 'Max Pool',
      shape: '140×140×128',
      description: '2×2 max pooling',
    },
    {
      id: 'bottleneck',
      type: 'conv',
      name: 'Bottleneck',
      params: { filters: '256' },
      shape: '136×136×256',
      description: 'Deepest layer (lowest resolution)',
      color: 'bg-red-100 border-red-400',
    },
    {
      id: 'up1',
      type: 'conv',
      name: 'Up-Conv 1',
      params: { filters: '128' },
      shape: '272×272×128',
      description: '2×2 transpose convolution',
    },
    {
      id: 'dec2',
      type: 'conv',
      name: 'Conv Block 3',
      params: { filters: '128' },
      shape: '268×268×128',
      description: '2× 3×3 conv + ReLU + skip concat',
    },
    {
      id: 'up2',
      type: 'conv',
      name: 'Up-Conv 2',
      params: { filters: '64' },
      shape: '536×536×64',
      description: '2×2 transpose convolution',
    },
    {
      id: 'dec1',
      type: 'conv',
      name: 'Conv Block 4',
      params: { filters: '64' },
      shape: '532×532×64',
      description: '2× 3×3 conv + ReLU + skip concat',
    },
    {
      id: 'output',
      type: 'output',
      name: 'Output',
      params: { classes: '2' },
      shape: '388×388×2',
      description: 'Segmentation mask (per-pixel classification)',
    },
  ],
  connections: [
    { from: 'enc2', to: 'dec2', type: 'skip' },
    { from: 'enc1', to: 'dec1', type: 'skip' },
  ],
};

export default function UNetVisualizer() {
  const [showSkipConnections, setShowSkipConnections] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">U-Net</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          U-Net is a fully convolutional network for semantic segmentation, featuring a symmetric
          encoder-decoder architecture with skip connections that preserve spatial information.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Architecture Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">Encoder (Contracting Path)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Downsamples the input through convolutions and pooling, capturing semantic information
                at multiple scales.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 mb-1">Bottleneck</h4>
              <p className="text-gray-700 dark:text-gray-300">
                The deepest layer with lowest spatial resolution but highest semantic information.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-1">Decoder (Expanding Path)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Upsamples feature maps and combines them with encoder features via skip connections.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showSkipConnections}
              onChange={(e) => setShowSkipConnections(e.target.checked)}
              className="w-4 h-4"
            />
            Show Skip Connections
          </label>
        </div>

        <ArchitectureViewer
          architecture={{
            ...UNET_ARCHITECTURE,
            connections: showSkipConnections ? UNET_ARCHITECTURE.connections : [],
          }}
          interactive={true}
          showDetails={true}
          vertical={true}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400"
          >
            <h3 className="font-semibold mb-2 text-sm">Skip Connections</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              High-resolution features from encoder are concatenated with upsampled decoder features.
            </p>
            <div className="text-xs space-y-1 font-mono text-gray-600 dark:text-gray-400">
              <div>enc1 (568×568×64) → concat → dec1</div>
              <div>enc2 (280×280×128) → concat → dec2</div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              This preserves spatial details lost during downsampling.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-l-4 border-orange-400"
          >
            <h3 className="font-semibold mb-2 text-sm">U-Shape Design</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              The symmetric encoder-decoder forms a "U" shape:
            </p>
            <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
              <div>↓ Encoder: 572 → 284 → 140 → 136 (bottleneck)</div>
              <div>↑ Decoder: 136 → 272 → 536 (output)</div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Spatial resolution decreases then increases symmetrically.
            </p>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Key Features</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span><strong>Fully Convolutional:</strong> No fully connected layers. Can process images of any size.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span><strong>Data Augmentation:</strong> Originally designed for medical imaging with limited training data.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span><strong>Precise Localization:</strong> Skip connections combine low-level spatial details with high-level semantics.</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Applications</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div>✓ Medical Image Segmentation</div>
            <div>✓ Cell Tracking</div>
            <div>✓ Satellite Image Analysis</div>
            <div>✓ Autonomous Driving</div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            <strong>Original Paper:</strong> "U-Net: Convolutional Networks for Biomedical Image Segmentation" (Ronneberger et al., 2015)
          </p>
        </div>
      </div>
    </div>
  );
}
