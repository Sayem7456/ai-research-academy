'use client';

import React, { useState, useMemo } from 'react';
import { DEDUPED_VOCABULARY as VOCABULARY, CATEGORY_COLORS, CATEGORY_LABELS } from '../data/embeddings';

export default function DimensionInspector() {
  const [selectedDim, setSelectedDim] = useState(0);
  const [sortBy, setSortBy] = useState<'high' | 'low'>('high');

  const dimCount = VOCABULARY[0]?.vector.length || 50;

  const ranked = useMemo(() => {
    const items = VOCABULARY.map((v) => ({
      word: v.word,
      value: v.vector[selectedDim],
      category: v.category,
    }));
    items.sort((a, b) => sortBy === 'high' ? b.value - a.value : a.value - b.value);
    return items;
  }, [selectedDim, sortBy]);

  const maxAbs = useMemo(() => {
    const vals = ranked.map((r) => Math.abs(r.value));
    return Math.max(...vals, 0.01);
  }, [ranked]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Dimension Inspector</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Explore what each dimension encodes. Click a dimension to see which words score highest and lowest.
          This reveals the latent semantic structure captured by the embeddings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Dimension</label>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(20, dimCount) }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedDim(i)}
                className={`w-7 h-7 text-[10px] rounded transition-colors ${
                  selectedDim === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
            {dimCount > 20 && (
              <span className="text-[10px] text-gray-400 self-center ml-1">+{dimCount - 20} more</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sort</label>
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy('high')}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                sortBy === 'high'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              Highest
            </button>
            <button
              onClick={() => setSortBy('low')}
              className={`px-2 py-1 text-[10px] rounded transition-colors ${
                sortBy === 'low'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              Lowest
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Dimension {selectedDim + 1} — top {sortBy === 'high' ? 'highest' : 'lowest'} values
        </div>
        <div className="space-y-1">
          {ranked.slice(0, 15).map((r, i) => {
            const barWidth = (Math.abs(r.value) / maxAbs) * 100;
            const isPositive = r.value >= 0;
            return (
              <div key={r.word} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-3 text-right">{i + 1}</span>
                <span className="font-mono text-xs min-w-[60px]">{r.word}</span>
                <div className="flex-1 flex items-center h-3">
                  <div className="w-1/2 flex justify-end">
                    {!isPositive && (
                      <div
                        className="h-2.5 rounded-l bg-red-400 dark:bg-red-500 transition-all duration-300"
                        style={{ width: `${barWidth / 2}%` }}
                      />
                    )}
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                  <div className="w-1/2">
                    {isPositive && (
                      <div
                        className="h-2.5 rounded-r bg-green-400 dark:bg-green-500 transition-all duration-300"
                        style={{ width: `${barWidth / 2}%` }}
                      />
                    )}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 w-12 text-right">
                  {r.value.toFixed(3)}
                </span>
                <span
                  className="text-[9px] px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[r.category]}20`,
                    color: CATEGORY_COLORS[r.category],
                  }}
                >
                  {CATEGORY_LABELS[r.category] || r.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400">
        <h4 className="font-semibold text-xs mb-1">Reading the chart</h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Each dimension is a direction in the embedding space. Words with high values along a dimension share some
          semantic property. For example, if &quot;king&quot; and &quot;queen&quot; both score high on a dimension while &quot;cat&quot; scores low,
          that dimension likely encodes something related to royalty or human social roles.
        </p>
      </div>
    </div>
  );
}
