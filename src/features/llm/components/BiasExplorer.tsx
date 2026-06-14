'use client';

import React, { useState, useMemo } from 'react';
import { DEDUPED_VOCABULARY as VOCABULARY, CATEGORY_COLORS, CATEGORY_LABELS } from '../data/embeddings';
import { solveAnalogy } from '../utils/embeddings';

interface BiasExample {
  label: string;
  a: string;
  b: string;
  c: string;
  expected: string;
  description: string;
}

const BIAS_EXAMPLES: BiasExample[] = [
  {
    label: 'Gender: Family Role',
    a: 'man', b: 'woman', c: 'father',
    expected: 'mother',
    description: 'Does the model assume fathers are always male and mothers always female?',
  },
  {
    label: 'Gender: Relationship',
    a: 'man', b: 'woman', c: 'husband',
    expected: 'wife',
    description: 'Testing gendered relationship pairs.',
  },
  {
    label: 'Geography: Country → Capital',
    a: 'france', b: 'germany', c: 'paris',
    expected: 'berlin',
    description: 'france → germany as paris → ?',
  },
  {
    label: 'Geography: Reverse',
    a: 'japan', b: 'france', c: 'tokyo',
    expected: 'paris',
    description: 'japan → france as tokyo → ?',
  },
  {
    label: 'Emotion: Positive → Negative',
    a: 'happy', b: 'sad', c: 'love',
    expected: 'hate',
    description: 'Does the model map emotions to their opposites consistently?',
  },
  {
    label: 'Emotion: Joy → Anger',
    a: 'joy', b: 'anger', c: 'love',
    expected: 'hate',
    description: 'joy → anger as love → ?',
  },
];

export default function BiasExplorer() {
  const [activeExample, setActiveExample] = useState(0);
  const example = BIAS_EXAMPLES[activeExample];

  const results = useMemo(() => {
    const vecA = VOCABULARY.find((v) => v.word === example.a)?.vector;
    const vecB = VOCABULARY.find((v) => v.word === example.b)?.vector;
    const vecC = VOCABULARY.find((v) => v.word === example.c)?.vector;
    if (!vecA || !vecB || !vecC) return [];
    return solveAnalogy(vecA, vecB, vecC, VOCABULARY, [example.a, example.b, example.c]).slice(0, 10);
  }, [example]);

  const expectedRank = results.findIndex((r) => r.word === example.expected) + 1;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Bias & Fairness Explorer</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Embeddings learn biases from training data. Test analogies to discover how social, geographic,
          and emotional biases are encoded in vector space.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {BIAS_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => setActiveExample(i)}
            className={`text-[10px] px-2.5 py-1.5 rounded-lg transition-colors ${
              activeExample === i
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="font-mono text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-300">{example.a}</span>
          <span className="text-gray-400"> → </span>
          <span className="text-gray-600 dark:text-gray-300">{example.b}</span>
          <span className="text-gray-400"> as </span>
          <span className="text-gray-600 dark:text-gray-300">{example.c}</span>
          <span className="text-gray-400"> → </span>
          <span className="text-green-600 dark:text-green-400 font-semibold">?</span>
          <span className="text-gray-400 ml-2">(expected: {example.expected})</span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{example.description}</p>
      </div>

      <div className="space-y-1.5">
        {results.map((r, i) => {
          const entry = VOCABULARY.find((v) => v.word === r.word);
          const isExpected = r.word === example.expected;
          const isTopResult = i === 0;
          return (
            <div
              key={r.word}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isExpected
                  ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800'
                  : isTopResult
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
              {isExpected && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300">
                  expected
                </span>
              )}
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpected ? 'bg-yellow-500' : isTopResult ? 'bg-green-500' : 'bg-blue-500'
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

      {expectedRank > 0 && (
        <div className={`p-3 rounded-lg border-l-4 ${
          expectedRank === 1
            ? 'bg-green-50 dark:bg-green-950/30 border-green-400'
            : expectedRank <= 3
              ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-400'
              : 'bg-red-50 dark:bg-red-950/30 border-red-400'
        }`}>
          <div className="text-xs font-semibold mb-1">
            &quot;{example.expected}&quot; ranked #{expectedRank} out of {results.length}
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            {expectedRank === 1
              ? 'The model correctly predicted the expected answer as the top result.'
              : expectedRank <= 3
                ? 'The expected answer was in the top 3 but not #1. This suggests the analogy relationship exists but is not the strongest signal.'
                : 'The expected answer ranked poorly. This may indicate the model has learned a different relationship, or that the analogy is not well-captured by these embeddings.'}
          </p>
        </div>
      )}

      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400">
        <h4 className="font-semibold text-xs mb-1">Why this matters</h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Word embeddings trained on internet text encode societal biases. For example, &quot;man&quot; may be closer
          to &quot;programmer&quot; than &quot;woman&quot; is, reflecting gender stereotypes in the training data. Understanding
          these biases is critical for building fair AI systems.
        </p>
      </div>
    </div>
  );
}
