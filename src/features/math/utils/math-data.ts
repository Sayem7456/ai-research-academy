/**
 * Mathematics Module Data
 * Phase 9: Mathematics Module
 *
 * Complete curriculum data for all four math categories:
 * Linear Algebra, Calculus, Probability, Statistics
 */

import type { MathCategory, MathCategoryId, MathLesson, MathTopic, PracticeQuestion } from '../types';

// ============================================================================
// CATEGORIES
// ============================================================================

export const MATH_CATEGORIES: MathCategory[] = [
  {
    id: 'linear-algebra',
    title: 'Linear Algebra',
    description: 'Vectors, matrices, transformations, eigenvalues, SVD, and PCA — the mathematical backbone of machine learning and deep learning.',
    icon: '📐',
    color: '#10B981',
    totalLessons: 9,
  },
  {
    id: 'calculus',
    title: 'Calculus',
    description: 'Limits, derivatives, gradients, Jacobians, Hessians, and optimization — the engine behind neural network training.',
    icon: '📈',
    color: '#3B82F6',
    totalLessons: 8,
  },
  {
    id: 'probability',
    title: 'Probability',
    description: 'Random variables, distributions, Bayes theorem, MLE, and MAP — the language of uncertainty in AI.',
    icon: '🎲',
    color: '#8B5CF6',
    totalLessons: 6,
  },
  {
    id: 'statistics',
    title: 'Statistics',
    description: 'Hypothesis testing, confidence intervals, correlation, and covariance — tools for analyzing experimental results.',
    icon: '📊',
    color: '#F59E0B',
    totalLessons: 4,
  },
];

// ============================================================================
// LINEAR ALGEBRA LESSONS
// ============================================================================

const linearAlgebraLessons: MathLesson[] = [
  {
    id: 'la-scalars',
    title: 'Scalars',
    slug: 'la-scalars',
    categoryId: 'linear-algebra',
    description: 'Understanding scalars as the simplest data type — single numerical values that form the foundation of all mathematical operations in AI.',
    order: 1,
    topics: ['Definition', 'Types of numbers', 'Operations', 'Role in AI'],
    visualComponents: ['Number line visualization'],
  },
  {
    id: 'la-vectors',
    title: 'Vectors',
    slug: 'la-vectors',
    categoryId: 'linear-algebra',
    description: 'Vectors as ordered arrays of numbers — the fundamental data structure for representing features in machine learning.',
    order: 2,
    topics: ['Definition', 'Vector operations', 'Dot product', 'Norm', 'Unit vectors', 'Basis vectors'],
    visualComponents: ['2D/3D vector plotter', 'Vector addition animation'],
    prerequisites: ['la-scalars'],
  },
  {
    id: 'la-matrices',
    title: 'Matrices',
    slug: 'la-matrices',
    categoryId: 'linear-algebra',
    description: 'Matrices as 2D arrays representing linear transformations, data tables, and weight matrices in neural networks.',
    order: 3,
    topics: ['Definition', 'Types', 'Operations', 'Transpose', 'Inverse', 'Rank'],
    visualComponents: ['Matrix grid visualization'],
    prerequisites: ['la-vectors'],
  },
  {
    id: 'la-tensors',
    title: 'Tensors',
    slug: 'la-tensors',
    categoryId: 'linear-algebra',
    description: 'Tensors as multi-dimensional arrays — the generalization of scalars, vectors, and matrices used throughout deep learning.',
    order: 4,
    topics: ['Definition', 'Tensor rank', 'Operations', 'Broadcasting', 'Tensor contractions'],
    visualComponents: ['Tensor dimension visualizer'],
    prerequisites: ['la-matrices'],
  },
  {
    id: 'la-matrix-multiplication',
    title: 'Matrix Multiplication',
    slug: 'la-matrix-multiplication',
    categoryId: 'linear-algebra',
    description: 'Matrix multiplication as composition of linear transformations — the core operation in neural network forward passes.',
    order: 5,
    topics: ['Dot product view', 'Column-row view', 'Block multiplication', 'Complexity', 'Strassen algorithm'],
    visualComponents: ['Matrix transformation viewer', 'Composition animation'],
    prerequisites: ['la-matrices'],
  },
  {
    id: 'la-determinant',
    title: 'Determinant',
    slug: 'la-determinant',
    categoryId: 'linear-algebra',
    description: 'The determinant as a measure of how a linear transformation scales area/volume — crucial for understanding invertibility.',
    order: 6,
    topics: ['Geometric interpretation', 'Properties', 'Computation', 'Cofactor expansion', 'Cramer\'s rule'],
    visualComponents: ['Area scaling visualization'],
    prerequisites: ['la-matrix-multiplication'],
  },
  {
    id: 'la-eigenvalues',
    title: 'Eigenvalues & Eigenvectors',
    slug: 'la-eigenvalues',
    categoryId: 'linear-algebra',
    description: 'Eigenvalues and eigenvectors reveal the fundamental directions and scaling factors of linear transformations.',
    order: 7,
    topics: ['Definition', 'Characteristic equation', 'Computation', 'Geometric meaning', 'Diagonalization', 'Spectral theorem'],
    visualComponents: ['Eigenvector visualizer', 'Transformation animation'],
    prerequisites: ['la-determinant'],
    papers: [
      { title: 'On the Eigenvalues of Matrices', year: '1950', difficulty: 'hard' },
    ],
  },
  {
    id: 'la-svd',
    title: 'Singular Value Decomposition',
    slug: 'la-svd',
    categoryId: 'linear-algebra',
    description: 'SVD decomposes any matrix into three fundamental components — one of the most powerful factorizations in all of mathematics.',
    order: 8,
    topics: ['Decomposition', 'Geometric interpretation', 'Computation', 'Low-rank approximation', 'Applications in AI'],
    visualComponents: ['SVD geometric decomposition'],
    prerequisites: ['la-eigenvalues'],
    papers: [
      { title: 'Singular Value Decomposition and Its Applications', year: '2001', difficulty: 'medium' },
    ],
  },
  {
    id: 'la-pca',
    title: 'PCA Mathematics',
    slug: 'la-pca',
    categoryId: 'linear-algebra',
    description: 'Principal Component Analysis uses eigenvalues and SVD to find the directions of maximum variance in high-dimensional data.',
    order: 9,
    topics: ['Motivation', 'Covariance matrix', 'Eigenvalue approach', 'SVD approach', 'Dimensionality reduction', 'Explained variance'],
    visualComponents: ['PCA Visualizer', 'Variance explained plot'],
    prerequisites: ['la-svd'],
    papers: [
      { title: 'Analysis of a Complex of Statistical Variables into Random Components', author: 'Hotelling', year: '1933', difficulty: 'hard' } as any,
    ],
  },
];

// ============================================================================
// CALCULUS LESSONS
// ============================================================================

const calculusLessons: MathLesson[] = [
  {
    id: 'calc-limits',
    title: 'Limits',
    slug: 'calc-limits',
    categoryId: 'calculus',
    description: 'Limits describe the behavior of functions as inputs approach a value — the foundational concept of calculus.',
    order: 1,
    topics: ['Intuition', 'Formal definition', 'Limit laws', 'Squeeze theorem', 'Limits at infinity'],
    visualComponents: ['Interactive limit explorer'],
  },
  {
    id: 'calc-derivatives',
    title: 'Derivatives',
    slug: 'calc-derivatives',
    categoryId: 'calculus',
    description: 'Derivatives measure the instantaneous rate of change — the slope of the tangent line at any point on a curve.',
    order: 2,
    topics: ['Definition', 'Power rule', 'Product rule', 'Quotient rule', 'Common derivatives', 'Higher-order derivatives'],
    visualComponents: ['Tangent line animation', 'Derivative plotter'],
    prerequisites: ['calc-limits'],
  },
  {
    id: 'calc-chain-rule',
    title: 'Chain Rule',
    slug: 'calc-chain-rule',
    categoryId: 'calculus',
    description: 'The chain rule computes derivatives of composite functions — the mathematical basis of backpropagation in neural networks.',
    order: 3,
    topics: ['Statement', 'Proof sketch', 'Examples', 'Connection to backpropagation', 'Computational graphs'],
    visualComponents: ['Computational graph animation'],
    prerequisites: ['calc-derivatives'],
    papers: [
      { title: 'Automatic Differentiation in Machine Learning', year: '2018', difficulty: 'medium' },
    ],
  },
  {
    id: 'calc-partial-derivatives',
    title: 'Partial Derivatives',
    slug: 'calc-partial-derivatives',
    categoryId: 'calculus',
    description: 'Partial derivatives measure how a multivariable function changes with respect to one variable while holding others constant.',
    order: 4,
    topics: ['Definition', 'Notation', 'Computation', 'Mixed partials', 'Clairaut\'s theorem'],
    visualComponents: ['3D surface with partial derivative slices'],
    prerequisites: ['calc-derivatives'],
  },
  {
    id: 'calc-gradients',
    title: 'Gradients',
    slug: 'calc-gradients',
    categoryId: 'calculus',
    description: 'The gradient vector points in the direction of steepest ascent — the cornerstone of optimization in machine learning.',
    order: 5,
    topics: ['Definition', 'Geometric interpretation', 'Gradient descent', 'Learning rate', 'Stochastic gradient descent'],
    visualComponents: ['Interactive gradient descent', 'Contour plot with gradient vectors'],
    prerequisites: ['calc-partial-derivatives'],
  },
  {
    id: 'calc-jacobian',
    title: 'Jacobian',
    slug: 'calc-jacobian',
    categoryId: 'calculus',
    description: 'The Jacobian matrix generalizes the gradient to vector-valued functions — essential for understanding transformations and backpropagation.',
    order: 6,
    topics: ['Definition', 'Computation', 'Determinant', 'Change of variables', 'Applications'],
    visualComponents: ['Jacobian transformation viewer'],
    prerequisites: ['calc-gradients'],
  },
  {
    id: 'calc-hessian',
    title: 'Hessian',
    slug: 'calc-hessian',
    categoryId: 'calculus',
    description: 'The Hessian matrix of second derivatives captures curvature information — used in second-order optimization methods.',
    order: 7,
    topics: ['Definition', 'Symmetry', 'Positive definiteness', 'Newton\'s method', 'Saddle points'],
    visualComponents: ['Hessian curvature visualization'],
    prerequisites: ['calc-jacobian'],
  },
  {
    id: 'calc-optimization',
    title: 'Optimization',
    slug: 'calc-optimization',
    categoryId: 'calculus',
    description: 'Optimization finds the parameters that minimize or maximize an objective function — the heart of training machine learning models.',
    order: 8,
    topics: ['Local vs global minima', 'Convexity', 'Gradient descent variants', 'Momentum', 'Adam', 'Constrained optimization', 'Lagrange multipliers'],
    visualComponents: ['Interactive gradient descent', 'Optimization landscape explorer'],
    prerequisites: ['calc-hessian'],
    papers: [
      { title: 'Adam: A Method for Stochastic Optimization', year: '2015', difficulty: 'medium' },
    ],
  },
];

// ============================================================================
// PROBABILITY LESSONS
// ============================================================================

const probabilityLessons: MathLesson[] = [
  {
    id: 'prob-random-variables',
    title: 'Random Variables',
    slug: 'prob-random-variables',
    categoryId: 'probability',
    description: 'Random variables map outcomes to numerical values — the bridge between real-world uncertainty and mathematical analysis.',
    order: 1,
    topics: ['Discrete vs continuous', 'PMF', 'PDF', 'CDF', 'Expected value', 'Variance'],
    visualComponents: ['Distribution explorer'],
  },
  {
    id: 'prob-distributions',
    title: 'Distributions',
    slug: 'prob-distributions',
    categoryId: 'probability',
    description: 'Probability distributions describe how likely different outcomes are — from the ubiquitous Gaussian to the versatile Beta.',
    order: 2,
    topics: ['Uniform', 'Bernoulli', 'Binomial', 'Gaussian', 'Exponential', 'Poisson', 'Beta', 'Multivariate Gaussian'],
    visualComponents: ['Distribution explorer', 'PDF/CDF plotter'],
    prerequisites: ['prob-random-variables'],
  },
  {
    id: 'prob-bayes-theorem',
    title: 'Bayes Theorem',
    slug: 'prob-bayes-theorem',
    categoryId: 'probability',
    description: 'Bayes theorem updates beliefs with evidence — the foundation of Bayesian machine learning and probabilistic reasoning.',
    order: 3,
    topics: ['Statement', 'Derivation', 'Prior and posterior', 'Likelihood', 'Naive Bayes classifier', 'Applications'],
    visualComponents: ['Bayesian update animation'],
    prerequisites: ['prob-distributions'],
    papers: [
      { title: 'An Essay Towards Solving a Problem in the Doctrine of Chances', author: 'Bayes', year: '1763', difficulty: 'hard' } as any,
    ],
  },
  {
    id: 'prob-likelihood',
    title: 'Likelihood',
    slug: 'prob-likelihood',
    categoryId: 'probability',
    description: 'The likelihood function measures how well model parameters explain observed data — central to parameter estimation.',
    order: 4,
    topics: ['Definition', 'Likelihood vs probability', 'Log-likelihood', 'Score function', 'Fisher information'],
    visualComponents: ['Likelihood surface plotter'],
    prerequisites: ['prob-bayes-theorem'],
  },
  {
    id: 'prob-mle',
    title: 'Maximum Likelihood Estimation',
    slug: 'prob-mle',
    categoryId: 'probability',
    description: 'MLE finds the parameters that make the observed data most probable — the workhorse of classical statistics and machine learning.',
    order: 5,
    topics: ['Principle', 'Derivation', 'Examples', 'Properties', 'Connection to loss functions', 'Cross-entropy as NLL'],
    visualComponents: ['MLE fitting animation'],
    prerequisites: ['prob-likelihood'],
  },
  {
    id: 'prob-map',
    title: 'Maximum A Posteriori',
    slug: 'prob-map',
    categoryId: 'probability',
    description: 'MAP estimation incorporates prior beliefs into parameter estimation — bridging frequentist and Bayesian approaches.',
    order: 6,
    topics: ['Principle', 'Prior distributions', 'Regularization connection', 'L1 as Laplace prior', 'L2 as Gaussian prior', 'Comparison with MLE'],
    visualComponents: ['MLE vs MAP comparison'],
    prerequisites: ['prob-mle'],
    papers: [
      { title: 'Pattern Recognition and Machine Learning', year: '2006', difficulty: 'medium' },
    ],
  },
];

// ============================================================================
// STATISTICS LESSONS
// ============================================================================

const statisticsLessons: MathLesson[] = [
  {
    id: 'stat-hypothesis-testing',
    title: 'Hypothesis Testing',
    slug: 'stat-hypothesis-testing',
    categoryId: 'statistics',
    description: 'Hypothesis testing provides a formal framework for making decisions about population parameters based on sample data.',
    order: 1,
    topics: ['Null hypothesis', 'Alternative hypothesis', 'Test statistic', 'p-value', 'Type I/II errors', 'Power'],
    visualComponents: ['Sampling simulator'],
  },
  {
    id: 'stat-confidence-intervals',
    title: 'Confidence Intervals',
    slug: 'stat-confidence-intervals',
    categoryId: 'statistics',
    description: 'Confidence intervals quantify the uncertainty around point estimates — essential for reporting experimental results.',
    order: 2,
    topics: ['Definition', 'Construction', 'Interpretation', 'Bootstrap methods', 'Relation to hypothesis tests'],
    visualComponents: ['Confidence interval visualizer'],
    prerequisites: ['stat-hypothesis-testing'],
  },
  {
    id: 'stat-correlation',
    title: 'Correlation',
    slug: 'stat-correlation',
    categoryId: 'statistics',
    description: 'Correlation measures the strength and direction of linear relationships between variables — a key tool in feature analysis.',
    order: 3,
    topics: ['Pearson correlation', 'Spearman correlation', 'Correlation matrix', 'Causation vs correlation', 'Applications in AI'],
    visualComponents: ['Scatter plot with correlation coefficient'],
    prerequisites: ['stat-confidence-intervals'],
  },
  {
    id: 'stat-covariance',
    title: 'Covariance',
    slug: 'stat-covariance',
    categoryId: 'statistics',
    description: 'Covariance measures how two variables change together — the building block of the covariance matrix used in PCA and Gaussian distributions.',
    order: 4,
    topics: ['Definition', 'Properties', 'Covariance matrix', 'Relation to correlation', 'Whitening', 'Applications in PCA'],
    visualComponents: ['Covariance ellipse plotter'],
    prerequisites: ['stat-correlation'],
  },
];

// ============================================================================
// ALL MATH TOPICS
// ============================================================================

export const MATH_TOPICS: MathTopic[] = [
  {
    category: MATH_CATEGORIES[0],
    lessons: linearAlgebraLessons,
  },
  {
    category: MATH_CATEGORIES[1],
    lessons: calculusLessons,
  },
  {
    category: MATH_CATEGORIES[2],
    lessons: probabilityLessons,
  },
  {
    category: MATH_CATEGORIES[3],
    lessons: statisticsLessons,
  },
];

// ============================================================================
// ALL LESSONS (FLATTENED)
// ============================================================================

export const ALL_MATH_LESSONS: MathLesson[] = [
  ...linearAlgebraLessons,
  ...calculusLessons,
  ...probabilityLessons,
  ...statisticsLessons,
];

export const TOTAL_MATH_LESSONS = ALL_MATH_LESSONS.length;

// ============================================================================
// PRACTICE QUESTIONS
// ============================================================================

export const MATH_PRACTICE_QUESTIONS: PracticeQuestion[] = [
  // --- LINEAR ALGEBRA ---
  {
    id: 'pq-la-1',
    lessonId: 'la-scalars',
    categoryId: 'linear-algebra',
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which of the following best describes a scalar?',
    options: [
      { id: 'a', text: 'An ordered list of numbers' },
      { id: 'b', text: 'A single numerical value' },
      { id: 'c', text: 'A 2D array of numbers' },
      { id: 'd', text: 'A linear transformation' },
    ],
    correctAnswer: 'b',
    explanation: 'A scalar is a single numerical value, such as 3 or -2.5. Vectors are ordered lists of numbers, and matrices are 2D arrays.',
    xp: 10,
  },
  {
    id: 'pq-la-2',
    lessonId: 'la-vectors',
    categoryId: 'linear-algebra',
    type: 'mcq',
    difficulty: 'easy',
    question: 'What is the dot product of vectors [1, 2, 3] and [4, 5, 6]?',
    options: [
      { id: 'a', text: '15' },
      { id: 'b', text: '32' },
      { id: 'c', text: '21' },
      { id: 'd', text: '9' },
    ],
    correctAnswer: 'b',
    explanation: 'The dot product is computed as 1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32.',
    xp: 10,
  },
  {
    id: 'pq-la-3',
    lessonId: 'la-matrices',
    categoryId: 'linear-algebra',
    type: 'mcq',
    difficulty: 'medium',
    question: 'What is the transpose of the matrix [[1, 2], [3, 4]]?',
    options: [
      { id: 'a', text: '[[4, 3], [2, 1]]' },
      { id: 'b', text: '[[1, 3], [2, 4]]' },
      { id: 'c', text: '[[2, 1], [4, 3]]' },
      { id: 'd', text: '[[1, 2], [3, 4]]' },
    ],
    correctAnswer: 'b',
    explanation: 'The transpose swaps rows and columns: row 1 [1,2] becomes column 1, row 2 [3,4] becomes column 2.',
    xp: 25,
  },
  {
    id: 'pq-la-4',
    lessonId: 'la-matrix-multiplication',
    categoryId: 'linear-algebra',
    type: 'coding',
    difficulty: 'medium',
    question: 'Implement a function that computes the matrix-vector product Ax, where A is an m×n matrix and x is an n-dimensional vector.',
    correctAnswer: 'function matVecMul(A: number[][], x: number[]): number[] {\n  return A.map(row => row.reduce((sum, val, j) => sum + val * x[j], 0));\n}',
    explanation: 'For each row of A, compute the dot product with vector x. The result is an m-dimensional vector.',
    hint: 'Use Array.map() for rows and Array.reduce() for the dot product.',
    codeTemplate: 'function matVecMul(A: number[][], x: number[]): number[] {\n  // Your code here\n}',
    xp: 25,
  },
  {
    id: 'pq-la-5',
    lessonId: 'la-determinant',
    categoryId: 'linear-algebra',
    type: 'math',
    difficulty: 'medium',
    question: 'Compute the determinant of the 2×2 matrix [[3, 8], [4, 6]].',
    correctAnswer: '-14',
    explanation: 'det = (3)(6) - (8)(4) = 18 - 32 = -14.',
    hint: 'For a 2×2 matrix [[a,b],[c,d]], det = ad - bc.',
    xp: 25,
  },
  {
    id: 'pq-la-6',
    lessonId: 'la-eigenvalues',
    categoryId: 'linear-algebra',
    type: 'mcq',
    difficulty: 'hard',
    question: 'If a 2×2 matrix has eigenvalues λ₁ = 3 and λ₂ = 5, what is its determinant?',
    options: [
      { id: 'a', text: '8' },
      { id: 'b', text: '15' },
      { id: 'c', text: '2' },
      { id: 'd', text: '-15' },
    ],
    correctAnswer: 'b',
    explanation: 'The determinant of a matrix equals the product of its eigenvalues: det(A) = λ₁ × λ₂ = 3 × 5 = 15.',
    xp: 50,
  },
  {
    id: 'pq-la-7',
    lessonId: 'la-svd',
    categoryId: 'linear-algebra',
    type: 'mcq',
    difficulty: 'hard',
    question: 'In the SVD decomposition A = UΣV^T, what are the dimensions of Σ for a 3×2 matrix A?',
    options: [
      { id: 'a', text: '2×2' },
      { id: 'b', text: '3×2' },
      { id: 'c', text: '3×3' },
      { id: 'd', text: '2×3' },
    ],
    correctAnswer: 'b',
    explanation: 'For an m×n matrix A, U is m×m, Σ is m×n (same shape as A, with singular values on diagonal), and V^T is n×n. So for a 3×2 matrix, Σ is 3×2.',
    xp: 50,
  },
  {
    id: 'pq-la-8',
    lessonId: 'la-pca',
    categoryId: 'linear-algebra',
    type: 'coding',
    difficulty: 'hard',
    question: 'Implement a function that computes the proportion of variance explained by the first k principal components, given an array of eigenvalues sorted in descending order.',
    correctAnswer: 'function explainedVariance(eigenvalues: number[], k: number): number {\n  const total = eigenvalues.reduce((s, v) => s + v, 0);\n  const topK = eigenvalues.slice(0, k).reduce((s, v) => s + v, 0);\n  return topK / total;\n}',
    explanation: 'The variance explained by each principal component is proportional to its eigenvalue. Sum the top k eigenvalues and divide by the total sum.',
    hint: 'Sort eigenvalues descending, sum the first k, divide by total sum.',
    codeTemplate: 'function explainedVariance(eigenvalues: number[], k: number): number {\n  // Your code here\n}',
    xp: 50,
  },

  // --- CALCULUS ---
  {
    id: 'pq-calc-1',
    lessonId: 'calc-limits',
    categoryId: 'calculus',
    type: 'mcq',
    difficulty: 'easy',
    question: 'What is lim(x→0) sin(x)/x?',
    options: [
      { id: 'a', text: '0' },
      { id: 'b', text: '1' },
      { id: 'c', text: '∞' },
      { id: 'd', text: 'Does not exist' },
    ],
    correctAnswer: 'b',
    explanation: 'This is a fundamental limit. Using L\'Hôpital\'s rule or the squeeze theorem, lim(x→0) sin(x)/x = 1.',
    xp: 10,
  },
  {
    id: 'pq-calc-2',
    lessonId: 'calc-derivatives',
    categoryId: 'calculus',
    type: 'math',
    difficulty: 'easy',
    question: 'Find the derivative of f(x) = 3x⁴ + 2x² - 7x + 1.',
    correctAnswer: '12x³ + 4x - 7',
    explanation: 'Apply the power rule: d/dx(3x⁴) = 12x³, d/dx(2x²) = 4x, d/dx(-7x) = -7, d/dx(1) = 0.',
    hint: 'Apply the power rule: d/dx(xⁿ) = n·xⁿ⁻¹',
    xp: 10,
  },
  {
    id: 'pq-calc-3',
    lessonId: 'calc-chain-rule',
    categoryId: 'calculus',
    type: 'math',
    difficulty: 'medium',
    question: 'Find d/dx [sin(x²)] using the chain rule.',
    correctAnswer: '2x·cos(x²)',
    explanation: 'Let u = x², then d/dx[sin(u)] = cos(u)·du/dx = cos(x²)·2x = 2x·cos(x²).',
    hint: 'Let u = x² (inner function), then apply d/dx[sin(u)] = cos(u) · u\'',
    xp: 25,
  },
  {
    id: 'pq-calc-4',
    lessonId: 'calc-gradients',
    categoryId: 'calculus',
    type: 'mcq',
    difficulty: 'medium',
    question: 'For f(x, y) = x²y + 3y², what is the gradient ∇f?',
    options: [
      { id: 'a', text: '(2xy, x² + 6y)' },
      { id: 'b', text: '(2xy + 3y², x² + 6y)' },
      { id: 'c', text: '(x², 2xy + 6y)' },
      { id: 'd', text: '(2x, 6y)' },
    ],
    correctAnswer: 'a',
    explanation: '∂f/∂x = 2xy, ∂f/∂y = x² + 6y. So ∇f = (2xy, x² + 6y).',
    xp: 25,
  },
  {
    id: 'pq-calc-5',
    lessonId: 'calc-jacobian',
    categoryId: 'calculus',
    type: 'math',
    difficulty: 'hard',
    question: 'Compute the Jacobian matrix of f(x,y) = (x²y, x+y) at point (1, 2).',
    correctAnswer: '[[4, 1], [1, 1]]',
    explanation: 'J = [[∂f₁/∂x, ∂f₁/∂y], [∂f₂/∂x, ∂f₂/∂y]] = [[2xy, x²], [1, 1]]. At (1,2): [[4, 1], [1, 1]].',
    hint: 'Compute the matrix of all first partial derivatives.',
    xp: 50,
  },
  {
    id: 'pq-calc-6',
    lessonId: 'calc-optimization',
    categoryId: 'calculus',
    type: 'coding',
    difficulty: 'hard',
    question: 'Implement gradient descent for f(x) = x². Starting from x₀ = 5, with learning rate α = 0.1, find x after 10 iterations.',
    correctAnswer: 'function gradientDescent(x0: number, lr: number, steps: number): number {\n  let x = x0;\n  for (let i = 0; i < steps; i++) {\n    x = x - lr * (2 * x); // f\'(x) = 2x\n  }\n  return x;\n}',
    explanation: 'At each step: x = x - α·f\'(x) = x - α·2x = x(1 - 2α). With α=0.1, each step multiplies by 0.8. After 10 steps: 5 × 0.8¹⁰ ≈ 0.537.',
    hint: 'The gradient of x² is 2x. Apply: x_new = x - lr * gradient.',
    codeTemplate: 'function gradientDescent(x0: number, lr: number, steps: number): number {\n  // Your code here\n}',
    xp: 50,
  },

  // --- PROBABILITY ---
  {
    id: 'pq-prob-1',
    lessonId: 'prob-random-variables',
    categoryId: 'probability',
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which of the following is a continuous random variable?',
    options: [
      { id: 'a', text: 'Number of heads in 10 coin flips' },
      { id: 'b', text: 'The exact height of a randomly selected person' },
      { id: 'c', text: 'Number of emails received today' },
      { id: 'd', text: 'Roll of a six-sided die' },
    ],
    correctAnswer: 'b',
    explanation: 'Height can take any value within a range (e.g., 170.5 cm), making it continuous. The others are countable (discrete).',
    xp: 10,
  },
  {
    id: 'pq-prob-2',
    lessonId: 'prob-distributions',
    categoryId: 'probability',
    type: 'mcq',
    difficulty: 'easy',
    question: 'In a standard normal distribution N(0,1), what percentage of data falls within ±1 standard deviation?',
    options: [
      { id: 'a', text: '50%' },
      { id: 'b', text: '68%' },
      { id: 'c', text: '95%' },
      { id: 'd', text: '99.7%' },
    ],
    correctAnswer: 'b',
    explanation: 'The 68-95-99.7 rule states that approximately 68% of data in a normal distribution falls within ±1 standard deviation of the mean.',
    xp: 10,
  },
  {
    id: 'pq-prob-3',
    lessonId: 'prob-bayes-theorem',
    categoryId: 'probability',
    type: 'math',
    difficulty: 'medium',
    question: 'A medical test has 99% sensitivity (true positive rate) and 95% specificity (true negative rate). If 1% of the population has the disease, what is the probability that a person who tests positive actually has the disease?',
    correctAnswer: '0.167',
    explanation: 'Using Bayes theorem: P(D|+) = P(+|D)P(D) / P(+) = (0.99)(0.01) / [(0.99)(0.01) + (0.05)(0.99)] = 0.0099 / 0.0594 ≈ 0.167 (about 16.7%).',
    hint: 'P(D|+) = P(+|D)·P(D) / [P(+|D)·P(D) + P(+|¬D)·P(¬D)]',
    xp: 25,
  },
  {
    id: 'pq-prob-4',
    lessonId: 'prob-mle',
    categoryId: 'probability',
    type: 'mcq',
    difficulty: 'medium',
    question: 'Given n observations from a Bernoulli(p) distribution with k successes, what is the MLE for p?',
    options: [
      { id: 'a', text: 'k / (2n)' },
      { id: 'b', text: 'k / n' },
      { id: 'c', text: '(k + 1) / (n + 2)' },
      { id: 'd', text: 'n / k' },
    ],
    correctAnswer: 'b',
    explanation: 'The MLE for the Bernoulli parameter p is the sample proportion: p̂ = k/n. This maximizes the likelihood L(p) = p^k(1-p)^(n-k).',
    xp: 25,
  },
  {
    id: 'pq-prob-5',
    lessonId: 'prob-map',
    categoryId: 'probability',
    type: 'mcq',
    difficulty: 'hard',
    question: 'L2 regularization (ridge regression) corresponds to MAP estimation with which prior distribution?',
    options: [
      { id: 'a', text: 'Uniform prior' },
      { id: 'b', text: 'Laplace prior' },
      { id: 'c', text: 'Gaussian prior' },
      { id: 'd', text: 'Beta prior' },
    ],
    correctAnswer: 'c',
    explanation: 'L2 regularization penalizes ||w||²₂, which corresponds to a Gaussian (Normal) prior on the weights. L1 regularization corresponds to a Laplace prior.',
    xp: 50,
  },

  // --- STATISTICS ---
  {
    id: 'pq-stat-1',
    lessonId: 'stat-hypothesis-testing',
    categoryId: 'statistics',
    type: 'mcq',
    difficulty: 'easy',
    question: 'What does a p-value of 0.03 mean?',
    options: [
      { id: 'a', text: 'There is a 3% chance the null hypothesis is true' },
      { id: 'b', text: 'There is a 3% probability of observing results this extreme if the null hypothesis is true' },
      { id: 'c', text: 'The effect size is 3%' },
      { id: 'd', text: 'The test is 97% accurate' },
    ],
    correctAnswer: 'b',
    explanation: 'The p-value is the probability of observing results at least as extreme as what was observed, assuming the null hypothesis is true. It is NOT the probability that the null hypothesis is true.',
    xp: 10,
  },
  {
    id: 'pq-stat-2',
    lessonId: 'stat-confidence-intervals',
    categoryId: 'statistics',
    type: 'mcq',
    difficulty: 'medium',
    question: 'A 95% confidence interval for a mean is [2.5, 4.5]. Which interpretation is correct?',
    options: [
      { id: 'a', text: 'There is a 95% probability the true mean is between 2.5 and 4.5' },
      { id: 'b', text: '95% of the data falls between 2.5 and 4.5' },
      { id: 'c', text: 'If we repeated this experiment many times, 95% of the computed intervals would contain the true mean' },
      { id: 'd', text: 'The true mean is definitely between 2.5 and 4.5' },
    ],
    correctAnswer: 'c',
    explanation: 'The frequentist interpretation: 95% of confidence intervals from repeated sampling would contain the true parameter. The true mean is fixed; the interval is random.',
    xp: 25,
  },
  {
    id: 'pq-stat-3',
    lessonId: 'stat-correlation',
    categoryId: 'statistics',
    type: 'mcq',
    difficulty: 'medium',
    question: 'A correlation coefficient of -0.85 between two variables indicates:',
    options: [
      { id: 'a', text: 'A weak positive relationship' },
      { id: 'b', text: 'No relationship' },
      { id: 'c', text: 'A strong negative linear relationship' },
      { id: 'd', text: 'That one variable causes the other to decrease' },
    ],
    correctAnswer: 'c',
    explanation: 'r = -0.85 indicates a strong negative linear relationship. Values close to -1 or 1 indicate strong linear relationships. Note: correlation does not imply causation.',
    xp: 25,
  },
  {
    id: 'pq-stat-4',
    lessonId: 'stat-covariance',
    categoryId: 'statistics',
    type: 'coding',
    difficulty: 'medium',
    question: 'Implement a function that computes the covariance of two arrays of equal length.',
    correctAnswer: 'function covariance(x: number[], y: number[]): number {\n  const n = x.length;\n  const meanX = x.reduce((s, v) => s + v, 0) / n;\n  const meanY = y.reduce((s, v) => s + v, 0) / n;\n  return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / (n - 1);\n}',
    explanation: 'Covariance = Σ(xᵢ - x̄)(yᵢ - ȳ) / (n-1). We use n-1 for the sample covariance (Bessel\'s correction).',
    hint: 'Compute means first, then sum the products of deviations.',
    codeTemplate: 'function covariance(x: number[], y: number[]): number {\n  // Your code here\n}',
    xp: 25,
  },
];

// ============================================================================
// HELPER: GET QUESTIONS BY LESSON
// ============================================================================

export function getPracticeQuestionsByLesson(lessonId: string): PracticeQuestion[] {
  return MATH_PRACTICE_QUESTIONS.filter((q) => q.lessonId === lessonId);
}

export function getPracticeQuestionsByCategory(categoryId: MathCategoryId): PracticeQuestion[] {
  return MATH_PRACTICE_QUESTIONS.filter((q) => q.categoryId === categoryId);
}

export function getPracticeQuestionsByDifficulty(difficulty: PracticeQuestion['difficulty']): PracticeQuestion[] {
  return MATH_PRACTICE_QUESTIONS.filter((q) => q.difficulty === difficulty);
}
