'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

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

const DIM_LABELS = ['Gender', 'Royalty', 'Nobility', 'Animal', 'Emotion'];

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
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

  const toggleWord = (word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Embedding Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Word embeddings map tokens to dense vectors where similar words are close in the vector space.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Select Words</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(VOCABULARY).map((word) => (
              <button
                key={word}
                onClick={() => toggleWord(word)}
                onMouseEnter={() => setHoveredWord(word)}
                onMouseLeave={() => setHoveredWord(null)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedWords.includes(word)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm mb-3">Embedding Vectors</h3>
            <div className="space-y-3">
              {selectedWords.map((word) => {
                const vec = VOCABULARY[word];
                if (!vec) return null;
                const isHovered = hoveredWord === word;
                return (
                  <motion.div
                    key={word}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
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
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Cosine Similarities</h3>
            <div className="space-y-2">
              {similarities.map((pair, i) => (
                <motion.div
                  key={`${pair.word1}-${pair.word2}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <span className="font-mono text-sm min-w-[100px]">
                    {pair.word1} ↔ {pair.word2}
                  </span>
                  <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pair.similarity * 100}%` }}
                      className={`h-full rounded-full ${
                        pair.similarity > 0.9 ? 'bg-green-500' : pair.similarity > 0.7 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
                    {pair.similarity.toFixed(3)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
          <h3 className="font-semibold text-sm mb-2">Key Insight: king - man + woman ≈ queen</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300">
            Word embeddings capture analogical relationships. The vector arithmetic works because
            embeddings encode semantic properties (gender, royalty, etc.) as directions in the vector space.
          </p>
        </div>
      </div>
    </div>
  );
}
