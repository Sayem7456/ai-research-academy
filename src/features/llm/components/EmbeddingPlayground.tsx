'use client';

import React, { useState } from 'react';
import AnalogySolver from './AnalogySolver';
import NearestNeighbors from './NearestNeighbors';
import EmbeddingScatterPlot from './EmbeddingScatterPlot';
import DimensionInspector from './DimensionInspector';
import ContextualEmbeddings from './ContextualEmbeddings';
import BiasExplorer from './BiasExplorer';
import SkipGramTrainer from './SkipGramTrainer';

const TABS = [
  { id: 'analogy', label: 'Analogy Solver', icon: 'A − B + C = ?' },
  { id: 'neighbors', label: 'Nearest Neighbors', icon: 'Find Similar' },
  { id: 'scatter', label: '2D Projection', icon: 'PCA Map' },
  { id: 'dimensions', label: 'Dimension Inspector', icon: 'Dim Explorer' },
  { id: 'contextual', label: 'Contextual Embeddings', icon: 'Static vs BERT' },
  { id: 'bias', label: 'Bias Explorer', icon: 'Fairness' },
  { id: 'training', label: 'Skip-Gram Training', icon: 'Learn from Scratch' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function EmbeddingPlayground() {
  const [activeTab, setActiveTab] = useState<TabId>('analogy');

  const handleSelectWord = (word: string) => {
    setActiveTab('analogy');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analogy':
        return <AnalogySolver />;
      case 'neighbors':
        return <NearestNeighbors onSelectWord={handleSelectWord} />;
      case 'scatter':
        return <EmbeddingScatterPlot />;
      case 'dimensions':
        return <DimensionInspector />;
      case 'contextual':
        return <ContextualEmbeddings />;
      case 'bias':
        return <BiasExplorer />;
      case 'training':
        return <SkipGramTrainer />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Embedding Playground</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Explore word embeddings interactively. Visualize vector space, solve analogies,
          find similar words, and understand how embeddings capture meaning.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Uses 50-dimensional synthetic embeddings for illustration. Real embeddings (GloVe, Word2Vec)
          have 100–300 dimensions and are trained on billions of words.
        </p>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-px mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[400px]">{renderContent()}</div>
      </div>
    </div>
  );
}
