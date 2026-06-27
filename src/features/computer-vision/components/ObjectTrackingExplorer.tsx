'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import LearnMoreSection from './LearnMoreSection';

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

        {/* Learn More Section */}
        <LearnMoreSection
          title="Learn Object Tracking"
          gradientFrom="from-orange-50"
          gradientTo="to-yellow-50"
          darkGradientFrom="from-orange-950/30"
          darkGradientTo="from-yellow-950/30"
          hoverFrom="hover:from-orange-100"
          hoverTo="hover:to-yellow-100"
          darkHoverFrom="dark:hover:from-orange-950/50"
          darkHoverTo="dark:hover:to-yellow-950/50"
          analogyTitle="Following a Friend in a Crowd"
          analogyIcon="👥"
          analogyContent={
            <>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Imagine trying to follow your friend through a crowded market. You first spot them
                (detection), then remember their appearance (feature extraction), and predict where
                they'll move next (motion model). Each frame, you match what you see with what you expect.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-orange-600 text-[10px] mb-2">Detection + Re-ID</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    An object detector finds bounding boxes each frame. A Re-ID network extracts
                    appearance features to match the same identity across frames.
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-yellow-600 text-[10px] mb-2">Motion Prediction</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Kalman filter predicts where each object will be in the next frame based on
                    velocity and acceleration, handling temporary occlusions.
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Key insight:</strong> Multi-object tracking (MOT) combines detection, feature extraction,
                and motion prediction to maintain consistent identities over time, even when objects
                overlap or temporarily disappear.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-amber-700 dark:text-amber-400">🔗 Hungarian Algorithm</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Solves the assignment problem: matching detections to existing tracks optimally
                    by minimizing a cost matrix (IoU + appearance distance).
                  </p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-rose-700 dark:text-rose-400">🔄 Track Management</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Initialize new tracks for unmatched detections, delete tracks that haven't been
                    matched for several frames, and handle track fragmentation.
                  </p>
                </div>
              </div>
            </>
          }
          stepsTitle="How Multi-Object Tracking Works"
          stepsContent={[
            { step: 1, title: 'Object Detection', desc: 'Run detector on each frame to get bounding boxes + confidence.', formula: 'frame → detector → boxes, scores' },
            { step: 2, title: 'Feature Extraction', desc: 'Extract appearance features (Re-ID) for each detection.', formula: 'crop → CNN → 256-d appearance feature' },
            { step: 3, title: 'Prediction', desc: 'Kalman filter predicts next state for each existing track.', formula: 'x_t = F * x_{t-1} + noise' },
            { step: 4, title: 'Data Association', desc: 'Match detections to tracks using cost matrix (IoU + appearance).', formula: 'cost = α·IoU + β·appearance_distance' },
            { step: 5, title: 'Track Update', desc: 'Update matched tracks, create new tracks, delete lost tracks.', formula: 'Kalman update for matched, initialize new, age++' },
          ]}
          simpleTitle="Simple MOT with Kalman Filter"
          simpleCode={`import numpy as np
from filterpy.kalman import KalmanFilter

class KalmanTracker:
    def __init__(self, bbox):
        self.kf = KalmanFilter(dim_x=7, dim_z=4)
        self.kf.F = np.array([
            [1,0,0,0,1,0,0],
            [0,1,0,0,0,1,0],
            [0,0,1,0,0,0,1],
            [0,0,0,1,0,0,0],
            [0,0,0,0,1,0,0],
            [0,0,0,0,0,1,0],
            [0,0,0,0,0,0,1]
        ])
        self.kf.H = np.array([
            [1,0,0,0,0,0,0],
            [0,1,0,0,0,0,0],
            [0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0]
        ])
        self.kf.R *= 10
        self.kf.P[4:,4:] *= 1000
        self.kf.P *= 10
        self.kf.x[:4] = bbox.reshape((4, 1))
        self.time_since_update = 0
    
    def predict(self):
        self.kf.predict()
        self.time_since_update += 1
        return self.kf.x[:4].reshape((4,))
    
    def update(self, bbox):
        self.kf.update(bbox.reshape((4, 1)))
        self.time_since_update = 0

# Example usage
tracker = KalmanTracker(np.array([100, 50, 50, 50]))
prediction = tracker.predict()
tracker.update(np.array([102, 52, 50, 50]))`}
          scratchTitle="Simple tracker from scratch"
          scratchCode={`import numpy as np
from scipy.optimize import linear_sum_assignment

class SimpleMOT:
    def __init__(self, iou_threshold=0.3, max_age=30):
        self.tracks = []
        self.next_id = 0
        self.iou_threshold = iou_threshold
        self.max_age = max_age
    
    def update(self, detections):
        # Predict existing tracks
        for track in self.tracks:
            track['age'] += 1
            track['hit'] = False
        
        # Compute cost matrix (IoU)
        if len(self.tracks) > 0 and len(detections) > 0:
            cost = np.zeros((len(self.tracks), len(detections)))
            for i, track in enumerate(self.tracks):
                for j, det in enumerate(detections):
                    cost[i, j] = 1 - self.iou(track['bbox'], det)
            
            # Hungarian assignment
            row_idx, col_idx = linear_sum_assignment(cost)
            
            # Update matched tracks
            matched_dets = set()
            for r, c in zip(row_idx, col_idx):
                if cost[r, c] < 1 - self.iou_threshold:
                    self.tracks[r]['bbox'] = detections[c]
                    self.tracks[r]['age'] = 0
                    self.tracks[r]['hit'] = True
                    matched_dets.add(c)
            
            # Delete unmatched tracks
            self.tracks = [t for t in self.tracks if t['age'] < self.max_age]
        else:
            matched_dets = set()
        
        # Create new tracks for unmatched detections
        for j, det in enumerate(detections):
            if j not in matched_dets:
                self.tracks.append({
                    'id': self.next_id,
                    'bbox': det,
                    'age': 0,
                    'hit': True
                })
                self.next_id += 1
        
        return [(t['id'], t['bbox']) for t in self.tracks if t['hit']]
    
    def iou(self, bbox1, bbox2):
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        inter = max(0, x2-x1) * max(0, y2-y1)
        area1 = (bbox1[2]-bbox1[0]) * (bbox1[3]-bbox1[1])
        area2 = (bbox2[2]-bbox2[0]) * (bbox2[3]-bbox2[1])
        return inter / (area1 + area2 - inter + 1e-6)`}
        />
      </div>
    </div>
  );
}
