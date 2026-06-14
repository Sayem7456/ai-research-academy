export const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat'];

export interface HeadPattern {
  weights: number[][];
  label: string;
  color: string;
}

export interface LayerPatterns {
  heads: HeadPattern[];
}

const HEAD_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const HEAD_LABELS = [
  'Positional Adjacency',
  'Subject → Verb',
  'Determiner → Noun',
  'Preposition → Object',
  'Long-range Reference',
  'Syntactic Dependency',
  'Semantic Similarity',
  'Self-Attention',
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function normalizeRow(row: number[]): number[] {
  const sum = row.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum === 0) return row.map(() => 1 / row.length);
  return row.map((v) => Math.max(0, v) / sum);
}

function generateHeadWeights(
  headIndex: number,
  layerIndex: number,
  baseSeed: number
): number[][] {
  const n = TOKENS.length;
  const patterns: number[][] = [];

  for (let q = 0; q < n; q++) {
    const row: number[] = [];
    for (let k = 0; k < n; k++) {
      let val = seededRandom(baseSeed + q * n + k) * 0.15;

      switch (headIndex) {
        case 0:
          if (Math.abs(q - k) <= 1) val += 0.35 + seededRandom(baseSeed + q + k) * 0.2;
          break;
        case 1:
          if ((q === 0 && k === 1) || (q === 1 && k === 2) || (q === 3 && k === 5)) val += 0.5;
          break;
        case 2:
          if ((q === 0 && k === 1) || (q === 4 && k === 5)) val += 0.6;
          break;
        case 3:
          if ((q === 3 && k === 5) || (q === 2 && k === 3)) val += 0.5;
          break;
        case 4:
          if (q === 1 && k === 5) val += 0.45;
          if (q === 2 && k === 1) val += 0.4;
          break;
        case 5:
          if (q === 1 && k === 2) val += 0.45;
          if (q === 2 && k === 5) val += 0.35;
          if (q === 3 && k === 2) val += 0.3;
          break;
        case 6: {
          const semanticGroup =
            (q <= 1 && k <= 1) || (q >= 4 && k >= 4) || (q === 2 && k === 2);
          if (semanticGroup) val += 0.35;
          break;
        }
        case 7:
          if (q === k) val += 0.6;
          break;
      }

      const layerBoost = layerIndex * 0.03;
      val += seededRandom(baseSeed + headIndex * 100 + layerIndex * 10 + q * n + k) * layerBoost;

      row.push(val);
    }
    patterns.push(normalizeRow(row));
  }

  return patterns;
}

function generateLayer(layerIndex: number, baseSeed: number): HeadPattern[] {
  return Array.from({ length: 8 }, (_, headIndex) => ({
    weights: generateHeadWeights(headIndex, layerIndex, baseSeed + headIndex * 1000 + layerIndex * 500),
    label: HEAD_LABELS[headIndex],
    color: HEAD_COLORS[headIndex],
  }));
}

export const ATTENTION_LAYERS: LayerPatterns[] = Array.from({ length: 6 }, (_, i) => ({
  heads: generateLayer(i, 42 + i * 200),
}));
