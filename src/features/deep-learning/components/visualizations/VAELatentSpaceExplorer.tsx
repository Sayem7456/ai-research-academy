'use client';

import React, { useState, useMemo } from 'react';

interface LatentPoint {
  x: number;
  y: number;
  label: number;
  decoded: string;
}

const SHAPES = ['●', '■', '▲', '◆', '★'];
const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'];

function sampleLatent(meanX: number, meanY: number, std: number): [number, number] {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  return [meanX + z0 * std, meanY + z1 * std];
}

function decodePoint(x: number, y: number): string {
  const shapes = ['●', '■', '▲', '◆', '★'];
  const angle = Math.atan2(y, x);
  const dist = Math.sqrt(x * x + y * y);
  const idx = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 5) % 5;
  const size = Math.min(1, dist / 2);
  return `${shapes[idx]} (${size.toFixed(1)})`;
}

export default function VAELatentSpaceExplorer() {
  const [latentPoints, setLatentPoints] = useState<LatentPoint[]>(() =>
    Array.from({ length: 50 }, (_, i) => {
      const label = i % 5;
      const angle = (label / 5) * Math.PI * 2;
      const [x, y] = sampleLatent(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0.3);
      return { x, y, label, decoded: decodePoint(x, y) };
    })
  );

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [interpolation, setInterpolation] = useState<[LatentPoint, LatentPoint] | null>(null);
  const [interpT, setInterpT] = useState(0.5);
  const [reparamStd, setReparamStd] = useState(0.3);

  const svgW = 500;
  const svgH = 400;
  const xMin = -3, xMax = 3, yMin = -3, yMax = 3;
  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * svgW;
  const toSvgY = (y: number) => ((yMax - y) / (yMax - yMin)) * svgH;

  const addRandomPoint = () => {
    const label = Math.floor(Math.random() * 5);
    const angle = (label / 5) * Math.PI * 2;
    const [x, y] = sampleLatent(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, reparamStd);
    setLatentPoints(prev => [...prev, { x, y, label, decoded: decodePoint(x, y) }]);
  };

  const startInterp = () => {
    if (latentPoints.length < 2) return;
    const i = Math.floor(Math.random() * latentPoints.length);
    let j = Math.floor(Math.random() * latentPoints.length);
    while (j === i) j = Math.floor(Math.random() * latentPoints.length);
    setInterpolation([latentPoints[i], latentPoints[j]]);
    setInterpT(0);
  };

  const interpPoint = useMemo(() => {
    if (!interpolation) return null;
    const [p1, p2] = interpolation;
    return {
      x: p1.x + (p2.x - p1.x) * interpT,
      y: p1.y + (p2.y - p1.y) * interpT,
      label: interpT < 0.5 ? p1.label : p2.label,
      decoded: decodePoint(p1.x + (p2.x - p1.x) * interpT, p1.y + (p2.y - p1.y) * interpT),
    };
  }, [interpolation, interpT]);

  const reset = () => {
    setLatentPoints([]);
    setInterpolation(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">VAE Latent Space Explorer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Explore the 2D latent space of a VAE. Each point is sampled from a Gaussian distribution, decoded into a shape. Watch how interpolation produces smooth transitions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Latent Space (z₁, z₂)</h3>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <rect width={svgW} height={svgH} fill="rgb(243 244 246)" rx="8" />

            {/* Grid lines */}
            {[0].map(v => (
              <g key={v}>
                <line x1={toSvgX(v)} y1={0} x2={toSvgX(v)} y2={svgH} stroke="#D1D5DB" strokeWidth={1} />
                <line x1={0} y1={toSvgY(v)} x2={svgW} y2={toSvgY(v)} stroke="#D1D5DB" strokeWidth={1} />
              </g>
            ))}

            {/* Axes labels */}
            <text x={svgW - 15} y={toSvgY(0) - 5} fontSize={10} fill="#9CA3AF">z₁</text>
            <text x={toSvgX(0) + 5} y={15} fontSize={10} fill="#9CA3AF">z₂</text>

            {/* Points */}
            {latentPoints.map((p, i) => (
              <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
                <circle cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={hoveredPoint === i ? 8 : 5}
                  fill={COLORS[p.label]} stroke="white" strokeWidth={1.5} opacity={0.85} />
              </g>
            ))}

            {/* Interpolation line */}
            {interpolation && (
              <g>
                <line x1={toSvgX(interpolation[0].x)} y1={toSvgY(interpolation[0].y)}
                  x2={toSvgX(interpolation[1].x)} y2={toSvgY(interpolation[1].y)}
                  stroke="#6366F1" strokeWidth={2} strokeDasharray="4,4" />
                {interpPoint && (
                  <circle cx={toSvgX(interpPoint.x)} cy={toSvgY(interpPoint.y)} r={8}
                    fill="#6366F1" stroke="white" strokeWidth={2} />
                )}
                <circle cx={toSvgX(interpolation[0].x)} cy={toSvgY(interpolation[0].y)} r={6}
                  fill={COLORS[interpolation[0].label]} stroke="#6366F1" strokeWidth={2} />
                <circle cx={toSvgX(interpolation[1].x)} cy={toSvgY(interpolation[1].y)} r={6}
                  fill={COLORS[interpolation[1].label]} stroke="#6366F1" strokeWidth={2} />
              </g>
            )}

            {/* Legend */}
            {SHAPES.map((s, i) => (
              <g key={i}>
                <circle cx={15 + i * 30} cy={svgH - 15} r={4} fill={COLORS[i]} />
                <text x={25 + i * 30} y={svgH - 11} fontSize={9} fill="#6B7280">{s}</text>
              </g>
            ))}
          </svg>

          {hoveredPoint !== null && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Point {hoveredPoint}: ({latentPoints[hoveredPoint].x.toFixed(3)}, {latentPoints[hoveredPoint].y.toFixed(3)}) → {latentPoints[hoveredPoint].decoded}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Controls</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Reparameterization σ</span><strong>{reparamStd.toFixed(2)}</strong>
                </label>
                <input type="range" min="0.05" max="1" step="0.05" value={reparamStd}
                  onChange={(e) => setReparamStd(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Controls sampling spread. Higher = more diverse samples.</p>
              </div>
              {interpolation && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>Interpolation t</span><strong>{interpT.toFixed(2)}</strong>
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={interpT}
                    onChange={(e) => setInterpT(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addRandomPoint} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                Sample Point
              </button>
              <button onClick={startInterp} className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors cursor-pointer">
                Interpolate
              </button>
              <button onClick={reset} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                Reset
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">VAE Components</h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Encoder</span>
                <span>x → μ, σ (maps input to distribution parameters)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Reparameterize</span>
                <span>z = μ + σ ⊙ ε, where ε ~ N(0, I) (allows backprop through sampling)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Decoder</span>
                <span>z → x̂ (reconstructs input from latent code)</span>
              </div>
            </div>
          </div>

          {interpPoint && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-sm">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                <strong>Interpolation at t={interpT.toFixed(2)}:</strong> ({interpPoint.x.toFixed(3)}, {interpPoint.y.toFixed(3)}) → {interpPoint.decoded}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How VAEs Work</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          The encoder maps inputs to a Gaussian distribution in latent space. The reparameterization trick samples from this distribution while keeping gradients flowing. The decoder reconstructs inputs from latent codes. The loss combines reconstruction quality + KL divergence (keeping the latent space close to N(0,I)).
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Latent Space</span>
            <span>→ A compressed "idea space" where similar concepts are nearby. Moving smoothly in this space creates smooth transitions in output.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Encoder</span>
            <span>→ Like a summarizer. Takes a complex input and writes a short description (the latent code).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Decoder</span>
            <span>→ Like an illustrator. Takes a short description and creates the full image.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Interpolation</span>
            <span>→ Morphing between two concepts. "Cat" → "Dog" produces a smooth transition through "cat-dog".</span>
          </div>
        </div>
      </div>
    </div>
  );
}
