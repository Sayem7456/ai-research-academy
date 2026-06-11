'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

type Section = 'anchors' | 'rpn-training' | 'nms' | 'roi-align' | 'evolution' | 'fpn' | 'bbox-reg' | 'sampling' | 'map' | 'pipeline';

/* ───────── 1. Anchor Box Deep Dive ───────── */

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const GT_BOXES = [
  { x: 0.55, y: 0.50, w: 0.3, h: 0.4, label: 'person' },
  { x: 0.20, y: 0.65, w: 0.25, h: 0.2, label: 'car' },
];

function computeIoU(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): number {
  const x1 = Math.max(ax - aw / 2, bx - bw / 2);
  const y1 = Math.max(ay - ah / 2, by - bh / 2);
  const x2 = Math.min(ax + aw / 2, bx + bw / 2);
  const y2 = Math.min(ay + ah / 2, by + bh / 2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = aw * ah;
  const areaB = bw * bh;
  return inter / (areaA + areaB - inter);
}

function AnchorDeepDive() {
  const [anchorX, setAnchorX] = useState(0.5);
  const [anchorY, setAnchorY] = useState(0.5);
  const [anchorW, setAnchorW] = useState(0.15);
  const [anchorH, setAnchorH] = useState(0.2);
  const [showGT, setShowGT] = useState(true);

  const anchorIoUs = GT_BOXES.map(gt =>
    computeIoU(anchorX, anchorY, anchorW, anchorH, gt.x, gt.y, gt.w, gt.h)
  );
  const bestIoU = Math.max(...anchorIoUs);
  const isPositive = bestIoU > 0.5;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Anchor Boxes &amp; IoU Matching</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        During RPN training, each anchor is labeled positive or negative based on IoU with
        ground-truth boxes. IoU &gt; 0.7 = positive, &lt; 0.3 = negative.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-100 dark:bg-gray-900"
            style={{ width: 300, height: 240 }}>
            {/* Grid */}
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                <div className="absolute border-l border-gray-300/30" style={{ left: `${(i / 6) * 100}%`, top: 0, height: '100%' }} />
                <div className="absolute border-t border-gray-300/30" style={{ top: `${(i / 6) * 100}%`, left: 0, width: '100%' }} />
              </React.Fragment>
            ))}

            {/* Ground truth boxes */}
            {showGT && GT_BOXES.map((gt, i) => (
              <div key={i}
                className="absolute border-2 border-blue-500 bg-blue-500/10 rounded flex items-center justify-center"
                style={{
                  left: `${(gt.x - gt.w / 2) * 100}%`, top: `${(gt.y - gt.h / 2) * 100}%`,
                  width: `${gt.w * 100}%`, height: `${gt.h * 100}%`,
                }}>
                <span className="text-[9px] text-blue-600 font-semibold">{gt.label}</span>
              </div>
            ))}

            {/* Anchor box */}
            <div className={`absolute border-2 rounded flex items-center justify-center transition-all duration-200 ${
              isPositive ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-400 bg-red-400/10'
            }`}
              style={{
                left: `${(anchorX - anchorW / 2) * 100}%`, top: `${(anchorY - anchorH / 2) * 100}%`,
                width: `${anchorW * 100}%`, height: `${anchorH * 100}%`,
              }}>
              <span className={`text-[8px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPositive ? 'POS' : 'NEG'}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
            Drag anchor or adjust controls
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Anchor X: {anchorX.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.01" value={anchorX}
              onChange={e => setAnchorX(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Anchor Y: {anchorY.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.01" value={anchorY}
              onChange={e => setAnchorY(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Anchor Width: {anchorW.toFixed(2)}</label>
            <input type="range" min="0.05" max="0.5" step="0.01" value={anchorW}
              onChange={e => setAnchorW(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Anchor Height: {anchorH.toFixed(2)}</label>
            <input type="range" min="0.05" max="0.5" step="0.01" value={anchorH}
              onChange={e => setAnchorH(parseFloat(e.target.value))} className="w-full" />
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={showGT} onChange={e => setShowGT(e.target.checked)} className="w-3.5 h-3.5" />
            Show Ground Truth Boxes
          </label>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {GT_BOXES.map((gt, i) => (
              <div key={i} className={`p-2 rounded text-xs border ${
                anchorIoUs[i] > 0.5 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
              }`}>
                <span className="font-semibold">{gt.label}:</span>
                <span className={`float-right font-mono ${anchorIoUs[i] > 0.5 ? 'text-emerald-600' : 'text-gray-500'}`}>
                  IoU = {anchorIoUs[i].toFixed(3)}
                </span>
              </div>
            ))}
          </div>

          <div className={`p-3 rounded text-xs border-l-4 ${isPositive ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400' : 'bg-red-50 dark:bg-red-950/30 border-red-400'}`}>
            <span className="font-semibold">Label: </span>
            {isPositive
              ? <span className="text-emerald-700 dark:text-emerald-300">Positive anchor (IoU = {bestIoU.toFixed(3)})</span>
              : <span className="text-red-700 dark:text-red-300">Negative anchor (best IoU = {bestIoU.toFixed(3)})</span>}
            <div className="text-gray-500 dark:text-gray-400 mt-0.5">
              {isPositive ? 'Used for training both classification and box regression.' : 'Used only for training classification (background class).'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 2. RPN Training Dynamics ───────── */

function RPNTrainingDynamics() {
  const [epoch, setEpoch] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'fast'>('fast');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalEpochs = 30;
  const clsLoss = useMemo(() => Array.from({ length: totalEpochs }, (_, e) => {
    const noise = (seededRandom(e + 100) - 0.5) * 0.15;
    return Math.max(0.01, 1.2 * Math.exp(-e * 0.12) + 0.1 + noise * (1 - e / totalEpochs));
  }), []);
  const regLoss = useMemo(() => Array.from({ length: totalEpochs }, (_, e) => {
    const noise = (seededRandom(e + 200) - 0.5) * 0.1;
    return Math.max(0.001, 0.5 * Math.exp(-e * 0.1) + 0.02 + noise * (1 - e / totalEpochs));
  }), []);

  const intervalMs = speed === 'slow' ? 400 : 100;

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    let e = 0;
    setEpoch(0);
    intervalRef.current = setInterval(() => {
      e++;
      setEpoch(e);
      if (e >= totalEpochs - 1) { setIsAnimating(false); clearInterval(intervalRef.current!); }
    }, intervalMs);
  }, [intervalMs]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const maxVal = 1.5;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">RPN Training Dynamics</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The RPN is trained with a multi-task loss: classification (object vs background) and
        regression (box coordinate refinement). Only positive anchors contribute to regression loss.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={isAnimating ? () => { if (intervalRef.current) clearInterval(intervalRef.current); setIsAnimating(false); } : startAnim}
          className={`px-4 py-2 text-sm rounded ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90 transition-colors`}>
          {isAnimating ? '■ Stop' : '▶ Train RPN'}
        </button>
        <button onClick={() => { setEpoch(0); setIsAnimating(false); }}
          className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Reset
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500 dark:text-gray-400">Speed</span>
          <button onClick={() => setSpeed(s => s === 'slow' ? 'fast' : 'slow')}
            className={`relative w-9 h-4 rounded-full transition-colors ${speed === 'fast' ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${speed === 'fast' ? 'translate-x-1' : 'translate-x-5'}`} />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">{speed === 'fast' ? 'Fast' : 'Slow'}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          Epoch {epoch}/{totalEpochs}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(epoch / totalEpochs) * 100}%` }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loss curve — stacked bars */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-sm mb-2">Training Loss over Epochs</h4>
          <div className="relative h-32 border-b border-l border-gray-300 dark:border-gray-600 ml-6">
            <div className="absolute -left-6 bottom-0 text-[9px] text-gray-400">0</div>
            <div className="absolute -left-6 top-0 text-[9px] text-gray-400">{maxVal}</div>
            {Array.from({ length: totalEpochs }).map((_, i) => {
              const revealed = i <= epoch;
              const clsH = revealed ? (clsLoss[i] / maxVal) * 100 : 0;
              const regH = revealed ? (regLoss[i] / maxVal) * 100 : 0;
              return (
                <div key={i} className="absolute bottom-0 flex flex-col justify-end"
                  style={{ left: `${(i / totalEpochs) * 100}%`, width: `${100 / totalEpochs}%` }}>
                  <div style={{ height: regH }} className="w-[70%] bg-green-500 rounded-t mx-auto transition-all duration-300" />
                  <div style={{ height: clsH }} className="w-[70%] bg-purple-500 rounded-t mx-auto transition-all duration-300" />
                </div>
              );
            })}
            {/* Epoch marker */}
            {epoch > 0 && (
              <div className="absolute bottom-0 w-px bg-red-400" style={{ left: `${(epoch / totalEpochs) * 100}%`, height: '100%' }} />
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" /> Classification</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> Regression</span>
          </div>
        </div>

        {/* Stats + Sampling info */}
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Epoch {epoch} Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cls Loss:</span>
                <span className="float-right font-mono font-semibold text-purple-700 dark:text-purple-300">{clsLoss[epoch].toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Reg Loss:</span>
                <span className="float-right font-mono font-semibold text-green-700 dark:text-green-300">{regLoss[epoch].toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total Loss:</span>
                <span className="float-right font-mono font-semibold text-blue-700 dark:text-blue-300">
                  {(clsLoss[epoch] + regLoss[epoch]).toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Pos Anchors:</span>
                <span className="float-right font-mono font-semibold text-amber-700 dark:text-amber-300">
                  {Math.round(128 + (seededRandom(epoch + 300) - 0.5) * 20)} / 256
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Anchor Sampling</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-purple-500 shrink-0" />
                <span>256 anchors sampled per image</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                <span>Up to 128 positive (IoU &gt; 0.7)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-gray-400 shrink-0" />
                <span>Remainder negative (IoU &lt; 0.3)</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400 mt-1 text-[10px]">
                Only positive anchors contribute to regression loss (L<sub>reg</sub>).<br />
                Classification loss uses all 256 sampled anchors.
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
            <h4 className="font-semibold mb-1">RPN Loss</h4>
            <div className="font-mono text-gray-700 dark:text-gray-300">
              L = L<sub>cls</sub>(p, p*) + λ · p* · L<sub>reg</sub>(t, t*)
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1">
              p* = 1 for positive anchors, 0 otherwise
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 3. NMS Demo ───────── */

function NMSDemo() {
  const [iouThreshold, setIouThreshold] = useState(0.5);
  const [showNMS, setShowNMS] = useState(true);
  const [seed, setSeed] = useState(0);

  const boxes = useMemo((): { x: number; y: number; w: number; h: number; score: number; id: number }[] => {
    const result: { x: number; y: number; w: number; h: number; score: number; id: number }[] = [];
    const clusters = [
      { cx: 0.35, cy: 0.42, count: 4 },
      { cx: 0.68, cy: 0.55, count: 4 },
    ];
    let id = 0;
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.count; i++) {
        const angle = seededRandom(id + seed) * Math.PI * 2;
        const dist = 0.04 + seededRandom(id + seed + 10) * 0.08;
        result.push({
          x: cluster.cx + Math.cos(angle) * dist,
          y: cluster.cy + Math.sin(angle) * dist,
          w: 0.16 + seededRandom(id + seed + 20) * 0.10,
          h: 0.16 + seededRandom(id + seed + 30) * 0.10,
          score: 0.5 + seededRandom(id + seed + 40) * 0.45,
          id,
        });
        id++;
      }
    }
    return result;
  }, [seed]);

  const sorted = useMemo(() => [...boxes].sort((a, b) => b.score - a.score), [boxes]);

  const { kept, nmsDecisions } = useMemo(() => {
    const keptBoxes: typeof sorted = [];
    const decisions: { id: number; suppressedBy: number | null; iouWithTopKept: number }[] = [];
    for (const box of sorted) {
      if (!showNMS) {
        keptBoxes.push(box);
        decisions.push({ id: box.id, suppressedBy: null, iouWithTopKept: 0 });
        continue;
      }
      let suppressed = false;
      let iouMax = 0;
      let suppressedBy: number | null = null;
      for (const keptBox of keptBoxes) {
        const iou = computeIoU(box.x, box.y, box.w, box.h, keptBox.x, keptBox.y, keptBox.w, keptBox.h);
        if (iou > iouMax) { iouMax = iou; }
        if (iou > iouThreshold) {
          suppressed = true;
          suppressedBy = keptBox.id;
          break;
        }
      }
      if (!suppressed) keptBoxes.push(box);
      decisions.push({ id: box.id, suppressedBy, iouWithTopKept: iouMax });
    }
    return { kept: keptBoxes, nmsDecisions: decisions };
  }, [sorted, iouThreshold, showNMS]);

  const decMap = useMemo(() => new Map(nmsDecisions.map(d => [d.id, d])), [nmsDecisions]);
  const removed = boxes.filter(b => !kept.includes(b));

  const scoreToColor = (score: number) => {
    const r = Math.round(220 - score * 120);
    const g = Math.round(180 + score * 60);
    const b = Math.round(100 - score * 80);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Non-Maximum Suppression (NMS)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        After RPN generates ~10,000 anchor proposals, NMS removes duplicates by suppressing
        boxes with high IoU overlap. This reduces proposals to ~300 candidate regions for
        the second-stage classifier.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div>
          <label className="text-xs font-medium">IoU Threshold: {iouThreshold.toFixed(1)}</label>
          <input type="range" min="0.1" max="0.9" step="0.1" value={iouThreshold}
            onChange={e => setIouThreshold(parseFloat(e.target.value))} className="w-24 ml-2" />
        </div>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={showNMS} onChange={e => setShowNMS(e.target.checked)} className="w-3.5 h-3.5" />
          Apply NMS
        </label>
        <button onClick={() => setSeed(s => s + 1)}
          className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          New Boxes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-100 dark:bg-gray-900"
          style={{ width: 300, height: 240 }}>
          {/* Ground-truth markers */}
          {GT_BOXES.map((gt, i) => (
            <div key={`gt-${i}`} className="absolute border-2 border-dashed border-blue-300 rounded pointer-events-none"
              style={{
                left: `${(gt.x - gt.w / 2) * 100}%`, top: `${(gt.y - gt.h / 2) * 100}%`,
                width: `${gt.w * 100}%`, height: `${gt.h * 100}%`,
              }}>
              <span className="absolute -top-3 left-0 text-[7px] text-blue-400 font-semibold whitespace-nowrap">{gt.label}</span>
            </div>
          ))}
          {boxes.map((box) => {
            const isRemoved = removed.includes(box);
            return (
              <motion.div key={box.id}
                animate={isRemoved ? { opacity: 0.15, scale: 0.85 } : { opacity: 1, scale: 1 }}
                className={`absolute border-2 rounded flex items-center justify-center transition-colors ${
                  isRemoved ? 'border-red-300' : 'border-emerald-500'
                }`}
                style={{
                  left: `${(box.x - box.w / 2) * 100}%`, top: `${(box.y - box.h / 2) * 100}%`,
                  width: `${box.w * 100}%`, height: `${box.h * 100}%`,
                  backgroundColor: isRemoved ? 'transparent' : scoreToColor(box.score),
                }}>
                <span className={`text-[7px] font-bold ${isRemoved ? 'text-red-400' : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'}`}>
                  {box.score.toFixed(2)}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="flex-1 space-y-2 text-xs min-w-0">
          <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div className="font-semibold mb-1">Before NMS: {boxes.length} boxes</div>
            <div className="text-gray-500 dark:text-gray-400">After NMS: {kept.length} boxes</div>
            {showNMS && <div className="text-red-500">Removed: {removed.length} overlapping boxes</div>}
          </div>

          {/* Ranked list */}
          <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
            <h4 className="font-semibold text-[11px] mb-1.5 px-1">Ranked by Score</h4>
            {sorted.map((box, rank) => {
              const dec = decMap.get(box.id)!;
              const isSuppressed = dec.suppressedBy !== null;
              return (
                <div key={box.id} className={`flex items-center gap-2 px-1.5 py-1 rounded text-[10px] ${
                  isSuppressed ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                }`}>
                  <span className="w-4 text-center font-bold text-gray-400">#{rank + 1}</span>
                  <span className="flex-1 font-mono font-semibold">{box.score.toFixed(3)}</span>
                  <span className="w-12 text-center text-gray-500 dark:text-gray-400">
                    IoU {dec.iouWithTopKept.toFixed(2)}
                  </span>
                  <span className="w-6 text-center">
                    {!showNMS ? '-' : isSuppressed ? '✗' : '✓'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
            <h4 className="font-semibold text-sm mb-1">NMS Algorithm</h4>
            <ol className="space-y-0.5 text-xs text-gray-700 dark:text-gray-300 list-decimal list-inside">
              <li>Sort all proposals by confidence score (descending)</li>
              <li>Select the highest-scoring box as a detection</li>
              <li>Suppress all boxes with IoU &gt; threshold against it</li>
              <li>Repeat from step 2 until no boxes remain</li>
            </ol>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
            <h4 className="font-semibold text-sm mb-1">RPN vs Final NMS</h4>
            <p className="text-gray-700 dark:text-gray-300">
              RPN uses NMS with IoU=0.7 to reduce ~10K anchors to ~300 proposals. The
              second-stage classifier applies NMS again with IoU=0.5 for final detections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 4. RoI Align vs RoI Pooling ───────── */

function bilinearInterp(fm: number[][], x: number, y: number): number {
  const x1 = Math.floor(x), y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, fm[0].length - 1), y2 = Math.min(y1 + 1, fm.length - 1);
  const dx = x - x1, dy = y - y1;
  const v11 = fm[y1][x1], v21 = fm[y1][x2], v12 = fm[y2][x1], v22 = fm[y2][x2];
  return v11 * (1 - dx) * (1 - dy) + v21 * dx * (1 - dy) + v12 * (1 - dx) * dy + v22 * dx * dy;
}

function RoIAlignExplorer() {
  const [method, setMethod] = useState<'pool' | 'align'>('pool');
  const [quantize, setQuantize] = useState(true);

  const gridSize = 7;
  const featSize = 8;

  // Simulated 8×8 feature map with Gaussian hot spot
  const featMap = useMemo(() =>
    Array.from({ length: featSize }, (_, y) =>
      Array.from({ length: featSize }, (_, x) => {
        const dist = Math.sqrt((x - 4.7) ** 2 + (y - 4.2) ** 2);
        return Math.round(Math.max(0, 255 * Math.exp(-(dist * dist) / 3)));
      })
    ), []);

  // RoI: x=1.8, y=1.3, w=4.4, h=4.6 (floating-point coordinates)
  const roi = useMemo(() => ({ x: 1.8, y: 1.3, w: 4.4, h: 4.6 }), []);
  const cellW = roi.w / gridSize;
  const cellH = roi.h / gridSize;

  // Compute RoI Pooling output (max per quantized grid cell)
  const poolOutput = useMemo(() =>
    Array.from({ length: gridSize }, (_, gy) =>
      Array.from({ length: gridSize }, (_, gx) => {
        const xStart = Math.floor(roi.x + gx * cellW);
        const yStart = Math.floor(roi.y + gy * cellH);
        const xEnd = Math.max(xStart + 1, Math.floor(roi.x + (gx + 1) * cellW));
        const yEnd = Math.max(yStart + 1, Math.floor(roi.y + (gy + 1) * cellH));
        let maxVal = 0;
        for (let y = yStart; y < yEnd; y++)
          for (let x = xStart; x < xEnd; x++)
            if (featMap[y]?.[x] !== undefined && featMap[y][x] > maxVal) maxVal = featMap[y][x];
        return maxVal;
      })
    ), [gridSize, roi, cellW, cellH, featMap]);

  // Compute RoI Align output (bilinear interpolation at cell centers)
  const alignOutput = useMemo(() =>
    Array.from({ length: gridSize }, (_, gy) =>
      Array.from({ length: gridSize }, (_, gx) => {
        const cx = roi.x + (gx + 0.5) * cellW;
        const cy = roi.y + (gy + 0.5) * cellH;
        const val = bilinearInterp(featMap, cx, cy);
        return Math.round(Math.max(0, Math.min(255, val)));
      })
    ), [gridSize, roi, cellW, cellH, featMap]);

  const toHeat = (val: number) => {
    const r = Math.round(30 + val * 0.7);
    const g = Math.round(20 + val * 0.3);
    const b = Math.round(220 - val * 0.6);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">RoI Pooling vs RoI Align</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        RoI pooling quantizes floating-point coordinates, causing misalignment. RoI Align
        (Mask R-CNN) uses bilinear interpolation to preserve sub-pixel precision — critical
        for pixel-level tasks like segmentation.
      </p>

      <div className="flex gap-2 mb-4">
        {(['pool', 'align'] as const).map(m => (
          <button key={m} onClick={() => setMethod(m)}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              method === m ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}>
            RoI {m === 'pool' ? 'Pooling' : 'Align'}
          </button>
        ))}
        <label className="flex items-center gap-1 text-xs ml-2 cursor-pointer">
          <input type="checkbox" checked={quantize} onChange={e => setQuantize(e.target.checked)}
            className="w-3.5 h-3.5" />
          {method === 'pool' ? 'Show quantization grid' : 'Show sampling points'}
        </label>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Feature map + RoI */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Feature Map (8×8)</div>
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white"
            style={{ width: 240, height: 240 }}>
            {featMap.flatMap((row, y) =>
              row.map((val, x) => (
                <div key={`${y}-${x}`}
                  className="absolute border border-gray-200 dark:border-gray-700"
                  style={{
                    left: `${(x / featSize) * 100}%`, top: `${(y / featSize) * 100}%`,
                    width: `${(1 / featSize) * 100}%`, height: `${(1 / featSize) * 100}%`,
                    backgroundColor: toHeat(val),
                  }}>
                  <div className="text-[6px] text-white/70 font-mono text-center leading-[30px]">{val}</div>
                </div>
              ))
            )}

            {/* RoI box */}
            <div className="absolute border-2 border-blue-500 bg-blue-500/5"
              style={{
                left: `${(roi.x / featSize) * 100}%`, top: `${(roi.y / featSize) * 100}%`,
                width: `${(roi.w / featSize) * 100}%`, height: `${(roi.h / featSize) * 100}%`,
              }}>
              <div className="absolute -top-4 left-0 text-[8px] text-blue-600 font-semibold whitespace-nowrap">
                RoI ({roi.x.toFixed(1)},{roi.y.toFixed(1)},{roi.w.toFixed(1)},{roi.h.toFixed(1)})
              </div>

              {/* Pooling: quantized grid cells */}
              {method === 'pool' && quantize && Array.from({ length: gridSize }).map((_, gy) =>
                Array.from({ length: gridSize }).map((_, gx) => {
                  const xStart = Math.floor(roi.x + gx * cellW);
                  const yStart = Math.floor(roi.y + gy * cellH);
                  const xEnd = Math.max(xStart + 1, Math.floor(roi.x + (gx + 1) * cellW));
                  const yEnd = Math.max(yStart + 1, Math.floor(roi.y + (gy + 1) * cellH));
                  return (
                    <div key={`q-${gy}-${gx}`}
                      className="absolute border border-red-400/60 bg-red-400/5"
                      style={{
                        left: `${(xStart / featSize) * 100}%`, top: `${(yStart / featSize) * 100}%`,
                        width: `${((xEnd - xStart) / featSize) * 100}%`, height: `${((yEnd - yStart) / featSize) * 100}%`,
                      }}>
                      <div className="text-[6px] text-red-500 font-mono text-center leading-[12px]">{poolOutput[gy][gx]}</div>
                    </div>
                  );
                })
              )}

              {/* Align: sampling points at cell centers */}
              {method === 'align' && quantize && Array.from({ length: gridSize }).map((_, gy) =>
                Array.from({ length: gridSize }).map((_, gx) => {
                  const cx = roi.x + (gx + 0.5) * cellW;
                  const cy = roi.y + (gy + 0.5) * cellH;
                  return (
                    <div key={`a-${gy}-${gx}`}
                      className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400 border border-yellow-600 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${(cx / featSize) * 100}%`, top: `${(cy / featSize) * 100}%`,
                      }}>
                      <div className="absolute top-2 left-2 text-[5px] text-yellow-600 whitespace-nowrap">
                        {cx.toFixed(1)},{cy.toFixed(1)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Output grid */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Output ({gridSize}×{gridSize}) — {method === 'pool' ? 'Max per quantized cell' : 'Bilinear interpolation'}
          </div>
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white"
            style={{ width: 210, height: 210 }}>
            {(method === 'pool' ? poolOutput : alignOutput).flatMap((row, gy) =>
              row.map((val, gx) => {
                const maxOut = Math.max(...(method === 'pool' ? poolOutput : alignOutput).flat());
                const normVal = maxOut > 0 ? val / maxOut : 0;
                return (
                  <div key={`out-${gy}-${gx}`}
                    className="absolute border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                    style={{
                      left: `${(gx / gridSize) * 100}%`, top: `${(gy / gridSize) * 100}%`,
                      width: `${(1 / gridSize) * 100}%`, height: `${(1 / gridSize) * 100}%`,
                      backgroundColor: `rgb(${Math.round(30 + normVal * 200)}, ${Math.round(180 + normVal * 50)}, ${Math.round(220 - normVal * 180)})`,
                    }}>
                    <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{val}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Grid Cell Size</div>
              <div className="font-mono text-gray-600 dark:text-gray-400 mt-0.5">
                {method === 'pool' ? 'Quantized to integer' : `${cellW.toFixed(2)} × ${cellH.toFixed(2)}`}
              </div>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Output Size</div>
              <div className="font-mono text-gray-600 dark:text-gray-400 mt-0.5">7 × 7 × C</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col lg:flex-row gap-3 text-xs">
        <div className={`p-3 rounded border-l-4 flex-1 ${method === 'pool' ? 'bg-red-50 dark:bg-red-950/30 border-red-400' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400'}`}>
          <h4 className="font-semibold mb-1">{method === 'pool' ? '✗ RoI Pooling: Quantization Error' : '✓ RoI Align: Sub-pixel Precision'}</h4>
          <p className="text-gray-700 dark:text-gray-300">
            {method === 'pool'
              ? 'Coordinates are quantized to integer grid cells. Cells have unequal sizes (some cover 1 pixel, others 2), causing spatial misalignment between the RoI and the feature map.'
              : 'Bilinear interpolation samples 4 regular points per grid cell at sub-pixel coordinates. Each output cell is a weighted average of its 4 nearest feature map pixels, preserving alignment.'}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 min-w-[140px]">
          <div className="font-semibold text-gray-700 dark:text-gray-300">Introduced In</div>
          <div className="text-gray-600 dark:text-gray-400 mt-0.5">
            {method === 'pool' ? 'Fast / Faster R-CNN' : 'Mask R-CNN (He et al., 2017)'}
          </div>
          <div className="font-semibold text-gray-700 dark:text-gray-300 mt-2">Best For</div>
          <div className="text-gray-600 dark:text-gray-400 mt-0.5">
            {method === 'pool' ? 'Object Detection' : 'Instance Segmentation'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 5. Architecture Evolution ───────── */

const EVOLUTION = [
  {
    name: 'R-CNN',
    year: '2014',
    speed: 'Slow (~47s/image)',
    accuracy: 'mAP 58.5 (PASCAL VOC)',
    idea: 'Selective search generates ~2K region proposals, each warped and classified by CNN + SVM.',
    limitation: 'Extremely slow: each proposal processed independently, no shared computation.',
    color: 'border-red-400 bg-red-50 dark:bg-red-950/30',
  },
  {
    name: 'Fast R-CNN',
    year: '2015',
    speed: 'Moderate (~2s/image)',
    accuracy: 'mAP 66.0',
    idea: 'Single forward pass over the whole image. RoI Pooling extracts features per proposal. Multi-task loss (cls + reg).',
    limitation: 'Still uses selective search for proposals — the bottleneck remains.',
    color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30',
  },
  {
    name: 'Faster R-CNN',
    year: '2015',
    speed: 'Fast (~0.2s/image)',
    accuracy: 'mAP 73.2',
    idea: 'Replace selective search with RPN — a fully convolutional network that shares features with the detector. End-to-end trainable.',
    limitation: 'Two-stage design still slower than one-stage detectors like YOLO.',
    color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    name: 'Mask R-CNN',
    year: '2017',
    speed: 'Fast (~0.3s/image)',
    accuracy: 'mAP 37.1 (COCO seg)',
    idea: 'Adds a mask head and replaces RoI Pooling with RoI Align for pixel-accurate masks.',
    limitation: 'Heavier than detection-only models. Mask branch adds compute.',
    color: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30',
  },
];

function EvolutionTimeline() {
  const [selected, setSelected] = useState(2);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Architecture Evolution</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The R-CNN family evolved from slow region-classification to fast, unified, end-to-end
        architectures. Each iteration removed a computational bottleneck.
      </p>

      <div className="flex gap-1 mb-4">
        {EVOLUTION.map((e, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-1 p-2 text-xs rounded-t text-center transition-all border-b-2 ${
              selected === i
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 font-semibold text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <div>{e.name}</div>
            <div className="text-[10px] opacity-75">{e.year}</div>
          </button>
        ))}
      </div>

      <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border-l-4 ${EVOLUTION[selected].color}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{EVOLUTION[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{EVOLUTION[selected].year}</span>
          </div>
          <div className="text-right text-xs">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Speed</div>
            <div className="text-gray-600 dark:text-gray-400">{EVOLUTION[selected].speed}</div>
          </div>
          <div className="text-right text-xs ml-4">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Accuracy</div>
            <div className="text-gray-600 dark:text-gray-400">{EVOLUTION[selected].accuracy}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-blue-700 dark:text-blue-400">Key Idea:</span>
            <p className="text-gray-700 dark:text-gray-300 mt-0.5">{EVOLUTION[selected].idea}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-red-600">Limitation:</span>
            <p className="text-gray-700 dark:text-gray-300 mt-0.5">{EVOLUTION[selected].limitation}</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {EVOLUTION.map((e, i) => (
          <div key={i} className={`flex-1 text-center ${i <= selected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {i > 0 && <span className="mx-1">{'—'}</span>}
            <span className={i <= selected ? 'font-semibold' : ''}>{e.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── 6. Feature Pyramid Network ───────── */

function FPNVisualizer() {
  const LEVELS = [
    { name: 'C5 → P5', size: 16, color: 'bg-purple-500', label: '1/32', channels: 256, spatial: '~7×7', next: 'P5' },
    { name: 'C4 → P4', size: 32, color: 'bg-blue-500', label: '1/16', channels: 256, spatial: '~14×14', next: 'P4' },
    { name: 'C3 → P3', size: 64, color: 'bg-emerald-500', label: '1/8', channels: 256, spatial: '~28×28', next: 'P3' },
    { name: 'C2 → P2', size: 128, color: 'bg-amber-500', label: '1/4', channels: 256, spatial: '~56×56', next: 'P2' },
  ];
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [showLateral, setShowLateral] = useState(true);
  const [showTopDown, setShowTopDown] = useState(true);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxAnimPhase = 9;

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
      if (e >= maxAnimPhase) { clearInterval(intervalRef.current!); setIsAnimating(false); }
    }, 700);
  }, []);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const bottomUpDone = animPhase >= 4;
  const topDownDone = animPhase >= 8;
  const mergeDone = animPhase >= 9;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Feature Pyramid Network (FPN)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        FPN enhances Faster R-CNN by building a top-down pathway with lateral connections,
        allowing detection at multiple scales. Each pyramid level predicts independently.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={isAnimating ? stopAnim : startAnim}
          className={`px-4 py-1.5 text-xs rounded ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90 transition-colors`}>
          {isAnimating ? '■ Stop' : '▶ Animate Flow'}
        </button>
        <button onClick={() => { stopAnim(); setAnimPhase(0); }}
          className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Reset
        </button>
        <label className="flex items-center gap-1 text-xs cursor-pointer ml-2">
          <input type="checkbox" checked={showLateral} onChange={e => setShowLateral(e.target.checked)} />
          Lateral
        </label>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={showTopDown} onChange={e => setShowTopDown(e.target.checked)} />
          Top-Down
        </label>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-auto font-mono">
          {!isAnimating && animPhase === 0 ? 'Idle' : `Step ${animPhase}/${maxAnimPhase}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(animPhase / maxAnimPhase) * 100}%` }} />
      </div>

      <div className="relative w-full max-w-[560px] mx-auto" style={{ height: 340 }}>
        {/* Phase labels */}
        <div className="absolute left-0 top-0 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 w-20 leading-tight">
          {animPhase < 4 ? 'Bottom-up' : animPhase < 8 ? 'Top-down' : 'Complete'}
        </div>

        {LEVELS.map((l, i) => {
          const maxSize = 200;
          const barW = (l.size / 128) * maxSize;
          const xOffset = (maxSize - barW) / 2 + 60;
          const yPos = 20 + i * 78;
          const isActive = activeLevel === i || bottomUpDone;

          // Animation: bottom-up lights up C-levels left-to-right (C5→C2)
          const cRevealed = animPhase > i;
          // Animation: top-down lights up P-levels top-to-bottom (P5→P2)
          const pRevealed = topDownDone || (animPhase >= 4 && animPhase > 4 + i);
          // Merge animation: throb when both pathways arrive
          const merged = mergeDone;

          return (
            <div key={i}>
              {/* C-level bar (bottom-up) */}
              <motion.div
                className={`absolute h-12 rounded border-2 cursor-pointer transition-all ${
                  isActive && cRevealed ? l.color + ' border-transparent' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                } ${i === activeLevel ? 'ring-2 ring-blue-400 shadow-md' : ''}`}
                style={{ left: xOffset + 100, top: yPos, width: barW }}
                onClick={() => setActiveLevel(i === activeLevel ? null : i)}
              >
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-semibold drop-shadow-sm ${
                  isActive && cRevealed ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  C{l.next[1]}
                </span>
                {cRevealed && animPhase < 4 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">
                    {i + 1}
                  </motion.div>
                )}
              </motion.div>

              {/* 1×1 lateral conv box */}
              {showLateral && cRevealed && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`absolute w-8 h-8 rounded border-2 border-indigo-400 bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center z-10`}
                  style={{ left: xOffset + 80, top: yPos + 8 }}>
                  <span className="text-[6px] font-bold text-indigo-700 dark:text-indigo-300">1×1</span>
                </motion.div>
              )}

              {/* Lateral connection arrow */}
              {showLateral && cRevealed && (
                <svg className="absolute" style={{ left: xOffset + 88, top: yPos, width: 16, height: 48 }} viewBox="0 0 16 48">
                  <line x1="0" y1="24" x2="12" y2="24" stroke="#6366f1" strokeWidth="2" />
                  <polygon points="12,24 6,18 6,30" fill="#6366f1" />
                </svg>
              )}

              {/* P-level bar (after merge) */}
              <motion.div
                className={`absolute h-12 rounded border-2 transition-all ${
                  pRevealed || merged ? l.color + ' border-transparent' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                } ${merged ? 'shadow-lg' : ''}`}
                style={{
                  left: xOffset + 30, top: yPos,
                  width: pRevealed || merged ? barW : 0,
                  opacity: pRevealed || merged ? 1 : 0.3,
                }}
              >
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-semibold drop-shadow-sm ${
                  pRevealed || merged ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {l.next}
                </span>
              </motion.div>

              {/* Top-down connection arrow (from level above) */}
              {showTopDown && i > 0 && pRevealed && (
                <svg className="absolute" style={{
                  left: xOffset + 30 + barW / 2 - 40, top: yPos - 24, width: 80, height: 24,
                }} viewBox="0 0 80 24">
                  <line x1="40" y1="0" x2="40" y2="18" stroke="#10b981" strokeWidth="2" />
                  <line x1="40" y1="18" x2="5" y2="18" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                  <polygon points="5,18 12,12 12,24" fill="#10b981" />
                </svg>
              )}

              {/* Scale label */}
              <span className="absolute text-[10px] font-mono text-gray-400 dark:text-gray-500"
                style={{ left: xOffset + 30 + barW + 6, top: yPos + 16 }}>{l.label}</span>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-4 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Lateral (1×1 conv)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Top-down (2× upsample)</span>
        </div>
      </div>

      {/* Detail panel */}
      {activeLevel !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Level</span>
            <div className="font-semibold mt-0.5">{LEVELS[activeLevel].name}</div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Scale</span>
            <div className="font-semibold mt-0.5">{LEVELS[activeLevel].label}</div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Channels</span>
            <div className="font-semibold mt-0.5">{LEVELS[activeLevel].channels}</div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Spatial Size</span>
            <div className="font-semibold mt-0.5">{LEVELS[activeLevel].spatial}</div>
          </div>
        </motion.div>
      )}

      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400 text-xs">
        <h4 className="font-semibold mb-1">How FPN Works</h4>
        <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li><strong>Bottom-up:</strong> Standard ResNet forward pass produces C2–C5 at decreasing scales.</li>
          <li><strong>Top-down:</strong> P5 is created from C5 via 1×1 conv, then upsampled 2× and merged with C4.</li>
          <li><strong>Lateral connections:</strong> Each C-level is transformed by 1×1 conv before merging.</li>
          <li><strong>Independent predictions:</strong> Each P-level produces its own anchors, RPN proposals, and final detections.</li>
        </ol>
      </div>
    </div>
  );
}

/* ───────── 7. Bounding Box Regression ───────── */

function BBoxRegression() {
  const [bx, setBx] = useState(0.35);
  const [by, setBy] = useState(0.35);
  const [bw, setBw] = useState(0.15);
  const [bh, setBh] = useState(0.15);
  const [gx] = useState(0.6);
  const [gy] = useState(0.55);
  const [gw] = useState(0.25);
  const [gh] = useState(0.3);
  const [imprecision, setImprecision] = useState(0);

  const txRaw = (gx - bx) / bw;
  const tyRaw = (gy - by) / bh;
  const twRaw = Math.log(gw / bw);
  const thRaw = Math.log(gh / bh);

  // Apply imprecision: simulated RPN prediction error
  const noiseScale = 0.3;
  const predTx = txRaw * (1 + imprecision * noiseScale);
  const predTy = tyRaw * (1 + imprecision * noiseScale);
  const predTw = twRaw * (1 + imprecision * noiseScale);
  const predTh = thRaw * (1 + imprecision * noiseScale);

  const regX = bx + predTx * bw;
  const regY = by + predTy * bh;
  const regW = bw * Math.exp(predTw);
  const regH = bh * Math.exp(predTh);

  const anchorIoU = computeIoU(bx, by, bw, bh, gx, gy, gw, gh);
  const propIoU = computeIoU(regX, regY, regW, regH, gx, gy, gw, gh);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Bounding Box Regression</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The RPN regresses from anchor boxes to proposals using 4 parameterized offsets:
        t<sub>x</sub>, t<sub>y</sub> (center shift), t<sub>w</sub>, t<sub>h</sub> (log-scale size).
      </p>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-gray-900"
          style={{ width: 300, height: 280 }}>
          {/* GT box */}
          <div className="absolute border-2 border-blue-500 bg-blue-500/10 rounded"
            style={{ left: `${(gx - gw / 2) * 100}%`, top: `${(gy - gh / 2) * 100}%`,
              width: `${gw * 100}%`, height: `${gh * 100}%` }}>
            <span className="absolute top-0 left-0 text-[8px] font-semibold text-blue-600 bg-white/80 dark:bg-gray-900/80 px-0.5 rounded">GT</span>
          </div>
          {/* Anchor box */}
          <div className="absolute border-2 border-red-400 bg-red-400/10 rounded"
            style={{ left: `${(bx - bw / 2) * 100}%`, top: `${(by - bh / 2) * 100}%`,
              width: `${bw * 100}%`, height: `${bh * 100}%` }}>
            <span className="absolute -top-3 left-0 text-[8px] font-semibold text-red-500">Anchor</span>
          </div>
          {/* Offset vector arrow */}
          {imprecision > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <line x1={`${bx * 100}%`} y1={`${by * 100}%`}
                x2={`${regX * 100}%`} y2={`${regY * 100}%`}
                stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
              <polygon points={`${regX * 100},${regY * 100} ${regX * 100 - 4},${regY * 100 - 3} ${regX * 100 - 4},${regY * 100 + 3}`}
                fill="#f59e0b" />
            </svg>
          )}
          {/* Regressed box */}
          <div className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded"
            style={{ left: `${(regX - regW / 2) * 100}%`, top: `${(regY - regH / 2) * 100}%`,
              width: `${regW * 100}%`, height: `${regH * 100}%` }}>
            <span className="absolute -top-3 right-0 text-[8px] font-semibold text-emerald-600">Proposal</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'tₓ', exact: txRaw, pred: predTx, desc: '(Gₓ − Pₓ) / P_w' },
              { label: 't_y', exact: tyRaw, pred: predTy, desc: '(G_y − P_y) / P_h' },
              { label: 't_w', exact: twRaw, pred: predTw, desc: 'log(G_w / P_w)' },
              { label: 't_h', exact: thRaw, pred: predTh, desc: 'log(G_h / P_h)' },
            ].map(p => (
              <div key={p.label} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                <div className="font-mono font-semibold text-sm text-blue-700 dark:text-blue-300">
                  {p.label}
                </div>
                <div className="text-xs mt-0.5">
                  <span className="text-gray-500 dark:text-gray-400">target: </span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">{p.exact.toFixed(3)}</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500 dark:text-gray-400">predicted: </span>
                  <span className={`font-mono ${imprecision > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {p.pred.toFixed(3)}
                  </span>
                </div>
                <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{p.desc}</div>
              </div>
            ))}
          </div>

          {/* IoU cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">
              <span className="text-gray-500 dark:text-gray-400">Anchor vs GT IoU</span>
              <div className="font-mono font-semibold mt-0.5" style={{ color: anchorIoU > 0.5 ? '#059669' : '#dc2626' }}>
                {anchorIoU.toFixed(3)}
              </div>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">
              <span className="text-gray-500 dark:text-gray-400">Proposal vs GT IoU</span>
              <div className="font-mono font-semibold mt-0.5" style={{ color: propIoU > 0.5 ? '#059669' : (imprecision > 0 ? '#d97706' : '#059669') }}>
                {propIoU.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900 text-xs">
            <strong>Formula:</strong> G&prime;<sub>x</sub> = P<sub>x</sub> + t<sub>x</sub> &middot; P<sub>w</sub>, &nbsp;
            G&prime;<sub>w</sub> = P<sub>w</sub> &middot; exp(t<sub>w</sub>)
          </div>

          <div className="flex flex-wrap gap-3">
            <div><label className="text-[10px] font-medium">Anchor X</label>
              <input type="range" min="0.1" max="0.9" step="0.01" value={bx}
                onChange={e => setBx(parseFloat(e.target.value))} className="w-16 ml-1" />
            </div>
            <div><label className="text-[10px] font-medium">Anchor Y</label>
              <input type="range" min="0.1" max="0.9" step="0.01" value={by}
                onChange={e => setBy(parseFloat(e.target.value))} className="w-16 ml-1" />
            </div>
            <div><label className="text-[10px] font-medium">Anchor W</label>
              <input type="range" min="0.08" max="0.4" step="0.01" value={bw}
                onChange={e => setBw(parseFloat(e.target.value))} className="w-16 ml-1" />
            </div>
            <div><label className="text-[10px] font-medium">Anchor H</label>
              <input type="range" min="0.08" max="0.4" step="0.01" value={bh}
                onChange={e => setBh(parseFloat(e.target.value))} className="w-16 ml-1" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Regression Imprecision</span>
            <input type="range" min="0" max="1" step="0.05" value={imprecision}
              onChange={e => setImprecision(parseFloat(e.target.value))} className="w-24" />
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              {imprecision === 0 ? 'Perfect' : `${Math.round(imprecision * 30)}% error`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 8. Proposal Sampling ───────── */

function ProposalSampling() {
  const [samplingRatio, setSamplingRatio] = useState(0.25);
  const [seed, setSeed] = useState(0);
  const [sampled, setSampled] = useState(false);
  const totalProposals = 256;

  const proposals = useMemo(() => {
    const result: { x: number; y: number; iou: number; selected: boolean; isPos: boolean }[] = [];
    for (let i = 0; i < totalProposals; i++) {
      const iou = seededRandom(i * 3 + seed) * 0.9;
      const isPos = iou > 0.5;
      result.push({
        x: seededRandom(i * 7 + seed + 1) * 0.85 + 0.075,
        y: seededRandom(i * 11 + seed + 2) * 0.85 + 0.075,
        iou,
        selected: false,
        isPos,
      });
    }
    return result;
  }, [seed]);

  const sampledProposals = useMemo(() => {
    if (!sampled) return proposals.map(p => ({ ...p, selected: false }));
    const pos = proposals.filter(p => p.isPos);
    const neg = proposals.filter(p => !p.isPos);
    const targetPos = Math.round(totalProposals * samplingRatio);
    const numPos = Math.min(targetPos, pos.length);
    const numNeg = Math.min(totalProposals - numPos, neg.length);
    const posSet = new Set(pos.slice(0, numPos));
    const negSet = new Set(neg.slice(0, numNeg));
    return proposals.map(p => ({ ...p, selected: posSet.has(p) || negSet.has(p) }));
  }, [proposals, sampled, samplingRatio]);

  const posCount = sampledProposals.filter(p => p.selected && p.isPos).length;
  const negCount = sampledProposals.filter(p => p.selected && !p.isPos).length;
  const actualPosRatio = posCount + negCount > 0 ? posCount / (posCount + negCount) : 0;

  const iouToColor = (iou: number, selected: boolean, sampledMode: boolean) => {
    if (!sampledMode) {
      const r = Math.round(200 - iou * 150);
      const g = Math.round(100 + iou * 155);
      return `rgb(${r},${g},100)`;
    }
    if (!selected) return 'rgb(200,200,200)';
    const r = Math.round(220 - iou * 180);
    const g = Math.round(80 + iou * 175);
    return `rgb(${r},${g},80)`;
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Proposal Sampling during Training</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The detection head doesn&apos;t use all ~2,000 proposals. It samples a mini-batch of 256
        proposals, balancing positive and negative examples for stable training.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <button onClick={() => { setSampled(true); setSeed(s => s + 1); }}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Sample Mini-Batch
        </button>
        <button onClick={() => setSampled(false)}
          className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Show All Proposals
        </button>
        {sampled && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Pos Ratio</span>
            <input type="range" min="0.1" max="0.5" step="0.05" value={samplingRatio}
              onChange={e => setSamplingRatio(parseFloat(e.target.value))} className="w-20" />
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">{Math.round(samplingRatio * 100)}%</span>
          </div>
        )}
      </div>

      <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-gray-900 mb-4"
        style={{ width: 300, height: 300 }}>
        {sampledProposals.map((p, i) => (
          <div key={i}
            className={`absolute w-2 h-2 rounded-full transition-all duration-300 ${
              sampled && !p.selected ? 'opacity-20' : 'opacity-90'
            }`}
            style={{
              left: `${p.x * 100}%`, top: `${p.y * 100}%`,
              backgroundColor: iouToColor(p.iou, p.selected, sampled),
              transform: sampled && p.selected ? 'scale(1.3)' : 'scale(1)',
            }}
            title={`IoU: ${p.iou.toFixed(2)}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Total Proposals</div>
          <div className="text-xl font-bold">{totalProposals}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Sampled</div>
          <div className="text-xl font-bold">{sampled ? posCount + negCount : '-'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Positive (IoU &gt; 0.5)</div>
          <div className="text-xl font-bold text-emerald-600">{posCount}
            {sampled && <span className="text-sm font-normal text-gray-400 ml-1">({Math.round(actualPosRatio * 100)}% actual)</span>}
          </div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Target: {Math.round(samplingRatio * 100)}%</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">Negative (IoU &lt; 0.5)</div>
          <div className="text-xl font-bold text-red-500">{negCount}
            {sampled && <span className="text-sm font-normal text-gray-400 ml-1">({Math.round((1 - actualPosRatio) * 100)}% actual)</span>}
          </div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Target: {Math.round((1 - samplingRatio) * 100)}%</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
        <h4 className="font-semibold mb-1">Why Sample?</h4>
        <p className="text-gray-700 dark:text-gray-300">
          Without sampling, the vast majority of proposals would be negative (background),
          creating a severe class imbalance. Sampling ensures the detection head sees enough
          positive examples to learn meaningful features.
        </p>
      </div>
    </div>
  );
}

/* ───────── 9. mAP Calculator ───────── */

function MAPCalculator() {
  const [iouThresh, setIouThresh] = useState(0.5);
  const [seed, setSeed] = useState(0);

  interface Prediction { score: number; iou: number; tp: boolean; }
  const predictions = useMemo((): Prediction[] => {
    const raw = [
      { score: 0.95, iou: 0.88 },
      { score: 0.92, iou: 0.76 },
      { score: 0.88, iou: 0.91 },
      { score: 0.82, iou: 0.35 },
      { score: 0.78, iou: 0.72 },
      { score: 0.71, iou: 0.12 },
      { score: 0.65, iou: 0.83 },
      { score: 0.60, iou: 0.55 },
      { score: 0.55, iou: 0.08 },
      { score: 0.50, iou: 0.42 },
    ].map((p, i) => ({
      ...p,
      score: Math.min(0.99, Math.max(0.05, p.score + (seededRandom(i + seed) - 0.5) * 0.06)),
      iou: Math.min(0.99, Math.max(0.01, p.iou + (seededRandom(i + seed + 10) - 0.5) * 0.06)),
    }));
    const sorted = raw.sort((a, b) => b.score - a.score);
    return sorted.map(p => {
      const tp = p.iou >= iouThresh;
      return { ...p, tp };
    });
  }, [seed, iouThresh]);

  const totalGT = 3;
  let tp = 0, fp = 0;
  const precisions: number[] = [];
  const recalls: number[] = [];
  for (const p of predictions) {
    if (p.tp) tp++; else fp++;
    precisions.push(tp / (tp + fp));
    recalls.push(tp / totalGT);
  }

  // 11-point interpolation
  const interpRecalls = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const interpPrecisions = interpRecalls.map(r => {
    const valid = precisions.filter((_, i) => recalls[i] >= r);
    return valid.length > 0 ? Math.max(...valid) : 0;
  });
  const ap = interpPrecisions.reduce((a, b) => a + b, 0) / interpPrecisions.length;

  const pad = { t: 8, r: 8, b: 20, l: 28 };
  const plotW = 260, plotH = 220;
  const innerW = plotW - pad.l - pad.r;
  const innerH = plotH - pad.t - pad.b;
  const toX = (r: number) => pad.l + r * innerW;
  const toY = (p: number) => pad.t + (1 - p) * innerH;

  // Build paths
  const rawPathD = precisions.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(recalls[i]).toFixed(1)},${toY(p).toFixed(1)}`
  ).join(' ');

  const interpPathD = interpPrecisions.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(interpRecalls[i]).toFixed(1)},${toY(p).toFixed(1)}`
  ).join(' ');

  const areaPathD = interpPathD + ` L${toX(1).toFixed(1)},${toY(0).toFixed(1)} L${toX(0).toFixed(1)},${toY(0).toFixed(1)} Z`;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Mean Average Precision (mAP)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        mAP is the standard metric for object detection. AP computes the area under the
        precision-recall curve for a single class; mAP averages AP across all classes.
        Values range from 0 (worst) to 1 (perfect).
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div>
          <label className="text-xs font-medium">IoU Threshold: {iouThresh.toFixed(1)}</label>
          <input type="range" min="0.3" max="0.9" step="0.1" value={iouThresh}
            onChange={e => setIouThresh(parseFloat(e.target.value))} className="w-24 ml-2" />
        </div>
        <button onClick={() => setSeed(s => s + 1)}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          New Predictions
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* PR curve */}
        <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          style={{ width: plotW, height: plotH }}>
          <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full h-full">
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => (
              <g key={v}>
                <line x1={toX(v)} y1={pad.t} x2={toX(v)} y2={plotH - pad.b} stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1={pad.l} y1={toY(v)} x2={plotW - pad.r} y2={toY(v)} stroke="#e5e7eb" strokeWidth="0.5" />
              </g>
            ))}
            {/* Axes */}
            <line x1={pad.l} y1={plotH - pad.b} x2={plotW - pad.r} y2={plotH - pad.b} stroke="#999" strokeWidth="0.8" />
            <line x1={pad.l} y1={pad.t} x2={pad.l} y2={plotH - pad.b} stroke="#999" strokeWidth="0.8" />
            {/* Area under interpolated curve */}
            <path d={areaPathD} fill="rgba(59,130,246,0.12)" />
            {/* Interpolated curve */}
            <path d={interpPathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Raw PR curve */}
            <path d={rawPathD} fill="none" stroke="#6b7280" strokeWidth="1" />
            {/* Raw points: TP=green, FP=red */}
            {precisions.map((p, i) => (
              <circle key={i} cx={toX(recalls[i])} cy={toY(p)} r="2.5"
                fill={predictions[i].tp ? '#22c55e' : '#ef4444'} stroke="#fff" strokeWidth="0.5" />
            ))}
            {/* Interpolated points */}
            {interpPrecisions.map((p, i) => (
              <circle key={`ip-${i}`} cx={toX(interpRecalls[i])} cy={toY(p)} r="1.5" fill="#3b82f6" opacity={0.7} />
            ))}
            {/* Axis labels */}
            <text x={plotW / 2} y={plotH - 3} textAnchor="middle" fontSize="9" fill="#9ca3af">Recall</text>
            <text x={10} y={plotH / 2} textAnchor="middle" fontSize="9" fill="#9ca3af"
              transform={`rotate(-90, 10, ${plotH / 2})`}>Precision</text>
          </svg>
        </div>

        {/* Table + AP */}
        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1 pr-2">Score</th>
                  <th className="text-left py-1 pr-2">IoU</th>
                  <th className="text-left py-1 pr-2">Match</th>
                  <th className="text-left py-1 pr-2">Precision</th>
                  <th className="text-left py-1 pr-2">Recall</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1 pr-2 font-mono">{p.score.toFixed(2)}</td>
                    <td className="py-1 pr-2 font-mono">{p.iou.toFixed(2)}</td>
                    <td className="py-1 pr-2">
                      <span className={`px-1 py-0.5 rounded text-[10px] font-semibold ${
                        p.tp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>{p.tp ? 'TP' : 'FP'}</span>
                    </td>
                    <td className="py-1 pr-2 font-mono">{precisions[i].toFixed(2)}</td>
                    <td className="py-1 pr-2 font-mono">{recalls[i].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs flex items-center justify-between">
              <span className="font-semibold">AP@<sub>{iouThresh.toFixed(1)}</sub> (11-pt interp)</span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{ap.toFixed(3)}</span>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">
              <span className="text-gray-500 dark:text-gray-400">GT Boxes</span>
              <div className="font-semibold text-lg">{totalGT}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 10. Inference Pipeline ───────── */

const PIPELINE_STEPS = [
  { label: 'Input Image', icon: '🖼️', detail: 'Resized to ~600×1000 px' },
  { label: 'Backbone (ResNet)', icon: '🧠', detail: 'Feature extraction via conv layers' },
  { label: 'Feature Map (C4)', icon: '🗺️', detail: 'Spatial feature grid ~40×60' },
  { label: 'RPN (3×3 → Cls + Reg)', icon: '🎯', detail: 'Slide window, 9 anchors × 2 scores + 4 offsets' },
  { label: 'Proposals (~2K)', icon: '📦', detail: 'Sorted by score, NMS at IoU=0.7' },
  { label: 'RoI Pooling', icon: '📐', detail: '7×7 fixed-size feature crops' },
  { label: 'Detection Head (FC)', icon: '⚖️', detail: 'Class scores + box refinement' },
  { label: 'NMS (Final)', icon: '🏁', detail: 'Per-class NMS at IoU=0.5 → detections' },
];

function InferencePipeline() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'fast'>('fast');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSteps = PIPELINE_STEPS.length;
  const intervalMs = speed === 'slow' ? 1200 : 400;

  const startAnim = useCallback(() => {
    setPlaying(true);
    setStep(0);
    let e = 0;
    intervalRef.current = setInterval(() => {
      e++;
      setStep(e);
      if (e >= totalSteps - 1) { clearInterval(intervalRef.current!); setPlaying(false); }
    }, intervalMs);
  }, [intervalMs, totalSteps]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Inference Pipeline</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        End-to-end flow of Faster R-CNN during inference. Each stage transforms the data
        until final detections emerge.
      </p>

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <button onClick={startAnim} disabled={playing}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
          ▶ Play
        </button>
        <button onClick={() => { setPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); }}
          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
          ■ Stop
        </button>
        <button onClick={() => { setPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); setStep(0); }}
          className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          Reset
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Speed</span>
          <button onClick={() => setSpeed(s => s === 'slow' ? 'fast' : 'slow')}
            className={`relative w-9 h-4 rounded-full transition-colors ${speed === 'fast' ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${speed === 'fast' ? 'translate-x-1' : 'translate-x-5'}`} />
          </button>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{speed === 'fast' ? 'Fast' : 'Slow'}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          Step {step + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      {/* Pipeline flow */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {PIPELINE_STEPS.map((s, i) => {
          const active = i <= step;
          const current = i === step;
          return (
            <button key={i} onClick={() => { if (!playing) setStep(i); }}
              className={`flex flex-col items-center p-2 rounded-lg border-2 text-center transition-all ${
                current
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md scale-105'
                  : active
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 opacity-70'
                    : 'border-gray-200 dark:border-gray-700 opacity-40 hover:opacity-70'
              }`}
              style={{ width: 100, minHeight: 90 }}>
              <span className="text-lg">{s.icon}</span>
              <span className="text-[10px] font-medium mt-1 leading-tight">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Detail card */}
      <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{PIPELINE_STEPS[step].icon}</span>
          <div>
            <h4 className="font-semibold">{PIPELINE_STEPS[step].label}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{PIPELINE_STEPS[step].detail}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {PIPELINE_STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${
              i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Main Component ───────── */

export default function FasterRCNNAdvancedDive() {
  const [section, setSection] = useState<Section>('anchors');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'anchors', label: 'Anchors & IoU', icon: '📦' },
    { id: 'rpn-training', label: 'RPN Training', icon: '📉' },
    { id: 'nms', label: 'NMS Demo', icon: '🎯' },
    { id: 'roi-align', label: 'RoI Align', icon: '🔍' },
    { id: 'fpn', label: 'FPN', icon: '🔺' },
    { id: 'bbox-reg', label: 'BBox Regression', icon: '📏' },
    { id: 'sampling', label: 'Sampling', icon: '🧪' },
    { id: 'map', label: 'mAP', icon: '📊' },
    { id: 'pipeline', label: 'Pipeline', icon: '🔁' },
    { id: 'evolution', label: 'Evolution', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how Faster R-CNN works under the hood — from anchor matching and RPN
          training dynamics to NMS, RoI Align, and the architecture evolution.
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t whitespace-nowrap transition-colors ${
                section === s.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === 'anchors' && <AnchorDeepDive />}
          {section === 'rpn-training' && <RPNTrainingDynamics />}
          {section === 'nms' && <NMSDemo />}
          {section === 'roi-align' && <RoIAlignExplorer />}
          {section === 'fpn' && <FPNVisualizer />}
          {section === 'bbox-reg' && <BBoxRegression />}
          {section === 'sampling' && <ProposalSampling />}
          {section === 'map' && <MAPCalculator />}
          {section === 'pipeline' && <InferencePipeline />}
          {section === 'evolution' && <EvolutionTimeline />}
        </motion.div>
      </div>
    </div>
  );
}
