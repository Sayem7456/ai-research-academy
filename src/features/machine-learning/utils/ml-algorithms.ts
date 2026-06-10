/**
 * ML Algorithm Utilities
 * Shared algorithm implementations for visualizations
 */

export type Point2D = { x: number; y: number };
export type ClassifiedPoint = Point2D & { label: 0 | 1 };
export type ClusteredPoint = Point2D & { cluster?: number };

export type DistanceMetric = 'euclidean' | 'manhattan';
export type KNNWeighting = 'uniform' | 'distance';

export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function manhattanDistance(p1: Point2D, p2: Point2D): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function getDistanceFn(metric: DistanceMetric): (p1: Point2D, p2: Point2D) => number {
  return metric === 'euclidean' ? euclideanDistance : manhattanDistance;
}

export function knnPredict(
  point: Point2D,
  trainingData: ClassifiedPoint[],
  k: number,
  metric: DistanceMetric = 'euclidean',
  weighting: KNNWeighting = 'uniform'
): { prediction: number; neighbors: ClassifiedPoint[]; distances: number[]; votes: Record<number, number> } {
  if (trainingData.length === 0 || k === 0) {
    return { prediction: 0, neighbors: [], distances: [], votes: {} };
  }

  const distanceFn = getDistanceFn(metric);
  const distances = trainingData.map(p => ({
    point: p,
    distance: distanceFn(point, p),
  }));

  distances.sort((a, b) => a.distance - b.distance);
  const kEff = Math.min(k, distances.length);
  const kNearest = distances.slice(0, kEff);

  const neighbors = kNearest.map(d => d.point);
  const neighborDistances = kNearest.map(d => d.distance);

  const votes: Record<number, number> = {};
  if (weighting === 'uniform') {
    for (const p of neighbors) {
      votes[p.label] = (votes[p.label] || 0) + 1;
    }
  } else {
    // Distance-weighted: weight = 1 / (distance + epsilon)
    const epsilon = 1e-10;
    for (let i = 0; i < neighbors.length; i++) {
      const weight = 1 / (neighborDistances[i] + epsilon);
      votes[neighbors[i].label] = (votes[neighbors[i].label] || 0) + weight;
    }
  }

  // Deterministic tie-breaking: if tie, prefer the class with smaller minimum distance to test point
  const classOrder = Object.entries(votes).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // descending by vote count/weight
    // Tie-break: class with closer nearest neighbor wins
    const distA = neighborDistances.find((_, i) => neighbors[i].label === Number(a[0])) ?? Infinity;
    const distB = neighborDistances.find((_, i) => neighbors[i].label === Number(b[0])) ?? Infinity;
    return distA - distB;
  });

  const prediction = Number(classOrder[0][0]);

  return { prediction, neighbors, distances: neighborDistances, votes };
}

// Leave-one-out cross-validation accuracy
export function looAccuracy(
  data: ClassifiedPoint[],
  k: number,
  metric: DistanceMetric = 'euclidean',
  weighting: KNNWeighting = 'uniform'
): { accuracy: number; correct: number; total: number; confusion: { tp: number; fp: number; tn: number; fn: number } } {
  if (data.length < 2) return { accuracy: 0, correct: 0, total: 0, confusion: { tp: 0, fp: 0, tn: 0, fn: 0 } };

  let correct = 0;
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (let i = 0; i < data.length; i++) {
    const testPoint = data[i];
    const trainingData = data.slice(0, i).concat(data.slice(i + 1));
    const { prediction } = knnPredict(testPoint, trainingData, Math.min(k, trainingData.length), metric, weighting);

    if (prediction === testPoint.label) correct++;

    if (testPoint.label === 1 && prediction === 1) tp++;
    else if (testPoint.label === 0 && prediction === 1) fp++;
    else if (testPoint.label === 0 && prediction === 0) tn++;
    else if (testPoint.label === 1 && prediction === 0) fn++;
  }

  return {
    accuracy: (correct / data.length) * 100,
    correct,
    total: data.length,
    confusion: { tp, fp, tn, fn }
  };
}

// K-Means utilities
export function kMeansStep(
  points: Point2D[],
  centroids: Point2D[]
): { newCentroids: Point2D[]; assignments: number[] } {
  const k = centroids.length;
  const assignments = points.map(p => {
    let minDist = Infinity;
    let cluster = 0;
    for (let i = 0; i < k; i++) {
      const dist = euclideanDistance(p, centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        cluster = i;
      }
    }
    return cluster;
  });
  
  const newCentroids = centroids.map((_, k) => {
    const clusterPoints = points.filter((_, i) => assignments[i] === k);
    if (clusterPoints.length === 0) return centroids[k];
    
    const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);
    return { x: sumX / clusterPoints.length, y: sumY / clusterPoints.length };
  });
  
  return { newCentroids, assignments };
}

export function initializeKMeansCentroids(points: Point2D[], k: number): Point2D[] {
  const centroids: Point2D[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < k && i < points.length; i++) {
    let idx;
    do {
      idx = Math.floor(Math.random() * points.length);
    } while (used.has(idx));
    used.add(idx);
    centroids.push({ ...points[idx] });
  }
  
  return centroids;
}

export function initializeKMeansPlusPlus(points: Point2D[], k: number): Point2D[] {
  if (points.length === 0 || k === 0) return [];
  const centroids: Point2D[] = [];
  
  centroids.push({ ...points[Math.floor(Math.random() * points.length)] });
  
  for (let c = 1; c < k; c++) {
    const distances = points.map(p => {
      const minDist = Math.min(
        ...centroids.map(cent => euclideanDistance(p, cent))
      );
      return minDist * minDist;
    });
    const totalDist = distances.reduce((s, d) => s + d, 0);
    if (totalDist === 0) break;
    
    let r = Math.random() * totalDist;
    for (let i = 0; i < points.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push({ ...points[i] });
        break;
      }
    }
  }
  return centroids;
}

export function computeWCSS(points: Point2D[], centroids: Point2D[], assignments: number[]): number {
  let wcss = 0;
  for (let i = 0; i < points.length; i++) {
    const c = centroids[assignments[i]];
    if (c) {
      const dx = points[i].x - c.x;
      const dy = points[i].y - c.y;
      wcss += dx * dx + dy * dy;
    }
  }
  return wcss;
}

// Decision Tree utilities
export type ImpurityFn = (labels: number[]) => number;

export function calculateGini(labels: number[]): number {
  if (labels.length === 0) return 0;
  const counts = labels.reduce((acc, label) => {
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  let gini = 1;
  for (const count of Object.values(counts)) {
    const p = count / labels.length;
    gini -= p * p;
  }
  return gini;
}

export function calculateEntropy(labels: number[]): number {
  if (labels.length === 0) return 0;
  const counts = labels.reduce((acc, label) => {
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  let entropy = 0;
  for (const count of Object.values(counts)) {
    if (count === 0) continue;
    const p = count / labels.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function calculateMisclassification(labels: number[]): number {
  if (labels.length === 0) return 0;
  const counts = labels.reduce((acc, label) => {
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const maxCount = Math.max(...Object.values(counts));
  return 1 - maxCount / labels.length;
}

export function findBestSplit(
  points: ClassifiedPoint[],
  feature: 'x' | 'y',
  impurityFn: ImpurityFn = calculateGini
): { threshold: number; gain: number } | null {
  if (points.length < 2) return null;

  const sorted = [...points].sort((a, b) => a[feature] - b[feature]);
  const labels = points.map(p => p.label);
  const parentImpurity = impurityFn(labels);

  let bestGain = 0;
  let bestThreshold = sorted[0][feature];

  for (let i = 1; i < sorted.length; i++) {
    const threshold = (sorted[i - 1][feature] + sorted[i][feature]) / 2;
    const leftLabels = sorted.slice(0, i).map(p => p.label);
    const rightLabels = sorted.slice(i).map(p => p.label);

    const leftImpurity = impurityFn(leftLabels);
    const rightImpurity = impurityFn(rightLabels);
    const weightedImpurity = (leftLabels.length * leftImpurity + rightLabels.length * rightImpurity) / labels.length;
    const gain = parentImpurity - weightedImpurity;

    if (gain > bestGain) {
      bestGain = gain;
      bestThreshold = threshold;
    }
  }

  return bestGain > 0 ? { threshold: bestThreshold, gain: bestGain } : null;
}

// SVM utilities (simplified)
export function computeSVMMargin(
  points: ClassifiedPoint[],
  w1: number,
  w2: number,
  b: number
): { margin: number; supportVectors: ClassifiedPoint[] } {
  const norm = Math.sqrt(w1 * w1 + w2 * w2);
  if (norm < 1e-8) {
    return { margin: 0, supportVectors: [] };
  }

  const supportVectors: ClassifiedPoint[] = [];
  const tolerance = 0.2;
  
  for (const p of points) {
    const label = p.label === 1 ? 1 : -1;
    const functionalMargin = label * (w1 * p.x + w2 * p.y + b);
    if (Math.abs(functionalMargin - 1) <= tolerance) {
      supportVectors.push(p);
    }
  }

  const margin = 2 / norm;
  return { margin, supportVectors };
}

// Kernel SVM types and functions
export type KernelType = 'linear' | 'rbf' | 'polynomial' | 'sigmoid';
export type KernelParams = { gamma: number; degree: number; coef0: number };
export type KernelFn = (a: Point2D, b: Point2D, params: KernelParams) => number;

export function makeKernel(type: KernelType): KernelFn {
  switch (type) {
    case 'linear':
      return (a, b) => a.x * b.x + a.y * b.y;
    case 'rbf':
      return (a, b, p) => {
        const dx = a.x - b.x, dy = a.y - b.y;
        return Math.exp(-p.gamma * (dx * dx + dy * dy));
      };
    case 'polynomial':
      return (a, b, p) => Math.pow(p.gamma * (a.x * b.x + a.y * b.y) + p.coef0, p.degree);
    case 'sigmoid':
      return (a, b, p) => Math.tanh(p.gamma * (a.x * b.x + a.y * b.y) + p.coef0);
  }
}

export function kernelDecisionValue(
  px: number, py: number,
  points: ClassifiedPoint[],
  alpha: number[],
  b: number,
  kernel: KernelFn,
  kernelParams: KernelParams,
): number {
  const p = { x: px, y: py };
  const y = points.map(p => p.label === 1 ? 1 : -1);
  let f = b;
  for (let j = 0; j < points.length; j++) {
    f += alpha[j] * y[j] * kernel(p, points[j], kernelParams);
  }
  return f;
}

export type KernelSVMResult = {
  alpha: number[];
  b: number;
  supportVectorIndices: number[];
  supportVectorAlpha: number[];
  margin: number;
  wSquared: number;
  objective: number;
  history: SVMHistoryEntry[];
};

export type SVMHistoryEntry = {
  iteration: number;
  alpha: number[];
  b: number;
  wSquared: number;
  objective: number;
  supportVectorCount: number;
  accuracy: number;
};

export function trainKernelSVM(
  points: ClassifiedPoint[],
  kernelType: KernelType,
  kernelParams: KernelParams,
  C: number,
  iterations: number = 2000
): KernelSVMResult {
  const n = points.length;
  const result: KernelSVMResult = {
    alpha: new Array(n).fill(0),
    b: 0,
    supportVectorIndices: [],
    supportVectorAlpha: [],
    margin: 0,
    wSquared: 0,
    objective: 0,
    history: [],
  };
  if (n === 0) return result;
  const firstLabel = points[0].label;
  if (points.every(p => p.label === firstLabel)) return result;

  const kernel = makeKernel(kernelType);
  const y = points.map(p => p.label === 1 ? 1 : -1);

  const K: number[][] = [];
  for (let i = 0; i < n; i++) {
    K[i] = [];
    for (let j = 0; j < n; j++) {
      K[i][j] = kernel(points[i], points[j], kernelParams);
    }
  }

  const alpha = new Array(n).fill(0);
  let b = 0;
  const lr = 1.0 / n;
  const history: SVMHistoryEntry[] = [];
  const step = Math.max(1, Math.floor(iterations / 60));

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < n; i++) {
      let f = b;
      for (let j = 0; j < n; j++) {
        f += alpha[j] * y[j] * K[j][i];
      }
      const violation = 1 - y[i] * f;
      if (violation > 0) {
        alpha[i] += lr * violation;
      } else {
        alpha[i] -= lr * 0.001 * alpha[i];
      }
      if (alpha[i] < 0) alpha[i] = 0;
      if (alpha[i] > C) alpha[i] = C;
    }

    if (iter % step === 0 || iter === iterations - 1) {
      let wSq = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          wSq += alpha[i] * alpha[j] * y[i] * y[j] * K[i][j];
        }
      }
      const sumAlpha = alpha.reduce((s, a) => s + a, 0);
      const obj = sumAlpha - 0.5 * wSq;
      const svCount = alpha.filter(a => a > 1e-5).length;
      let correct = 0;
      for (let i = 0; i < n; i++) {
        let f = b;
        for (let j = 0; j < n; j++) {
          f += alpha[j] * y[j] * K[j][i];
        }
        if ((f >= 0 ? 1 : 0) === points[i].label) correct++;
      }
      history.push({
        iteration: iter,
        alpha: [...alpha],
        b,
        wSquared: wSq,
        objective: obj,
        supportVectorCount: svCount,
        accuracy: (correct / n) * 100,
      });
    }
  }

  let bSum = 0, bCount = 0;
  for (let i = 0; i < n; i++) {
    if (alpha[i] > 1e-5 && alpha[i] < C - 1e-5) {
      let f = 0;
      for (let j = 0; j < n; j++) {
        f += alpha[j] * y[j] * K[j][i];
      }
      bSum += y[i] - f;
      bCount++;
    }
  }
  b = bCount > 0 ? bSum / bCount : 0;
  if (bCount === 0) {
    for (let i = 0; i < n; i++) {
      if (alpha[i] > 1e-5) {
        let f = 0;
        for (let j = 0; j < n; j++) {
          f += alpha[j] * y[j] * K[j][i];
        }
        bSum += y[i] - f;
        bCount++;
      }
    }
    b = bCount > 0 ? bSum / bCount : 0;
  }

  let wSquared = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      wSquared += alpha[i] * alpha[j] * y[i] * y[j] * K[i][j];
    }
  }
  const sumAlpha = alpha.reduce((s, a) => s + a, 0);
  const objective = sumAlpha - 0.5 * wSquared;

  const svIndices: number[] = [];
  const svAlphas: number[] = [];
  for (let i = 0; i < n; i++) {
    if (alpha[i] > 1e-5) {
      svIndices.push(i);
      svAlphas.push(alpha[i]);
    }
  }

  return {
    alpha,
    b,
    supportVectorIndices: svIndices,
    supportVectorAlpha: svAlphas,
    margin: wSquared > 1e-10 ? 2 / Math.sqrt(wSquared) : Infinity,
    wSquared,
    objective,
    history,
  };
}

export function generateDataset(
  name: 'linear' | 'circles' | 'moons' | 'xor',
): ClassifiedPoint[] {
  switch (name) {
    case 'linear': {
      const pts: ClassifiedPoint[] = [];
      for (let i = 0; i < 5; i++) {
        pts.push({
          x: 2 + Math.random() * 2.5,
          y: 6 + Math.random() * 2.5,
          label: 1,
        });
        pts.push({
          x: 6 + Math.random() * 2.5,
          y: 2 + Math.random() * 2.5,
          label: 0,
        });
      }
      return pts;
    }
    case 'circles': {
      const pts: ClassifiedPoint[] = [];
      const cx = 5, cy = 5;
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * 2 * Math.PI;
        const r = 1.2 + Math.random() * 0.6;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), label: 1 });
      }
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * 2 * Math.PI;
        const r = 3.0 + Math.random() * 0.8;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), label: 0 });
      }
      return pts;
    }
    case 'moons': {
      const pts: ClassifiedPoint[] = [];
      for (let i = 0; i < 8; i++) {
        const t = Math.PI * (i / 7);
        pts.push({
          x: 3.5 + 1.6 * Math.cos(t),
          y: 5.5 + 1.6 * Math.sin(t),
          label: 1,
        });
      }
      for (let i = 0; i < 8; i++) {
        const t = Math.PI * (i / 7);
        pts.push({
          x: 5.5 + 1.6 * Math.cos(t + Math.PI),
          y: 5.0 + 1.6 * Math.sin(t + Math.PI),
          label: 0,
        });
      }
      return pts;
    }
    case 'xor': {
      return [
        { x: 2.5, y: 7.5, label: 1 }, { x: 7.5, y: 2.5, label: 1 },
        { x: 3.0, y: 6.5, label: 1 }, { x: 7.0, y: 3.0, label: 1 },
        { x: 3.5, y: 3.0, label: 1 }, { x: 6.5, y: 7.0, label: 1 },
        { x: 2.5, y: 2.5, label: 0 }, { x: 7.5, y: 7.5, label: 0 },
        { x: 3.5, y: 3.5, label: 0 }, { x: 6.5, y: 6.5, label: 0 },
        { x: 2.0, y: 3.0, label: 0 }, { x: 8.0, y: 7.0, label: 0 },
      ];
    }
  }
}

export function computeSVMSlack(
  points: ClassifiedPoint[],
  alpha: number[],
  b: number,
  kernel: KernelFn,
  kernelParams: KernelParams,
): number[] {
  const y = points.map(p => p.label === 1 ? 1 : -1);
  return points.map((_, i) => {
    const f = kernelDecisionValue(points[i].x, points[i].y, points, alpha, b, kernel, kernelParams);
    return Math.max(0, 1 - y[i] * f);
  });
}

// PCA utilities
export function computePCA(points: Point2D[]): {
  pc1: Point2D;
  pc2: Point2D;
  explained: [number, number];
  eigenvalues: [number, number];
} {
  if (points.length === 0) {
    return {
      pc1: { x: 1, y: 0 },
      pc2: { x: 0, y: 1 },
      explained: [0.5, 0.5],
      eigenvalues: [1, 1],
    };
  }
  
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  
  const centered = points.map(p => ({ x: p.x - meanX, y: p.y - meanY }));
  
  let cov_xx = 0, cov_xy = 0, cov_yy = 0;
  for (const p of centered) {
    cov_xx += p.x * p.x;
    cov_xy += p.x * p.y;
    cov_yy += p.y * p.y;
  }
  cov_xx /= points.length;
  cov_xy /= points.length;
  cov_yy /= points.length;
  
  const trace = cov_xx + cov_yy;
  const det = cov_xx * cov_yy - cov_xy * cov_xy;
  const lambda1 = trace / 2 + Math.sqrt((trace / 2) ** 2 - det);
  const lambda2 = trace / 2 - Math.sqrt((trace / 2) ** 2 - det);
  
  const v1x = cov_xy;
  const v1y = lambda1 - cov_xx;
  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  
  const pc1 = len1 > 1e-12 ? { x: v1x / len1, y: v1y / len1 } : { x: 1, y: 0 };
  const pc2 = { x: -pc1.y, y: pc1.x };
  
  const totalVar = lambda1 + lambda2;
  const explained: [number, number] = [
    lambda1 / totalVar,
    lambda2 / totalVar,
  ];
  
  return { pc1, pc2, explained, eigenvalues: [lambda1, lambda2] };
}

// Gaussian Naive Bayes utilities
export type GaussianNBModel = {
  classes: [0, 1];
  means: Record<number, { x: number; y: number }>;
  vars: Record<number, { x: number; y: number }>;
  priors: Record<number, number>;
};

export function trainGaussianNB(points: ClassifiedPoint[]): GaussianNBModel {
  const classes: [0, 1] = [0, 1];
  const means: Record<number, { x: number; y: number }> = {};
  const vars: Record<number, { x: number; y: number }> = {};
  const priors: Record<number, number> = {};

  for (const c of classes) {
    const pts = points.filter(p => p.label === c);
    const n = pts.length;
    if (n === 0) {
      means[c] = { x: 0, y: 0 };
      vars[c] = { x: 1, y: 1 };
      priors[c] = 0;
      continue;
    }
    const meanX = pts.reduce((s, p) => s + p.x, 0) / n;
    const meanY = pts.reduce((s, p) => s + p.y, 0) / n;
    const varX = pts.reduce((s, p) => s + (p.x - meanX) ** 2, 0) / n;
    const varY = pts.reduce((s, p) => s + (p.y - meanY) ** 2, 0) / n;
    means[c] = { x: meanX, y: meanY };
    vars[c] = { x: Math.max(varX, 1e-6), y: Math.max(varY, 1e-6) };
    priors[c] = n / points.length;
  }

  return { classes, means, vars, priors };
}

function gaussianLogPDF(x: number, mean: number, variance: number): number {
  return -0.5 * Math.log(2 * Math.PI * variance) - ((x - mean) ** 2) / (2 * variance);
}

export function computeNBPosterior(
  model: GaussianNBModel,
  px: number,
  py: number
): { logPosterior: Record<number, number>; posterior: Record<number, number>; prediction: 0 | 1; prob1: number } {
  const logPosteriors: Record<number, number> = {};

  for (const c of model.classes) {
    const logPrior = Math.log(model.priors[c] || 1e-12);
    const logLikelihood =
      gaussianLogPDF(px, model.means[c].x, model.vars[c].x) +
      gaussianLogPDF(py, model.means[c].y, model.vars[c].y);
    logPosteriors[c] = logPrior + logLikelihood;
  }

  const maxLog = Math.max(...Object.values(logPosteriors));
  const unnormalized = Object.fromEntries(
    Object.entries(logPosteriors).map(([c, l]) => [c, Math.exp(l - maxLog)])
  );
  const sum = Object.values(unnormalized).reduce((a, b) => a + b, 0);
  const posterior: Record<number, number> = Object.fromEntries(
    Object.entries(unnormalized).map(([c, v]) => [c, v / sum])
  );

  const prob1 = posterior[1] ?? 0;
  const prediction: 0 | 1 = prob1 >= 0.5 ? 1 : 0;

  return { logPosterior: logPosteriors, posterior, prediction, prob1 };
}

export function gaussianNBAccuracy(model: GaussianNBModel, points: ClassifiedPoint[]): number {
  if (points.length === 0) return 0;
  let correct = 0;
  for (const p of points) {
    const r = computeNBPosterior(model, p.x, p.y);
    if (r.prediction === p.label) correct++;
  }
  return (correct / points.length) * 100;
}

export type NBConfusionMatrix = { tp: number; fp: number; tn: number; fn: number };

export function gaussianNBConfusion(model: GaussianNBModel, points: ClassifiedPoint[]): NBConfusionMatrix {
  const result: NBConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const p of points) {
    const r = computeNBPosterior(model, p.x, p.y);
    if (p.label === 1 && r.prediction === 1) result.tp++;
    else if (p.label === 0 && r.prediction === 1) result.fp++;
    else if (p.label === 0 && r.prediction === 0) result.tn++;
    else if (p.label === 1 && r.prediction === 0) result.fn++;
  }
  return result;
}
