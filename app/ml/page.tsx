import Link from 'next/link';

export default function MLIndex() {
  const visualizations = [
    {
      title: 'Linear Regression',
      description: 'Interactive gradient descent on 2D data. Watch the model find the best-fit line in real-time.',
      href: '/ml/linear-regression',
      icon: '📈',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    },
    {
      title: 'Logistic Regression',
      description: 'Binary classification with sigmoid decision boundaries. Visualize probability heatmaps.',
      href: '/ml/logistic-regression',
      icon: '🎯',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    },
    {
      title: 'K-Nearest Neighbors',
      description: 'See how KNN classifies points based on their K nearest neighbors. Adjust K in real-time.',
      href: '/ml/knn',
      icon: '🔍',
      color: 'bg-green-50 border-green-200 hover:border-green-400',
    },
    {
      title: 'Decision Tree',
      description: 'Build decision trees with Gini impurity splits. Visualize recursive partitioning.',
      href: '/ml/decision-tree',
      icon: '🌳',
      color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    },
    {
      title: 'K-Means Clustering',
      description: 'Watch centroids converge step-by-step. Animate the clustering process.',
      href: '/ml/kmeans',
      icon: '🎨',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    },
    {
      title: 'PCA (Dimensionality Reduction)',
      description: 'Visualize principal components and variance explained. See projections in real-time.',
      href: '/ml/pca',
      icon: '📊',
      color: 'bg-red-50 border-red-200 hover:border-red-400',
    },
    {
      title: 'SVM (Support Vector Machine)',
      description: 'Explore maximum margin classifiers. Adjust regularization and see support vectors.',
      href: '/ml/svm',
      icon: '⚡',
      color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Machine Learning Visualizations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interactive playgrounds for understanding ML algorithms. 
            Click on any visualization to explore how algorithms learn from data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualizations.map((viz) => (
            <Link
              key={viz.href}
              href={viz.href}
              className={`block p-6 border-2 rounded-lg transition-all ${viz.color}`}
            >
              <div className="text-4xl mb-3">{viz.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {viz.title}
              </h2>
              <p className="text-sm text-gray-600">
                {viz.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
