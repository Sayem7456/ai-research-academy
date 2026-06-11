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

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CLASS_NAMES = ['person', 'car', 'dog', 'bicycle', 'traffic light'];
const CLASS_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function generateBoxes(): BBox[] {
  const objects: { x: number; y: number; w: number; h: number; classId: number; baseConf: number }[] = [
    { x: 187, y: 60, w: 25, h: 55, classId: 4, baseConf: 0.85 },   // traffic light
    { x: 275, y: 195, w: 75, h: 38, classId: 1, baseConf: 0.92 },  // car
    { x: 80, y: 270, w: 38, h: 22, classId: 3, baseConf: 0.65 },   // bicycle
    { x: 330, y: 280, w: 12, h: 24, classId: 0, baseConf: 0.78 },  // person
    { x: 137, y: 308, w: 35, h: 22, classId: 2, baseConf: 0.71 },  // dog
    { x: 195, y: 65, w: 30, h: 60, classId: 4, baseConf: 0.45 },   // duplicate traffic light (suppressed by NMS)
  ];

  return objects.map((obj, idx) => {
    const jitter = seededRandom(idx * 7) * 0.15;
    const conf = Math.min(0.99, Math.max(0.01, obj.baseConf + (seededRandom(idx * 13 + 1) - 0.5) * 0.1));
    return {
      x: obj.x + (seededRandom(idx * 17 + 2) - 0.5) * obj.w * jitter,
      y: obj.y + (seededRandom(idx * 19 + 3) - 0.5) * obj.h * jitter,
      w: obj.w * (1 + (seededRandom(idx * 23 + 4) - 0.5) * jitter),
      h: obj.h * (1 + (seededRandom(idx * 29 + 5) - 0.5) * jitter),
      conf,
      classId: obj.classId,
      className: CLASS_NAMES[obj.classId],
    };
  });
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

  const allBoxes = useMemo(() => generateBoxes(), []);
  const filteredBoxes = useMemo(() => allBoxes.filter(b => b.conf > confThreshold), [allBoxes, confThreshold]);
  const nmsBoxes = useMemo(() => showNMS ? applyNMS(filteredBoxes, iouThreshold) : filteredBoxes, [filteredBoxes, iouThreshold, showNMS]);

  const phases = [
    'Input image resized to 416×416',
    'Divide image into S×S grid cells',
    'Each cell predicts B bounding boxes + confidence',
    'Filter boxes by confidence threshold',
    'Non-maximum suppression removes duplicates',
    'Final detections with class labels',
  ];

  const displayBoxes = animPhase < 2 ? [] : animPhase === 2 ? allBoxes : animPhase === 5 ? nmsBoxes : filteredBoxes;

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
      if (e > phases.length - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
        return;
      }
      setAnimPhase(e);
    }, 1000);
  }, []);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-shrink-0">
            <h3 className="font-semibold text-sm mb-2 text-center">
              {animPhase === 0 && 'Input Image'}
              {animPhase === 1 && 'S×S Grid'}
              {animPhase === 2 && 'Bounding Box Predictions'}
              {animPhase === 3 && 'After Confidence Filter'}
              {animPhase === 4 && 'Non-Maximum Suppression'}
              {animPhase >= 5 && 'Final Detections'}
            </h3>
            <div className="relative border-2 border-gray-300 rounded overflow-hidden bg-gray-100 dark:bg-gray-800"
              style={{ width: 400, height: 400 }}>
              <svg width={400} height={400} className="absolute inset-0">
                <defs>
                  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#87ceeb"/><stop offset="1" stopColor="#b0d4f1"/></linearGradient>
                  <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#555"/><stop offset="1" stopColor="#444"/></linearGradient>
                </defs>
                <rect width={400} height={400} fill="url(#sky)" />
                {/* Road */}
                <rect x={0} y={160} width={400} height={100} fill="url(#road)" />
                <line x1="0" y1="210" x2="400" y2="210" stroke="#ffd700" strokeWidth="2" strokeDasharray="20 15" />
                {/* Sidewalk */}
                <rect x={0} y={140} width={400} height={20} fill="#aaa" />
                <rect x={0} y={260} width={400} height={20} fill="#aaa" />
                {/* Grass */}
                <rect x={0} y={280} width={400} height={120} fill="#7ec850" />
                <rect x={0} y={0} width={400} height={140} fill="#7ec850" opacity={0.3} />
                {/* Traffic light */}
                <rect x={180} y={50} width={14} height={40} fill="#333" rx={2} />
                <rect x={176} y={30} width={22} height={60} fill="#222" rx={4} />
                <circle cx={187} cy={43} r={6} fill="#ef4444" opacity={0.9} />
                <circle cx={187} cy={58} r={6} fill="#22c55e" />
                <circle cx={187} cy={73} r={6} fill="#777" />
                {/* Car */}
                <rect x={240} y={178} width={70} height={30} fill="#3b82f6" rx={6} />
                <rect x={248} y={172} width={40} height={10} fill="#3b82f6" rx={4} />
                <circle cx={254} cy={210} r={7} fill="#222" />
                <circle cx={296} cy={210} r={7} fill="#222" />
                <rect x={252} y={178} width={10} height={12} fill="#87ceeb" rx={1} />
                <rect x={278} y={178} width={10} height={12} fill="#87ceeb" rx={1} />
                {/* Bicycle (sidewalk) */}
                <circle cx={70} cy={268} r={8} fill="none" stroke="#f59e0b" strokeWidth="2" />
                <circle cx={70} cy={268} r={3} fill="#f59e0b" />
                <circle cx={90} cy={272} r={8} fill="none" stroke="#f59e0b" strokeWidth="2" />
                <circle cx={90} cy={272} r={3} fill="#f59e0b" />
                <line x1={70} y1={268} x2={90} y2={272} stroke="#f59e0b" strokeWidth="2" />
                <line x1={75} y1={260} x2={85} y2={264} stroke="#f59e0b" strokeWidth="2" />
                {/* Person (sidewalk) */}
                <circle cx={330} cy={268} r={6} fill="#fbbf24" />
                <rect x={327} y={274} width={6} height={6} fill="#3b82f6" rx={1} />
                <line x1={330} y1={280} x2={326} y2={292} stroke="#1e40af" strokeWidth="3" />
                <line x1={330} y1={280} x2={334} y2={292} stroke="#1e40af" strokeWidth="3" />
                {/* Dog (grass) */}
                <ellipse cx={140} cy={310} rx={14} ry={8} fill="#a0522d" />
                <circle cx={130} cy={304} r={6} fill="#a0522d" />
                <circle cx={128} cy={303} r={1.5} fill="#222" />
                <ellipse cx={124} cy={306} rx={3} ry={1.5} fill="#333" />
                {/* Sidewalk poles */}
                <line x1={20} y1={140} x2={20} y2={120} stroke="#666" strokeWidth="2" />
                <line x1={100} y1={140} x2={100} y2={120} stroke="#666" strokeWidth="2" />
                <line x1={300} y1={140} x2={300} y2={120} stroke="#666" strokeWidth="2" />
              </svg>
              <svg width={400} height={400} className="absolute inset-0">
                {Array.from({ length: gridSize }).map((_, i) => (
                  <line key={`h${i}`} x1={0} y1={i * cellSize} x2={400} y2={i * cellSize}
                    stroke="#94a3b8" strokeWidth={1}
                    opacity={animPhase >= 1 ? 1 : 0} />
                ))}
                {Array.from({ length: gridSize }).map((_, j) => (
                  <line key={`v${j}`} x1={j * cellSize} y1={0} x2={j * cellSize} y2={400}
                    stroke="#94a3b8" strokeWidth={1}
                    opacity={animPhase >= 1 ? 1 : 0} />
                ))}
              </svg>

              <AnimatePresence>
                {displayBoxes.map((box, idx) => {
                  const color = CLASS_COLORS[box.classId % CLASS_COLORS.length];
                  const isNmsRemoved = showNMS && animPhase === 4 && !nmsBoxes.includes(box);
                  return (
                    <motion.div
                      key={idx}
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
              {!isAnimating && animPhase === 0 ? 'Ready — click Animate' :
               animPhase === 1 ? 'Grid overlaid' :
               animPhase === 2 ? `${allBoxes.length} raw proposals` :
               animPhase === 3 ? `${filteredBoxes.length} after confidence filter` :
               animPhase === 4 ? `${filteredBoxes.length} before NMS` :
               `${nmsBoxes.length} final detection${nmsBoxes.length !== 1 ? 's' : ''}`}
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
                    <p className="text-sm text-indigo-900 dark:text-indigo-200">{phases[animPhase]}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400"
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
              className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400"
            >
              <h3 className="font-semibold text-sm mb-2">Multi-Scale Detection</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                YOLOv3+ uses 3 detection scales (13×13, 26×26, 52×52) to detect small, medium, and
                large objects simultaneously.
              </p>
            </motion.div>

            {filteredBoxes.length > 0 && nmsBoxes.length < filteredBoxes.length && showNMS && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-800 dark:text-red-200"
              >
                NMS removed {filteredBoxes.length - nmsBoxes.length} overlapping box{(filteredBoxes.length - nmsBoxes.length) !== 1 ? 'es' : ''}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
