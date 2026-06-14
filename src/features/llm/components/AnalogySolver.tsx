'use client';

import React, { useState, useMemo } from 'react';
import { DEDUPED_VOCABULARY as VOCABULARY, CATEGORY_COLORS, CATEGORY_LABELS } from '../data/embeddings';
import { solveAnalogy, vectorSubtract, vectorAdd, cosineSimilarity } from '../utils/embeddings';

const PRESET_ANALOGIES = [
  { a: 'king', b: 'man', c: 'woman', expected: 'queen' },
  { a: 'paris', b: 'france', c: 'germany', expected: 'berlin' },
  { a: 'king', b: 'queen', c: 'princess', expected: 'prince' },
  { a: 'happy', b: 'joy', c: 'anger', expected: 'angry' },
  { a: 'tokyo', b: 'japan', c: 'france', expected: 'paris' },
  { a: 'cat', b: 'dog', c: 'lion', expected: 'tiger' },
];

export default function AnalogySolver() {
  const [a, setA] = useState('king');
  const [b, setB] = useState('man');
  const [c, setC] = useState('woman');

  const results = useMemo(() => {
    const vecA = VOCABULARY.find((v) => v.word === a)?.vector;
    const vecB = VOCABULARY.find((v) => v.word === b)?.vector;
    const vecC = VOCABULARY.find((v) => v.word === c)?.vector;
    if (!vecA || !vecB || !vecC) return [];
    return solveAnalogy(vecA, vecB, vecC, VOCABULARY, [a, b, c]).slice(0, 8);
  }, [a, b, c]);

  const computation = useMemo(() => {
    const vecA = VOCABULARY.find((v) => v.word === a)?.vector;
    const vecB = VOCABULARY.find((v) => v.word === b)?.vector;
    const vecC = VOCABULARY.find((v) => v.word === c)?.vector;
    if (!vecA || !vecB || !vecC) return null;
    const subtracted = vectorSubtract(vecA, vecB);
    const added = vectorAdd(subtracted, vecC);
    return { a: vecA, b: vecB, c: vecC, result: added };
  }, [a, b, c]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Analogy Solver</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Solve analogies of the form &quot;A is to B as C is to ?&quot; using vector arithmetic: A − B + C ≈ ?
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'A', value: a, set: setA },
          { label: 'B', value: b, set: setB },
          { label: 'C', value: c, set: setC },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {label} ({label === 'A' ? 'is to' : label === 'B' ? 'as' : 'is to'})
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => set(e.target.value.toLowerCase())}
              list={`analogy-${label}`}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
            <datalist id={`analogy-${label}`}>
              {VOCABULARY.map((v) => (
                <option key={v.word} value={v.word} />
              ))}
            </datalist>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 self-center">Presets:</span>
        {PRESET_ANALOGIES.map((p, i) => (
          <button
            key={i}
            onClick={() => { setA(p.a); setB(p.b); setC(p.c); }}
            className="text-[10px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
          >
            {p.a} − {p.b} + {p.c} = {p.expected}
          </button>
        ))}
      </div>

      {computation && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-gray-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i}>Dim {i + 1}</span>
              ))}
            </div>
            <span className="text-[10px] text-gray-400">showing 5 of 50 dimensions</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-20 text-gray-500">{a}</span>
              <div className="flex-1 grid grid-cols-5 gap-1">
                {computation.a.slice(0, 5).map((v, i) => (
                  <span key={i} className="text-center">{v.toFixed(2)}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-red-500">− {b}</span>
              <div className="flex-1 grid grid-cols-5 gap-1">
                {computation.b.slice(0, 5).map((v, i) => (
                  <span key={i} className="text-center text-red-500">−{v.toFixed(2)}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-green-500">+ {c}</span>
              <div className="flex-1 grid grid-cols-5 gap-1">
                {computation.c.slice(0, 5).map((v, i) => (
                  <span key={i} className="text-center text-green-500">+{v.toFixed(2)}</span>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-0.5 flex items-center gap-2">
              <span className="w-20 text-gray-500">= ?</span>
              <div className="flex-1 grid grid-cols-5 gap-1">
                {computation.result.slice(0, 5).map((v, i) => (
                  <span key={i} className="text-center font-semibold">{v.toFixed(2)}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Results</h4>
        {results.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No results — check that all words are in the vocabulary.
          </p>
        ) : (
          <div className="space-y-1.5">
            {results.map((r, i) => {
            const entry = VOCABULARY.find((v) => v.word === r.word);
            return (
              <div
                key={r.word}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  i === 0
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                <span className="font-mono text-sm font-medium min-w-[60px]">{r.word}</span>
                {entry && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[entry.category]}20`,
                      color: CATEGORY_COLORS[entry.category],
                    }}
                  >
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                )}
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      i === 0 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${r.similarity * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                  {r.similarity.toFixed(3)}
                </span>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
