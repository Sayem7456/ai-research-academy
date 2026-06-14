// Curated word embeddings for educational purposes
// 50-dimensional vectors inspired by GloVe/Word2Vec

export interface WordEmbedding {
  word: string;
  vector: number[];
  category: string;
}

// Seeded random for reproducibility
let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map((x) => x / norm) : v;
}

function seededVec(base: number[]): number[] {
  return normalize(base.map((x) => x + (seededRandom() - 0.5) * 0.03));
}

// Helper: create a 50-dim vector from a sparse definition
// pattern: array of [index, value] pairs, rest are 0
function vec50(...pairs: [number, number][]): number[] {
  const v = Array(50).fill(0);
  for (const [i, val] of pairs) v[i] = val;
  return v;
}

// Category base vectors
const GENDER_MALE_50 = vec50([0, 0.9], [1, 0.8], [2, 0.1], [3, 0.1], [4, 0.2], [5, 0.3], [6, 0.1], [7, 0.2], [8, 0.1], [9, 0.3]);
const GENDER_FEMALE_50 = vec50([0, 0.9], [1, -0.8], [2, 0.1], [3, 0.1], [4, 0.2], [5, 0.3], [6, 0.1], [7, 0.2], [8, 0.1], [9, 0.3]);
const ROYALTY_50 = vec50([0, 0.7], [1, 0.1], [2, 0.8], [3, 0.2], [4, 0.1], [5, 0.2], [6, 0.3], [7, 0.1], [8, 0.2], [9, 0.1]);
const ANIMAL_50 = vec50([10, 0.9], [11, 0.8], [12, 0.7], [13, 0.6], [14, 0.5], [15, 0.4], [16, 0.3], [17, 0.2], [18, 0.1], [19, 0.1]);
const COUNTRY_50 = vec50([20, 0.9], [21, 0.8], [22, 0.7], [23, 0.6], [24, 0.5], [25, 0.4], [26, 0.3], [27, 0.2], [28, 0.1], [29, 0.1]);
const CITY_50 = vec50([20, 0.8], [21, 0.7], [22, 0.9], [23, 0.5], [24, 0.4], [25, 0.6], [26, 0.3], [27, 0.2], [28, 0.1], [29, 0.1]);
const EMOTION_50 = vec50([40, 0.9], [41, 0.8], [42, 0.7], [43, 0.6], [44, 0.5], [45, 0.4], [46, 0.3], [47, 0.2], [48, 0.1], [49, 0.1]);
const TECH_50 = vec50([30, 0.9], [31, 0.8], [32, 0.7], [33, 0.6], [34, 0.5], [35, 0.4], [36, 0.3], [37, 0.2], [38, 0.1], [39, 0.1]);
const FOOD_50 = vec50([30, 0.5], [31, 0.6], [32, 0.7], [33, 0.8], [34, 0.9], [35, 0.4], [36, 0.3], [37, 0.2], [38, 0.1], [39, 0.1]);

function merge(a: number[], b: number[], aW = 1, bW = 1): number[] {
  return a.map((v, i) => v * aW + b[i] * bW);
}

export const VOCABULARY: WordEmbedding[] = [
  // ROYALTY
  { word: 'king', vector: seededVec(merge(ROYALTY_50, GENDER_MALE_50)), category: 'royalty' },
  { word: 'queen', vector: seededVec(merge(ROYALTY_50, GENDER_FEMALE_50)), category: 'royalty' },
  { word: 'prince', vector: seededVec(merge(ROYALTY_50, GENDER_MALE_50, 0.9, 0.8)), category: 'royalty' },
  { word: 'princess', vector: seededVec(merge(ROYALTY_50, GENDER_FEMALE_50, 0.9, 0.8)), category: 'royalty' },

  // PEOPLE
  { word: 'man', vector: seededVec(GENDER_MALE_50), category: 'people' },
  { word: 'woman', vector: seededVec(GENDER_FEMALE_50), category: 'people' },
  { word: 'boy', vector: seededVec(merge(GENDER_MALE_50, vec50([30, 0.7], [31, 0.6], [32, 0.5], [33, 0.4], [34, 0.3]), 0.8)), category: 'people' },
  { word: 'girl', vector: seededVec(merge(GENDER_FEMALE_50, vec50([30, 0.7], [31, 0.6], [32, 0.5], [33, 0.4], [34, 0.3]), 0.8)), category: 'people' },
  { word: 'father', vector: seededVec(merge(GENDER_MALE_50, vec50([10, 0.3]), 0.9)), category: 'people' },
  { word: 'mother', vector: seededVec(merge(GENDER_FEMALE_50, vec50([10, 0.3]), 0.9)), category: 'people' },
  { word: 'husband', vector: seededVec(merge(GENDER_MALE_50, vec50([10, 0.1]), 0.85)), category: 'people' },
  { word: 'wife', vector: seededVec(merge(GENDER_FEMALE_50, vec50([10, 0.1]), 0.85)), category: 'people' },

  // ANIMALS
  { word: 'cat', vector: seededVec(ANIMAL_50), category: 'animals' },
  { word: 'dog', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.05]), 0.95, 0.9)), category: 'animals' },
  { word: 'lion', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.1]), 0.9, 1.1)), category: 'animals' },
  { word: 'tiger', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.05]), 0.9, 1.05)), category: 'animals' },
  { word: 'bird', vector: seededVec(merge(ANIMAL_50, vec50([15, 0.6], [16, 0.5], [17, 0.4]), 0.7)), category: 'animals' },
  { word: 'fish', vector: seededVec(merge(ANIMAL_50, vec50([15, 0.4], [16, 0.3], [17, 0.5]), 0.6)), category: 'animals' },
  { word: 'horse', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.05]), 0.85)), category: 'animals' },
  { word: 'elephant', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.15]), 0.8, 1.15)), category: 'animals' },
  { word: 'monkey', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.1]), 0.9, 0.85)), category: 'animals' },
  { word: 'rabbit', vector: seededVec(merge(ANIMAL_50, vec50([10, 0.05]), 0.85, 0.75)), category: 'animals' },

  // COUNTRIES
  { word: 'france', vector: seededVec(COUNTRY_50), category: 'countries' },
  { word: 'germany', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.05]), 0.95, 0.9)), category: 'countries' },
  { word: 'japan', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.1]), 0.9, 1.1)), category: 'countries' },
  { word: 'china', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.1]), 0.9, 1.05)), category: 'countries' },
  { word: 'india', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.05]), 0.85)), category: 'countries' },
  { word: 'brazil', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.05]), 0.85, 0.95)), category: 'countries' },
  { word: 'italy', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.02]), 0.92)), category: 'countries' },
  { word: 'spain', vector: seededVec(merge(COUNTRY_50, vec50([20, 0.02]), 0.9)), category: 'countries' },

  // CITIES
  { word: 'paris', vector: seededVec(CITY_50), category: 'cities' },
  { word: 'london', vector: seededVec(merge(CITY_50, vec50([20, 0.05]), 0.95, 0.9)), category: 'cities' },
  { word: 'tokyo', vector: seededVec(merge(CITY_50, vec50([20, 0.1]), 0.9, 1.1)), category: 'cities' },
  { word: 'beijing', vector: seededVec(merge(CITY_50, vec50([20, 0.1]), 0.9, 1.05)), category: 'cities' },
  { word: 'new york', vector: seededVec(merge(CITY_50, vec50([20, 0.05]), 0.85, 0.95)), category: 'cities' },
  { word: 'berlin', vector: seededVec(merge(CITY_50, vec50([20, 0.02]), 0.92, 0.88)), category: 'cities' },

  // EMOTIONS
  { word: 'happy', vector: seededVec(EMOTION_50), category: 'emotions' },
  { word: 'sad', vector: seededVec(merge(EMOTION_50, vec50([40, 0.1]), 0.9)), category: 'emotions' },
  { word: 'angry', vector: seededVec(merge(EMOTION_50, vec50([40, 0.2]), 0.7, 1.1)), category: 'emotions' },
  { word: 'fearful', vector: seededVec(merge(EMOTION_50, vec50([40, 0.15]), 0.75, 1.05)), category: 'emotions' },
  { word: 'love', vector: seededVec(merge(EMOTION_50, vec50([40, 0.3]), 0.6, 1.2)), category: 'emotions' },
  { word: 'hate', vector: seededVec(merge(EMOTION_50, vec50([40, 0.25]), 0.65, 1.15)), category: 'emotions' },
  { word: 'joy', vector: seededVec(merge(EMOTION_50, vec50([40, 0.2]), 0.7, 1.1)), category: 'emotions' },
  { word: 'anger', vector: seededVec(merge(EMOTION_50, vec50([40, 0.22]), 0.72, 1.12)), category: 'emotions' },

  // TECHNOLOGY
  { word: 'computer', vector: seededVec(TECH_50), category: 'technology' },
  { word: 'phone', vector: seededVec(merge(TECH_50, vec50([30, 0.05]), 0.95, 0.9)), category: 'technology' },
  { word: 'software', vector: seededVec(merge(TECH_50, vec50([30, 0.1]), 0.9, 1.1)), category: 'technology' },
  { word: 'internet', vector: seededVec(merge(TECH_50, vec50([30, 0.1]), 0.85, 1.05)), category: 'technology' },
  { word: 'robot', vector: seededVec(merge(TECH_50, vec50([30, 0.05]), 0.88, 0.95)), category: 'technology' },
  { word: 'algorithm', vector: seededVec(merge(TECH_50, vec50([30, 0.1]), 0.82, 1.08)), category: 'technology' },
  { word: 'data', vector: seededVec(merge(TECH_50, vec50([30, 0.05]), 0.8, 1.02)), category: 'technology' },
  { word: 'network', vector: seededVec(merge(TECH_50, vec50([30, 0.05]), 0.83, 0.98)), category: 'technology' },

  // FOOD
  { word: 'apple', vector: seededVec(FOOD_50), category: 'food' },
  { word: 'bread', vector: seededVec(merge(FOOD_50, vec50([30, 0.05]), 0.95, 0.9)), category: 'food' },
  { word: 'rice', vector: seededVec(merge(FOOD_50, vec50([30, 0.05]), 0.9, 0.85)), category: 'food' },
  { word: 'chicken', vector: seededVec(merge(FOOD_50, vec50([30, 0.05]), 0.88, 0.92)), category: 'food' },
  { word: 'banana', vector: seededVec(merge(FOOD_50, vec50([30, 0.05]), 0.92, 0.87)), category: 'food' },
  { word: 'coffee', vector: seededVec(merge(FOOD_50, vec50([30, 0.05]), 0.87, 0.93)), category: 'food' },
  { word: 'water', vector: seededVec(merge(FOOD_50, vec50([30, 0.05]), 0.82, 0.85)), category: 'food' },

  // COLORS
  { word: 'red', vector: seededVec(vec50([30, 0.9], [31, 0.8], [32, 0.7], [33, 0.6], [34, 0.5], [35, 0.4], [36, 0.3], [37, 0.2], [38, 0.1], [39, 0.1])), category: 'colors' },
  { word: 'blue', vector: seededVec(vec50([30, 0.85], [31, 0.75], [32, 0.65], [33, 0.55], [34, 0.45], [35, 0.35], [36, 0.25], [37, 0.15], [38, 0.1], [39, 0.1])), category: 'colors' },
  { word: 'green', vector: seededVec(vec50([30, 0.8], [31, 0.7], [32, 0.6], [33, 0.5], [34, 0.4], [35, 0.3], [36, 0.2], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'colors' },
  { word: 'yellow', vector: seededVec(vec50([30, 0.75], [31, 0.65], [32, 0.55], [33, 0.45], [34, 0.35], [35, 0.25], [36, 0.15], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'colors' },
  { word: 'black', vector: seededVec(vec50([30, 0.7], [31, 0.6], [32, 0.5], [33, 0.4], [34, 0.3], [35, 0.2], [36, 0.1], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'colors' },
  { word: 'white', vector: seededVec(vec50([30, 0.65], [31, 0.55], [32, 0.45], [33, 0.35], [34, 0.25], [35, 0.15], [36, 0.1], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'colors' },

  // ACTIONS
  { word: 'run', vector: seededVec(vec50([10, 0.5], [11, 0.4], [12, 0.3], [13, 0.2], [14, 0.1], [30, 0.9], [31, 0.8], [32, 0.7], [33, 0.6], [34, 0.5], [35, 0.4], [36, 0.3], [37, 0.2], [38, 0.1], [39, 0.1])), category: 'actions' },
  { word: 'walk', vector: seededVec(vec50([10, 0.45], [11, 0.35], [12, 0.25], [13, 0.15], [14, 0.1], [30, 0.85], [31, 0.75], [32, 0.65], [33, 0.55], [34, 0.45], [35, 0.35], [36, 0.25], [37, 0.15], [38, 0.1], [39, 0.1])), category: 'actions' },
  { word: 'jump', vector: seededVec(vec50([10, 0.4], [11, 0.3], [12, 0.2], [13, 0.1], [14, 0.1], [30, 0.8], [31, 0.7], [32, 0.6], [33, 0.5], [34, 0.4], [35, 0.3], [36, 0.2], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'actions' },
  { word: 'swim', vector: seededVec(vec50([10, 0.5], [11, 0.4], [12, 0.3], [13, 0.2], [14, 0.1], [30, 0.75], [31, 0.65], [32, 0.55], [33, 0.45], [34, 0.35], [35, 0.25], [36, 0.15], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'actions' },
  { word: 'fly', vector: seededVec(vec50([10, 0.35], [11, 0.25], [12, 0.15], [13, 0.1], [14, 0.1], [30, 0.7], [31, 0.6], [32, 0.5], [33, 0.4], [34, 0.3], [35, 0.2], [36, 0.1], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'actions' },
  { word: 'eat', vector: seededVec(vec50([10, 0.4], [11, 0.3], [12, 0.2], [13, 0.1], [14, 0.1], [30, 0.6], [31, 0.5], [32, 0.4], [33, 0.3], [34, 0.2], [35, 0.1], [36, 0.1], [37, 0.1], [38, 0.1], [39, 0.1])), category: 'actions' },
];

// Deduplicate by word (keep first occurrence)
const seen = new Set<string>();
export const DEDUPED_VOCABULARY = VOCABULARY.filter((e) => {
  if (seen.has(e.word)) return false;
  seen.add(e.word);
  return true;
});

// Get all unique categories
export const CATEGORIES = [...new Set(DEDUPED_VOCABULARY.map((e) => e.category))];

// Lookup map for fast access
export const EMBEDDING_MAP = new Map<string, WordEmbedding>(
  DEDUPED_VOCABULARY.map((e) => [e.word, e])
);

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
