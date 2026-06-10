'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ULayer {
  name: string;
  color: string;
  textColor: string;
  width: number;
  isBottleneck?: boolean;
}

const ENCODER: ULayer[] = [
  { name: 'Input\n572×572×1', color: 'bg-blue-400', textColor: 'text-white', width: 80 },
  { name: 'Conv\n568×568×64', color: 'bg-purple-500', textColor: 'text-white', width: 72 },
  { name: 'Pool\n284×284×64', color: 'bg-green-500', textColor: 'text-white', width: 56 },
  { name: 'Conv\n280×280×128', color: 'bg-purple-600', textColor: 'text-white', width: 56 },
  { name: 'Pool\n140×140×128', color: 'bg-green-500', textColor: 'text-white', width: 44 },
  { name: 'Bottleneck\n136×136×256', color: 'bg-red-500', textColor: 'text-white', width: 36, isBottleneck: true },
];

const DECODER: ULayer[] = [
  { name: 'Up-Conv\n272×272×128', color: 'bg-orange-500', textColor: 'text-white', width: 44 },
  { name: 'Conv\n268×268×128', color: 'bg-purple-600', textColor: 'text-white', width: 44 },
  { name: 'Up-Conv\n536×536×64', color: 'bg-orange-500', textColor: 'text-white', width: 56 },
  { name: 'Conv\n532×532×64', color: 'bg-purple-500', textColor: 'text-white', width: 56 },
  { name: 'Output\n388×388×2', color: 'bg-emerald-500', textColor: 'text-white', width: 64 },
];

const SKIP_PAIRS = [
  { encIdx: 3, decIdx: 1, label: 'Encoder 3 → Decoder 3' },
  { encIdx: 1, decIdx: 3, label: 'Encoder 1 → Decoder 1' },
];

export default function UNetExplorer() {
  const [showSkips, setShowSkips] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);
  const [hoveredConnection, setHoveredConnection] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPhases = ENCODER.length + DECODER.length + 1;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
    setAnimPhase(0);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(1);
    intervalRef.current = setInterval(() => {
      setAnimPhase(prev => {
        if (prev >= totalPhases) { stopAnim(); return prev; }
        return prev + 1;
      });
    }, 700);
  }, [totalPhases, stopAnim]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-2">U-Net Explorer</h2>
        <p className="text-gray-600 mb-6">
          U-Net's symmetric encoder-decoder design with skip connections enables precise
          segmentation by combining high-level semantic features with low-level spatial details.
        </p>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={showSkips}
                onChange={(e) => setShowSkips(e.target.checked)}
                className="w-4 h-4" />
              Show Skip Connections
            </label>
            <button onClick={isAnimating ? stopAnim : startAnim}
              className={`px-4 py-2 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
              {isAnimating ? 'Stop' : 'Animate Flow'}
            </button>
            <button onClick={stopAnim}
              className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-3">Encoder (Contracting)</div>

          <div className="flex flex-col items-center gap-1 relative">
            {ENCODER.map((layer, i) => {
              const phaseIdx = i + 1;
              const isActive = isAnimating && animPhase >= phaseIdx;
              return (
                <div key={`enc-${i}`} className="flex items-center gap-4">
                  <motion.div
                    animate={isActive ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0.5, scale: 0.9, x: -10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`${layer.color} ${layer.textColor} rounded px-3 py-2 text-[10px] font-semibold text-center leading-tight shadow-sm border border-white/20`}
                    style={{ width: layer.width }}
                  >
                    {layer.name.split('\n').map((line, li) => (
                      <div key={li}>{line}</div>
                    ))}
                  </motion.div>
                  {i < ENCODER.length - 1 && (
                    <motion.div
                      animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
                      className="text-gray-400 text-xs"
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
                    className="text-[10px] font-mono bg-emerald-50 px-3 py-1 rounded border border-emerald-300 cursor-pointer transition-all whitespace-nowrap"
                  >
                    ⇢ {pair.label}
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              animate={isAnimating && animPhase >= ENCODER.length + 1 ? { scale: [1, 1.1, 1], backgroundColor: '#fef3c7' } : {}}
              transition={{ duration: 0.5 }}
              className="px-4 py-3 bg-red-50 border-2 border-red-400 rounded text-center"
            >
              <div className="text-[10px] font-semibold text-red-800">Bottleneck</div>
              <div className="text-[9px] text-gray-600">Lowest resolution</div>
              <div className="text-[9px] text-gray-600">Highest semantics</div>
            </motion.div>
          </div>

          <div className="text-xs text-gray-500 mb-3">Decoder (Expanding)</div>

          <div className="flex flex-col items-center gap-1 relative">
            {DECODER.map((layer, i) => {
              const phaseIdx = ENCODER.length + 2 + i;
              const isActive = isAnimating && animPhase >= phaseIdx;
              return (
                <div key={`dec-${i}`} className="flex items-center gap-4">
                  {i < DECODER.length - 1 && (
                    <motion.div
                      animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
                      className="text-gray-400 text-xs"
                    >
                      ↑
                    </motion.div>
                  )}
                  <motion.div
                    animate={isActive ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0.5, scale: 0.9, x: 10 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`${layer.color} ${layer.textColor} rounded px-3 py-2 text-[10px] font-semibold text-center leading-tight shadow-sm border border-white/20`}
                    style={{ width: layer.width }}
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
            className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400"
          >
            <h3 className="font-semibold text-sm mb-2">Encoder Path</h3>
            <p className="text-xs text-gray-700">
              Extracts features at multiple scales using convolutional blocks and max pooling.
              Reduces spatial resolution while increasing channel depth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400"
          >
            <h3 className="font-semibold text-sm mb-2">Bottleneck</h3>
            <p className="text-xs text-gray-700">
              The deepest layer where spatial resolution is lowest (136×136) but semantic
              understanding is richest. Contains 256 feature maps.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400"
          >
            <h3 className="font-semibold text-sm mb-2">Skip Connections</h3>
            <p className="text-xs text-gray-700">
              Concatenate encoder features with upsampled decoder features, preserving spatial
              detail lost during downsampling for precise localization.
            </p>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">Key Design Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span><strong>Symmetric U-Shape:</strong> The contracting and expanding paths form a symmetric "U", giving U-Net its name.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span><strong>Feature Concatenation:</strong> Skip connections concatenate (not add) features, preserving all spatial information.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span><strong>Valid Convolutions:</strong> Original U-Net uses valid padding, causing spatial size to decrease slightly at each conv.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
