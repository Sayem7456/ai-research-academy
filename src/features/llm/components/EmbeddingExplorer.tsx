'use client';

import React, { useState, useMemo } from 'react';

const VOCABULARY: Record<string, number[]> = {
  'king': [0.8, 0.2, 0.9, 0.1, 0.7],
  'queen': [0.8, 0.9, 0.85, 0.1, 0.75],
  'man': [0.7, 0.1, 0.2, 0.15, 0.6],
  'woman': [0.7, 0.85, 0.15, 0.15, 0.65],
  'cat': [0.1, 0.1, 0.05, 0.9, 0.3],
  'dog': [0.15, 0.1, 0.05, 0.85, 0.35],
  'big': [0.2, 0.2, 0.3, 0.4, 0.1],
  'small': [0.2, 0.2, 0.3, 0.35, 0.15],
  'happy': [0.5, 0.7, 0.4, 0.3, 0.8],
  'sad': [0.5, 0.3, 0.4, 0.3, 0.2],
};

const DIM_LABELS = ['Dim 1', 'Dim 2', 'Dim 3', 'Dim 4', 'Dim 5'];
const MAX_WORDS = 6;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function vectorSubtract(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

function vectorAdd(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

export default function EmbeddingExplorer() {
  const [selectedWords, setSelectedWords] = useState<string[]>(['king', 'queen', 'man', 'woman']);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const similarities = useMemo(() => {
    const pairs: { word1: string; word2: string; similarity: number }[] = [];
    for (let i = 0; i < selectedWords.length; i++) {
      for (let j = i + 1; j < selectedWords.length; j++) {
        const a = VOCABULARY[selectedWords[i]];
        const b = VOCABULARY[selectedWords[j]];
        if (a && b) {
          pairs.push({
            word1: selectedWords[i],
            word2: selectedWords[j],
            similarity: cosineSimilarity(a, b),
          });
        }
      }
    }
    return pairs.sort((a, b) => b.similarity - a.similarity);
  }, [selectedWords]);

  const analogy = useMemo(() => {
    const king = VOCABULARY['king'];
    const man = VOCABULARY['man'];
    const woman = VOCABULARY['woman'];
    const queen = VOCABULARY['queen'];
    if (!king || !man || !woman || !queen) return null;
    const result = vectorAdd(vectorSubtract(king, man), woman);
    const similarity = cosineSimilarity(result, queen);
    return { result, similarity };
  }, []);

  const toggleWord = (word: string) => {
    setSelectedWords((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= MAX_WORDS) return prev;
      return [...prev, word];
    });
  };

  const isAtLimit = selectedWords.length >= MAX_WORDS;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Embedding Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Word embeddings map tokens to dense vectors where similar words are close in the vector space.
          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-1">
            This demo uses 5 synthetic dimensions for illustration. Real embeddings have hundreds of dimensions
            that are not human-interpretable.
          </span>
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Select Words</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedWords.length}/{MAX_WORDS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(VOCABULARY).map((word) => {
              const isSelected = selectedWords.includes(word);
              const isDisabled = !isSelected && isAtLimit;
              return (
                <button
                  key={word}
                  onClick={() => toggleWord(word)}
                  onMouseEnter={() => !isDisabled && setHoveredWord(word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isDisabled
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Embedding Vectors</h3>
              <div className="flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-green-500"></span> High (&gt;0.6)</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-yellow-500"></span> Mid (&gt;0.3)</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-red-500"></span> Low</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
              Each bar shows the vector component value for that dimension. Taller bars mean the word has a stronger association with that dimension.
            </p>
            <div className="space-y-3">
              {selectedWords.map((word) => {
                const vec = VOCABULARY[word];
                if (!vec) return null;
                const isHovered = hoveredWord === word;
                return (
                  <div
                    key={word}
                    className={`p-3 rounded-lg border transition-colors ${
                      isHovered
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold">{word}</span>
                      <span className="text-xs text-gray-500">dim={vec.length}</span>
                    </div>
                    <div className="flex gap-1">
                      {vec.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded"
                            style={{
                              height: `${Math.max(4, v * 40)}px`,
                              backgroundColor: v > 0.6 ? '#22c55e' : v > 0.3 ? '#eab308' : '#ef4444',
                            }}
                          />
                          <span className="text-[9px] text-gray-500 dark:text-gray-400">
                            {DIM_LABELS[i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Cosine Similarities</h3>
              <div className="flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-green-500"></span> &gt;0.9</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-blue-500"></span> &gt;0.7</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded bg-gray-400"></span> ≤0.7</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
              Measures the angle between two vectors (0 = opposite, 1 = identical). Words with higher similarity are closer in meaning.
            </p>
            <div className="space-y-2">
              {similarities.map((pair, i) => (
                <div
                  key={`${pair.word1}-${pair.word2}`}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <span className="font-mono text-sm min-w-[100px]">
                    {pair.word1} ↔ {pair.word2}
                  </span>
                  <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pair.similarity * 100}%` }}
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        pair.similarity > 0.9 ? 'bg-green-500' : pair.similarity > 0.7 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
                    {pair.similarity.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
          <h3 className="font-semibold text-sm mb-2">Vector Arithmetic: king − man + woman ≈ queen</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
            Word embeddings capture analogical relationships through vector arithmetic.
            Subtracting the "man" direction and adding "woman" should yield something close to "queen".
          </p>
          {analogy && (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1 text-center">
                {DIM_LABELS.map((label, i) => (
                  <div key={i} className="text-[9px] text-gray-500 dark:text-gray-400">{label}</div>
                ))}
              </div>
              <div className="font-mono text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-36">king</span>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {VOCABULARY['king'].map((v, i) => (
                      <span key={i} className="text-center">{v.toFixed(2)}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-36">− man</span>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {VOCABULARY['man'].map((v, i) => (
                      <span key={i} className="text-center text-red-500">−{v.toFixed(2)}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-36">+ woman</span>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {VOCABULARY['woman'].map((v, i) => (
                      <span key={i} className="text-center text-green-500">+{v.toFixed(2)}</span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-1 flex items-center gap-2">
                  <span className="text-gray-500 w-36">= result</span>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {analogy.result.map((v, i) => (
                      <span key={i} className="text-center font-semibold">{v.toFixed(2)}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-36">queen (actual)</span>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {VOCABULARY['queen'].map((v, i) => (
                      <span key={i} className="text-center">{v.toFixed(2)}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mt-2">
                <span className="text-gray-600 dark:text-gray-400">Cosine similarity (result ↔ queen):</span>
                <span className={`font-mono font-semibold ${
                  analogy.similarity > 0.9 ? 'text-green-600 dark:text-green-400' :
                  analogy.similarity > 0.7 ? 'text-blue-600 dark:text-blue-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {analogy.similarity.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
