/**
 * VisualizationsOverview - Gallery page for all math visualizations
 * Phase 10: Mathematics Visualizations
 */

'use client';

import React, { useState } from 'react';
import {
  MatrixVisualizer,
  VectorVisualizer,
  EigenvectorVisualizer,
  PCAVisualizer,
  GradientDescentSimulator,
  DistributionExplorer,
  BayesianUpdateSimulator,
} from './index';

type VizId = 'matrix' | 'vector' | 'eigen' | 'pca' | 'gd' | 'dist' | 'bayes';

const VISUALIZATIONS: { id: VizId; name: string; icon: string; description: string; category: string }[] = [
  { id: 'matrix', name: 'Matrix Visualizer', icon: '🔢', description: 'See how a 2x2 matrix transforms the plane, basis vectors, and shapes.', category: 'Linear Algebra' },
  { id: 'vector', name: 'Vector Visualizer', icon: '➡️', description: 'Explore vector addition, scaling, and dot product geometrically.', category: 'Linear Algebra' },
  { id: 'eigen', name: 'Eigenvector Visualizer', icon: '🎯', description: 'Discover eigenvectors as directions that only stretch, not rotate.', category: 'Linear Algebra' },
  { id: 'pca', name: 'PCA Visualizer', icon: '📊', description: 'Watch PCA find the directions of maximum variance in data.', category: 'Linear Algebra' },
  { id: 'gd', name: 'Gradient Descent Simulator', icon: '⛰️', description: 'Navigate loss landscapes with adjustable learning rate and momentum.', category: 'Calculus' },
  { id: 'dist', name: 'Distribution Explorer', icon: '📈', description: 'Visualize Gaussian, Uniform, Binomial, Poisson, Exponential, and Beta distributions.', category: 'Probability' },
  { id: 'bayes', name: 'Bayesian Update Simulator', icon: '🔄', description: 'Watch prior beliefs update as new evidence arrives.', category: 'Probability' },
];

export default function VisualizationsOverview() {
  const [activeViz, setActiveViz] = useState<VizId | null>(null);

  if (activeViz) {
    const viz = VISUALIZATIONS.find((v) => v.id === activeViz)!;
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <button
          onClick={() => setActiveViz(null)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all visualizations
        </button>
        {activeViz === 'matrix' && <MatrixVisualizer />}
        {activeViz === 'vector' && <VectorVisualizer />}
        {activeViz === 'eigen' && <EigenvectorVisualizer />}
        {activeViz === 'pca' && <PCAVisualizer />}
        {activeViz === 'gd' && <GradientDescentSimulator />}
        {activeViz === 'dist' && <DistributionExplorer />}
        {activeViz === 'bayes' && <BayesianUpdateSimulator />}
      </div>
    );
  }

  // Group by category
  const categories = [...new Set(VISUALIZATIONS.map((v) => v.category))];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Interactive Visualizations
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore mathematical concepts through interactive simulations. Adjust parameters,
          observe animations, and build intuition for the math behind AI.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="w-8 h-1 rounded-full bg-blue-500" />
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VISUALIZATIONS.filter((v) => v.category === category).map((viz) => (
              <button
                key={viz.id}
                onClick={() => setActiveViz(viz.id)}
                className="text-left bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{viz.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {viz.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {viz.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                      Open interactive
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Info card */}
    </div>
  );
}
