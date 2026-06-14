'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DOCUMENTS = [
  { id: 1, title: 'Machine Learning Basics', content: 'ML is a subset of AI that enables systems to learn from data.' },
  { id: 2, title: 'Neural Networks', content: 'Neural networks are computing systems inspired by biological neural networks.' },
  { id: 3, title: 'Deep Learning', content: 'Deep learning uses multi-layered neural networks for complex pattern recognition.' },
  { id: 4, title: 'Natural Language Processing', content: 'NLP enables computers to understand and generate human language.' },
  { id: 5, title: 'Computer Vision', content: 'Computer vision enables machines to interpret and understand visual information.' },
];

const QUERIES = [
  'What is deep learning?',
  'How do neural networks work?',
  'Explain NLP and its applications.',
];

const RETRIEVAL_RESULTS = [
  { docId: 3, score: 0.92, reason: 'Semantic match: "deep learning"' },
  { docId: 2, score: 0.78, reason: 'Related: "neural networks" context' },
  { docId: 1, score: 0.65, reason: 'Foundational: "machine learning" context' },
];

const LLM_RESPONSES: Record<string, string> = {
  'What is deep learning?': 'Deep learning is a subset of machine learning that uses multi-layered neural networks for complex pattern recognition. It excels at tasks like image classification, natural language processing, and speech recognition by automatically learning hierarchical representations from raw data.',
  'How do neural networks work?': 'Neural networks work by processing input data through layers of interconnected nodes (neurons). Each connection has a weight that is adjusted during training. The network learns to map inputs to outputs by minimizing a loss function through backpropagation.',
  'Explain NLP and its applications.': 'Natural Language Processing (NLP) enables computers to understand, interpret, and generate human language. Applications include machine translation, sentiment analysis, chatbots, text summarization, and information extraction.',
};

type PipelineStage = 'query' | 'embedding' | 'retrieval' | 'context' | 'llm' | 'response';

const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'query', label: 'User Query', color: '#3b82f6' },
  { key: 'embedding', label: 'Query Embedding', color: '#8b5cf6' },
  { key: 'retrieval', label: 'Document Retrieval', color: '#22c55e' },
  { key: 'context', label: 'Context Assembly', color: '#eab308' },
  { key: 'llm', label: 'LLM Generation', color: '#ef4444' },
  { key: 'response', label: 'Final Response', color: '#06b6d4' },
];

export default function RAGPipelineExplorer() {
  const [currentStage, setCurrentStage] = useState(0);
  const [selectedQuery, setSelectedQuery] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const query = QUERIES[selectedQuery];
  const response = LLM_RESPONSES[query];

  const stopAnim = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAnimating(false);
    setCurrentStage(0);
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setCurrentStage(0);
    let stage = 0;
    intervalRef.current = setInterval(() => {
      stage++;
      setCurrentStage(stage);
      if (stage >= STAGES.length - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const renderStageContent = () => {
    switch (STAGES[currentStage].key) {
      case 'query':
        return (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">User Question</h4>
            <p className="text-lg font-mono text-blue-700 dark:text-blue-300">&quot;{query}&quot;</p>
          </div>
        );
      case 'embedding':
        return (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Query → Vector</h4>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded bg-purple-400 flex items-center justify-center text-[10px] font-mono text-white"
                  style={{ opacity: 0.3 + Math.abs(Math.sin(i * 2.5)) * 0.7 }}
                >
                  {(Math.sin(i * 2.5) * 0.8).toFixed(2)}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Converted to dense vector for similarity search</p>
          </div>
        );
      case 'retrieval':
        return (
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Top-k Retrieved Documents</h4>
            <div className="space-y-2">
              {RETRIEVAL_RESULTS.map((result, i) => {
                const doc = DOCUMENTS.find((d) => d.id === result.docId)!;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{doc.title}</span>
                      <span className="text-xs font-mono bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded">
                        score: {result.score}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.reason}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      case 'context':
        return (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Assembled Context Window</h4>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800 font-mono text-xs">
              {RETRIEVAL_RESULTS.map((result, i) => {
                const doc = DOCUMENTS.find((d) => d.id === result.docId)!;
                return (
                  <div key={i} className="mb-2">
                    <span className="text-yellow-600 dark:text-yellow-400">[Doc {i + 1}]</span>{' '}
                    {doc.content}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">Combined retrieved documents as context for the LLM</p>
          </div>
        );
      case 'llm':
        return (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">LLM Processing</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                <span className="text-gray-700 dark:text-gray-300">Processing query + context...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-gray-700 dark:text-gray-300">Generating grounded response...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-gray-700 dark:text-gray-300">Token by token decoding...</span>
              </div>
            </div>
          </div>
        );
      case 'response':
        return (
          <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Grounded Response</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{response}</p>
            <div className="mt-3 flex gap-2">
              {RETRIEVAL_RESULTS.map((result, i) => (
                <span key={i} className="text-[10px] bg-cyan-100 dark:bg-cyan-900 px-2 py-0.5 rounded">
                  Source {i + 1}
                </span>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">RAG Pipeline Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Retrieval-Augmented Generation grounds LLM responses in external knowledge by retrieving relevant documents before generating.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Query</label>
              <div className="space-y-1">
                {QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedQuery(i); stopAnim(); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedQuery === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={isAnimating ? stopAnim : startAnim}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAnimating ? '■ Stop' : '▶ Run Pipeline'}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Pipeline Stages</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STAGES.map((stage, i) => (
              <React.Fragment key={stage.key}>
                <motion.div
                  animate={{
                    backgroundColor: i <= currentStage ? stage.color + '20' : 'transparent',
                    borderColor: i <= currentStage ? stage.color : '#d1d5db',
                  }}
                  className="px-3 py-2 rounded-lg border-2 text-xs font-medium whitespace-nowrap"
                >
                  {stage.label}
                </motion.div>
                {i < STAGES.length - 1 && (
                  <div className={`w-4 h-0.5 ${i < currentStage ? 'bg-gray-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {renderStageContent()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
          <h3 className="font-semibold text-sm mb-2">Why RAG?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Reduces Hallucination:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Grounds responses in retrieved facts.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Up-to-date Knowledge:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Can access current information beyond training cutoff.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Domain Specific:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Retrieve from specialized document collections.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Attributable:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Sources can be cited for transparency.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
