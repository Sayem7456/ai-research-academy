'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

type RegType = 'none' | 'l1' | 'l2' | 'dropout' | 'both';

interface DataPoint {
  x: number;
  y: number;
}

interface FitResult {
  predict: (x: number) => number;
  coeffs: number[];
}

interface TrialResult {
  seed: number;
  fit: FitResult;
  trainLoss: number;
  testLoss: number;
}

interface BiasVarianceResult {
  biasSq: number;
  variance: number;
  totalError: number;
  noiseEstimate: number;
}

interface EpochSnapshot {
  epoch: number;
  coeffs: number[];
  trainLoss: number;
  testLoss: number;
  predict: (x: number) => number;
}

// ─── True Function ──────────────────────────────────────────────────────────

function trueFunc(x: number): number {
  return Math.sin(x * Math.PI);
}

// ─── Data Generation ────────────────────────────────────────────────────────

function generateData(n: number, noise: number, seed?: number): DataPoint[] {
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;
  const data: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = rng() * 4 - 2;
    const y = trueFunc(x) + (rng() - 0.5) * noise;
    data.push({ x, y });
  }
  return data.sort((a, b) => a.x - b.x);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ─── Matrix Helpers ─────────────────────────────────────────────────────────

function buildDesignMatrix(data: DataPoint[], degree: number): number[][] {
  return data.map(d => {
    const row: number[] = [];
    for (let p = 0; p <= degree; p++) row.push(Math.pow(d.x, p));
    return row;
  });
}

function transpose(M: number[][]): number[][] {
  return M[0].map((_, i) => M.map(r => r[i]));
}

function matMul(A: number[][], B: number[][]): number[][] {
  return A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
}

function matVecMul(A: number[][], v: number[]): number[] {
  return A.map(r => r.reduce((s, val, k) => s + val * v[k], 0));
}

// ─── OLS (Unregularized) via Gaussian Elimination ───────────────────────────

function polyFitOLS(data: DataPoint[], degree: number): FitResult {
  const X = buildDesignMatrix(data, degree);
  const Y = data.map(d => d.y);
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const XtY = matVecMul(Xt, Y);
  const coeffs = gaussianSolve(XtX, XtY);
  return {
    predict: (x: number) => coeffs.reduce((s, c, p) => s + c * Math.pow(x, p), 0),
    coeffs,
  };
}

function gaussianSolve(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    for (let k = i + 1; k < n; k++) {
      const f = aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) aug[k][j] -= f * aug[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= aug[i][j] * x[j];
    x[i] /= aug[i][i];
  }
  return x;
}

// ─── Ridge Regression (L2) via Modified Normal Equations ────────────────────

function polyFitRidge(data: DataPoint[], degree: number, lambda: number): FitResult {
  const X = buildDesignMatrix(data, degree);
  const Y = data.map(d => d.y);
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const XtY = matVecMul(Xt, Y);
  for (let i = 1; i <= degree; i++) XtX[i][i] += lambda;
  const coeffs = gaussianSolve(XtX, XtY);
  return {
    predict: (x: number) => coeffs.reduce((s, c, p) => s + c * Math.pow(x, p), 0),
    coeffs,
  };
}

// ─── Lasso Regression (L1) via Coordinate Descent ───────────────────────────

function softThreshold(rho: number, lambda: number): number {
  if (rho > lambda) return rho - lambda;
  if (rho < -lambda) return rho + lambda;
  return 0;
}

function polyFitLasso(data: DataPoint[], degree: number, lambda: number, maxIter = 500): FitResult {
  const X = buildDesignMatrix(data, degree);
  const Y = data.map(d => d.y);
  const n = data.length;
  const p = degree + 1;

  const colNorms: number[] = [];
  for (let j = 0; j < p; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += X[i][j] * X[i][j];
    colNorms.push(s);
  }

  const ols = polyFitOLS(data, degree);
  const coeffs = [...ols.coeffs];

  for (let iter = 0; iter < maxIter; iter++) {
    for (let j = 0; j < p; j++) {
      let rho = 0;
      for (let i = 0; i < n; i++) {
        let pred = 0;
        for (let k = 0; k < p; k++) {
          if (k !== j) pred += X[i][k] * coeffs[k];
        }
        rho += X[i][j] * (Y[i] - pred);
      }
      coeffs[j] = j === 0 ? rho / colNorms[j] : softThreshold(rho, lambda) / colNorms[j];
    }
  }

  return {
    predict: (x: number) => coeffs.reduce((s, c, p) => s + c * Math.pow(x, p), 0),
    coeffs,
  };
}

// ─── Fit Helper ─────────────────────────────────────────────────────────────

function fitModel(
  trainData: DataPoint[],
  degree: number,
  regType: RegType,
  lambda: number,
  dropoutRate: number,
  seed: number,
): FitResult {
  const getDropoutRng = (s: number) => {
    let r = s;
    return () => {
      r = (r * 16807 + 0) % 2147483647;
      return r / 2147483647;
    };
  };

  switch (regType) {
    case 'l1':
      return polyFitLasso(trainData, degree, lambda * 10);
    case 'l2':
      return polyFitRidge(trainData, degree, lambda * 10);
    case 'dropout': {
      const rng = getDropoutRng(seed + degree + Math.round(lambda * 100));
      const filtered = trainData.filter(() => rng() > dropoutRate);
      return filtered.length > degree ? polyFitOLS(filtered, degree) : polyFitOLS(trainData, degree);
    }
    case 'both': {
      const rng = getDropoutRng(seed + degree + Math.round(lambda * 100));
      const filtered = trainData.filter(() => rng() > dropoutRate);
      return filtered.length > degree
        ? polyFitRidge(filtered, degree, lambda * 10)
        : polyFitRidge(trainData, degree, lambda * 10);
    }
    default:
      return polyFitOLS(trainData, degree);
  }
}

// ─── Bias-Variance Decomposition ────────────────────────────────────────────

function computeBiasVariance(
  trialFits: FitResult[],
  _dataCount: number,
  noise: number,
  _degree: number,
): BiasVarianceResult {
  const nEval = 100;
  const xMin = -2, xMax = 2;
  let biasSqSum = 0;
  let varianceSum = 0;

  for (let i = 0; i < nEval; i++) {
    const x = xMin + (i / (nEval - 1)) * (xMax - xMin);
    const yTrue = trueFunc(x);

    const preds = trialFits.map(f => f.predict(x));
    const meanPred = preds.reduce((s, p) => s + p, 0) / preds.length;

    biasSqSum += Math.pow(meanPred - yTrue, 2);

    const varPred = preds.reduce((s, p) => s + Math.pow(p - meanPred, 2), 0) / preds.length;
    varianceSum += varPred;
  }

  const noiseVar = Math.pow(noise * 0.5, 2);
  return {
    biasSq: biasSqSum / nEval,
    variance: varianceSum / nEval,
    totalError: (biasSqSum + varianceSum) / nEval + noiseVar,
    noiseEstimate: noiseVar,
  };
}

// ─── Regularization Path ───────────────────────────────────────────────────

function computeRegularizationPath(
  trainData: DataPoint[],
  degree: number,
  regType: RegType,
  steps: number,
): { lambdas: number[]; paths: number[][] } {
  const lambdas = Array.from({ length: steps }, (_, i) => (i / (steps - 1)));
  const paths: number[][] = [];

  for (const lambda of lambdas) {
    const fit = fitModel(trainData, degree, regType, lambda, 0, 42);
    paths.push(fit.coeffs);
  }

  return { lambdas, paths };
}

// ─── Cross-Validation ──────────────────────────────────────────────────────

function computeCrossValidation(
  data: DataPoint[],
  degree: number,
  regType: RegType,
  lambda: number,
  folds: number,
  dropoutRate: number,
): { trainScore: number; testScore: number; foldScores: number[] } {
  const foldSize = Math.floor(data.length / folds);
  const foldScores: number[] = [];

  for (let i = 0; i < folds; i++) {
    const testStart = i * foldSize;
    const testDataFold = data.slice(testStart, testStart + foldSize);
    const trainDataFold = [...data.slice(0, testStart), ...data.slice(testStart + foldSize)];

    const fit = fitModel(trainDataFold, degree, regType, lambda, dropoutRate, 42 + i);
    const score = testDataFold.reduce((s, d) => s + Math.pow(d.y - fit.predict(d.x), 2), 0) / testDataFold.length;
    foldScores.push(score);
  }

  const trainScore = foldScores.reduce((s, v) => s + v, 0) / folds;
  const testScore = trainScore;

  return { trainScore, testScore, foldScores };
}

// ─── Feature Importance ────────────────────────────────────────────────────

function computeFeatureImportance(coeffs: number[]): { index: number; value: number; magnitude: number }[] {
  return coeffs.map((c, i) => ({
    index: i,
    value: c,
    magnitude: Math.abs(c),
  })).sort((a, b) => b.magnitude - a.magnitude);
}

// ─── Gradient Descent for Polynomial Regression ─────────────────────────────

function gradientDescentStep(
  coeffs: number[],
  trainData: DataPoint[],
  degree: number,
  lr: number,
  regType: RegType,
  lambda: number,
): number[] {
  const n = trainData.length;
  const p = degree + 1;
  const gradients = new Array(p).fill(0);

  // Compute gradients
  for (const d of trainData) {
    let pred = 0;
    for (let j = 0; j < p; j++) pred += coeffs[j] * Math.pow(d.x, j);
    const error = pred - d.y;
    for (let j = 0; j < p; j++) {
      gradients[j] += error * Math.pow(d.x, j);
    }
  }

  // Average and apply regularization
  const newCoeffs = [...coeffs];
  for (let j = 0; j < p; j++) {
    let grad = (2 / n) * gradients[j];
    // Regularization gradient (skip intercept j=0)
    if (j > 0) {
      if (regType === 'l2' || regType === 'both') {
        grad += lambda * coeffs[j];
      }
      if (regType === 'l1') {
        grad += lambda * Math.sign(coeffs[j]);
      }
    }
    newCoeffs[j] = coeffs[j] - lr * grad;
  }

  return newCoeffs;
}

function computeMSE(coeffs: number[], data: DataPoint[], degree: number): number {
  const p = degree + 1;
  return data.reduce((s, d) => {
    let pred = 0;
    for (let j = 0; j < p; j++) pred += coeffs[j] * Math.pow(d.x, j);
    return s + Math.pow(pred - d.y, 2);
  }, 0) / data.length;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function RegularizationDemo() {
  const [regType, setRegType] = useState<RegType>('none');
  const [lambda, setLambda] = useState(0.1);
  const [degree, setDegree] = useState(8);
  const [noise, setNoise] = useState(0.8);
  const [dropoutRate, setDropoutRate] = useState(0.3);
  const [dataSeed, setDataSeed] = useState(42);
  const [dataCount, setDataCount] = useState(20);

  // Phase 2: Multi-trial state
  const [trialCount, setTrialCount] = useState(0);
  const [trialFits, setTrialFits] = useState<TrialResult[]>([]);
  const [showVarianceOverlay, setShowVarianceOverlay] = useState(false);

  // Phase 3: Training Dynamics state
  const [trainingMode, setTrainingMode] = useState(false);
  const [epochSnapshots, setEpochSnapshots] = useState<EpochSnapshot[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [earlyStoppingEpoch, setEarlyStoppingEpoch] = useState<number | null>(null);
  const [patience, setPatience] = useState(10);
  const [learningRate, setLearningRate] = useState(0.01);
  const [maxEpochs, setMaxEpochs] = useState(100);
  const trainingRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 4: Advanced Analysis state
  const [showRegularizationPath, setShowRegularizationPath] = useState(true);
  const [showCrossValidation, setShowCrossValidation] = useState(true);
  const [cvFoldCount, setCvFoldCount] = useState(5);
  const pathSteps = 20;

  const data = useMemo(() => generateData(dataCount, noise, dataSeed), [dataCount, noise, dataSeed]);
  const trainData = useMemo(() => data.slice(0, Math.floor(data.length * 0.7)), [data]);
  const testData = useMemo(() => data.slice(Math.floor(data.length * 0.7)), [data]);

  // Compute single fit (instant)
  const { regularizedFit, olsFit, regularizedCoeffs, olsCoeffs } = useMemo(() => {
    const regFit = fitModel(trainData, degree, regType, lambda, dropoutRate, dataSeed);
    const ols = polyFitOLS(trainData, degree);
    return {
      regularizedFit: regFit,
      olsFit: ols,
      regularizedCoeffs: regFit.coeffs,
      olsCoeffs: ols.coeffs,
    };
  }, [trainData, degree, regType, lambda, dropoutRate, dataSeed]);

  // Training dynamics: run gradient descent
  const startTraining = useCallback(() => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingMode(true);
    setEpochSnapshots([]);
    setCurrentEpoch(0);
    setEarlyStoppingEpoch(null);

    const p = degree + 1;
    let coeffs = new Array(p).fill(0);
    let bestTestLoss = Infinity;
    let bestEpoch = 0;
    let patienceCounter = 0;
    const snapshots: EpochSnapshot[] = [];

    // Initial snapshot
    const initialTrainLoss = computeMSE(coeffs, trainData, degree);
    const initialTestLoss = computeMSE(coeffs, testData, degree);
    const initialPredict = (x: number) => coeffs.reduce((s, c, j) => s + c * Math.pow(x, j), 0);
    snapshots.push({ epoch: 0, coeffs: [...coeffs], trainLoss: initialTrainLoss, testLoss: initialTestLoss, predict: initialPredict });

    let epoch = 0;

    const step = () => {
      if (epoch >= maxEpochs) {
        setIsTraining(false);
        setEpochSnapshots(snapshots);
        return;
      }

      coeffs = gradientDescentStep(coeffs, trainData, degree, learningRate, regType, lambda);
      const trainLoss = computeMSE(coeffs, trainData, degree);
      const testLoss = computeMSE(coeffs, testData, degree);
      const predict = (x: number) => coeffs.reduce((s, c, j) => s + c * Math.pow(x, j), 0);

      snapshots.push({ epoch: epoch + 1, coeffs: [...coeffs], trainLoss, testLoss, predict });

      // Early stopping check
      if (testLoss < bestTestLoss - 1e-6) {
        bestTestLoss = testLoss;
        bestEpoch = epoch + 1;
        patienceCounter = 0;
      } else {
        patienceCounter++;
        if (patienceCounter >= patience) {
          setEarlyStoppingEpoch(bestEpoch);
          setEpochSnapshots(snapshots);
          setCurrentEpoch(epoch + 1);
          setIsTraining(false);
          return;
        }
      }

      epoch++;
      setCurrentEpoch(epoch);
      setEpochSnapshots([...snapshots]);
      trainingRef.current = setTimeout(step, 20);
    };

    trainingRef.current = setTimeout(step, 20);
  }, [trainData, testData, degree, regType, lambda, learningRate, maxEpochs, patience, isTraining]);

  const stopTraining = useCallback(() => {
    if (trainingRef.current) {
      clearTimeout(trainingRef.current);
      trainingRef.current = null;
    }
    setIsTraining(false);
  }, []);

  const resetTraining = useCallback(() => {
    stopTraining();
    setTrainingMode(false);
    setEpochSnapshots([]);
    setCurrentEpoch(0);
    setEarlyStoppingEpoch(null);
  }, [stopTraining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trainingRef.current) clearTimeout(trainingRef.current);
    };
  }, []);

  // Run multiple trials
  const runMultipleTrials = useMemo(() => {
    return (count: number) => {
      const results: TrialResult[] = [];
      const baseSeed = dataSeed * 1000;
      for (let i = 0; i < count; i++) {
        const seed = baseSeed + i * 7 + 13;
        const trialData = generateData(dataCount, noise, seed);
        const trialTrain = trialData.slice(0, Math.floor(trialData.length * 0.7));
        const trialTest = trialData.slice(Math.floor(trialData.length * 0.7));
        const fit = fitModel(trialTrain, degree, regType, lambda, dropoutRate, seed);
        const tLoss = trialTrain.reduce((s, d) => s + Math.pow(d.y - fit.predict(d.x), 2), 0) / trialTrain.length;
        const teLoss = trialTest.reduce((s, d) => s + Math.pow(d.y - fit.predict(d.x), 2), 0) / trialTest.length;
        results.push({ seed, fit, trainLoss: tLoss, testLoss: teLoss });
      }
      setTrialFits(results);
      setTrialCount(count);
    };
  }, [dataSeed, dataCount, noise, degree, regType, lambda, dropoutRate]);

  // Compute bias-variance decomposition
  const biasVariance = useMemo(() => {
    if (trialFits.length < 2) return null;
    return computeBiasVariance(trialFits.map(t => t.fit), dataCount, noise, degree);
  }, [trialFits, dataCount, noise, degree]);

  // Compute trial statistics
  const trialStats = useMemo(() => {
    if (trialFits.length === 0) return null;
    const trainLosses = trialFits.map(t => t.trainLoss);
    const testLosses = trialFits.map(t => t.testLoss);
    return {
      avgTrainLoss: trainLosses.reduce((s, l) => s + l, 0) / trainLosses.length,
      avgTestLoss: testLosses.reduce((s, l) => s + l, 0) / testLosses.length,
      stdTrainLoss: Math.sqrt(trainLosses.reduce((s, l) => s + Math.pow(l - trainLosses.reduce((a, b) => a + b, 0) / trainLosses.length, 2), 0) / trainLosses.length),
      stdTestLoss: Math.sqrt(testLosses.reduce((s, l) => s + Math.pow(l - testLosses.reduce((a, b) => a + b, 0) / testLosses.length, 2), 0) / testLosses.length),
    };
  }, [trialFits]);

  // ─── SVG Layout ───────────────────────────────────────────────────────────

  const svgW = 500;
  const svgH = 300;
  const xMin = -2.5, xMax = 2.5, yMin = -2.5, yMax = 2.5;
  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * svgW;
  const toSvgY = (y: number) => ((yMax - y) / (yMax - yMin)) * svgH;

  // Fit curve (instant or from training)
  const activeFit = useMemo(() => {
    if (trainingMode && epochSnapshots.length > 0) {
      return epochSnapshots[epochSnapshots.length - 1].predict;
    }
    return regularizedFit.predict;
  }, [trainingMode, epochSnapshots, regularizedFit]);

  const curvePoints = useMemo(() =>
    Array.from({ length: 200 }, (_, i) => {
      const x = xMin + (i / 199) * (xMax - xMin);
      return `${toSvgX(x)},${toSvgY(activeFit(x))}`;
    }).join(' '), [activeFit, xMin, xMax, toSvgX, toSvgY]);

  const olsCurvePoints = useMemo(() =>
    regType !== 'none'
      ? Array.from({ length: 200 }, (_, i) => {
          const x = xMin + (i / 199) * (xMax - xMin);
          return `${toSvgX(x)},${toSvgY(olsFit.predict(x))}`;
        }).join(' ')
      : '', [olsFit, regType, xMin, xMax, toSvgX, toSvgY]);

  const trueCurvePoints = useMemo(() =>
    Array.from({ length: 200 }, (_, i) => {
      const x = xMin + (i / 199) * (xMax - xMin);
      return `${toSvgX(x)},${toSvgY(trueFunc(x))}`;
    }).join(' '), [xMin, xMax, toSvgX, toSvgY]);

  const trialCurves = useMemo(() =>
    trialFits.map((t, idx) => ({
      key: `trial-${idx}`,
      points: Array.from({ length: 200 }, (_, i) => {
        const x = xMin + (i / 199) * (xMax - xMin);
        return `${toSvgX(x)},${toSvgY(t.fit.predict(x))}`;
      }).join(' '),
    })), [trialFits, xMin, xMax, toSvgX, toSvgY]);

  // ─── Losses ───────────────────────────────────────────────────────────────

  const trainLoss = useMemo(() => {
    if (trainingMode && epochSnapshots.length > 0) {
      return epochSnapshots[epochSnapshots.length - 1].trainLoss;
    }
    return trainData.reduce((s, d) => s + Math.pow(d.y - regularizedFit.predict(d.x), 2), 0) / trainData.length;
  }, [trainData, regularizedFit, trainingMode, epochSnapshots]);

  const testLoss = useMemo(() => {
    if (trainingMode && epochSnapshots.length > 0) {
      return epochSnapshots[epochSnapshots.length - 1].testLoss;
    }
    return testData.reduce((s, d) => s + Math.pow(d.y - regularizedFit.predict(d.x), 2), 0) / testData.length;
  }, [testData, regularizedFit, trainingMode, epochSnapshots]);

  // ─── Weight Stats ─────────────────────────────────────────────────────────

  const activeCoeffs = useMemo(() => {
    if (trainingMode && epochSnapshots.length > 0) {
      return epochSnapshots[epochSnapshots.length - 1].coeffs;
    }
    return regularizedCoeffs;
  }, [trainingMode, epochSnapshots, regularizedCoeffs]);

  const maxAbsCoeff = useMemo(() => {
    const all = [...olsCoeffs, ...activeCoeffs].map(Math.abs);
    return Math.max(...all, 0.01);
  }, [olsCoeffs, activeCoeffs]);

  const weightBarW = 280;
  const weightBarH = 180;
  const barGap = 2;
  const barWidth = Math.max(4, (weightBarW - barGap * degree) / (degree + 1));

  const coeffLabels = useMemo(() => {
    return activeCoeffs.map((_, i) => {
      if (i === 0) return 'b';
      if (i === 1) return 'x';
      if (i === 2) return 'x²';
      if (i === 3) return 'x³';
      return `x${String(i + 1).replace(/1$/, '¹').replace(/2$/, '²').replace(/3$/, '³').replace(/4$/, '⁴').replace(/5$/, '⁵').replace(/6$/, '6').replace(/7$/, '7').replace(/8$/, '8').replace(/9$/, '9')}`;
    });
  }, [activeCoeffs]);

  // ─── Zone Classification ──────────────────────────────────────────────────

  const zone = useMemo(() => {
    if (trialStats) {
      const avgTrain = trialStats.avgTrainLoss;
      const avgTest = trialStats.avgTestLoss;
      const gap = avgTest - avgTrain;
      if (avgTrain > 0.5 && avgTest > 0.5) return { label: 'Underfitting', color: '#F59E0B', desc: 'Model is too simple to capture the pattern' };
      if (gap > 0.3) return { label: 'Overfitting', color: '#EF4444', desc: 'Model memorizes noise, poor generalization' };
      return { label: 'Good Fit', color: '#22C55E', desc: 'Model generalizes well to unseen data' };
    }
    const gap = testLoss - trainLoss;
    if (trainLoss > 0.5 && testLoss > 0.5) return { label: 'Underfitting', color: '#F59E0B', desc: 'Model is too simple to capture the pattern' };
    if (gap > 0.3) return { label: 'Overfitting', color: '#EF4444', desc: 'Model memorizes noise, poor generalization' };
    return { label: 'Good Fit', color: '#22C55E', desc: 'Model generalizes well to unseen data' };
  }, [trainLoss, testLoss, trialStats]);

  // ─── Phase 4: Advanced Analysis ──────────────────────────────────────────

  // Regularization Path
  const regularizationPath = useMemo(() => {
    if (regType === 'none') return null;
    return computeRegularizationPath(trainData, degree, regType, pathSteps);
  }, [trainData, degree, regType, pathSteps]);

  // Cross-Validation Scores for current lambda
  const cvScores = useMemo(() => {
    return computeCrossValidation(data, degree, regType, lambda, cvFoldCount, dropoutRate);
  }, [data, degree, regType, lambda, cvFoldCount, dropoutRate]);

  // Feature Importance
  const featureImportance = useMemo(() => {
    return computeFeatureImportance(activeCoeffs);
  }, [activeCoeffs]);

  // Regularization Path Chart dimensions
  const rpChartW = 600;
  const rpChartH = 200;

  // Cross-Validation Chart dimensions
  const cvChartW = 400;
  const cvChartH = 150;

  // Feature Importance Chart dimensions
  const fiChartW = 400;
  const fiChartH = 200;

  // Learning curves chart dimensions
  const lcChartW = 600;
  const lcChartH = 200;

  // Bias-Variance chart dimensions
  const bvChartW = 400;
  const bvChartH = 150;

  return (
    <div className="space-y-6">
      {/* ─── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Fit Visualization ────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {trainingMode ? `Fit Visualization — Epoch ${currentEpoch}` : 'Fit Visualization'}
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              {regType !== 'none' && !trainingMode && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5 bg-indigo-500 rounded" />
                    <span className="text-gray-500">Regularized</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5 bg-gray-400 rounded" style={{ borderTop: '1px dashed #9CA3AF' }} />
                    <span className="text-gray-500">OLS</span>
                  </span>
                </>
              )}
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-green-500 rounded" />
                <span className="text-gray-500">True</span>
              </span>
              {showVarianceOverlay && trialFits.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-purple-300 rounded" />
                  <span className="text-gray-500">Trials ({trialCount})</span>
                </span>
              )}
            </div>
          </div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <rect width={svgW} height={svgH} fill="rgb(243 244 246)" rx="8" />
            <line x1={toSvgX(0)} y1={0} x2={toSvgX(0)} y2={svgH} stroke="#D1D5DB" strokeWidth={1} />
            <line x1={0} y1={toSvgY(0)} x2={svgW} y2={toSvgY(0)} stroke="#D1D5DB" strokeWidth={1} />
            {[-2, -1, 1, 2].map(v => (
              <g key={`tick-${v}`}>
                <line x1={toSvgX(v)} y1={toSvgY(0) - 3} x2={toSvgX(v)} y2={toSvgY(0) + 3} stroke="#9CA3AF" strokeWidth={1} />
                <text x={toSvgX(v)} y={toSvgY(0) + 12} fontSize={8} fill="#9CA3AF" textAnchor="middle">{v}</text>
              </g>
            ))}
            {[-2, -1, 1, 2].map(v => (
              <g key={`tick-y-${v}`}>
                <line x1={toSvgX(0) - 3} y1={toSvgY(v)} x2={toSvgX(0) + 3} y2={toSvgY(v)} stroke="#9CA3AF" strokeWidth={1} />
                <text x={toSvgX(0) - 8} y={toSvgY(v) + 3} fontSize={8} fill="#9CA3AF" textAnchor="end">{v}</text>
              </g>
            ))}

            <polyline points={trueCurvePoints} fill="none" stroke="#22C55E" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.7} />

            {regType !== 'none' && !trainingMode && olsCurvePoints && (
              <polyline points={olsCurvePoints} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
            )}

            {showVarianceOverlay && trialCurves.map(tc => (
              <polyline key={tc.key} points={tc.points} fill="none" stroke="#C4B5FD" strokeWidth={1} opacity={0.4} />
            ))}

            <polyline points={curvePoints} fill="none" stroke="#6366F1" strokeWidth={2.5} />

            {trainData.map((d, i) => (
              <circle key={`t${i}`} cx={toSvgX(d.x)} cy={toSvgY(d.y)} r={4} fill="#3B82F6" stroke="white" strokeWidth={1.5} />
            ))}
            {testData.map((d, i) => (
              <circle key={`v${i}`} cx={toSvgX(d.x)} cy={toSvgY(d.y)} r={4} fill="#EF4444" stroke="white" strokeWidth={1.5} />
            ))}

            <circle cx={15} cy={15} r={5} fill="#3B82F6" />
            <text x={25} y={19} fontSize={10} fill="#6B7280">Train</text>
            <circle cx={65} cy={15} r={5} fill="#EF4444" />
            <text x={75} y={19} fontSize={10} fill="#6B7280">Test</text>
            <line x1={100} y1={15} x2={120} y2={15} stroke="#22C55E" strokeWidth={1.5} strokeDasharray="6,3" />
            <text x={125} y={19} fontSize={10} fill="#6B7280">True f(x)</text>
          </svg>

          {/* Zone Indicator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: zone.color }}>
              {zone.label}
            </div>
            <span className="text-[10px] text-gray-500">{zone.desc}</span>
          </div>
        </div>

        {/* ─── Right: Controls ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Regularization Type */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Regularization</h3>
            <div className="space-y-1.5">
              {([
                { key: 'none', label: 'None (OLS)', desc: 'No penalty' },
                { key: 'l2', label: 'L2 (Ridge)', desc: 'Shrinks weights' },
                { key: 'l1', label: 'L1 (Lasso)', desc: 'Sparse weights' },
                { key: 'dropout', label: 'Dropout', desc: 'Data subsampling' },
                { key: 'both', label: 'Dropout + L2', desc: 'Combined' },
              ] as const).map(({ key, label, desc }) => (
                <button key={key} onClick={() => { setRegType(key); resetTraining(); }}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    regType === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  <span className="text-xs font-medium block">{label}</span>
                  <span className={`text-[10px] ${regType === key ? 'text-indigo-200' : 'text-gray-400'}`}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lambda Slider */}
          {regType !== 'none' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mb-1">
                <span>Regularization Strength (λ)</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{lambda.toFixed(2)}</strong>
              </label>
              <input
                type="range" min="0" max="1" step="0.01" value={lambda}
                onChange={e => { setLambda(parseFloat(e.target.value)); resetTraining(); }}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-green-500">None</span>
                <span className="text-[9px] text-yellow-500">Moderate</span>
                <span className="text-[9px] text-red-500">Strong</span>
              </div>
            </div>
          )}

          {/* Dropout Rate */}
          {(regType === 'dropout' || regType === 'both') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Dropout Rate</span>
                <strong>{(dropoutRate * 100).toFixed(0)}%</strong>
              </label>
              <input type="range" min="0" max="0.8" step="0.05" value={dropoutRate}
                onChange={e => { setDropoutRate(parseFloat(e.target.value)); resetTraining(); }}
                className="w-full accent-indigo-500"
              />
            </div>
          )}

          {/* Model Complexity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Model Complexity</h3>
            <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mb-1">
              <span>Polynomial Degree</span>
              <strong className="text-indigo-600 dark:text-indigo-400">{degree}</strong>
            </label>
            <input type="range" min="2" max="10" step="1" value={degree}
              onChange={e => { setDegree(parseInt(e.target.value)); resetTraining(); }}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-green-500">Simple</span>
              <span className="text-[9px] text-red-500">Complex</span>
            </div>
          </div>

          {/* Data Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Data</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mb-1">
                  <span>Noise Level</span>
                  <strong>{noise.toFixed(1)}</strong>
                </label>
                <input type="range" min="0.1" max="2.0" step="0.1" value={noise}
                  onChange={e => { setNoise(parseFloat(e.target.value)); resetTraining(); }}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mb-1">
                  <span>Sample Count</span>
                  <strong>{dataCount}</strong>
                </label>
                <input type="range" min="10" max="50" step="5" value={dataCount}
                  onChange={e => { setDataCount(parseInt(e.target.value)); resetTraining(); }}
                  className="w-full accent-indigo-500"
                />
              </div>
              <button
                onClick={() => { setDataSeed(s => s + 1); setTrialFits([]); setTrialCount(0); resetTraining(); }}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Regenerate Data
              </button>
            </div>
          </div>

          {/* Loss Display */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Loss</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <span className="text-xs text-blue-500 dark:text-blue-400 block">Train MSE</span>
                <strong className="text-blue-700 dark:text-blue-300">{trainLoss.toFixed(4)}</strong>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <span className="text-xs text-red-500 dark:text-red-400 block">Test MSE</span>
                <strong className="text-red-700 dark:text-red-300">{testLoss.toFixed(4)}</strong>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              {testLoss > trainLoss * 2 ? '⚠️ Overfitting!' : testLoss < trainLoss * 1.2 ? '✅ Good generalization' : '📊 Moderate gap'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Training Dynamics ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Training Dynamics</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Watch gradient descent learn epoch by epoch. Use early stopping to prevent overfitting.</p>
          </div>
          <div className="flex items-center gap-2">
            {!isTraining ? (
              <button onClick={startTraining}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors cursor-pointer">
                Start Training
              </button>
            ) : (
              <button onClick={stopTraining}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer">
                Stop
              </button>
            )}
            {trainingMode && !isTraining && (
              <button onClick={resetTraining}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Training Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between mb-1">
              <span>Learning Rate</span>
              <strong className="text-indigo-600">{learningRate.toFixed(3)}</strong>
            </label>
            <input type="range" min="0.001" max="0.1" step="0.001" value={learningRate}
              onChange={e => setLearningRate(parseFloat(e.target.value))}
              disabled={isTraining}
              className="w-full accent-indigo-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between mb-1">
              <span>Max Epochs</span>
              <strong className="text-indigo-600">{maxEpochs}</strong>
            </label>
            <input type="range" min="10" max="200" step="10" value={maxEpochs}
              onChange={e => setMaxEpochs(parseInt(e.target.value))}
              disabled={isTraining}
              className="w-full accent-indigo-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between mb-1">
              <span>Early Stop Patience</span>
              <strong className="text-indigo-600">{patience}</strong>
            </label>
            <input type="range" min="3" max="30" step="1" value={patience}
              onChange={e => setPatience(parseInt(e.target.value))}
              disabled={isTraining}
              className="w-full accent-indigo-500 disabled:opacity-50"
            />
          </div>
          <div className="flex items-end">
            {earlyStoppingEpoch && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                ⏹️ Early stop at epoch {earlyStoppingEpoch}
              </div>
            )}
          </div>
        </div>

        {/* Learning Curves Chart */}
        {epochSnapshots.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-medium">Learning Curves</div>
            <svg viewBox={`0 0 ${lcChartW} ${lcChartH}`} className="w-full">
              <rect x={0} y={0} width={lcChartW} height={lcChartH} fill="rgb(243 244 246)" rx="6" />

              {/* Compute scales */}
              {(() => {
                const allTrain = epochSnapshots.map(s => s.trainLoss);
                const allTest = epochSnapshots.map(s => s.testLoss);
                const maxLoss = Math.max(...allTrain, ...allTest, 0.1);
                const minLoss = 0;
                const padLeft = 40;
                const padRight = 10;
                const padTop = 20;
                const padBottom = 30;
                const chartW = lcChartW - padLeft - padRight;
                const chartH = lcChartH - padTop - padBottom;

                const toX = (epoch: number) => padLeft + (epoch / maxEpochs) * chartW;
                const toY = (loss: number) => padTop + chartH - ((loss - minLoss) / (maxLoss - minLoss)) * chartH;

                // Grid lines
                const gridLines = [];
                for (let i = 0; i <= 4; i++) {
                  const y = padTop + (i / 4) * chartH;
                  const val = maxLoss - (i / 4) * (maxLoss - minLoss);
                  gridLines.push(
                    <g key={`grid-${i}`}>
                      <line x1={padLeft} y1={y} x2={lcChartW - padRight} y2={y} stroke="#E5E7EB" strokeWidth={1} />
                      <text x={padLeft - 4} y={y + 3} fontSize={8} fill="#9CA3AF" textAnchor="end">{val.toFixed(2)}</text>
                    </g>
                  );
                }

                // X-axis labels
                for (let i = 0; i <= 4; i++) {
                  const epoch = Math.round((i / 4) * maxEpochs);
                  const x = toX(epoch);
                  gridLines.push(
                    <text key={`xlabel-${i}`} x={x} y={lcChartH - 8} fontSize={8} fill="#9CA3AF" textAnchor="middle">{epoch}</text>
                  );
                }

                // Early stopping line
                const earlyStopLine = earlyStoppingEpoch ? (
                  <line x1={toX(earlyStoppingEpoch)} y1={padTop} x2={toX(earlyStoppingEpoch)} y2={padTop + chartH}
                    stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4,2" />
                ) : null;

                // Train loss line
                const trainLine = epochSnapshots.map((s, i) =>
                  `${i === 0 ? 'M' : 'L'}${toX(s.epoch)},${toY(s.trainLoss)}`
                ).join(' ');

                // Test loss line
                const testLine = epochSnapshots.map((s, i) =>
                  `${i === 0 ? 'M' : 'L'}${toX(s.epoch)},${toY(s.testLoss)}`
                ).join(' ');

                // Current epoch marker
                const currentSnapshot = epochSnapshots[epochSnapshots.length - 1];

                return (
                  <>
                    {gridLines}
                    {earlyStopLine}
                    <path d={trainLine} fill="none" stroke="#3B82F6" strokeWidth={2} />
                    <path d={testLine} fill="none" stroke="#EF4444" strokeWidth={2} />
                    {/* Current position markers */}
                    <circle cx={toX(currentSnapshot.epoch)} cy={toY(currentSnapshot.trainLoss)} r={4} fill="#3B82F6" stroke="white" strokeWidth={1.5} />
                    <circle cx={toX(currentSnapshot.epoch)} cy={toY(currentSnapshot.testLoss)} r={4} fill="#EF4444" stroke="white" strokeWidth={1.5} />

                    {/* Legend */}
                    <line x1={padLeft + 10} y1={12} x2={padLeft + 30} y2={12} stroke="#3B82F6" strokeWidth={2} />
                    <text x={padLeft + 35} y={15} fontSize={9} fill="#6B7280">Train Loss</text>
                    <line x1={padLeft + 100} y1={12} x2={padLeft + 120} y2={12} stroke="#EF4444" strokeWidth={2} />
                    <text x={padLeft + 125} y={15} fontSize={9} fill="#6B7280">Test Loss</text>
                    {earlyStoppingEpoch && (
                      <>
                        <line x1={padLeft + 200} y1={12} x2={padLeft + 220} y2={12} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4,2" />
                        <text x={padLeft + 225} y={15} fontSize={9} fill="#6B7280">Early Stop</text>
                      </>
                    )}

                    {/* Axis labels */}
                    <text x={lcChartW / 2} y={lcChartH - 2} fontSize={9} fill="#6B7280" textAnchor="middle">Epoch</text>
                    <text x={8} y={lcChartH / 2} fontSize={9} fill="#6B7280" textAnchor="middle" transform={`rotate(-90, 8, ${lcChartH / 2})`}>Loss (MSE)</text>

                    {/* Epoch counter */}
                    <text x={lcChartW - padRight - 5} y={padTop + 12} fontSize={9} fill="#6B7280" textAnchor="end">
                      Epoch {currentSnapshot.epoch}/{maxEpochs}
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {epochSnapshots.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">
            Click &quot;Start Training&quot; to watch gradient descent learn epoch by epoch
          </div>
        )}
      </div>

      {/* ─── Multi-Trial Analysis ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Multi-Trial Analysis</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Run multiple trials with different random datasets to visualize variance</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-500 dark:text-gray-400">Trials:</label>
            <select
              value={trialCount || 20}
              onChange={e => {
                const count = parseInt(e.target.value);
                setTrialCount(count);
                runMultipleTrials(count);
              }}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            >
              {[5, 10, 20, 50].map(n => (
                <option key={n} value={n}>{n} trials</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showVarianceOverlay}
                onChange={() => setShowVarianceOverlay(!showVarianceOverlay)}
                className="rounded w-3 h-3" />
              Show curves
            </label>
          </div>
        </div>

        {trialFits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trialStats && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 block">Avg Train Loss</span>
                    <strong className="text-blue-700 dark:text-blue-300 text-sm">{trialStats.avgTrainLoss.toFixed(4)}</strong>
                    <span className="text-[9px] text-blue-400 block">±{trialStats.stdTrainLoss.toFixed(4)}</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                    <span className="text-[10px] text-red-500 dark:text-red-400 block">Avg Test Loss</span>
                    <strong className="text-red-700 dark:text-red-300 text-sm">{trialStats.avgTestLoss.toFixed(4)}</strong>
                    <span className="text-[9px] text-red-400 block">±{trialStats.stdTestLoss.toFixed(4)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  Variance indicator: {trialStats.stdTestLoss > 0.1 ? '🔴 High variance (unstable)' : trialStats.stdTestLoss > 0.05 ? '🟡 Moderate variance' : '🟢 Low variance (stable)'}
                </div>
              </div>
            )}

            {biasVariance && (
              <div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-medium">Bias-Variance Decomposition</div>
                <svg viewBox={`0 0 ${bvChartW} ${bvChartH}`} className="w-full">
                  <rect x={0} y={0} width={bvChartW} height={bvChartH} fill="rgb(243 244 246)" rx="6" />
                  {(() => {
                    const maxVal = Math.max(biasVariance.biasSq, biasVariance.variance, biasVariance.noiseEstimate, 0.01);
                    const barMaxH = bvChartH - 40;
                    const barW = 60;
                    const gap = 30;
                    const startX = (bvChartW - (3 * barW + 2 * gap)) / 2;
                    const items = [
                      { label: 'Bias²', value: biasVariance.biasSq, color: '#3B82F6' },
                      { label: 'Variance', value: biasVariance.variance, color: '#EF4444' },
                      { label: 'Noise', value: biasVariance.noiseEstimate, color: '#9CA3AF' },
                    ];
                    return items.map((item, i) => {
                      const x = startX + i * (barW + gap);
                      const barH = (item.value / maxVal) * barMaxH;
                      const y = bvChartH - 20 - barH;
                      return (
                        <g key={item.label}>
                          <rect x={x} y={y} width={barW} height={barH} fill={item.color} rx={3} opacity={0.8} />
                          <text x={x + barW / 2} y={y - 4} fontSize={9} fill="#6B7280" textAnchor="middle" fontWeight="bold">
                            {item.value.toFixed(4)}
                          </text>
                          <text x={x + barW / 2} y={bvChartH - 6} fontSize={9} fill="#6B7280" textAnchor="middle">
                            {item.label}
                          </text>
                        </g>
                      );
                    });
                  })()}
                  <text x={bvChartW / 2} y={14} fontSize={10} fill="#374151" textAnchor="middle" fontWeight="bold">
                    Total Error: {biasVariance.totalError.toFixed(4)} = Bias² + Variance + Noise
                  </text>
                </svg>
              </div>
            )}
          </div>
        )}

        {trialFits.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-xs">
            Click the trial count dropdown to run multiple trials and visualize bias-variance tradeoff
          </div>
        )}
      </div>

      {/* ─── Weight Magnitudes ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Weight Magnitudes</h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4">
          Watch how regularization shrinks coefficient magnitudes. L1 (Lasso) drives some weights to exactly zero — feature selection. L2 (Ridge) shrinks all weights proportionally.
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 text-center font-medium">
              {trainingMode ? 'GD Weights' : regType === 'none' ? 'OLS Weights' : `Regularized Weights (${regType.toUpperCase()})`}
            </div>
            <svg viewBox={`0 0 ${weightBarW} ${weightBarH + 20}`} className="w-full">
              <line x1={0} y1={weightBarH / 2 + 10} x2={weightBarW} y2={weightBarH / 2 + 10} stroke="#D1D5DB" strokeWidth={1} />
              {activeCoeffs.map((c, i) => {
                const x = i * (barWidth + barGap) + 4;
                const barH = Math.abs(c) / maxAbsCoeff * (weightBarH / 2 - 10);
                const y = c >= 0 ? weightBarH / 2 + 10 - barH : weightBarH / 2 + 10;
                const isZero = Math.abs(c) < 0.001;
                return (
                  <g key={`reg-${i}`}>
                    <rect x={x} y={y} width={barWidth} height={Math.max(1, barH)}
                      fill={isZero ? '#D1D5DB' : regType === 'l1' ? '#8B5CF6' : '#6366F1'}
                      rx={1} opacity={isZero ? 0.4 : 0.85} />
                    <text x={x + barWidth / 2} y={weightBarH + 16} fontSize={7} fill="#9CA3AF" textAnchor="middle">
                      {coeffLabels[i]}
                    </text>
                  </g>
                );
              })}
              <text x={2} y={12} fontSize={7} fill="#9CA3AF">+</text>
              <text x={2} y={weightBarH + 6} fontSize={7} fill="#9CA3AF">−</text>
            </svg>
          </div>

          {regType !== 'none' && !trainingMode && (
            <div className="flex-1">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 text-center font-medium">OLS Weights (no reg)</div>
              <svg viewBox={`0 0 ${weightBarW} ${weightBarH + 20}`} className="w-full">
                <line x1={0} y1={weightBarH / 2 + 10} x2={weightBarW} y2={weightBarH / 2 + 10} stroke="#D1D5DB" strokeWidth={1} />
                {olsCoeffs.map((c, i) => {
                  const x = i * (barWidth + barGap) + 4;
                  const barH = Math.abs(c) / maxAbsCoeff * (weightBarH / 2 - 10);
                  const y = c >= 0 ? weightBarH / 2 + 10 - barH : weightBarH / 2 + 10;
                  return (
                    <g key={`ols-${i}`}>
                      <rect x={x} y={y} width={barWidth} height={Math.max(1, barH)}
                        fill="#9CA3AF" rx={1} opacity={0.6} />
                      <text x={x + barWidth / 2} y={weightBarH + 16} fontSize={7} fill="#9CA3AF" textAnchor="middle">
                        {coeffLabels[i]}
                      </text>
                    </g>
                  );
                })}
                <text x={2} y={12} fontSize={7} fill="#9CA3AF">+</text>
                <text x={2} y={weightBarH + 6} fontSize={7} fill="#9CA3AF">−</text>
              </svg>
            </div>
          )}
        </div>

        {regType === 'l1' && !trainingMode && (
          <div className="mt-3 text-center">
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              {activeCoeffs.filter(c => Math.abs(c) < 0.001).length} of {activeCoeffs.length} weights zeroed out (sparse)
            </span>
          </div>
        )}
      </div>

      {/* ─── Phase 4: Advanced Analysis ─────────────────────────────────────── */}

      {/* Regularization Path */}
      {regType !== 'none' && regularizationPath && !trainingMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Regularization Path</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Watch weights shrink as λ increases from 0 → 1</p>
            </div>
            <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showRegularizationPath}
                onChange={() => setShowRegularizationPath(!showRegularizationPath)}
                className="rounded w-3 h-3" />
              Show Path
            </label>
          </div>

          {showRegularizationPath && (
            <svg viewBox={`0 0 ${rpChartW} ${rpChartH}`} className="w-full">
              <rect x={0} y={0} width={rpChartW} height={rpChartH} fill="rgb(243 244 246)" rx="6" />

              {/* Grid and axes */}
              {(() => {
                const padLeft = 40;
                const padRight = 10;
                const padTop = 20;
                const padBottom = 30;
                const chartW = rpChartW - padLeft - padRight;
                const chartH = rpChartH - padTop - padBottom;

                // Find max absolute coefficient for scaling
                const allCoeffs = regularizationPath.paths.flat();
                const maxAbs = Math.max(...allCoeffs.map(Math.abs), 0.01);

                const toX = (lambda: number) => padLeft + lambda * chartW;
                const toY = (coeff: number) => padTop + chartH / 2 - (coeff / maxAbs) * (chartH / 2 - 10);

                // Grid lines
                const gridLines = [];
                for (let i = 0; i <= 4; i++) {
                  const y = padTop + (i / 4) * chartH;
                  const val = maxAbs - (i / 2) * maxAbs;
                  gridLines.push(
                    <g key={`rpg-${i}`}>
                      <line x1={padLeft} y1={y} x2={rpChartW - padRight} y2={y} stroke="#E5E7EB" strokeWidth={1} />
                      <text x={padLeft - 4} y={y + 3} fontSize={8} fill="#9CA3AF" textAnchor="end">{val.toFixed(1)}</text>
                    </g>
                  );
                }

                // X-axis labels
                for (let i = 0; i <= 4; i++) {
                  const lambda = i / 4;
                  const x = toX(lambda);
                  gridLines.push(
                    <text key={`rpxl-${i}`} x={x} y={rpChartH - 8} fontSize={8} fill="#9CA3AF" textAnchor="middle">{lambda.toFixed(2)}</text>
                  );
                }

                // Current lambda marker
                const currentX = toX(lambda);

                // Draw paths for each coefficient
                const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'];
                const pathElements = regularizationPath.paths[0].map((_, coeffIdx) => {
                  const points = regularizationPath.lambdas.map((lam, stepIdx) => {
                    return `${toX(lam)},${toY(regularizationPath.paths[stepIdx][coeffIdx])}`;
                  }).join(' ');
                  return (
                    <polyline key={`rp-path-${coeffIdx}`} points={points}
                      fill="none" stroke={colors[coeffIdx % colors.length]} strokeWidth={1.5} opacity={0.8} />
                  );
                });

                return (
                  <>
                    {gridLines}
                    {/* Zero line */}
                    <line x1={padLeft} y1={toY(0)} x2={rpChartW - padRight} y2={toY(0)} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4,2" />
                    {/* Current lambda marker */}
                    <line x1={currentX} y1={padTop} x2={currentX} y2={padTop + chartH}
                      stroke="#6366F1" strokeWidth={2} strokeDasharray="4,2" opacity={0.7} />
                    {pathElements}
                    {/* Legend */}
                    {coeffLabels.slice(0, Math.min(6, degree + 1)).map((label, i) => (
                      <g key={`rpleg-${i}`}>
                        <line x1={padLeft + 10 + i * 60} y1={12} x2={padLeft + 25 + i * 60} y2={12}
                          stroke={colors[i % colors.length]} strokeWidth={2} />
                        <text x={padLeft + 28 + i * 60} y={15} fontSize={8} fill="#6B7280">{label}</text>
                      </g>
                    ))}
                    {/* Axis labels */}
                    <text x={rpChartW / 2} y={rpChartH - 2} fontSize={9} fill="#6B7280" textAnchor="middle">λ (regularization strength)</text>
                    <text x={8} y={rpChartH / 2} fontSize={9} fill="#6B7280" textAnchor="middle" transform={`rotate(-90, 8, ${rpChartH / 2})`}>Weight Value</text>
                  </>
                );
              })()}
            </svg>
          )}
        </div>
      )}

      {/* Cross-Validation Scores */}
      {!trainingMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cross-Validation</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Test loss across {cvFoldCount} folds — lower is better</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 dark:text-gray-400">Folds:</label>
              <select
                value={cvFoldCount}
                onChange={e => setCvFoldCount(parseInt(e.target.value))}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
              >
                {[3, 5, 10].map(n => (
                  <option key={n} value={n}>{n} folds</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showCrossValidation}
                  onChange={() => setShowCrossValidation(!showCrossValidation)}
                  className="rounded w-3 h-3" />
                Show CV
              </label>
            </div>
          </div>

          {showCrossValidation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fold Scores Bar Chart */}
              <div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-medium">Per-Fold Test MSE</div>
                <svg viewBox={`0 0 ${cvChartW} ${cvChartH}`} className="w-full">
                  <rect x={0} y={0} width={cvChartW} height={cvChartH} fill="rgb(243 244 246)" rx="6" />
                  {(() => {
                    const padLeft = 40;
                    const padRight = 10;
                    const padTop = 20;
                    const padBottom = 30;
                    const chartW = cvChartW - padLeft - padRight;
                    const chartH = cvChartH - padTop - padBottom;

                    const maxScore = Math.max(...cvScores.foldScores, 0.01);
                    const barW = Math.max(10, (chartW - (cvFoldCount - 1) * 5) / cvFoldCount);

                    return (
                      <>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                          const y = padTop + (1 - frac) * chartH;
                          const val = frac * maxScore;
                          return (
                            <g key={`cvgrid-${i}`}>
                              <line x1={padLeft} y1={y} x2={cvChartW - padRight} y2={y} stroke="#E5E7EB" strokeWidth={1} />
                              <text x={padLeft - 4} y={y + 3} fontSize={8} fill="#9CA3AF" textAnchor="end">{val.toFixed(3)}</text>
                            </g>
                          );
                        })}
                        {/* Bars */}
                        {cvScores.foldScores.map((score, i) => {
                          const x = padLeft + i * (barW + 5);
                          const barH = (score / maxScore) * chartH;
                          const y = padTop + chartH - barH;
                          return (
                            <g key={`cvbar-${i}`}>
                              <rect x={x} y={y} width={barW} height={barH} fill="#6366F1" rx={3} opacity={0.8} />
                              <text x={x + barW / 2} y={y - 4} fontSize={8} fill="#6B7280" textAnchor="middle">{score.toFixed(3)}</text>
                              <text x={x + barW / 2} y={cvChartH - 8} fontSize={8} fill="#9CA3AF" textAnchor="middle">F{i + 1}</text>
                            </g>
                          );
                        })}
                        {/* Mean line */}
                        {(() => {
                          const mean = cvScores.foldScores.reduce((a, b) => a + b, 0) / cvFoldCount;
                          const y = padTop + chartH - (mean / maxScore) * chartH;
                          return (
                            <line x1={padLeft} y1={y} x2={cvChartW - padRight} y2={y}
                              stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4,2" />
                          );
                        })()}
                        <text x={cvChartW / 2} y={cvChartH - 2} fontSize={9} fill="#6B7280" textAnchor="middle">Fold</text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Summary Stats */}
              <div className="space-y-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block">Mean CV Score (MSE)</span>
                  <strong className="text-indigo-700 dark:text-indigo-300 text-lg">
                    {(cvScores.foldScores.reduce((a, b) => a + b, 0) / cvFoldCount).toFixed(4)}
                  </strong>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-purple-500 dark:text-purple-400 block">Std Dev</span>
                  <strong className="text-purple-700 dark:text-purple-300 text-sm">
                    {Math.sqrt(cvScores.foldScores.reduce((s, v) => s + Math.pow(v - cvScores.foldScores.reduce((a, b) => a + b, 0) / cvFoldCount, 2), 0) / cvFoldCount).toFixed(4)}
                  </strong>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                  {cvScores.foldScores.some(s => s > 0.5) ? '⚠️ High variance across folds' : '✅ Stable across folds'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feature Importance */}
      {!trainingMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Feature Importance</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4">
            Which polynomial terms contribute most to the prediction? L1 regularization zeroes out the least important features.
          </p>
          <svg viewBox={`0 0 ${fiChartW} ${fiChartH}`} className="w-full">
            <rect x={0} y={0} width={fiChartW} height={fiChartH} fill="rgb(243 244 246)" rx="6" />
            {(() => {
              const padLeft = 30;
              const padRight = 10;
              const padTop = 10;
              const padBottom = 20;
              const chartW = fiChartW - padLeft - padRight;
              const chartH = fiChartH - padTop - padBottom;

              const maxMag = Math.max(...featureImportance.map(f => f.magnitude), 0.01);
              const barH = Math.max(4, (chartH - (featureImportance.length - 1) * 3) / featureImportance.length);

              return (
                <>
                  {featureImportance.slice(0, Math.min(10, degree + 1)).map((feat, i) => {
                    const y = padTop + i * (barH + 3);
                    const barW = (feat.magnitude / maxMag) * chartW;
                    const isZero = feat.magnitude < 0.001;
                    return (
                      <g key={`fi-${i}`}>
                        <rect x={padLeft} y={y} width={barW} height={barH}
                          fill={isZero ? '#D1D5DB' : feat.value > 0 ? '#3B82F6' : '#EF4444'}
                          rx={2} opacity={isZero ? 0.4 : 0.8} />
                        <text x={padLeft - 4} y={y + barH / 2 + 3} fontSize={8} fill="#6B7280" textAnchor="end">
                          {coeffLabels[feat.index]}
                        </text>
                        <text x={padLeft + barW + 4} y={y + barH / 2 + 3} fontSize={8} fill="#6B7280">
                          {feat.value.toFixed(3)}
                        </text>
                      </g>
                    );
                  })}
                  <text x={fiChartW / 2} y={fiChartH - 4} fontSize={9} fill="#6B7280" textAnchor="middle">|Weight| (magnitude)</text>
                </>
              );
            })()}
          </svg>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 bg-blue-500 rounded" />
              <span className="text-gray-500">Positive</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 bg-red-500 rounded" />
              <span className="text-gray-500">Negative</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 bg-gray-300 rounded" />
              <span className="text-gray-500">Zero (selected out)</span>
            </span>
          </div>
        </div>
      )}

      {/* ─── Educational ───────────────────────────────────────────────────── */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Advanced Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-700 dark:text-blue-400">
          <div>
            <strong className="block mb-1">Regularization Path</strong>
            <p>Shows how each weight coefficient changes as λ increases. Watch L1 (Lasso) zero out features abruptly while L2 (Ridge) shrinks them smoothly toward zero.</p>
            <p className="mt-1 text-[10px] text-blue-500">λ controls the trade-off: fit data vs. simple model</p>
          </div>
          <div>
            <strong className="block mb-1">Cross-Validation</strong>
            <p>Splits data into K folds, trains on K-1, tests on 1. Reveals how well the model generalizes to unseen data across different subsets.</p>
            <p className="mt-1 text-[10px] text-blue-500">Low variance across folds = stable model</p>
          </div>
          <div>
            <strong className="block mb-1">Feature Importance</strong>
            <p>Ranks which polynomial terms (x, x², x³, ...) contribute most. Large weights indicate important features. L1 regularization performs automatic feature selection.</p>
            <p className="mt-1 text-[10px] text-blue-500">Zero weight = feature selected out</p>
          </div>
        </div>
      </div>

      {/* ─── AI/ML Analogy ─────────────────────────────────────────────────── */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Overfitting</span>
            <span>→ Like memorizing exam answers instead of understanding the subject. You ace the practice test but fail the real one.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Underfitting</span>
            <span>→ Like studying only chapter summaries — you miss the details and can&apos;t answer any question well.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Gradient Descent</span>
            <span>→ Like walking downhill in fog — you take small steps in the steepest direction until you reach the valley.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Learning Rate</span>
            <span>→ Like step size — too big and you overshoot the valley, too small and you never arrive.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Early Stopping</span>
            <span>→ Like knowing when to stop studying — more cramming after diminishing returns hurts performance.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Multi-Trial</span>
            <span>→ Like taking the same exam with different question sets. If your score varies wildly, you&apos;re memorizing, not understanding.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Regularization Path</span>
            <span>→ Like tightening a budget constraint — as you restrict spending more, you stop buying non-essential items first (features with small weights).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Cross-Validation</span>
            <span>→ Like a final exam with practice questions shuffled differently — tests if you truly understand or just memorized specific examples.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Feature Importance</span>
            <span>→ Like knowing which chapters are actually on the exam — focus your study on what matters most.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
