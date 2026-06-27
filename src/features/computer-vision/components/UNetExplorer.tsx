'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import LearnMoreSection from './LearnMoreSection';

interface ULayer {
  name: string;
  color: string;
  textColor: string;
  width: number;
  isBottleneck?: boolean;
}

const ENCODER: ULayer[] = [
  { name: 'Input\n572×572×1', color: 'bg-blue-400', textColor: 'text-white', width: 120 },
  { name: 'Conv\n568×568×64', color: 'bg-purple-500', textColor: 'text-white', width: 110 },
  { name: 'Pool\n284×284×64', color: 'bg-green-500', textColor: 'text-white', width: 90 },
  { name: 'Conv\n280×280×128', color: 'bg-purple-600', textColor: 'text-white', width: 90 },
  { name: 'Pool\n140×140×128', color: 'bg-green-500', textColor: 'text-white', width: 76 },
  { name: 'Bottleneck\n136×136×256', color: 'bg-red-500', textColor: 'text-white', width: 64, isBottleneck: true },
];

const DECODER: ULayer[] = [
  { name: 'Up-Conv\n272×272×128', color: 'bg-orange-500', textColor: 'text-white', width: 76 },
  { name: 'Conv\n268×268×128', color: 'bg-purple-600', textColor: 'text-white', width: 76 },
  { name: 'Up-Conv\n536×536×64', color: 'bg-orange-500', textColor: 'text-white', width: 90 },
  { name: 'Conv\n532×532×64', color: 'bg-purple-500', textColor: 'text-white', width: 90 },
  { name: 'Output\n388×388×2', color: 'bg-emerald-500', textColor: 'text-white', width: 110 },
];

const SKIP_PAIRS = [
  { encIdx: 3, decIdx: 1, label: 'Conv Block 2 (128) → Conv Block 3 (128)' },
  { encIdx: 1, decIdx: 3, label: 'Conv Block 1 (64) → Conv Block 4 (64)' },
];

export default function UNetExplorer() {
  const [showSkips, setShowSkips] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPhases = ENCODER.length + 1 + DECODER.length;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(0);
    let e = 0;
    intervalRef.current = setInterval(() => {
      e++;
      setAnimPhase(e);
      if (e >= totalPhases) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, 700);
  }, [totalPhases]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">U-Net Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          U-Net's symmetric encoder-decoder design with skip connections enables precise
          segmentation by combining high-level semantic features with low-level spatial details.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={showSkips}
                onChange={(e) => setShowSkips(e.target.checked)}
                className="w-4 h-4" />
              Show Skip Connections
            </label>
            <button onClick={isAnimating ? stopAnim : startAnim}
              className={`px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors ${isAnimating ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {isAnimating ? 'Stop' : 'Animate Flow'}
            </button>
            <button onClick={() => { stopAnim(); setAnimPhase(0); }}
              className="px-3 py-2 text-sm rounded-lg cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Reset
            </button>
            {isAnimating && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Step {animPhase}/{totalPhases}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Encoder (Contracting)</div>

          <div className="flex flex-col items-center gap-1 relative">
            {ENCODER.map((layer, i) => {
              const phaseIdx = i + 1;
              const isActive = isAnimating && animPhase >= phaseIdx;
              return (
                <div key={`enc-${i}`} className="flex items-center gap-4">
                  <motion.div
                    animate={isActive ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0.5, scale: 0.9, x: -10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`${layer.color} ${layer.textColor} rounded px-3 py-2 text-[10px] font-semibold text-center leading-tight shadow-sm border border-white/20 w-fit`}
                    style={{ minWidth: layer.width }}
                  >
                    {layer.name.split('\n').map((line, li) => (
                      <div key={li}>{line}</div>
                    ))}
                  </motion.div>
                  {i < ENCODER.length - 1 && (
                    <motion.div
                      animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
                      className="text-gray-400 dark:text-gray-500 text-xs"
                    >
                      ↓
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-8 my-6">
            <div className="flex flex-col items-center gap-2">
              {showSkips && SKIP_PAIRS.map((pair, pi) => {
                const isActive = isAnimating && animPhase >= ENCODER.length + 2 + pi * 2;
                const isHovered = hoveredConnection === pi;
                return (
                  <motion.div
                    key={pi}
                    onMouseEnter={() => setHoveredConnection(pi)}
                    onMouseLeave={() => setHoveredConnection(null)}
                    animate={isActive || isHovered ? {
                      opacity: 1, scale: 1.05, color: '#059669',
                    } : {
                      opacity: 0.4, scale: 0.95,
                    }}
                    className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded border border-emerald-300 dark:border-emerald-700 cursor-pointer transition-all whitespace-nowrap"
                  >
                    ⇢ {pair.label}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              animate={isAnimating && animPhase >= ENCODER.length + 1 ? { scale: [1, 1.1, 1], backgroundColor: '#fef3c7' } : {}}
              transition={{ duration: 0.5 }}
              className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-400 rounded text-center"
            >
              <div className="text-[10px] font-semibold text-red-800 dark:text-red-200">Bottleneck</div>
              <div className="text-[9px] text-gray-600 dark:text-gray-400">Lowest resolution</div>
              <div className="text-[9px] text-gray-600 dark:text-gray-400">Highest semantics</div>
            </motion.div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Decoder (Expanding)</div>

          <div className="flex flex-col items-center gap-1 relative">
            {DECODER.map((layer, i) => {
              const phaseIdx = ENCODER.length + 2 + i;
              const isActive = isAnimating && animPhase >= phaseIdx;
              return (
                <div key={`dec-${i}`} className="flex items-center gap-4">
                  {i < DECODER.length - 1 && (
                    <motion.div
                      animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
                      className="text-gray-400 dark:text-gray-500 text-xs"
                    >
                      ↑
                    </motion.div>
                  )}
                  <motion.div
                    animate={isActive ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0.5, scale: 0.9, x: 10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`${layer.color} ${layer.textColor} rounded px-3 py-2 text-[10px] font-semibold text-center leading-tight shadow-sm border border-white/20 w-fit`}
                    style={{ minWidth: layer.width }}
                  >
                    {layer.name.split('\n').map((line, li) => (
                      <div key={li}>{line}</div>
                    ))}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400"
          >
            <h3 className="font-semibold text-sm mb-2">Encoder Path</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Extracts features at multiple scales using convolutional blocks and max pooling.
              Reduces spatial resolution while increasing channel depth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400"
          >
            <h3 className="font-semibold text-sm mb-2">Bottleneck</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              The deepest layer where spatial resolution is lowest (136×136) but semantic
              understanding is richest. Contains 256 feature maps.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400"
          >
            <h3 className="font-semibold text-sm mb-2">Skip Connections</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Concatenate encoder features with upsampled decoder features, preserving spatial
              detail lost during downsampling for precise localization.
            </p>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Key Design Features</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
              <span><strong>Symmetric U-Shape:</strong> The contracting and expanding paths form a symmetric "U", giving U-Net its name.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
              <span><strong>Feature Concatenation:</strong> Skip connections concatenate (not add) features, preserving all spatial information.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
              <span><strong>Valid Convolutions:</strong> Original U-Net uses valid padding, causing spatial size to decrease slightly at each conv.</span>
            </li>
          </ul>
        </div>

        {/* Learn More Section */}
        <LearnMoreSection
          title="Learn U-Net"
          gradientFrom="from-green-50"
          gradientTo="to-teal-50"
          darkGradientFrom="from-green-950/30"
          darkGradientTo="from-teal-950/30"
          hoverFrom="hover:from-green-100"
          hoverTo="hover:to-teal-100"
          darkHoverFrom="dark:hover:from-green-950/50"
          darkHoverTo="dark:hover:to-teal-950/50"
          analogyTitle="U-Shaped Encoder-Decoder"
          analogyIcon="🔬"
          analogyContent={
            <>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Imagine you want to trace the outline of a tiny object in a high-resolution photo.
                You first shrink the image to understand the overall structure (encoder), then
                gradually upscale while combining details from earlier layers (decoder) to get
                precise pixel-level boundaries.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-green-600 text-[10px] mb-2">Encoder (Contracting)</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Repeatedly applies convolutions and max pooling. Captures context and reduces spatial dimensions.
                    Each level doubles feature channels.
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-teal-600 text-[10px] mb-2">Decoder (Expanding)</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Upsamples feature maps and concatenates with skip connections from encoder.
                    Recovers spatial detail for precise localization.
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Key insight:</strong> Skip connections preserve fine-grained spatial information
                that would otherwise be lost during downsampling. This enables U-Net to achieve
                precise segmentation even with limited training data.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-lime-50 dark:bg-lime-950/30 rounded-lg border-l-4 border-lime-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-lime-700 dark:text-lime-400">🔗 Skip Connections</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Concatenate encoder features with upsampled decoder features at each level.
                    This preserves spatial details lost during pooling.
                  </p>
                </div>
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border-l-4 border-cyan-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-cyan-700 dark:text-cyan-400">🏥 Medical Imaging</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Originally designed for biomedical image segmentation. Works well with small datasets
                    due to data augmentation and the U-architecture.
                  </p>
                </div>
              </div>
            </>
          }
          stepsTitle="How U-Net Works"
          stepsContent={[
            { step: 1, title: 'Encoder Path', desc: 'Apply two 3×3 convolutions + ReLU, then 2×2 max pooling. Double feature channels at each level.', formula: 'input → [Conv→ReLU→Conv→ReLU→Pool] × 4' },
            { step: 2, title: 'Bottleneck', desc: 'Apply two 3×3 convolutions + ReLU at the lowest resolution.', formula: 'lowest resolution feature map (e.g., 28×28×1024)' },
            { step: 3, title: 'Decoder Path', desc: '2×2 up-convolution, concatenate with skip connection, then two 3×3 convolutions.', formula: 'up-conv → concat(skip) → [Conv→ReLU→Conv→ReLU]' },
            { step: 4, title: 'Final Classification', desc: '1×1 convolution maps to number of classes. Output same spatial size as input.', formula: 'final features → 1×1 conv → N classes' },
          ]}
          simpleTitle="U-Net with PyTorch"
          simpleCode={`import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )
    def forward(self, x):
        return self.conv(x)

class UNet(nn.Module):
    def __init__(self, in_ch=1, out_ch=2):
        super().__init__()
        self.enc1 = DoubleConv(in_ch, 64)
        self.enc2 = DoubleConv(64, 128)
        self.enc3 = DoubleConv(128, 256)
        self.enc4 = DoubleConv(256, 512)
        self.pool = nn.MaxPool2d(2)
        
        self.bottleneck = DoubleConv(512, 1024)
        
        self.up4 = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.dec4 = DoubleConv(1024, 512)
        self.up3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3 = DoubleConv(512, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = DoubleConv(256, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = DoubleConv(128, 64)
        
        self.out = nn.Conv2d(64, out_ch, 1)
    
    def forward(self, x):
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        
        # Bottleneck
        b = self.bottleneck(self.pool(e4))
        
        # Decoder with skip connections
        d4 = self.dec4(torch.cat([self.up4(b), e4], dim=1))
        d3 = self.dec3(torch.cat([self.up3(d4), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
        
        return self.out(d1)

# Example
model = UNet(in_ch=1, out_ch=2)
x = torch.randn(1, 1, 572, 572)  # grayscale input
output = model(x)  # (1, 2, 388, 388)`}
          scratchTitle="U-Net components from scratch"
          scratchCode={`import torch
import torch.nn as nn

class EncoderBlock(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, padding=1)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1)
        self.pool = nn.MaxPool2d(2)
        self.relu = nn.ReLU(inplace=True)
    
    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        skip = x  # save for skip connection
        x = self.pool(x)
        return x, skip

class DecoderBlock(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_ch, out_ch, 2, stride=2)
        self.conv1 = nn.Conv2d(out_ch * 2, out_ch, 3, padding=1)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1)
        self.relu = nn.ReLU(inplace=True)
    
    def forward(self, x, skip):
        x = self.up(x)
        # Handle size mismatch
        diffY = skip.size(2) - x.size(2)
        diffX = skip.size(3) - x.size(3)
        x = nn.functional.pad(x, [diffX // 2, diffX - diffX // 2,
                                 diffY // 2, diffY - diffY // 2])
        x = torch.cat([skip, x], dim=1)
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        return x

# Simple U-Net
class SimpleUNet(nn.Module):
    def __init__(self, in_ch=1, out_ch=2):
        super().__init__()
        self.enc1 = EncoderBlock(in_ch, 64)
        self.enc2 = EncoderBlock(64, 128)
        self.enc3 = EncoderBlock(128, 256)
        
        self.bottleneck = nn.Sequential(
            nn.Conv2d(256, 512, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1),
            nn.ReLU(inplace=True)
        )
        
        self.dec3 = DecoderBlock(512, 256)
        self.dec2 = DecoderBlock(256, 128)
        self.dec1 = DecoderBlock(128, 64)
        
        self.out = nn.Conv2d(64, out_ch, 1)
    
    def forward(self, x):
        x, skip1 = self.enc1(x)
        x, skip2 = self.enc2(x)
        x, skip3 = self.enc3(x)
        
        x = self.bottleneck(x)
        
        x = self.dec3(x, skip3)
        x = self.dec2(x, skip2)
        x = self.dec1(x, skip1)
        
        return self.out(x)`}
        />
      </div>
    </div>
  );
}
