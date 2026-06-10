'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

type PatternId = 'gradient' | 'step-edge' | 'checkerboard' | 'spot' | 'constant' | 'noise';

const PATTERNS: Record<PatternId, number[][]> = {
  gradient: (() => {
    const m: number[][] = [];
    for (let i = 0; i < 8; i++) {
      m[i] = [];
      for (let j = 0; j < 8; j++) {
        m[i][j] = Math.round((i * 32 + j * 8) / 1.5);
      }
    }
    return m;
  })(),
  'step-edge': (() => {
    const m: number[][] = [];
    for (let i = 0; i < 8; i++) {
      m[i] = [];
      for (let j = 0; j < 8; j++) {
        m[i][j] = j < 4 ? 50 : 200;
      }
    }
    return m;
  })(),
  checkerboard: (() => {
    const m: number[][] = [];
    for (let i = 0; i < 8; i++) {
      m[i] = [];
      for (let j = 0; j < 8; j++) {
        m[i][j] = (Math.floor(i / 2) + Math.floor(j / 2)) % 2 === 0 ? 50 : 200;
      }
    }
    return m;
  })(),
  spot: (() => {
    const m: number[][] = [];
    for (let i = 0; i < 8; i++) {
      m[i] = [];
      for (let j = 0; j < 8; j++) {
        m[i][j] = (i >= 2 && i <= 5 && j >= 2 && j <= 5) ? 220 : 30;
      }
    }
    return m;
  })(),
  constant: (() => {
    const m: number[][] = [];
    for (let i = 0; i < 8; i++) {
      m[i] = new Array(8).fill(128);
    }
    return m;
  })(),
  noise: (() => {
    const m: number[][] = [];
    for (let i = 0; i < 8; i++) {
      m[i] = [];
      for (let j = 0; j < 8; j++) {
        m[i][j] = Math.round(Math.random() * 255);
      }
    }
    return m;
  })(),
};

const PRESET_KERNELS: Record<string, number[][]> = {
  'Edge Detect': [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  'Box Blur': [
    [1/9, 1/9, 1/9],
    [1/9, 1/9, 1/9],
    [1/9, 1/9, 1/9],
  ],
  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  'Sobel X': [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  'Sobel Y': [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ],
  'Gauss Blur': [
    [1/16, 2/16, 1/16],
    [2/16, 4/16, 2/16],
    [1/16, 2/16, 1/16],
  ],
  Emboss: [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ],
  Identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
};

function conv2D(
  input: number[][],
  kernel: number[][],
  stride: number,
  padding: number,
  dilation: number,
  clamp: boolean,
): number[][] {
  const kSize = kernel.length;
  const effK = kSize + (kSize - 1) * (dilation - 1);
  const padded = padding > 0
    ? Array(input.length + 2 * padding).fill(0).map(() => Array(input[0].length + 2 * padding).fill(0))
    : input.map(r => [...r]);
  if (padding > 0) {
    for (let i = 0; i < input.length; i++)
      for (let j = 0; j < input[0].length; j++)
        padded[i + padding][j + padding] = input[i][j];
  }
  const pH = padded.length;
  const pW = padded[0].length;
  const outH = Math.floor((pH - effK) / stride) + 1;
  const outW = Math.floor((pW - effK) / stride) + 1;
  if (outH <= 0 || outW <= 0) return [];
  const output: number[][] = Array(outH).fill(0).map(() => Array(outW).fill(0));
  for (let i = 0; i < outH; i++) {
    for (let j = 0; j < outW; j++) {
      let sum = 0;
      for (let ki = 0; ki < kSize; ki++)
        for (let kj = 0; kj < kSize; kj++)
          sum += padded[i * stride + ki * dilation][j * stride + kj * dilation] * kernel[ki][kj];
      output[i][j] = clamp ? Math.round(Math.max(0, Math.min(255, sum))) : Math.round(sum);
    }
  }
  return output;
}

function computeOutputStats(output: number[][]): { min: number; max: number; mean: number; std: number; hist: number[] } {
  const flat = output.flat();
  if (flat.length === 0) return { min: 0, max: 0, mean: 0, std: 0, hist: [] };
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const mean = flat.reduce((s, v) => s + v, 0) / flat.length;
  const variance = flat.reduce((s, v) => s + (v - mean) ** 2, 0) / flat.length;
  const std = Math.sqrt(variance);
  const range = max - min || 1;
  const bins = 8;
  const hist = new Array(bins).fill(0);
  for (const v of flat) {
    const idx = Math.min(bins - 1, Math.floor(((v - min) / range) * bins));
    hist[idx]++;
  }
  return { min, max, mean: Math.round(mean * 10) / 10, std: Math.round(std * 10) / 10, hist };
}

export default function ConvolutionExplorer() {
  const [selectedPreset, setSelectedPreset] = useState<string>('Edge Detect');
  const [customKernel, setCustomKernel] = useState<number[][]>(PRESET_KERNELS['Edge Detect'].map(r => [...r]));
  const [kernelMode, setKernelMode] = useState<'preset' | 'custom'>('preset');
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(0);
  const [dilation, setDilation] = useState(1);
  const [clamp, setClamp] = useState(true);
  const [pattern, setPattern] = useState<PatternId>('gradient');
  const [input, setInput] = useState<number[][]>(PATTERNS.gradient.map(r => [...r]));
  const [animSpeed, setAnimSpeed] = useState(400);

  const [animRow, setAnimRow] = useState<number | null>(null);
  const [animCol, setAnimCol] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedOutput, setSelectedOutput] = useState<{ r: number; c: number } | null>(null);

  const kernel = useMemo(() => {
    return kernelMode === 'preset'
      ? PRESET_KERNELS[selectedPreset]?.map(r => [...r]) ?? customKernel
      : customKernel;
  }, [kernelMode, selectedPreset, customKernel]);

  const effK = kernel.length + (kernel.length - 1) * (dilation - 1);

  const output = useMemo(
    () => conv2D(input, kernel, stride, padding, dilation, clamp),
    [input, kernel, stride, padding, dilation, clamp],
  );
  const outH = output.length;
  const outW = output.length > 0 ? output[0].length : 0;
  const totalSteps = outH * outW;

  const stats = useMemo(() => computeOutputStats(output), [output]);

  const stopPlaying = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsPlaying(false);
    setAnimRow(null);
    setAnimCol(null);
  }, []);

  const startPlaying = useCallback(() => {
    if (totalSteps === 0) return;
    setIsPlaying(true);
    setAnimRow(0);
    setAnimCol(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) { stopPlaying(); return; }
      setAnimRow(Math.floor(step / outW));
      setAnimCol(step % outW);
    }, animSpeed);
  }, [outH, outW, totalSteps, animSpeed, stopPlaying]);

  useEffect(() => { return () => stopPlaying(); }, [stopPlaying]);

  const setPreset = (name: string) => {
    setSelectedPreset(name);
    setKernelMode('preset');
    setCustomKernel(PRESET_KERNELS[name].map(r => [...r]));
    stopPlaying();
  };

  const setInputPattern = (id: PatternId) => {
    setPattern(id);
    setInput(PATTERNS[id].map(r => [...r]));
    stopPlaying();
  };

  const editInputCell = (r: number, c: number, val: number) => {
    const next = input.map(row => [...row]);
    next[r][c] = Math.round(Math.max(0, Math.min(255, val)));
    setInput(next);
    setPattern('constant');
  };

  const editKernelCell = (r: number, c: number, val: number) => {
    const next = kernel.map(row => [...row]);
    next[r][c] = val;
    setCustomKernel(next);
    setKernelMode('custom');
    stopPlaying();
  };

  const clickOutput = (r: number, c: number) => {
    setSelectedOutput(prev => (prev?.r === r && prev?.c === c) ? null : { r, c });
  };

  const selectedComputation = useMemo(() => {
    if (!selectedOutput) return null;
    const { r, c } = selectedOutput;
    const kSize = kernel.length;
    const terms: { iv: number; kv: number }[] = [];
    let sum = 0;
    for (let ki = 0; ki < kSize; ki++) {
      for (let kj = 0; kj < kSize; kj++) {
        const iIdx = r * stride + ki * dilation;
        const jIdx = c * stride + kj * dilation;
        const iv = padding > 0
          ? (input[iIdx - padding]?.[jIdx - padding] ?? 0)
          : (input[iIdx]?.[jIdx] ?? 0);
        const kv = kernel[ki][kj];
        terms.push({ iv, kv });
        sum += iv * kv;
      }
    }
    const clamped = clamp ? Math.round(Math.max(0, Math.min(255, sum))) : Math.round(sum);
    return { r, c, terms, sum, clamped };
  }, [selectedOutput, input, kernel, stride, padding, dilation, clamp]);

  const toGrayscale = (val: number) => {
    const g = Math.round(Math.max(0, Math.min(255, val)));
    return `rgb(${g},${g},${g})`;
  };

  const inSize = input.length;
  const kSize = kernel.length;
  const windowStartR = animRow !== null ? animRow * stride : -1;
  const windowStartC = animCol !== null ? animCol * stride : -1;

  const dimFormula = `(${inSize} - ${effK} + 2×${padding}) / ${stride} + 1 = ${outH}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-1">Convolution Explorer</h2>
        <p className="text-gray-500 text-sm mb-6">
          Edit the input grid, design your own kernel, adjust stride/padding/dilation — see
          exactly how convolution transforms one grid into another.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Input Pattern</label>
            <select value={pattern} onChange={e => setInputPattern(e.target.value as PatternId)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
              <option value="gradient">Gradient</option>
              <option value="step-edge">Step Edge</option>
              <option value="checkerboard">Checkerboard</option>
              <option value="spot">Spot</option>
              <option value="constant">Constant</option>
              <option value="noise">Random Noise</option>
            </select>
            <div className="text-[10px] text-gray-400 mt-0.5">Click cells to edit</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kernel</label>
            <select value={kernelMode === 'custom' ? '__custom__' : selectedPreset}
              onChange={e => {
                if (e.target.value === '__custom__') setKernelMode('custom');
                else setPreset(e.target.value);
              }}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
              {Object.keys(PRESET_KERNELS).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="__custom__">✎ Custom...</option>
            </select>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {kernelMode === 'custom' ? 'Click kernel cells to edit' : 'Or select Custom to edit'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Stride: {stride}</label>
              <input type="range" min="1" max="3" step="1" value={stride}
                onChange={e => { setStride(parseInt(e.target.value)); stopPlaying(); setSelectedOutput(null); }}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Padding: {padding}</label>
              <input type="range" min="0" max="3" step="1" value={padding}
                onChange={e => { setPadding(parseInt(e.target.value)); stopPlaying(); setSelectedOutput(null); }}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dilation: {dilation}</label>
              <input type="range" min="1" max="3" step="1" value={dilation}
                onChange={e => { setDilation(parseInt(e.target.value)); stopPlaying(); setSelectedOutput(null); }}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Speed: {animSpeed}ms</label>
              <input type="range" min="100" max="1200" step="50" value={animSpeed}
                onChange={e => setAnimSpeed(parseInt(e.target.value))}
                className="w-full" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button onClick={isPlaying ? stopPlaying : startPlaying}
                disabled={totalSteps === 0}
                className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${isPlaying ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90 disabled:opacity-40`}>
                {isPlaying ? '■ Stop' : '▶ Animate'}
              </button>
              <button onClick={() => { stopPlaying(); setSelectedOutput(null); }}
                className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                Reset
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={clamp}
                onChange={e => setClamp(e.target.checked)}
                className="w-3.5 h-3.5" />
              Clamp to [0, 255] (off = see negative)
            </label>
          </div>
        </div>

        {/* Input + Kernel + Output */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center mb-6">
          {/* Input Grid */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-1">Input ({inSize}×{inSize})</h3>
            <div className="inline-block border-2 border-gray-300 rounded overflow-hidden">
              {input.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => {
                    const inWindow = animRow !== null && animCol !== null
                      && i >= windowStartR && i < windowStartR + kSize * dilation
                      && j >= windowStartC && j < windowStartC + kSize * dilation
                      && (i - windowStartR) % dilation === 0
                      && (j - windowStartC) % dilation === 0;
                    return (
                      <input key={j}
                        type="text" inputMode="numeric"
                        value={val}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v)) editInputCell(i, j, v);
                        }}
                        className="w-[30px] h-[30px] border border-gray-200 text-center text-[9px] font-mono outline-none focus:z-10 focus:ring-1 focus:ring-blue-400"
                        style={{
                          backgroundColor: inWindow ? 'rgba(168, 85, 247, 0.25)' : toGrayscale(val),
                          color: inWindow ? '#6b21a8' : (val > 128 ? '#fff' : '#000'),
                          outline: inWindow ? '2px solid #9333ea' : undefined,
                          outlineOffset: '-1px',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center self-center text-2xl text-gray-400">⊛</div>

          {/* Kernel Grid */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-1">
              Kernel ({kSize}×{kSize})
              {dilation > 1 && <span className="text-gray-400 ml-1">(dil {dilation})</span>}
            </h3>
            <div className="inline-block border-2 border-purple-400 rounded bg-purple-50 overflow-hidden">
              {kernel.map((row, i) => (
                <div key={i} className="flex">
                  {row.map((val, j) => {
                    const maxAbs = Math.max(...kernel.flat().map(Math.abs), 0.01);
                    const norm = val / maxAbs;
                    return (
                      <input key={j}
                        type="text" inputMode="decimal"
                        value={val.toFixed(val % 1 === 0 ? 0 : 2)}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) editKernelCell(i, j, v);
                        }}
                        className="w-[30px] h-[30px] border border-purple-200 text-center text-[9px] font-mono font-bold outline-none focus:z-10 focus:ring-1 focus:ring-purple-400"
                        style={{
                          backgroundColor: `rgb(${norm > 0 ? Math.round(norm * 200) : 0}, 230, ${norm < 0 ? Math.round(-norm * 200) : 0})`,
                          color: Math.abs(norm) > 0.5 ? '#fff' : '#4a1942',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-gray-400">
              Sum = {kernel.flat().reduce((s, v) => s + v, 0).toFixed(2)}
            </div>
          </div>

          <div className="hidden lg:flex items-center self-center text-2xl text-gray-400">=</div>

          {/* Output Grid */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm mb-1">
              Output ({outH}×{outW})
            </h3>
            {outH > 0 ? (
              <div className="inline-block border-2 border-green-400 rounded overflow-hidden">
                {output.map((row, i) => (
                  <div key={i} className="flex">
                    {row.map((val, j) => {
                      const r = animRow;
                      const c = animCol;
                      const animating = r !== null && c !== null;
                      const isCurrent = animating && r === i && c === j;
                      const isSelected = selectedOutput?.r === i && selectedOutput?.c === j;
                      const revealed = animating && (i < r || (i === r && j <= c));
                      const bg = isSelected
                        ? '#fef3c7'
                        : isCurrent ? '#d1fae5'
                        : revealed ? toGrayscale(val)
                        : '#f0fdf4';
                      return (
                        <motion.div key={j}
                          onClick={() => clickOutput(i, j)}
                          animate={{
                            scale: isCurrent ? 1.15 : isSelected ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.15 }}
                          className="w-[30px] h-[30px] border flex items-center justify-center text-[9px] font-mono cursor-pointer hover:opacity-80"
                          style={{
                            backgroundColor: bg,
                            borderColor: isSelected ? '#f59e0b' : isCurrent ? '#10b981' : '#d1d5db',
                            color: revealed ? (val > 128 ? '#fff' : '#000') : '#9ca3af',
                          }}
                          title={`Click to see computation for output (${i},${j})`}>
                          {revealed ? val : '?'}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-40 h-40 border-2 border-red-300 rounded bg-red-50 flex items-center justify-center text-xs text-red-500">
                Invalid params
                <br />
                Kernel too large
              </div>
            )}
            <div className="mt-1 text-[10px] text-gray-400">
              {inSize}×{inSize} → {outH}×{outW}
              {padding > 0 && `  pad=${padding}`}
              {dilation > 1 && `  dil=${dilation}`}
              {stride > 1 && `  stride=${stride}`}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              O = (I − K<sub>eff</sub> + 2P) / S + 1 = ({inSize} − {effK} + {2 * padding}) / {stride} + 1
            </div>
          </div>
        </div>

        {/* Selected Output Computation */}
        {selectedComputation && (
          <motion.div
            key={`${selectedComputation.r}-${selectedComputation.c}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-amber-900">
                Computation for output ({selectedComputation.r}, {selectedComputation.c})
              </h3>
              <button onClick={() => setSelectedOutput(null)}
                className="text-xs text-amber-600 hover:text-amber-800">✕</button>
            </div>
            <div className="text-xs text-gray-600 mb-2 font-mono">
              Receptive field on input: rows {selectedComputation.r * stride}–{selectedComputation.r * stride + kSize * dilation - 1},
              cols {selectedComputation.c * stride}–{selectedComputation.c * stride + kSize * dilation - 1}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-2 gap-y-0.5 items-center text-xs font-mono max-w-md">
              <div className="text-gray-400 text-[10px] font-semibold">Input</div>
              <div />
              <div className="text-gray-400 text-[10px] font-semibold">Kernel</div>
              <div />
              <div className="text-gray-400 text-[10px] font-semibold">Product</div>
              {selectedComputation.terms.map((term, idx) => (
                <React.Fragment key={idx}>
                  <div className="text-right text-gray-700">{term.iv}</div>
                  <div className="text-gray-300">×</div>
                  <div className="text-center text-purple-700">{term.kv.toFixed(term.kv % 1 === 0 ? 0 : 2)}</div>
                  <div className="text-gray-300">=</div>
                  <div className="font-bold" style={{ color: (term.iv * term.kv) >= 0 ? '#059669' : '#dc2626' }}>
                    {(term.iv * term.kv).toFixed(1)}
                  </div>
                </React.Fragment>
              ))}
              <div className="col-span-5 border-t border-amber-200 pt-0.5 mt-0.5" />
              <div className="col-span-3 text-right font-bold text-gray-700">Sum =</div>
              <div className="col-span-1 font-bold text-gray-700">{selectedComputation.sum.toFixed(1)}</div>
              <div className="text-[10px] text-gray-500 col-span-5">
                {clamp ? 'Clamped' : 'Rounded'} → <strong className="text-amber-700">{selectedComputation.clamped}</strong>
              </div>
            </div>
          </motion.div>
        )}

        {/* Output Stats */}
        {outH > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Output Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-white rounded p-2 text-center">
                <div className="text-[10px] text-gray-500">Min</div>
                <div className="text-sm font-bold font-mono">{stats.min}</div>
              </div>
              <div className="bg-white rounded p-2 text-center">
                <div className="text-[10px] text-gray-500">Max</div>
                <div className="text-sm font-bold font-mono">{stats.max}</div>
              </div>
              <div className="bg-white rounded p-2 text-center">
                <div className="text-[10px] text-gray-500">Mean</div>
                <div className="text-sm font-bold font-mono">{stats.mean}</div>
              </div>
              <div className="bg-white rounded p-2 text-center">
                <div className="text-[10px] text-gray-500">Std Dev</div>
                <div className="text-sm font-bold font-mono">{stats.std}</div>
              </div>
            </div>
            {/* Histogram */}
            <div className="flex items-end gap-[3px] h-16">
              {stats.hist.map((count, idx) => {
                const maxCount = Math.max(...stats.hist, 1);
                const pct = count / maxCount;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="text-[8px] text-gray-400 leading-tight">{count}</div>
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${pct * 100}%`, minHeight: count > 0 ? 4 : 0 }}
                    />
                    <div className="text-[7px] text-gray-400 mt-0.5">
                      {Math.round(stats.min + (stats.max - stats.min) * idx / (stats.hist.length - 1))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* How Convolution Works */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">How Convolution Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-700">
            <div className="p-2.5 bg-white rounded border border-gray-200">
              <span className="font-semibold text-purple-700 block mb-0.5">1. Slide</span>
              The kernel slides across the input. Each position defines a local <strong>receptive field</strong>.
            </div>
            <div className="p-2.5 bg-white rounded border border-gray-200">
              <span className="font-semibold text-purple-700 block mb-0.5">2. Multiply &amp; Sum</span>
              Element-wise multiply kernel × input values, then sum all products into a single number.
            </div>
            <div className="p-2.5 bg-white rounded border border-gray-200">
              <span className="font-semibold text-purple-700 block mb-0.5">3. Stride</span>
              After each position, the kernel moves by <strong>stride</strong> cells. Larger stride = smaller output.
            </div>
            <div className="p-2.5 bg-white rounded border border-gray-200">
              <span className="font-semibold text-purple-700 block mb-0.5">4. Dilation</span>
              Gaps between kernel elements (dilation &gt; 1) increase the receptive field without adding parameters.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
