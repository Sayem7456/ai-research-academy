export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function identityMatrix(size: number): number[][] {
  return Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => (i === j ? 1 : 0))
  );
}

export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;
  const result: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      for (let k = 0; k < inner; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

export function applyCausalMask(matrix: number[][]): number[][] {
  return matrix.map((row, i) =>
    row.map((val, j) => (j > i ? 0 : val))
  );
}

export function computeRollout(
  layers: number[][][][],
  useCausal: boolean
): number[][] {
  const numTokens = layers[0][0].length;
  let rollout = identityMatrix(numTokens);

  for (let l = 0; l < layers.length; l++) {
    const layerHeads = layers[l] as number[][][];
    const avgHead = averageMatrices(layerHeads);
    const masked = useCausal ? applyCausalMask(avgHead) : avgHead;
    const effective = addScaledIdentity(masked, 0.5);
    rollout = multiplyMatrices(effective, rollout);
  }

  return rollout;
}

function averageMatrices(matrices: number[][][]): number[][] {
  const n = matrices[0].length;
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const m of matrices) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result[i][j] += m[i][j] / matrices.length;
      }
    }
  }
  return result;
}

function addScaledIdentity(matrix: number[][], scale: number): number[][] {
  return matrix.map((row, i) =>
    row.map((val, j) => val * (1 - scale) + (i === j ? scale : 0))
  );
}
