'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import LearnMoreSection from './LearnMoreSection';

const GRID = 8;
const ITERATIONS = 30;

const CONTENT_IMAGES = [
  { name: 'Cat', id: 0, pixels: () => {
    const p: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(30));
    for (let y = 2; y <= 5; y++) for (let x = 1; x <= 6; x++) { p[y][x] = 200; }
    for (let y = 3; y <= 4; y++) for (let x = 3; x <= 4; x++) { p[y][x] = 60; }
    return p;
  }},
  { name: 'House', id: 1, pixels: () => {
    const p: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(180));
    for (let y = 4; y <= 7; y++) for (let x = 0; x <= 7; x++) { p[y][x] = 100; }
    for (let y = 1; y <= 3; y++) for (let x = 2; x <= 5; x++) { p[y][x] = 210; }
    for (let y = 2; y <= 3; y++) for (let x = 1; x <= 2; x++) { p[y][x] = 40; }
    return p;
  }},
];

const STYLES = [
  { name: 'Mosaic', id: 0, get: (x: number, y: number, iter: number) => {
    const colors = ['#e11d48', '#fb923c', '#fbbf24', '#34d399', '#3b82f6'];
    const idx = Math.floor((x + y + iter * 0.05) % colors.length);
    return colors[idx];
  }},
  { name: 'Wave', id: 1, get: (x: number, y: number, iter: number) => {
    const v = Math.sin(x * 0.5 + iter * 0.08) * Math.cos(y * 0.5 + iter * 0.06);
    const r = Math.round(100 + v * 100);
    const g = Math.round(50 + v * 80);
    const b = Math.round(200 + v * 55);
    return `rgb(${r}, ${g}, ${b})`;
  }},
  { name: 'Starry', id: 2, get: (x: number, y: number, iter: number) => {
    const stars = Math.sin(x * 3 + y * 7 + iter * 0.1) > 0.7 ? 255 : 200;
    const base = Math.round(20 + Math.sin(x + y * 0.5) * 30);
    return `rgb(${base}, ${base}, ${stars})`;
  }},
  { name: 'Sketch', id: 3, get: (x: number, y: number, iter: number) => {
    const edge = Math.abs(Math.sin(x * 1.5 + iter * 0.05)) * 255;
    const fill = Math.round(Math.max(0, 255 - edge));
    return `rgb(${fill}, ${fill}, ${fill})`;
  }},
];

function parseColor(color: string): [number, number, number] {
  const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgb) return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  return [128, 128, 128];
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function gramMatrix(pixels: number[][][]): number[][] {
  const G = Array.from({ length: 3 }, () => [0, 0, 0]);
  const n = pixels.length * pixels[0].length;
  for (const row of pixels) for (const [r, g, b] of row) {
    G[0][0] += r * r; G[0][1] += r * g; G[0][2] += r * b;
    G[1][1] += g * g; G[1][2] += g * b; G[2][2] += b * b;
  }
  for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) {
    G[i][j] /= n; G[j][i] = G[i][j];
  }
  return G;
}

function gramLoss(gramA: number[][], gramB: number[][]): number {
  let loss = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) loss += (gramA[i][j] - gramB[i][j]) ** 2;
  return Math.sqrt(loss / 9);
}

function computeOutput(iter: number, contentPixels: number[][], styleIdx: number, alpha: number, beta: number) {
  const cssGrid: string[][] = Array.from({ length: GRID }, () => Array(GRID).fill(''));
  const numGrid: number[][][] = Array.from({ length: GRID }, () => Array(GRID).fill([0, 0, 0]));
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const contentVal = contentPixels[y][x];
      const styleColor = STYLES[styleIdx].get(x, y, iter);
      const [sR, sG, sB] = parseColor(styleColor);
      if (iter === 0) {
        cssGrid[y][x] = styleColor;
        numGrid[y][x] = [sR, sG, sB];
      } else {
        const mix = Math.min(1, iter / ITERATIONS);
        const styleWeight = beta / (alpha + beta);
        const finalStyle = styleWeight;
        const finalContent = 1 - styleWeight;
        const styleMix = (1 - mix) * 1 + mix * finalStyle;
        const contentMix = mix * finalContent;
        const total = styleMix + contentMix;
        const nStyleMix = styleMix / total;
        const nContentMix = contentMix / total;
        const oR = Math.round(sR * nStyleMix + contentVal * nContentMix);
        const oG = Math.round(sG * nStyleMix + contentVal * nContentMix);
        const oB = Math.round(sB * nStyleMix + contentVal * nContentMix);
        cssGrid[y][x] = `rgb(${oR}, ${oG}, ${oB})`;
        numGrid[y][x] = [oR, oG, oB];
      }
    }
  }
  return { cssGrid, numGrid };
}

export default function NeuralStyleTransfer() {
  const [contentIdx, setContentIdx] = useState(0);
  const [styleIdx, setStyleIdx] = useState(0);
  const [iter, setIter] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [alpha, setAlpha] = useState(1);
  const [beta, setBeta] = useState(10000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contentPixels = useMemo(() => CONTENT_IMAGES[contentIdx].pixels(), [contentIdx]);

  const outputData = useMemo(() => {
    const { cssGrid, numGrid } = computeOutput(iter, contentPixels, styleIdx, alpha, beta);
    const stylePixels: number[][][] = Array.from({ length: GRID }, (_, y) =>
      Array.from({ length: GRID }, (_, x) => parseColor(STYLES[styleIdx].get(x, y, iter)))
    );
    const styleGram = gramMatrix(stylePixels);
    const outputGram = gramMatrix(numGrid);
    const sLoss = gramLoss(styleGram, outputGram);
    let cLoss = 0;
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const [r, g, b] = numGrid[y][x];
      cLoss += (contentPixels[y][x] - luminance(r, g, b)) ** 2;
    }
    cLoss = Math.sqrt(cLoss / (GRID * GRID));
    const tLoss = alpha * cLoss + beta * sLoss;
    const lossHistory: { content: number; style: number; total: number }[] = [];
    for (let i = 0; i <= ITERATIONS; i++) {
      const out = computeOutput(i, contentPixels, styleIdx, alpha, beta);
      const sp = Array.from({ length: GRID }, (_, y) =>
        Array.from({ length: GRID }, (_, x) => parseColor(STYLES[styleIdx].get(x, y, i)))
      );
      const sg = gramMatrix(sp);
      const og = gramMatrix(out.numGrid);
      const sl = gramLoss(sg, og);
      let cl = 0;
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
        const [r, g, b] = out.numGrid[y][x];
        cl += (contentPixels[y][x] - luminance(r, g, b)) ** 2;
      }
      cl = Math.sqrt(cl / (GRID * GRID));
      lossHistory.push({ content: cl, style: sl, total: alpha * cl + beta * sl });
    }
    return { cssGrid, numGrid, cLoss, sLoss, tLoss, lossHistory };
  }, [contentPixels, styleIdx, iter, alpha, beta]);

  const outputPixels = outputData.cssGrid;
  const cLoss = outputData.cLoss;
  const sLoss = outputData.sLoss;
  const tLoss = outputData.tLoss;
  const lossHistory = outputData.lossHistory;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setIter(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setIter(step);
      if (step >= ITERATIONS) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setIsAnimating(false);
      }
    }, 200);
  }, []);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Neural Style Transfer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Neural Style Transfer (Gatys et al., 2016) separates content and style using VGG.
          Content is captured by feature activations, style by Gram matrix correlations.
          Optimizing the combined loss produces the stylized result.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <div className="flex gap-1">
              {CONTENT_IMAGES.map((c, i) => (
                <button key={i} onClick={() => { setContentIdx(i); stopAnim(); setIter(0); }}
                  className={`flex-1 px-2 py-1.5 text-xs rounded ${contentIdx === i ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Style</label>
            <div className="flex gap-1 flex-wrap">
              {STYLES.map((s, i) => (
                <button key={i} onClick={() => { setStyleIdx(i); stopAnim(); setIter(0); }}
                  className={`px-2 py-1.5 text-xs rounded ${styleIdx === i ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">α (Content): {alpha}</label>
            <input type="range" min="0.1" max="10" step="0.1" value={alpha}
              onChange={e => setAlpha(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">β (Style): {beta.toFixed(0)}</label>
            <input type="range" min="100" max="100000" step="100" value={beta}
              onChange={e => setBeta(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={isAnimating ? stopAnim : startAnim}
              className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
              {isAnimating ? '■ Stop' : '▶ Optimize'}
            </button>
            <button onClick={() => { stopAnim(); setIter(0); }}
              className="px-3 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* Grid display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Content */}
          <div className="text-center">
            <h3 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">Content</h3>
            <div className="border-2 border-green-400 rounded overflow-hidden inline-block bg-white dark:bg-gray-800">
              <svg viewBox={`0 0 ${GRID} ${GRID}`} width={160} height={160}>
                {contentPixels.map((row, y) => row.map((val, x) => (
                  <rect key={`c-${y}-${x}`} x={x} y={y} width={1} height={1}
                    fill={`rgb(${val}, ${val}, ${val})`} />
                )))}
              </svg>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {CONTENT_IMAGES[contentIdx].name}
            </div>
          </div>

          {/* Style */}
          <div className="text-center">
            <h3 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-400">Style</h3>
            <div className="border-2 border-purple-400 rounded overflow-hidden inline-block bg-white dark:bg-gray-800">
              <svg viewBox={`0 0 ${GRID} ${GRID}`} width={160} height={160}>
                {Array.from({ length: GRID }).map((_, y) =>
                  Array.from({ length: GRID }).map((_, x) => (
                    <rect key={`s-${y}-${x}`} x={x} y={y} width={1} height={1}
                      fill={STYLES[styleIdx].get(x, y, 0)} />
                  ))
                )}
              </svg>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{STYLES[styleIdx].name}</div>
          </div>

          {/* Stylized Output */}
          <div className="text-center">
            <h3 className="font-semibold text-sm mb-2 text-amber-700 dark:text-amber-400">
              Output (iter {iter}/{ITERATIONS})
            </h3>
            <div className="border-2 border-amber-400 rounded overflow-hidden inline-block bg-white dark:bg-gray-800">
              <motion.svg viewBox={`0 0 ${GRID} ${GRID}`} width={160} height={160}
                initial={false}>
                {outputPixels.map((row, y) => row.map((val, x) => (
                  <rect key={`o-${y}-${x}`} x={x} y={y} width={1} height={1}
                    fill={val} />
                )))}
              </motion.svg>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {iter === 0 ? 'Not started' : `Iter ${iter} — evolving...`}
            </div>
          </div>
        </div>

        {/* Loss curves */}
        {iter > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Loss Curves</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Content Loss</div>
                <div className="text-sm font-bold font-mono text-green-600 dark:text-green-400">{cLoss.toFixed(1)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Style Loss</div>
                <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">{sLoss.toFixed(3)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2 text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Total Loss</div>
                <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">{tLoss.toFixed(1)}</div>
              </div>
            </div>
            <div className="flex items-end gap-[2px] h-20">
              {lossHistory.map((h, i) => {
                const maxLoss = Math.max(...lossHistory.map(x => x.total), 1);
                const normH = Math.min(100, (h.total / maxLoss) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full rounded-t transition-all duration-200"
                      style={{
                        height: `${normH}%`,
                        backgroundColor: i <= iter ? '#f59e0b' : '#e5e7eb',
                        opacity: i <= iter ? 1 : 0.3,
                      }} />
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
              Total loss (normalized) — decreases as optimization progresses
            </div>
          </motion.div>
        )}

        {/* How it works */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
            <h3 className="font-semibold text-sm mb-2">Content Loss</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              L₂ distance between VGG feature maps of content and output. Preserves spatial structure.
            </p>
            <div className="mt-1 text-xs font-mono text-gray-600 dark:text-gray-400">
              L_c = ||F^l − P^l||²
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
            <h3 className="font-semibold text-sm mb-2">Style Loss</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              L₂ distance between Gram matrices. Style discards spatial layout; only texture matters.
            </p>
            <div className="mt-1 text-xs font-mono text-gray-600 dark:text-gray-400">
              L_s = ||G^l − A^l||²
            </div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-semibold text-sm mb-2">Total Loss</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              α·L_c + β·L_s. α/β ratio controls content vs style tradeoff.
            </p>
            <div className="mt-1 text-xs font-mono text-gray-600 dark:text-gray-400">
              L_total = α·L_c + β·L_s
            </div>
          </div>
        </div>

        {/* Learn More Section */}
        <LearnMoreSection
          title="Learn Neural Style Transfer"
          gradientFrom="from-pink-50"
          gradientTo="to-purple-50"
          darkGradientFrom="from-pink-950/30"
          darkGradientTo="from-purple-950/30"
          hoverFrom="hover:from-pink-100"
          hoverTo="hover:to-purple-100"
          darkHoverFrom="dark:hover:from-pink-950/50"
          darkHoverTo="dark:hover:to-purple-950/50"
          analogyTitle="Painting with Neural Brushes"
          analogyIcon="🎨"
          analogyContent={
            <>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Imagine you have a photo of a cat and want to paint it in the style of Van Gogh's
                Starry Night. You keep the cat's structure (content) but replace the brushstrokes
                and color palette (style). Neural style transfer does exactly this using deep features.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-pink-600 text-[10px] mb-2">Content Representation</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Deep CNN layers capture spatial structure. Higher layers preserve content
                    while discarding specific pixel values. Content loss minimizes L₂ distance
                    between feature maps.
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-purple-600 text-[10px] mb-2">Style Representation</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Gram matrices of feature maps capture texture correlations across channels.
                    Style loss compares Gram matrices, ignoring spatial layout.
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Key insight:</strong> Style transfer optimizes the input image (not the network)
                to minimize a weighted combination of content and style loss. The network (VGG) is frozen;
                only the generated image is updated.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-rose-700 dark:text-rose-400">🧮 Gram Matrix</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    G = F × Fᵀ where F is the feature map (C×HW). G captures correlations between
                    feature channels, representing texture independent of spatial arrangement.
                  </p>
                </div>
                <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg border-l-4 border-fuchsia-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-fuchsia-700 dark:text-fuchsia-400">⚡ Fast Style Transfer</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Train a feed-forward network to approximate style transfer in one forward pass.
                    Much faster than optimization-based methods (Johnson et al., 2016).
                  </p>
                </div>
              </div>
            </>
          }
          stepsTitle="How Neural Style Transfer Works"
          stepsContent={[
            { step: 1, title: 'Feature Extraction', desc: 'Use pretrained VGG-19 to extract content and style features.', formula: 'image → VGG → feature maps at relu1_2, relu2_2, ...' },
            { step: 2, title: 'Content Loss', desc: 'Compute L₂ distance between content and output feature maps at higher layers.', formula: 'L_c = Σ ||F^l - P^l||²' },
            { step: 3, title: 'Style Loss', desc: 'Compute L₂ distance between Gram matrices of style and output.', formula: 'L_s = Σ ||G^l - A^l||²' },
            { step: 4, title: 'Optimization', desc: 'Update generated image to minimize total loss α·L_c + β·L_s.', formula: 'image ← image - lr * ∇(α·L_c + β·L_s)' },
          ]}
          simpleTitle="Style Transfer with PyTorch"
          simpleCode={`import torch
import torch.nn as nn
import torchvision.models as models

# Load pretrained VGG-19
vgg = models.vgg19(pretrained=True).features.eval()

# Freeze parameters
for param in vgg.parameters():
    param.requires_grad = False

def gram_matrix(x):
    B, C, H, W = x.shape
    features = x.view(B, C, H * W)
    gram = torch.bmm(features, features.transpose(1, 2))
    return gram / (C * H * W)

# Content loss
content_loss = nn.MSELoss()

# Style loss
def style_loss(style_features, output_features):
    loss = 0
    for s_f, o_f in zip(style_features, output_features):
        loss += nn.MSELoss()(gram_matrix(s_f), gram_matrix(o_f))
    return loss

# Optimization loop
target = content_image.clone().requires_grad_(True)
optimizer = torch.optim.Adam([target], lr=0.01)

for i in range(300):
    output_features = vgg(target)
    c_loss = content_loss(output_features[-1], content_target)
    s_loss = style_loss(output_features, style_targets)
    total_loss = c_loss + 1e6 * s_loss
    
    optimizer.zero_grad()
    total_loss.backward()
    optimizer.step()`}
          scratchTitle="Style Transfer from scratch"
          scratchCode={`import torch
import torch.nn as nn

class GramLayer(nn.Module):
    def forward(self, x):
        B, C, H, W = x.shape
        x = x.view(B, C, H * W)
        return torch.bmm(x, x.transpose(1, 2)) / (C * H * W)

class StyleTransferNet(nn.Module):
    def __init__(self):
        super().__init__()
        # Simple encoder
        self.enc1 = nn.Sequential(nn.Conv2d(3, 64, 3, padding=1), nn.ReLU())
        self.enc2 = nn.Sequential(nn.Conv2d(64, 128, 3, padding=1), nn.ReLU())
        self.enc3 = nn.Sequential(nn.Conv2d(128, 256, 3, padding=1), nn.ReLU())
        self.pool = nn.MaxPool2d(2, 2)
        
        # Decoder
        self.up1 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.up2 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec = nn.Conv2d(64, 3, 1)
        self.tanh = nn.Tanh()
    
    def forward(self, x):
        x = self.pool(self.enc1(x))
        x = self.pool(self.enc2(x))
        x = self.enc3(x)
        x = self.tanh(self.dec(self.up2(self.up1(x))))
        return x

# Gram matrix loss
def gram_loss(features1, features2):
    gram = GramLayer()
    g1 = gram(features1)
    g2 = gram(features2)
    return nn.MSELoss()(g1, g2)

# Example
model = StyleTransferNet()
content_img = torch.randn(1, 3, 256, 256)
style_img = torch.randn(1, 3, 256, 256)
target = content_img.clone().requires_grad_(True)

optimizer = torch.optim.Adam([target], lr=0.01)
for i in range(100):
    output = model(target)
    loss = gram_loss(output, style_img)  # simplify: only style loss
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()`}
        />
      </div>
    </div>
  );
}
