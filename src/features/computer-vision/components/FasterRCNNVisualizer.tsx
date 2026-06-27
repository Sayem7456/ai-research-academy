'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import LearnMoreSection from './LearnMoreSection';

const GRID_SIZE = 7;
const FEAT_SIZE = 140;
const CELL_SIZE = FEAT_SIZE / GRID_SIZE;
const ANCHOR_SCALES = [0.3, 0.5, 0.8];
const ASPECT_RATIOS = [0.5, 1, 2];

function generateFeatureMap(seed: number): number[][] {
  const rng = (i: number, j: number) => {
    const x = Math.sin(i * 12.9898 + j * 78.233 + seed) * 43758.5453;
    return x - Math.floor(x);
  };
  const map: number[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    map[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      const cx = 3, cy = 3;
      const dist = Math.sqrt((i - cx) ** 2 + (j - cy) ** 2);
      const val = Math.max(0, 1 - dist / 5);
      const noise = rng(i, j) * 0.15;
      map[i][j] = Math.round((val + noise) * 255);
    }
  }
  return map;
}

function seededRandom(seed: number, i: number, j: number, k: number): number {
  const x = Math.sin(i * 12.9898 + j * 78.233 + k * 41.937 + seed) * 43758.5453;
  return x - Math.floor(x);
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

interface RPNOutput {
  fg: number;
  bg: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

function getRPNOutput(featureVal: number, pos: number): RPNOutput {
  const h = Math.tanh((featureVal - 128) / 64) * 0.5 + 0.5;
  return {
    fg: 0.5 + h * 0.45 + seededRandom(0, pos, 0, 0) * 0.05,
    bg: 0.5 - h * 0.45 + seededRandom(0, pos, 0, 1) * 0.05,
    dx: (seededRandom(0, pos, 1, 0) - 0.5) * 0.4,
    dy: (seededRandom(0, pos, 1, 1) - 0.5) * 0.4,
    dw: seededRandom(0, pos, 2, 0) * 0.2,
    dh: seededRandom(0, pos, 2, 1) * 0.2,
  };
}

function toHeatmap(val: number) {
  const g = Math.round(Math.max(0, Math.min(255, val)));
  return `rgb(${g}, ${Math.round(g * 0.4)}, ${Math.round(255 - g)})`;
}

export default function FasterRCNNVisualizer() {
  const [seed, setSeed] = useState(0);
  const [showMask, setShowMask] = useState(false);
  const [showRPN, setShowRPN] = useState(true);
  const [anchorScale, setAnchorScale] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [numProposals, setNumProposals] = useState(3);

  const [animRow, setAnimRow] = useState<number | null>(null);
  const [animCol, setAnimCol] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [speed, setSpeed] = useState(500);

  const totalSteps = GRID_SIZE * GRID_SIZE;

  const featureMap = useMemo(() => generateFeatureMap(seed), [seed]);

  const stopPlaying = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPlaying(false);
    setAnimRow(null);
    setAnimCol(null);
  }, []);

  const startPlaying = useCallback(() => {
    setIsPlaying(true);
    setAnimRow(0);
    setAnimCol(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        setIsPlaying(false);
        return;
      }
      setAnimRow(Math.floor(step / GRID_SIZE));
      setAnimCol(step % GRID_SIZE);
    }, speed);
  }, [speed, totalSteps]);

  useEffect(() => { return () => stopPlaying(); }, [stopPlaying]);

  const anchors = useMemo(() => {
    const list: { scale: number; aspect: number; w: number; h: number }[] = [];
    for (const s of ANCHOR_SCALES) {
      for (const a of ASPECT_RATIOS) {
        const area = (s * CELL_SIZE) ** 2;
        const w = Math.sqrt(area * a);
        const h = Math.sqrt(area / a);
        list.push({ scale: s, aspect: a, w, h });
      }
    }
    return list;
  }, []);

  const currentAnchor = anchors.find(
    a => Math.abs(a.scale - ANCHOR_SCALES[anchorScale]) < 0.01 && Math.abs(a.aspect - ASPECT_RATIOS[aspectRatio]) < 0.01
  ) || anchors[0];

  const currentRPN = animRow !== null && animCol !== null
    ? getRPNOutput(featureMap[animRow][animCol], animRow * GRID_SIZE + animCol)
    : null;

  const currentOutputIdx = animRow !== null && animCol !== null
    ? animRow * GRID_SIZE + animCol + 1
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Faster R-CNN &amp; Mask R-CNN</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Two-stage detector: a Region Proposal Network (RPN) slides over the feature map to
          propose candidate boxes, then a second stage uses RoI pooling to classify and refine
          each proposal. Mask R-CNN adds a parallel mask head for instance segmentation.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Anchor Scale</label>
            <input type="range" min="0" max="2" step="1" value={anchorScale}
              onChange={e => setAnchorScale(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
              <span>Small</span><span>Medium</span><span>Large</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
            <input type="range" min="0" max="2" step="1" value={aspectRatio}
              onChange={e => setAspectRatio(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
              <span>1:2</span><span>1:1</span><span>2:1</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Speed: {speed}ms</label>
            <input type="range" min="100" max="1200" step="50" value={speed}
              onChange={e => setSpeed(parseInt(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proposals: {numProposals}</label>
            <input type="range" min="1" max="10" step="1" value={numProposals}
              onChange={e => setNumProposals(parseInt(e.target.value))} className="w-full" />
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Top-K regions after RPN</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              <button onClick={isPlaying ? stopPlaying : startPlaying}
                className={`flex-1 px-2 py-1.5 text-sm rounded transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                {isPlaying ? '■ Stop' : '▶ Slide RPN'}
              </button>
              <button onClick={stopPlaying}
                className="px-2 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Reset
              </button>
              <button onClick={() => { stopPlaying(); setSeed(s => s + 1); }}
                className="px-2 py-1.5 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="New feature map">
                ↻
              </button>
            </div>
            <div className="flex gap-3 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={showRPN}
                  onChange={e => setShowRPN(e.target.checked)} className="w-3.5 h-3.5" />
                Overlay
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={showMask}
                  onChange={e => setShowMask(e.target.checked)} className="w-3.5 h-3.5" />
                + Mask Head
              </label>
            </div>
          </div>
        </div>

        {/* Main visualization */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Feature Map + Sliding Window */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-1">Feature Map ({GRID_SIZE}×{GRID_SIZE})</h3>
            <div className="inline-block border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden relative"
              style={{ width: FEAT_SIZE, height: FEAT_SIZE }}>
              {featureMap.map((row, i) =>
                row.map((val, j) => (
                  <div key={`${i}-${j}`}
                    className="absolute border border-gray-700/20"
                    style={{
                      left: j * CELL_SIZE, top: i * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE,
                      backgroundColor: toHeatmap(val),
                    }}>
                    <div className="text-[7px] text-white/80 font-mono text-center leading-[20px] select-none">
                      {val}
                    </div>
                  </div>
                ))
              )}

              {/* Sliding window highlight */}
              {animRow !== null && animCol !== null && showRPN && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute border-2 border-purple-500 bg-purple-500/10"
                  style={{
                    left: animCol * CELL_SIZE, top: animRow * CELL_SIZE,
                    width: CELL_SIZE, height: CELL_SIZE,
                  }}
                >
                  {anchors.map((a, ai) => (
                    <div key={ai}
                      className="absolute border border-emerald-400/60 bg-emerald-400/10 rounded-[1px]"
                      style={{
                        left: CELL_SIZE / 2 - a.w / 2,
                        top: CELL_SIZE / 2 - a.h / 2,
                        width: a.w, height: a.h,
                      }}
                    />
                  ))}
                  <div className="absolute -bottom-4 left-0 text-[7px] text-purple-600 dark:text-purple-400 font-semibold whitespace-nowrap">
                    RPN @ ({animRow},{animCol})
                  </div>
                </motion.div>
              )}
            </div>
            <div className="mt-4 text-[10px] text-gray-500 dark:text-gray-400">
              Each cell encodes a 1024-d feature vector
            </div>
          </div>

          {/* Anchor boxes - 9-grid */}
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-semibold text-sm mb-2">Anchor Boxes (9 per cell)</h3>
            <div className="grid grid-cols-3 gap-2 mb-4" style={{ maxWidth: 220 }}>
              {anchors.map((a, i) => {
                const isSelected = a.scale === ANCHOR_SCALES[anchorScale] && a.aspect === ASPECT_RATIOS[aspectRatio];
                const maxDim = Math.max(...anchors.flatMap(x => [x.w, x.h]));
                const wRatio = a.w / maxDim;
                const hRatio = a.h / maxDim;
                return (
                  <button key={i}
                    onClick={() => { const si = ANCHOR_SCALES.indexOf(a.scale); const ai = ASPECT_RATIOS.indexOf(a.aspect); if (si >= 0) setAnchorScale(si); if (ai >= 0) setAspectRatio(ai); }}
                    className={`relative rounded border transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-2 ring-purple-400' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                    style={{ width: 60, height: 60 }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-emerald-500/80 bg-emerald-400/10 rounded-[2px]"
                        style={{ width: `${wRatio * 80}%`, height: `${hRatio * 80}%` }} />
                    </div>
                    <div className="absolute -bottom-3 left-0 right-0 text-[8px] text-gray-500 dark:text-gray-400 text-center">
                      {a.scale.toFixed(1)}×{a.aspect.toFixed(1)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded text-xs">
              <div className="font-semibold text-purple-700 dark:text-purple-400 mb-1">Selected Anchor</div>
              <div className="text-gray-700 dark:text-gray-300 space-y-0.5">
                <div>Scale: {ANCHOR_SCALES[anchorScale].toFixed(1)}× cell = {currentAnchor.w.toFixed(0)}×{currentAnchor.h.toFixed(0)} px</div>
                <div>Aspect: {ASPECT_RATIOS[aspectRatio].toFixed(1)}:1 ({ASPECT_RATIOS[aspectRatio] > 1 ? 'wide' : ASPECT_RATIOS[aspectRatio] < 1 ? 'tall' : 'square'})</div>
              </div>
            </div>
          </div>

          {/* RPN Output Panel - stable values per position */}
          {animRow !== null && animCol !== null && showRPN && currentRPN && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-purple-400 min-w-[180px]">
              <h3 className="font-semibold text-sm mb-2">RPN at ({animRow},{animCol})</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Objectness:</span>
                  <div className="flex gap-1 mt-0.5">
                    {softmax([currentRPN.fg, currentRPN.bg]).map((s, i) => (
                      <div key={i} className="flex-1 h-3 rounded overflow-hidden bg-gray-300 dark:bg-gray-700">
                        <div className="h-full rounded"
                          style={{ width: `${s * 100}%`, backgroundColor: i === 0 ? '#22c55e' : '#ef4444' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>FG: {currentRPN.fg.toFixed(2)}</span>
                    <span>BG: {currentRPN.bg.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Box Delta:</span>
                  <div className="font-mono text-gray-700 dark:text-gray-300">
                    dx={currentRPN.dx.toFixed(2)}, dy={currentRPN.dy.toFixed(2)}
                    <br />
                    dw={currentRPN.dw.toFixed(2)}, dh={currentRPN.dh.toFixed(2)}
                  </div>
                </div>
                <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Proposals:</span>
                  <span className="float-right font-semibold text-purple-700 dark:text-purple-400">
                    {Math.min(currentOutputIdx, numProposals)} selected
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* RoI Pooling Stage (visible when animation is active or has run) */}
          {currentOutputIdx > numProposals && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400 min-w-[180px]">
              <h3 className="font-semibold text-sm mb-2">Stage 2: RoI Pooling</h3>
              <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Top-K regions:</span>
                  <span className="float-right font-semibold">{numProposals}</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: numProposals }).map((_, i) => {
                    const score = 0.7 + seededRandom(0, i, 0, 0) * 0.25;
                    return (
                      <div key={i} className="flex-1 text-center p-1 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-700">
                        <div className="text-[9px] font-mono">#{i + 1}</div>
                        <div className="text-[8px] text-gray-500 dark:text-gray-400">{score.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-green-200 dark:border-green-800">
                  <span className="text-gray-600 dark:text-gray-400">Each RoI → 7×7 feature map</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Mask R-CNN info */}
        {showMask && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-pink-50 dark:bg-pink-950/30 rounded-lg border-l-4 border-pink-400">
            <h3 className="font-semibold text-sm mb-2">Mask Head</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Mask R-CNN adds a parallel FCN branch on each RoI that predicts a binary
              pixel-wise mask per class, enabling instance segmentation: detect + segment.
            </p>
          </motion.div>
        )}

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
            <h3 className="font-semibold text-sm mb-2">RPN</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Slide a small network over the feature map, predict objectness + box deltas
              for k=9 anchor boxes per location, output ~300 proposals.
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
            <h3 className="font-semibold text-sm mb-2">RoI Pooling + Classifier</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Crops feature regions per proposal, resizes to 7×7 via max pooling, then
              classifies each region and refines bounding box coordinates.
            </p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
            <h3 className="font-semibold text-sm mb-2">Two-Stage vs One-Stage</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Two-stage: propose then classify (R-CNN family). One-stage: direct regression
              (YOLO, SSD). Two-stage is more accurate; one-stage is faster.
            </p>
          </div>
        </div>

        {/* Learn More Section */}
        <LearnMoreSection
          title="Learn Faster R-CNN"
          gradientFrom="from-orange-50"
          gradientTo="to-red-50"
          darkGradientFrom="from-orange-950/30"
          darkGradientTo="from-red-950/30"
          hoverFrom="hover:from-orange-100"
          hoverTo="hover:to-red-100"
          darkHoverFrom="dark:hover:from-orange-950/50"
          darkHoverTo="dark:hover:to-red-950/50"
          analogyTitle="Treasure Hunt with a Scout"
          analogyIcon="🗺️"
          analogyContent={
            <>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Imagine searching a large map for treasure chests. Instead of checking every square inch,
                you send a <strong>scout</strong> (RPN) to find promising spots first:
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-orange-600 text-[10px] mb-2">The Scout (RPN)</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Quickly scans the map and says &quot;treasure might be here, here, or here&quot;.
                    Not perfect, but fast! Generates ~2000 candidate regions.
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-red-600 text-[10px] mb-2">The Expert (ROI Head)</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Carefully examines each spot the scout found. Uses more computation to
                    precisely locate and classify the treasure. Final detection!
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Key insight:</strong> Two-stage detection = <strong>propose then refine</strong>.
                The RPN finds &quot;where&quot; cheaply, the ROI head figures out &quot;what&quot; precisely.
                This is faster than checking every possible location!
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-blue-700 dark:text-blue-400">📦 Anchor Boxes</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Pre-defined boxes of different sizes and ratios at each location.
                    Like placing frames of various sizes on the image to &quot;catch&quot; objects.
                    RPN learns to adjust these frames to better fit objects.
                  </p>
                </div>
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border-l-4 border-violet-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-violet-700 dark:text-violet-400">🔄 NMS (Non-Maximum Suppression)</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Multiple boxes might detect the same object. NMS keeps the best one and
                    removes overlapping duplicates. Like keeping only the clearest photo
                    of the same subject.
                  </p>
                </div>
              </div>
            </>
          }
          stepsTitle="How Faster R-CNN Works"
          stepsContent={[
            { step: 1, title: 'Backbone Feature Extraction', desc: 'CNN (e.g., ResNet) extracts feature maps from the input image.', formula: 'image → CNN → feature map (H/16 × W/16 × 256)' },
            { step: 2, title: 'Region Proposal Network (RPN)', desc: 'Sliding window over feature maps. For each position, predict objectness + box refinement.', formula: 'RPN: (H/16 × W/16 × 256) → ~2000 proposals' },
            { step: 3, title: 'ROI Pooling/Align', desc: 'Extract fixed-size features from each proposal. ROI Align is more precise than ROI Pooling.', formula: 'proposal → ROI Align → 7×7×256 feature' },
            { step: 4, title: 'Classification + BBox Refinement', desc: 'Two heads: one classifies (car, person, etc.), one refines bounding box coordinates.', formula: 'features → cls_head + bbox_head' },
          ]}
          simpleTitle="Faster R-CNN with PyTorch"
          simpleCode={`import torch
import torch.nn as nn
import torchvision

# Use torchvision's pretrained Faster R-CNN
model = torchvision.models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
model.eval()

# Inference
image = torch.randn(3, 800, 800)  # RGB image
predictions = model([image])
print(predictions[0]['boxes'].shape)   # (N, 4) — detected boxes
print(predictions[0]['labels'].shape)  # (N,) — class labels
print(predictions[0]['scores'].shape)  # (N,) — confidence scores

# Custom Faster R-CNN
from torchvision.models.detection import FasterRCNN
from torchvision.models.detection.rpn import AnchorGenerator

# Define anchor sizes and ratios
anchor_sizes = ((32,), (64,), (128,), (256,), (512,))
aspect_ratios = ((0.5, 1.0, 2.0),) * len(anchor_sizes)
anchor_generator = AnchorGenerator(anchor_sizes, aspect_ratios)

# Build model with custom anchors
model = FasterRCNN(
    backbone=resnet50_fpn,
    num_classes=91,
    rpn_anchor_generator=anchor_generator
)`}
          scratchTitle="Faster R-CNN components from scratch"
          scratchCode={`import torch

class SimpleRPN(torch.nn.Module):
    """Simplified Region Proposal Network"""
    def __init__(self, in_channels=256, num_anchors=9):
        super().__init__()
        self.conv = torch.nn.Conv2d(in_channels, 256, 3, padding=1)
        self.cls_head = torch.nn.Conv2d(256, num_anchors, 1)  # objectness
        self.reg_head = torch.nn.Conv2d(256, num_anchors * 4, 1)  # bbox reg
    
    def forward(self, feature_map):
        x = torch.relu(self.conv(feature_map))
        cls_score = self.cls_head(x)  # (B, 9, H, W)
        bbox_pred = self.reg_head(x)  # (B, 36, H, W)
        return cls_score, bbox_pred

def non_max_suppression(boxes, scores, iou_threshold=0.5):
    """Simple NMS implementation"""
    keep = []
    indices = scores.argsort(descending=True)
    
    while indices.numel() > 0:
        i = indices[0]
        keep.append(i)
        
        if indices.numel() == 1:
            break
        
        ious = compute_iou(boxes[i], boxes[indices[1:]])
        mask = ious < iou_threshold
        indices = indices[1:][mask]
    
    return torch.stack(keep)

def compute_iou(box1, boxes):
    """Compute IoU between box1 and multiple boxes"""
    x1 = torch.max(box1[0], boxes[:, 0])
    y1 = torch.max(box1[1], boxes[:, 1])
    x2 = torch.min(box1[2], boxes[:, 2])
    y2 = torch.min(box1[3], boxes[:, 3])
    
    intersection = (x2 - x1).clamp(0) * (y2 - y1).clamp(0)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    union = area1 + area2 - intersection
    
    return intersection / (union + 1e-6)`}
        />
      </div>
    </div>
  );
}
