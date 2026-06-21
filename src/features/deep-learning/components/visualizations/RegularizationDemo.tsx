'use client';

import React, { useState, useMemo } from 'react';

type RegType = 'none' | 'dropout' | 'l2' | 'both';

function generateData(n: number, noise: number): Array<{ x: number; y: number }> {
  const data: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 4 - 2;
    const y = Math.sin(x * Math.PI) + (Math.random() - 0.5) * noise;
    data.push({ x, y });
  }
  return data.sort((a, b) => a.x - b.x);
}

function polyFit(data: Array<{ x: number; y: number }>, degree: number): (x: number) => number {
  const n = data.length;
  const X: number[][] = [];
  const Y: number[] = [];
  for (const d of data) {
    const row: number[] = [];
    for (let p = 0; p <= degree; p++) row.push(Math.pow(d.x, p));
    X.push(row);
    Y.push(d.y);
  }
  const Xt = X[0].map((_, i) => X.map(r => r[i]));
  const XtX = Xt.map(r => X[0].map((_, j) => r.reduce((s, v, k) => s + v * X[k][j], 0)));
  const XtY = Xt.map(r => r.reduce((s, v, k) => s + v * Y[k], 0));

  for (let i = 0; i <= degree; i++) {
    let maxRow = i;
    for (let k = i + 1; k <= degree; k++) if (Math.abs(XtX[k][i]) > Math.abs(XtX[maxRow][i])) maxRow = k;
    [XtX[i], XtX[maxRow]] = [XtX[maxRow], XtX[i]];
    [XtY[i], XtY[maxRow]] = [XtY[maxRow], XtY[i]];
    for (let k = i + 1; k <= degree; k++) {
      const factor = XtX[k][i] / XtX[i][i];
      for (let j = i; j <= degree; j++) XtX[k][j] -= factor * XtX[i][j];
      XtY[k] -= factor * XtY[i];
    }
  }
  const coeffs = new Array(degree + 1).fill(0);
  for (let i = degree; i >= 0; i--) {
    coeffs[i] = XtY[i];
    for (let j = i + 1; j <= degree; j++) coeffs[i] -= XtX[i][j] * coeffs[j];
    coeffs[i] /= XtX[i][i];
  }
  return (x: number) => coeffs.reduce((s, c, p) => s + c * Math.pow(x, p), 0);
}

export default function RegularizationDemo() {
  const [regType, setRegType] = useState<RegType>('none');
  const [dropoutRate, setDropoutRate] = useState(0.3);
  const [l2Lambda, setL2Lambda] = useState(0.1);
  const [data] = useState(() => generateData(20, 0.8));

  const trainData = data.slice(0, 14);
  const testData = data.slice(14);

  const trainFit = useMemo(() => {
    let filtered = trainData;
    if (regType === 'dropout') {
      filtered = trainData.filter(() => Math.random() > dropoutRate);
    }
    let d = filtered;
    if (regType === 'l2' || regType === 'both') {
      const augmented = [...d];
      for (let i = 0; i < Math.floor(l2Lambda * 5); i++) {
        augmented.push({ x: (Math.random() - 0.5) * 8, y: 0 });
      }
      d = augmented;
    }
    return polyFit(d, 8);
  }, [trainData, regType, dropoutRate, l2Lambda]);

  const svgW = 500;
  const svgH = 300;
  const xMin = -2.5, xMax = 2.5, yMin = -2.5, yMax = 2.5;
  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * svgW;
  const toSvgY = (y: number) => ((yMax - y) / (yMax - yMin)) * svgH;

  const trainLoss = trainData.reduce((s, d) => s + Math.pow(d.y - trainFit(d.x), 2), 0) / trainData.length;
  const testLoss = testData.reduce((s, d) => s + Math.pow(d.y - trainFit(d.x), 2), 0) / testData.length;

  const curvePoints = Array.from({ length: 200 }, (_, i) => {
    const x = xMin + (i / 199) * (xMax - xMin);
    return `${toSvgX(x)},${toSvgY(trainFit(x))}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Regularization Demo</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        See how regularization prevents overfitting. The model (8th degree polynomial) can easily memorize training data — regularization forces it to generalize.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Fit Visualization</h3>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <rect width={svgW} height={svgH} fill="rgb(243 244 246)" rx="8" />
            <line x1={toSvgX(0)} y1={0} x2={toSvgX(0)} y2={svgH} stroke="#D1D5DB" strokeWidth={1} />
            <line x1={0} y1={toSvgY(0)} x2={svgW} y2={toSvgY(0)} stroke="#D1D5DB" strokeWidth={1} />

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
          </svg>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Regularization</h3>
            <div className="space-y-2">
              {(['none', 'dropout', 'l2', 'both'] as RegType[]).map(type => (
                <button key={type} onClick={() => setRegType(type)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${regType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {type === 'none' && 'No Regularization'}
                  {type === 'dropout' && `Data Subsampling (${(dropoutRate * 100).toFixed(0)}%)`}
                  {type === 'l2' && `L2-like Smoothing (${l2Lambda.toFixed(2)})`}
                  {type === 'both' && 'Dropout + L2'}
                </button>
              ))}
            </div>
          </div>

          {(regType === 'dropout' || regType === 'both') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Dropout Rate</span><strong>{(dropoutRate * 100).toFixed(0)}%</strong>
              </label>
              <input type="range" min="0" max="0.8" step="0.1" value={dropoutRate} onChange={(e) => setDropoutRate(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </div>
          )}

          {(regType === 'l2' || regType === 'both') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>L2 Lambda</span><strong>{l2Lambda.toFixed(2)}</strong>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={l2Lambda} onChange={(e) => setL2Lambda(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
            </div>
          )}

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

      {/* Educational */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Regularization Techniques</h4>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          <strong>Data Subsampling</strong>: Randomly removes training points, forcing the model to be robust to missing data — an approximation of neural network dropout. <strong>L2-like Smoothing</strong>: Adds points with y=0 to pull the polynomial toward the mean, mimicking weight decay. Both prevent the model from memorizing noise in training data.
        </p>
      </div>

      {/* AI/ML Analogy */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">AI/ML Analogy</h4>
        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Overfitting</span>
            <span>→ Like memorizing exam answers instead of understanding the subject. You ace the practice test but fail the real one.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">Dropout</span>
            <span>→ Like studying with random classmates — you can't rely on any single person, so you learn the material yourself.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-300">L2 Regularization</span>
            <span>→ Like Occam's Razor — prefer the simplest explanation that fits the data.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
