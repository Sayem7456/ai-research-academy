'use client';

import React, { useState, useMemo } from 'react';
import { cosineSimilarity } from '../utils/embeddings';

interface ContextualExample {
  word: string;
  contexts: {
    sentence: string;
    vector: number[];
  }[];
}

// Pre-computed contextual embeddings for demonstration
// In real models (BERT, GPT), the same word gets different vectors depending on context
const CONTEXTUAL_EXAMPLES: ContextualExample[] = [
  {
    word: 'bank',
    contexts: [
      {
        sentence: 'I deposited money at the bank.',
        vector: [0.8, 0.2, 0.1, 0.9, 0.3, 0.7, 0.1, 0.2, 0.8, 0.4, 0.1, 0.9, 0.2, 0.3, 0.7, 0.1, 0.8, 0.2, 0.3, 0.9, 0.4, 0.1, 0.7, 0.2, 0.8, 0.3, 0.1, 0.9, 0.2, 0.7, 0.8, 0.1, 0.3, 0.9, 0.2, 0.7, 0.1, 0.8, 0.3, 0.9, 0.2, 0.7, 0.1, 0.8, 0.3, 0.9, 0.2, 0.7, 0.1, 0.8],
      },
      {
        sentence: 'We sat on the river bank.',
        vector: [0.1, 0.8, 0.9, 0.2, 0.7, 0.1, 0.8, 0.3, 0.2, 0.9, 0.8, 0.1, 0.7, 0.3, 0.2, 0.9, 0.1, 0.8, 0.3, 0.2, 0.7, 0.9, 0.1, 0.8, 0.2, 0.7, 0.9, 0.1, 0.8, 0.3, 0.2, 0.9, 0.7, 0.1, 0.8, 0.3, 0.9, 0.2, 0.7, 0.1, 0.8, 0.3, 0.9, 0.2, 0.7, 0.1, 0.8, 0.3, 0.9, 0.2],
      },
      {
        sentence: 'The bank of the lake was muddy.',
        vector: [0.15, 0.75, 0.85, 0.25, 0.65, 0.15, 0.75, 0.35, 0.25, 0.85, 0.75, 0.15, 0.65, 0.35, 0.25, 0.85, 0.15, 0.75, 0.35, 0.25, 0.65, 0.85, 0.15, 0.75, 0.25, 0.65, 0.85, 0.15, 0.75, 0.35, 0.25, 0.85, 0.65, 0.15, 0.75, 0.35, 0.85, 0.25, 0.65, 0.15, 0.75, 0.35, 0.85, 0.25, 0.65, 0.15, 0.75, 0.35, 0.85, 0.25],
      },
    ],
  },
  {
    word: 'cell',
    contexts: [
      {
        sentence: 'She checked her phone for a text.',
        vector: [0.9, 0.1, 0.2, 0.8, 0.3, 0.6, 0.2, 0.1, 0.9, 0.4, 0.2, 0.8, 0.1, 0.4, 0.6, 0.2, 0.9, 0.1, 0.4, 0.8, 0.3, 0.2, 0.6, 0.1, 0.9, 0.4, 0.2, 0.8, 0.1, 0.6, 0.9, 0.2, 0.4, 0.8, 0.1, 0.6, 0.2, 0.9, 0.4, 0.8, 0.1, 0.6, 0.2, 0.9, 0.4, 0.8, 0.1, 0.6, 0.2, 0.9],
      },
      {
        sentence: 'The prison cell was small.',
        vector: [0.2, 0.9, 0.8, 0.1, 0.7, 0.2, 0.9, 0.3, 0.1, 0.8, 0.9, 0.2, 0.7, 0.3, 0.1, 0.8, 0.2, 0.9, 0.3, 0.1, 0.7, 0.8, 0.2, 0.9, 0.1, 0.7, 0.8, 0.2, 0.9, 0.3, 0.1, 0.8, 0.7, 0.2, 0.9, 0.3, 0.8, 0.1, 0.7, 0.2, 0.9, 0.3, 0.8, 0.1, 0.7, 0.2, 0.9, 0.3, 0.8, 0.1],
      },
      {
        sentence: 'A biological cell divides.',
        vector: [0.15, 0.85, 0.75, 0.15, 0.65, 0.25, 0.85, 0.35, 0.15, 0.75, 0.85, 0.25, 0.65, 0.35, 0.15, 0.75, 0.25, 0.85, 0.35, 0.15, 0.65, 0.75, 0.25, 0.85, 0.15, 0.65, 0.75, 0.25, 0.85, 0.35, 0.15, 0.75, 0.65, 0.25, 0.85, 0.35, 0.75, 0.15, 0.65, 0.25, 0.85, 0.35, 0.75, 0.15, 0.65, 0.25, 0.85, 0.35, 0.75, 0.15],
      },
    ],
  },
  {
    word: 'light',
    contexts: [
      {
        sentence: 'Turn on the light.',
        vector: [0.85, 0.15, 0.1, 0.9, 0.2, 0.7, 0.15, 0.1, 0.85, 0.35, 0.15, 0.9, 0.1, 0.35, 0.7, 0.15, 0.85, 0.15, 0.35, 0.9, 0.2, 0.15, 0.7, 0.15, 0.85, 0.35, 0.15, 0.9, 0.15, 0.7, 0.85, 0.15, 0.35, 0.9, 0.15, 0.7, 0.15, 0.85, 0.35, 0.9, 0.15, 0.7, 0.15, 0.85, 0.35, 0.9, 0.15, 0.7, 0.15, 0.85],
      },
      {
        sentence: 'The bag is very light.',
        vector: [0.1, 0.85, 0.9, 0.15, 0.7, 0.1, 0.85, 0.25, 0.15, 0.8, 0.85, 0.15, 0.7, 0.25, 0.15, 0.8, 0.1, 0.85, 0.25, 0.15, 0.7, 0.8, 0.15, 0.85, 0.15, 0.7, 0.8, 0.15, 0.85, 0.25, 0.15, 0.8, 0.7, 0.15, 0.85, 0.25, 0.8, 0.15, 0.7, 0.15, 0.85, 0.25, 0.8, 0.15, 0.7, 0.15, 0.85, 0.25, 0.8, 0.15],
      },
      {
        sentence: 'She has a light step.',
        vector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.3, 0.5, 0.5, 0.5, 0.5, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      },
    ],
  },
];

export default function ContextualEmbeddings() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [hoveredCtx, setHoveredCtx] = useState<number | null>(null);

  const example = CONTEXTUAL_EXAMPLES[selectedExample];

  const similarities = useMemo(() => {
    const pairs: { i: number; j: number; sim: number }[] = [];
    for (let i = 0; i < example.contexts.length; i++) {
      for (let j = i + 1; j < example.contexts.length; j++) {
        pairs.push({
          i, j,
          sim: cosineSimilarity(example.contexts[i].vector, example.contexts[j].vector),
        });
      }
    }
    return pairs;
  }, [example]);

  const maxSim = Math.max(...similarities.map((s) => s.sim));
  const minSim = Math.min(...similarities.map((s) => s.sim));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Contextual Embeddings</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          In modern models (BERT, GPT), the same word gets different embeddings depending on context.
          This is why &quot;bank&quot; in &quot;river bank&quot; and &quot;bank account&quot; are understood as different meanings.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTEXTUAL_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => { setSelectedExample(i); setHoveredCtx(null); }}
            className={`text-[10px] px-2.5 py-1.5 rounded-lg transition-colors ${
              selectedExample === i
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            &quot;{ex.word}&quot;
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {example.contexts.map((ctx, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredCtx(i)}
            onMouseLeave={() => setHoveredCtx(null)}
            className={`p-3 rounded-lg border transition-all ${
              hoveredCtx === i
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Context {i + 1}</span>
              {hoveredCtx === i && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                  viewing
                </span>
              )}
            </div>
            <p className="text-sm font-mono mb-2">&quot;{ctx.sentence}&quot;</p>
            <div className="flex gap-0.5 h-3">
              {ctx.vector.slice(0, 20).map((v, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(2, v * 12)}px`,
                    backgroundColor: v > 0.7 ? '#22c55e' : v > 0.4 ? '#eab308' : '#ef4444',
                    opacity: hoveredCtx === i ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <h4 className="text-xs font-semibold mb-2">Similarity between contexts</h4>
        <div className="space-y-1.5">
          {similarities.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 min-w-[24px]">C{pair.i + 1}↔C{pair.j + 1}</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${pair.sim * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-gray-600 dark:text-gray-400 w-10 text-right">
                {pair.sim.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Different meaning: {minSim.toFixed(3)}</span>
          <span>Same meaning: {maxSim.toFixed(3)}</span>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400">
        <h4 className="font-semibold text-xs mb-1">Static vs Contextual</h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          <strong>Static embeddings</strong> (Word2Vec, GloVe) assign one vector per word — &quot;bank&quot; has the same
          embedding regardless of context. <strong>Contextual embeddings</strong> (BERT, GPT) generate different vectors
          based on surrounding words, capturing polysemy (multiple meanings).
        </p>
      </div>
    </div>
  );
}
