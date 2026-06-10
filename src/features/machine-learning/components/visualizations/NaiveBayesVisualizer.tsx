'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  trainGaussianNB,
  computeNBPosterior,
  gaussianNBAccuracy,
  gaussianNBConfusion,
  generateDataset,
  type ClassifiedPoint,
} from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;
const GRID = 36;

const datasetLabels: Record<string, string> = {
  linear: 'Linear',
  circles: 'Circles',
  moons: 'Moons',
  xor: 'XOR',
};

const toSVGX = (dx: number) => (dx / RANGE) * WIDTH;
const toSVGY = (dy: number) => HEIGHT - (dy / RANGE) * HEIGHT;

function getEllipsePoints(
  cx: number, cy: number,
  sx: number, sy: number,
  k: number, steps: number = 48
): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const x = toSVGX(cx + k * sx * Math.cos(t));
    const y = toSVGY(cy + k * sy * Math.sin(t));
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

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

function renderGrid() {
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
}

export default function NaiveBayesVisualizer() {
  const [dataset, setDataset] = useState<'linear' | 'circles' | 'moons' | 'xor'>('linear');
  const [points, setPoints] = useState<ClassifiedPoint[]>(() => generateDataset('linear'));
  const [activeClass, setActiveClass] = useState<0 | 1>(1);
  const [mode, setMode] = useState<'add' | 'test'>('add');
  const [testPoint, setTestPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [showEllipses, setShowEllipses] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBothContours, setShowBothContours] = useState(true);

  const model = useMemo(() => trainGaussianNB(points), [points]);

  const heatmapGrid = useMemo(() => {
    const vals: number[][] = [];
    for (let gy = 0; gy < GRID; gy++) {
      vals[gy] = [];
      for (let gx = 0; gx < GRID; gx++) {
        const dx = ((gx + 0.5) / GRID) * RANGE;
        const dy = RANGE - ((gy + 0.5) / GRID) * RANGE;
        vals[gy][gx] = computeNBPosterior(model, dx, dy).prob1;
      }
    }
    return vals;
  }, [model]);

  const boundaryPath = useMemo(() => {
    if (!showBoundary) return null;
    const segments: string[] = [];
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID - 1; gx++) {
        const v1 = heatmapGrid[gy][gx];
        const v2 = heatmapGrid[gy][gx + 1];
        if ((v1 < 0.5 && v2 >= 0.5) || (v1 >= 0.5 && v2 < 0.5)) {
          const t = (0.5 - v1) / (v2 - v1);
          const x = ((gx + 0.5 + t) / GRID) * RANGE;
          const y = RANGE - ((gy + 0.5) / GRID) * RANGE;
          segments.push(`M${toSVGX(x).toFixed(1)},${toSVGY(y).toFixed(1)}`);
        }
      }
    }
    for (let gy = 0; gy < GRID - 1; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const v1 = heatmapGrid[gy][gx];
        const v2 = heatmapGrid[gy + 1][gx];
        if ((v1 < 0.5 && v2 >= 0.5) || (v1 >= 0.5 && v2 < 0.5)) {
          const t = (0.5 - v1) / (v2 - v1);
          const x = ((gx + 0.5) / GRID) * RANGE;
          const y = RANGE - (((gy + 0.5 + t) / GRID) * RANGE);
          segments.push(`M${toSVGX(x).toFixed(1)},${toSVGY(y).toFixed(1)}`);
        }
      }
    }
    return segments.join(' ');
  }, [heatmapGrid, showBoundary]);

  const renderHeatmap = () => {
    if (!showHeatmap) return null;
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

  const testPrediction = useMemo(() => {
    if (!testPoint) return null;
    return computeNBPosterior(model, testPoint.x, testPoint.y);
  }, [testPoint, model]);

  const accuracy = useMemo(() => gaussianNBAccuracy(model, points), [model, points]);
  const confusion = useMemo(() => gaussianNBConfusion(model, points), [model, points]);

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

  const perClassInfo = useMemo(() => {
    const result: Record<number, { mean: { x: number; y: number }; var: { x: number; y: number }; prior: number; count: number }> = {};
    for (const c of [0, 1]) {
      result[c] = {
        mean: model.means[c],
        var: model.vars[c],
        prior: model.priors[c],
        count: points.filter(p => p.label === c).length,
      };
    }
    return result;
  }, [model, points]);

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
                }`}>Test NB</button>
            </div>

            <div className="relative w-full max-w-[400px] aspect-square bg-white border-2 border-gray-300 rounded cursor-crosshair select-none"
              onClick={handleCanvasClick}>
              <svg width={WIDTH} height={HEIGHT} viewBox={`-20 -10 ${WIDTH + 40} ${HEIGHT + 30}`}
                className="absolute inset-0 w-full h-full">
                {renderGrid()}
                {renderHeatmap()}

                <text x={8} y={14} fontSize={10} fontFamily="monospace" fontWeight="bold"
                  fill="#374151" opacity={0.7}>
                  Gaussian Naive Bayes | {points.length} pts
                </text>

                {showEllipses && (
                  <>
                    {[0, 1].map(c => {
                      const m = model.means[c];
                      const v = model.vars[c];
                      const stroke = c === 1 ? '#3b82f6' : '#ef4444';
                      return (
                        <g key={`ellipse-${c}`}>
                          <path d={getEllipsePoints(m.x, m.y, Math.sqrt(v.x), Math.sqrt(v.y), 1)}
                            fill="none" stroke={stroke} strokeWidth={1.5} opacity={0.6} />
                          {showBothContours && (
                            <path d={getEllipsePoints(m.x, m.y, Math.sqrt(v.x), Math.sqrt(v.y), 2)}
                              fill="none" stroke={stroke} strokeWidth={1} opacity={0.3} strokeDasharray="3,2" />
                          )}
                          <text x={toSVGX(m.x) + 8} y={toSVGY(m.y) + 4}
                            fontSize={9} fontFamily="monospace" fill={stroke} opacity={0.7}>
                            {c === 1 ? '1σ' : '1σ'}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {boundaryPath && (
                  <path d={boundaryPath} fill="none" stroke="#10b981" strokeWidth={2} opacity={0.8} />
                )}

                {points.map((p, i) => (
                  <motion.g key={`pt-${i}`}>
                    <motion.circle
                      cx={toSVGX(p.x)} cy={toSVGY(p.y)}
                      r={hoveredPoint === i ? 8 : 6}
                      fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                      stroke="white" strokeWidth={2}
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
                          ({p.x.toFixed(1)},{p.y.toFixed(1)}) c={p.label}
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
                    <rect x={toSVGX(testPoint.x) + 14} y={toSVGY(testPoint.y) - 20}
                      width={140} height={40} rx={4}
                      fill="white" stroke="#10b981" strokeWidth={1} opacity={0.95} />
                    <text x={toSVGX(testPoint.x) + 18} y={toSVGY(testPoint.y) - 8}
                      fontSize={9} fontFamily="monospace" fill="#059669" fontWeight="bold">
                      Class {testPrediction.prediction} (p1={testPrediction.prob1.toFixed(3)})
                    </text>
                    <text x={toSVGX(testPoint.x) + 18} y={toSVGY(testPoint.y) + 4}
                      fontSize={8} fontFamily="monospace" fill="#6b7280">
                      logP(c0)={testPrediction.logPosterior[0].toFixed(1)} logP(c1)={testPrediction.logPosterior[1].toFixed(1)}
                    </text>
                    <text x={toSVGX(testPoint.x) + 18} y={toSVGY(testPoint.y) + 14}
                      fontSize={8} fontFamily="monospace" fill="#6b7280">
                      P(c0|x)={(testPrediction.posterior[0] * 100).toFixed(1)}% P(c1|x)={(testPrediction.posterior[1] * 100).toFixed(1)}%
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
              <button onClick={() => setShowHeatmap(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showHeatmap ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                }`}>Heatmap</button>
              <button onClick={() => setShowEllipses(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showEllipses ? 'bg-violet-600 text-white ring-2 ring-violet-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                }`}>Ellipses</button>
              <button onClick={() => setShowBoundary(v => !v)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showBoundary ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                }`}>Boundary</button>
              {showEllipses && (
                <button onClick={() => setShowBothContours(v => !v)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    showBothContours ? 'bg-amber-600 text-white ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 ring-1 ring-gray-200'
                  }`}>2σ</button>
              )}
            </div>

            {mode === 'test' && (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-500 italic">
                  Click the canvas to compute posterior probabilities at any point.
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
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Class Statistics</h3>
              <div className="space-y-3">
                {([1, 0] as const).map(c => {
                  const info = perClassInfo[c];
                  return (
                    <div key={c} className={`p-2 rounded ${c === 1 ? 'bg-blue-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3 h-3 rounded-full ${c === 1 ? 'bg-blue-500' : 'bg-red-500'}`} />
                        <span className="font-semibold text-sm">Class {c}</span>
                        <span className="text-xs text-gray-500">n={info.count}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-gray-500">μ_x:</span><span className="font-mono">{info.mean.x.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">μ_y:</span><span className="font-mono">{info.mean.y.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">σ²_x:</span><span className="font-mono">{info.var.x.toFixed(3)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">σ²_y:</span><span className="font-mono">{info.var.y.toFixed(3)}</span></div>
                        <div className="flex justify-between col-span-2"><span className="text-gray-500">Prior P(y={c}):</span><span className="font-mono">{info.prior.toFixed(3)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700">Performance</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Accuracy:</span>
                  <span className={`font-mono font-bold ${accuracy >= 90 ? 'text-emerald-600' : accuracy >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                    {accuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Data:</span><span className="font-mono">{points.length} pts</span></div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                <div className="bg-green-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">TP</div>
                  <div className="font-mono font-bold text-green-700">{confusion.tp}</div>
                </div>
                <div className="bg-red-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">FP</div>
                  <div className="font-mono font-bold text-red-700">{confusion.fp}</div>
                </div>
                <div className="bg-green-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">TN</div>
                  <div className="font-mono font-bold text-green-700">{confusion.tn}</div>
                </div>
                <div className="bg-red-50 p-1.5 rounded text-center">
                  <div className="text-gray-500">FN</div>
                  <div className="font-mono font-bold text-red-700">{confusion.fn}</div>
                </div>
              </div>
            </div>

            {testPrediction && testPoint && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5 text-emerald-800">Decision at ({testPoint.x.toFixed(1)}, {testPoint.y.toFixed(1)})</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Predicted:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${testPrediction.prediction === 1 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      Class {testPrediction.prediction}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">P(c=0 | x):</span><span className="font-mono">{(testPrediction.posterior[0] * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">P(c=1 | x):</span><span className="font-mono">{(testPrediction.posterior[1] * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">log P(x|c=0):</span><span className="font-mono">{testPrediction.logPosterior[0].toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">log P(x|c=1):</span><span className="font-mono">{testPrediction.logPosterior[1].toFixed(2)}</span></div>
                </div>
              </div>
            )}

            <details className="group">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors select-none font-medium">
                How Gaussian Naive Bayes works
              </summary>
              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg space-y-2 text-xs">
                <p><strong>Bayes Rule</strong>: P(y|x) ∝ P(x|y) · P(y). For each class, we compute the posterior probability — the probability of class y given the observed features x.</p>
                <p><strong>Gaussian assumption</strong>: For continuous features, Naive Bayes assumes each feature follows a normal (Gaussian) distribution within each class: P(x|y) = N(μ_y, σ²_y).</p>
                <p><strong>Naive independence</strong>: Features are assumed conditionally independent given the class. This means P(x₁, x₂|y) = P(x₁|y) · P(x₂|y). This simplifies computation but is rarely true in practice.</p>
                <p><strong>Ellipses</strong>: The 1σ contour (solid) contains ~39% of the class&apos;s probability mass. The 2σ contour (dashed) contains ~86%. The center is the class mean μ.</p>
                <p><strong>Decision boundary</strong>: The green line shows where P(y=1|x) = P(y=0|x) = 0.5. Points on one side are classified as class 1, the other as class 0.</p>
                <p><strong>Heatmap</strong>: The background color intensity shows P(y=1|x) from 0 (red) to 0.5 (white) to 1 (blue).</p>
                <p><strong>Log-space</strong>: Probabilities are computed in log space for numerical stability: ŷ = argmax[log P(y) + Σ log P(x_i|y)].</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
