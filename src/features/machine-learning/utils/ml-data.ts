import type { MLCategory, MLCategoryId, MLLesson, MLTopic } from '../types';

export const ML_CATEGORIES: MLCategory[] = [
  {
    id: 'regression',
    title: 'Regression',
    description: 'Predict continuous values by modeling relationships between variables — the foundation of supervised learning.',
    icon: '📈',
    color: '#3B82F6',
    totalLessons: 2,
  },
  {
    id: 'classification',
    title: 'Classification',
    description: 'Assign data points to discrete categories using decision boundaries, probability estimates, and ensemble methods.',
    icon: '🎯',
    color: '#10B981',
    totalLessons: 5,
  },
  {
    id: 'unsupervised',
    title: 'Unsupervised Learning',
    description: 'Discover hidden patterns and structure in unlabeled data through clustering and dimensionality reduction.',
    icon: '🔍',
    color: '#8B5CF6',
    totalLessons: 2,
  },
];

const regressionLessons: MLLesson[] = [
  {
    id: 'ml-linear-regression',
    title: 'Linear Regression',
    slug: 'ml-linear-regression',
    categoryId: 'regression',
    description: 'Model the relationship between input features and a continuous target using a linear function — the simplest supervised learning algorithm.',
    order: 1,
    topics: ['Model formulation', 'Least squares', 'Gradient descent', 'Multiple regression', 'Polynomial regression'],
    visualComponents: ['Line of best fit', 'Residual plot', 'Gradient descent animation'],
  },
  {
    id: 'ml-logistic-regression',
    title: 'Logistic Regression',
    slug: 'ml-logistic-regression',
    categoryId: 'regression',
    description: 'Binary classification using the sigmoid function to model class probabilities — despite its name, a classification algorithm.',
    order: 2,
    topics: ['Sigmoid function', 'Decision boundary', 'Log-likelihood', 'Cross-entropy loss', 'Multi-class (softmax)'],
    visualComponents: ['Decision boundary explorer', 'Probability heatmap'],
    prerequisites: ['ml-linear-regression'],
  },
];

const classificationLessons: MLLesson[] = [
  {
    id: 'ml-knn',
    title: 'K-Nearest Neighbors',
    slug: 'ml-knn',
    categoryId: 'classification',
    description: 'Classify points based on the majority vote of their K closest neighbors — a simple, intuitive non-parametric method.',
    order: 1,
    topics: ['Distance metrics', 'Choosing K', 'Decision boundaries', 'Weighted voting', 'Curse of dimensionality'],
    visualComponents: ['KNN decision boundary explorer', 'Distance-weighted visualization'],
  },
  {
    id: 'ml-decision-tree',
    title: 'Decision Tree',
    slug: 'ml-decision-tree',
    categoryId: 'classification',
    description: 'Hierarchical partitioning of feature space using recursive splits based on Gini impurity or information gain.',
    order: 2,
    topics: ['Gini impurity', 'Information gain', 'Tree growth', 'Pruning', 'Feature importance'],
    visualComponents: ['Interactive tree builder', 'Partition visualization'],
    prerequisites: ['ml-knn'],
  },
  {
    id: 'ml-random-forest',
    title: 'Random Forest',
    slug: 'ml-random-forest',
    categoryId: 'classification',
    description: 'An ensemble of decision trees trained with bagging and random feature selection — reduces variance while maintaining bias.',
    order: 3,
    topics: ['Bagging', 'Random subspace', 'Out-of-bag error', 'Feature importance', 'Hyperparameter tuning'],
    visualComponents: ['Ensemble visualization', 'Decision boundary comparison'],
    prerequisites: ['ml-decision-tree'],
  },
  {
    id: 'ml-svm',
    title: 'Support Vector Machine',
    slug: 'ml-svm',
    categoryId: 'classification',
    description: 'Find the optimal hyperplane that maximizes the margin between classes — powerful for high-dimensional spaces.',
    order: 4,
    topics: ['Maximum margin', 'Support vectors', 'Kernel trick', 'Soft margin (C)', 'RBF kernel'],
    visualComponents: ['Margin visualization', 'Kernel transformation viewer'],
    prerequisites: ['ml-knn'],
  },
  {
    id: 'ml-naive-bayes',
    title: 'Naive Bayes',
    slug: 'ml-naive-bayes',
    categoryId: 'classification',
    description: 'Probabilistic classifier based on Bayes theorem with strong independence assumptions — fast and effective for high-dimensional data.',
    order: 5,
    topics: ['Bayes theorem', 'Conditional independence', 'Gaussian NB', 'Log probabilities', 'Text classification'],
    visualComponents: ['Gaussian ellipse visualization', 'Decision boundary explorer'],
    prerequisites: ['ml-knn'],
  },
];

const unsupervisedLessons: MLLesson[] = [
  {
    id: 'ml-kmeans',
    title: 'K-Means Clustering',
    slug: 'ml-kmeans',
    categoryId: 'unsupervised',
    description: 'Partition data into K clusters by iteratively assigning points to the nearest centroid — a fundamental unsupervised algorithm.',
    order: 1,
    topics: ['Centroid initialization', 'Assignment step', 'Update step', 'Elbow method', 'K-means++'],
    visualComponents: ['Centroid convergence animation', 'Cluster assignment visualization'],
  },
  {
    id: 'ml-pca',
    title: 'Principal Component Analysis',
    slug: 'ml-pca',
    categoryId: 'unsupervised',
    description: 'Dimensionality reduction by projecting data onto the directions of maximum variance — reveals latent structure.',
    order: 2,
    topics: ['Variance maximization', 'Eigenvectors', 'Explained variance', 'Whitening', 'Reconstruction error'],
    visualComponents: ['PCA projection explorer', 'Scree plot', '2D to 1D projection'],
  },
];

export const ML_TOPICS: MLTopic[] = [
  { category: ML_CATEGORIES[0], lessons: regressionLessons },
  { category: ML_CATEGORIES[1], lessons: classificationLessons },
  { category: ML_CATEGORIES[2], lessons: unsupervisedLessons },
];

export const ALL_ML_LESSONS: MLLesson[] = [
  ...regressionLessons,
  ...classificationLessons,
  ...unsupervisedLessons,
];

export const TOTAL_ML_LESSONS = ALL_ML_LESSONS.length;
