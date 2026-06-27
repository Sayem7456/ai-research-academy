'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';
import LearnMoreSection from './LearnMoreSection';

const RESNET_ARCHITECTURE: Architecture = {
  title: 'ResNet-50 Architecture',
  description: 'Residual Networks with skip connections for training very deep networks',
  layers: [
    {
      id: 'input',
      type: 'input',
      name: 'Input',
      shape: '224×224×3',
      description: 'RGB image input',
    },
    {
      id: 'conv1',
      type: 'conv',
      name: 'Conv 7×7',
      params: { kernel: '7×7', stride: '2', filters: '64' },
      shape: '112×112×64',
      description: 'Initial convolutional layer with stride 2',
    },
    {
      id: 'pool1',
      type: 'pool',
      name: 'Max Pool',
      params: { kernel: '3×3', stride: '2' },
      shape: '56×56×64',
      description: 'Max pooling to reduce spatial dimensions',
    },
    {
      id: 'res2',
      type: 'residual',
      name: 'Residual Block ×3',
      params: { filters: '256', stride: '1' },
      shape: '56×56×256',
      description: '3 residual blocks with skip connections',
    },
    {
      id: 'res3',
      type: 'residual',
      name: 'Residual Block ×4',
      params: { filters: '512', stride: '2' },
      shape: '28×28×512',
      description: '4 residual blocks, stride 2 in first block',
    },
    {
      id: 'res4',
      type: 'residual',
      name: 'Residual Block ×6',
      params: { filters: '1024', stride: '2' },
      shape: '14×14×1024',
      description: '6 residual blocks, stride 2 in first block',
    },
    {
      id: 'res5',
      type: 'residual',
      name: 'Residual Block ×3',
      params: { filters: '2048', stride: '2' },
      shape: '7×7×2048',
      description: '3 residual blocks, stride 2 in first block',
    },
    {
      id: 'pool2',
      type: 'pool',
      name: 'Global Avg Pool',
      shape: '1×1×2048',
      description: 'Average pooling over entire spatial dimensions',
    },
    {
      id: 'fc',
      type: 'fc',
      name: 'Fully Connected',
      params: { units: '1000' },
      shape: '1000',
      description: 'Classification layer (ImageNet 1000 classes)',
    },
    {
      id: 'output',
      type: 'output',
      name: 'Output',
      shape: '1000',
      description: 'Softmax probabilities',
    },
  ],
  connections: [
    { from: 'res2', to: 'res3', type: 'skip' },
    { from: 'res3', to: 'res4', type: 'skip' },
    { from: 'res4', to: 'res5', type: 'skip' },
  ],
};

export default function ResNetVisualizer() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">ResNet (Residual Networks)</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ResNets enable training of very deep networks using skip connections that add the input
          directly to the output of a block, allowing gradients to flow through residual pathways.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Key Innovation</h3>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300">Skip Connection</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Instead of learning H(x), the block learns residual F(x) = H(x) - x, so H(x) = F(x) + x.
                This allows the network to learn identity functions easily.
              </p>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-300">Bottleneck Block</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Reduces dimensions with 1×1 conv, applies 3×3 conv, then expands back with 1×1 conv.
                This is computationally efficient for deep networks.
              </p>
            </div>
          </div>
        </div>

        <ArchitectureViewer
          architecture={RESNET_ARCHITECTURE}
          interactive={true}
          showDetails={true}
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400"
          >
            <h3 className="font-semibold mb-2 text-sm">Skip Connection Flow</h3>
            <div className="text-xs space-y-2 text-gray-700 dark:text-gray-300">
              <div className="font-mono text-purple-700 dark:text-purple-300">x → [F(x) block] → output</div>
              <div className="text-gray-500 dark:text-gray-400">and in parallel:</div>
              <div className="font-mono text-green-700 dark:text-green-300">x → + (added to output)</div>
              <div className="text-gray-500 dark:text-gray-400 mt-2">Final: output + x</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-l-4 border-orange-400"
          >
            <h3 className="font-semibold mb-2 text-sm">Depth Progression</h3>
            <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300 font-mono">
              <div>ResNet-18: 18 layers (shallow)</div>
              <div>ResNet-34: 34 layers</div>
              <div className="text-blue-700 dark:text-blue-300 font-bold">ResNet-50: 50 layers ← shown</div>
              <div>ResNet-101: 101 layers</div>
              <div>ResNet-152: 152 layers (very deep)</div>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Why Skip Connections Work</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span><strong>Vanishing Gradient:</strong> Skip connections create direct paths for gradients to backpropagate, reducing vanishing gradient problems.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span><strong>Identity Shortcut:</strong> If a layer doesn't need to learn anything, it can easily output the input unchanged (F(x)=0).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span><strong>Improved Optimization:</strong> Networks can be much deeper (50→152 layers) while still training effectively.</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Applications</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div>✓ Image Classification</div>
            <div>✓ Object Detection</div>
            <div>✓ Semantic Segmentation</div>
            <div>✓ Medical Imaging</div>
          </div>
        </div>
      </div>

      <LearnMoreSection
        title="Learn More: ResNet Skip Connections"
        gradientFrom="from-blue-500"
        gradientTo="to-cyan-500"
        darkGradientFrom="from-blue-600"
        darkGradientTo="to-cyan-600"
        hoverFrom="hover:from-blue-600"
        hoverTo="hover:to-cyan-600"
        darkHoverFrom="dark:hover:from-blue-700"
        darkHoverTo="dark:hover:to-cyan-700"
        analogyTitle="The Shortcut Analogy"
        analogyIcon="💡"
        analogyContent={
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Think of skip connections like a <strong>shortcut on a highway</strong>. Instead of forcing
            every car (gradient) to navigate through every exit (layer), skip connections provide direct
            express lanes. If a block doesn't need to learn anything new, it can simply pass the input
            through unchanged — the network learns the identity function trivially.
          </p>
        }
        stepsTitle="How Skip Connections Work"
        stepsContent={[
          {
            step: 1,
            title: "Input passes through convolutional block",
            desc: "The input x is processed by a series of convolutions, batch norm, and ReLU to produce F(x).",
            formula: "x → Conv → BN → ReLU → Conv → BN → F(x)"
          },
          {
            step: 2,
            title: "Skip connection adds input directly",
            desc: "The original input bypasses the block and is added element-wise to the block's output.",
            formula: "output = F(x) + x"
          },
          {
            step: 3,
            title: "Activation applied to combined result",
            desc: "ReLU is applied to the combined result before passing to the next block.",
            formula: "ReLU(F(x) + x) → next block"
          },
          {
            step: 4,
            title: "Gradient flows through identity path",
            desc: "During backpropagation, gradients can flow directly through the skip connection, bypassing the block.",
            formula: "∂L/∂x = ∂L/∂output · (1 + ∂F/∂x)"
          }
        ]}
        simpleTitle="ResNet Block in PyTorch"
        simpleCode={`class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        identity = x                          # save input
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += identity                       # skip connection!
        return F.relu(out)`}
        scratchTitle="ResNet Forward Pass from Scratch"
        scratchCode={`import numpy as np

def resnet_block_forward(x, conv1_w, conv1_b, conv2_w, conv2_b):
    """
    x: input feature map (batch, channels, H, W)
    Returns: output after residual block
    """
    # First convolution
    conv1_out = conv2d(x, conv1_w, conv1_b)
    bn1_out = batch_norm(conv1_out)
    relu1_out = np.maximum(0, bn1_out)

    # Second convolution
    conv2_out = conv2d(relu1_out, conv2_w, conv2_b)
    bn2_out = batch_norm(conv2_out)

    # Skip connection (the magic!)
    output = bn2_out + x  # identity shortcut

    # Final ReLU
    return np.maximum(0, output)`}
      />
    </div>
  );
}
