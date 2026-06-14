'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface Word {
  id: number;
  text: string;
  embedding: [number, number];
}

interface Cooccurrence {
  w1: number;
  w2: number;
  count: number;
}

const CORPUS = [
  'the cat sat on the mat',
  'the dog sat on the log',
  'cats and dogs are friends',
  'the cat and the dog played',
  'a cat is a pet',
  'a dog is a pet',
  'the king sat on the throne',
  'the queen sat on the throne',
  'the king and the queen ruled',
  'a prince is a king son',
  'a princess is a queen daughter',
];

const WINDOW_SIZE = 2;
const EMBEDDING_DIM = 2;
const LEARNING_RATE = 0.05;
const EPOCHS = 50;

export default function SkipGramTrainer() {
  const [isTraining, setIsTraining] = useState(false);
  const [step, setStep] = useState(0);
  const [embeddings, setEmbeddings] = useState<Map<number, [number, number]>>(new Map());
  const [cooccurrences, setCooccurrences] = useState<Cooccurrence[]>([]);
  const [highlightedPair, setHighlightedPair] = useState<{ w1: string; w2: string } | null>(null);
  const [loss, setLoss] = useState<number[]>([]);
  const animRef = useRef<number>(0);
  const trainingRef = useRef(false);

  // Build vocabulary
  const vocab = useMemo(() => {
    const words = new Set<string>();
    CORPUS.forEach((s) => s.split(' ').forEach((w) => words.add(w)));
    return Array.from(words).sort();
  }, []);

  const wordToId = useMemo(() => {
    const map = new Map<string, number>();
    vocab.forEach((w, i) => map.set(w, i));
    return map;
  }, [vocab]);

  // Build co-occurrence matrix
  const buildCooccurrences = useCallback(() => {
    const cooc = new Map<string, number>();
    CORPUS.forEach((sentence) => {
      const tokens = sentence.split(' ');
      tokens.forEach((word, i) => {
        const w1 = wordToId.get(word)!;
        for (let j = Math.max(0, i - WINDOW_SIZE); j <= Math.min(tokens.length - 1, i + WINDOW_SIZE); j++) {
          if (i === j) continue;
          const w2 = wordToId.get(tokens[j])!;
          const key = `${Math.min(w1, w2)}-${Math.max(w1, w2)}`;
          cooc.set(key, (cooc.get(key) || 0) + 1);
        }
      });
    });
    const result: Cooccurrence[] = [];
    cooc.forEach((count, key) => {
      const [w1, w2] = key.split('-').map(Number);
      result.push({ w1, w2, count });
    });
    setCooccurrences(result);
    return result;
  }, [wordToId]);

  // Initialize embeddings randomly
  const initEmbeddings = useCallback(() => {
    const map = new Map<number, [number, number]>();
    vocab.forEach((_, i) => {
      map.set(i, [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]);
    });
    setEmbeddings(map);
    return map;
  }, [vocab]);

  // Train one step of skip-gram
  const trainStep = useCallback((
    embs: Map<number, [number, number]>,
    coocs: Cooccurrence[]
  ): { embs: Map<number, [number, number]>; loss: number } => {
    const newEmbs = new Map(embs);
    let totalLoss = 0;

    for (const { w1, w2, count } of coocs) {
      const e1 = newEmbs.get(w1)!;
      const e2 = newEmbs.get(w2)!;

      // Dot product
      const dot = e1[0] * e2[0] + e1[1] * e2[1];
      const sigmoid = 1 / (1 + Math.exp(-dot));

      // Loss (negative sampling approximation)
      totalLoss += -Math.log(sigmoid + 1e-10);

      // Gradient
      const grad = (1 - sigmoid) * LEARNING_RATE;

      // Update embeddings
      newEmbs.set(w1, [
        e1[0] + grad * e2[0],
        e1[1] + grad * e2[1],
      ]);
      newEmbs.set(w2, [
        e2[0] + grad * e1[0],
        e2[1] + grad * e1[1],
      ]);
    }

    // Normalize
    for (const [id, emb] of newEmbs) {
      const norm = Math.sqrt(emb[0] * emb[0] + emb[1] * emb[1]);
      if (norm > 0) {
        newEmbs.set(id, [emb[0] / norm, emb[1] / norm]);
      }
    }

    return { embs: newEmbs, loss: totalLoss / coocs.length };
  }, []);

  // Run training animation
  const startTraining = useCallback(() => {
    if (isTraining) {
      trainingRef.current = false;
      setIsTraining(false);
      return;
    }

    const coocs = buildCooccurrences();
    let embs = initEmbeddings();
    const lossHistory: number[] = [];
    let currentStep = 0;

    setIsTraining(true);
    trainingRef.current = true;

    const runEpoch = () => {
      if (!trainingRef.current || currentStep >= EPOCHS) {
        setIsTraining(false);
        return;
      }

      const result = trainStep(embs, coocs);
      embs = result.embs;
      lossHistory.push(result.loss);
      currentStep++;

      setEmbeddings(new Map(embs));
      setLoss([...lossHistory]);
      setStep(currentStep);

      animRef.current = requestAnimationFrame(runEpoch);
    };

    animRef.current = requestAnimationFrame(runEpoch);
  }, [isTraining, buildCooccurrences, initEmbeddings, trainStep]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // SVG for visualization
  const W = 500, H = 400;
  const padding = 50;

  const getPos = (id: number) => {
    const emb = embeddings.get(id);
    if (!emb) return { x: W / 2, y: H / 2 };
    return {
      x: padding + ((emb[0] + 1.5) / 3) * (W - 2 * padding),
      y: padding + ((1.5 - emb[1]) / 3) * (H - 2 * padding),
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Skip-Gram Training from Scratch</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Watch how word embeddings emerge from predicting context words. The model learns that words appearing
          in similar contexts should have similar vectors.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startTraining}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isTraining
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isTraining ? 'Stop Training' : step > 0 ? 'Restart Training' : 'Start Training'}
        </button>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Step {step}/{EPOCHS}
        </div>
        {loss.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Loss: {loss[loss.length - 1].toFixed(4)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {/* Grid */}
            <line x1={padding} y1={H / 2} x2={W - padding} y2={H / 2} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <line x1={W / 2} y1={padding} x2={W / 2} y2={H - padding} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />

            {/* Co-occurrence connections */}
            {step > 0 && cooccurrences.slice(0, 20).map((cooc, i) => {
              const p1 = getPos(cooc.w1);
              const p2 = getPos(cooc.w2);
              return (
                <line
                  key={i}
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke="#94a3b8"
                  strokeWidth={Math.min(cooc.count, 3)}
                  opacity={0.2}
                />
              );
            })}

            {/* Word points */}
            {vocab.map((word, i) => {
              const pos = getPos(i);
              const isHighlighted = highlightedPair &&
                (highlightedPair.w1 === word || highlightedPair.w2 === word);
              return (
                <g
                  key={word}
                  onMouseEnter={() => {
                    // Find first co-occurrence involving this word
                    const cooc = cooccurrences.find(
                      (c) => vocab[c.w1] === word || vocab[c.w2] === word
                    );
                    if (cooc) {
                      setHighlightedPair({
                        w1: vocab[cooc.w1],
                        w2: vocab[cooc.w2],
                      });
                    }
                  }}
                  onMouseLeave={() => setHighlightedPair(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pos.x} cy={pos.y}
                    r={isHighlighted ? 7 : 5}
                    fill={isHighlighted ? '#3b82f6' : '#6366f1'}
                    opacity={step === 0 ? 0.3 : 0.8}
                    className="transition-all duration-300"
                  />
                  <text
                    x={pos.x} y={pos.y - 10}
                    textAnchor="middle"
                    className="fill-gray-700 dark:fill-gray-300 text-[9px]"
                    opacity={step === 0 ? 0.3 : 1}
                  >
                    {word}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <h4 className="text-xs font-semibold mb-2">Training Corpus</h4>
            <div className="space-y-1">
              {CORPUS.map((sentence, i) => (
                <p key={i} className="text-[10px] font-mono text-gray-600 dark:text-gray-400">
                  {sentence.split(' ').map((word, j) => {
                    const isHighlighted = highlightedPair &&
                      (word === highlightedPair.w1 || word === highlightedPair.w2);
                    return (
                      <span
                        key={j}
                        className={`transition-colors ${
                          isHighlighted ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
                        }`}
                      >
                        {word}{' '}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>

          {loss.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <h4 className="text-xs font-semibold mb-2">Loss Curve</h4>
              <div className="h-20 flex items-end gap-px">
                {loss.map((l, i) => {
                  const maxLoss = Math.max(...loss);
                  const height = maxLoss > 0 ? (l / maxLoss) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t transition-all duration-200"
                      style={{ height: `${height}%`, opacity: 0.3 + (i / loss.length) * 0.7 }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>0</span>
                <span>{loss.length} steps</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-400">
        <h4 className="font-semibold text-xs mb-1">How Skip-Gram works</h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-400">
          Given a word, predict its surrounding context words. The model adjusts embeddings so that words
          appearing in similar contexts end up close together. After training, &quot;cat&quot; and &quot;dog&quot; will be
          nearby because they appear in similar sentences (both are pets, both sit on things).
        </p>
      </div>
    </div>
  );
}
