'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface TrackedObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number }[];
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const WIDTH = 400;
const HEIGHT = 300;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function generateObjects(count: number, seed: number = 42): TrackedObject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    x: seededRandom(seed + i * 7) * (WIDTH - 40) + 20,
    y: seededRandom(seed + i * 13 + 3) * (HEIGHT - 40) + 20,
    vx: (seededRandom(seed + i * 17 + 5) - 0.5) * 3,
    vy: (seededRandom(seed + i * 23 + 7) - 0.5) * 3,
    color: COLORS[i % COLORS.length],
    trail: [],
  }));
}

function updateObjects(objects: TrackedObject[]): TrackedObject[] {
  return objects.map((obj) => {
    let { x, y, vx, vy } = obj;
    x += vx;
    y += vy;
    if (x < 5 || x > WIDTH - 5) vx *= -1;
    if (y < 5 || y > HEIGHT - 5) vy *= -1;
    const trail = [...obj.trail, { x, y }].slice(-20);
    return { ...obj, x, y, vx, vy, trail };
  });
}

function predictKalman(obj: TrackedObject): { px: number; py: number } {
  return { px: obj.x + obj.vx * 1.5, py: obj.y + obj.vy * 1.5 };
}

function associateDetections(
  tracked: TrackedObject[],
  useSort: boolean,
  frame: number,
): { id: number; x: number; y: number }[] {
  return tracked.map((obj) => {
    const s = seededRandom(obj.id * 31 + frame * 7);
    if (useSort) {
      const pred = predictKalman(obj);
      const noise = (s - 0.5) * 4;
      return { id: obj.id, x: pred.px + noise, y: pred.py + noise };
    }
    const noise = (s - 0.5) * 8;
    return { id: obj.id, x: obj.x + obj.vx + noise, y: obj.y + obj.vy + noise };
  });
}

export default function ObjectTrackingExplorer() {
  const [running, setRunning] = useState(true);
  const [objects, setObjects] = useState(() => generateObjects(4));
  const [numObjects, setNumObjects] = useState(4);
  const [useSort, setUseSort] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);
  const [frameCount, setFrameCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);

  const handleNumObjects = useCallback((val: number) => {
    setNumObjects(val);
    setObjects(generateObjects(val));
    frameRef.current = 0;
    setFrameCount(0);
  }, []);

  const detections = useMemo(
    () => associateDetections(objects, useSort, frameCount),
    [objects, useSort, frameCount],
  );

  const tick = useCallback(() => {
    setObjects(prev => updateObjects(prev));
    frameRef.current += 1;
    setFrameCount(frameRef.current);
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(tick, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tick, running]);

  const resetSim = useCallback(() => {
    setObjects(generateObjects(numObjects));
    frameRef.current = 0;
    setFrameCount(0);
    setRunning(true);
  }, [numObjects]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Object Tracking</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Object tracking links detections across video frames. SORT (Simple Online and Realtime
          Tracking) uses Kalman filters for motion prediction and IoU for data association.
          DeepSORT adds appearance features for re-identification.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Tracking Controls</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Objects</label>
              <input type="range" min="2" max="8" step="1" value={numObjects}
                onChange={(e) => handleNumObjects(parseInt(e.target.value))}
                className="w-24" />
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{numObjects}</span>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={useSort}
                onChange={(e) => setUseSort(e.target.checked)}
                className="w-4 h-4" />
              SORT (Kalman + IoU)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="w-4 h-4" />
              Trails
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={showPredictions}
                onChange={(e) => setShowPredictions(e.target.checked)}
                className="w-4 h-4" />
              Predictions
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => setRunning(r => !r)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${running ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} hover:opacity-90`}>
                {running ? '\u25A0 Stop' : '\u25B6 Start'}
              </button>
              <button onClick={resetSim}
                className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Reset
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Frame: {frameCount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-100 dark:bg-gray-900 max-w-full"
            style={{ width: WIDTH, height: HEIGHT }}>
            {showTrails && objects.map((obj) =>
              obj.trail.length > 1 && obj.trail.map((t, ti) => (
                <div key={`${obj.id}-${ti}`}
                  className="absolute rounded-full"
                  style={{
                    left: t.x - 2,
                    top: t.y - 2,
                    width: 4,
                    height: 4,
                    backgroundColor: obj.color,
                    opacity: (ti / (obj.trail.length - 1)) * 0.5,
                  }} />
              ))
            )}

            {showPredictions && objects.map((obj) => {
              const pred = predictKalman(obj);
              return (
                <div key={`pred-${obj.id}`}
                  className="absolute border-2 border-dashed rounded"
                  style={{
                    left: pred.px - 8,
                    top: pred.py - 8,
                    width: 16,
                    height: 16,
                    borderColor: obj.color,
                    opacity: 0.5,
                  }} />
              );
            })}

            {detections.map((det) => {
              const obj = objects.find(o => o.id === det.id);
              const color = obj?.color ?? '#666';
              return (
                <div key={`det-${det.id}`}
                  className="absolute"
                  style={{
                    left: det.x - 10,
                    top: det.y - 10,
                    width: 20,
                    height: 20,
                  }}>
                  <svg viewBox="0 0 20 20" className="w-full h-full">
                    <rect x="1" y="1" width="18" height="18" rx="2" fill="none"
                      stroke={color} strokeWidth="2" strokeDasharray="4 2" opacity="0.7" />
                    <text x="10" y="14" textAnchor="middle" fontSize="7"
                      fill={color} fontWeight="bold">{det.id}</text>
                  </svg>
                </div>
              );
            })}

            {objects.map((obj) => {
              const labelTop = obj.y - 6 < 14 ? 'bottom-0 translate-y-full' : '-top-4';
              return (
                <div key={obj.id}
                  className="absolute"
                  style={{
                    left: obj.x - 10,
                    top: obj.y - 10,
                    width: 20,
                    height: 20,
                  }}>
                  <svg viewBox="0 0 20 20" className="w-full h-full">
                    <circle cx="10" cy="10" r="7" fill={obj.color} stroke="white" strokeWidth="1.5" />
                  </svg>
                  <div className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold ${labelTop}`}
                    style={{ color: obj.color }}>
                    ID:{obj.id}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 space-y-3">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400">
              <h3 className="font-semibold text-sm mb-2">SORT Algorithm</h3>
              <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li>Kalman Filter predicts next position for each tracked object</li>
                <li>New detections arrive each frame (simulated with noise)</li>
                <li>Hungarian algorithm matches predictions to detections via IoU cost matrix</li>
                <li>Unmatched detections start new tracks; unmatched tracks are terminated</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
              <h3 className="font-semibold text-sm mb-2">DeepSORT Extension</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Replaces IoU matching with appearance feature cosine similarity from a ReID
                network. This allows re-identification after occlusions and reduces ID switches.
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
              <h3 className="font-semibold text-sm mb-2">Kalman Filter</h3>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Predicts object state (x, y, vx, vy, w, h) using linear motion model, then
                corrects with measurement. Provides smooth trajectory estimation.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block bg-current" /> Tracked</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block border-2 border-current rounded" style={{ borderStyle: 'dashed' }} /> Detection</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block border-2 border-current border-dashed rounded" /> Prediction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
