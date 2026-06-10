'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { computePCA, type Point2D } from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;
const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

function rotatePoints(pts: Point2D[], angleDeg: number): Point2D[] {
  if (pts.length === 0 || angleDeg === 0) return [...pts];
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  if (!isFinite(mx)) return [...pts];
  return pts.map(p => ({
    x: mx + (p.x - mx) * cos - (p.y - my) * sin,
    y: my + (p.x - mx) * sin + (p.y - my) * cos,
  }));
}

function invRotatePoint(px: number, py: number, pts: Point2D[], angleDeg: number): Point2D {
  if (pts.length === 0 || angleDeg === 0) return { x: px, y: py };
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  if (!isFinite(mx)) return { x: px, y: py };
  const dx = px - mx;
  const dy = py - my;
  return { x: mx + dx * cos + dy * sin, y: my - dx * sin + dy * cos };
}

const INITIAL_POINTS: Point2D[] = [
  { x: 3, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 7 },
  { x: 6, y: 5 }, { x: 7, y: 6 }, { x: 8, y: 7 },
];

export default function PCAAnimation() {
  const [basePoints, setBasePoints] = useState<Point2D[]>(INITIAL_POINTS);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [numComponents, setNumComponents] = useState(2);
  const [showPC1, setShowPC1] = useState(true);
  const [showPC2, setShowPC2] = useState(true);
  const [showProjections, setShowProjections] = useState(false);
  const [showReconstruction, setShowReconstruction] = useState(true);
  const [showEllipse, setShowEllipse] = useState(true);
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
  const pointStroke = isDark ? '#1f2937' : 'white';
  const hoverTextFill = isDark ? '#d1d5db' : '#374151';
  const chartAxisStroke = isDark ? '#374151' : '#e5e7eb';
  const covTextDark = isDark ? '#d1d5db' : '#374151';

  const points = useMemo(() => rotatePoints(basePoints, rotationDeg), [basePoints, rotationDeg]);

  const { pc1, pc2, explained, eigenvalues } = useMemo(() => computePCA(points), [points]);

  const mean = useMemo(() => {
    if (points.length === 0) return { x: 0, y: 0 };
    return {
      x: points.reduce((s, p) => s + p.x, 0) / points.length,
      y: points.reduce((s, p) => s + p.y, 0) / points.length,
    };
  }, [points]);

  const covMatrix = useMemo(() => {
    if (points.length < 2) return { xx: 0, xy: 0, yy: 0 };
    const mx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const my = points.reduce((s, p) => s + p.y, 0) / points.length;
    let xx = 0, xy = 0, yy = 0;
    for (const p of points) {
      xx += (p.x - mx) * (p.x - mx);
      xy += (p.x - mx) * (p.y - my);
      yy += (p.y - my) * (p.y - my);
    }
    const n = points.length;
    return { xx: xx / n, xy: xy / n, yy: yy / n };
  }, [points]);

  const projections = useMemo(() => {
    if (points.length === 0 || eigenvalues[0] === 0) return [];
    return points.map(p => {
      const cx = p.x - mean.x;
      const cy = p.y - mean.y;
      const proj1 = cx * pc1.x + cy * pc1.y;
      const proj2 = cx * pc2.x + cy * pc2.y;
      return {
        pc1: { x: mean.x + proj1 * pc1.x, y: mean.y + proj1 * pc1.y },
        pc2: { x: mean.x + proj2 * pc2.x, y: mean.y + proj2 * pc2.y },
        proj1,
        proj2,
      };
    });
  }, [points, mean, pc1, pc2, eigenvalues]);

  const reconstructionError = useMemo(() => {
    if (numComponents === 2 || projections.length === 0) return 0;
    let err = 0;
    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - projections[i].pc1.x;
      const dy = points[i].y - projections[i].pc1.y;
      err += dx * dx + dy * dy;
    }
    return Math.sqrt(err / points.length);
  }, [numComponents, projections, points]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * RANGE;
      const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
      const inv = invRotatePoint(x, y, basePoints, rotationDeg);
      setBasePoints(prev => [...prev, inv]);
    },
    [basePoints, rotationDeg]
  );

  const handleRemovePoint = useCallback(
    (i: number) => {
      setBasePoints(prev => prev.filter((_, j) => j !== i));
    },
    []
  );

  const handleReset = useCallback(() => {
    setBasePoints(INITIAL_POINTS);
    setRotationDeg(0);
    setNumComponents(2);
  }, []);

  const handleRandomData = useCallback(() => {
    const angle = (rotationDeg * Math.PI) / 180;
    const pts: Point2D[] = [];
    for (let i = 0; i < 20; i++) {
      const t = (Math.random() - 0.5) * 4;
      const n = (Math.random() - 0.5) * 0.8;
      pts.push({
        x: 5 + t * Math.cos(angle) - n * Math.sin(angle),
        y: 5 + t * Math.sin(angle) + n * Math.cos(angle),
      });
    }
    setBasePoints(pts);
    setRotationDeg(0);
  }, [rotationDeg]);

  const toSVGX = (dx: number) => (dx / RANGE) * WIDTH;
  const toSVGY = (dy: number) => HEIGHT - (dy / RANGE) * HEIGHT;
  const arrowScale = Math.sqrt(eigenvalues[0]) * 1.5 + 0.5;

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

  const renderEllipse = () => {
    if (!showEllipse || points.length < 2) return null;
    const rx = Math.sqrt(eigenvalues[0]) * 2;
    const ry = Math.sqrt(eigenvalues[1]) * 2;
    const angle = Math.atan2(pc1.y, pc1.x) * (180 / Math.PI);
    const cx = toSVGX(mean.x);
    const cy = toSVGY(mean.y);
    const rxPx = (rx / RANGE) * WIDTH;
    const ryPx = (ry / RANGE) * HEIGHT;
    return (
      <ellipse
        cx={cx} cy={cy}
        rx={Math.abs(rxPx)} ry={Math.abs(ryPx)}
        transform={`rotate(${angle}, ${cx}, ${cy})`}
        fill="none" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.5}
      />
    );
  };

  const renderProjectionLines = () => {
    if (!showProjections) return null;
    return projections.flatMap((proj, i) => {
      const p = points[i];
      return [
        <line key={`pj1-${i}`} x1={toSVGX(p.x)} y1={toSVGY(p.y)}
          x2={toSVGX(proj.pc1.x)} y2={toSVGY(proj.pc1.y)}
          stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" />,
        <line key={`pj2-${i}`} x1={toSVGX(p.x)} y1={toSVGY(p.y)}
          x2={toSVGX(proj.pc2.x)} y2={toSVGY(proj.pc2.y)}
          stroke="#93c5fd" strokeWidth={1} strokeDasharray="2 3" />,
      ];
    });
  };

  const renderReconstructionLines = () => {
    if (numComponents !== 1 || !showReconstruction || projections.length === 0) return null;
    return projections.map((proj, i) => {
      const p = points[i];
      return (
        <line
          key={`recon-${i}`}
          x1={toSVGX(p.x)} y1={toSVGY(p.y)}
          x2={toSVGX(proj.pc1.x)} y2={toSVGY(proj.pc1.y)}
          stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
        />
      );
    });
  };

  const renderReconstructedPoints = () => {
    if (numComponents !== 1 || !showReconstruction || projections.length === 0) return null;
    return projections.map((proj, i) => (
      <motion.circle
        key={`recon-pt-${i}`}
        cx={toSVGX(proj.pc1.x)}
        cy={toSVGY(proj.pc1.y)}
        r={4}
        fill={COLORS[i % COLORS.length]}
        fillOpacity={0.4}
        stroke="#ef4444"
        strokeWidth={1}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      />
    ));
  };

  const renderPCChart = () => {
    if (projections.length === 0) return <p className="text-xs text-gray-400 dark:text-gray-500">Add points to see PC coordinates.</p>;
    const cw = 240;
    const ch = 120;
    const pad = 28;
    const pw = cw - pad * 2;
    const ph = ch - pad * 2;
    const vals1 = projections.map(p => p.proj1);
    const vals2 = projections.map(p => p.proj2);
    const min1 = Math.min(...vals1); const max1 = Math.max(...vals1);
    const min2 = Math.min(...vals2); const max2 = Math.max(...vals2);
    const r1 = max1 - min1 || 1; const r2 = max2 - min2 || 1;
    const toX = (v: number) => pad + ((v - min1) / r1) * pw;
    const toY = (v: number) => pad + ph - ((v - min2) / r2) * ph;

    return (
      <svg width={cw} height={ch} className="w-full">
        <line x1={pad} y1={pad + ph / 2} x2={pad + pw} y2={pad + ph / 2} stroke={chartAxisStroke} strokeWidth={1} />
        <line x1={pad + pw / 2} y1={pad} x2={pad + pw / 2} y2={pad + ph} stroke={chartAxisStroke} strokeWidth={1} />
        <text x={pad + pw / 2} y={pad - 4} textAnchor="middle" fontSize={8} fill={axisFill}>PC2</text>
        <text x={pad + pw + 4} y={pad + ph / 2 + 3} fontSize={8} fill={axisFill}>PC1</text>
        {projections.map((proj, i) => (
          <motion.circle
            key={i}
            cx={toX(proj.proj1)} cy={toY(proj.proj2)}
            r={3} fill={COLORS[i % COLORS.length]}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          />
        ))}
      </svg>
    );
  };

  const renderCovHeatmap = () => {
    const { xx, xy, yy } = covMatrix;
    const maxAbs = Math.max(Math.abs(xx), Math.abs(xy), Math.abs(yy), 0.001);
    const cellW = 60;
    const cellH = 24;
    const cells = [
      { r: 0, c: 0, label: 'X', value: xx },
      { r: 0, c: 1, label: 'Y', value: xy },
      { r: 1, c: 0, label: 'X', value: xy },
      { r: 1, c: 1, label: 'Y', value: yy },
    ];
    const fmt = (v: number) => v >= 0 ? ` ${v.toFixed(2)}` : v.toFixed(2);
    const intensity = (v: number) => Math.abs(v) / maxAbs;
    const blue = (v: number) => {
      const i = intensity(v);
      return `rgba(59,130,246,${i})`;
    };
    const red = (v: number) => {
      const i = intensity(v);
      return `rgba(239,68,68,${i})`;
    };

    return (
      <svg width={cellW * 2 + 4} height={cellH * 2 + 4 + 16}>
        <text x={cellW} y={12} textAnchor="middle" fontSize={9} fill={axisFill}>X</text>
        <text x={cellW * 2 + 2} y={12} textAnchor="middle" fontSize={9} fill={axisFill}>Y</text>
        <text x={2} y={12 + cellH} fontSize={9} fill={axisFill}>X</text>
        <text x={2} y={12 + cellH * 2} fontSize={9} fill={axisFill}>Y</text>
        {cells.map(({ r, c, value }) => {
          const fill = value >= 0 ? blue(value) : red(value);
          const txtColor = intensity(value) > 0.5 ? 'white' : covTextDark;
          return (
            <g key={`${r}-${c}`}>
              <rect x={2 + c * (cellW + 2)} y={14 + r * (cellH + 2)} width={cellW} height={cellH} rx={3} fill={fill} />
              <text
                x={2 + c * (cellW + 2) + cellW / 2}
                y={14 + r * (cellH + 2) + cellH / 2 + 1}
                textAnchor="middle"
                fontSize={10}
                fontFamily="monospace"
                fill={txtColor}
              >
                {fmt(value)}
              </text>
            </g>
          );
        })}
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
                <defs>
                  <marker id="arrowPCA" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" />
                  </marker>
                </defs>

                {renderEllipse()}
                {renderProjectionLines()}
                {renderReconstructionLines()}

                <g>
                  <polygon
                    points={`${toSVGX(mean.x)},${toSVGY(mean.y) - 6} ${toSVGX(mean.x) + 5},${toSVGY(mean.y) + 4} ${toSVGX(mean.x) - 5},${toSVGY(mean.y) + 4}`}
                    fill="#8b5cf6" stroke={pointStroke} strokeWidth="1.5"
                  />
                </g>

                {showPC1 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <line x1={toSVGX(mean.x)} y1={toSVGY(mean.y)}
                      x2={toSVGX(mean.x + pc1.x * arrowScale)} y2={toSVGY(mean.y + pc1.y * arrowScale)}
                      stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowPCA)" />
                  </motion.g>
                )}
                {showPC2 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <line x1={toSVGX(mean.x)} y1={toSVGY(mean.y)}
                      x2={toSVGX(mean.x + pc2.x * arrowScale * 0.6)} y2={toSVGY(mean.y + pc2.y * arrowScale * 0.6)}
                      stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowPCA)" />
                  </motion.g>
                )}

                {points.map((p, i) => (
                  <motion.g key={`pt-${i}`}>
                    <motion.circle
                      cx={toSVGX(p.x)} cy={toSVGY(p.y)}
                      r={hoveredPoint === i ? 7 : 5}
                      fill={COLORS[i % COLORS.length]} stroke={pointStroke} strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handleRemovePoint(i); }}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                    />
                    {hoveredPoint === i && (
                      <text x={toSVGX(p.x) + 12} y={toSVGY(p.y) + 4} fontSize={10} fontFamily="monospace" fill={hoverTextFill}>
                        ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                      </text>
                    )}
                  </motion.g>
                ))}

                {renderReconstructedPoints()}
              </svg>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowPC1(!showPC1)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${showPC1 ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                PC1
              </button>
              <button onClick={() => setShowPC2(!showPC2)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${showPC2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                PC2
              </button>
              <button onClick={() => setShowProjections(!showProjections)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${showProjections ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                Projections
              </button>
              <button onClick={() => setShowEllipse(!showEllipse)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${showEllipse ? 'bg-violet-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                1σ Ellipse
              </button>
              <button onClick={handleRandomData}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors">
                Random
              </button>
              <button onClick={handleReset}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Components (K): <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{numComponents}</span>
                  </label>
                  <input type="range" min={1} max={2} step={1} value={numComponents}
                    onChange={(e) => setNumComponents(parseInt(e.target.value))}
                    className="w-full mt-0.5" />
                  <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    <span>1 (reconstruct)</span><span>2 (lossless)</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Rotation: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{rotationDeg}°</span>
                  </label>
                  <input type="range" min={0} max={180} step={1} value={rotationDeg}
                    onChange={(e) => setRotationDeg(parseInt(e.target.value))}
                    className="w-full mt-0.5" />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Rotates data to see PCA adapt in real time. Click <strong>Random</strong> for fresh data at this angle.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Principal Components</h3>
              {points.length < 2 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">Add at least 2 points.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded-lg">
                    <p className="font-semibold text-xs text-red-700 mb-1">PC1</p>
                    <div className="text-[11px] space-y-0.5">
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">λ =</span><span className="font-mono">{eigenvalues[0].toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">var =</span><span className="font-mono font-bold text-red-700">{(explained[0] * 100).toFixed(1)}%</span></div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">({pc1.x.toFixed(2)}, {pc1.y.toFixed(2)})</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg width="80" height="60">
                      {[{ l: 'PC1', v: explained[0] * 100, c: '#ef4444' }, { l: 'PC2', v: explained[1] * 100, c: '#3b82f6' }].map((b, i) => {
                        const bw = 26;
                        const bh = (b.v / 100) * 40;
                        const x = i * 36 + 4;
                        return (
                          <g key={b.l}>
                            <rect x={x} y={50 - bh} width={bw} height={Math.max(bh, 2)} fill={b.c} rx={2} opacity={0.8} />
                            <text x={x + bw / 2} y={58} textAnchor="middle" fontSize={7} fill={axisFill}>{b.l}</text>
                            <text x={x + bw / 2} y={50 - bh - 2} textAnchor="middle" fontSize={7} fill={b.c}>{b.v.toFixed(0)}%</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                    <p className="font-semibold text-xs text-blue-700 mb-1">PC2</p>
                    <div className="text-[11px] space-y-0.5">
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">λ =</span><span className="font-mono">{eigenvalues[1].toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">var =</span><span className="font-mono font-bold text-blue-700">{(explained[1] * 100).toFixed(1)}%</span></div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">({pc2.x.toFixed(2)}, {pc2.y.toFixed(2)})</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Analysis</h3>
              {points.length < 2 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">Add at least 2 points.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Covariance Matrix</p>
                    <div className="flex items-center gap-3">
                      {renderCovHeatmap()}
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                        σ<sub>xx</sub>={covMatrix.xx.toFixed(2)}<br />
                        σ<sub>xy</sub>={covMatrix.xy.toFixed(2)}<br />
                        σ<sub>yy</sub>={covMatrix.yy.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data in PC Coordinates</p>
                    {renderPCChart()}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                Dimensionality Reduction {numComponents === 1 ? <span className="text-red-500 font-bold">(lossy)</span> : <span className="text-emerald-600">(lossless)</span>}
              </h3>
              {numComponents === 1 && projections.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Keeping only PC1. Red dashed lines on the canvas show reconstruction error.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">
                      RMSE: <span className="font-bold text-red-600">{reconstructionError.toFixed(3)}</span>
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={showReconstruction}
                        onChange={(e) => setShowReconstruction(e.target.checked)} className="rounded" />
                      Show
                    </label>
                  </div>
                  <div className="pt-1 border-t border-gray-100 mt-1">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Points:</span><span className="font-mono">{points.length}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Mean:</span><span className="font-mono">({mean.x.toFixed(1)}, {mean.y.toFixed(1)})</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total var:</span><span className="font-mono">{(eigenvalues[0] + eigenvalues[1]).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Rotation:</span><span className="font-mono">{rotationDeg}°</span></div>
                    </div>
                  </div>
                </div>
              ) : numComponents === 2 ? (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    K=2 retains all variance ({(explained[0] * 100 + explained[1] * 100).toFixed(0)}%). No information lost.
                  </p>
                  <div className="mt-2 pt-1 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Points:</span><span className="font-mono">{points.length}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Mean:</span><span className="font-mono">({mean.x.toFixed(1)}, {mean.y.toFixed(1)})</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total var:</span><span className="font-mono">{(eigenvalues[0] + eigenvalues[1]).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Rotation:</span><span className="font-mono">{rotationDeg}°</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">Add points to see reconstruction.</p>
              )}
            </div>

            <details className="group">
              <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-300 transition-colors select-none font-medium">
                How PCA works
              </summary>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <ol className="list-decimal list-inside space-y-0.5 text-xs">
                  <li>Center data at mean (purple triangle)</li>
                  <li>Compute <strong>covariance matrix</strong> — measures how X and Y vary together</li>
                  <li>Find eigenvectors of the covariance matrix → PC1 (red) and PC2 (blue)</li>
                  <li>PC1 captures maximum variance; PC2 is orthogonal</li>
                  <li><strong>Scree plot</strong> shows variance %; <strong>PC chart</strong> shows data in rotated coordinates</li>
                  <li>Set <strong>K=1</strong> to see dimensionality reduction — red dashed lines = reconstruction error</li>
                  <li>Move <strong>Rotation</strong> slider to see PCA adapt to any orientation</li>
                  <li><strong>1σ Ellipse</strong> shows the spread along each principal direction</li>
                </ol>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
