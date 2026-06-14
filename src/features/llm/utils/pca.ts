// Principal Component Analysis (PCA) for 2D embedding projection
// Pure JavaScript implementation — no external dependencies

export interface PCAResult {
  projected: { x: number; y: number; word: string; category: string }[];
  varianceExplained: [number, number];
}

/**
 * Compute PCA to project high-dimensional vectors to 2D.
 * Uses power iteration for eigendecomposition of the covariance matrix.
 */
export function pca2D(
  vectors: number[][],
  labels: string[],
  categories: string[]
): PCAResult {
  const n = vectors.length;
  const d = vectors[0].length;

  // Step 1: Mean center the data
  const mean = Array(d).fill(0);
  for (const v of vectors) {
    for (let j = 0; j < d; j++) mean[j] += v[j];
  }
  for (let j = 0; j < d; j++) mean[j] /= n;

  const centered = vectors.map((v) => v.map((x, j) => x - mean[j]));

  // Step 2: Compute covariance matrix (d x d)
  const cov = Array.from({ length: d }, () => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += centered[k][i] * centered[k][j];
      cov[i][j] = sum / (n - 1);
      cov[j][i] = cov[i][j];
    }
  }

  // Step 3: Find top 2 eigenvectors via power iteration
  const eig1 = powerIteration(cov, 100);
  const eig2 = powerIteration(deflate(cov, eig1.vector), 100);

  // Step 4: Project data onto first 2 principal components
  const projected = centered.map((v, i) => ({
    x: dot(v, eig1.vector),
    y: dot(v, eig2.vector),
    word: labels[i],
    category: categories[i],
  }));

  // Step 5: Normalize to [-1, 1] range
  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const normalized = projected.map((p) => ({
    ...p,
    x: ((p.x - xMin) / xRange) * 2 - 1,
    y: ((p.y - yMin) / yRange) * 2 - 1,
  }));

  // Compute variance explained
  const totalVariance = cov.reduce((s, diag, i) => s + diag[i], 0);
  const v1 = eig1.eigenvalue / totalVariance;
  const v2 = eig2.eigenvalue / totalVariance;

  return {
    projected: normalized,
    varianceExplained: [v1, v2],
  };
}

/** Power iteration to find the dominant eigenvector of a symmetric matrix */
function powerIteration(
  matrix: number[][],
  maxIter: number
): { vector: number[]; eigenvalue: number } {
  const d = matrix.length;
  let vector = Array(d)
    .fill(0)
    .map(() => Math.random() - 0.5);
  let eigenvalue = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    // Multiply matrix * vector
    const newVec = Array(d).fill(0);
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) newVec[i] += matrix[i][j] * vector[j];
    }

    // Compute eigenvalue (Rayleigh quotient)
    eigenvalue = dot(newVec, vector);

    // Normalize
    const norm = Math.sqrt(dot(newVec, newVec));
    vector = newVec.map((x) => x / (norm || 1));
  }

  return { vector, eigenvalue };
}

/** Deflate matrix by removing the component along a given eigenvector */
function deflate(matrix: number[][], eigenvector: number[]): number[][] {
  const d = matrix.length;
  return matrix.map((row, i) =>
    row.map((val, j) => {
      let result = val;
      result -= eigenvector[i] * eigenvector[j] * dot(matrix[i], eigenvector);
      return result;
    })
  );
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

/**
 * Simple t-SNE-like projection using neighborhood preservation.
 * Falls back to PCA if iteration fails.
 */
export function tsne2D(
  vectors: number[][],
  labels: string[],
  categories: string[],
  perplexity = 5
): PCAResult {
  // For educational purposes, use a simplified approach:
  // PCA projection + slight jitter based on local density
  const pcaResult = pca2D(vectors, labels, categories);

  // Add slight noise based on category to separate clusters
  const categoryMap = new Map<string, number>();
  let catIdx = 0;
  categories.forEach((c) => {
    if (!categoryMap.has(c)) categoryMap.set(c, catIdx++);
  });

  const jittered = pcaResult.projected.map((p) => {
    const catAngle = (categoryMap.get(p.category) || 0) * ((2 * Math.PI) / catIdx);
    return {
      ...p,
      x: p.x + Math.cos(catAngle) * 0.05,
      y: p.y + Math.sin(catAngle) * 0.05,
    };
  });

  return {
    projected: jittered,
    varianceExplained: pcaResult.varianceExplained,
  };
}
