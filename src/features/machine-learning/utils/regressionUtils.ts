/**
 * Regression utilities for the Linear Regression Playground.
 *
 * Includes:
 * - Polynomial regression (any degree)
 * - Gradient descent with optional L1/L2 regularization
 * - Ordinary Least Squares (OLS) closed-form solution
 * - R², adjusted R², RMSE, MSE
 * - Confidence / Prediction interval helpers
 */

export type Point = { x: number; y: number };
export type Coefficients = number[];
export type RegType = 'none' | 'l1' | 'l2';

export interface HistoryEntry {
  coeffs: Coefficients;
  loss: number;
  iteration: number;
}

export interface RegressionStats {
  r2: number;
  adjR2: number;
  rmse: number;
  mse: number;
  ssRes: number;
  ssTot: number;
  yMean: number;
  xMean: number;
  ssX: number;
  n: number;
  k: number; // number of parameters
}

// -------------------------------
// Core helpers
// -------------------------------

export function predict(coeffs: Coefficients, x: number): number {
  let sum = 0;
  for (let i = 0; i < coeffs.length; i++) {
    sum += coeffs[i] * Math.pow(x, i);
  }
  return sum;
}

export function computeMSE(points: Point[], coeffs: Coefficients): number {
  if (points.length === 0) return 0;
  return points.reduce((acc, p) => acc + (p.y - predict(coeffs, p.x)) ** 2, 0) / points.length;
}

export function computeStats(points: Point[], coeffs: Coefficients): RegressionStats {
  const n = points.length;
  const k = coeffs.length;
  if (n === 0) {
    return { r2: 0, adjR2: 0, rmse: 0, mse: 0, ssRes: 0, ssTot: 0, yMean: 0, xMean: 0, ssX: 0, n: 0, k };
  }

  const yMean = points.reduce((s, p) => s + p.y, 0) / n;
  const xMean = points.reduce((s, p) => s + p.x, 0) / n;
  const ssRes = points.reduce((s, p) => s + (p.y - predict(coeffs, p.x)) ** 2, 0);
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  const ssX = points.reduce((s, p) => s + (p.x - xMean) ** 2, 0);

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const dfRes = Math.max(1, n - k);
  const adjR2 = n > k ? 1 - ((1 - r2) * (n - 1)) / dfRes : r2;
  const mse = ssRes / dfRes;
  const rmse = Math.sqrt(mse);

  return { r2, adjR2, rmse, mse, ssRes, ssTot, yMean, xMean, ssX, n, k };
}

// -------------------------------
// Gradient descent (polynomial)
// -------------------------------

export function gradientDescent(
  points: Point[],
  learningRate: number,
  iterations: number,
  degree: number,
  regType: RegType,
  regLambda: number
): { coeffs: Coefficients; history: HistoryEntry[] } {
  const n = points.length;
  const d = degree + 1; // number of parameters
  const coeffs: Coefficients = new Array(d).fill(0);
  const history: HistoryEntry[] = [];

  if (n === 0) {
    history.push({ coeffs: [...coeffs], loss: 0, iteration: 0 });
    return { coeffs, history };
  }

  const step = Math.max(1, Math.floor(iterations / 60));

  for (let iter = 0; iter < iterations; iter++) {
    const grads = new Array(d).fill(0);

    for (const p of points) {
      const error = predict(coeffs, p.x) - p.y;
      for (let j = 0; j < d; j++) {
        grads[j] += (2 / n) * error * Math.pow(p.x, j);
      }
    }

    // Regularization (skip intercept β₀)
    if (regType !== 'none' && regLambda > 0) {
      for (let j = 1; j < d; j++) {
        if (regType === 'l2') grads[j] += (2 / n) * regLambda * coeffs[j];
        if (regType === 'l1') grads[j] += regLambda * Math.sign(coeffs[j]);
      }
    }

    for (let j = 0; j < d; j++) {
      coeffs[j] -= learningRate * grads[j];
    }

    if (iter % step === 0 || iter === iterations - 1 || iter === 0) {
      history.push({ coeffs: [...coeffs], loss: computeMSE(points, coeffs), iteration: iter });
    }
  }

  return { coeffs, history };
}

// -------------------------------
// Normal equation (OLS closed form)
// -------------------------------

export function olsClosedForm(
  points: Point[],
  degree: number,
  regType: RegType,
  regLambda: number
): Coefficients {
  const n = points.length;
  const d = degree + 1;
  if (n === 0) return new Array(d).fill(0);

  // Build X^T X and X^T y
  const xtx: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  const xty: number[] = new Array(d).fill(0);

  for (const p of points) {
    const xp: number[] = [];
    for (let j = 0; j < d; j++) xp[j] = Math.pow(p.x, j);
    for (let i = 0; i < d; i++) {
      xty[i] += xp[i] * p.y;
      for (let j = 0; j < d; j++) {
        xtx[i][j] += xp[i] * xp[j];
      }
    }
  }

  // Ridge penalty (don't penalize intercept)
  if (regType === 'l2' && regLambda > 0) {
    for (let j = 1; j < d; j++) xtx[j][j] += regLambda;
  }

  return solveLinearSystem(xtx, xty, d);
}

function solveLinearSystem(A: number[][], b: number[], n: number): number[] {
  // Augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(aug[i][i]) < 1e-12) continue;
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = sum / aug[i][i];
  }
  return x;
}

// -------------------------------
// Confidence / Prediction intervals (linear)
// -------------------------------

// Standard error of the fitted value at x (linear regression only)
function seFit(x: number, xMean: number, ssX: number, rmse: number, n: number): number {
  if (ssX === 0 || n <= 2) return 0;
  return rmse * Math.sqrt(1 / n + Math.pow(x - xMean, 2) / ssX);
}

// Standard error of a future prediction at x
function sePred(x: number, xMean: number, ssX: number, rmse: number, n: number): number {
  if (ssX === 0 || n <= 2) return 0;
  return rmse * Math.sqrt(1 + 1 / n + Math.pow(x - xMean, 2) / ssX);
}

// t critical value approximation for 95% CI (two-tailed)
function tCrit(df: number): number {
  if (df <= 1) return 12.706;
  if (df <= 2) return 4.303;
  if (df <= 3) return 3.182;
  if (df <= 4) return 2.776;
  if (df <= 5) return 2.571;
  if (df <= 10) return 2.228;
  if (df <= 15) return 2.131;
  if (df <= 20) return 2.086;
  if (df <= 30) return 2.042;
  if (df <= 60) return 2.0;
  return 1.96;
}

export interface BandPoint {
  x: number;
  y: number;
  ciLow: number;
  ciHigh: number;
  piLow: number;
  piHigh: number;
}

export function computeBands(
  coeffs: Coefficients,
  stats: RegressionStats,
  steps = 60
): BandPoint[] {
  // Only meaningful for linear (degree 1) regression
  const { xMean, ssX, rmse, n, k } = stats;
  const df = Math.max(1, n - k);
  const t = tCrit(df);
  const points: BandPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 10; // RANGE = 10
    const y = predict(coeffs, x);
    const sef = seFit(x, xMean, ssX, rmse, n);
    const sep = sePred(x, xMean, ssX, rmse, n);
    points.push({
      x,
      y,
      ciLow: y - t * sef,
      ciHigh: y + t * sef,
      piLow: y - t * sep,
      piHigh: y + t * sep,
    });
  }
  return points;
}

// -------------------------------
// Residuals
// -------------------------------

export interface ResidualPoint {
  fitted: number;
  residual: number;
}

export function computeResiduals(points: Point[], coeffs: Coefficients): ResidualPoint[] {
  return points.map((p) => ({
    fitted: predict(coeffs, p.x),
    residual: p.y - predict(coeffs, p.x),
  }));
}

// -------------------------------
// Curve sampling for SVG drawing
// -------------------------------

export interface CurveSample {
  x: number;
  y: number;
}

export function sampleCurve(coeffs: Coefficients, xMin = 0, xMax = 10, steps = 100): CurveSample[] {
  const out: CurveSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    out.push({ x, y: predict(coeffs, x) });
  }
  return out;
}

// -------------------------------
// Coefficients → human-readable formula string
// -------------------------------

export function coeffsToFormula(coeffs: Coefficients): string {
  if (coeffs.length === 0) return '0';
  const parts: string[] = [];
  const names = ['b', 'm'];
  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i].toFixed(3);
    let term: string;
    if (i === 0) term = c;
    else if (i === 1) term = `${c}x`;
    else term = `${c}x^${i}`;
    parts.push(term);
  }
  return `y = ${parts.join(' + ')}`;
}
