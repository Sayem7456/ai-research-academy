/**
 * KMeansAnimation - Interactive K-Means clustering with step-by-step animation
 * Phase 12: ML Visualizations
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { kMeansStep, initializeKMeansCentroids, type Point2D } from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function KMeansAnimation() {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState<Point2D[]>([]);
  const [assignments, setAssignments] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [step, setStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initializeClusters = useCallback(() => {
    if (points.length === 0) return;
    const newCentroids = initializeKMeansCentroids(points, k);
    setCentroids(newCentroids);
    const { assignments: newAssignments } = kMeansStep(points, newCentroids);
    setAssignments(newAssignments);
    setStep(0);
    setIsConverged(false);
    setIsAnimating(false);
  }, [points, k]);

  const performStep = useCallback(() => {
    if (centroids.length === 0 || points.length === 0) return;
    const { newCentroids, assignments: newAssignments } = kMeansStep(points, centroids);

    const maxShift = newCentroids.reduce((max, c, i) => {
      const prev = centroids[i];
      const shift = Math.hypot(c.x - prev.x, c.y - prev.y);
      return Math.max(max, shift);
    }, 0);

    const changedAssignments =
      assignments.length !== newAssignments.length ||
      assignments.some((a, i) => a !== newAssignments[i]);

    const converged = maxShift < 1e-3 && !changedAssignments;

    setCentroids(newCentroids);
    setAssignments(newAssignments);
    setStep(prev => prev + 1);
    setIsConverged(converged);
    if (converged) {
      setIsAnimating(false);
    }
  }, [points, centroids, assignments]);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAnimating && centroids.length > 0 && !isConverged) {
      timerRef.current = setTimeout(() => {
        performStep();
      }, 1000);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [isAnimating, step, performStep, centroids, isConverged]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x, y }]);
    if (centroids.length > 0) {
      initializeClusters();
    }
  }, [centroids.length, initializeClusters]);

  const handleReset = useCallback(() => {
    setPoints([]);
    setCentroids([]);
    setAssignments([]);
    setStep(0);
    setIsConverged(false);
    setIsAnimating(false);
  }, []);

  const handleRandomData = useCallback(() => {
    const newPoints: Point2D[] = [];
    const numClusters = k;
    const pointsPerCluster = 15;
    
    for (let c = 0; c < numClusters; c++) {
      const centerX = 2 + Math.random() * 6;
      const centerY = 2 + Math.random() * 6;
      
      for (let i = 0; i < pointsPerCluster; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 1.5;
        newPoints.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      }
    }
    setPoints(newPoints);
    setCentroids([]);
    setAssignments([]);
    setStep(0);
    setIsConverged(false);
  }, [k]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">K-Means Clustering Animation</h2>
        <p className="text-gray-600 mb-6">
          Watch K-Means iteratively refine cluster centers. Click to add points or generate random data.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            >
              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full">
                <g>
                  {points.map((p, i) => {
                    const cluster = assignments[i] ?? 0;
                    return (
                      <motion.circle
                        key={i}
                        cx={(p.x / RANGE) * WIDTH}
                        cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                        r="4"
                        fill={COLORS[cluster % COLORS.length]}
                        stroke="white"
                        strokeWidth="1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    );
                  })}
                </g>

                <g>
                  {centroids.map((c, i) => (
                    <motion.g
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <circle
                        cx={(c.x / RANGE) * WIDTH}
                        cy={HEIGHT - (c.y / RANGE) * HEIGHT}
                        r="10"
                        fill={COLORS[i % COLORS.length]}
                        stroke="black"
                        strokeWidth="3"
                      />
                      <text
                        x={(c.x / RANGE) * WIDTH}
                        y={HEIGHT - (c.y / RANGE) * HEIGHT + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        C{i + 1}
                      </text>
                    </motion.g>
                  ))}
                </g>
              </svg>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={initializeClusters}
                disabled={points.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Initialize
              </button>
              <button
                onClick={performStep}
                disabled={centroids.length === 0 || isAnimating || isConverged}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Step
              </button>
              <button
                onClick={isAnimating ? stopAnimation : startAnimation}
                disabled={centroids.length === 0 || isConverged}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {isAnimating ? 'Stop' : 'Animate'}
              </button>
              <button onClick={handleRandomData} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Random Data
              </button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Clustering Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clusters (K):</span>
                  <span className="font-mono">{k}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iteration:</span>
                  <span className="font-mono">{step}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-mono">{isConverged ? 'Converged' : isAnimating ? 'Running' : 'Paused'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Clusters (K): {k}
              </label>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={k}
                onChange={(e) => {
                  setK(parseInt(e.target.value));
                  setCentroids([]);
                  setAssignments([]);
                  setStep(0);
                }}
                className="w-full"
              />
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-2">K-Means Algorithm:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Initialize K random centroids (large circles)</li>
                <li>Assign each point to nearest centroid</li>
                <li>Update centroids to cluster mean</li>
                <li>Repeat until convergence</li>
              </ol>
            </div>

            <div className="text-sm bg-purple-50 p-3 rounded">
              <p className="font-semibold mb-1">Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Click "Random Data" to generate clustered points</li>
                <li>Click "Initialize" to place initial centroids</li>
                <li>Use "Step" to manually advance one iteration</li>
                <li>Use "Animate" to watch automatic convergence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
