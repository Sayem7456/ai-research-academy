'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LearnMoreSection from './LearnMoreSection';

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
  conf: number;
  classId: number;
  className: string;
}

interface NMSStep {
  currentBox: BBox;
  keptBoxes: BBox[];
  comparisons: { box: BBox; iou: number; suppressed: boolean }[];
  suppressedSoFar: BBox[];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CLASS_NAMES = ['person', 'car', 'dog', 'bicycle', 'traffic light'];
const CLASS_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function generateBoxes(): BBox[] {
  const objects: { x: number; y: number; w: number; h: number; classId: number; baseConf: number }[] = [
    { x: 187, y: 60, w: 25, h: 55, classId: 4, baseConf: 0.85 },
    { x: 275, y: 195, w: 75, h: 38, classId: 1, baseConf: 0.92 },
    { x: 80, y: 270, w: 38, h: 22, classId: 3, baseConf: 0.65 },
    { x: 330, y: 280, w: 12, h: 24, classId: 0, baseConf: 0.78 },
    { x: 137, y: 308, w: 35, h: 22, classId: 2, baseConf: 0.71 },
    { x: 195, y: 65, w: 30, h: 60, classId: 4, baseConf: 0.45 },
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

function runNMSSteps(boxes: BBox[], iouThreshold: number): NMSStep[] {
  const sorted = [...boxes].sort((a, b) => b.conf - a.conf);
  const steps: NMSStep[] = [];
  const kept: BBox[] = [];
  const suppressed: BBox[] = [];

  for (const box of sorted) {
    const comparisons: { box: BBox; iou: number; suppressed: boolean }[] = [];
    let isSuppressed = false;

    for (const k of kept) {
      if (k.classId === box.classId) {
        const iou = computeIoU(k, box);
        const suppressed = iou > iouThreshold;
        comparisons.push({ box: k, iou, suppressed });
        if (suppressed) isSuppressed = true;
      }
    }

    steps.push({
      currentBox: box,
      keptBoxes: [...kept],
      comparisons,
      suppressedSoFar: [...suppressed],
    });

    if (isSuppressed) {
      suppressed.push(box);
    } else {
      kept.push(box);
    }
  }

  return steps;
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

function resolveLabelCollisions(boxes: BBox[], containerWidth: number, containerHeight: number): { x: number; y: number }[] {
  const labelHeight = 18;
  const labelPadding = 2;
  const positions = boxes.map(box => ({
    x: box.x - box.w / 2,
    y: Math.max(0, box.y - box.h / 2 - labelHeight - labelPadding),
  }));

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const overlapX = a.x < b.x + 80 && a.x + 80 > b.x;
      const overlapY = Math.abs(a.y - b.y) < labelHeight;

      if (overlapX && overlapY) {
        const boxA = boxes[i];
        const boxB = boxes[j];
        const defaultY_A = Math.max(0, boxA.y - boxA.h / 2 - labelHeight - labelPadding);
        const defaultY_B = Math.max(0, boxB.y - boxB.h / 2 - labelHeight - labelPadding);

        if (defaultY_A <= defaultY_B) {
          positions[j].y = Math.min(containerHeight - labelHeight, a.y + labelHeight + labelPadding);
        } else {
          positions[i].y = Math.min(containerHeight - labelHeight, b.y + labelHeight + labelPadding);
        }
      }
    }
  }

  return positions;
}

export default function YOLOPipelineVisualizer() {
  const [gridSize, setGridSize] = useState(7);
  const [confThreshold, setConfThreshold] = useState(0.3);
  const [iouThreshold, setIouThreshold] = useState(0.5);
  const [showNMS, setShowNMS] = useState(true);
  const [animPhase, setAnimPhase] = useState(0);
  const [nmsStep, setNmsStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allBoxes = useMemo(() => generateBoxes(), []);
  const filteredBoxes = useMemo(() => allBoxes.filter(b => b.conf > confThreshold), [allBoxes, confThreshold]);
  const nmsBoxes = useMemo(() => showNMS ? applyNMS(filteredBoxes, iouThreshold) : filteredBoxes, [filteredBoxes, iouThreshold, showNMS]);
  const nmsSteps = useMemo(() => showNMS ? runNMSSteps(filteredBoxes, iouThreshold) : [], [filteredBoxes, iouThreshold, showNMS]);

  const phases = [
    'Input image resized to 416×416',
    'Divide image into S×S grid cells',
    'Each cell predicts B bounding boxes + confidence',
    'Filter boxes by confidence threshold',
    'Non-maximum suppression removes duplicates',
    'Final detections with class labels',
  ];

  const getCurrentPhaseBoxes = () => {
    if (animPhase < 2) return [];
    if (animPhase === 2) return allBoxes;
    if (animPhase === 3) return filteredBoxes;
    if (animPhase === 4 && showNMS) {
      const step = nmsSteps[Math.min(nmsStep, nmsSteps.length - 1)];
      if (!step) return filteredBoxes;
      return [...step.keptBoxes, step.currentBox, ...step.suppressedSoFar];
    }
    return nmsBoxes;
  };

  const displayBoxes = getCurrentPhaseBoxes();

  const labelPositions = useMemo(
    () => resolveLabelCollisions(displayBoxes, 400, 400),
    [displayBoxes]
  );

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setAnimPhase(0);
    setNmsStep(0);
    let phase = 0;
    let step = 0;
    intervalRef.current = setInterval(() => {
      if (phase === 4 && showNMS) {
        step++;
        if (step >= nmsSteps.length) {
          phase++;
          step = 0;
          setAnimPhase(phase);
          setNmsStep(0);
          if (phase > phases.length - 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsAnimating(false);
          }
          return;
        }
        setNmsStep(step);
        return;
      }
      phase++;
      setAnimPhase(phase);
      setNmsStep(0);
      if (phase > phases.length - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, phase === 4 && showNMS ? 800 : 1200);
  }, [showNMS, nmsSteps.length, phases.length]);

  useEffect(() => { return () => stopAnim(); }, [stopAnim]);

  const cellSize = 400 / gridSize;

  const getCurrentNMSStep = () => {
    if (animPhase !== 4 || !showNMS) return null;
    return nmsSteps[Math.min(nmsStep, nmsSteps.length - 1)] || null;
  };

  const currentStep = getCurrentNMSStep();

  const getBoxState = (box: BBox) => {
    if (animPhase === 4 && showNMS && currentStep) {
      if (currentStep.currentBox === box) return 'current';
      if (currentStep.comparisons.find(c => c.box === box && c.suppressed)) return 'suppressing';
      if (currentStep.suppressedSoFar.some(s => s === box)) return 'suppressed';
      if (currentStep.keptBoxes.some(k => k === box)) return 'kept';
      if (currentStep.comparisons.find(c => c.box === box && !c.suppressed)) return 'compared';
    }
    return 'normal';
  };

  const getBoxStyle = (state: string, color: string) => {
    switch (state) {
      case 'current':
        return { border: `3px solid ${color}`, backgroundColor: `${color}44`, boxShadow: `0 0 12px ${color}88`, zIndex: 20 };
      case 'suppressing':
        return { border: `2px dashed #ef4444`, backgroundColor: '#ef444422', opacity: 0.7 };
      case 'suppressed':
        return { border: `1px solid #666`, backgroundColor: '#66666622', opacity: 0.3 };
      case 'compared':
        return { border: `2px solid ${color}`, backgroundColor: `${color}22`, opacity: 0.9 };
      case 'kept':
        return { border: `2px solid ${color}`, backgroundColor: `${color}22` };
      default:
        return { border: `2px solid ${color}`, backgroundColor: `${color}22` };
    }
  };

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
                className="w-full cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confidence: {confThreshold.toFixed(2)}</label>
              <input type="range" min="0.1" max="0.9" step="0.05" value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IoU Threshold: {iouThreshold.toFixed(2)}</label>
              <input type="range" min="0.1" max="0.9" step="0.05" value={iouThreshold}
                onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                className="w-full cursor-pointer" />
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
                className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${isAnimating ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {isAnimating ? 'Stop' : 'Animate'}
              </button>
              {!isAnimating && (
                <button onClick={() => { setAnimPhase(0); setNmsStep(0); }}
                  className="px-3 py-2 text-sm rounded-lg cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <h3 className="font-semibold text-sm mb-2 text-center">
              {animPhase === 0 && 'Input Image'}
              {animPhase === 1 && 'S×S Grid'}
              {animPhase === 2 && 'Bounding Box Predictions'}
              {animPhase === 3 && 'After Confidence Filter'}
              {animPhase === 4 && showNMS && currentStep
                ? `NMS: Checking box ${nmsStep + 1}/${nmsSteps.length}`
                : animPhase === 4 && 'Non-Maximum Suppression'}
              {animPhase >= 5 && 'Final Detections'}
            </h3>
            <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
              style={{ width: 400, height: 400 }}>
              <svg width={400} height={400} className="absolute inset-0">
                <defs>
                  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#87ceeb"/><stop offset="1" stopColor="#b0d4f1"/></linearGradient>
                  <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#555"/><stop offset="1" stopColor="#444"/></linearGradient>
                </defs>
                <rect width={400} height={400} fill="url(#sky)" />
                <rect x={0} y={160} width={400} height={100} fill="url(#road)" />
                <line x1="0" y1="210" x2="400" y2="210" stroke="#ffd700" strokeWidth="2" strokeDasharray="20 15" />
                <rect x={0} y={140} width={400} height={20} fill="#aaa" />
                <rect x={0} y={260} width={400} height={20} fill="#aaa" />
                <rect x={0} y={280} width={400} height={120} fill="#7ec850" />
                <rect x={0} y={0} width={400} height={140} fill="#7ec850" opacity={0.3} />
                <rect x={180} y={50} width={14} height={40} fill="#333" rx={2} />
                <rect x={176} y={30} width={22} height={60} fill="#222" rx={4} />
                <circle cx={187} cy={43} r={6} fill="#ef4444" opacity={0.9} />
                <circle cx={187} cy={58} r={6} fill="#22c55e" />
                <circle cx={187} cy={73} r={6} fill="#777" />
                <rect x={240} y={178} width={70} height={30} fill="#3b82f6" rx={6} />
                <rect x={248} y={172} width={40} height={10} fill="#3b82f6" rx={4} />
                <circle cx={254} cy={210} r={7} fill="#222" />
                <circle cx={296} cy={210} r={7} fill="#222" />
                <rect x={252} y={178} width={10} height={12} fill="#87ceeb" rx={1} />
                <rect x={278} y={178} width={10} height={12} fill="#87ceeb" rx={1} />
                <circle cx={70} cy={268} r={8} fill="none" stroke="#f59e0b" strokeWidth="2" />
                <circle cx={70} cy={268} r={3} fill="#f59e0b" />
                <circle cx={90} cy={272} r={8} fill="none" stroke="#f59e0b" strokeWidth="2" />
                <circle cx={90} cy={272} r={3} fill="#f59e0b" />
                <line x1={70} y1={268} x2={90} y2={272} stroke="#f59e0b" strokeWidth="2" />
                <line x1={75} y1={260} x2={85} y2={264} stroke="#f59e0b" strokeWidth="2" />
                <circle cx={330} cy={268} r={6} fill="#fbbf24" />
                <rect x={327} y={274} width={6} height={6} fill="#3b82f6" rx={1} />
                <line x1={330} y1={280} x2={326} y2={292} stroke="#1e40af" strokeWidth="3" />
                <line x1={330} y1={280} x2={334} y2={292} stroke="#1e40af" strokeWidth="3" />
                <ellipse cx={140} cy={310} rx={14} ry={8} fill="#a0522d" />
                <circle cx={130} cy={304} r={6} fill="#a0522d" />
                <circle cx={128} cy={303} r={1.5} fill="#222" />
                <ellipse cx={124} cy={306} rx={3} ry={1.5} fill="#333" />
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
                  const state = getBoxState(box);
                  const style = getBoxStyle(state, color);
                  const labelPos = labelPositions[idx] || { x: box.x - box.w / 2, y: Math.max(0, box.y - box.h / 2 - 20) };

                  return (
                    <motion.div
                      key={`${box.classId}-${box.x.toFixed(1)}-${box.y.toFixed(1)}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: style.opacity ?? 1,
                        scale: state === 'suppressed' ? 0.8 : 1,
                        ...style,
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute pointer-events-none"
                      style={{
                        left: box.x - box.w / 2,
                        top: box.y - box.h / 2,
                        width: box.w,
                        height: box.h,
                        border: style.border,
                        backgroundColor: style.backgroundColor,
                        borderRadius: 2,
                        boxShadow: style.boxShadow,
                        zIndex: style.zIndex,
                        opacity: style.opacity,
                      }}
                    >
                      {state !== 'suppressed' && (
                        <div className="absolute text-[9px] font-semibold px-1 rounded-sm whitespace-nowrap z-30"
                          style={{
                            left: labelPos.x - (box.x - box.w / 2),
                            top: labelPos.y - (box.y - box.h / 2),
                            backgroundColor: state === 'current' ? color : state === 'suppressing' ? '#ef4444' : color,
                            color: 'white',
                          }}>
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
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
              {!isAnimating && animPhase === 0 ? 'Ready — click Animate' :
               animPhase === 1 ? 'Grid overlaid' :
               animPhase === 2 ? `${allBoxes.length} raw proposals` :
               animPhase === 3 ? `${filteredBoxes.length} after confidence filter` :
               animPhase === 4 && showNMS && currentStep
                 ? `Box ${nmsStep + 1}: ${currentStep.currentBox.className} (${currentStep.currentBox.conf.toFixed(2)})`
                 : animPhase === 4 ? `${filteredBoxes.length} before NMS` :
               `${nmsBoxes.length} final detection${nmsBoxes.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <AnimatePresence mode="wait">
              {isAnimating && (
                <motion.div key={`${animPhase}-${nmsStep}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
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

            {animPhase === 4 && showNMS && currentStep && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400"
              >
                <h3 className="font-semibold text-sm mb-2">NMS Step {nmsStep + 1} of {nmsSteps.length}</h3>
                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: CLASS_COLORS[currentStep.currentBox.classId] }} />
                    <span className="font-medium">Checking:</span>
                    <span className="font-mono">{currentStep.currentBox.className}</span>
                    <span className="text-gray-500">(conf: {currentStep.currentBox.conf.toFixed(2)})</span>
                  </div>

                  {currentStep.comparisons.length > 0 ? (
                    <div className="space-y-1">
                      <span className="font-medium">Comparisons with kept boxes:</span>
                      {currentStep.comparisons.map((comp, i) => (
                        <div key={i} className="flex items-center gap-2 pl-4">
                          <div className="w-2 h-2 rounded" style={{ backgroundColor: CLASS_COLORS[comp.box.classId] }} />
                          <span className="font-mono">{comp.box.className}</span>
                          <span className={`font-mono font-bold ${comp.suppressed ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            IoU: {comp.iou.toFixed(3)}
                          </span>
                          <span className={`text-[10px] px-1 rounded ${comp.suppressed ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                            {comp.suppressed ? `> ${iouThreshold} — SUPPRESSED` : `≤ ${iouThreshold} — KEPT`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 pl-4">
                      No same-class boxes to compare — box is kept
                    </div>
                  )}

                  {currentStep.suppressedSoFar.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                      <span className="font-medium">Previously suppressed:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentStep.suppressedSoFar.map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 line-through">
                            {s.className} ({s.conf.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

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
                <li>Sort boxes by confidence score (highest first)</li>
                <li>Select highest confidence box → add to &ldquo;kept&rdquo;</li>
                <li>Compare with all kept boxes of same class</li>
                <li>If IoU &gt; threshold → suppress (remove)</li>
                <li>Repeat until all boxes processed</li>
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
                className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400 text-xs text-red-800 dark:text-red-200"
              >
                NMS removed {filteredBoxes.length - nmsBoxes.length} overlapping box{(filteredBoxes.length - nmsBoxes.length) !== 1 ? 'es' : ''}
              </motion.div>
            )}
          </div>
        </div>

        {/* Learn More Section */}
        <LearnMoreSection
          title="Learn YOLO Pipeline"
          gradientFrom="from-blue-50"
          gradientTo="to-indigo-50"
          darkGradientFrom="from-blue-950/30"
          darkGradientTo="from-indigo-950/30"
          hoverFrom="hover:from-blue-100"
          hoverTo="hover:to-indigo-100"
          darkHoverFrom="dark:hover:from-blue-950/50"
          darkHoverTo="dark:hover:to-indigo-950/50"
          analogyTitle="Single Shot Detection"
          analogyIcon="📸"
          analogyContent={
            <>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Imagine taking a photo and instantly identifying every object in it without a second look.
                YOLO does exactly that — it sees the whole image at once and predicts bounding boxes
                and class probabilities in a single forward pass.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-blue-600 text-[10px] mb-2">Grid Cell Prediction</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    The image is divided into an S×S grid. Each grid cell predicts B bounding boxes
                    (x, y, w, h, confidence) and C class probabilities.
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-indigo-600 text-[10px] mb-2">Non-Maximum Suppression</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Overlapping boxes for the same object are suppressed, keeping only the best detection.
                    This removes duplicate predictions.
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Key insight:</strong> YOLO treats detection as a <strong>regression problem</strong>.
                It directly predicts bounding boxes and class probabilities from the full image,
                making it extremely fast (45+ FPS) while maintaining good accuracy.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border-l-4 border-cyan-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-cyan-700 dark:text-cyan-400">🎯 Anchor Boxes</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Pre-defined boxes of different sizes and aspect ratios. The network predicts
                    offsets relative to these anchors, helping detect objects of various shapes.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-emerald-700 dark:text-emerald-400">⚡ Multi-Scale Detection</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    YOLOv3+ uses three detection scales (13×13, 26×26, 52×52) to detect small, medium,
                    and large objects simultaneously.
                  </p>
                </div>
              </div>
            </>
          }
          stepsTitle="How YOLO Works"
          stepsContent={[
            { step: 1, title: 'Grid Division', desc: 'Divide input image into S×S grid cells.', formula: 'input (416×416×3) → S×S grid' },
            { step: 2, title: 'Anchor Box Prediction', desc: 'Each cell predicts B bounding boxes with confidence scores.', formula: 'per cell: (x, y, w, h, conf) × B' },
            { step: 3, title: 'Class Probability', desc: 'Each cell predicts C class probabilities.', formula: 'per cell: P(class) × C' },
            { step: 4, title: 'Confidence Filtering', desc: 'Remove boxes with confidence below threshold.', formula: 'keep if conf > threshold (e.g., 0.5)' },
            { step: 5, title: 'Non-Maximum Suppression', desc: 'Remove overlapping boxes, keeping the best per class.', formula: 'IoU > 0.5 → suppress duplicate' },
          ]}
          simpleTitle="YOLO with Ultralytics"
          simpleCode={`from ultralytics import YOLO

# Load pretrained YOLOv8 model
model = YOLO('yolov8n.pt')  # nano model

# Inference
results = model('image.jpg')

# Process results
for result in results:
    boxes = result.boxes  # bounding boxes
    print(boxes.xyxy)     # x1,y1,x2,y2
    print(boxes.conf)     # confidence scores
    print(boxes.cls)      # class labels

# Custom training
model = YOLO('yolov8n.yaml')  # build from YAML
model.train(data='coco128.yaml', epochs=100)`}
          scratchTitle="YOLO head from scratch"
          scratchCode={`import torch
import torch.nn as nn

class YOLOHead(nn.Module):
    """Simplified YOLO detection head"""
    def __init__(self, in_channels, num_anchors=3, num_classes=80):
        super().__init__()
        self.num_anchors = num_anchors
        self.num_classes = num_classes
        
        # Predict anchor offsets + objectness
        self.bbox_pred = nn.Conv2d(in_channels, num_anchors * 5, 1)
        # Predict class probabilities
        self.cls_pred = nn.Conv2d(in_channels, num_anchors * num_classes, 1)
    
    def forward(self, x):
        B, _, H, W = x.shape
        
        # Reshape predictions
        bbox = self.bbox_pred(x).view(B, self.num_anchors, 5, H, W)
        cls = self.cls_pred(x).view(B, self.num_anchors, self.num_classes, H, W)
        
        # bbox: (x, y, w, h, objectness)
        # cls: class probabilities
        return bbox, cls

# Example usage
model = YOLOHead(in_channels=256, num_anchors=3, num_classes=80)
x = torch.randn(1, 256, 13, 13)  # feature map
bbox, cls = model(x)
print(bbox.shape)  # (1, 3, 5, 13, 13)
print(cls.shape)   # (1, 3, 80, 13, 13)`}
        />
      </div>
    </div>
  );
}
