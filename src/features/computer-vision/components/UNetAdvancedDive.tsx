'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

type Section = 'skip' | 'weight' | 'augment' | 'variants';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/* ───────── 1. Skip Connection Explorer ───────── */

function SkipConnectionExplorer() {
  const [level, setLevel] = useState(0);
  const [showConcat, setShowConcat] = useState(true);

  const levels = [
    { name: 'Level 1', encSize: 568, encCh: 64, decSize: 532, decCh: 64, info: 'Fine spatial details (edges, textures)' },
    { name: 'Level 2', encSize: 280, encCh: 128, decSize: 268, decCh: 128, info: 'Mid-level features (shapes, patterns)' },
  ];

  const l = levels[level];
  const gridSize = 8;
  const cellPx = 28;

  const encFeatures = useMemo(() => {
    const f: number[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < gridSize; x++) {
        const edge = Math.abs(seededRandom(x * 7 + y * 13 + level * 31) - 0.5) * 255;
        row.push(Math.round(Math.min(255, edge + 50)));
      }
      f.push(row);
    }
    return f;
  }, [level, gridSize]);

  const decFeatures = useMemo(() => {
    const f: number[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: number[] = [];
      for (let x = 0; x < gridSize; x++) {
        const shape = 200 - Math.abs(x - 3.5) * 20 - Math.abs(y - 3.5) * 20;
        row.push(Math.round(Math.max(0, Math.min(255, shape + seededRandom(x * 11 + y * 17 + level * 23) * 30))));
      }
      f.push(row);
    }
    return f;
  }, [level, gridSize]);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Skip Connection Explorer</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Skip connections concatenate high-resolution encoder features with upsampled decoder features,
        preserving spatial detail lost during downsampling.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="flex gap-2">
          {levels.map((l, i) => (
            <button key={i} onClick={() => setLevel(i)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                level === i ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
              {l.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input type="checkbox" checked={showConcat} onChange={e => setShowConcat(e.target.checked)} />
          Show Concatenation
        </label>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Encoder feature map */}
        <div className="text-center">
          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Encoder {l.encSize}×{l.encSize}×{l.encCh}</div>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)` }}>
            {encFeatures.map((row, y) =>
              row.map((val, x) => (
                <div key={`e${y}-${x}`} style={{
                  width: cellPx, height: cellPx,
                  backgroundColor: `rgb(${val}, ${Math.round(val * 0.7)}, ${Math.round(255 - val)})`,
                }} />
              ))
            )}
          </div>
        </div>

        {/* Arrow + concat */}
        <div className="flex flex-col items-center gap-1">
          <motion.div animate={{ x: showConcat ? 0 : -8 }} className="text-2xl text-emerald-500">→</motion.div>
          {showConcat && (
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded border border-emerald-300">
              Concat
            </div>
          )}
        </div>

        {/* Decoder feature map */}
        <div className="text-center">
          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Decoder {l.decSize}×{l.decSize}×{l.decCh}</div>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)` }}>
            {decFeatures.map((row, y) =>
              row.map((val, x) => (
                <div key={`d${y}-${x}`} style={{
                  width: cellPx, height: cellPx,
                  backgroundColor: `rgb(${Math.round(val * 0.3)}, ${val}, ${Math.round(255 - val)})`,
                }} />
              ))
            )}
          </div>
        </div>

        {/* Concatenated result */}
        {showConcat && (
          <>
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl text-emerald-500">→</div>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded border border-emerald-300">
                {l.encCh + l.decCh}ch
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">Concat {l.encCh}+{l.decCh}ch</div>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)` }}>
                {encFeatures.map((row, y) =>
                  row.map((val, x) => {
                    const dv = decFeatures[y][x];
                    return (
                      <div key={`c${y}-${x}`} style={{
                        width: cellPx, height: cellPx,
                        backgroundColor: `rgb(${Math.round((val + dv * 0.3) / 2)}, ${Math.round((val * 0.7 + dv) / 2)}, ${Math.round((255 - val + 255 - dv * 0.3) / 2)})`,
                      }} />
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400 text-xs">
        <h4 className="font-semibold mb-1">{l.name}</h4>
        <p className="text-gray-700 dark:text-gray-300">{l.info}</p>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Without skip connections, the decoder would have to reconstruct spatial detail from
          the bottleneck alone — leading to blurry or imprecise segmentations.
        </p>
      </div>
    </div>
  );
}

/* ───────── 2. Weight Map Explorer ───────── */

function WeightMapExplorer() {
  const [sigma, setSigma] = useState(5);
  const [showWeightMap, setShowWeightMap] = useState(true);

  const cells = 20;
  const cellPx = 18;

  const objects = [
    { cx: 6, cy: 7, label: 'Cell 1' },
    { cx: 13, cy: 9, label: 'Cell 2' },
    { cx: 10, cy: 16, label: 'Cell 3' },
  ];

  const weightMap = useMemo(() => {
    const map: number[][] = [];
    for (let y = 0; y < cells; y++) {
      const row: number[] = [];
      for (let x = 0; x < cells; x++) {
        let minDist = Infinity;
        for (const obj of objects) {
          const d = Math.sqrt((x - obj.cx) ** 2 + (y - obj.cy) ** 2);
          minDist = Math.min(minDist, d);
        }
        const w = 1 + 10 * Math.exp(-(minDist * minDist) / (2 * sigma * sigma));
        row.push(Math.min(255, Math.round(w * 25)));
      }
      map.push(row);
    }
    return map;
  }, [sigma]);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Weight Map &amp; Loss</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        U-Net uses a pre-computed weight map to force the model to learn borders between
        touching objects. Higher weights are assigned to pixels near object boundaries.
      </p>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div>
          <div className="grid gap-px mb-2" style={{ gridTemplateColumns: `repeat(${cells}, ${cellPx}px)` }}>
            {Array.from({ length: cells }).map((_, y) =>
              Array.from({ length: cells }).map((_, x) => {
                const w = weightMap[y]?.[x] ?? 0;
                const isObj = objects.some(o => Math.abs(o.cx - x) < 1.5 && Math.abs(o.cy - y) < 1.5);
                const isBorder = objects.some(o => {
                  const d = Math.sqrt((x - o.cx) ** 2 + (y - o.cy) ** 2);
                  return d > 1.5 && d < 4;
                });
                return (
                  <div key={`${y}-${x}`} style={{
                    width: cellPx, height: cellPx,
                    backgroundColor: showWeightMap
                      ? `rgb(${Math.min(255, w + 40)}, ${Math.max(0, 255 - w)}, ${Math.max(0, 200 - w)})`
                      : isObj ? '#22c55e' : isBorder ? '#ef4444' : '#f3f4f6',
                    border: isObj ? '1px solid #059669' : isBorder ? '1px solid #dc2626' : '1px solid #e5e7eb',
                  }}>
                    {isObj && <div className="text-[6px] text-white font-semibold text-center leading-[18px]">{objects.findIndex(o => Math.abs(o.cx - x) < 1.5 && Math.abs(o.cy - y) < 1.5) + 1}</div>}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-4 items-center">
            <label className="text-xs font-medium">σ (border width): {sigma}</label>
            <input type="range" min="1" max="15" step="0.5" value={sigma}
              onChange={e => setSigma(parseFloat(e.target.value))} className="w-24" />
            <label className="flex items-center gap-1 text-xs cursor-pointer ml-2">
              <input type="checkbox" checked={showWeightMap} onChange={e => setShowWeightMap(e.target.checked)} />
              Show Weights
            </label>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Loss Function</h4>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300">
              L = Σ w(x) · log(p<sub>ℓ(x)</sub>(x))
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              w(x): weight map · p<sub>ℓ</sub>(x): predicted probability for true label ℓ
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Weight Formula</h4>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300">
              w(x) = w<sub>c</sub>(x) + w<sub>0</sub> · exp(-d² / 2σ²)
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              d: distance to nearest cell border · w<sub>0</sub>: 10 (default) · σ: {sigma}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <strong>Why weight maps?</strong> In biomedical images, cells often touch.
            The weight map gives ~10× higher weight to boundary pixels, forcing the network
            to learn separation between touching objects.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 3. Data Augmentation Explorer ───────── */

function AugmentationExplorer() {
  const [alpha, setAlpha] = useState(30);
  const [sigma, setSigma] = useState(8);

  const gridSize = 16;
  const cellPx = 20;

  const displacement = useMemo(() => {
    const grid: { dx: number; dy: number }[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: { dx: number; dy: number }[] = [];
      for (let x = 0; x < gridSize; x++) {
        const dx = alpha * (2 * seededRandom(x * 7 + y * 13) - 1);
        const dy = alpha * (2 * seededRandom(x * 11 + y * 17) - 1);
        row.push({ dx, dy });
      }
      grid.push(row);
    }
    return grid;
  }, [alpha, sigma, gridSize]);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Elastic Deformation</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        U-Net heavily uses data augmentation, especially elastic deformation, which is
        critical for learning invariance to the natural variability in biological tissues.
      </p>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div>
          <div className="relative overflow-hidden rounded border border-gray-300 dark:border-gray-600 mb-3"
            style={{ width: gridSize * cellPx, height: gridSize * cellPx }}>
            {/* Grid under deformation */}
            <svg width={gridSize * cellPx} height={gridSize * cellPx} className="absolute inset-0">
              {displacement.map((row, y) =>
                row.map((cell, x) => {
                  const cx = x * cellPx + cellPx / 2 + cell.dx;
                  const cy = y * cellPx + cellPx / 2 + cell.dy;
                  return (
                    <g key={`${y}-${x}`}>
                      {/* Horizontal line */}
                      {y < gridSize - 1 && (
                        <line x1={cx} y1={cy}
                          x2={(x) * cellPx + cellPx / 2 + displacement[y + 1][x].dx}
                          y2={(y + 1) * cellPx + cellPx / 2 + displacement[y + 1][x].dy}
                          stroke="#94a3b8" strokeWidth={0.5} />
                      )}
                      {/* Vertical line */}
                      {x < gridSize - 1 && (
                        <line x1={cx} y1={cy}
                          x2={(x + 1) * cellPx + cellPx / 2 + displacement[y][x + 1].dx}
                          y2={y * cellPx + cellPx / 2 + displacement[y][x + 1].dy}
                          stroke="#94a3b8" strokeWidth={0.5} />
                      )}
                    </g>
                  );
                })
              )}
            </svg>

            {/* Cell colors */}
            {displacement.map((row, y) =>
              row.map((cell, x) => {
                const intensity = Math.round(100 + seededRandom(x * 3 + y * 5) * 155);
                return (
                  <div key={`${y}-${x}`} className="absolute"
                    style={{
                      left: x * cellPx + cell.dx, top: y * cellPx + cell.dy,
                      width: cellPx, height: cellPx,
                      backgroundColor: `rgb(${intensity}, ${Math.round(intensity * 0.5)}, ${Math.round(255 - intensity)})`,
                      opacity: 0.7,
                      pointerEvents: 'none',
                    }} />
                );
              })
            )}
          </div>

          <div className="flex gap-4 mt-3">
            <div>
              <label className="text-xs font-medium">α (intensity): {alpha}</label>
              <input type="range" min="5" max="60" step="1" value={alpha}
                onChange={e => setAlpha(parseInt(e.target.value))} className="w-24 ml-1" />
            </div>
            <div>
              <label className="text-xs font-medium">σ (smoothness): {sigma}</label>
              <input type="range" min="2" max="16" step="1" value={sigma}
                onChange={e => setSigma(parseInt(e.target.value))} className="w-24 ml-1" />
            </div>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Why Elastic Deformation?</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Medical images have high natural variability — organs shift, tissues stretch,
              and cells deform. Elastic augmentation teaches the model to be invariant to
              these non-rigid transformations.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">U-Net Augmentation Pipeline</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Elastic deformation (α={alpha}, σ={sigma})</li>
              <li>Random rotation (±30°)</li>
              <li>Random scaling (0.85–1.15)</li>
              <li>Random shear (±10°)</li>
              <li>Random intensity shift (±10%)</li>
              <li>Horizontal flipping</li>
            </ul>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400 text-xs">
            <strong>Key Insight:</strong> The original U-Net was trained on only 30 annotated
            microscopy images. Aggressive data augmentation made it possible to achieve
            state-of-the-art results with minimal labeled data.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 4. U-Net Variants ───────── */

const VARIANTS = [
  { name: 'U-Net (2015)', year: '2015', application: 'Biomedical segmentation',
    idea: 'Original symmetric encoder-decoder with skip connections for precise localization.',
    change: 'Baseline architecture' },
  { name: '3D U-Net', year: '2016', application: 'Volumetric medical data (CT, MRI)',
    idea: 'Extends U-Net to 3D convolutions for processing volumetric data with 3D skip connections.',
    change: '2D → 3D convolutions' },
  { name: 'Attention U-Net', year: '2018', application: 'Pancreas, medical imaging',
    idea: 'Adds attention gates to skip connections, suppressing irrelevant features and highlighting salient regions.',
    change: 'Attention gates on skips' },
  { name: 'UNet++', year: '2018', application: 'Medical image segmentation',
    idea: 'Redesigned with nested skip pathways and deep supervision for better gradient flow.',
    change: 'Nested skip pathways' },
  { name: 'nnU-Net', year: '2020', application: 'General medical segmentation',
    idea: 'Self-configuring framework that automatically adapts U-Net architecture to any dataset.',
    change: 'Automated configuration' },
];

function UNetVariants() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">U-Net Variants</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Since its introduction, U-Net has inspired numerous variants that extend its core
        encoder-decoder + skip connection design to new domains and use cases.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {VARIANTS.map((v, i) => (
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
        className="p-4 rounded-lg border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{VARIANTS[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{VARIANTS[selected].year} · {VARIANTS[selected].application}</span>
          </div>
          <div className="text-right text-xs ml-4">
            <div className="font-semibold text-gray-700 dark:text-gray-300">Key Change</div>
            <div className="text-gray-600 dark:text-gray-400 max-w-[160px]">{VARIANTS[selected].change}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-xs">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Key Idea:</span>
          <p className="text-gray-700 dark:text-gray-300 mt-0.5">{VARIANTS[selected].idea}</p>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {VARIANTS.map((v, i) => (
          <div key={i} className={`flex-1 text-center ${i <= selected ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
            {i > 0 && <span className="mx-1">{'—'}</span>}
            <span className={i <= selected ? 'font-semibold' : ''}>{v.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Main Component ───────── */

export default function UNetAdvancedDive() {
  const [section, setSection] = useState<Section>('skip');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'skip', label: 'Skip Connection Explorer', icon: '🔗' },
    { id: 'weight', label: 'Weight Map & Loss', icon: '⚖️' },
    { id: 'augment', label: 'Elastic Deformation', icon: '🌀' },
    { id: 'variants', label: 'U-Net Variants', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">U-Net Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore U-Net's key innovations — from skip connections and weight maps to elastic
          deformation augmentation and the evolution of its architecture.
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
          {section === 'skip' && <SkipConnectionExplorer />}
          {section === 'weight' && <WeightMapExplorer />}
          {section === 'augment' && <AugmentationExplorer />}
          {section === 'variants' && <UNetVariants />}
        </motion.div>
      </div>
    </div>
  );
}
