'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'grid' | 'loss' | 'evolution';

/* ───────── 1. Grid Predictions ───────── */

function GridPredictions() {
  const [cellX, setCellX] = useState(4);
  const [cellY, setCellY] = useState(4);
  const [gridSize, setGridSize] = useState(7);
  const [showProbs, setShowProbs] = useState(false);
  const [showBBox, setShowBBox] = useState(true);
  const cellW = 100 / gridSize;

  const classes = ['person', 'car', 'dog', 'bicycle', 'background'];
  const classProbs = classes.map((_, i) => {
    const base = cellX === 4 && cellY === 4 ? 0.7 : 0.1;
    return Math.min(0.99, Math.max(0.01, base + (seededRandom(i + cellX * 7 + cellY * 13) - 0.5) * 0.2));
  });

  const predictedBoxes = [
    {
      x: cellX * cellW + cellW * 0.3,
      y: cellY * cellW + cellW * 0.2,
      w: cellW * 0.6,
      h: cellW * 0.7,
      conf: 0.82,
      classId: 0,
    },
    {
      x: cellX * cellW + cellW * 0.5,
      y: cellY * cellW + cellW * 0.4,
      w: cellW * 0.5,
      h: cellW * 0.5,
      conf: 0.45,
      classId: 1,
    },
  ];

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Grid Cell Predictions</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        YOLO divides the image into an S×S grid. Each cell predicts B bounding boxes and C class probabilities.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900"
            style={{ width: 300, height: 300 }}>
            {Array.from({ length: gridSize }).map((_, i) => (
              <div key={`h${i}`} className="absolute border-t border-gray-300 dark:border-gray-600"
                style={{ top: `${(i / gridSize) * 100}%`, left: 0, right: 0 }} />
            ))}
            {Array.from({ length: gridSize }).map((_, j) => (
              <div key={`v${j}`} className="absolute border-l border-gray-300 dark:border-gray-600"
                style={{ left: `${(j / gridSize) * 100}%`, top: 0, bottom: 0 }} />
            ))}

            {Array.from({ length: gridSize }).map((_, i) =>
              Array.from({ length: gridSize }).map((_, j) => (
                <div key={`${i}-${j}`}
                  onClick={() => { setCellX(j); setCellY(i); }}
                  className={`absolute cursor-pointer transition-colors ${
                    cellX === j && cellY === i
                      ? 'bg-blue-200/50 dark:bg-blue-800/40 ring-2 ring-blue-500 z-10'
                      : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                  style={{ left: `${(j / gridSize) * 100}%`, top: `${(i / gridSize) * 100}%`,
                    width: cellW + '%', height: cellW + '%' }}
                />
              ))
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                ({cellX},{cellY})
              </span>
            </div>

            {showBBox && (
              <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100">
                {predictedBoxes.map((box, i) => (
                  <g key={i}>
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.w}
                      height={box.h}
                      fill={i === 0 ? '#3b82f622' : '#10b98122'}
                      stroke={i === 0 ? '#3b82f6' : '#10b981'}
                      strokeWidth={0.8}
                      strokeDasharray={i === 0 ? 'none' : '2 1'}
                    />
                    <text
                      x={box.x + 0.5}
                      y={box.y - 0.5}
                      fill={i === 0 ? '#3b82f6' : '#10b981'}
                      fontSize={2.5}
                      fontFamily="monospace"
                    >
                      B{i + 1}: {box.conf.toFixed(2)}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Grid Size: {gridSize}×{gridSize}</label>
              <input type="range" min="4" max="10" step="1" value={gridSize}
                onChange={e => setGridSize(parseInt(e.target.value))} className="w-full cursor-pointer" />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={showProbs} onChange={e => setShowProbs(e.target.checked)} />
                Class Probs
              </label>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={showBBox} onChange={e => setShowBBox(e.target.checked)} />
                Bounding Boxes
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-sm mb-2">Cell ({cellX},{cellY}) Predictions</h4>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Bounding Boxes:</span>
                <span className="font-mono font-semibold">B = 2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">(x, y, w, h, confidence)</span>
              </div>
              {showBBox && (
                <div className="mt-2 space-y-1.5">
                  {predictedBoxes.map((box, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <div className="w-2 h-2 rounded" style={{ backgroundColor: i === 0 ? '#3b82f6' : '#10b981' }} />
                      <span className="font-medium">B{i + 1}:</span>
                      <span className="font-mono text-gray-600 dark:text-gray-400">
                        x={box.x.toFixed(1)}, y={box.y.toFixed(1)}, w={box.w.toFixed(1)}, h={box.h.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {showProbs && (
                <div className="mt-2 space-y-1">
                  {classes.map((cls, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-20 text-gray-500 dark:text-gray-400">{cls}:</span>
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div className="h-full rounded transition-all duration-300"
                          style={{ width: `${classProbs[i] * 100}%`,
                            backgroundColor: classProbs[i] > 0.5 ? '#22c55e' : '#6b7280' }} />
                      </div>
                      <span className="font-mono w-10 text-right">{classProbs[i].toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
            <h4 className="font-semibold mb-1">Output Tensor Shape</h4>
            <div className="font-mono text-gray-700 dark:text-gray-300">
              S × S × (B × 5 + C) = {gridSize} × {gridSize} × {2 * 5 + classes.length - 1} = {gridSize * gridSize * (2 * 5 + classes.length - 1)} values
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 2. YOLO Loss Function ───────── */

function YOLOLossBreakdown() {
  const [coordWeight, setCoordWeight] = useState(5);
  const [noobjWeight, setNoobjWeight] = useState(0.5);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [trainingStep, setTrainingStep] = useState(50);

  const progress = trainingStep / 200;
  const convergenceFactor = 1 - Math.exp(-progress * 3);

  const Lcoord = 2.15 * (1.2 - 0.5 * convergenceFactor) + (seededRandom(trainingStep) - 0.5) * 0.3;
  const Lobj = 1.80 * (1.3 - 0.6 * convergenceFactor) + (seededRandom(trainingStep + 100) - 0.5) * 0.2;
  const Lnoobj = 3.20 * (1.1 - 0.3 * convergenceFactor) + (seededRandom(trainingStep + 200) - 0.5) * 0.4;
  const Lcls = 0.95 * (1.2 - 0.7 * convergenceFactor) + (seededRandom(trainingStep + 300) - 0.5) * 0.15;

  const total = coordWeight * Lcoord + Lobj + noobjWeight * Lnoobj + Lcls;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">YOLO Loss Function</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        YOLO uses a multi-part loss that combines localization error, objectness confidence, and
        classification error into a single optimization objective.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-sm mb-3">Loss Components</h4>
            {[
              { label: 'Localization (coord)', key: 'coord', value: coordWeight * Lcoord,
                color: 'bg-blue-500', desc: 'Smooth L1 on box x, y, w, h' },
              { label: 'Objectness (obj)', key: 'obj', value: Lobj,
                color: 'bg-green-500', desc: 'BCE with object present' },
              { label: 'Objectness (noobj)', key: 'noobj', value: noobjWeight * Lnoobj,
                color: 'bg-red-400', desc: 'BCE with no object (weighted down)' },
              { label: 'Classification', key: 'cls', value: Lcls,
                color: 'bg-purple-500', desc: 'BCE over C classes' },
            ].map(c => (
              <div key={c.key} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                <div className="flex-1">
                  <div className="text-xs font-medium">{c.label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{c.desc}</div>
                </div>
                <div className="font-mono text-sm font-semibold">{c.value.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">λ<sub>coord</sub>: {coordWeight}</label>
              <input type="range" min="1" max="10" step="0.5" value={coordWeight}
                onChange={e => setCoordWeight(parseFloat(e.target.value))} className="w-full cursor-pointer" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">λ<sub>noobj</sub>: {noobjWeight}</label>
              <input type="range" min="0.1" max="1" step="0.1" value={noobjWeight}
                onChange={e => setNoobjWeight(parseFloat(e.target.value))} className="w-full cursor-pointer" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 col-span-2">
              <label className="text-xs font-medium">Training Step: {trainingStep} / 200</label>
              <input type="range" min="1" max="200" step="1" value={trainingStep}
                onChange={e => setTrainingStep(parseInt(e.target.value))} className="w-full cursor-pointer" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Early training</span>
                <span>Converged</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-full lg:w-56 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-sm mb-3">Total Loss</h4>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 text-center">
              {total.toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1">L = L<sub>coord</sub> + L<sub>obj</sub> + L<sub>noobj</sub> + L<sub>cls</sub></div>
          </div>

          {showBreakdown && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <h4 className="font-semibold text-xs mb-2">Composition</h4>
              {[
                { label: 'coord', value: coordWeight * Lcoord, color: 'bg-blue-500' },
                { label: 'obj', value: Lobj, color: 'bg-green-500' },
                { label: 'noobj', value: noobjWeight * Lnoobj, color: 'bg-red-400' },
                { label: 'cls', value: Lcls, color: 'bg-purple-500' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2 py-1">
                  <div className={`w-2 h-2 rounded ${c.color}`} />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-1">{c.label}</span>
                  <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden max-w-[80px]">
                    <div className={`h-full rounded ${c.color}`} style={{ width: `${(c.value / total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <strong>Key Insight:</strong> The λ<sub>coord</sub> weight (default 5) increases
            emphasis on localization, while λ<sub>noobj</sub> (default 0.5) decreases the
            penalty for empty cells — preventing the model from predicting &ldquo;background&rdquo; everywhere.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 3. Architecture Evolution ───────── */

const YOLO_VERSIONS = [
  { name: 'YOLOv1', year: '2016', speed: '45 FPS', map: '63.4 (VOC)',
    idea: 'Single-stage detection: divide image into 7×7 grid, each cell predicts 2 boxes + class probs directly.',
    limitation: 'Poor at small objects, limited to 7×7 grid, struggles with grouped objects.' },
  { name: 'YOLOv2', year: '2017', speed: '67 FPS', map: '78.6 (VOC)',
    idea: 'Anchor boxes, batch normalization, higher resolution (416×416), darknet-19 backbone.',
    limitation: 'Still struggles with small objects, no multi-scale detection.' },
  { name: 'YOLOv3', year: '2018', speed: '45 FPS', map: '33.0 (COCO)',
    idea: 'Feature Pyramid Network (3 scales), darknet-53 backbone, logistic regression for objectness.',
    limitation: 'Slower than v2, trade-off between speed and accuracy.' },
  { name: 'YOLOv4', year: '2020', speed: '65 FPS', map: '43.5 (COCO)',
    idea: 'CSPDarknet backbone, Mish activation, Mosaic augmentation, PANet neck. Optimal speed/accuracy.',
    limitation: 'Complex training pipeline, many engineering tricks.' },
  { name: 'YOLOv5-8', year: '2020+', speed: '~100 FPS', map: '50+ (COCO)',
    idea: 'Ultralytics implementation. Focus on ease of use, export to ONNX/TensorRT, multi-scale training.',
    limitation: 'Incremental improvements over v4, architecture largely unchanged.' },
];

function YOLOEvolution() {
  const [selected, setSelected] = useState(2);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">YOLO Architecture Evolution</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        YOLO has evolved from a simple grid-based detector to a sophisticated real-time
        architecture balancing speed and accuracy.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {YOLO_VERSIONS.map((v, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-1 p-2 text-xs rounded-t text-center transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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
            <h4 className="font-semibold text-lg">{YOLO_VERSIONS[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{YOLO_VERSIONS[selected].year}</span>
          </div>
          <div className="text-right text-xs ml-4">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Speed</div>
            <div className="text-gray-600 dark:text-gray-400">{YOLO_VERSIONS[selected].speed}</div>
          </div>
          <div className="text-right text-xs ml-4">
            <div className="font-semibold text-gray-700 dark:text-gray-300">mAP</div>
            <div className="text-gray-600 dark:text-gray-400">{YOLO_VERSIONS[selected].map}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-blue-700 dark:text-blue-400">Key Idea:</span>
            <p className="text-gray-700 dark:text-gray-300 mt-0.5">{YOLO_VERSIONS[selected].idea}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-red-600 dark:text-red-400">Limitation:</span>
            <p className="text-gray-700 dark:text-gray-300 mt-0.5">{YOLO_VERSIONS[selected].limitation}</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {YOLO_VERSIONS.map((v, i) => (
          <div key={i} className={`flex-1 text-center ${i <= selected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {i > 0 && <span className="mx-1">{'—'}</span>}
            <span className={i <= selected ? 'font-semibold' : ''}>{v.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Main Component ───────── */

export default function YOLOAdvancedDive() {
  const [section, setSection] = useState<Section>('grid');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'grid', label: 'Grid Predictions', icon: '🔲' },
    { id: 'loss', label: 'Loss Function', icon: '📉' },
    { id: 'evolution', label: 'Evolution', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">YOLO Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how YOLO works under the hood — from grid cell predictions and the multi-part
          loss function to the architecture evolution across versions.
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t whitespace-nowrap transition-colors cursor-pointer ${
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
          {section === 'grid' && <GridPredictions />}
          {section === 'loss' && <YOLOLossBreakdown />}
          {section === 'evolution' && <YOLOEvolution />}
        </motion.div>
      </div>
    </div>
  );
}
