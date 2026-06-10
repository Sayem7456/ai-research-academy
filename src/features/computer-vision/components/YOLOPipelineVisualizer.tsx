'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
  classId: number;
  className: string;
}

const CLASS_NAMES = ['person', 'car', 'dog', 'bicycle', 'traffic light'];
const CLASS_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function generateBoxes(gridSize: number, confidence: number): BBox[] {
  const boxes: BBox[] = [];
  const cellW = 400 / gridSize;
  const cellH = 400 / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const centerX = j * cellW + cellW / 2;
      const centerY = i * cellH + cellH / 2;

      if (Math.random() > 0.7) {
        const cls = Math.floor(Math.random() * CLASS_NAMES.length);
        const conf = Math.random() * 0.5 + 0.3;
        if (conf > confidence) {
          boxes.push({
            x: centerX + (Math.random() - 0.5) * cellW * 0.5,
            y: centerY + (Math.random() - 0.5) * cellH * 0.5,
            w: cellW * (0.3 + Math.random() * 0.6),
            h: cellH * (0.3 + Math.random() * 0.6),
            conf,
            classId: cls,
            className: CLASS_NAMES[cls],
          });
        }
      }
    }
  }
  return boxes;
}

function computeIoU(a: BBox, b: BBox): number {
  const x1 = Math.max(a.x - a.w / 2, b.x - b.w / 2);
  const y1 = Math.max(a.y - a.h / 2, b.y - b.h / 2);
  const x2 = Math.min(a.x + a.w / 2, b.x + b.w / 2);
  const y2 = Math.min(a.y + a.h / 2, b.y + b.h / 2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  return inter / (areaA + areaB - inter);
}

function applyNMS(boxes: BBox[], iouThreshold: number): BBox[] {
  const sorted = [...boxes].sort((a, b) => b.conf - a.conf);
  const kept: BBox[] = [];
  for (const box of sorted) {
    let keep = true;
    for (const k of kept) {
      if (k.classId === box.classId && computeIoU(k, box) > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) kept.push(box);
  }
  return kept;
}

export default function YOLOPipelineVisualizer() {
  const [gridSize, setGridSize] = useState(7);
  const [confThreshold, setConfThreshold] = useState(0.3);
  const [iouThreshold, setIouThreshold] = useState(0.5);
  const [showNMS, setShowNMS] = useState(true);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seed, setSeed] = useState(0);

  const regenerate = useCallback(() => {
    setSeed(s => s + 1);
  }, []);

  const rawBoxes = useMemo(() => generateBoxes(gridSize, confThreshold), [gridSize, confThreshold, seed]);
  const nmsBoxes = useMemo(() => showNMS ? applyNMS(rawBoxes, iouThreshold) : rawBoxes, [rawBoxes, iouThreshold, showNMS]);

  const phases = [
    'Input image resized to 416×416',
    'Divide image into S×S grid cells',
    'Each cell predicts B bounding boxes + confidence',
    'Filter boxes by confidence threshold',
    'Non-maximum suppression removes duplicates',
    'Final detections with class labels',
  ];

  const displayBoxes = animPhase < 4 ? [] : animPhase === 4 ? rawBoxes : nmsBoxes;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
    setAnimPhase(0);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(0);
    intervalRef.current = setInterval(() => {
      setAnimPhase(prev => {
        if (prev >= phases.length - 1) {
          stopAnim();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stopAnim]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  const cellSize = 400 / gridSize;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">YOLO Pipeline Visualizer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          YOLO frames object detection as a single regression problem: it divides the image into a grid
          and predicts bounding boxes and class probabilities directly in one forward pass.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Grid: {gridSize}×{gridSize}</label>
              <input type="range" min="4" max="13" step="1" value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confidence: {confThreshold.toFixed(2)}</label>
              <input type="range" min="0.1" max="0.9" step="0.05" value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IoU Threshold: {iouThreshold.toFixed(2)}</label>
              <input type="range" min="0.1" max="0.9" step="0.05" value={iouThreshold}
                onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                className="w-full" />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input type="checkbox" checked={showNMS}
                  onChange={(e) => setShowNMS(e.target.checked)}
                  className="w-4 h-4" />
                Show NMS
              </label>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={isAnimating ? stopAnim : startAnim}
                className={`px-3 py-2 text-sm rounded transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                {isAnimating ? 'Stop' : 'Animate'}
              </button>
              <button onClick={() => { regenerate(); stopAnim(); }}
                className="px-3 py-2 text-sm rounded bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors">
                New Image
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-shrink-0">
            <h3 className="font-semibold text-sm mb-2 text-center">
              {animPhase === 0 && 'Input Image'}
              {animPhase === 1 && 'S×S Grid'}
              {animPhase === 2 && 'Bounding Box Predictions'}
              {(animPhase >= 3 && animPhase <= 4) && 'Raw Detections'}
              {animPhase >= 5 && 'Final Detections'}
            </h3>
            <div className="relative border-2 border-gray-300 rounded overflow-hidden bg-gray-100 dark:bg-gray-800"
              style={{ width: 400, height: 400 }}>
              <svg width={400} height={400} className="absolute inset-0">
                {Array.from({ length: gridSize }).map((_, i) => (
                  <line key={`h${i}`} x1={0} y1={i * cellSize} x2={400} y2={i * cellSize}
                    stroke="#94a3b8" strokeWidth={0.5}
                    opacity={animPhase >= 1 ? 1 : 0} />
                ))}
                {Array.from({ length: gridSize }).map((_, j) => (
                  <line key={`v${j}`} x1={j * cellSize} y1={0} x2={j * cellSize} y2={400}
                    stroke="#94a3b8" strokeWidth={0.5}
                    opacity={animPhase >= 1 ? 1 : 0} />
                ))}
              </svg>

              <AnimatePresence>
                {displayBoxes.map((box, idx) => {
                  const color = CLASS_COLORS[box.classId % CLASS_COLORS.length];
                  const isNmsRemoved = showNMS && animPhase >= 5 && !nmsBoxes.includes(box);
                  return (
                    <motion.div
                      key={`${idx}-${seed}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={isNmsRemoved ? {
                        opacity: 0,
                        scale: 0.3,
                        transition: { duration: 0.4 },
                      } : {
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute pointer-events-none"
                      style={{
                        left: box.x - box.w / 2,
                        top: box.y - box.h / 2,
                        width: box.w,
                        height: box.h,
                        border: `2px solid ${color}`,
                        backgroundColor: `${color}22`,
                        borderRadius: 2,
                      }}
                    >
                      {!isNmsRemoved && (
                        <div className="absolute -top-5 left-0 text-[9px] font-semibold px-1 rounded-sm whitespace-nowrap"
                          style={{ backgroundColor: color, color: 'white' }}>
                          {box.className} {box.conf.toFixed(2)}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {animPhase >= 5 && nmsBoxes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                  No detections above threshold
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {animPhase >= 3 ? `${displayBoxes.length} boxes` : 'Waiting...'}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <AnimatePresence mode="wait">
              {isAnimating && (
                <motion.div key={animPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                      {animPhase + 1}
                    </div>
                    <p className="text-sm text-indigo-900">{phases[animPhase]}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400"
            >
              <h3 className="font-semibold text-sm mb-2">Grid Cell Predictions</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Each grid cell predicts B bounding boxes (x, y, w, h, confidence) and C class
                probabilities. Output tensor: S × S × (B × 5 + C).
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400"
            >
              <h3 className="font-semibold text-sm mb-2">Non-Maximum Suppression</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                Removes duplicate detections. Steps:
              </p>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Sort boxes by confidence score</li>
                <li>Select highest confidence box</li>
                <li>Remove boxes with IoU &gt; threshold</li>
                <li>Repeat for remaining boxes</li>
              </ol>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400"
            >
              <h3 className="font-semibold text-sm mb-2">Multi-Scale Detection</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                YOLOv3+ uses 3 detection scales (13×13, 26×26, 52×52) to detect small, medium, and
                large objects simultaneously.
              </p>
            </motion.div>

            {rawBoxes.length > 0 && nmsBoxes.length < rawBoxes.length && showNMS && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 rounded text-xs text-red-800"
              >
                NMS removed {rawBoxes.length - nmsBoxes.length} overlapping box{(rawBoxes.length - nmsBoxes.length) !== 1 ? 'es' : ''}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
