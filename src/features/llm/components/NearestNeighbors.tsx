'use client';

import React, { useState, useMemo } from 'react';
import { DEDUPED_VOCABULARY as VOCABULARY, CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '../data/embeddings';
import { cosineSimilarity, nearestNeighbors } from '../utils/embeddings';

interface Props {
  onSelectWord?: (word: string) => void;
}

export default function NearestNeighbors({ onSelectWord }: Props) {
  const [query, setQuery] = useState('king');
  const [k, setK] = useState(5);

  const results = useMemo(() => {
    const entry = VOCABULARY.find((v) => v.word === query);
    if (!entry) return [];
    return nearestNeighbors(entry.vector, VOCABULARY, k + 1).filter(
      (r) => r.word !== query
    );
  }, [query, k]);

  const queryEntry = VOCABULARY.find((v) => v.word === query);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Nearest Neighbor Search</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Find the most similar words to a query. This is how embeddings power search, recommendations, and word analogies.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Query word</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toLowerCase())}
            list="nn-words"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <datalist id="nn-words">
            {VOCABULARY.map((v) => (
              <option key={v.word} value={v.word} />
            ))}
          </datalist>
        </div>
        <div className="w-24">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Top K</label>
          <select
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {[3, 5, 8, 10].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {queryEntry && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">{query}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
              {CATEGORY_LABELS[queryEntry.category] || queryEntry.category}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            {queryEntry.vector.length} dimensions
          </div>
        </div>
      )}

      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={r.word}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => onSelectWord?.(r.word)}
          >
            <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{r.word}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[r.category]}20`,
                    color: CATEGORY_COLORS[r.category],
                  }}
                >
                  {CATEGORY_LABELS[r.category] || r.category}
                </span>
              </div>
            </div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${r.similarity * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
              {r.similarity.toFixed(3)}
            </span>
          </div>
        ))}
        {results.length === 0 && query && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Word &quot;{query}&quot; not in vocabulary
          </p>
        )}
      </div>

      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400">
        <h4 className="font-semibold text-xs mb-1">How it works</h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Cosine similarity measures the angle between two vectors. A value of 1.0 means identical direction,
          0 means perpendicular (unrelated), and -1 means opposite. Words with high similarity are close in meaning.
        </p>
      </div>
    </div>
  );
}
