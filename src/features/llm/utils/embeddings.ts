// Embedding utility functions

/** Compute cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Vector subtraction: a - b */
export function vectorSubtract(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

/** Vector addition: a + b */
export function vectorAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

/** Find the k nearest neighbors by cosine similarity */
export function nearestNeighbors(
  query: number[],
  vectors: { word: string; vector: number[]; category: string }[],
  k: number
): { word: string; similarity: number; category: string }[] {
  return vectors
    .map((v) => ({
      word: v.word,
      similarity: cosineSimilarity(query, v.vector),
      category: v.category,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

/** Solve an analogy: a is to b as c is to ? */
export function solveAnalogy(
  a: number[],
  b: number[],
  c: number[],
  vocabulary: { word: string; vector: number[] }[],
  exclude: string[]
): { word: string; similarity: number }[] {
  // a - b + c ≈ ?
  const target = vectorAdd(vectorSubtract(a, b), c);
  return vocabulary
    .filter((v) => !exclude.includes(v.word))
    .map((v) => ({
      word: v.word,
      similarity: cosineSimilarity(target, v.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/** Get the top N words for a given dimension */
export function topWordsForDimension(
  dimension: number,
  vocabulary: { word: string; vector: number[]; category: string }[],
  topN: number
): { word: string; value: number; category: string }[] {
  return vocabulary
    .map((v) => ({
      word: v.word,
      value: v.vector[dimension],
      category: v.category,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

/** Category colors for the scatter plot */
export const CATEGORY_COLORS: Record<string, string> = {
  royalty: '#8b5cf6',
  people: '#3b82f6',
  animals: '#22c55e',
  countries: '#f59e0b',
  cities: '#f97316',
  emotions: '#ec4899',
  technology: '#06b6d4',
  food: '#84cc16',
  colors: '#e11d48',
  actions: '#6366f1',
};

/** Category display names */
export const CATEGORY_LABELS: Record<string, string> = {
  royalty: 'Royalty',
  people: 'People',
  animals: 'Animals',
  countries: 'Countries',
  cities: 'Cities',
  emotions: 'Emotions',
  technology: 'Technology',
  food: 'Food',
  colors: 'Colors',
  actions: 'Actions',
};
