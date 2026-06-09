/**
 * DecisionTreeBuilder - Interactive decision tree construction visualization
 * Phase 12: ML Visualizations
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { findBestSplit, calculateGini, type ClassifiedPoint } from '../../utils/ml-algorithms';

const WIDTH = 400;
const HEIGHT = 400;
const RANGE = 10;

type TreeNode = {
  feature: 'x' | 'y';
  threshold: number;
  gini: number;
  samples: number;
  left?: TreeNode;
  right?: TreeNode;
  prediction?: 0 | 1;
};

function buildTree(points: ClassifiedPoint[], depth = 0, maxDepth = 3): TreeNode | undefined {
  if (points.length === 0) return undefined;
  
  const labels = points.map(p => p.label);
  const gini = calculateGini(labels);
  
  if (depth >= maxDepth || gini === 0 || points.length < 2) {
    const sum = labels.reduce((a: number, b) => a + b, 0);
    const prediction = (sum >= labels.length / 2 ? 1 : 0) as 0 | 1;
    return { feature: 'x', threshold: 0, gini, samples: points.length, prediction };
  }
  
  const splitX = findBestSplit(points, 'x');
  const splitY = findBestSplit(points, 'y');
  
  if (!splitX && !splitY) {
    const sum = labels.reduce((a: number, b) => a + b, 0);
    const prediction = (sum >= labels.length / 2 ? 1 : 0) as 0 | 1;
    return { feature: 'x', threshold: 0, gini, samples: points.length, prediction };
  }
  
  const bestSplit = (!splitY || (splitX && splitX.gain > splitY.gain)) ? 
    { feature: 'x' as const, ...splitX! } : 
    { feature: 'y' as const, ...splitY! };
  
  const leftPoints = points.filter(p => p[bestSplit.feature] <= bestSplit.threshold);
  const rightPoints = points.filter(p => p[bestSplit.feature] > bestSplit.threshold);
  
  return {
    feature: bestSplit.feature,
    threshold: bestSplit.threshold,
    gini,
    samples: points.length,
    left: buildTree(leftPoints, depth + 1, maxDepth),
    right: buildTree(rightPoints, depth + 1, maxDepth),
  };
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

  const tree = useMemo(() => buildTree(points, 0, maxDepth), [points, maxDepth]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * RANGE;
    const y = RANGE - ((e.clientY - rect.top) / rect.height) * RANGE;
    setPoints(prev => [...prev, { x, y, label: activeClass }]);
  }, [activeClass]);

  const handleRemovePoint = useCallback((index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const renderSplits = (node: TreeNode | undefined, bounds: { minX: number; maxX: number; minY: number; maxY: number }): React.JSX.Element[] => {
    if (!node || node.prediction !== undefined) return [];
    
    const elements: React.JSX.Element[] = [];
    const { minX, maxX, minY, maxY } = bounds;
    
    if (node.feature === 'x') {
      const x = (node.threshold / RANGE) * WIDTH;
      elements.push(
        <line
          key={`split-${node.threshold}-${node.feature}`}
          x1={x}
          y1={HEIGHT - (maxY / RANGE) * HEIGHT}
          x2={x}
          y2={HEIGHT - (minY / RANGE) * HEIGHT}
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeDasharray="4"
        />
      );
      
      if (node.left) {
        elements.push(...renderSplits(node.left, { minX, maxX: node.threshold, minY, maxY }));
      }
      if (node.right) {
        elements.push(...renderSplits(node.right, { minX: node.threshold, maxX, minY, maxY }));
      }
    } else {
      const y = HEIGHT - (node.threshold / RANGE) * HEIGHT;
      elements.push(
        <line
          key={`split-${node.threshold}-${node.feature}`}
          x1={(minX / RANGE) * WIDTH}
          y1={y}
          x2={(maxX / RANGE) * WIDTH}
          y2={y}
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeDasharray="4"
        />
      );
      
      if (node.left) {
        elements.push(...renderSplits(node.left, { minX, maxX, minY, maxY: node.threshold }));
      }
      if (node.right) {
        elements.push(...renderSplits(node.right, { minX, maxX, minY: node.threshold, maxY }));
      }
    }
    
    return elements;
  };

  const countNodes = (node: TreeNode | undefined): number => {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  };

  const countLeaves = (node: TreeNode | undefined): number => {
    if (!node) return 0;
    if (node.prediction !== undefined) return 1;
    return countLeaves(node.left) + countLeaves(node.right);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Decision Tree Builder</h2>
        <p className="text-gray-600 mb-6">
          Build a decision tree by adding points. Purple lines show split decisions based on Gini impurity.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="relative w-full max-w-[400px] aspect-square bg-gray-50 border-2 border-gray-300 rounded cursor-crosshair"
              onClick={handleCanvasClick}
            >
              <svg width={WIDTH} height={HEIGHT} className="absolute inset-0 w-full h-full">
                <g>
                  {renderSplits(tree, { minX: 0, maxX: RANGE, minY: 0, maxY: RANGE })}
                </g>

                <g>
                  {points.map((p, i) => (
                    <motion.circle
                      key={i}
                      cx={(p.x / RANGE) * WIDTH}
                      cy={HEIGHT - (p.y / RANGE) * HEIGHT}
                      r="6"
                      fill={p.label === 1 ? '#3b82f6' : '#ef4444'}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePoint(i);
                      }}
                      whileHover={{ scale: 1.3 }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  ))}
                </g>
              </svg>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveClass(1)}
                className={`px-4 py-2 rounded ${activeClass === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Class 1
              </button>
              <button
                onClick={() => setActiveClass(0)}
                className={`px-4 py-2 rounded ${activeClass === 0 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
              >
                Class 0
              </button>
              <button
                onClick={() => setPoints([])}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Tree Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Nodes:</span>
                  <span className="font-mono">{tree ? countNodes(tree) : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leaf Nodes:</span>
                  <span className="font-mono">{tree ? countLeaves(tree) : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Depth:</span>
                  <span className="font-mono">{maxDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Root Gini:</span>
                  <span className="font-mono">{tree ? tree.gini.toFixed(3) : '0.000'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-mono">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class 0:</span>
                  <span className="font-mono">{points.filter(p => p.label === 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class 1:</span>
                  <span className="font-mono">{points.filter(p => p.label === 1).length}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Tree Depth: {maxDepth}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                Deeper trees = more complex splits
              </p>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p className="font-semibold mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Finds best split to minimize Gini impurity</li>
                <li>Purple lines show decision boundaries</li>
                <li>Vertical: splits on X feature</li>
                <li>Horizontal: splits on Y feature</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
