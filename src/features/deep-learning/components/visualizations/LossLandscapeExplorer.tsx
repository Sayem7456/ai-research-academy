'use client';

import React, { useState, useMemo } from 'react';

type Optimizer = 'sgd' | 'momentum' | 'adam';
type LRSchedule = 'constant' | 'step-decay' | 'cosine' | 'exponential';

interface Point { x: number; y: number; z: number }

interface ComparisonPath {
  lr: number;
  path: Point[];
  color: string;
  label: string;
}

interface RacePath {
  optimizer: Optimizer;
  path: Point[];
  color: string;
  label: string;
  finalLoss: number;
}

function lossFunc(x: number, y: number): number {
  return 0.5 * (x * x + 3 * y * y) + 0.3 * Math.sin(2 * x) * Math.sin(2 * y);
}

function lossGrad(x: number, y: number): [number, number] {
  const dx = x + 0.6 * Math.cos(2 * x) * Math.sin(2 * y);
  const dy = 6 * y + 0.6 * Math.sin(2 * x) * Math.cos(2 * y);
  return [dx, dy];
}

function getLossColor(loss: number, minLoss: number, maxLoss: number): string {
  const t = Math.max(0, Math.min(1, (loss - minLoss) / (maxLoss - minLoss || 1)));
  // Red (high loss) → Yellow → Green (low loss)
  const hue = 120 * (1 - t);
  return `hsl(${hue}, 80%, 50%)`;
}

function getDirection(dx: number, dy: number): string {
  const angle = Math.atan2(-dy, dx) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return 'E';
  if (angle >= 22.5 && angle < 67.5) return 'NE';
  if (angle >= 67.5 && angle < 112.5) return 'N';
  if (angle >= 112.5 && angle < 157.5) return 'NW';
  if (angle >= 157.5 || angle < -157.5) return 'W';
  if (angle >= -157.5 && angle < -112.5) return 'SW';
  if (angle >= -112.5 && angle < -67.5) return 'S';
  if (angle >= -67.5 && angle < -22.5) return 'SE';
  return 'E';
}

function calculateLR(initialLr: number, epoch: number, schedule: LRSchedule): number {
  switch (schedule) {
    case 'constant':
      return initialLr;
    case 'step-decay':
      // Decay by factor of 0.5 every 20 epochs
      return initialLr * Math.pow(0.5, Math.floor(epoch / 20));
    case 'cosine':
      // Cosine annealing
      return initialLr * 0.5 * (1 + Math.cos(Math.PI * epoch / 100));
    case 'exponential':
      // Exponential decay
      return initialLr * Math.exp(-epoch / 50);
    default:
      return initialLr;
  }
}

function findContourPoint(threshold: number, xMin: number, xMax: number, yMin: number, yMax: number): { x: number; y: number } | null {
  // Scan along a line to find a point close to the threshold
  for (let ix = 0; ix < 40; ix++) {
    const x = xMin + (ix / 40) * (xMax - xMin);
    const y = 0; // Scan along y=0 line
    const v = lossFunc(x, y);
    if (Math.abs(v - threshold) < 0.2) {
      return { x, y };
    }
  }
  // Try along x=0 line
  for (let iy = 0; iy < 40; iy++) {
    const x = 0;
    const y = yMin + (iy / 40) * (yMax - yMin);
    const v = lossFunc(x, y);
    if (Math.abs(v - threshold) < 0.2) {
      return { x, y };
    }
  }
  return null;
}

export default function LossLandscapeExplorer() {
  const [optimizer, setOptimizer] = useState<Optimizer>('sgd');
  const [path, setPath] = useState<Point[]>([{ x: 2.5, y: 1.8, z: lossFunc(2.5, 1.8) }]);
  const [velX, setVelX] = useState(0);
  const [velY, setVelY] = useState(0);
  const [mX, setMX] = useState(0);
  const [mY, setMY] = useState(0);
  const [vX, setVX] = useState(0);
  const [vY, setVY] = useState(0);
  const [showGradientArrow, setShowGradientArrow] = useState(true);
  const [showContourLabels, setShowContourLabels] = useState(true);
  const [showCriticalPoints, setShowCriticalPoints] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  
  // Phase 2: Learning Rate Insights
  const [lrSchedule, setLrSchedule] = useState<LRSchedule>('constant');
  const [initialLr, setInitialLr] = useState(0.1);
  const [epoch, setEpoch] = useState(0);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPaths, setComparisonPaths] = useState<ComparisonPath[]>([]);
  
  // Phase 3: Optimizer Deep Dive
  const [showVelocity, setShowVelocity] = useState(true);
  const [raceMode, setRaceMode] = useState(false);
  const [racePaths, setRacePaths] = useState<RacePath[]>([]);

  const current = path[path.length - 1];
  const [dx, dy] = lossGrad(current.x, current.y);

  const svgW = 400;
  const svgH = 300;
  const xMin = -3, xMax = 3, yMin = -2, yMax = 2;

  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * svgW;
  const toSvgY = (y: number) => ((yMax - y) / (yMax - yMin)) * svgH;

  const contours = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let level = 0; level <= 15; level++) {
      const threshold = level * 1.5;
      for (let ix = 0; ix < 80; ix++) {
        for (let iy = 0; iy < 60; iy++) {
          const x = xMin + (ix / 80) * (xMax - xMin);
          const y = yMax - (iy / 60) * (yMax - yMin);
          const v = lossFunc(x, y);
          const dx2 = lossFunc(x + 0.05, y) - v;
          if (Math.abs(dx2) < 0.3 && Math.abs(v - threshold) < 0.15) {
            lines.push(<circle key={`c${level}-${ix}-${iy}`} cx={toSvgX(x)} cy={toSvgY(y)} r={1} fill={`rgba(99, 102, 241, ${0.15 + level * 0.03})`} />);
          }
        }
      }
    }
    return lines;
  }, []);

  const currentLR = calculateLR(initialLr, epoch, lrSchedule);

  const step = () => {
    let nx: number, ny: number;
    const t = path.length;
    const beta = 0.9;
    const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
    const effectiveLR = calculateLR(initialLr, epoch, lrSchedule);

    switch (optimizer) {
      case 'sgd':
        nx = current.x - effectiveLR * dx;
        ny = current.y - effectiveLR * dy;
        break;
      case 'momentum':
        const newVX = beta * velX + dx;
        const newVY = beta * velY + dy;
        nx = current.x - effectiveLR * newVX;
        ny = current.y - effectiveLR * newVY;
        setVelX(newVX);
        setVelY(newVY);
        break;
      case 'adam':
        const newMX = beta1 * mX + (1 - beta1) * dx;
        const newMY = beta1 * mY + (1 - beta1) * dy;
        const newVX2 = beta2 * vX + (1 - beta2) * dx * dx;
        const newVY2 = beta2 * vY + (1 - beta2) * dy * dy;
        const mHatX = newMX / (1 - Math.pow(beta1, t));
        const mHatY = newMY / (1 - Math.pow(beta1, t));
        const vHatX = newVX2 / (1 - Math.pow(beta2, t));
        const vHatY = newVY2 / (1 - Math.pow(beta2, t));
        nx = current.x - effectiveLR * mHatX / (Math.sqrt(vHatX) + eps);
        ny = current.y - effectiveLR * mHatY / (Math.sqrt(vHatY) + eps);
        setMX(newMX);
        setMY(newMY);
        setVX(newVX2);
        setVY(newVY2);
        break;
    }

    nx = Math.max(xMin, Math.min(xMax, nx));
    ny = Math.max(yMin, Math.min(yMax, ny));
    setPath(prev => [...prev, { x: nx, y: ny, z: lossFunc(nx, ny) }]);
    setEpoch(prev => prev + 1);
  };

  const reset = () => {
    setPath([{ x: 2.5, y: 1.8, z: lossFunc(2.5, 1.8) }]);
    setVelX(0); setVelY(0);
    setMX(0); setMY(0);
    setVX(0); setVY(0);
    setEpoch(0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loss Landscape Explorer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Visualize how different optimizers navigate a 2D loss surface. Watch SGD, Momentum, and Adam find the minimum.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Loss Surface</h3>
              <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showGradientArrow} 
                  onChange={() => setShowGradientArrow(!showGradientArrow)} 
                  className="rounded w-3 h-3" />
                Gradient Arrow
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showContourLabels} 
                  onChange={() => setShowContourLabels(!showContourLabels)} 
                  className="rounded w-3 h-3" />
                Contour Labels
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showCriticalPoints} 
                  onChange={() => setShowCriticalPoints(!showCriticalPoints)} 
                  className="rounded w-3 h-3" />
                Critical Points
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showLegend} 
                  onChange={() => setShowLegend(!showLegend)} 
                  className="rounded w-3 h-3" />
                Legend
              </label>
              {(optimizer === 'momentum' || optimizer === 'adam') && (
                <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={showVelocity} 
                    onChange={() => setShowVelocity(!showVelocity)} 
                    className="rounded w-3 h-3" />
                  Velocity
                </label>
              )}
            </div>
          </div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <defs>
              <radialGradient id="bg-grad">
                <stop offset="0%" stopColor="#EEF2FF" />
                <stop offset="100%" stopColor="#C7D2FE" />
              </radialGradient>
              <marker id="gradient-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#8B5CF6" />
              </marker>
              <marker id="velocity-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#F97316" />
              </marker>
              <marker id="legend-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6" fill="#8B5CF6" />
              </marker>
            </defs>
            <rect width={svgW} height={svgH} fill="url(#bg-grad)" rx="8" />
            {contours}

            {/* Contour Labels */}
            {showContourLabels && (
              <g>
                {[0, 3, 6, 9, 12].map(level => {
                  const threshold = level * 1.5;
                  const point = findContourPoint(threshold, xMin, xMax, yMin, yMax);
                  if (!point) return null;
                  return (
                    <text
                      key={`label-${level}`}
                      x={toSvgX(point.x)}
                      y={toSvgY(point.y)}
                      fontSize={7}
                      fill="#6366F1"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {threshold.toFixed(1)}
                    </text>
                  );
                })}
              </g>
            )}

            {/* Critical Points */}
            {showCriticalPoints && (
              <g>
                {/* Global Minimum */}
                <circle cx={toSvgX(0)} cy={toSvgY(0)} r={5} fill="#22C55E" stroke="white" strokeWidth={2} />
                <text x={toSvgX(0) + 10} y={toSvgY(0) + 4} fontSize={9} fill="#16A34A" fontWeight="bold">Min</text>
                
                {/* Local Minimum (approximate) */}
                <circle cx={toSvgX(1.2)} cy={toSvgY(0.6)} r={4} fill="#EAB308" stroke="white" strokeWidth={1.5} />
                <text x={toSvgX(1.2) + 8} y={toSvgY(0.6) + 3} fontSize={7} fill="#CA8A04">Local</text>
                
                {/* Saddle Point (approximate) */}
                <polygon
                  points={`${toSvgX(-0.8)},${toSvgY(-0.4)-5} ${toSvgX(-0.8)+5},${toSvgY(-0.4)} ${toSvgX(-0.8)},${toSvgY(-0.4)+5} ${toSvgX(-0.8)-5},${toSvgY(-0.4)}`}
                  fill="#F97316"
                  stroke="white"
                  strokeWidth={1.5}
                />
                <text x={toSvgX(-0.8) + 8} y={toSvgY(-0.4) + 3} fontSize={7} fill="#EA580C">Saddle</text>
              </g>
            )}

            {/* Comparison Paths */}
            {comparisonMode && comparisonPaths.map((compPath, ci) => (
              <g key={`comp-${ci}`} opacity={0.7}>
                {compPath.path.length > 1 && compPath.path.slice(1).map((p, i) => (
                  <line
                    key={`comp-path-${ci}-${i}`}
                    x1={toSvgX(compPath.path[i].x)}
                    y1={toSvgY(compPath.path[i].y)}
                    x2={toSvgX(p.x)}
                    y2={toSvgY(p.y)}
                    stroke={compPath.color}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray="4,2"
                  />
                ))}
                {compPath.path.length > 0 && (
                  <circle 
                    cx={toSvgX(compPath.path[compPath.path.length - 1].x)} 
                    cy={toSvgY(compPath.path[compPath.path.length - 1].y)} 
                    r={4}
                    fill={compPath.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            ))}

            {path.length > 1 && (
              <g>
                {(() => {
                  const losses = path.map(p => p.z);
                  const minLoss = Math.min(...losses);
                  const maxLoss = Math.max(...losses);
                  return path.slice(1).map((p, i) => (
                    <line
                      key={`path-${i}`}
                      x1={toSvgX(path[i].x)}
                      y1={toSvgY(path[i].y)}
                      x2={toSvgX(p.x)}
                      y2={toSvgY(p.y)}
                      stroke={getLossColor(p.z, minLoss, maxLoss)}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  ));
                })()}
              </g>
            )}

            {/* Gradient Vector Arrow */}
            {showGradientArrow && (
              <g>
                {(() => {
                  const gradMag = Math.sqrt(dx * dx + dy * dy);
                  const arrowScale = Math.min(30, Math.max(10, gradMag * 15));
                  const nx = dx / (gradMag || 1);
                  const ny = dy / (gradMag || 1);
                  const startX = toSvgX(current.x);
                  const startY = toSvgY(current.y);
                  const endX = startX + nx * arrowScale;
                  const endY = startY + ny * arrowScale;
                  const gradColor = gradMag > 2 ? '#EF4444' : gradMag > 0.5 ? '#F59E0B' : '#8B5CF6';
                  return (
                    <>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={gradColor}
                        strokeWidth={2.5}
                        markerEnd="url(#gradient-arrow)"
                      />
                      <text
                        x={endX + (nx >= 0 ? 8 : -8)}
                        y={endY - 6}
                        fontSize={8}
                        fill={gradColor}
                        textAnchor={nx >= 0 ? 'start' : 'end'}
                        fontWeight="bold"
                      >
                        ∇L
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* Velocity Vector (Momentum/Adam) */}
            {showVelocity && (optimizer === 'momentum' || optimizer === 'adam') && (
              <g>
                {(() => {
                  const velMag = Math.sqrt(velX * velX + velY * velY);
                  if (velMag < 0.01) return null;
                  const arrowScale = Math.min(25, Math.max(8, velMag * 10));
                  const nx = velX / (velMag || 1);
                  const ny = velY / (velMag || 1);
                  const startX = toSvgX(current.x);
                  const startY = toSvgY(current.y);
                  const endX = startX + nx * arrowScale;
                  const endY = startY + ny * arrowScale;
                  return (
                    <>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#F97316"
                        strokeWidth={2}
                        strokeDasharray="4,2"
                        markerEnd="url(#velocity-arrow)"
                      />
                      <text
                        x={endX + (nx >= 0 ? 6 : -6)}
                        y={endY + 12}
                        fontSize={7}
                        fill="#F97316"
                        textAnchor={nx >= 0 ? 'start' : 'end'}
                        fontWeight="bold"
                      >
                        v={velMag.toFixed(2)}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* Race Mode Paths */}
            {raceMode && racePaths.map((race, ri) => (
              <g key={`race-${ri}`} opacity={0.8}>
                {race.path.length > 1 && race.path.slice(1).map((p, i) => (
                  <line
                    key={`race-path-${ri}-${i}`}
                    x1={toSvgX(race.path[i].x)}
                    y1={toSvgY(race.path[i].y)}
                    x2={toSvgX(p.x)}
                    y2={toSvgY(p.y)}
                    stroke={race.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                ))}
                {race.path.length > 0 && (
                  <g>
                    <circle 
                      cx={toSvgX(race.path[race.path.length - 1].x)} 
                      cy={toSvgY(race.path[race.path.length - 1].y)} 
                      r={5}
                      fill={race.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text
                      x={toSvgX(race.path[race.path.length - 1].x) + 8}
                      y={toSvgY(race.path[race.path.length - 1].y) - 6}
                      fontSize={8}
                      fill={race.color}
                      fontWeight="bold"
                    >
                      {race.optimizer.toUpperCase()}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {path.map((p, i) => (
              <circle key={i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={i === path.length - 1 ? 6 : 3}
                fill={i === path.length - 1 ? '#EF4444' : '#F87171'} stroke="white" strokeWidth={1.5} />
            ))}
          </svg>

          {/* Legend Panel */}
          {showLegend && (
            <div className="absolute top-12 right-6 bg-white/95 dark:bg-gray-800/95 rounded-lg p-2 text-[9px] space-y-1.5 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#22C55E" stroke="white" strokeWidth="1" /></svg>
                <span className="text-gray-600 dark:text-gray-300">Global Minimum</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12"><circle cx="6" cy="6" r="3" fill="#EAB308" stroke="white" strokeWidth="1" /></svg>
                <span className="text-gray-600 dark:text-gray-300">Local Minimum</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12"><polygon points="6,1 11,6 6,11 1,6" fill="#F97316" stroke="white" strokeWidth="1" /></svg>
                <span className="text-gray-600 dark:text-gray-300">Saddle Point</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12"><line x1="0" y1="6" x2="12" y2="6" stroke="#8B5CF6" strokeWidth="2" markerEnd="url(#legend-arrow)" /></svg>
                <span className="text-gray-600 dark:text-gray-300">Gradient (∇L)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12"><line x1="0" y1="6" x2="12" y2="6" stroke="hsl(60, 80%, 50%)" strokeWidth="2" /></svg>
                <span className="text-gray-600 dark:text-gray-300">Path (loss)</span>
              </div>
              {comparisonMode && comparisonPaths.map((compPath, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg width="12" height="12"><line x1="0" y1="6" x2="12" y2="6" stroke={compPath.color} strokeWidth="2" strokeDasharray="2,1" /></svg>
                  <span className="text-gray-600 dark:text-gray-300">{compPath.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Optimizer</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(['sgd', 'momentum', 'adam'] as Optimizer[]).map(opt => (
                <button key={opt} onClick={() => { setOptimizer(opt); reset(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer uppercase ${optimizer === opt ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Initial Learning Rate</span><strong>{initialLr.toFixed(3)}</strong>
                </label>
                <input type="range" min="0.01" max="0.5" step="0.01" value={initialLr} onChange={(e) => setInitialLr(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              
              {/* LR Schedule Selection */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">LR Schedule</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['constant', 'step-decay', 'cosine', 'exponential'] as LRSchedule[]).map(sched => (
                    <button key={sched} onClick={() => { setLrSchedule(sched); reset(); }}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${lrSchedule === sched ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {sched === 'step-decay' ? 'Step' : sched === 'cosine' ? 'Cosine' : sched === 'exponential' ? 'Exp' : 'Const'}
                    </button>
                  ))}
                </div>
              </div>

              {/* LR Visualization Bar */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Current LR</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{currentLR.toFixed(4)}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, (currentLR / 0.5) * 100)}%`,
                      backgroundColor: currentLR > 0.3 ? '#EF4444' : currentLR > 0.1 ? '#F59E0B' : '#22C55E'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] text-green-500">Slow</span>
                  <span className="text-[8px] text-yellow-500">Optimal</span>
                  <span className="text-[8px] text-red-500">Fast</span>
                </div>
              </div>

              {/* Epoch Counter */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">Epoch</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{epoch}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current State</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Position</span>
                <strong className="text-gray-900 dark:text-gray-100">({current.x.toFixed(3)}, {current.y.toFixed(3)})</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Loss</span>
                <strong className="text-red-600 dark:text-red-400">{current.z.toFixed(6)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Gradient</span>
                <strong className="text-gray-900 dark:text-gray-100">({dx.toFixed(3)}, {dy.toFixed(3)})</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Steps</span>
                <strong className="text-gray-900 dark:text-gray-100">{path.length - 1}</strong>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">|∇L|</span>
                <strong className="text-purple-600 dark:text-purple-400">{Math.sqrt(dx*dx + dy*dy).toFixed(4)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Direction</span>
                <strong className="text-gray-900 dark:text-gray-100">{getDirection(dx, dy)}</strong>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Loss Δ</span>
                <strong className={path.length > 1 ? (current.z - path[path.length - 2].z > 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-900'}>
                  {path.length > 1 ? (current.z - path[path.length - 2].z > 0 ? '+' : '') + (current.z - path[path.length - 2].z).toFixed(6) : '0.000000'}
                </strong>
              </div>
            </div>

            {/* Momentum/Velocity Display */}
            {(optimizer === 'momentum' || optimizer === 'adam') && (
              <div className="mt-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Velocity (Momentum)</span>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    |v| = {Math.sqrt(velX*velX + velY*velY).toFixed(4)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-500">
                      <span>vₓ</span>
                      <span>{velX.toFixed(4)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(velX) * 50)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-500">
                      <span>vᵧ</span>
                      <span>{velY.toFixed(4)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(velY) * 50)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Adam Moments Display */}
            {optimizer === 'adam' && (
              <div className="mt-3 space-y-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">First Moment (m) - Mean</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>mₓ</span>
                        <span>{mX.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(mX) * 50)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>mᵧ</span>
                        <span>{mY.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(mY) * 50)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Second Moment (v) - Variance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>vₓ</span>
                        <span>{vX.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(vX) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>vᵧ</span>
                        <span>{vY.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, Math.abs(vY) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={step} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
              Step
            </button>
            <button onClick={() => {
              let nx: number, ny: number;
              const beta = 0.9;
              const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
              let curX = current.x, curY = current.y;
              let vxCur = velX, vyCur = velY;
              let mxCur = mX, myCur = mY;
              let vxCur2 = vX, vyCur2 = vY;
              const newPoints: Point[] = [...path];
              let currentEpoch = epoch;
              for (let i = 0; i < 50; i++) {
                const [gdx, gdy] = lossGrad(curX, curY);
                const t = newPoints.length;
                const effectiveLR = calculateLR(initialLr, currentEpoch, lrSchedule);
                switch (optimizer) {
                  case 'sgd':
                    nx = curX - effectiveLR * gdx;
                    ny = curY - effectiveLR * gdy;
                    break;
                  case 'momentum':
                    vxCur = beta * vxCur + gdx;
                    vyCur = beta * vyCur + gdy;
                    nx = curX - effectiveLR * vxCur;
                    ny = curY - effectiveLR * vyCur;
                    break;
                  case 'adam':
                    mxCur = beta1 * mxCur + (1 - beta1) * gdx;
                    myCur = beta1 * myCur + (1 - beta1) * gdy;
                    vxCur2 = beta2 * vxCur2 + (1 - beta2) * gdx * gdx;
                    vyCur2 = beta2 * vyCur2 + (1 - beta2) * gdy * gdy;
                    const mHatX = mxCur / (1 - Math.pow(beta1, t));
                    const mHatY = myCur / (1 - Math.pow(beta1, t));
                    const vHatX = vxCur2 / (1 - Math.pow(beta2, t));
                    const vHatY = vyCur2 / (1 - Math.pow(beta2, t));
                    nx = curX - effectiveLR * mHatX / (Math.sqrt(vHatX) + eps);
                    ny = curY - effectiveLR * mHatY / (Math.sqrt(vHatY) + eps);
                    break;
                }
                nx = Math.max(xMin, Math.min(xMax, nx));
                ny = Math.max(yMin, Math.min(yMax, ny));
                curX = nx;
                curY = ny;
                newPoints.push({ x: nx, y: ny, z: lossFunc(nx, ny) });
                currentEpoch++;
              }
              setPath(newPoints);
              setVelX(vxCur); setVelY(vyCur);
              setMX(mxCur); setMY(myCur);
              setVX(vxCur2); setVY(vyCur2);
              setEpoch(currentEpoch);
            }} className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
              Run 50 Steps
            </button>
            <button onClick={reset} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              Reset
            </button>
          </div>

          {/* Comparison Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">LR Comparison</h3>
              <button 
                onClick={() => {
                  if (comparisonMode) {
                    setComparisonMode(false);
                    setComparisonPaths([]);
                  } else {
                    setComparisonMode(true);
                    // Initialize comparison paths with different LRs
                    const startPt = { x: 2.5, y: 1.8 };
                    setComparisonPaths([
                      { lr: 0.01, path: [{ ...startPt, z: lossFunc(startPt.x, startPt.y) }], color: '#EF4444', label: 'LR=0.01 (Slow)' },
                      { lr: 0.1, path: [{ ...startPt, z: lossFunc(startPt.x, startPt.y) }], color: '#22C55E', label: 'LR=0.1 (Good)' },
                      { lr: 0.4, path: [{ ...startPt, z: lossFunc(startPt.x, startPt.y) }], color: '#F59E0B', label: 'LR=0.4 (Fast)' },
                    ]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${comparisonMode ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
              >
                {comparisonMode ? 'Exit Compare' : 'Compare LRs'}
              </button>
            </div>
            
            {comparisonMode && (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Watch how different learning rates converge (or diverge!)
                </p>
                <button 
                  onClick={() => {
                    // Run comparison for all paths using selected optimizer
                    const beta = 0.9;
                    const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
                    const updatedPaths = comparisonPaths.map(compPath => {
                      let curX = 2.5, curY = 1.8;
                      let velXCur = 0, velYCur = 0;
                      let mXCur = 0, mYCur = 0;
                      let vXCur = 0, vYCur = 0;
                      const newPts: Point[] = [{ x: curX, y: curY, z: lossFunc(curX, curY) }];
                      for (let i = 0; i < 50; i++) {
                        const [gdx, gdy] = lossGrad(curX, curY);
                        const t = newPts.length;
                        let nx: number, ny: number;
                        switch (optimizer) {
                          case 'sgd':
                            nx = curX - compPath.lr * gdx;
                            ny = curY - compPath.lr * gdy;
                            break;
                          case 'momentum':
                            velXCur = beta * velXCur + gdx;
                            velYCur = beta * velYCur + gdy;
                            nx = curX - compPath.lr * velXCur;
                            ny = curY - compPath.lr * velYCur;
                            break;
                          case 'adam':
                            mXCur = beta1 * mXCur + (1 - beta1) * gdx;
                            mYCur = beta1 * mYCur + (1 - beta1) * gdy;
                            vXCur = beta2 * vXCur + (1 - beta2) * gdx * gdx;
                            vYCur = beta2 * vYCur + (1 - beta2) * gdy * gdy;
                            const mHatX = mXCur / (1 - Math.pow(beta1, t));
                            const mHatY = mYCur / (1 - Math.pow(beta1, t));
                            const vHatX = vXCur / (1 - Math.pow(beta2, t));
                            const vHatY = vYCur / (1 - Math.pow(beta2, t));
                            nx = curX - compPath.lr * mHatX / (Math.sqrt(vHatX) + eps);
                            ny = curY - compPath.lr * mHatY / (Math.sqrt(vHatY) + eps);
                            break;
                        }
                        nx = Math.max(xMin, Math.min(xMax, nx));
                        ny = Math.max(yMin, Math.min(yMax, ny));
                        curX = nx;
                        curY = ny;
                        newPts.push({ x: nx, y: ny, z: lossFunc(nx, ny) });
                      }
                      return { ...compPath, path: newPts };
                    });
                    setComparisonPaths(updatedPaths);
                  }}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Run Comparison (50 steps)
                </button>
                <div className="space-y-1.5">
                  {comparisonPaths.map((compPath, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: compPath.color }} />
                      <span className="text-gray-600 dark:text-gray-300">{compPath.label}</span>
                      <span className="ml-auto text-gray-500">Final: {compPath.path[compPath.path.length - 1].z.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optimizer Race Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Optimizer Race</h3>
              <button 
                onClick={() => {
                  if (raceMode) {
                    setRaceMode(false);
                    setRacePaths([]);
                  } else {
                    setRaceMode(true);
                    // Initialize race paths for all three optimizers
                    const startPt = { x: 2.5, y: 1.8 };
                    setRacePaths([
                      { optimizer: 'sgd', path: [{ ...startPt, z: lossFunc(startPt.x, startPt.y) }], color: '#EF4444', label: 'SGD', finalLoss: 0 },
                      { optimizer: 'momentum', path: [{ ...startPt, z: lossFunc(startPt.x, startPt.y) }], color: '#22C55E', label: 'Momentum', finalLoss: 0 },
                      { optimizer: 'adam', path: [{ ...startPt, z: lossFunc(startPt.x, startPt.y) }], color: '#F59E0B', label: 'Adam', finalLoss: 0 },
                    ]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${raceMode ? 'bg-red-600 text-white' : 'bg-purple-600 text-white'}`}
              >
                {raceMode ? 'Exit Race' : 'Race Optimizers'}
              </button>
            </div>
            
            {raceMode && (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Watch SGD, Momentum, and Adam race to the minimum!
                </p>
                <button 
                  onClick={() => {
                    const beta = 0.9;
                    const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
                    const lrToUse = initialLr;
                    
                    const updatedPaths = racePaths.map(race => {
                      let curX = 2.5, curY = 1.8;
                      let velXCur = 0, velYCur = 0;
                      let mXCur = 0, mYCur = 0;
                      let vXCur = 0, vYCur = 0;
                      const newPts: Point[] = [{ x: curX, y: curY, z: lossFunc(curX, curY) }];
                      
                      for (let i = 0; i < 50; i++) {
                        const [gdx, gdy] = lossGrad(curX, curY);
                        const t = newPts.length;
                        let nx: number, ny: number;
                        
                        switch (race.optimizer) {
                          case 'sgd':
                            nx = curX - lrToUse * gdx;
                            ny = curY - lrToUse * gdy;
                            break;
                          case 'momentum':
                            velXCur = beta * velXCur + gdx;
                            velYCur = beta * velYCur + gdy;
                            nx = curX - lrToUse * velXCur;
                            ny = curY - lrToUse * velYCur;
                            break;
                          case 'adam':
                            mXCur = beta1 * mXCur + (1 - beta1) * gdx;
                            mYCur = beta1 * mYCur + (1 - beta1) * gdy;
                            vXCur = beta2 * vXCur + (1 - beta2) * gdx * gdx;
                            vYCur = beta2 * vYCur + (1 - beta2) * gdy * gdy;
                            const mHatX = mXCur / (1 - Math.pow(beta1, t));
                            const mHatY = mYCur / (1 - Math.pow(beta1, t));
                            const vHatX = vXCur / (1 - Math.pow(beta2, t));
                            const vHatY = vYCur / (1 - Math.pow(beta2, t));
                            nx = curX - lrToUse * mHatX / (Math.sqrt(vHatX) + eps);
                            ny = curY - lrToUse * mHatY / (Math.sqrt(vHatY) + eps);
                            break;
                        }
                        nx = Math.max(xMin, Math.min(xMax, nx));
                        ny = Math.max(yMin, Math.min(yMax, ny));
                        curX = nx;
                        curY = ny;
                        newPts.push({ x: nx, y: ny, z: lossFunc(nx, ny) });
                      }
                      return { ...race, path: newPts, finalLoss: newPts[newPts.length - 1].z };
                    });
                    setRacePaths(updatedPaths);
                  }}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  Start Race (50 steps)
                </button>
                <div className="space-y-1.5">
                  {racePaths.map((race, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: race.color }} />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">{race.label}</span>
                      <span className="ml-auto text-gray-500">Final: {race.finalLoss.toFixed(4)}</span>
                      {racePaths.length > 0 && Math.abs(race.finalLoss - Math.min(...racePaths.map(rp => rp.finalLoss))) < 1e-6 && race.finalLoss > 0 && (
                        <span className="text-green-500 text-[9px]">WINNER</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Optimizers Explained</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
          <strong>SGD</strong>: Basic gradient descent. Can get stuck or oscillate. <strong>Momentum</strong>: Adds velocity to smooth updates and escape local minima. <strong>Adam</strong>: Adaptive learning rates per parameter + momentum. Converges fast but may generalize worse.
        </p>
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Optimizer Deep Dive</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
          <strong>Velocity Vectors (Orange)</strong>: For Momentum/Adam, shows accumulated gradient direction. Like a ball rolling downhill - it builds up speed and can roll through small hills.
          <strong>Adam Moments</strong>: 
          <em>First Moment (m)</em> - Running average of gradients (direction).
          <em>Second Moment (v)</em> - Running average of squared gradients (magnitude). 
          Adam uses these to adapt learning rates per parameter.
        </p>
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Optimizer Race Mode</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Click &quot;Race Optimizers&quot; to see SGD, Momentum, and Adam compete from the same starting point. 
          Watch how Momentum builds up velocity and Adam adapts its learning rate. 
          The winner depends on the loss landscape and hyperparameters!
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Loss Surface</span>
            <span>→ The terrain your model navigates. Valleys are good solutions, plateaus are dead zones.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Gradient Arrow</span>
            <span>→ Points uphill. Your model moves downhill (opposite direction). Like a compass pointing to higher ground.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Velocity (Momentum)</span>
            <span>→ Like a heavy ball rolling downhill. It builds up speed and can roll through small hills (local minima).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Adam Moments</span>
            <span>→ Like a smart hiker who remembers both which direction to go (m) and how steep the terrain is (v). Adjusts step size automatically.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Optimizer Race</span>
            <span>→ Different strategies for navigating the same terrain. SGD is cautious, Momentum is bold, Adam is adaptive.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
