'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';
import LearnMoreSection from './LearnMoreSection';

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
                className="w-full cursor-pointer"
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
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">CNN (Traditional)</h4>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>✓ Strong inductive bias (locality, translation equivariance)</li>
                <li>✓ Works well with limited data</li>
                <li>✗ Limited global context (small receptive fields)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">ViT (Transformer)</h4>
              <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <li>✓ Global attention from the start</li>
                <li>✓ Scales better with large datasets</li>
                <li>✗ Needs more data to train (less inductive bias)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
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

      <LearnMoreSection
        title="Learn More: Vision Transformer Patching"
        gradientFrom="from-purple-500"
        gradientTo="to-pink-500"
        darkGradientFrom="from-purple-600"
        darkGradientTo="to-pink-600"
        hoverFrom="hover:from-purple-600"
        hoverTo="hover:to-pink-600"
        darkHoverFrom="dark:hover:from-purple-700"
        darkHoverTo="dark:hover:to-pink-700"
        analogyTitle="The Mosaic Tile Analogy"
        analogyIcon="🧩"
        analogyContent={
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Think of an image as a <strong>mosaic made of tiles</strong>. ViT cuts the image into a grid
            of fixed-size patches (like 16×16 tiles), flattens each tile into a vector, and feeds them
            as a sequence to a Transformer — just like words in a sentence. Position embeddings tell the
            Transformer which tile came from where, so spatial order isn't lost.
          </p>
        }
        stepsTitle="How ViT Processes Images"
        stepsContent={[
          {
            step: 1,
            title: "Split image into patches",
            desc: "The 224×224 image is divided into non-overlapping patches of size P×P (e.g., 16×16).",
            formula: "N = (H/P) × (W/P) = (224/16)² = 196 patches"
          },
          {
            step: 2,
            title: "Linearly embed patches",
            desc: "Each P×P×3 patch is flattened to a vector and projected to dimension D via a learned linear layer.",
            formula: "x_i = Flatten(patch_i) · E,  where E ∈ ℝ^(P²·3 × D)"
          },
          {
            step: 3,
            title: "Add [CLS] token and position embeddings",
            desc: "A learnable [CLS] token is prepended, and 1D position embeddings are added to all tokens.",
            formula: "z_0 = [x_cls; x_1; x_2; ...; x_N] + E_pos"
          },
          {
            step: 4,
            title: "Transformer encoder processes sequence",
            desc: "L layers of multi-head self-attention + FFN. Each patch attends to all other patches globally.",
            formula: "z_l = MSA(LN(z_{l-1})) + z_{l-1}"
          },
          {
            step: 5,
            title: "Classify from [CLS] token",
            desc: "The final [CLS] token representation is normalized and fed to an MLP head for classification.",
            formula: "y = MLP(LN(z_L^0))"
          }
        ]}
        simpleTitle="Vision Transformer in PyTorch"
        simpleCode={`class VisionTransformer(nn.Module):
    def __init__(self, img_size=224, patch_size=16, dim=768, heads=12, layers=12, classes=1000):
        super().__init__()
        num_patches = (img_size // patch_size) ** 2

        # Patch embedding: conv2d with kernel=patch_size, stride=patch_size
        self.patch_embed = nn.Conv2d(3, dim, patch_size, stride=patch_size)
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        self.pos_embed = nn.Parameter(torch.randn(1, num_patches + 1, dim))

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(d_model=dim, nhead=heads)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=layers)

        self.norm = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, classes)

    def forward(self, x):
        B = x.shape[0]
        x = self.patch_embed(x).flatten(2).transpose(1, 2)  # (B, N, D)

        cls = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls, x], dim=1)  # (B, N+1, D)
        x = x + self.pos_embed

        x = self.transformer(x)
        x = self.norm(x[:, 0])  # [CLS] token
        return self.head(x)`}
        scratchTitle="ViT Forward Pass from Scratch"
        scratchCode={`import numpy as np

def patch_embedding(x, W_embed, patch_size=16):
    """
    x: image (B, C, H, W)
    W_embed: (P*P*C, D) projection matrix
    """
    B, C, H, W = x.shape
    P = patch_size
    N = (H // P) * (W // P)

    # Extract patches and flatten
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = x[:, :, i:i+P, j:j+P]  # (B, C, P, P)
            patches.append(patch.reshape(B, -1))  # (B, C*P*P)

    # Stack and project
    patch_seq = np.stack(patches, axis=1)  # (B, N, C*P*P)
    embeddings = patch_seq @ W_embed  # (B, N, D)
    return embeddings

def vit_forward(x, W_embed, W_pos, W_qkv, W_out, W_mlp, cls_token):
    # Patch + position embeddings
    z = patch_embedding(x, W_embed)  # (B, N, D)
    z = np.concatenate([cls_token, z], axis=1)  # prepend [CLS]
    z = z + W_pos  # add position embeddings

    # Self-attention
    Q = z @ W_qkv['W_q']  # (B, N+1, D)
    K = z @ W_qkv['W_k']
    V = z @ W_qkv['W_v']
    attn = softmax(Q @ K.T / np.sqrt(K.shape[-1]))
    z = z + attn @ V  # residual connection

    # Feed-forward
    z = z + relu(z @ W_mlp['W1'] + W_mlp['b1']) @ W_mlp['W2']

    # Classify from [CLS] token
    return z[:, 0] @ W_out`}
      />
    </div>
  );
}
