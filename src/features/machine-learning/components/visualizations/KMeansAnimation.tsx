'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  kMeansStep,
  initializeKMeansCentroids,
  initializeKMeansPlusPlus,
  computeWCSS,
  euclideanDistance,
  type Point2D,
} from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function findElbow(data: { k: number; wcss: number }[]): number | null {
  if (data.length < 3) return null;
  let bestK: number | null = null;
  let bestAngle = 0;
  for (let i = 1; i < data.length - 1; i++) {
    const v1x = 1;
    const v1y = data[i].wcss - data[i - 1].wcss;
    const v2x = 1;
    const v2y = data[i + 1].wcss - data[i].wcss;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const m2 = Math.sqrt(v2x * v2x + v2y * v2y);
    if (m1 === 0 || m2 === 0) continue;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2))));
    if (angle > bestAngle) {
      bestAngle = angle;
      bestK = data[i].k;
    }
  }
  return bestK;
}

function computeAvgSilhouette(points: Point2D[], assignments: number[], k: number): number {
  const n = points.length;
  if (n < 2 || k < 2) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const ci = assignments[i];
    const sameDists: number[] = [];
    const otherDists: Record<number, number[]> = {};
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = euclideanDistance(points[i], points[j]);
      if (assignments[j] === ci) {
        sameDists.push(d);
      } else {
        (otherDists[assignments[j]] ??= []).push(d);
      }
    }
    const a = sameDists.length > 0 ? sameDists.reduce((s, d) => s + d, 0) / sameDists.length : 0;
    let minB = Infinity;
    for (const dists of Object.values(otherDists)) {
      if (dists.length === 0) continue;
      const b = dists.reduce((s, d) => s + d, 0) / dists.length;
      if (b < minB) minB = b;
    }
    if (minB === Infinity) continue;
    total += (minB - a) / Math.max(a, minB);
  }
  return total / n;
}

export default function KMeansAnimation() {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState<Point2D[]>([]);
  const [assignments, setAssignments] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [initMethod, setInitMethod] = useState<'random' | 'kmeans++'>('random');
  const [showDistances, setShowDistances] = useState(false);
  const [wcssHistory, setWcssHistory] = useState<number[]>([]);
  const wcssHistoryRef = useRef<number[]>([]);
  const prevCentroidsRef = useRef<Point2D[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const hoverTextFill = isDark ? '#d1d5db' : '#374151';
  const pointStroke = isDark ? '#1f2937' : 'white';
  const centroidStroke = isDark ? '#d1d5db' : 'black';
  const voronoiOpacity = isDark ? 0.2 : 0.1;
  const chartAxisFill = isDark ? '#6b7280' : '#9ca3af';

  const wcss = useMemo(
    () => (centroids.length > 0 && assignments.length > 0 ? computeWCSS(points, centroids, assignments) : 0),
    [points, centroids, assignments]
  );

  const silhouetteScore = useMemo(
    () => (centroids.length > 1 && assignments.length > 1 ? computeAvgSilhouette(points, assignments, k) : 0),
    [points, assignments, k]
  );

  const clusterSizes = useMemo(() => {
    const sizes = new Array(k).fill(0);
    for (const a of assignments) {
      if (a >= 0 && a < k) sizes[a]++;
    }
    return sizes;
  }, [assignments, k]);

  const elbowData = useMemo(() => {
    if (points.length < 2) return [];
    const results: { k: number; wcss: number }[] = [];
    for (let kVal = 1; kVal <= 6; kVal++) {
      const initFn = initMethod === 'random' ? initializeKMeansCentroids : initializeKMeansPlusPlus;
      let currentCentroids = initFn(points, kVal);
      let currentAssignments: number[] = [];
      for (let iter = 0; iter < 15; iter++) {
        const result = kMeansStep(points, currentCentroids);
        currentCentroids = result.newCentroids;
        currentAssignments = result.assignments;
      }
      results.push({ k: kVal, wcss: computeWCSS(points, currentCentroids, currentAssignments) });
    }
    return results;
  }, [points, initMethod]);

  const elbowK = useMemo(() => findElbow(elbowData), [elbowData]);

  const initFn = initMethod === 'random' ? initializeKMeansCentroids : initializeKMeansPlusPlus;

  const initializeClusters = useCallback(() => {
    if (points.length === 0) return;
    prevCentroidsRef.current = [];
    wcssHistoryRef.current = [];
    setWcssHistory([]);
    const newCentroids = initFn(points, k);
    setCentroids(newCentroids);
    const { assignments: newAssignments } = kMeansStep(points, newCentroids);
    setAssignments(newAssignments);
    const initialWCSS = computeWCSS(points, newCentroids, newAssignments);
    wcssHistoryRef.current = [initialWCSS];
    setWcssHistory([initialWCSS]);
    setStep(0);
    setIsConverged(false);
    setIsAnimating(false);
  }, [points, k, initFn]);

  const performStep = useCallback(() => {
    if (centroids.length === 0 || points.length === 0) return;
    prevCentroidsRef.current = centroids;

    const { newCentroids, assignments: newAssignments } = kMeansStep(points, centroids);

    const maxShift = newCentroids.reduce((max, c, i) => {
      const prev = centroids[i];
      return prev ? Math.max(max, Math.hypot(c.x - prev.x, c.y - prev.y)) : max;
    }, 0);

    const changedAssignments =
      assignments.length !== newAssignments.length ||
      assignments.some((a, i) => a !== newAssignments[i]);

    const converged = maxShift < 1e-3 && !changedAssignments;

    setCentroids(newCentroids);
    setAssignments(newAssignments);
    setStep(prev => prev + 1);
    setIsConverged(converged);
    if (converged) setIsAnimating(false);
    else {
      const newWCSS = computeWCSS(points, newCentroids, newAssignments);
      wcssHistoryRef.current = [...wcssHistoryRef.current, newWCSS];
      setWcssHistory(wcssHistoryRef.current);
    }
  }, [points, centroids, assignments]);

  const startAnimation = useCallback(() => setIsAnimating(true), []);
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (isAnimating && centroids.length > 0 && !isConverged) {
      timerRef.current = setTimeout(() => performStep(), 600);
      return () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      };
    }
  }, [isAnimating, step, performStep, centroids, isConverged]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * RANGE;
      const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;

      const newPoints = [...points, { x, y }];
      setPoints(newPoints);

      if (centroids.length > 0) {
        const { newCentroids, assignments: newAssignments } = kMeansStep(newPoints, centroids);
        prevCentroidsRef.current = centroids;
        setCentroids(newCentroids);
        setAssignments(newAssignments);
        setIsConverged(false);
        const newWCSS = computeWCSS(newPoints, newCentroids, newAssignments);
        wcssHistoryRef.current = [...wcssHistoryRef.current, newWCSS];
        setWcssHistory(wcssHistoryRef.current);
      }
    },
    [points, centroids]
  );

  const handleRemovePoint = useCallback(
    (index: number) => {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
      if (newPoints.length === 0) {
        setCentroids([]); setAssignments([]); setStep(0);
        setIsConverged(false); wcssHistoryRef.current = []; setWcssHistory([]);
        return;
      }
      if (centroids.length > 0) {
        const { newCentroids, assignments: newAssignments } = kMeansStep(newPoints, centroids);
        prevCentroidsRef.current = centroids;
        setCentroids(newCentroids);
        setAssignments(newAssignments);
        const newWCSS = computeWCSS(newPoints, newCentroids, newAssignments);
        wcssHistoryRef.current = [...wcssHistoryRef.current, newWCSS];
        setWcssHistory(wcssHistoryRef.current);
      }
    },
    [points, centroids]
  );

  const handleReset = useCallback(() => {
    setPoints([]); setCentroids([]); setAssignments([]); setStep(0);
    setIsConverged(false); setIsAnimating(false);
    prevCentroidsRef.current = []; wcssHistoryRef.current = []; setWcssHistory([]);
  }, []);

  const handleRandomData = useCallback(() => {
    const newPoints: Point2D[] = [];
    const pointsPerCluster = 15;
    for (let c = 0; c < k; c++) {
      const cx = 2 + Math.random() * 6;
      const cy = 2 + Math.random() * 6;
      for (let i = 0; i < pointsPerCluster; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 1.5;
        newPoints.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
      }
    }
    setPoints(newPoints); setCentroids([]); setAssignments([]); setStep(0);
    setIsConverged(false); prevCentroidsRef.current = []; wcssHistoryRef.current = []; setWcssHistory([]);
  }, [k]);

  const handleKChange = useCallback((newK: number) => {
    setK(newK); setCentroids([]); setAssignments([]); setStep(0);
    setIsConverged(false); prevCentroidsRef.current = []; wcssHistoryRef.current = []; setWcssHistory([]);
  }, []);

  const toSVGX = (dx: number) => (dx / RANGE) * WIDTH;
  const toSVGY = (dy: number) => HEIGHT - (dy / RANGE) * HEIGHT;

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

  const renderVoronoi = () => {
    if (centroids.length === 0) return null;
    const gs = 24;
    const cw = WIDTH / gs;
    const ch = HEIGHT / gs;
    const cells: React.ReactNode[] = [];
    for (let gx = 0; gx < gs; gx++) {
      for (let gy = 0; gy < gs; gy++) {
        const dx = ((gx + 0.5) / gs) * RANGE;
        const dy = RANGE - ((gy + 0.5) / gs) * RANGE;
        let md = Infinity;
        let ni = 0;
        for (let ci = 0; ci < centroids.length; ci++) {
          const d = Math.hypot(dx - centroids[ci].x, dy - centroids[ci].y);
          if (d < md) { md = d; ni = ci; }
        }
        cells.push(<rect key={`v${gx}-${gy}`} x={gx * cw} y={gy * ch} width={cw} height={ch} fill={COLORS[ni % COLORS.length]} fillOpacity={voronoiOpacity} />);
      }
    }
    return cells;
  };

  const renderDistanceLines = () => {
    if (!showDistances || centroids.length === 0) return null;
    return points.map((p, i) => {
      const ci = assignments[i] ?? 0;
      const c = centroids[ci];
      if (!c) return null;
      return (
        <line
          key={`dist-${i}`}
          x1={toSVGX(p.x)} y1={toSVGY(p.y)}
          x2={toSVGX(c.x)} y2={toSVGY(c.y)}
          stroke={COLORS[ci % COLORS.length]}
          strokeWidth={1}
          strokeOpacity={0.3}
          strokeDasharray="3 2"
        />
      );
    });
  };

  const renderMovementTrails = () => {
    const prev = prevCentroidsRef.current;
    if (prev.length === 0 || centroids.length === 0 || prev.length !== centroids.length) return null;
    return prev.map((oc, i) => {
      const nc = centroids[i];
      if (Math.hypot(nc.x - oc.x, nc.y - oc.y) < 0.05) return null;
      return (
        <line
          key={`trail-${i}`}
          x1={toSVGX(oc.x)} y1={toSVGY(oc.y)}
          x2={toSVGX(nc.x)} y2={toSVGY(nc.y)}
          stroke={COLORS[i % COLORS.length]}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeOpacity={0.6}
        />
      );
    });
  };

  const statusText = isConverged ? 'Converged' : isAnimating ? 'Running' : centroids.length > 0 ? 'Paused' : 'Idle';
  const statusColor = isConverged ? 'text-emerald-600' : isAnimating ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400';
  const canStep = centroids.length > 0 && !isAnimating && !isConverged;
  const canAnimate = centroids.length > 0 && !isConverged;

  const chartW = 280;
  const chartH = 100;

  const renderElbowChart = () => {
    if (elbowData.length === 0) return <p className="text-xs text-gray-400 dark:text-gray-500">Add points to see the elbow method.</p>;
    const maxWCSS = Math.max(...elbowData.map(d => d.wcss));
    if (maxWCSS === 0) return <p className="text-xs text-gray-400 dark:text-gray-500">Insufficient data.</p>;
    const padL = 20, padR = 10, padT = 8, padB = 18;
    const pw = chartW - padL - padR;
    const ph = chartH - padT - padB;
    return (
      <svg width={chartW} height={chartH} className="w-full">
        {elbowData.map((d, i) => {
          const x = padL + (i / (elbowData.length - 1)) * pw;
          const h = (d.wcss / maxWCSS) * ph;
          const isElbow = d.k === elbowK;
          return (
            <rect
              key={d.k}
              x={x - (pw / elbowData.length) * 0.3}
              y={padT + ph - h}
              width={(pw / elbowData.length) * 0.6}
              height={h}
              fill={isElbow ? '#f59e0b' : '#8b5cf6'}
              fillOpacity={isElbow ? 1 : 0.5}
              rx={2}
            />
          );
        })}
        {elbowData.map((d, i) => {
          const x = padL + (i / (elbowData.length - 1)) * pw;
          return (
            <text key={`lb-${d.k}`} x={x} y={chartH - 2} textAnchor="middle" fontSize={9} fill={chartAxisFill}>
              {d.k}
            </text>
          );
        })}
        <text x={padL} y={chartH - 2} textAnchor="start" fontSize={9} fill={chartAxisFill}>K=</text>
        {elbowK && (
          <text x={padL + ((elbowK - 1) / (elbowData.length - 1)) * pw} y={8} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight="bold">
            Elbow: K={elbowK}
          </text>
        )}
      </svg>
    );
  };

  const renderConvergenceChart = () => {
    if (wcssHistory.length < 2) return <p className="text-xs text-gray-400 dark:text-gray-500">Step at least twice to see the convergence trend.</p>;
    const maxWCSS = Math.max(...wcssHistory);
    const minWCSS = Math.min(...wcssHistory);
    const range = maxWCSS - minWCSS || 1;
    const padL = 20, padR = 10, padT = 8, padB = 18;
    const pw = chartW - padL - padR;
    const ph = chartH - padT - padB;
    const pts = wcssHistory.map((w, i) => {
      const x = padL + (i / Math.max(wcssHistory.length - 1, 1)) * pw;
      const y = padT + ph - ((w - minWCSS) / range) * ph;
      return `${x},${y}`;
    });
    const polyline = pts.join(' ');
    const area = `${pts[0]} ${padL},${padT + ph} ${pts[pts.length - 1]}`;
    return (
      <svg width={chartW} height={chartH} className="w-full">
        <polygon points={area} fill="#a78bfa" fillOpacity={0.15} />
        <polyline points={polyline} fill="none" stroke="#8b5cf6" strokeWidth={2} />
        {wcssHistory.map((w, i) => {
          if (i !== wcssHistory.length - 1) return null;
          const x = padL + (i / Math.max(wcssHistory.length - 1, 1)) * pw;
          const y = padT + ph - ((w - minWCSS) / range) * ph;
          return <circle key="last" cx={x} cy={y} r={3} fill="#8b5cf6" />;
        })}
        <text x={padL} y={chartH - 2} textAnchor="start" fontSize={9} fill={chartAxisFill}>Iteration</text>
        <text x={chartW - padR} y={padT - 1} textAnchor="end" fontSize={9} fill={chartAxisFill}>{minWCSS.toFixed(0)}</text>
        <text x={chartW - padR} y={padT + ph + 1} textAnchor="end" fontSize={9} fill={chartAxisFill}>{maxWCSS.toFixed(0)}</text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded cursor-crosshair select-none"
              onClick={handleCanvasClick}
            >
              <svg
                width={WIDTH}
                height={HEIGHT}
                viewBox={`-20 -10 ${WIDTH + 40} ${HEIGHT + 30}`}
                className="absolute inset-0 w-full h-full"
              >
                {renderGrid()}
                {renderVoronoi()}
                {renderDistanceLines()}
                {renderMovementTrails()}

                {points.map((p, i) => {
                  const cluster = assignments[i] ?? 0;
                  return (
                    <motion.g key={`pt-${i}`}>
                      <motion.circle
                        cx={toSVGX(p.x)}
                        cy={toSVGY(p.y)}
                        r={hoveredPoint === i ? 7 : 4}
                        fill={COLORS[cluster % COLORS.length]}
                        stroke={pointStroke}
                        strokeWidth={hoveredPoint === i ? 2 : 1.5}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleRemovePoint(i); }}
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      {hoveredPoint === i && (
                        <text x={toSVGX(p.x) + 10} y={toSVGY(p.y) + 3} fontSize={10} fontFamily="monospace" fill={hoverTextFill}>
                          ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                        </text>
                      )}
                    </motion.g>
                  );
                })}

                {centroids.map((c, i) => (
                  <motion.g
                    key={`centroid-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <circle
                      cx={toSVGX(c.x)}
                      cy={toSVGY(c.y)}
                      r={10}
                      fill={COLORS[i % COLORS.length]}
                      stroke={centroidStroke}
                      strokeWidth={3}
                    />
                    <text x={toSVGX(c.x)} y={toSVGY(c.y) + 4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                      C{i + 1}
                    </text>
                  </motion.g>
                ))}

                {isConverged && centroids.length > 0 && (
                  <g>
                    <rect x={WIDTH - 100} y={4} width={96} height={22} rx={4} fill="#059669" fillOpacity={0.9} />
                    <text x={WIDTH - 52} y={19} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">Converged ✓</text>
                  </g>
                )}
              </svg>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={initializeClusters} disabled={points.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                Initialize
              </button>
              <button onClick={performStep} disabled={!canStep}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                Step
              </button>
              <button onClick={isAnimating ? stopAnimation : startAnimation} disabled={!canAnimate}
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                {isAnimating ? 'Stop' : 'Animate'}
              </button>
              <button onClick={handleRandomData}
                className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors">
                Random Data
              </button>
              <button onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Model Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Clusters (K): <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{k}</span>
                  </label>
                  <input
                    type="range" min={1} max={5} step={1} value={k}
                    onChange={(e) => handleKChange(parseInt(e.target.value))}
                    className="w-full mt-0.5"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Initialization</p>
                  <div className="flex gap-2">
                    {(['random', 'kmeans++'] as const).map(m => (
                      <button key={m} onClick={() => setInitMethod(m)}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-colors ${initMethod === m ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700'}`}>
                        {m === 'random' ? 'Random' : 'K-Means++'}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={showDistances} onChange={(e) => setShowDistances(e.target.checked)} className="rounded" />
                  Show point-to-centroid distances
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5">Cluster Info</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Points:</span><span className="font-mono font-medium">{points.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">K:</span><span className="font-mono font-medium">{k}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Iteration:</span><span className="font-mono font-medium">{step}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">WCSS:</span><span className="font-mono font-medium">{wcss > 0 ? wcss.toFixed(1) : '—'}</span></div>
                  {centroids.length > 1 && (
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Silhouette:</span><span className="font-mono font-medium">{silhouetteScore.toFixed(3)}</span></div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`font-mono font-medium text-xs ${statusColor}`}>{statusText}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <h3 className="font-semibold text-sm mb-1.5">Per-Cluster Sizes</h3>
                <div className="space-y-1.5">
                  {clusterSizes.map((size, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">C{i + 1}:</span>
                      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${points.length > 0 ? (size / points.length) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs font-mono w-6 text-right text-gray-600 dark:text-gray-400">{size}</span>
                    </div>
                  ))}
                  {points.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">Add points.</p>}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-1.5 text-gray-700 dark:text-gray-300">Elbow Method</h3>
              {renderElbowChart()}
              {elbowK && (
                <p className="text-xs text-amber-700 mt-1">
                  Suggested K from elbow: <strong>K={elbowK}</strong>. The bend in the curve is where adding more clusters yields diminishing returns.
                </p>
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-1.5 text-gray-700 dark:text-gray-300">WCSS Convergence</h3>
              {renderConvergenceChart()}
              {wcssHistory.length >= 2 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  WCSS: {wcssHistory[0].toFixed(1)} → {wcssHistory[wcssHistory.length - 1].toFixed(1)}{' '}
                  ({((1 - wcssHistory[wcssHistory.length - 1] / wcssHistory[0]) * 100).toFixed(0)}% reduction)
                </p>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="font-semibold mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Click <strong>Random Data</strong> or click canvas to add points</li>
                <li>Set <strong>K</strong> and choose <strong>Random</strong> or <strong>K-Means++</strong> initialization</li>
                <li>Click <strong>Initialize</strong> → <strong>Step</strong> / <strong>Animate</strong> to converge</li>
                <li><strong>Elbow Method</strong> chart shows optimal K (suggested in amber)</li>
                <li><strong>WCSS Convergence</strong> chart shows the objective decreasing</li>
                <li>Toggle <strong>Show distances</strong> to see what K-Means is minimizing</li>
                <li><strong>Silhouette</strong> score evaluates cluster separation (higher=better)</li>
                <li>Hover any point and click to remove it</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
