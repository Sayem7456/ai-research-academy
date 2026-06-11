'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type Section = 'kalman' | 'iou' | 'evolution';

/* --------- helpers --------- */

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* --------- 1. Kalman Filter Visualizer --------- */

function KalmanDemo() {
  const [noiseLevel, setNoiseLevel] = useState(3);
  const [step, setStep] = useState(0);

  const truePos = step * 4;
  const measurement = truePos + (seededRandom(step * 13 + 7) - 0.5) * 2 * noiseLevel;

  const state = { x: 0, p: 10 };
  for (let i = 0; i <= step; i++) {
    if (i === 0) continue;
    const pred = { x: state.x + 4, p: state.p + 2 };
    const meas = i * 4 + (seededRandom(i * 13 + 7) - 0.5) * 2 * noiseLevel;
    const k = pred.p / (pred.p + noiseLevel * 2);
    state.x = pred.x + k * (meas - pred.x);
    state.p = (1 - k) * pred.p;
  }

  const SCALE = 3;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Kalman Filter in 1D</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The Kalman filter alternates between prediction (motion model) and correction
        (measurement update). The Kalman gain K balances prediction vs. measurement uncertainty.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
            <svg width="100%" height="160" viewBox="0 0 360 140" className="overflow-visible">
              {Array.from({ length: 30 }).map((_, i) => {
                const t = i * 4;
                const m = t + (seededRandom(i * 13 + 7) - 0.5) * 2 * noiseLevel;
                const s = { x: 0, p: 10 };
                for (let j = 1; j <= i; j++) {
                  const p = { x: s.x + 4, p: s.p + 2 };
                  const mm = j * 4 + (seededRandom(j * 13 + 7) - 0.5) * 2 * noiseLevel;
                  const k = p.p / (p.p + noiseLevel * 2);
                  s.x = p.x + k * (mm - p.x);
                  s.p = (1 - k) * p.p;
                }
                const isPast = i <= step;
                const isCurr = i === step;
                return (
                  <g key={i} opacity={isPast ? 1 : 0.15}>
                    {i > 0 && (
                      <line x1={30 + (i - 1) * 4 * SCALE} y1={120 - m}
                        x2={30 + i * 4 * SCALE} y2={120 - m}
                        stroke="#ef4444" strokeWidth={1.5} opacity={isPast ? 0.5 : 0.15} />
                    )}
                    {i > 0 && (
                      <line x1={30 + (i - 1) * 4 * SCALE} y1={120 - s.x}
                        x2={30 + i * 4 * SCALE} y2={120 - s.x}
                        stroke="#3b82f6" strokeWidth={2} opacity={isPast ? 0.9 : 0.15} />
                    )}
                    <line x1={30 + t * SCALE} y1={120 - t} x2={30 + t * SCALE} y2={120 - t - 2}
                      stroke="#22c55e" strokeWidth={2} opacity={isPast ? 0.9 : 0.15} />
                    {isCurr && (
                      <>
                        <circle cx={30 + t * SCALE} cy={120 - t} r={5} fill="none" stroke="#22c55e" strokeWidth={2} />
                        <circle cx={30 + t * SCALE} cy={120 - m} r={4} fill="#ef4444" />
                        <circle cx={30 + t * SCALE} cy={120 - s.x} r={4} fill="#3b82f6" />
                      </>
                    )}
                  </g>
                );
              })}
              <line x1={30} y1={120} x2={330} y2={120} stroke="#94a3b8" strokeWidth={0.5} />
              <text x="15" y="15" fontSize="8" fill="#22c55e">True</text>
              <text x="15" y="27" fontSize="8" fill="#ef4444">Measured</text>
              <text x="15" y="39" fontSize="8" fill="#3b82f6">Filtered</text>
            </svg>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 mt-3 rounded border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium">Measurement Noise: {noiseLevel}</label>
            <input type="range" min="0.5" max="8" step="0.5" value={noiseLevel}
              onChange={e => setNoiseLevel(parseFloat(e.target.value))} className="w-full" />
          </div>
        </div>

        <div className="flex-shrink-0 w-full lg:w-56 space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 text-xs space-y-2">
            <h4 className="font-semibold">Step {step}</h4>
            <div className="flex justify-between">
              <span className="text-green-600 dark:text-green-400">True pos:</span>
              <span className="font-mono">{truePos.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">Measurement:</span>
              <span className="font-mono">{measurement.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600 dark:text-blue-400">Filtered:</span>
              <span className="font-mono">{state.x.toFixed(1)}</span>
            </div>
            <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Error:</span>
                <span className="font-mono">{Math.abs(truePos - state.x).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(s => Math.min(29, s + 1))}
              className="flex-1 px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:opacity-90 transition-opacity">
              Next Step
            </button>
            <button onClick={() => setStep(0)}
              className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Reset
            </button>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
            <strong>Kalman Gain:</strong> K = P / (P + R). When measurement noise (R) is high, K is small
            and the filter trusts the prediction more. When R is low, K is large and the filter follows
            measurements closely.
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------- 2. IoU Matching Matrix --------- */

function IoUMatching() {
  const NUM = 4;
  const tracks = useMemo(() =>
    Array.from({ length: NUM }, (_, i) => ({
      id: i + 1,
      px: 30 + i * 70 + seededRandom(i * 13 + 3) * 10,
      py: 20 + seededRandom(i * 17 + 5) * 20,
    })),
  []);
  const dets = useMemo(() =>
    Array.from({ length: NUM }, (_, i) => ({
      id: i + 1,
      dx: 30 + i * 70 + seededRandom(i * 23 + 7) * 15,
      dy: 30 + seededRandom(i * 29 + 11) * 25,
    })),
  []);

  const iouMatrix = useMemo(() => {
    const ious: number[][] = [];
    for (const t of tracks) {
      const row: number[] = [];
      for (const d of dets) {
        const xOverlap = Math.max(0, 16 - Math.abs(t.px - d.dx));
        const yOverlap = Math.max(0, 16 - Math.abs(t.py - d.dy));
        const intersect = xOverlap * yOverlap;
        const area = 32 * 32;
        row.push(intersect / (2 * area - intersect));
      }
      ious.push(row);
    }
    return ious;
  }, [tracks, dets]);

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const maxIoU = Math.max(...iouMatrix.flat(), 0.01);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">IoU Matching &amp; Hungarian Algorithm</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        SORT computes an IoU cost matrix between Kalman predictions and detector outputs,
        then uses the Hungarian algorithm to find the optimal assignment.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <svg width="300" height="180" className="border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
            {tracks.map(t => (
              <g key={`t-${t.id}`}>
                <rect x={t.px - 8} y={t.py - 8} width={16} height={16} rx={2}
                  fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth={1.5} />
                <text x={t.px} y={t.py + 3} textAnchor="middle" fontSize="7" fill="#3b82f6" fontWeight="bold">
                  P{t.id}
                </text>
              </g>
            ))}
            {dets.map(d => (
              <g key={`d-${d.id}`}>
                <rect x={d.dx - 8} y={d.dy - 8} width={16} height={16} rx={2}
                  fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth={1.5}
                  strokeDasharray="3 2" />
                <text x={d.dx} y={d.dy + 3} textAnchor="middle" fontSize="7" fill="#ef4444" fontWeight="bold">
                  D{d.id}
                </text>
              </g>
            ))}
            {tracks.map((t, ti) => dets.map((d, dj) => {
              const isSelected = selectedCell && selectedCell[0] === ti && selectedCell[1] === dj;
              return (
                <line key={`m-${ti}-${dj}`}
                  x1={t.px} y1={t.py} x2={d.dx} y2={d.dy}
                  stroke={isSelected ? '#f59e0b' : '#e5e7eb'}
                  strokeWidth={isSelected ? 2 : 0.5}
                  strokeDasharray={isSelected ? 'none' : '2 2'}
                  opacity={isSelected ? 1 : 0.3}
                />
              );
            }))}
            <line x1="10" y1="168" x2="10" y2="155" stroke="#3b82f6" strokeWidth="2" />
            <text x="14" y="164" fontSize="6" fill="#3b82f6">Prediction</text>
            <line x1="90" y1="168" x2="90" y2="155" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
            <text x="94" y="164" fontSize="6" fill="#ef4444">Detection</text>
          </svg>
        </div>

        <div className="flex-1">
          <div className="text-xs font-semibold mb-2">IoU Cost Matrix</div>
          <div className="inline-block border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex">
              <div className="w-8 h-7 flex items-center justify-center text-[8px] text-gray-400" />
              {dets.map(d => (
                <div key={d.id} className="w-14 h-7 flex items-center justify-center text-[9px] font-semibold text-red-600 dark:text-red-400">
                  D{d.id}
                </div>
              ))}
            </div>
            {iouMatrix.map((row, ti) => (
              <div key={ti} className="flex">
                <div className="w-8 h-12 flex items-center justify-center text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                  P{ti + 1}
                </div>
                {row.map((iou, dj) => {
                  const norm = iou / maxIoU;
                  const isSelected = selectedCell && selectedCell[0] === ti && selectedCell[1] === dj;
                  return (
                    <button key={dj}
                      onClick={() => setSelectedCell(selectedCell?.[0] === ti && selectedCell?.[1] === dj ? null : [ti, dj])}
                      className={`w-14 h-12 flex flex-col items-center justify-center text-[9px] border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:opacity-80 ${
                        isSelected ? 'ring-2 ring-amber-400' : ''
                      }`}
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${norm * 0.5})`,
                      }}>
                      <span className="font-mono font-semibold">{iou.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {selectedCell && (
            <div className="mt-2 text-[10px] text-gray-600 dark:text-gray-400">
              IoU(P{selectedCell[0] + 1}, D{selectedCell[1] + 1}) = {iouMatrix[selectedCell[0]][selectedCell[1]].toFixed(3)}
              &mdash; {iouMatrix[selectedCell[0]][selectedCell[1]] > 0.3
                ? 'Good match' : iouMatrix[selectedCell[0]][selectedCell[1]] > 0.1
                  ? 'Weak match' : 'Poor match'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------- 3. Evolution --------- */

const MILESTONES = [
  { name: 'SORT', year: '2016', venue: 'ICIP 2016', ref: 'Bewley et al.',
    idea: 'Simple Online and Realtime Tracking. Kalman filter + Hungarian algorithm with IoU cost. 260 FPS. No appearance features.',
    impact: 'Established the online tracking paradigm. Extremely fast and simple. Foundation for many subsequent trackers.' },
  { name: 'DeepSORT', year: '2017', venue: 'ICIP 2017', ref: 'Wojke et al.',
    idea: 'Adds appearance feature extractor (ReID network) to SORT. Cosine distance between features replaces IoU for matching. Handles occlusions better.',
    impact: 'Major reduction in ID switches. Became the standard baseline for MOT benchmarks. Inspired many appearance-based extensions.' },
  { name: 'Tracktor', year: '2019', venue: 'ICCV 2019', ref: 'Bergmann et al.',
    idea: 'Eliminates Kalman filter entirely. Uses object detector itself as a track regressor: previous bounding box crops are fed to the detector for re-detection.',
    impact: 'Showed tracking can be done without explicit motion models. Simple and effective. Won MOT17 challenge.' },
  { name: 'FairMOT', year: '2020', venue: 'IJCV 2021', ref: 'Zhang et al.',
    idea: 'Joint detection and tracking in a single anchor-free network. Balanced sampling between detection and ReID tasks. Solves the unfairness issue in prior JDT methods.',
    impact: 'First truly joint detection-and-tracking framework. Set new state-of-the-art on MOT benchmarks. Inspired CenterTrack, CSTrack.' },
  { name: 'ByteTrack', year: '2021', venue: 'ECCV 2022', ref: 'Zhang et al.',
    idea: 'Associates every detection box (not just high-confidence ones) using a two-stage matching strategy: high-score boxes first, then low-score boxes with IoU.',
    impact: 'BYTE algorithm showed low-score detections contain valuable information. 80.3 MOTA on MOT17. Extremely simple yet effective.' },
  { name: 'MOTR / Transformer', year: '2022', venue: 'ECCV 2022', ref: 'Zeng et al.',
    idea: 'End-to-end tracking with transformers. Track queries propagate across frames. No explicit Kalman filter, Hungarian, or ReID network needed.',
    impact: 'Introduced the query-based tracking paradigm. Inspired subsequent works like TrackFormer, MeMOT, and MOTRv2.' },
];

function Evolution() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Evolution of Object Tracking</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        From the simple Kalman-filter-based SORT to transformer-based query propagation &mdash;
        object tracking has evolved rapidly, driven by the MOT challenge benchmarks.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {MILESTONES.map((v, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-1 p-2 text-xs rounded-t text-center transition-all border-b-2 whitespace-nowrap min-w-0 ${
              selected === i
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 font-semibold text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <div>{v.name}</div>
            <div className="text-[10px] opacity-75">{v.year}</div>
          </button>
        ))}
      </div>

      <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{MILESTONES[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {MILESTONES[selected].year} &middot; {MILESTONES[selected].venue} &middot; {MILESTONES[selected].ref}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
          {MILESTONES[selected].idea}
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-800 text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Impact:</span>
          <span className="text-gray-700 dark:text-gray-300 ml-1">{MILESTONES[selected].impact}</span>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {MILESTONES.map((v, i) => (
          <div key={i} className={`flex-1 text-center ${i <= selected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {i > 0 && <span className="mx-1">{'---'}</span>}
            <span className={i <= selected ? 'font-semibold' : ''}>{v.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------- Main --------- */

export default function TrackingAdvancedDive() {
  const [section, setSection] = useState<Section>('kalman');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'kalman', label: 'Kalman Filter', icon: '\U0001f52d' },
    { id: 'iou', label: 'IoU Matching', icon: '\U0001f9e9' },
    { id: 'evolution', label: 'Evolution', icon: '\U0001f4dc' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Object Tracking Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how Kalman filters predict motion, how IoU matching with the Hungarian
          algorithm assigns detections to tracks, and how tracking has evolved from SORT to
          transformer-based approaches.
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
          {section === 'kalman' && <KalmanDemo />}
          {section === 'iou' && <IoUMatching />}
          {section === 'evolution' && <Evolution />}
        </motion.div>
      </div>
    </div>
  );
}
