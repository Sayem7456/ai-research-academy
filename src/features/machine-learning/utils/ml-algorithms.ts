/**
 * ML Algorithm Utilities
 * Shared algorithm implementations for visualizations
 */

export type Point2D = { x: number; y: number };
export type ClassifiedPoint = Point2D & { label: 0 | 1 };
export type ClusteredPoint = Point2D & { cluster?: number };

// KNN utilities
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function knnPredict(
  point: Point2D,
  trainingData: ClassifiedPoint[],
  k: number
): { prediction: number; neighbors: ClassifiedPoint[] } {
  const distances = trainingData.map(p => ({
    point: p,
    distance: euclideanDistance(point, p),
  }));
  
  distances.sort((a, b) => a.distance - b.distance);
  const neighbors = distances.slice(0, k).map(d => d.point);
  
  const votes = neighbors.reduce((acc, p) => {
    acc[p.label] = (acc[p.label] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const prediction = Object.entries(votes).reduce((a, b) => 
    votes[Number(a[0])] > votes[Number(b[0])] ? a : b
  )[0];
  
  return { prediction: Number(prediction), neighbors };
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

// Decision Tree utilities
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

export function findBestSplit(
  points: ClassifiedPoint[],
  feature: 'x' | 'y'
): { threshold: number; gain: number } | null {
  if (points.length < 2) return null;
  
  const sorted = [...points].sort((a, b) => a[feature] - b[feature]);
  const labels = points.map(p => p.label);
  const parentGini = calculateGini(labels);
  
  let bestGain = 0;
  let bestThreshold = sorted[0][feature];
  
  for (let i = 1; i < sorted.length; i++) {
    const threshold = (sorted[i - 1][feature] + sorted[i][feature]) / 2;
    const leftLabels = sorted.slice(0, i).map(p => p.label);
    const rightLabels = sorted.slice(i).map(p => p.label);
    
    const leftGini = calculateGini(leftLabels);
    const rightGini = calculateGini(rightLabels);
    const weightedGini = (leftLabels.length * leftGini + rightLabels.length * rightGini) / labels.length;
    const gain = parentGini - weightedGini;
    
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

// PCA utilities
export function computePCA(points: Point2D[]): {
  pc1: Point2D;
  pc2: Point2D;
  explained: [number, number];
} {
  if (points.length === 0) {
    return {
      pc1: { x: 1, y: 0 },
      pc2: { x: 0, y: 1 },
      explained: [0.5, 0.5],
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
  
  return { pc1, pc2, explained };
}
