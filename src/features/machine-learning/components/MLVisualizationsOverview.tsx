'use client';

import Link from 'next/link';

const visualizations = [
  {
    title: 'Linear Regression',
    description: 'Interactive gradient descent on 2D data. Watch the model find the best-fit line in real-time.',
    href: '/ml/linear-regression',
    icon: '📈',
    color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    title: 'Logistic Regression',
    description: 'Binary classification with sigmoid decision boundaries. Visualize probability heatmaps.',
    href: '/ml/logistic-regression',
    icon: '🎯',
    color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
  },
  {
    title: 'K-Nearest Neighbors',
    description: 'See how KNN classifies points based on their K nearest neighbors. Adjust K in real-time.',
    href: '/ml/knn',
    icon: '🔍',
    color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
  },
  {
    title: 'Decision Tree',
    description: 'Build decision trees with Gini impurity splits. Visualize recursive partitioning.',
    href: '/ml/decision-tree',
    icon: '🌳',
    color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600',
  },
  {
    title: 'K-Means Clustering',
    description: 'Watch centroids converge step-by-step. Animate the clustering process.',
    href: '/ml/kmeans',
    icon: '🎨',
    color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
  },
  {
    title: 'PCA (Dimensionality Reduction)',
    description: 'Visualize principal components and variance explained. See projections in real-time.',
    href: '/ml/pca',
    icon: '📊',
    color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600',
  },
  {
    title: 'SVM (Support Vector Machine)',
    description: 'Explore maximum margin classifiers. Adjust regularization and see support vectors.',
    href: '/ml/svm',
    icon: '⚡',
    color: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600',
  },
  {
    title: 'Random Forest',
    description: 'Build an ensemble of decision trees with bagging. Watch the forest reduce variance and improve accuracy.',
    href: '/ml/random-forest',
    icon: '🌲',
    color: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600',
  },
  {
    title: 'Naive Bayes',
    description: 'Probabilistic classification using Bayes\' theorem. See how Gaussian Naive Bayes estimates class-conditional distributions.',
    href: '/ml/naive-bayes',
    icon: '📐',
    color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600',
  },
];

export default function MLVisualizationsOverview() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🤖 Interactive Visualizations
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore ML algorithms through interactive playgrounds. Click on any visualization
          to see how algorithms learn from data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visualizations.map((viz) => (
          <Link
            key={viz.href}
            href={viz.href}
            className={`block p-6 border-2 rounded-lg transition-all active:scale-95 ${viz.color}`}
          >
            <div className="text-4xl mb-3 select-none pointer-events-none">{viz.icon}</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {viz.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {viz.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
