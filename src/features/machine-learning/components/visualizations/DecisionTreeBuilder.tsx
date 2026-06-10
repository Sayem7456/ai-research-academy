'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  findBestSplit,
  calculateGini,
  calculateEntropy,
  calculateMisclassification,
  type ImpurityFn,
  type ClassifiedPoint,
} from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

type TreeNode = {
  feature: 'x' | 'y';
  threshold: number;
  impurity: number;
  gain?: number;
  samples: number;
  left?: TreeNode;
  right?: TreeNode;
  prediction?: 0 | 1;
};

type LeafRegion = {
  prediction: 0 | 1;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  samples: number;
};

type PathStep = {
  feature: 'x' | 'y';
  threshold: number;
  decision: '≤' | '>';
};

type TestPrediction = {
  prediction: 0 | 1;
  path: PathStep[];
};

const IMPURITY_LABELS: Record<string, { fn: ImpurityFn; label: string; abbr: string; desc: string }> = {
  gini: { fn: calculateGini, label: 'Gini', abbr: 'G', desc: 'Gini impurity' },
  entropy: { fn: calculateEntropy, label: 'Entropy', abbr: 'H', desc: 'Information entropy' },
  misclassification: { fn: calculateMisclassification, label: 'Misclassification', abbr: 'M', desc: 'Misclassification error' },
};

function buildTree(
  points: ClassifiedPoint[],
  depth = 0,
  maxDepth = 3,
  impurityFn: ImpurityFn = calculateGini
): TreeNode | undefined {
  if (points.length === 0) return undefined;

  const labels = points.map(p => p.label);
  const impurity = impurityFn(labels);

  if (depth >= maxDepth || impurity === 0 || points.length < 2) {
    const sum = labels.reduce((a: number, b) => a + b, 0);
    const prediction = (sum >= labels.length / 2 ? 1 : 0) as 0 | 1;
    return { feature: 'x' as const, threshold: 0, impurity, samples: points.length, prediction };
  }

  const splitX = findBestSplit(points, 'x', impurityFn);
  const splitY = findBestSplit(points, 'y', impurityFn);

  if (!splitX && !splitY) {
    const sum = labels.reduce((a: number, b: number) => a + b, 0);
    const prediction = (sum >= labels.length / 2 ? 1 : 0) as 0 | 1;
    return { feature: 'x' as const, threshold: 0, impurity, samples: points.length, prediction };
  }

  const bestSplit = (!splitY || (splitX && splitX.gain > splitY.gain))
    ? { feature: 'x' as const, ...splitX! }
    : { feature: 'y' as const, ...splitY! };

  const leftPoints = points.filter(p => p[bestSplit.feature] <= bestSplit.threshold);
  const rightPoints = points.filter(p => p[bestSplit.feature] > bestSplit.threshold);

  return {
    feature: bestSplit.feature,
    threshold: bestSplit.threshold,
    impurity,
    gain: bestSplit.gain,
    samples: points.length,
    left: buildTree(leftPoints, depth + 1, maxDepth, impurityFn),
    right: buildTree(rightPoints, depth + 1, maxDepth, impurityFn),
  };
}

function predictPoint(node: TreeNode | undefined, x: number, y: number): TestPrediction | null {
  if (!node) return null;
  const path: PathStep[] = [];
  let current = node;
  while (current && current.prediction === undefined) {
    const value = current.feature === 'x' ? x : y;
    const decision = value <= current.threshold ? '≤' as const : '>' as const;
    path.push({ feature: current.feature, threshold: current.threshold, decision });
    current = value <= current.threshold ? current.left! : current.right!;
  }
  if (!current || current.prediction === undefined) return null;
  return { prediction: current.prediction, path };
}

function getLeafRegions(
  node: TreeNode | undefined,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): LeafRegion[] {
  if (!node) return [];
  if (node.prediction !== undefined) {
    return [{ prediction: node.prediction, ...bounds, samples: node.samples }];
  }
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

const countNodes = (node: TreeNode | undefined): number => {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
};

const countLeaves = (node: TreeNode | undefined): number => {
  if (!node) return 0;
  if (node.prediction !== undefined) return 1;
  return countLeaves(node.left) + countLeaves(node.right);
};

function countFeatureSplits(node: TreeNode | undefined): { x: number; y: number } {
  if (!node || node.prediction !== undefined) return { x: 0, y: 0 };
  const self = node.feature === 'x' ? { x: 1, y: 0 } : { x: 0, y: 1 };
  const left = countFeatureSplits(node.left);
  const right = countFeatureSplits(node.right);
  return { x: self.x + left.x + right.x, y: self.y + left.y + right.y };
}

function findLeafRegion(regions: LeafRegion[], x: number, y: number): LeafRegion | undefined {
  return regions.find(r => x >= r.minX && x <= r.maxX && y >= r.minY && y <= r.maxY);
}

export default function DecisionTreeBuilder() {
  const [points, setPoints] = useState<ClassifiedPoint[]>([
    { x: 2, y: 7, label: 1 },
    { x: 3, y: 8, label: 1 },
    { x: 7, y: 2, label: 0 },
    { x: 8, y: 3, label: 0 },
  ]);
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [maxDepth, setMaxDepth] = useState(2);
  const [buildStep, setBuildStep] = useState(2);
  const [impurityKey, setImpurityKey] = useState<string>('gini');
  const [mode, setMode] = useState<'add' | 'test'>('add');
  const [testPoint, setTestPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const impurityFn = IMPURITY_LABELS[impurityKey].fn;
  const effectiveDepth = Math.min(buildStep, maxDepth);

  const tree = useMemo(
    () => buildTree(points, 0, effectiveDepth, impurityFn),
    [points, effectiveDepth, impurityFn]
  );

  const regions = useMemo(
    () => getLeafRegions(tree, { minX: 0, maxX: RANGE, minY: 0, maxY: RANGE }),
    [tree]
  );

  const prediction = useMemo(
    () => (testPoint ? predictPoint(tree, testPoint.x, testPoint.y) : null),
    [tree, testPoint]
  );

  const highlightedRegion = useMemo(
    () => (testPoint ? findLeafRegion(regions, testPoint.x, testPoint.y) : undefined),
    [regions, testPoint]
  );

  const featureImportance = useMemo(() => countFeatureSplits(tree), [tree]);

  const accuracyAtDepths = useMemo(() => {
    if (points.length === 0) return [];
    const result: { depth: number; acc: number }[] = [];
    for (let d = 1; d <= maxDepth; d++) {
      const t = buildTree(points, 0, d, impurityFn);
      const correct = points.filter(p => {
        const pred = predictPoint(t, p.x, p.y);
        return pred !== null && pred.prediction === p.label;
      }).length;
      result.push({ depth: d, acc: (correct / points.length) * 100 });
    }
    return result;
  }, [points, maxDepth, impurityFn]);

  const currentAccuracy = accuracyAtDepths.length > 0
    ? accuracyAtDepths[accuracyAtDepths.length - 1].acc
    : 0;

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * RANGE;
      const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;

      if (mode === 'test') {
        setTestPoint({ x, y });
        return;
      }
      setPoints(prev => [...prev, { x, y, label: activeClass }]);
    },
    [activeClass, mode]
  );

  const handleRemovePoint = useCallback(
    (index: number) => {
      if (mode === 'test') return;
      setPoints(prev => prev.filter((_, i) => i !== index));
    },
    [mode]
  );

  const toSVGX = (dataX: number) => (dataX / RANGE) * WIDTH;
  const toSVGY = (dataY: number) => HEIGHT - (dataY / RANGE) * HEIGHT;

  const renderGrid = () => {
    const ticks: React.ReactNode[] = [];
    for (let i = 0; i <= RANGE; i++) {
      const pos = (i / RANGE) * WIDTH;
      ticks.push(
        <line key={`gv${i}`} x1={pos} y1={0} x2={pos} y2={HEIGHT} stroke="#e5e7eb" strokeWidth={1} />
      );
      ticks.push(
        <line key={`gh${i}`} x1={0} y1={pos} x2={WIDTH} y2={pos} stroke="#e5e7eb" strokeWidth={1} />
      );
      if (i % 2 === 0) {
        ticks.push(
          <text key={`lx${i}`} x={pos} y={HEIGHT + 14} textAnchor="middle" fontSize={10} fill="#9ca3af">
            {i}
          </text>
        );
        ticks.push(
          <text key={`ly${i}`} x={-10} y={pos + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
            {RANGE - i}
          </text>
        );
      }
    }
    return ticks;
  };

  const renderLeafRegions = () => {
    return regions.map((r, i) => {
      const isHighlighted =
        highlightedRegion &&
        highlightedRegion.minX === r.minX &&
        highlightedRegion.maxX === r.maxX &&
        highlightedRegion.minY === r.minY &&
        highlightedRegion.maxY === r.maxY;
      return (
        <rect
          key={`region-${i}`}
          x={toSVGX(r.minX)}
          y={toSVGY(r.maxY)}
          width={toSVGX(r.maxX - r.minX)}
          height={toSVGY(r.minY - r.maxY)}
          fill={r.prediction === 1 ? '#3b82f6' : '#ef4444'}
          fillOpacity={isHighlighted ? 0.3 : 0.12}
          stroke={r.prediction === 1 ? '#3b82f6' : '#ef4444'}
          strokeWidth={isHighlighted ? 2 : 0.5}
          strokeOpacity={0.5}
        />
      );
    });
  };

  const renderSplitLines = (
    node: TreeNode | undefined,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): React.ReactNode[] => {
    if (!node || node.prediction !== undefined) return [];

    const elements: React.ReactNode[] = [];
    const { minX, maxX, minY, maxY } = bounds;

    if (node.feature === 'x') {
      const x = toSVGX(node.threshold);
      elements.push(
        <line
          key={`split-${node.threshold.toFixed(2)}-x`}
          x1={x}
          y1={toSVGY(maxY)}
          x2={x}
          y2={toSVGY(minY)}
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeDasharray="5"
        />
      );
      if (node.left) elements.push(...renderSplitLines(node.left, { minX, maxX: node.threshold, minY, maxY }));
      if (node.right) elements.push(...renderSplitLines(node.right, { minX: node.threshold, maxX, minY, maxY }));
    } else {
      const y = toSVGY(node.threshold);
      elements.push(
        <line
          key={`split-${node.threshold.toFixed(2)}-y`}
          x1={toSVGX(minX)}
          y1={y}
          x2={toSVGX(maxX)}
          y2={y}
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeDasharray="5"
        />
      );
      if (node.left) elements.push(...renderSplitLines(node.left, { minX, maxX, minY, maxY: node.threshold }));
      if (node.right) elements.push(...renderSplitLines(node.right, { minX, maxX, minY: node.threshold, maxY }));
    }
    return elements;
  };

  const renderTreeSVG = (
    node: TreeNode | undefined,
    x: number,
    y: number,
    availW: number,
    depth: number,
    testX?: number,
    testY?: number
  ): React.ReactNode[] => {
    if (!node) return [];
    const elements: React.ReactNode[] = [];

    const isLeaf = node.prediction !== undefined;
    const nw = Math.min(availW, 100);
    const nh = 54;
    const rx = 4;
    const label = IMPURITY_LABELS[impurityKey].abbr;

    const isHighlighted =
      testX !== undefined &&
      testY !== undefined &&
      isLeaf &&
      (() => {
        const r = findLeafRegion(regions, testX, testY);
        return r && r.samples === node.samples;
      })();

    let chosenChild: 'left' | 'right' | null = null;
    if (!isLeaf && testX !== undefined && testY !== undefined) {
      const val = node.feature === 'x' ? testX : testY;
      chosenChild = val <= node.threshold ? 'left' : 'right';
    }

    elements.push(
      <g key={`tn-${depth}-${x}`}>
        <rect
          x={x - nw / 2}
          y={y}
          width={nw}
          height={nh}
          rx={rx}
          fill={isLeaf ? (node.prediction === 1 ? '#eff6ff' : '#fef2f2') : '#f5f3ff'}
          stroke={
            isHighlighted
              ? '#10b981'
              : isLeaf
                ? node.prediction === 1
                  ? '#3b82f6'
                  : '#ef4444'
                : '#8b5cf6'
          }
          strokeWidth={isHighlighted ? 2.5 : 1.5}
        />
        <text x={x} y={y + 14} textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#374151">
          {isLeaf ? `Class ${node.prediction}` : `${node.feature} < ${node.threshold.toFixed(1)}`}
        </text>
        {isLeaf ? (
          <text x={x} y={y + 28} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#6b7280">
            {label}={node.impurity.toFixed(3)}
          </text>
        ) : (
          <>
            <text x={x} y={y + 26} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#6b7280">
              {label}={node.impurity.toFixed(3)}
            </text>
            <text x={x} y={y + 37} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#059669">
              {node.impurity === 0 || node.prediction !== undefined ? '' : `Δ=${node.gain?.toFixed(3) ?? '—'}`}
            </text>
          </>
        )}
        <text x={x} y={y + nh - 3} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#9ca3af">
          n={node.samples}
        </text>
      </g>
    );

    if (node.left || node.right) {
      const childY = y + 96;
      const childAvail = availW / 2;
      const leftX = x - childAvail / 2;
      const rightX = x + childAvail / 2;

      if (node.left) {
        const isChosen = chosenChild === 'left';
        elements.push(
          <line
            key={`line-${depth}-l`}
            x1={x}
            y1={y + nh}
            x2={leftX}
            y2={childY}
            stroke={isChosen ? '#10b981' : '#c4b5fd'}
            strokeWidth={isChosen ? 2.5 : 1}
          />
        );
      }
      if (node.right) {
        const isChosen = chosenChild === 'right';
        elements.push(
          <line
            key={`line-${depth}-r`}
            x1={x}
            y1={y + nh}
            x2={rightX}
            y2={childY}
            stroke={isChosen ? '#10b981' : '#c4b5fd'}
            strokeWidth={isChosen ? 2.5 : 1}
          />
        );
      }

      if (node.left)
        elements.push(...renderTreeSVG(node.left, leftX, childY, childAvail, depth + 1, testX, testY));
      if (node.right)
        elements.push(...renderTreeSVG(node.right, rightX, childY, childAvail, depth + 1, testX, testY));
    }

    return elements;
  };

  const treeDepth = (() => {
    if (!tree) return 0;
    let d = 0;
    let n: TreeNode | undefined = tree;
    while (n && n.prediction === undefined) {
      d++;
      n = n.left;
    }
    return d;
  })();

  const treeSVGHeight = Math.max(100, (treeDepth + 1) * 96 + 20);
  const treeSVGWidth = Math.max(300, Math.min(800, Math.pow(2, treeDepth) * 60));

  const maxImpurity = (() => {
    const labels = points.map(p => p.label);
    return labels.length > 0 ? impurityFn(labels) : 0;
  })();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex gap-2 mb-1">
              <button
                onClick={() => setMode('add')}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === 'add' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Add Data
              </button>
              <button
                onClick={() => {
                  setMode('test');
                  setTestPoint(null);
                }}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === 'test' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Test Tree
              </button>
            </div>

            <div
              className="relative w-full max-w-[400px] aspect-square bg-white border-2 border-gray-300 rounded cursor-crosshair select-none"
              onClick={handleCanvasClick}
            >
              <svg
                width={WIDTH}
                height={HEIGHT}
                viewBox={`-20 -10 ${WIDTH + 40} ${HEIGHT + 30}`}
                className="absolute inset-0 w-full h-full"
              >
                {renderGrid()}
                {renderLeafRegions()}
                {tree && renderSplitLines(tree, { minX: 0, maxX: RANGE, minY: 0, maxY: RANGE })}

                {points.map((p, i) => (
                  <motion.g key={`pt-${i}`}>
                    <circle
                      cx={toSVGX(p.x)}
                      cy={toSVGY(p.y)}
                      r={hoveredPoint === i ? 8 : 6}
                      fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: mode === 'add' ? 'pointer' : 'default' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === 'add') handleRemovePoint(i);
                      }}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {hoveredPoint === i && (
                      <text
                        x={toSVGX(p.x) + 12}
                        y={toSVGY(p.y) + 4}
                        fontSize={10}
                        fontFamily="monospace"
                        fill="#374151"
                      >
                        ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                      </text>
                    )}
                  </motion.g>
                ))}

                {testPoint && (
                  <g>
                    <circle
                      cx={toSVGX(testPoint.x)}
                      cy={toSVGY(testPoint.y)}
                      r={8}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                    <circle cx={toSVGX(testPoint.x)} cy={toSVGY(testPoint.y)} r={3} fill="#10b981" />
                    <text
                      x={toSVGX(testPoint.x) + 14}
                      y={toSVGY(testPoint.y) + 4}
                      fontSize={10}
                      fontFamily="monospace"
                      fill="#059669"
                      fontWeight="bold"
                    >
                      Test: ({testPoint.x.toFixed(1)}, {testPoint.y.toFixed(1)})
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {mode === 'add' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveClass(1)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeClass === 1 ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Class 1 (Blue)
                </button>
                <button
                  onClick={() => setActiveClass(0)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeClass === 0 ? 'bg-red-600 text-white ring-2 ring-red-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Class 0 (Red)
                </button>
                <button
                  onClick={() => {
                    setPoints([]);
                    setTestPoint(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}

            {mode === 'test' && (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-500 italic">
                  Click the canvas to place a test point and trace the decision path.
                </p>
                {testPoint && (
                  <button
                    onClick={() => setTestPoint(null)}
                    className="shrink-0 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Model Configuration</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Impurity Measure</p>
                  <div className="flex gap-2">
                    {Object.entries(IMPURITY_LABELS).map(([key, { label, desc }]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setImpurityKey(key);
                          setTestPoint(null);
                        }}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-colors ${
                          impurityKey === key ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200'
                        }`}
                        title={desc}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Max Depth: <span className="font-mono font-medium text-gray-700">{maxDepth}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={maxDepth}
                    onChange={(e) => {
                      setMaxDepth(parseInt(e.target.value));
                      setBuildStep(Math.min(buildStep, parseInt(e.target.value)));
                      setTestPoint(null);
                    }}
                    className="w-full mt-0.5"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Build Step: <span className="font-mono font-medium text-gray-700">{buildStep}</span>
                    <span className="text-gray-400 ml-1">/ {maxDepth}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={maxDepth}
                    step={1}
                    value={buildStep}
                    onChange={(e) => {
                      setBuildStep(parseInt(e.target.value));
                      setTestPoint(null);
                    }}
                    className="w-full mt-0.5"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {buildStep === 0
                      ? 'Root only — no splits yet.'
                      : buildStep < maxDepth
                        ? `${buildStep} of ${maxDepth} levels shown.`
                        : 'Full tree shown.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5">Tree Stats</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nodes:</span>
                    <span className="font-mono font-medium">{tree ? countNodes(tree) : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Leaves:</span>
                    <span className="font-mono font-medium">{tree ? countLeaves(tree) : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Depth:</span>
                    <span className="font-mono font-medium">{effectiveDepth} / {maxDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Root {IMPURITY_LABELS[impurityKey].abbr}:</span>
                    <span className="font-mono font-medium">{tree ? tree.impurity.toFixed(3) : '0.000'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5">Data</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points:</span>
                    <span className="font-mono font-medium">{points.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Class 0:</span>
                    <span className="font-mono font-medium text-red-600">{points.filter(p => p.label === 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Class 1:</span>
                    <span className="font-mono font-medium text-blue-600">{points.filter(p => p.label === 1).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Regions:</span>
                    <span className="font-mono font-medium">{regions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Accuracy by Depth</p>
                  {accuracyAtDepths.length === 0 ? (
                    <p className="text-xs text-gray-400">Add points to see accuracy.</p>
                  ) : (
                    <div className="space-y-1">
                      {accuracyAtDepths.map(({ depth, acc }) => {
                        const isCurrent = depth === effectiveDepth;
                        return (
                          <div key={`acc-${depth}`} className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-mono w-14 shrink-0 ${isCurrent ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                              d={depth}:
                            </span>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  acc >= 100 ? 'bg-emerald-400' : acc >= 75 ? 'bg-amber-300' : 'bg-red-300'
                                }`}
                                style={{ width: `${acc}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-mono w-8 text-right ${isCurrent ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                              {acc.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {points.length > 0 && effectiveDepth < maxDepth && currentAccuracy < 100 && (
                    <p className="text-[11px] text-amber-600 mt-1">Accuracy grows with depth. Deeper → overfitting risk.</p>
                  )}
                  {points.length > 0 && currentAccuracy >= 100 && effectiveDepth < maxDepth && (
                    <p className="text-[11px] text-emerald-600 mt-1">Perfect at depth {effectiveDepth}. Further depth may memorize noise.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Feature Importance</p>
                  {featureImportance.x + featureImportance.y === 0 ? (
                    <p className="text-xs text-gray-400">No splits yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(['x', 'y'] as const).map(f => {
                        const count = featureImportance[f];
                        const total = featureImportance.x + featureImportance.y;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={f} className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono w-5 font-bold shrink-0 text-gray-500">{f.toUpperCase()}</span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${f === 'x' ? 'bg-violet-300' : 'bg-fuchsia-300'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono w-14 text-right shrink-0 text-gray-500">
                              {count} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {mode === 'test' && prediction && testPoint && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-2 text-emerald-800">Prediction</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">Predicted:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      prediction.prediction === 1 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    Class {prediction.prediction}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Decision path:</span>
                  <div className="mt-1 ml-2 font-mono text-[11px] text-gray-500 space-y-0.5">
                    {prediction.path.map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="text-purple-500">→</span>
                        <span>{step.feature} {step.decision} {step.threshold.toFixed(1)}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 font-medium text-emerald-600">
                      <span>→</span>
                      <span>Class {prediction.prediction}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Tree Structure</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-auto" style={{ maxHeight: '400px' }}>
            <svg
              width={treeSVGWidth}
              height={treeSVGHeight}
              viewBox={`0 0 ${treeSVGWidth} ${treeSVGHeight}`}
              className="min-w-[300px]"
            >
              {tree &&
                renderTreeSVG(
                  tree,
                  treeSVGWidth / 2,
                  8,
                  treeSVGWidth,
                  0,
                  testPoint?.x,
                  testPoint?.y
                )}
            </svg>
          </div>
        </div>

        <details className="mt-4 group">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors select-none">
            How it works
          </summary>
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Add blue/red training points, then set tree depth to see splits</li>
              <li>Purple dashed lines show decision boundaries based on impurity</li>
              <li>Switch between <strong>Gini</strong>, <strong>Entropy</strong>, or <strong>Misclassification</strong> to see how the choice affects splits</li>
              <li>Use the <strong>Build Step</strong> slider to grow the tree one level at a time</li>
              <li>Colored leaf regions show each region&apos;s predicted class</li>
              <li>Watch training accuracy converge to 100% as depth increases (overfitting!)</li>
              <li>Use <strong>Test Tree</strong> to click anywhere and trace the full decision path</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
