export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

export function projectTo2D(vectors: number[][]): { x: number; y: number }[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;

  let maxVar = 0;
  let bestI = 0;
  let bestJ = 1;
  for (let i = 0; i < dim; i++) {
    for (let j = i + 1; j < dim; j++) {
      const meanI = vectors.reduce((s, v) => s + v[i], 0) / vectors.length;
      const meanJ = vectors.reduce((s, v) => s + v[j], 0) / vectors.length;
      const varI = vectors.reduce((s, v) => s + (v[i] - meanI) ** 2, 0) / vectors.length;
      const varJ = vectors.reduce((s, v) => s + (v[j] - meanJ) ** 2, 0) / vectors.length;
      const spread = varI + varJ;
      if (spread > maxVar) {
        maxVar = spread;
        bestI = i;
        bestJ = j;
      }
    }
  }

  return vectors.map((v) => ({ x: v[bestI], y: v[bestJ] }));
}

export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function matMul(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}
