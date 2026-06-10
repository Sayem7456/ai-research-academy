'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  trainKernelSVM,
  kernelDecisionValue,
  generateDataset,
  makeKernel,
  computeSVMSlack,
  type ClassifiedPoint,
  type KernelType,
  type KernelParams,
} from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;
const GRID = 36;

const kernelLabels: Record<Exclude<KernelType, 'linear'>, string> = {
  rbf: 'RBF',
  polynomial: 'Polynomial',
  sigmoid: 'Sigmoid',
};

const datasetLabels: Record<string, string> = {
  linear: 'Linear',
  circles: 'Circles',
  moons: 'Moons',
  xor: 'XOR',
};

const toSVGX = (dx: number) => (dx / RANGE) * WIDTH;
const toSVGY = (dy: number) => HEIGHT - (dy / RANGE) * HEIGHT;

function colorForDecision(val: number): string {
  const t = Math.max(-1, Math.min(1, val / 2.5));
  if (t < 0) {
    const s = 1 + t;
    const r = 239, g = Math.round(68 + (255 - 68) * s), b = Math.round(68 + (255 - 68) * s);
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(255 - (255 - 59) * t);
  const g = Math.round(255 - (255 - 130) * t);
  const b = Math.round(255 - (255 - 246) * t);
  return `rgb(${r},${g},${b})`;
}

export default function SVMBoundaryExplorer() {
  const [dataset, setDataset] = useState<'linear' | 'circles' | 'moons' | 'xor'>('linear');
  const [points, setPoints] = useState<ClassifiedPoint[]>(() => generateDataset('linear'));
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [C, setC] = useState(1.0);
  const [kernelType, setKernelType] = useState<KernelType>('linear');
  const [gamma, setGamma] = useState(1.0);
  const [degree, setDegree] = useState(3);
  const [coef0, setCoef0] = useState(0);
  const [showMargin, setShowMargin] = useState(true);
  const [mode, setMode] = useState<'add' | 'test'>('add');
  const [testPoint, setTestPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const gridStroke = isDark ? '#4b5563' : '#e5e7eb';
  const axisFill = isDark ? '#6b7280' : '#9ca3af';
  const axisFillDark = isDark ? '#6b7280' : '#9ca3af';
  const tooltipBg = isDark ? '#1f2937' : 'white';
  const tooltipBorder = isDark ? '#4b5563' : '#d1d5db';
  const tooltipText = isDark ? '#d1d5db' : '#374151';
  const chartStroke = isDark ? '#4b5563' : '#d1d5db';
  const chartLabelFill = isDark ? '#6b7280' : '#9ca3af';
  const gridSearchText = isDark ? '#d1d5db' : '#374151';
  const kernelMatrixStroke = isDark ? '#374151' : '#e5e7eb';

  const [animStep, setAnimStep] = useState(-1);
  const [isTraining, setIsTraining] = useState(false);
  const trainingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showConfusion, setShowConfusion] = useState(false);
  const [showKernelMatrix, setShowKernelMatrix] = useState(false);
  const [showHistogram, setShowHistogram] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const [gridResult, setGridResult] = useState<{ C: number; gamma: number; accuracy: number }[][] | null>(null);
  const [gridRunning, setGridRunning] = useState(false);

  const kernelParams: KernelParams = useMemo(() => ({ gamma, degree, coef0 }), [gamma, degree, coef0]);

  const svmResult = useMemo(
    () => trainKernelSVM(points, kernelType, kernelParams, C, 2000),
    [points, kernelType, kernelParams, C]
  );

  const { alpha, b, supportVectorIndices, margin, wSquared, objective, history } = svmResult;

  const safeAnimStep = useMemo(() => {
    const maxStep = (history?.length ?? 1) - 1;
    return Math.min(animStep, maxStep);
  }, [animStep, history]);

  const currentAlpha = useMemo(() => {
    if (safeAnimStep >= 0 && history && safeAnimStep < history.length) return history[safeAnimStep].alpha;
    return alpha;
  }, [safeAnimStep, history, alpha]);

  const currentB = useMemo(() => {
    if (safeAnimStep >= 0 && history && safeAnimStep < history.length) return history[safeAnimStep].b;
    return b;
  }, [safeAnimStep, history, b]);

  const currentHistoryEntry = useMemo(() => {
    if (safeAnimStep >= 0 && history && safeAnimStep < history.length) return history[safeAnimStep];
    return null;
  }, [safeAnimStep, history]);

  const kernel = useMemo(() => makeKernel(kernelType), [kernelType]);

  const decisionFn = useCallback(
    (x: number, y: number) => kernelDecisionValue(x, y, points, currentAlpha, currentB, kernel, kernelParams),
    [points, currentAlpha, currentB, kernel, kernelParams]
  );

  const accuracy = useMemo(() => {
    if (points.length === 0) return { correct: 0, total: 0, pct: 0 };
    let correct = 0;
    for (let i = 0; i < points.length; i++) {
      const pred = decisionFn(points[i].x, points[i].y) >= 0 ? 1 : 0;
      if (pred === points[i].label) correct++;
    }
    return { correct, total: points.length, pct: (correct / points.length) * 100 };
  }, [points, decisionFn]);

  const confusion = useMemo(() => {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (const p of points) {
      const pred = decisionFn(p.x, p.y) >= 0 ? 1 : 0;
      if (p.label === 1 && pred === 1) tp++;
      else if (p.label === 0 && pred === 1) fp++;
      else if (p.label === 0 && pred === 0) tn++;
      else if (p.label === 1 && pred === 0) fn++;
    }
    const total = points.length;
    const acc = total > 0 ? ((tp + tn) / total) * 100 : 0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    return { tp, fp, tn, fn, accuracy: acc, precision, recall, f1 };
  }, [points, decisionFn]);

  const slackValues = useMemo(
    () => computeSVMSlack(points, currentAlpha, currentB, kernel, kernelParams),
    [points, currentAlpha, currentB, kernel, kernelParams]
  );

  const kernelMatrix = useMemo(() => {
    const k = makeKernel(kernelType);
    const n = points.length;
    if (n === 0) return { raw: [], normalized: [], minVal: 0, maxVal: 0, n: 0 };
    const matrix: number[][] = [];
    let minVal = Infinity, maxVal = -Infinity;
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        const val = k(points[i], points[j], kernelParams);
        matrix[i][j] = val;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }
    const range = maxVal - minVal || 1;
    const normalized = matrix.map(row => row.map(v => (v - minVal) / range));
    return { raw: matrix, normalized, minVal, maxVal, n };
  }, [points, kernelType, kernelParams]);

  const decisionValues = useMemo(
    () => points.map(p => decisionFn(p.x, p.y)),
    [points, decisionFn]
  );

  const histogram = useMemo(() => {
    if (decisionValues.length === 0) return null;
    const min = Math.min(...decisionValues);
    const max = Math.max(...decisionValues);
    const range = max - min || 1;
    const numBins = 10;
    const bins = new Array(numBins).fill(0);
    for (const v of decisionValues) {
      const idx = Math.min(numBins - 1, Math.max(0, Math.floor(((v - min) / range) * numBins)));
      bins[idx]++;
    }
    return { bins, min, max, numBins };
  }, [decisionValues]);

  const testPrediction = useMemo(() => {
    if (!testPoint) return null;
    const val = decisionFn(testPoint.x, testPoint.y);
    const pred = val >= 0 ? 1 : 0;
    const d = kernelType === 'linear' && Math.sqrt(svmResult.wSquared) > 0.001
      ? Math.abs(val) / Math.sqrt(svmResult.wSquared)
      : Math.abs(val);
    return { prediction: pred as 0 | 1, distance: d, raw: val };
  }, [testPoint, decisionFn, kernelType, svmResult.wSquared]);

  const stopTraining = useCallback(() => {
    if (trainingRef.current) { clearInterval(trainingRef.current); trainingRef.current = null; }
    setIsTraining(false);
  }, []);

  useEffect(() => { return () => stopTraining(); }, [stopTraining]);

  const startTraining = useCallback(() => {
    stopTraining();
    if (!history || history.length === 0) return;
    setAnimStep(0);
    setIsTraining(true);
    const totalSteps = history.length;
    let step = 0;
    trainingRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) { stopTraining(); setAnimStep(totalSteps - 1); return; }
      setAnimStep(step);
    }, Math.max(30, Math.min(200, 4000 / totalSteps)));
  }, [history, stopTraining]);

  const runGridSearch = useCallback(() => {
    if (points.length < 4) return;
    setGridRunning(true);
    const C_values = [0.1, 0.5, 1, 5, 10];
    const gamma_values = [0.1, 0.5, 1, 2, 4];
    const grid: { C: number; gamma: number; accuracy: number }[][] = [];

    setTimeout(() => {
      for (let ci = 0; ci < C_values.length; ci++) {
        grid[ci] = [];
        for (let gi = 0; gi < gamma_values.length; gi++) {
          const localParams: KernelParams = { gamma: gamma_values[gi], degree, coef0 };
          const res = trainKernelSVM(points, kernelType, localParams, C_values[ci], 500);
          let correct = 0;
          const y = points.map(p => p.label === 1 ? 1 : -1);
          const kernelFn = makeKernel(kernelType);
          for (let i = 0; i < points.length; i++) {
            let f = res.b;
            for (let j = 0; j < points.length; j++) {
              f += res.alpha[j] * y[j] * kernelFn(points[j], points[i], localParams);
            }
            if ((f >= 0 ? 1 : 0) === points[i].label) correct++;
          }
          grid[ci].push({ C: C_values[ci], gamma: gamma_values[gi], accuracy: (correct / points.length) * 100 });
        }
      }
      setGridResult(grid);
      setGridRunning(false);
    }, 50);
  }, [points, kernelType, degree, coef0]);

  const switchDataset = useCallback((name: 'linear' | 'circles' | 'moons' | 'xor') => {
    setDataset(name);
    setPoints(generateDataset(name));
    setTestPoint(null);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * RANGE;
      const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
      if (mode === 'test') { setTestPoint({ x, y }); return; }
      setPoints(prev => [...prev, { x, y, label: activeClass }]);
    },
    [activeClass, mode]
  );

  const handleRemovePoint = useCallback((index: number) => {
    if (mode === 'test') return;
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, [mode]);

  const handleReset = useCallback(() => {
    setPoints(generateDataset(dataset));
    setTestPoint(null);
  }, [dataset]);

  const handleRandomData = useCallback(() => {
    const randomDataset = (['linear', 'circles', 'moons', 'xor'] as const)[Math.floor(Math.random() * 4)];
    setDataset(randomDataset);
    setPoints(generateDataset(randomDataset));
    setTestPoint(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setPoints([]);
    setTestPoint(null);
  }, []);

  const renderGrid = () => {
    const els: React.ReactNode[] = [];
    for (let i = 0; i <= RANGE; i++) {
      const p = (i / RANGE) * WIDTH;
      els.push(<line key={`gv${i}`} x1={p} y1={0} x2={p} y2={HEIGHT} stroke={gridStroke} strokeWidth={1} />);
      els.push(<line key={`gh${i}`} x1={0} y1={p} x2={WIDTH} y2={p} stroke={gridStroke} strokeWidth={1} />);
      if (i % 2 === 0) {
        els.push(<text key={`lx${i}`} x={p} y={HEIGHT + 14} textAnchor="middle" fontSize={10} fill={axisFill}>{i}</text>);
        els.push(<text key={`ly${i}`} x={-10} y={p + 4} textAnchor="end" fontSize={10} fill={axisFill}>{RANGE - i}</text>);
      }
    }
    return els;
  };

  const heatmapGrid = useMemo(() => {
    const vals: number[][] = [];
    for (let gy = 0; gy < GRID; gy++) {
      vals[gy] = [];
      for (let gx = 0; gx < GRID; gx++) {
        const dx = ((gx + 0.5) / GRID) * RANGE;
        const dy = RANGE - ((gy + 0.5) / GRID) * RANGE;
        vals[gy][gx] = decisionFn(dx, dy);
      }
    }
    return vals;
  }, [decisionFn]);

  const renderHeatmap = () => {
    const cw = WIDTH / GRID;
    const ch = HEIGHT / GRID;
    const cells: React.ReactNode[] = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        cells.push(
          <rect key={`h${gx}-${gy}`}
            x={gx * cw} y={gy * ch} width={cw} height={ch}
            fill={colorForDecision(heatmapGrid[gy][gx])}
          />
        );
      }
    }
    return cells;
  };

  const cornerValues = useMemo(() => {
    const cv: number[][] = [];
    for (let gy = 0; gy <= GRID; gy++) {
      cv[gy] = [];
      for (let gx = 0; gx <= GRID; gx++) {
        const dx = (gx / GRID) * RANGE;
        const dy = RANGE - (gy / GRID) * RANGE;
        cv[gy][gx] = decisionFn(dx, dy);
      }
    }
    return cv;
  }, [decisionFn]);

  const contourLines = useMemo(() => {
    const thresholds = showMargin ? [-1, 0, 1] : [0];
    const colors: Record<string, string> = { '-1': '#9333ea', '0': '#7c3aed', '1': '#9333ea' };
    const dashes: Record<string, string> = { '-1': '4,4', '0': '', '1': '4,4' };
    const widths: Record<string, number> = { '-1': 1.5, '0': 3, '1': 1.5 };

    interface Pt { x: number; y: number }
    const allSegments: { a: Pt; b: Pt; thresh: number }[] = [];

    const cellVal = (gy: number, gx: number) => cornerValues[gy]?.[gx] ?? 0;

    const edgePt = (
      gx: number, gy: number, edge: number, thresh: number
    ): Pt => {
      const v = (gy2: number, gx2: number) => cellVal(gy2, gx2) - thresh;
      const xl = (gx / GRID) * RANGE, xr = ((gx + 1) / GRID) * RANGE;
      const yt = RANGE - (gy / GRID) * RANGE, yb = RANGE - ((gy + 1) / GRID) * RANGE;
      const lerp = (a: number, b: number, va: number, vb: number) =>
        Math.abs(vb - va) > 1e-12 ? a - va * (b - a) / (vb - va) : (a + b) / 2;
      switch (edge) {
        case 0: return { x: lerp(xl, xr, v(gy, gx), v(gy, gx + 1)), y: yt };
        case 1: return { x: xr, y: lerp(yt, yb, v(gy, gx + 1), v(gy + 1, gx + 1)) };
        case 2: return { x: lerp(xr, xl, v(gy + 1, gx + 1), v(gy + 1, gx)), y: yb };
        case 3: return { x: xl, y: lerp(yb, yt, v(gy + 1, gx), v(gy, gx)) };
        default: return { x: 0, y: 0 };
      }
    };

    for (const thresh of thresholds) {
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          const tl = cellVal(gy, gx) - thresh;
          const tr = cellVal(gy, gx + 1) - thresh;
          const br = cellVal(gy + 1, gx + 1) - thresh;
          const bl = cellVal(gy + 1, gx) - thresh;

          const above = (v: number) => v > 0;
          const code = (above(tl) ? 8 : 0) | (above(tr) ? 4 : 0) | (above(br) ? 2 : 0) | (above(bl) ? 1 : 0);
          if (code === 0 || code === 15) continue;

          const e = (n: number) => edgePt(gx, gy, n, thresh);

          switch (code) {
            case 1: allSegments.push({ a: e(3), b: e(2), thresh }); break;
            case 2: allSegments.push({ a: e(1), b: e(2), thresh }); break;
            case 3: allSegments.push({ a: e(3), b: e(1), thresh }); break;
            case 4: allSegments.push({ a: e(0), b: e(1), thresh }); break;
            case 5: {
              const center = decisionFn((gx + 0.5) / GRID * RANGE, RANGE - (gy + 0.5) / GRID * RANGE) - thresh;
              if (center > 0) { allSegments.push({ a: e(0), b: e(3), thresh }); allSegments.push({ a: e(1), b: e(2), thresh }); }
              else { allSegments.push({ a: e(0), b: e(1), thresh }); allSegments.push({ a: e(3), b: e(2), thresh }); }
              break;
            }
            case 6: allSegments.push({ a: e(0), b: e(2), thresh }); break;
            case 7: allSegments.push({ a: e(0), b: e(3), thresh }); break;
            case 8: allSegments.push({ a: e(0), b: e(3), thresh }); break;
            case 9: allSegments.push({ a: e(0), b: e(2), thresh }); break;
            case 10: {
              const center = decisionFn((gx + 0.5) / GRID * RANGE, RANGE - (gy + 0.5) / GRID * RANGE) - thresh;
              if (center > 0) { allSegments.push({ a: e(0), b: e(1), thresh }); allSegments.push({ a: e(3), b: e(2), thresh }); }
              else { allSegments.push({ a: e(0), b: e(3), thresh }); allSegments.push({ a: e(1), b: e(2), thresh }); }
              break;
            }
            case 11: allSegments.push({ a: e(0), b: e(1), thresh }); break;
            case 12: allSegments.push({ a: e(3), b: e(1), thresh }); break;
            case 13: allSegments.push({ a: e(1), b: e(2), thresh }); break;
            case 14: allSegments.push({ a: e(3), b: e(2), thresh }); break;
          }
        }
      }
    }

    return allSegments.map((seg, i) => (
      <line key={`c${i}`}
        x1={toSVGX(seg.a.x)} y1={toSVGY(seg.a.y)}
        x2={toSVGX(seg.b.x)} y2={toSVGY(seg.b.y)}
        stroke={colors[String(seg.thresh)]}
        strokeWidth={widths[String(seg.thresh)]}
        strokeDasharray={dashes[String(seg.thresh)]}
        strokeLinecap="round"
        opacity={0.7}
      />
    ));
  }, [cornerValues, showMargin, decisionFn]);

  const renderMarginFill = () => {
    if (!showMargin) return null;
    const rects: React.ReactNode[] = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const v = heatmapGrid[gy][gx];
        if (Math.abs(v) < 1) {
          const cw = WIDTH / GRID;
          const ch = HEIGHT / GRID;
          rects.push(
            <rect key={`mf${gx}-${gy}`}
              x={gx * cw} y={gy * ch} width={cw} height={ch}
              fill="#8b5cf6" fillOpacity={0.04}
            />
          );
        }
      }
    }
    return rects;
  };

  const renderKernelMatrixViz = () => {
    if (!kernelMatrix || kernelMatrix.n === 0) return null;
    const { normalized, n } = kernelMatrix;
    const cellSize = 12;
    const vizWidth = n * cellSize;
    const maxLabelWidth = 24;
    const totalWidth = vizWidth + maxLabelWidth + 8;

    return (
      <svg width={totalWidth} height={vizWidth + 20} className="mx-auto">
        {Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => (
            <rect key={`km-${i}-${j}`}
              x={maxLabelWidth + j * cellSize}
              y={i * cellSize}
              width={cellSize} height={cellSize}
              fill={`rgb(${Math.round(255 - normalized[i][j] * 200)}, ${Math.round(255 - normalized[i][j] * 200)}, 255)`}
              stroke={kernelMatrixStroke} strokeWidth={0.5}
            />
          ))
        )}
        {Array.from({ length: n }, (_, i) => (
          <text key={`kmy-${i}`}
            x={maxLabelWidth - 2} y={i * cellSize + cellSize / 2 + 1}
            textAnchor="end" fontSize={7} fill={axisFillDark} fontFamily="monospace">{i}</text>
        ))}
        {Array.from({ length: n }, (_, j) => (
          <text key={`kmx-${j}`}
            x={maxLabelWidth + j * cellSize + cellSize / 2}
            y={n * cellSize + 10}
            textAnchor="middle" fontSize={7} fill={axisFillDark} fontFamily="monospace">{j}</text>
        ))}
        <text x={0} y={n * cellSize / 2} textAnchor="middle" fontSize={8} fill={chartLabelFill}
          transform={`rotate(-90, 8, ${n * cellSize / 2})`}>i</text>
        <text x={maxLabelWidth + vizWidth / 2} y={n * cellSize + 20}
          textAnchor="middle" fontSize={8} fill={chartLabelFill}>j</text>
      </svg>
    );
  };

  const renderHistogramViz = () => {
    if (!histogram) return null;
    const { bins, min, max, numBins } = histogram;
    const histW = 200, histH = 80;
    const barW = histW / numBins;
    const maxCount = Math.max(...bins, 1);
    const barMargin = 1;

    return (
      <div className="text-center">
        <svg width={histW + 20} height={histH + 30} className="mx-auto">
          <line x1={10} y1={histH} x2={histW + 10} y2={histH} stroke={chartStroke} strokeWidth={1} />
          <line x1={10} y1={0} x2={10} y2={histH} stroke={chartStroke} strokeWidth={1} />
          {bins.map((count, i) => (
            <rect key={`hist-${i}`}
              x={10 + i * barW + barMargin}
              y={histH - (count / maxCount) * histH}
              width={Math.max(1, barW - 2 * barMargin)}
              height={(count / maxCount) * histH}
              fill="#7c3aed"
              fillOpacity={0.6}
              rx={1}
            />
          ))}
          <line x1={10 + ((0 - min) / (max - min || 1)) * histW} y1={0}
            x2={10 + ((0 - min) / (max - min || 1)) * histW} y2={histH}
            stroke="#ef4444" strokeWidth={1} strokeDasharray="3,2" opacity={0.5} />
          <text x={10 + ((0 - min) / (max - min || 1)) * histW} y={histH + 12}
            textAnchor="middle" fontSize={8} fill="#ef4444">f=0</text>
          <text x={10} y={-2} textAnchor="start" fontSize={7} fill={chartLabelFill}>{min.toFixed(1)}</text>
          <text x={histW + 10} y={-2} textAnchor="end" fontSize={7} fill={chartLabelFill}>{max.toFixed(1)}</text>
          <text x={10 + histW / 2} y={histH + 26} textAnchor="middle" fontSize={8} fill={chartLabelFill}>f(x)</text>
          <text x={2} y={histH / 2} textAnchor="middle" fontSize={8} fill={chartLabelFill}
            transform={`rotate(-90, 4, ${histH / 2})`}>count</text>
        </svg>
      </div>
    );
  };

  const renderGridViz = () => {
    if (!gridResult) return null;
    const rows = 5, cols = 5;
    const cellW = 48, cellH = 36;

    return (
      <div>
        <svg width={cols * cellW + 50} height={rows * cellH + 30} className="mx-auto">
          {gridResult.map((row, ci) =>
            row.map((cell, gi) => {
              const acc = cell.accuracy;
              const r = Math.round(255 - (acc / 100) * 200);
              const g = Math.round(255 - (acc / 100) * 50);
              const b = Math.round(255 - (acc / 100) * 200);
              return (
                <g key={`grid-${ci}-${gi}`}>
                  <rect x={50 + gi * cellW} y={ci * cellH}
                    width={cellW} height={cellH} rx={2}
                    fill={`rgb(${r},${g},${b})`}
                    stroke={kernelMatrixStroke} strokeWidth={1}
                  />
                  <text x={50 + gi * cellW + cellW / 2} y={ci * cellH + cellH / 2 - 3}
                    textAnchor="middle" fontSize={10} fontWeight="bold" fill={acc > 70 ? 'white' : gridSearchText}>
                    {acc.toFixed(0)}%
                  </text>
                  <text x={50 + gi * cellW + cellW / 2} y={ci * cellH + cellH / 2 + 10}
                    textAnchor="middle" fontSize={7} fill={acc > 70 ? 'rgba(255,255,255,0.7)' : chartLabelFill}>
                    C={cell.C.toFixed(1)}
                  </text>
                </g>
              );
            })
          )}
          {['0.1', '0.5', '1', '2', '4'].map((label, gi) => (
            <text key={`gx-${gi}`} x={50 + gi * cellW + cellW / 2} y={-4}
              textAnchor="middle" fontSize={8} fill={axisFillDark}>{label}</text>
          ))}
          {['0.1', '0.5', '1', '5', '10'].map((label, ci) => (
            <text key={`gy-${ci}`} x={44} y={ci * cellH + cellH / 2 + 3}
              textAnchor="end" fontSize={8} fill={axisFillDark}>{label}</text>
          ))}
          <text x={50 + (cols * cellW) / 2} y={rows * cellH + 16}
            textAnchor="middle" fontSize={8} fill={chartLabelFill}>γ (gamma) →</text>
          <text x={6} y={rows * cellH / 2} textAnchor="middle" fontSize={8} fill={chartLabelFill}
            transform={`rotate(-90, 10, ${rows * cellH / 2})`}>C →</text>
        </svg>
      </div>
    );
  };

  const renderProgressChart = () => {
    if (!history || history.length < 2) return null;
    const chartW = 360, chartH = 100;
    const pad = { t: 10, r: 10, b: 20, l: 35 };
    const innerW = chartW - pad.l - pad.r;
    const innerH = chartH - pad.t - pad.b;

    const maxObj = Math.max(...history.map(h => h.objective));
    const minObj = Math.min(...history.map(h => h.objective));
    const objRange = maxObj - minObj || 1;

    const maxAcc = Math.max(...history.map(h => h.accuracy));
    const minAcc = Math.min(...history.map(h => h.accuracy));
    const accRange = maxAcc - minAcc || 1;

    const xScale = innerW / (history.length - 1);
    const objPath = history.map((h, i) => {
      const x = pad.l + i * xScale;
      const y = pad.t + innerH - ((h.objective - minObj) / objRange) * innerH * 0.7;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    const accPath = history.map((h, i) => {
      const x = pad.l + i * xScale;
      const y = pad.t + innerH - ((h.accuracy - minAcc) / accRange) * innerH * 0.7;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    const animX = animStep >= 0 && animStep < history.length
      ? pad.l + animStep * xScale : null;

    return (
      <svg width={chartW} height={chartH} className="mx-auto">
                <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke={chartStroke} strokeWidth={1} />
        <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke={chartStroke} strokeWidth={1} />
        <path d={objPath} fill="none" stroke="#7c3aed" strokeWidth={1.5} opacity={0.7} />
        <path d={accPath} fill="none" stroke="#10b981" strokeWidth={1.5} opacity={0.7} />
        {animX !== null && (
          <line x1={animX} y1={pad.t} x2={animX} y2={pad.t + innerH}
            stroke="#f59e0b" strokeWidth={1} strokeDasharray="3,2" />
        )}
        <text x={pad.l + innerW / 2} y={chartH - 2} textAnchor="middle" fontSize={8} fill={chartLabelFill}>Iteration</text>
        <text x={4} y={pad.t + innerH / 2} textAnchor="middle" fontSize={7} fill={chartLabelFill}
          transform={`rotate(-90, 6, ${pad.t + innerH / 2})`}>value</text>
        <circle x={pad.l + innerW - 8} y={8} r={3} fill="#7c3aed" />
        <text x={pad.l + innerW - 4} y={11} fontSize={7} fill={axisFillDark}>J<sub>D</sub> (obj)</text>
        <circle x={pad.l + innerW - 8} y={20} r={3} fill="#10b981" />
        <text x={pad.l + innerW - 4} y={23} fontSize={7} fill={axisFillDark}>Acc.</text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-1">
              {(['linear', 'circles', 'moons', 'xor'] as const).map(name => (
                <button key={name} onClick={() => switchDataset(name)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    dataset === name ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>{datasetLabels[name]}</button>
              ))}
            </div>

            <div className="flex gap-1">
              {(['linear', 'rbf', 'polynomial', 'sigmoid'] as const).map(k => (
                <button key={k} onClick={() => { setKernelType(k); setTestPoint(null); }}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    kernelType === k
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>{k === 'linear' ? 'Linear' : kernelLabels[k]}</button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setMode('add')}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === 'add' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>Add Data</button>
              <button onClick={() => { setMode('test'); setTestPoint(null); }}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === 'test' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}>Test SVM</button>
            </div>

            <div
              className="relative w-full max-w-[400px] aspect-square bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair select-none"
              onClick={handleCanvasClick}
            >
              <svg width={WIDTH} height={HEIGHT} viewBox={`-20 -10 ${WIDTH + 40} ${HEIGHT + 30}`}
                className="absolute inset-0 w-full h-full"
              >
                <defs>
                  <radialGradient id="sv-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </radialGradient>
                </defs>
                {renderGrid()}
                {renderHeatmap()}
                {renderMarginFill()}
                {contourLines}

                {points.map((p, i) => {
                  const isSV = supportVectorIndices.includes(i);
                  const aVal = alpha[i];
                  return (
                    <motion.g key={`pt-${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                      {isSV && (
                        <g>
                          <circle cx={toSVGX(p.x)} cy={toSVGY(p.y)} r={16}
                            fill="url(#sv-glow)" />
                          <circle cx={toSVGX(p.x)} cy={toSVGY(p.y)} r={14}
                            fill="none" stroke="#fbbf24" strokeWidth={2.5}
                            strokeDasharray={aVal !== undefined && aVal >= C - 1e-5 ? '' : '3 2'} />
                          <circle cx={toSVGX(p.x)} cy={toSVGY(p.y)} r={16}
                            fill="none" stroke="#c4b5fd" strokeWidth={1}
                            className="animate-pulse" />
                        </g>
                      )}
                      <motion.circle
                        cx={toSVGX(p.x)} cy={toSVGY(p.y)}
                        r={hoveredPoint === i ? 8 : 6}
                        fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                        stroke={isSV ? '#fbbf24' : tooltipBorder}
                        strokeWidth={isSV ? 3 : 2}
                        style={{ cursor: mode === 'add' ? 'pointer' : 'default' }}
                        onClick={(e) => { e.stopPropagation(); if (mode === 'add') handleRemovePoint(i); }}
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {hoveredPoint === i && (
                        <g>
                          <rect x={toSVGX(p.x) + 14} y={toSVGY(p.y) - 18}
                            width={110} height={34} rx={4}
                            fill={tooltipBg} stroke={tooltipBorder} strokeWidth={1} opacity={0.95} />
                          <text x={toSVGX(p.x) + 18} y={toSVGY(p.y) - 8}
                            fontSize={9} fontFamily="monospace" fill={tooltipText}>
                            ({p.x.toFixed(1)},{p.y.toFixed(1)}) α={aVal.toFixed(3)}
                          </text>
                          <text x={toSVGX(p.x) + 18} y={toSVGY(p.y) + 6}
                            fontSize={9} fontFamily="monospace" fill={isSV ? '#d97706' : (isDark ? '#6b7280' : '#9ca3af')}>
                            {isSV
                              ? `SV ξ=${slackValues[i].toFixed(3)}${aVal >= C - 1e-5 ? ' (bounded)' : ''}`
                              : `Not SV ξ=${slackValues[i].toFixed(3)}`}
                          </text>
                        </g>
                      )}
                    </motion.g>
                  );
                })}

                {testPoint && testPrediction && (
                  <g>
                    <circle cx={toSVGX(testPoint.x)} cy={toSVGY(testPoint.y)} r={8}
                      fill="none" stroke="#10b981" strokeWidth={3} />
                    <circle cx={toSVGX(testPoint.x)} cy={toSVGY(testPoint.y)} r={3}
                      fill="#10b981" />
                    <rect x={toSVGX(testPoint.x) + 14} y={toSVGY(testPoint.y) - 10}
                      width={120} height={20} rx={4}
                      fill={tooltipBg} stroke="#10b981" strokeWidth={1} opacity={0.95} />
                    <text x={toSVGX(testPoint.x) + 18} y={toSVGY(testPoint.y) + 4}
                      fontSize={9} fontFamily="monospace" fill="#059669" fontWeight="bold">
                      Class {testPrediction.prediction} (d={testPrediction.distance.toFixed(2)})
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {history && history.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => { if (isTraining) stopTraining(); else startTraining(); }}
                    disabled={points.length < 2}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                      isTraining ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isTraining ? 'Pause' : (animStep >= 0 ? 'Replay' : 'Train SVM')}
                  </button>
                  <button onClick={() => setAnimStep(-1)}
                    disabled={animStep < 0}
                    className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Reset
                  </button>
                  <button onClick={() => setShowProgress(v => !v)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                      showProgress ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}>Progress</button>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-auto">
                    {animStep >= 0 && currentHistoryEntry
                      ? `Step ${animStep + 1}/${history.length} (iter ${currentHistoryEntry.iteration})`
                      : `Final (${history.length} steps)`}
                  </span>
                </div>
                <input type="range" min={-1} max={history.length - 1} step={1}
                  value={animStep}
                  onChange={(e) => { const v = parseInt(e.target.value); setAnimStep(v); setIsTraining(false); }}
                  className="w-full" />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  <span>Start</span>
                  <span>Converged</span>
                </div>
                <AnimatePresence>
                  {showProgress && renderProgressChart()}
                </AnimatePresence>
              </div>
            )}

            {mode === 'add' && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setActiveClass(1)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeClass === 1 ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}>Class 1 (Blue)</button>
                <button onClick={() => setActiveClass(0)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeClass === 0 ? 'bg-red-600 text-white ring-2 ring-red-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}>Class 0 (Red)</button>
                <button onClick={() => setShowMargin(!showMargin)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    showMargin ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}>Margin</button>
                <button onClick={handleRandomData}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors">Random</button>
                <button onClick={handleClearAll}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors">Clear</button>
                <button onClick={handleReset}
                  className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-900 transition-colors">Reset</button>
              </div>
            )}

            {mode === 'test' && (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Click the canvas to test the decision function at any point.
                </p>
                {testPoint && (
                  <button onClick={() => setTestPoint(null)}
                    className="shrink-0 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Clear</button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Kernel Parameters</h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Regularization (C): <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{C.toFixed(1)}</span>
                  </label>
                  <input type="range" min={0.1} max={10} step={0.1} value={C}
                    onChange={(e) => { setC(parseFloat(e.target.value)); setTestPoint(null); }}
                    className="w-full mt-0.5" />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    <span>0.1 (soft)</span><span>10 (hard)</span>
                  </div>
                </div>

                {kernelType !== 'linear' && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Gamma (γ): <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{gamma.toFixed(2)}</span>
                    </label>
                    <input type="range" min={0.05} max={4} step={0.05} value={gamma}
                      onChange={(e) => { setGamma(parseFloat(e.target.value)); setTestPoint(null); }}
                      className="w-full mt-0.5" />
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      <span>0.05 (wide)</span><span>4.0 (tight)</span>
                    </div>
                  </div>
                )}

                {kernelType === 'polynomial' && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Degree: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{degree}</span>
                    </label>
                    <input type="range" min={1} max={7} step={1} value={degree}
                      onChange={(e) => { setDegree(parseInt(e.target.value)); setTestPoint(null); }}
                      className="w-full mt-0.5" />
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      <span>1 (linear)</span><span>7 (high)</span>
                    </div>
                  </div>
                )}

                {(kernelType === 'polynomial' || kernelType === 'sigmoid') && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Coef0 (r): <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{coef0.toFixed(1)}</span>
                    </label>
                    <input type="range" min={-3} max={3} step={0.1} value={coef0}
                      onChange={(e) => { setCoef0(parseFloat(e.target.value)); setTestPoint(null); }}
                      className="w-full mt-0.5" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5">SVM Model</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Kernel:</span>
                    <span className="font-mono font-medium">{kernelType}{kernelType !== 'linear' ? ` (γ=${gamma.toFixed(2)})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Support Vectors:</span>
                    <span className="font-mono font-medium">{supportVectorIndices.length}/{points.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Margin (2/||w||):</span>
                    <span className="font-mono font-medium">{margin === Infinity ? '∞' : margin.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">||w||<tspan dy="-3" fontSize={7}>2</tspan>:</span>
                    <span className="font-mono">{wSquared.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Dual obj. (J<sub>D</sub>):</span>
                    <span className="font-mono">{objective.toFixed(4)}</span>
                  </div>
                  {animStep >= 0 && currentHistoryEntry && (
                    <div className="flex justify-between pt-1 border-t border-gray-300 dark:border-gray-600 mt-1">
                      <span className="text-gray-500 dark:text-gray-400">Iter:</span>
                      <span className="font-mono">{currentHistoryEntry.iteration}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-semibold text-sm">Accuracy</h3>
                  <button onClick={() => setShowConfusion(v => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      showConfusion ? 'bg-emerald-600 text-white' : 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300'
                    }`}>Confusion</button>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Correct:</span>
                    <span className="font-mono font-medium text-emerald-700">{accuracy.correct}/{accuracy.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Accuracy:</span>
                    <span className={`font-mono font-bold ${accuracy.pct >= 100 ? 'text-emerald-600' : accuracy.pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                      {accuracy.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Class 0:</span>
                    <span className="font-mono">{points.filter(p => p.label === 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Class 1:</span>
                    <span className="font-mono">{points.filter(p => p.label === 1).length}</span>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showConfusion && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-3">
                  <h3 className="font-semibold text-sm mb-2">Confusion Matrix</h3>
                  <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-gray-500 dark:text-gray-400">True Neg</div>
                      <div className="font-mono text-lg">{confusion.tn}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-gray-500 dark:text-gray-400">False Pos</div>
                      <div className="font-mono text-lg">{confusion.fp}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-gray-500 dark:text-gray-400">False Neg</div>
                      <div className="font-mono text-lg">{confusion.fn}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-gray-500 dark:text-gray-400">True Pos</div>
                      <div className="font-mono text-lg">{confusion.tp}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Precision:</span><span className="font-mono font-medium">{confusion.precision.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Recall:</span><span className="font-mono font-medium">{confusion.recall.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">F1 Score:</span><span className="font-mono font-medium">{confusion.f1.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Accuracy:</span><span className="font-mono font-medium">{confusion.accuracy.toFixed(1)}%</span></div>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Predicted → cols, Actual → rows</p>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'test' && testPrediction && testPoint && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-2 text-emerald-800">Test Result</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Predicted:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${testPrediction.prediction === 1 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      Class {testPrediction.prediction}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Decision f(x):</span>
                    <span className="font-mono">{testPrediction.raw.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Distance to boundary:</span>
                    <span className="font-mono">{testPrediction.distance.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}

            {supportVectorIndices.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5">Support Vectors (α &gt; 0)</h3>
                <div className="max-h-28 overflow-y-auto space-y-0.5 text-xs font-mono">
                  {supportVectorIndices.map((idx) => {
                    const p = points[idx];
                    return (
                      <div key={idx} className="flex justify-between items-center">
                        <span>
                          #{idx} ({p.x.toFixed(1)},{p.y.toFixed(1)})
                          <span className={p.label === 1 ? 'text-blue-500' : 'text-red-500'}> {p.label === 1 ? 'B' : 'R'}</span>
                        </span>
                        <span className={`font-bold ${alpha[idx] >= C - 1e-5 ? 'text-red-600' : 'text-amber-700'}`}>
                          α={alpha[idx].toFixed(4)} ξ={slackValues[idx].toFixed(3)}
                          {alpha[idx] >= C - 1e-5 ? ' (bounded)' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {'ξ > 0: inside margin or misclassified. ξ > 1: misclassified.'}
                </p>
              </div>
            )}

            {kernelMatrix && kernelMatrix.n > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <button onClick={() => setShowKernelMatrix(v => !v)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <span>Kernel Matrix (K[i][j])</span>
                  <span className="text-gray-400 dark:text-gray-500">{showKernelMatrix ? '▾' : '▸'}</span>
                </button>
                <AnimatePresence>
                  {showKernelMatrix && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-2">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                        {kernelType} kernel | γ={gamma.toFixed(2)}{kernelType === 'polynomial' ? ` d=${degree}` : ''}
                      </p>
                      {renderKernelMatrixViz()}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        Darker = higher similarity. Row i = K(xᵢ, ·). The kernel measures dot products in the transformed feature space without explicit mapping.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {decisionValues.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <button onClick={() => setShowHistogram(v => !v)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <span>Decision Value Histogram</span>
                  <span className="text-gray-400 dark:text-gray-500">{showHistogram ? '▾' : '▸'}</span>
                </button>
                <AnimatePresence>
                  {showHistogram && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-2">
                      {renderHistogramViz()}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        Distribution of f(x) for all data points. Red line: decision boundary (f=0). |f| &lt; 1 = inside margin.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <button onClick={() => setShowGrid(v => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>Hyperparameter Grid Search</span>
                <span className="text-gray-400 dark:text-gray-500">{showGrid ? '▾' : '▸'}</span>
              </button>
              <AnimatePresence>
                {showGrid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2">
                    <button onClick={runGridSearch} disabled={gridRunning || points.length < 4}
                      className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                      {gridRunning ? 'Running...' : (gridResult ? 'Re-run Grid (C × γ)' : 'Run Grid Search (C × γ)')}
                    </button>
                    {gridResult && renderGridViz()}
                    {gridResult && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        Each cell: SVM trained with given C and γ, shows training accuracy. Darker = higher accuracy.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-1.5">Decision Function</h3>
              {kernelType === 'linear' ? (
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  f(x) = Σ αᵢ yᵢ ⟨xᵢ, x⟩ + b
                </p>
              ) : (
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  f(x) = Σ αᵢ yᵢ K(xᵢ, x) + b
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                b = {currentB.toFixed(4)} | Σαᵢ = {currentAlpha.reduce((s, a) => s + a, 0).toFixed(4)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                f &gt; 0 → Class 1 | f &lt; 0 → Class 0 | |f| &lt; 1 → inside margin
              </p>
            </div>

            <details className="group">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-300 transition-colors select-none font-medium">
                How SVM + Kernels work
              </summary>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg space-y-2 text-xs">
                <p><strong>Linear kernel</strong>: K(x,y) = ⟨x,y⟩ — standard maximum-margin classifier. Good for linearly separable data.</p>
                <p><strong>RBF kernel</strong>: K(x,y) = exp(-γ‖x-y‖²) — maps points into infinite-dimensional space. γ controls the reach of each support vector: low γ → smooth boundary, high γ → wiggly/overfitted.</p>
                <p><strong>Polynomial kernel</strong>: K(x,y) = (γ⟨x,y⟩ + r)^d — creates polynomial decision boundaries. Degree d controls complexity.</p>
                <p><strong>Sigmoid kernel</strong>: K(x,y) = tanh(γ⟨x,y⟩ + r) — behaves like a 2-layer neural network.</p>
                <p>The decision function is f(x) = Σ αᵢ yᵢ K(xᵢ, x) + b. Points with αᵢ &gt; 0 are <strong>support vectors</strong> that define the boundary.</p>
                <p>The <strong>confusion matrix</strong> shows TP/FP/TN/FN counts. <strong>ξ (slack)</strong> = max(0, 1 - y·f(x)) — ξ &gt; 0 means the point violates the margin; ξ &gt; 1 means misclassified.</p>
                <p>The <strong>kernel matrix</strong> K[i][j] visualizes pairwise similarities. The <strong>histogram</strong> shows how decision values are distributed across the margin (±1).</p>
                <p>Use the <strong>animation</strong> to watch α values and the decision boundary converge during training. The <strong>grid search</strong> explores C vs γ to find optimal hyperparameters.</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
