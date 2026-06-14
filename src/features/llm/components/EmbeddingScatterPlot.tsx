'use client';

import React, { useMemo, useState } from 'react';
import { DEDUPED_VOCABULARY as VOCABULARY, CATEGORY_COLORS, CATEGORY_LABELS } from '../data/embeddings';
import { pca2D } from '../utils/pca';

export default function EmbeddingScatterPlot() {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_COLORS))
  );

  const pcaResult = useMemo(() => {
    const filtered = VOCABULARY.filter((v) => selectedCategories.has(v.category));
    const vectors = filtered.map((v) => v.vector);
    const labels = filtered.map((v) => v.word);
    const categories = filtered.map((v) => v.category);
    return pca2D(vectors, labels, categories);
  }, [selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // SVG dimensions
  const W = 600, H = 450;
  const pad = 40;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">2D Embedding Space</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          PCA projection of 50-dimensional embeddings into 2D. Words in the same category cluster together,
          showing that embeddings capture semantic relationships.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`text-[10px] px-2 py-1 rounded-full transition-all ${
              selectedCategories.has(cat)
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
            style={selectedCategories.has(cat) ? { backgroundColor: color } : {}}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 450 }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((f) => (
            <React.Fragment key={f}>
              <line
                x1={pad + f * (W - 2 * pad)} y1={pad}
                x2={pad + f * (W - 2 * pad)} y2={H - pad}
                stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="1"
              />
              <line
                x1={pad} y1={pad + f * (H - 2 * pad)}
                x2={W - pad} y2={pad + f * (H - 2 * pad)}
                stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="1"
              />
            </React.Fragment>
          ))}
          {/* Axes */}
          <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="currentColor" className="text-gray-300 dark:text-gray-600" strokeWidth="1" />
          <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="currentColor" className="text-gray-300 dark:text-gray-600" strokeWidth="1" />
          <text x={W - pad + 5} y={H / 2 + 4} className="fill-gray-400 text-[10px]">PC1</text>
          <text x={W / 2 - 4} y={pad - 8} className="fill-gray-400 text-[10px]">PC2</text>

          {/* Data points */}
          {pcaResult.projected.map((p) => {
            const x = pad + ((p.x + 1) / 2) * (W - 2 * pad);
            const y = pad + ((1 - p.y) / 2) * (H - 2 * pad);
            const color = CATEGORY_COLORS[p.category] || '#888';
            const isHovered = hoveredWord === p.word;
            return (
              <g
                key={p.word}
                onMouseEnter={() => setHoveredWord(p.word)}
                onMouseLeave={() => setHoveredWord(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x} cy={y}
                  r={isHovered ? 8 : 5}
                  fill={color}
                  opacity={hoveredWord && !isHovered ? 0.3 : 0.8}
                  className="transition-all duration-200"
                />
                {isHovered && (
                  <>
                    <circle cx={x} cy={y} r="12" fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
                    <text
                      x={x} y={y - 14}
                      textAnchor="middle"
                      className="fill-gray-900 dark:fill-gray-100 text-xs font-semibold"
                    >
                      {p.word}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
        <span>PC1: {(pcaResult.varianceExplained[0] * 100).toFixed(1)}% variance</span>
        <span>PC2: {(pcaResult.varianceExplained[1] * 100).toFixed(1)}% variance</span>
        <span>{pcaResult.projected.length} words</span>
      </div>

      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400">
        <h4 className="font-semibold text-xs mb-1">What is PCA?</h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Principal Component Analysis finds the 2 directions (PC1, PC2) that capture the most variance in the data.
          Words that are close in the original 50-dimensional space remain close in this 2D projection.
          The percentage shows how much of the original information is preserved.
        </p>
      </div>
    </div>
  );
}
