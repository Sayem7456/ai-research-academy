'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  findBestSplit,
  calculateGini,
  generateDataset,
  type ClassifiedPoint,
  type ImpurityFn,
} from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;
const GRID = 32;

const datasetLabels: Record<string, string> = {
  linear: 'Linear',
  circles: 'Circles',
  moons: 'Moons',
  xor: 'XOR',
};

type TreeNode = {
  feature: 'x' | 'y';
  threshold: number;
  impurity: number;
  samples: number;
  left?: TreeNode;
  right?: TreeNode;
  prediction?: 0 | 1;
};

type TrainedTree = {
  root: TreeNode;
  inBag: boolean[];
  oobMask: boolean[];
};

type ForestResult = {
  trees: TrainedTree[];
  leafRegions: { prediction: 0 | 1; minX: number; maxX: number; minY: number; maxY: number }[][];
  cumulativeAccuracy: number[];
  cumulativeOOB: number[];
  oobCorrect: number;
  oobTotal: number;
  featureImportance: { x: number; y: number };
  totalNodes: number;
  totalSplits: number;
  perTreeAccuracy: number[];
  perPointCorrectCount: number[];
  treeDepth: number[];
  treeLeafCount: number[];
  allTreePredictions: number[][];
};

function bootstrapSample(points: ClassifiedPoint[], rng: () => number): { inBag: boolean[]; oobMask: boolean[] } {
  const n = points.length;
  const inBag = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    inBag[Math.floor(rng() * n)] = true;
  }
  const oobMask = inBag.map(v => !v);
  return { inBag, oobMask };
}

function buildTreeRF(
  points: ClassifiedPoint[],
  depth: number,
  maxDepth: number,
  impurityFn: ImpurityFn,
  randomSubset: boolean,
  rng: () => number
): TreeNode | undefined {
  if (points.length === 0) return undefined;
  const labels = points.map(p => p.label);
  const impurity = impurityFn(labels);
  const leafPrediction = (): 0 | 1 => {
    const sum = labels.reduce<number>((a, b) => a + b, 0);
    return sum >= labels.length / 2 ? 1 : 0;
  };
  if (depth >= maxDepth || impurity === 0 || points.length < 2) {
    return { feature: 'x' as const, threshold: 0, impurity, samples: points.length, prediction: leafPrediction() };
  }
  const candidates: { feature: 'x' | 'y'; split: { threshold: number; gain: number } | null }[] = [];
  const considerX = !randomSubset || rng() > 0.5;
  const considerY = !randomSubset || rng() > 0.5;
  if (considerX) candidates.push({ feature: 'x', split: findBestSplit(points, 'x', impurityFn) });
  if (considerY) candidates.push({ feature: 'y', split: findBestSplit(points, 'y', impurityFn) });
  const valid = candidates.filter(c => c.split !== null);
  if (valid.length === 0) {
    return { feature: 'x' as const, threshold: 0, impurity, samples: points.length, prediction: leafPrediction() };
  }
  const best = valid.reduce((a, b) => (a.split!.gain >= b.split!.gain ? a : b));
  const leftPoints = points.filter(p => p[best.feature] <= best.split!.threshold);
  const rightPoints = points.filter(p => p[best.feature] > best.split!.threshold);
  return {
    feature: best.feature,
    threshold: best.split!.threshold,
    impurity,
    samples: points.length,
    left: buildTreeRF(leftPoints, depth + 1, maxDepth, impurityFn, randomSubset, rng),
    right: buildTreeRF(rightPoints, depth + 1, maxDepth, impurityFn, randomSubset, rng),
  };
}

function predictTree(node: TreeNode | undefined, x: number, y: number): 0 | 1 {
  if (!node) return 0;
  let curr: TreeNode = node;
  while (curr.prediction === undefined && (curr.left || curr.right)) {
    const val = curr.feature === 'x' ? x : y;
    curr = (val <= curr.threshold && curr.left) ? curr.left : curr.right!;
  }
  return curr.prediction ?? 0;
}

function getLeafRegions(node: TreeNode | undefined, bounds: { minX: number; maxX: number; minY: number; maxY: number }): { prediction: 0 | 1; minX: number; maxX: number; minY: number; maxY: number; }[] {
  if (!node) return [];
  if (node.prediction !== undefined) return [{ prediction: node.prediction, ...bounds }];
  if (node.feature === 'x') {
    return [
      ...getLeafRegions(node.left, { minX: bounds.minX, maxX: node.threshold, minY: bounds.minY, maxY: bounds.maxY }),
      ...getLeafRegions(node.right, { minX: node.threshold, maxX: bounds.maxX, minY: bounds.minY, maxY: bounds.maxY }),
    ];
  }
  return [
    ...getLeafRegions(node.left, { minX: bounds.minX, maxX: bounds.maxX, minY: bounds.minY, maxY: node.threshold }),
    ...getLeafRegions(node.right, { minX: bounds.minX, maxX: bounds.maxX, minY: node.threshold, maxY: bounds.maxY }),
  ];
}

function countFeatureSplits(node: TreeNode | undefined): { x: number; y: number } {
  if (!node || node.prediction !== undefined) return { x: 0, y: 0 };
  const self = node.feature === 'x' ? { x: 1, y: 0 } : { x: 0, y: 1 };
  const left = countFeatureSplits(node.left);
  const right = countFeatureSplits(node.right);
  return { x: self.x + left.x + right.x, y: self.y + left.y + right.y };
}

function countNodes(node: TreeNode | undefined): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function countLeaves(node: TreeNode | undefined): number {
  if (!node) return 0;
  if (node.prediction !== undefined) return 1;
  return countLeaves(node.left) + countLeaves(node.right);
}

function computeDepth(node: TreeNode | undefined): number {
  if (!node) return 0;
  if (node.prediction !== undefined) return 1;
  return 1 + Math.max(computeDepth(node.left), computeDepth(node.right));
}

function buildForest(
  points: ClassifiedPoint[],
  nTrees: number,
  maxDepth: number,
  maxFeatures: 'all' | 'sqrt',
  impurityFn: ImpurityFn,
): ForestResult {
  const n = points.length;
  if (n < 2) return { trees: [], leafRegions: [], cumulativeAccuracy: [], cumulativeOOB: [], oobCorrect: 0, oobTotal: 0, featureImportance: { x: 0, y: 0 }, totalNodes: 0, totalSplits: 0, perTreeAccuracy: [], perPointCorrectCount: [], treeDepth: [], treeLeafCount: [], allTreePredictions: [] };

  const randomSubset = maxFeatures === 'sqrt';
  const trees: TrainedTree[] = [];
  const cumulativeAcc: number[] = [];
  const cumulativeOOB: number[] = [];
  const totalFeatureImp = { x: 0, y: 0 };
  let totalNodesCount = 0;

  const allTreePredictions: number[][] = []; // allTreePredictions[t][i] = prediction of tree t for point i

  for (let t = 0; t < nTrees; t++) {
    const seed = t * 100 + 1;
    let rngIdx = seed;
    const rng = () => {
      rngIdx = (rngIdx * 16807 + 1) % 2147483647;
      return rngIdx / 2147483647;
    };

    const { inBag, oobMask } = bootstrapSample(points, rng);
    const baggedPoints = points.filter((_, i) => inBag[i]);

    const root = buildTreeRF(baggedPoints, 0, maxDepth, impurityFn, randomSubset, rng);
    if (!root) continue;

    trees.push({ root, inBag, oobMask });
    totalNodesCount += countNodes(root);
    totalFeatureImp.x += countFeatureSplits(root).x;
    totalFeatureImp.y += countFeatureSplits(root).y;

    const treePreds = points.map(p => predictTree(root, p.x, p.y));
    allTreePredictions.push(treePreds);

    const votes0 = new Array(n).fill(0);
    const votes1 = new Array(n).fill(0);
    for (let k = 0; k <= t; k++) {
      for (let i = 0; i < n; i++) {
        if (allTreePredictions[k][i] === 1) votes1[i]++; else votes0[i]++;
      }
    }
    let correct = 0;
    for (let i = 0; i < n; i++) {
      if ((votes1[i] >= votes0[i] ? 1 : 0) === points[i].label) correct++;
    }
    cumulativeAcc.push((correct / n) * 100);

    // OOB: for each point, predict using only trees where it was OOB
    let oobCorrect = 0, oobTotal = 0;
    for (let i = 0; i < n; i++) {
      let oobVotes0 = 0, oobVotes1 = 0;
      for (let k = 0; k <= t; k++) {
        if (trees[k].oobMask[i]) {
          if (allTreePredictions[k][i] === 1) oobVotes1++; else oobVotes0++;
        }
      }
      const oobCount = oobVotes0 + oobVotes1;
      if (oobCount > 0) {
        oobTotal++;
        if ((oobVotes1 >= oobVotes0 ? 1 : 0) === points[i].label) oobCorrect++;
      }
    }
    cumulativeOOB.push(oobTotal > 0 ? (oobCorrect / oobTotal) * 100 : 0);
  }

  // Compute leaf regions per tree
  const leafRegions = trees.map(t => getLeafRegions(t.root, { minX: 0, maxX: RANGE, minY: 0, maxY: RANGE }));

  // OOB stats for final forest
  let finalOobCorrect = 0, finalOobTotal = 0;
  for (let i = 0; i < n; i++) {
    let votes0 = 0, votes1 = 0;
    for (let t = 0; t < trees.length; t++) {
      if (trees[t].oobMask[i]) {
        if (allTreePredictions[t][i] === 1) votes1++; else votes0++;
      }
    }
    const total = votes0 + votes1;
    if (total > 0) {
      finalOobTotal++;
      if ((votes1 >= votes0 ? 1 : 0) === points[i].label) finalOobCorrect++;
    }
  }

  const totalSplits = totalFeatureImp.x + totalFeatureImp.y;

  const perTreeAccuracy: number[] = allTreePredictions.map(preds => {
    let correct = 0;
    for (let i = 0; i < n; i++) {
      if (preds[i] === points[i].label) correct++;
    }
    return (correct / n) * 100;
  });

  const perPointCorrectCount: number[] = new Array(n).fill(0);
  for (let t = 0; t < allTreePredictions.length; t++) {
    for (let i = 0; i < n; i++) {
      if (allTreePredictions[t][i] === points[i].label) perPointCorrectCount[i]++;
    }
  }

  const treeDepth: number[] = trees.map(t => computeDepth(t.root));
  const treeLeafCount: number[] = trees.map(t => countLeaves(t.root));

  return {
    trees,
    leafRegions,
    cumulativeAccuracy: cumulativeAcc,
    cumulativeOOB: cumulativeOOB,
    oobCorrect: finalOobCorrect,
    oobTotal: finalOobTotal,
    featureImportance: totalFeatureImp,
    totalNodes: totalNodesCount,
    totalSplits,
    perTreeAccuracy,
    perPointCorrectCount,
    treeDepth,
    treeLeafCount,
    allTreePredictions,
  };
}

export default function RandomForestVisualizer() {
  const [dataset, setDataset] = useState<'linear' | 'circles' | 'moons' | 'xor'>('linear');
  const [points, setPoints] = useState<ClassifiedPoint[]>(() => generateDataset('linear'));
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [nTrees, setNTrees] = useState(20);
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxFeatures, setMaxFeatures] = useState<'all' | 'sqrt'>('sqrt');
  const [mode, setMode] = useState<'add' | 'test'>('add');
  const [testPoint, setTestPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [selectedTreeIndex, setSelectedTreeIndex] = useState(0);
  const [showPointError, setShowPointError] = useState(false);
  const [showTrees, setShowTrees] = useState(false);
  const [showInBag, setShowInBag] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [showConvergence, setShowConvergence] = useState(true);
  const [showFeatureImp, setShowFeatureImp] = useState(true);

  const forest = useMemo(
    () => buildForest(points, nTrees, maxDepth, maxFeatures, calculateGini),
    [points, nTrees, maxDepth, maxFeatures]
  );

  const safeSelectedIndex = Math.min(selectedTreeIndex, Math.max(0, forest.trees.length - 1));

  const ensemblePredict = useCallback(
    (x: number, y: number): { prediction: 0 | 1; prob1: number; totalVotes: number } => {
      const trees = forest.trees;
      if (trees.length === 0) return { prediction: 0, prob1: 0, totalVotes: 0 };
      let votes1 = 0;
      for (const t of trees) {
        if (predictTree(t.root, x, y) === 1) votes1++;
      }
      const total = trees.length;
      return { prediction: votes1 >= total / 2 ? 1 : 0, prob1: votes1 / total, totalVotes: total };
    },
    [forest.trees]
  );

  const testPrediction = useMemo(() => {
    if (!testPoint) return null;
    return ensemblePredict(testPoint.x, testPoint.y);
  }, [testPoint, ensemblePredict]);

  const voteDistribution = useMemo(() => {
    if (!testPoint || forest.trees.length === 0) return null;
    const votes = forest.trees.map((t, i) => ({ treeIdx: i, pred: predictTree(t.root, testPoint.x, testPoint.y) }));
    const votes0 = votes.filter(v => v.pred === 0).length;
    const votes1 = votes.filter(v => v.pred === 1).length;
    return { votes, votes0, votes1, total: votes.length };
  }, [testPoint, forest.trees]);

  const currentAccuracy = forest.cumulativeAccuracy.length > 0
    ? forest.cumulativeAccuracy[forest.cumulativeAccuracy.length - 1]
    : 0;
  const currentOOB = forest.cumulativeOOB.length > 0
    ? forest.cumulativeOOB[forest.cumulativeOOB.length - 1]
    : 0;

  const heatmapGrid = useMemo(() => {
    const vals: number[][] = [];
    for (let gy = 0; gy < GRID; gy++) {
      vals[gy] = [];
      for (let gx = 0; gx < GRID; gx++) {
        const dx = ((gx + 0.5) / GRID) * RANGE;
        const dy = RANGE - ((gy + 0.5) / GRID) * RANGE;
        vals[gy][gx] = ensemblePredict(dx, dy).prob1;
      }
    }
    return vals;
  }, [ensemblePredict]);

  const selectedTreeBoundary = useMemo(() => {
    if (forest.trees.length === 0) return null;
    const idx = safeSelectedIndex;
    const grid: number[][] = [];
    const tree = forest.trees[idx];
    for (let gy = 0; gy < GRID; gy++) {
      grid[gy] = [];
      for (let gx = 0; gx < GRID; gx++) {
        const dx = ((gx + 0.5) / GRID) * RANGE;
        const dy = RANGE - ((gy + 0.5) / GRID) * RANGE;
        grid[gy][gx] = predictTree(tree.root, dx, dy);
      }
    }
    return grid;
  }, [forest.trees, safeSelectedIndex]);

  const selectedTreeRegions = useMemo(() => {
    if (forest.trees.length === 0) return [];
    const idx = safeSelectedIndex;
    return getLeafRegions(forest.trees[idx].root, { minX: 0, maxX: RANGE, minY: 0, maxY: RANGE });
  }, [forest.trees, safeSelectedIndex]);

  const toSVGX = (dx: number) => (dx / RANGE) * WIDTH;
  const toSVGY = (dy: number) => HEIGHT - (dy / RANGE) * HEIGHT;

  function probColor(prob1: number): string {
    if (prob1 > 0.5) {
      const s = (prob1 - 0.5) * 2;
      const r = Math.round(255 - (255 - 59) * s);
      const g = Math.round(255 - (255 - 130) * s);
      const b = Math.round(255 - (255 - 246) * s);
      return `rgb(${r},${g},${b})`;
    }
    const s = (0.5 - prob1) * 2;
    const r = Math.round(239 - (239 - 255) * s);
    const g = Math.round(68 + (255 - 68) * s);
    const b = Math.round(68 + (255 - 68) * s);
    return `rgb(${r},${g},${b})`;
  }

  function pointFillColor(p: ClassifiedPoint, i: number): string {
    if (!showPointError || forest.perPointCorrectCount.length === 0) {
      return p.label === 1 ? '#3b82f6' : '#ef4444';
    }
    const total = forest.trees.length || 1;
    const correct = forest.perPointCorrectCount[i] ?? 0;
    const ratio = correct / total;
    if (ratio >= 1) return p.label === 1 ? '#3b82f6' : '#ef4444';
    if (ratio >= 0.75) return p.label === 1 ? '#60a5fa' : '#f87171';
    return p.label === 1 ? '#93c5fd' : '#fca5a5';
  }

  function pointStrokeColor(p: ClassifiedPoint, i: number): string {
    if (!showPointError || forest.perPointCorrectCount.length === 0) return 'white';
    const total = forest.trees.length || 1;
    const correct = forest.perPointCorrectCount[i] ?? 0;
    const ratio = correct / total;
    if (ratio >= 1) return 'white';
    if (ratio >= 0.75) return '#fbbf24';
    return '#f97316';
  }

  const renderHeatmap = () => {
    const cw = WIDTH / GRID;
    const ch = HEIGHT / GRID;
    const cells: React.ReactNode[] = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        cells.push(
          <rect key={`h${gx}-${gy}`} x={gx * cw} y={gy * ch} width={cw} height={ch}
            fill={probColor(heatmapGrid[gy][gx])} />
        );
      }
    }
    return cells;
  };

  const renderSelectedTreeOverlay = () => {
    if (!showTrees || !selectedTreeBoundary) return null;
    const cw = WIDTH / GRID;
    const ch = HEIGHT / GRID;
    const cells: React.ReactNode[] = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const p = selectedTreeBoundary[gy][gx];
        cells.push(
          <rect key={`so-${gx}-${gy}`} x={gx * cw} y={gy * ch} width={cw} height={ch}
            fill={p === 1 ? '#3b82f6' : '#ef4444'} fillOpacity={0.07} />
        );
      }
    }
    return cells;
  };

  const renderSelectedTreeRegions = () => {
    if (!showTrees || selectedTreeRegions.length === 0) return null;
    return selectedTreeRegions.map((r, i) => (
      <rect key={`sr-${i}`}
        x={toSVGX(r.minX)} y={toSVGY(r.maxY)}
        width={toSVGX(r.maxX - r.minX)} height={toSVGY(r.minY - r.maxY)}
        fill={r.prediction === 1 ? '#3b82f6' : '#ef4444'}
        fillOpacity={0.04}
        stroke={r.prediction === 1 ? '#3b82f6' : '#ef4444'}
        strokeWidth={0.5} strokeOpacity={0.2} />
    ));
  };

  const renderGrid = () => {
    const els: React.ReactNode[] = [];
    for (let i = 0; i <= RANGE; i++) {
      const p = (i / RANGE) * WIDTH;
      els.push(<line key={`gv${i}`} x1={p} y1={0} x2={p} y2={HEIGHT} stroke="#e5e7eb" strokeWidth={1} />);
      els.push(<line key={`gh${i}`} x1={0} y1={p} x2={WIDTH} y2={p} stroke="#e5e7eb" strokeWidth={1} />);
      if (i % 2 === 0) {
        els.push(<text key={`lx${i}`} x={p} y={HEIGHT + 14} textAnchor="middle" fontSize={10} fill="#9ca3af">{i}</text>);
        els.push(<text key={`ly${i}`} x={-10} y={p + 4} textAnchor="end" fontSize={10} fill="#9ca3af">{RANGE - i}</text>);
      }
    }
    return els;
  };

  const renderVoteChart = () => {
    if (!showVotes || !voteDistribution || voteDistribution.total === 0) return null;
    const { votes0, votes1, total } = voteDistribution;
    const barW = 240, barH = 14;
    const w0 = votes0 > 0 ? (votes0 / total) * barW : 0;
    const w1 = votes1 > 0 ? (votes1 / total) * barW : 0;
    return (
      <div className="mt-2">
        <svg width={barW + 20} height={barH + 30} className="mx-auto">
          <text x={barW / 2 + 10} y={10} textAnchor="middle" fontSize={8} fill="#6b7280">
            {votes1}/{total} trees vote Class 1
          </text>
          <rect x={10} y={16} width={w0} height={barH} fill="#ef4444" rx={2} />
          <rect x={10 + w0} y={16} width={w1} height={barH} fill="#3b82f6" rx={2} />
          <text x={10} y={16 + barH + 12} textAnchor="start" fontSize={8} fill="#ef4444" fontWeight="bold">{votes0}</text>
          <text x={10 + barW} y={16 + barH + 12} textAnchor="end" fontSize={8} fill="#3b82f6" fontWeight="bold">{votes1}</text>
        </svg>
      </div>
    );
  };

  const renderConvergenceChart = () => {
    const acc = forest.cumulativeAccuracy;
    const oob = forest.cumulativeOOB;
    if (acc.length < 2) return null;
    const chartW = 320, chartH = 90;
    const pad = { t: 8, r: 8, b: 18, l: 30 };
    const innerW = chartW - pad.l - pad.r;
    const innerH = chartH - pad.t - pad.b;
    const len = acc.length;

    const maxVal = Math.max(100, ...acc, ...oob);
    const minVal = Math.min(0, ...acc, ...oob);
    const valRange = maxVal - minVal || 1;

    const xScale = innerW / (len - 1);
    const toPath = (data: number[]) => data.map((v, i) => {
      const x = pad.l + i * xScale;
      const y = pad.t + innerH - ((v - minVal) / valRange) * innerH;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    return (
      <svg width={chartW} height={chartH} className="w-full">
        <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke="#d1d5db" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke="#d1d5db" strokeWidth={1} />
        <path d={toPath(acc)} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
        <path d={toPath(oob)} fill="none" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={pad.l + innerW - 20} y={pad.t + 10} fontSize={7} fill="#6b7280">
          <tspan fill="#3b82f6">Train</tspan> | <tspan fill="#8b5cf6">OOB</tspan>
        </text>
        <text x={pad.l + innerW / 2} y={chartH - 2} textAnchor="middle" fontSize={7} fill="#9ca3af">Trees</text>
        <text x={4} y={pad.t + innerH / 2} textAnchor="middle" fontSize={7} fill="#9ca3af"
          transform={`rotate(-90, 6, ${pad.t + innerH / 2})`}>%</text>
      </svg>
    );
  };

  const renderFeatureImportance = () => {
    const fi = forest.featureImportance;
    const total = fi.x + fi.y || 1;
    return (
      <div className="space-y-1">
        {(['x' as const, 'y' as const]).map(f => {
          const count = fi[f];
          const pct = (count / total) * 100;
          return (
            <div key={f} className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono w-5 font-bold shrink-0 text-gray-500">{f.toUpperCase()}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${f === 'x' ? 'bg-violet-300' : 'bg-fuchsia-300'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] font-mono w-12 text-right shrink-0 text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const switchDataset = useCallback((name: 'linear' | 'circles' | 'moons' | 'xor') => {
    setDataset(name);
    setPoints(generateDataset(name));
    setTestPoint(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    if (mode === 'test') { setTestPoint({ x, y }); return; }
    setPoints(prev => [...prev, { x, y, label: activeClass }]);
  }, [activeClass, mode]);

  const handleRemovePoint = useCallback((index: number) => {
    if (mode === 'test') return;
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, [mode]);

  const handleReset = useCallback(() => {
    setPoints(generateDataset(dataset));
    setTestPoint(null);
  }, [dataset]);

  const handleRandomData = useCallback(() => {
    const names: ('linear' | 'circles' | 'moons' | 'xor')[] = ['linear', 'circles', 'moons', 'xor'];
    const name = names[Math.floor(Math.random() * 4)];
    setDataset(name);
    setPoints(generateDataset(name));
    setTestPoint(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setPoints([]);
    setTestPoint(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-1">
              {(['linear', 'circles', 'moons', 'xor'] as const).map(name => (
                <button key={name} onClick={() => switchDataset(name)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    dataset === name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{datasetLabels[name]}</button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setMode('add')}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === 'add' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>Add Data</button>
              <button onClick={() => { setMode('test'); setTestPoint(null); }}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === 'test' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>Test RF</button>
            </div>

            <div className="relative w-full max-w-[400px] aspect-square bg-white border-2 border-gray-300 rounded cursor-crosshair select-none"
              onClick={handleCanvasClick}>
              <svg width={WIDTH} height={HEIGHT} viewBox={`-20 -10 ${WIDTH + 40} ${HEIGHT + 30}`}
                className="absolute inset-0 w-full h-full">
                {renderGrid()}
                {showTrees && renderSelectedTreeOverlay()}
                {showTrees && renderSelectedTreeRegions()}
                {renderHeatmap()}

                {showInBag && forest.trees.length > 0 && forest.trees[safeSelectedIndex] && points.map((p, i) => {
                  const isOOB = forest.trees[safeSelectedIndex].oobMask[i];
                  if (!isOOB) return null;
                  return (
                    <circle key={`oob-${i}`}
                      cx={toSVGX(p.x)} cy={toSVGY(p.y)} r={10}
                      fill="none" stroke="#f59e0b" strokeWidth={1.5}
                      strokeDasharray="3,2" opacity={0.5} />
                  );
                })}

                <text x={8} y={14} fontSize={10} fontFamily="monospace" fontWeight="bold"
                  fill="#374151" opacity={0.7}>
                  {forest.trees.length} trees | p(class1) heatmap
                </text>

                {points.map((p, i) => (
                  <motion.g key={`pt-${i}`}>
                    <motion.circle
                      cx={toSVGX(p.x)} cy={toSVGY(p.y)}
                      r={hoveredPoint === i ? 8 : 6}
                      fill={pointFillColor(p, i)}
                      stroke={pointStrokeColor(p, i)}
                      strokeWidth={hoveredPoint === i || (showPointError && forest.perPointCorrectCount[i] !== forest.trees.length) ? 3 : 2}
                      style={{ cursor: mode === 'add' ? 'pointer' : 'default' }}
                      onClick={(e) => { e.stopPropagation(); if (mode === 'add') handleRemovePoint(i); }}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {hoveredPoint === i && (
                      <g>
                        <rect x={toSVGX(p.x) + 12} y={toSVGY(p.y) - 8} width={115} height={22} rx={4}
                          fill="white" stroke="#d1d5db" strokeWidth={1} opacity={0.95} />
                        <text x={toSVGX(p.x) + 16} y={toSVGY(p.y) + 6}
                          fontSize={9} fontFamily="monospace" fill="#374151">
                          ({p.x.toFixed(1)},{p.y.toFixed(1)})
                          {forest.perPointCorrectCount[i] !== undefined && ` ${forest.perPointCorrectCount[i]}/${forest.trees.length} trees`}
                        </text>
                      </g>
                    )}
                  </motion.g>
                ))}

                {testPoint && testPrediction && (
                  <g>
                    <circle cx={toSVGX(testPoint.x)} cy={toSVGY(testPoint.y)} r={8}
                      fill="none" stroke="#10b981" strokeWidth={3} />
                    <circle cx={toSVGX(testPoint.x)} cy={toSVGY(testPoint.y)} r={3} fill="#10b981" />
                    <rect x={toSVGX(testPoint.x) + 14} y={toSVGY(testPoint.y) - 14}
                      width={110} height={28} rx={4}
                      fill="white" stroke="#10b981" strokeWidth={1} opacity={0.95} />
                    <text x={toSVGX(testPoint.x) + 18} y={toSVGY(testPoint.y) - 2}
                      fontSize={9} fontFamily="monospace" fill="#059669" fontWeight="bold">
                      Class {testPrediction.prediction} (p={testPrediction.prob1.toFixed(2)})
                    </text>
                    <text x={toSVGX(testPoint.x) + 18} y={toSVGY(testPoint.y) + 10}
                      fontSize={8} fontFamily="monospace" fill="#6b7280">
                      {testPrediction.totalVotes} trees
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {mode === 'add' && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setActiveClass(1)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeClass === 1 ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>Class 1 (Blue)</button>
                <button onClick={() => setActiveClass(0)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeClass === 0 ? 'bg-red-600 text-white ring-2 ring-red-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>Class 0 (Red)</button>
                <button onClick={handleRandomData}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors">Random</button>
                <button onClick={handleClearAll}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors">Clear</button>
                <button onClick={handleReset}
                  className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-900 transition-colors">Reset</button>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowPointError(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showPointError ? 'bg-orange-600 text-white ring-2 ring-orange-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                }`}>Error coloring</button>
              <button onClick={() => setShowTrees(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showTrees ? 'bg-violet-600 text-white ring-2 ring-violet-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                }`}>Show Tree #{safeSelectedIndex + 1}</button>
              <button onClick={() => setShowInBag(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showInBag ? 'bg-amber-600 text-white ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                }`}>In-bag/OOB</button>
            </div>

            {mode === 'test' && (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-500 italic">
                  Click the canvas to test the ensemble prediction at any point.
                </p>
                {testPoint && (
                  <button onClick={() => setTestPoint(null)}
                    className="shrink-0 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">Clear</button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Forest Configuration</h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs text-gray-500">
                    Trees: <span className="font-mono font-semibold text-gray-700">{nTrees}</span>
                  </label>
                  <input type="range" min={1} max={80} step={1} value={nTrees}
                    onChange={(e) => { setNTrees(parseInt(e.target.value)); setTestPoint(null); }}
                    className="w-full mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    Max Depth: <span className="font-mono font-semibold text-gray-700">{maxDepth}</span>
                  </label>
                  <input type="range" min={1} max={6} step={1} value={maxDepth}
                    onChange={(e) => { setMaxDepth(parseInt(e.target.value)); setTestPoint(null); }}
                    className="w-full mt-0.5" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Stumps</span><span>Deep</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Max Features</p>
                  <div className="flex gap-2">
                    <button onClick={() => setMaxFeatures('all')}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-colors ${
                        maxFeatures === 'all' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200'
                      }`}>All</button>
                    <button onClick={() => setMaxFeatures('sqrt')}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-colors ${
                        maxFeatures === 'sqrt' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200'
                      }`}>Random (√p)</button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {maxFeatures === 'all' ? 'Trees see both features — less diversity' : 'Each split sees 1 random feature — more diversity'}
                  </p>
                </div>
              </div>
            </div>

            {forest.trees.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2 text-gray-700">Tree Browser</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">
                      Tree #{safeSelectedIndex + 1} of {forest.trees.length}
                    </label>
                    <input type="range" min={0} max={Math.max(0, forest.trees.length - 1)} step={1}
                      value={safeSelectedIndex}
                      onChange={(e) => setSelectedTreeIndex(parseInt(e.target.value))}
                      className="w-full mt-0.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-gray-50 rounded p-2">
                    <div className="flex justify-between"><span className="text-gray-500">Accuracy:</span>
                      <span className="font-mono font-medium">{forest.perTreeAccuracy[safeSelectedIndex]?.toFixed(1) ?? '—'}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Nodes:</span>
                      <span className="font-mono">{forest.treeDepth.length > 0 ? '' : '—'}{forest.trees[safeSelectedIndex] && countNodes(forest.trees[safeSelectedIndex].root)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Depth:</span>
                      <span className="font-mono">{forest.treeDepth[safeSelectedIndex] ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Leaves:</span>
                      <span className="font-mono">{forest.treeLeafCount[safeSelectedIndex] ?? '—'}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-gray-500">In-bag:</span>
                      <span className="font-mono">{forest.trees[safeSelectedIndex]?.inBag.filter(Boolean).length ?? 0}/{points.length}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-gray-500">OOB:</span>
                      <span className="font-mono">{forest.trees[safeSelectedIndex]?.oobMask.filter(Boolean).length ?? 0}/{points.length}</span></div>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Scores</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Trees:</span><span className="font-mono font-medium">{forest.trees.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Training:</span><span className={`font-mono font-bold ${currentAccuracy >= 100 ? 'text-emerald-600' : currentAccuracy >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{currentAccuracy.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Nodes:</span><span className="font-mono">{forest.totalNodes}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">OOB:</span><span className={`font-mono font-bold ${currentOOB >= 100 ? 'text-emerald-600' : currentOOB >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{forest.oobTotal > 0 ? `${currentOOB.toFixed(1)}%` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Splits:</span><span className="font-mono">{forest.totalSplits}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Data:</span><span className="font-mono">{points.length} pts</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Nodes/Tree:</span><span className="font-mono">{forest.trees.length > 0 ? (forest.totalNodes / forest.trees.length).toFixed(1) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tree #1:</span><span className="font-mono">{forest.perTreeAccuracy.length > 0 ? `${forest.perTreeAccuracy[0].toFixed(1)}%` : '—'}</span></div>
                {forest.perTreeAccuracy.length > 1 && (
                  <div className="flex justify-between"><span className="text-gray-500">Gain:</span><span className={`font-mono font-medium ${currentAccuracy - forest.perTreeAccuracy[0] > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>+{(currentAccuracy - forest.perTreeAccuracy[0]).toFixed(1)}%</span></div>
                )}
              </div>
            </div>

            {forest.trees.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-semibold text-sm text-gray-700">Convergence</h3>
                  <button onClick={() => setShowConvergence(v => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      showConvergence ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{showConvergence ? 'Hide' : 'Show'}</button>
                </div>
                {showConvergence && (
                  <>
                    {renderConvergenceChart()}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Blue = training accuracy, Purple = OOB estimate.
                      {forest.cumulativeAccuracy.length > 2 && forest.cumulativeAccuracy[forest.cumulativeAccuracy.length - 1] > forest.cumulativeAccuracy[0] + 5
                        ? ' Ensemble improves with more trees.'
                        : forest.cumulativeAccuracy.length > 2 && forest.cumulativeAccuracy[forest.cumulativeAccuracy.length - 1] <= forest.cumulativeAccuracy[0] + 5
                          ? ' Accuracy plateaus — diminishing returns.'
                          : ''}
                    </p>
                  </>
                )}
              </div>
            )}

            {forest.totalSplits > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-semibold text-sm text-gray-700">Feature Importance</h3>
                  <button onClick={() => setShowFeatureImp(v => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      showFeatureImp ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{showFeatureImp ? 'Hide' : 'Show'}</button>
                </div>
                {showFeatureImp && (
                  <>
                    {renderFeatureImportance()}
                    <p className="text-[10px] text-gray-400 mt-1">
                      How often each feature is used for splitting across all trees. Higher = more discriminative.
                    </p>
                  </>
                )}
              </div>
            )}

            {mode === 'test' && testPrediction && testPoint && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-emerald-800">Test Result</h3>
                  <button onClick={() => setShowVotes(v => !v)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      showVotes ? 'bg-emerald-600 text-white' : 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300'
                    }`}>Votes</button>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Predicted:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${testPrediction.prediction === 1 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      Class {testPrediction.prediction}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">P(Class 1):</span>
                    <span className="font-mono">{testPrediction.prob1.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ensemble vote:</span>
                    <span className="font-mono">{Math.round(testPrediction.prob1 * testPrediction.totalVotes)} / {testPrediction.totalVotes}</span>
                  </div>
                  {renderVoteChart()}
                </div>
              </div>
            )}

            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors select-none font-medium">
                How Random Forest works
              </summary>
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg space-y-2 text-xs">
                <p><strong>Bagging</strong>: Each tree trains on a bootstrap sample (sampled with replacement, ~63% of points). The remaining ~37% are <strong>out-of-bag (OOB)</strong> and serve as a built-in validation set.</p>
                <p><strong>Random feature selection</strong>: With <strong>Random (√p)</strong>, each split considers only 1 random feature. This decorrelates trees so the ensemble reduces variance.</p>
                <p><strong>Ensemble prediction</strong>: All trees vote. The probability heatmap shows the fraction of trees voting for class 1 (blue). White = 50/50 tie.</p>
                <p>The <strong>convergence chart</strong> shows how accuracy improves with more trees. Blue = training accuracy, purple = OOB estimate.</p>
                <p><strong>Tree Browser</strong>: Select a tree to see its individual boundary (faint overlay) and stats. Toggle <strong>In-bag/OOB</strong> to see which points this tree trained on (normal) vs which are OOB (amber circles).</p>
                <p><strong>Error mode</strong>: Colors points by ensemble agreement — white/gold = all trees agree, orange = split. The <strong>Votes</strong> button shows a vote distribution bar chart for any test point.</p>
                <p><strong>Ensemble gain</strong>: Compare Tree #1 accuracy vs the full forest in the Performance panel. The difference is the benefit of bagging.</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
