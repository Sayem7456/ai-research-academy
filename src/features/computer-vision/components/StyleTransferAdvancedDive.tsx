'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type Section = 'tradeoff' | 'gram' | 'evolution';

/* --------- helpers --------- */

function parseColor(color: string): [number, number, number] {
  const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgb) return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  return [128, 128, 128];
}

const GRID = 8;

/* --------- 1. Tradeoff Explorer --------- */

const CAT_PIXELS = (() => {
  const p: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(30));
  for (let y = 2; y <= 5; y++) for (let x = 1; x <= 6; x++) p[y][x] = 200;
  for (let y = 3; y <= 4; y++) for (let x = 3; x <= 4; x++) p[y][x] = 60;
  return p;
})();

const STYLE_HEX = ['#e11d48', '#fb923c', '#fbbf24', '#34d399', '#3b82f6'];

function styleColor(x: number, y: number): string {
  return STYLE_HEX[(x + y) % STYLE_HEX.length];
}

function blend(alpha: number, beta: number): [string[][], number, number] {
  const sw = beta / (alpha + beta);
  const cw = 1 - sw;
  const out: string[][] = [];
  let cl = 0;
  const sPix: number[][][] = [];
  const oPix: number[][][] = [];
  for (let y = 0; y < GRID; y++) {
    out[y] = [];
    sPix[y] = [];
    oPix[y] = [];
    for (let x = 0; x < GRID; x++) {
      const cv = CAT_PIXELS[y][x];
      const [sR, sG, sB] = parseColor(styleColor(x, y));
      const oR = Math.round(sR * sw + cv * cw);
      const oG = Math.round(sG * sw + cv * cw);
      const oB = Math.round(sB * sw + cv * cw);
      out[y][x] = `rgb(${oR}, ${oG}, ${oB})`;
      const lum = 0.299 * oR + 0.587 * oG + 0.114 * oB;
      cl += (cv - lum) ** 2;
      sPix[y][x] = [sR, sG, sB];
      oPix[y][x] = [oR, oG, oB];
    }
  }
  cl = Math.sqrt(cl / (GRID * GRID));
  const sGram = gramMatrix(sPix.flat());
  const oGram = gramMatrix(oPix.flat());
  let sl = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) sl += (sGram[i][j] - oGram[i][j]) ** 2;
  sl = Math.sqrt(sl / 9);
  return [out, cl, sl];
}

function gramMatrix(pixels: number[][]): number[][] {
  const G = Array.from({ length: 3 }, () => [0, 0, 0]);
  const n = pixels.length;
  for (const [r, g, b] of pixels) {
    G[0][0] += r * r; G[0][1] += r * g; G[0][2] += r * b;
    G[1][1] += g * g; G[1][2] += g * b; G[2][2] += b * b;
  }
  for (let i = 0; i < 3; i++) for (let j = i; j < 3; j++) { G[i][j] /= n; G[j][i] = G[i][j]; }
  return G;
}

const COMPARE_RATIOS = [0.0001, 0.001, 0.01, 0.1, 0.5, 1, 10];

function RefSVG({ cells, label, color }: { cells: (y: number, x: number) => string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="border rounded overflow-hidden bg-white dark:bg-gray-800" style={{ borderColor: color }}>
        <svg viewBox={`0 0 ${GRID} ${GRID}`} width={60} height={60}>
          {Array.from({ length: GRID }, (_, y) =>
            Array.from({ length: GRID }, (_, x) => (
              <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={cells(y, x)} />
            ))
          )}
        </svg>
      </div>
      <div className="text-[9px] mt-0.5 font-medium" style={{ color }}>{label}</div>
    </div>
  );
}

function TradeoffExplorer() {
  const [alpha, setAlpha] = useState(1);
  const [beta, setBeta] = useState(10000);

  const currentRatio = alpha / beta;

  const [output, cLoss, sLoss] = useMemo(() => blend(alpha, beta), [alpha, beta]);

  const ratioOutputs = useMemo(() =>
    COMPARE_RATIOS.map(r => blend(r * beta, beta)),
  [beta]);

  const closestIdx = COMPARE_RATIOS.reduce((best, r, i) =>
    Math.abs(r - currentRatio) < Math.abs(COMPARE_RATIOS[best] - currentRatio) ? i : best, 0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Content-Style Tradeoff</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The ratio &alpha;/&beta; controls how much content structure vs. style texture is preserved.
        Small &alpha;/&beta; (style-heavy) produces artistic results; large &alpha;/&beta; (content-heavy) stays close to the original.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium">&alpha; (Content): {alpha.toFixed(2)}</label>
            <input type="range" min="0.1" max="100" step="0.1" value={alpha}
              onChange={e => setAlpha(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium">&beta; (Style): {beta.toFixed(0)}</label>
            <input type="range" min="1" max="100000" step="1" value={beta}
              onChange={e => setBeta(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded text-center">
              <span className="text-gray-500">Content Loss</span>
              <div className="font-mono font-semibold text-green-700 dark:text-green-400">{cLoss.toFixed(1)}</div>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded text-center">
              <span className="text-gray-500">Style Loss</span>
              <div className="font-mono font-semibold text-purple-700 dark:text-purple-400">{sLoss.toFixed(3)}</div>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs border-l-4 border-blue-400">
            <strong>Ratio &alpha;/&beta; = </strong>
            <span className="font-mono">{currentRatio.toFixed(6)}</span>
            <div className="text-gray-600 dark:text-gray-400 mt-0.5">
              {currentRatio < 0.001 ? 'Style strongly dominates — content is barely visible.' :
               currentRatio < 0.01 ? 'Style dominates, but content subtly influences the result.' :
               currentRatio < 0.1 ? 'Style leads — both content and style contribute to the output.' :
               currentRatio < 1 ? 'Balanced — content and style are clearly visible together.' :
               currentRatio < 10 ? 'Content leads — style subtly influences the output.' :
               'Content dominates — output stays close to the original.'}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <RefSVG cells={(y, x) => `rgb(${CAT_PIXELS[y][x]}, ${CAT_PIXELS[y][x]}, ${CAT_PIXELS[y][x]})`} label="Content" color="#22c55e" />
            <RefSVG cells={(y, x) => styleColor(x, y)} label="Style" color="#a855f7" />
          </div>
          <div className="border-2 border-amber-400 rounded overflow-hidden bg-white dark:bg-gray-800">
            <svg viewBox={`0 0 ${GRID} ${GRID}`} width={120} height={120}>
              {output.map((row, y) => row.map((val, x) => (
                <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={val} />
              )))}
            </svg>
          </div>
          <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Output</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2">Compare &alpha;/&beta; Ratios</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {COMPARE_RATIOS.map((targetRatio, i) => {
            const [grid] = ratioOutputs[i];
            const isActive = i === closestIdx;
            return (
              <div key={i} className={`flex flex-col items-center flex-shrink-0 p-1 rounded transition-colors ${isActive ? 'bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-400' : ''}`}>
                <div className={`rounded overflow-hidden bg-white dark:bg-gray-800 ${isActive ? 'ring-2 ring-amber-500' : 'border border-gray-300 dark:border-gray-600'}`}>
                  <svg viewBox={`0 0 ${GRID} ${GRID}`} width={80} height={80}>
                    {grid.map((row, y) => row.map((val, x) => (
                      <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={val} />
                    )))}
                  </svg>
                </div>
                <div className="text-[9px] text-center mt-0.5">
                  <span className="font-mono text-gray-600 dark:text-gray-400">&alpha;/&beta;={targetRatio}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
          Grid shows fixed &alpha;/&beta; ratios (highlighted = current setting). &beta; is kept constant &mdash; &alpha; varies to achieve each ratio.
        </div>
      </div>
    </div>
  );
}

/* --------- 2. Gram Matrix Visualizer --------- */

const PATTERNS = [
  { name: 'Mosaic', get: (x: number, y: number) => STYLE_HEX[(x + y) % STYLE_HEX.length] },
  { name: 'Stripes', get: (x: number, _y: number) => {
    void _y; return x % 2 === 0 ? '#3b82f6' : '#fbbf24';
  }},
  { name: 'Checker', get: (x: number, y: number) => (x + y) % 2 === 0 ? '#e11d48' : '#34d399' },
  { name: 'Gradient', get: (x: number, _y: number) => {
    void _y; const v = Math.round((x / (GRID - 1)) * 255);
    return `rgb(${v}, ${Math.round(v * 0.5)}, ${Math.round(255 - v)})`;
  }},
  { name: 'Cat Gray', get: (x: number, y: number) => {
    const val = CAT_PIXELS[y]?.[x] ?? 128;
    return `rgb(${val}, ${val}, ${val})`;
  }},
  { name: 'RB Checker', get: (x: number, y: number) => (x + y) % 2 === 0 ? '#e11d48' : '#3b82f6' },
  { name: 'RB Stripes', get: (x: number, _y: number) => {
    void _y; return x % 2 === 0 ? '#e11d48' : '#3b82f6';
  }},
];

const GRAM_LABELS = [
  ['R\u00d7R', 'R\u00d7G', 'R\u00d7B'],
  ['G\u00d7R', 'G\u00d7G', 'G\u00d7B'],
  ['B\u00d7R', 'B\u00d7G', 'B\u00d7B'],
];

const GRAM_DESCRIPTIONS: Record<string, string> = {
  'R\u00d7R': 'Red energy / variance',
  'R\u00d7G': 'Red-Green correlation',
  'R\u00d7B': 'Red-Blue correlation',
  'G\u00d7G': 'Green energy / variance',
  'G\u00d7B': 'Green-Blue correlation',
  'B\u00d7B': 'Blue energy / variance',
};

function contentLoss(a: number[][], b: number[][]): number {
  let loss = 0;
  for (let i = 0; i < a.length; i++) {
    const dr = a[i][0] - b[i][0];
    const dg = a[i][1] - b[i][1];
    const db = a[i][2] - b[i][2];
    loss += dr * dr + dg * dg + db * db;
  }
  return Math.sqrt(loss / (a.length * 3));
}

function GramHeatmap({ G, maxVal }: { G: number[][]; maxVal: number }) {
  return (
    <svg viewBox="0 0 150 150" className="w-full max-w-[160px]">
      {[0, 1, 2].map(i => [0, 1, 2].map(j => {
        const v = G[i][j];
        const norm = maxVal > 0 ? v / maxVal : 0;
        const t = Math.abs(norm);
        let fill: string;
        if (norm >= 0) {
          fill = `rgb(255, ${Math.round(255 * (1 - t))}, ${Math.round(255 * (1 - t))})`;
        } else {
          fill = `rgb(${Math.round(255 * (1 - t))}, ${Math.round(255 * (1 - t))}, 255)`;
        }
        const formatted = Math.abs(v) < 0.05 ? '0' : (v >= 10 ? v.toFixed(0) : v.toFixed(1));
        const textBright = 0.299 * (norm >= 0 ? 255 : 255 * (1 - t))
          + 0.587 * (norm >= 0 ? 255 * (1 - t) : 255 * (1 - t))
          + 0.114 * (norm >= 0 ? 255 * (1 - t) : 255);
        return (
          <g key={`${i}-${j}`}>
            <rect x={j * 50 + 1} y={i * 50 + 1} width={48} height={48}
              rx={4} fill={fill} stroke="#94a3b8" strokeWidth={0.5} />
            <text x={j * 50 + 25} y={i * 50 + 20} textAnchor="middle" fontSize="9"
              fill={textBright > 128 ? '#374151' : 'white'} className="font-mono font-semibold">
              {GRAM_LABELS[i][j]}
            </text>
            <text x={j * 50 + 25} y={i * 50 + 35} textAnchor="middle" fontSize="8"
              fill={textBright > 128 ? '#6b7280' : 'rgba(255,255,255,0.85)'} className="font-mono">
              {formatted}
            </text>
          </g>
        );
      }))}
    </svg>
  );
}

function GramMatrixVisualizer() {
  const [patternA, setPatternA] = useState(0);
  const [patternB, setPatternB] = useState(1);

  const pixelsA = useMemo(() =>
    Array.from({ length: GRID * GRID }, (_, i) =>
      parseColor(PATTERNS[patternA].get(i % GRID, Math.floor(i / GRID)))
    ), [patternA]);
  const pixelsB = useMemo(() =>
    Array.from({ length: GRID * GRID }, (_, i) =>
      parseColor(PATTERNS[patternB].get(i % GRID, Math.floor(i / GRID)))
    ), [patternB]);

  const gramA = useMemo(() => gramMatrix(pixelsA), [pixelsA]);
  const gramB = useMemo(() => gramMatrix(pixelsB), [pixelsB]);

  const allVals = [...gramA.flat(), ...gramB.flat()];
  const maxVal = Math.max(...allVals.map(Math.abs), 1);

  const gLoss = useMemo(() => {
    let loss = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) loss += (gramA[i][j] - gramB[i][j]) ** 2;
    return Math.sqrt(loss / 9);
  }, [gramA, gramB]);

  const cLoss = useMemo(() => contentLoss(pixelsA, pixelsB), [pixelsA, pixelsB]);

  const sameColors = gLoss < 50 && cLoss > 50;

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Gram Matrix &amp; Style Representation</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The Gram matrix captures channel-wise correlations, discarding spatial layout.
        Two patterns with different arrangements can have nearly identical Gram matrices if their
        color statistics match — this is why Gram loss captures &quot;style&quot; not &quot;content&quot;.
      </p>

      <motion.div key={`cards-${patternA}-${patternB}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(side => {
          const isA = side === 0;
          const idx = isA ? patternA : patternB;
          const setIdx = isA ? setPatternA : setPatternB;
          const gram = isA ? gramA : gramB;
          return (
            <div key={side} className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-semibold">Pattern {isA ? 'A' : 'B'}</h4>
                <select value={idx} onChange={e => setIdx(parseInt(e.target.value))}
                  className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1">
                  {PATTERNS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white dark:bg-gray-800 w-full max-w-[160px]">
                    <svg viewBox={`0 0 ${GRID} ${GRID}`} className="w-full block">
                      {Array.from({ length: GRID }).map((_, y) =>
                        Array.from({ length: GRID }).map((_, x) => (
                          <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1}
                            fill={PATTERNS[idx].get(x, y)} />
                        ))
                      )}
                    </svg>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Pattern {isA ? 'A' : 'B'} (8 &times; 8)
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <GramHeatmap G={gram} maxVal={maxVal} />
                  <div className="text-[10px] text-gray-500 mt-1">
                    Gram Matrix (3 &times; 3)
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                G_ij = (1/N) &times; &sum;(channel<sub>i</sub> &times; channel<sub>j</sub>)
                &mdash; discards spatial layout
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Loss comparison */}
      <motion.div key={`loss-${patternA}-${patternB}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
        className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border-l-4 text-xs ${gLoss < 500 ? 'bg-green-50 dark:bg-green-950/30 border-green-400' : 'bg-red-50 dark:bg-red-950/30 border-red-400'}`}>
          <div className="font-semibold mb-1">Gram Loss (A vs B): {gLoss.toFixed(0)}</div>
          <div className="text-gray-600 dark:text-gray-400 text-[11px]">
            {gLoss < 100 ? 'Very similar style — patterns share color statistics.' :
             gLoss < 500 ? 'Moderately different style — some color statistics differ.' :
             'Different style — color distributions are distinct.'}
          </div>
        </div>
        <div className={`p-3 rounded-lg border-l-4 text-xs ${cLoss < 50 ? 'bg-green-50 dark:bg-green-950/30 border-green-400' : 'bg-red-50 dark:bg-red-950/30 border-red-400'}`}>
          <div className="font-semibold mb-1">Content Loss (A vs B): {cLoss.toFixed(0)}</div>
          <div className="text-gray-600 dark:text-gray-400 text-[11px]">
            {cLoss < 20 ? 'Nearly identical content — spatial arrangement is the same.' :
             cLoss < 80 ? 'Moderate content difference — spatial structure differs.' :
             'Different content — spatial arrangements are distinct.'}
          </div>
        </div>
      </motion.div>

      {sameColors && (
        <motion.div key="same-colors-banner" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="mt-3 p-3 rounded-lg border border-green-300 dark:border-green-700 text-xs bg-green-50 dark:bg-green-950/30">
          <span className="font-semibold text-green-700 dark:text-green-400">Same colors, different arrangement! </span>
          <span className="text-gray-700 dark:text-gray-300">
            Both patterns use identical color sets (same RGB values), just placed differently.
            Gram loss is low because Gram matrices only care about color statistics, not where
            colors are located. Content loss is high because the spatial layout differs.
          </span>
        </motion.div>
      )}

      {/* Gram entry reference */}
      <details className="mt-4 group">
        <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          What does each Gram entry mean?
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-gray-600 dark:text-gray-400">
          {Object.entries(GRAM_DESCRIPTIONS).map(([key, desc]) => (
            <div key={key} className="flex items-center gap-1.5 p-1">
              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 w-10 text-center">{key}</span>
              <span>= {desc}</span>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
        <strong>Key Insight:</strong> Try selecting &quot;RB Checker&quot; for Pattern A and &quot;RB Stripes&quot; for Pattern B.
        They use <em>identical colors</em> in different arrangements &mdash; Gram loss is near zero
        (same style) but content loss is high (different spatial layout). Swap between Stripes/Checker
        pairs to see how Gram matrices change with color statistics, not arrangement.
      </div>
    </div>
  );
}

/* --------- 3. Evolution --------- */

const MILESTONES = [
  { name: 'Neural Style Transfer', year: '2015', venue: 'CVPR 2016', ref: 'Gatys et al.',
    idea: 'Pioneered artistic style transfer using VGG feature activations (content) and Gram matrices (style). Optimized output directly with L-BFGS.',
    impact: 'Founded the field of neural style transfer. Showed that CNNs learn separable content and style representations.' },
  { name: 'Perceptual Losses', year: '2016', venue: 'ECCV 2016', ref: 'Johnson et al.',
    idea: 'Replaced iterative optimization with a feed-forward network trained on perceptual losses (content + style + pixel). Real-time style transfer.',
    impact: '1000x speedup over Gatys et al. Enabled real-time video style transfer. Inspired many follow-up feed-forward methods.' },
  { name: 'AdaIN', year: '2017', venue: 'ICCV 2017', ref: 'Huang & Belongie',
    idea: 'Adaptive Instance Normalization: aligns the mean/variance of content features to match style features. Arbitrary style transfer in a single network.',
    impact: 'First truly arbitrary style transfer — one network, any style. Elegant and fast. Inspired later normalization-based approaches.' },
  { name: 'WCT', year: '2017', venue: 'CVPR 2017', ref: 'Li et al.',
    idea: 'Whitening and Coloring Transform. Whitens content features (removes style), then colors them with style statistics via Cholesky decomposition.',
    impact: 'Showed style transfer can be done via linear transforms in feature space. Mathematically elegant approach.' },
  { name: 'StyleGAN', year: '2018', venue: 'CVPR 2019', ref: 'Karras et al.',
    idea: 'Style-based generator with mapping network + AdaIN. Style mixing and stochastic variation enable disentangled control over generated images.',
    impact: 'While not a style transfer method, its style-based architecture revolutionized controllable generation and inspired style transfer research.' },
  { name: 'CLIP+Diffusion', year: '2022', venue: 'NeurIPS 2022', ref: 'Rombach et al.',
    idea: 'Text-guided style transfer using diffusion models and CLIP embeddings. Any style described in text can be applied without example images.',
    impact: 'Paradigm shift: from example-based to text-guided style transfer. Enabled by large-scale pretrained models.' },
];

function Evolution() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Evolution of Style Transfer</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        From iterative optimization to real-time feed-forward networks and text-guided diffusion —
        style transfer has evolved dramatically in just a few years.
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

export default function StyleTransferAdvancedDive() {
  const [section, setSection] = useState<Section>('tradeoff');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'tradeoff', label: 'Tradeoff Explorer', icon: '\u2696\ufe0f' },
    { id: 'gram', label: 'Gram Matrix', icon: '\U0001f9e9' },
    { id: 'evolution', label: 'Evolution', icon: '\U0001f4dc' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Style Transfer Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore the content-style tradeoff, how Gram matrices capture style, and the evolution
          of style transfer from 2015 to the diffusion era.
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
          {section === 'tradeoff' && <TradeoffExplorer />}
          {section === 'gram' && <GramMatrixVisualizer />}
          {section === 'evolution' && <Evolution />}
        </motion.div>
      </div>
    </div>
  );
}
