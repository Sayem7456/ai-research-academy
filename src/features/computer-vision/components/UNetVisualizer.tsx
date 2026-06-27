'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';
import LearnMoreSection from './LearnMoreSection';

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
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Encoder (Contracting Path)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Downsamples the input through convolutions and pooling, capturing semantic information
                at multiple scales.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">Bottleneck</h4>
              <p className="text-gray-700 dark:text-gray-300">
                The deepest layer with lowest spatial resolution but highest semantic information.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1">Decoder (Expanding Path)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Upsamples feature maps and combines them with encoder features via skip connections.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
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
              <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
              <span><strong>Fully Convolutional:</strong> No fully connected layers. Can process images of any size.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
              <span><strong>Data Augmentation:</strong> Originally designed for medical imaging with limited training data.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
              <span><strong>Precise Localization:</strong> Skip connections combine low-level spatial details with high-level semantics.</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
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

      <LearnMoreSection
        title="Learn More: U-Net Encoder-Decoder Architecture"
        gradientFrom="from-cyan-500"
        gradientTo="to-blue-500"
        darkGradientFrom="from-cyan-600"
        darkGradientTo="to-blue-600"
        hoverFrom="hover:from-cyan-600"
        hoverTo="hover:to-blue-600"
        darkHoverFrom="dark:hover:from-cyan-700"
        darkHoverTo="dark:hover:to-blue-700"
        analogyTitle="The Camera Zoom Analogy"
        analogyIcon="📷"
        analogyContent={
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Imagine using a camera with <strong>variable zoom</strong>. The encoder zooms out to capture the
            big picture (semantic meaning), while the decoder zooms back in to pinpoint exact locations.
            Skip connections are like having the original high-res photo available when zooming back in —
            you don't lose the fine details that get blurry when zoomed out.
          </p>
        }
        stepsTitle="U-Net Architecture Steps"
        stepsContent={[
          {
            step: 1,
            title: "Encoder downsamples input",
            desc: "Each encoder block applies two 3×3 convolutions + ReLU, then 2×2 max pooling halves the spatial dimensions.",
            formula: "H×W×C → 2× Conv(3×3) → Pool(2×2) → H/2 × W/2 × 2C"
          },
          {
            step: 2,
            title: "Bottleneck captures semantics",
            desc: "The deepest layer has the smallest spatial size but richest semantic features.",
            formula: "Lowest resolution + Highest feature channels"
          },
          {
            step: 3,
            title: "Decoder upsamples with transpose conv",
            desc: "2×2 transposed convolution doubles spatial dimensions while halving channels.",
            formula: "H×W×C → UpConv(2×2) → 2H × 2W × C/2"
          },
          {
            step: 4,
            title: "Skip connection concatenates features",
            desc: "Encoder features are cropped and concatenated with decoder features to recover spatial details.",
            formula: "decoder_out ⊕ encoder_crop → [concatenated features]"
          }
        ]}
        simpleTitle="U-Net in PyTorch"
        simpleCode={`class UNet(nn.Module):
    def __init__(self, in_channels=1, out_channels=2):
        super().__init__()
        # Encoder
        self.enc1 = self._block(in_channels, 64)
        self.enc2 = self._block(64, 128)
        self.pool = nn.MaxPool2d(2)

        # Bottleneck
        self.bottleneck = self._block(128, 256)

        # Decoder
        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = self._block(256, 128)  # 256 because of concat
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = self._block(128, 64)

        self.out_conv = nn.Conv2d(64, out_channels, 1)

    def forward(self, x):
        # Encoder
        e1 = self.enc1(x);  e2 = self.enc2(self.pool(e1))

        # Bottleneck
        b = self.bottleneck(self.pool(e2))

        # Decoder with skip connections
        d2 = self.dec2(torch.cat([self.up2(b), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
        return self.out_conv(d1)`}
        scratchTitle="U-Net Forward Pass from Scratch"
        scratchCode={`import numpy as np

def unet_encoder_block(x, w1, b1, w2, b2):
    """Two conv layers + ReLU, return pre-pool features"""
    h1 = relu(conv2d(x, w1, b1))
    h2 = relu(conv2d(h1, w2, b2))
    return h2  # save for skip connection

def unet_decoder_block(x, skip, w_up, b_up, w1, b1, w2, b2):
    """Upsample, concat skip, then two conv layers"""
    # Transposed convolution (upsample)
    up = conv_transpose2d(x, w_up, b_up, stride=2)

    # Crop skip features to match upsampled size
    skip_cropped = crop_to_match(skip, up.shape)

    # Concatenate along channel dimension
    concat = np.concatenate([up, skip_cropped], axis=1)

    # Two conv layers
    h1 = relu(conv2d(concat, w1, b1))
    h2 = relu(conv2d(h1, w2, b2))
    return h2

def unet_forward(x, encoder_weights, decoder_weights):
    """Full U-Net forward pass"""
    # Encoder
    e1 = unet_encoder_block(x, *encoder_weights['enc1'])
    e2 = unet_encoder_block(pool(e1), *encoder_weights['enc2'])

    # Bottleneck
    b = relu(conv2d(pool(e2), *encoder_weights['bottleneck']))

    # Decoder with skip connections
    d2 = unet_decoder_block(b, e2, *decoder_weights['dec2'])
    d1 = unet_decoder_block(d2, e1, *decoder_weights['dec1'])

    return d1`}
      />
    </div>
  );
}
