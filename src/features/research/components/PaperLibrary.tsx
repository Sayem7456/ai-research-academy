'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Paper, PaperFilter } from '../types';

const PAPERS: Paper[] = [
  {
    id: 'attention-is-all-you-need',
    title: 'Attention Is All You Need',
    authors: ['Vaswani et al.'],
    year: 2017,
    venue: 'NeurIPS',
    abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
    topics: ['transformer', 'attention'],
    difficulty: 'hard',
    url: 'https://arxiv.org/abs/1706.03762',
    citations: 100000,
  },
  {
    id: 'bert',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Devlin et al.'],
    year: 2019,
    venue: 'NAACL',
    abstract: 'We introduce BERT, which is designed to pre-train deep bidirectional representations.',
    topics: ['bert', 'nlp', 'pretraining'],
    difficulty: 'medium',
    url: 'https://arxiv.org/abs/1810.04805',
    citations: 80000,
  },
  {
    id: 'gpt-3',
    title: 'Language Models are Few-Shot Learners',
    authors: ['Brown et al.'],
    year: 2020,
    venue: 'NeurIPS',
    abstract: 'Recent work demonstrates that scaling up language models greatly improves task-agnostic, few-shot performance.',
    topics: ['gpt', 'scaling', 'in-context-learning'],
    difficulty: 'hard',
    url: 'https://arxiv.org/abs/2005.14165',
    citations: 25000,
  },
  {
    id: 'word2vec',
    title: 'Efficient Estimation of Word Representations in Vector Space',
    authors: ['Mikolov et al.'],
    year: 2013,
    venue: 'ICLR',
    abstract: 'We propose two new model architectures for computing continuous vector representations of words.',
    topics: ['embeddings', 'nlp'],
    difficulty: 'easy',
    url: 'https://arxiv.org/abs/1301.3781',
    citations: 30000,
  },
  {
    id: 'rag',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Lewis et al.'],
    year: 2020,
    venue: 'NeurIPS',
    abstract: 'We explore a general-purpose fine-tuning recipe for retrieval-augmented generation.',
    topics: ['rag', 'retrieval', 'generative'],
    difficulty: 'medium',
    url: 'https://arxiv.org/abs/2005.11401',
    citations: 5000,
  },
  {
    id: 'resnet',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['He et al.'],
    year: 2016,
    venue: 'CVPR',
    abstract: 'We present a residual learning framework to ease the training of networks that are substantially deeper.',
    topics: ['computer-vision', 'resnet', 'deep-learning'],
    difficulty: 'medium',
    url: 'https://arxiv.org/abs/1512.03385',
    citations: 150000,
  },
  {
    id: 'vit',
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition',
    authors: ['Dosovitskiy et al.'],
    year: 2021,
    venue: 'ICLR',
    abstract: 'We show that a pure transformer applied directly to sequences of image patches can perform very well.',
    topics: ['computer-vision', 'transformer', 'vit'],
    difficulty: 'hard',
    url: 'https://arxiv.org/abs/2010.11929',
    citations: 15000,
  },
  {
    id: 'stable-diffusion',
    title: 'High-Resolution Image Synthesis with Latent Diffusion Models',
    authors: ['Rombach et al.'],
    year: 2022,
    venue: 'CVPR',
    abstract: 'By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models can achieve state-of-the-art results.',
    topics: ['generative', 'diffusion', 'computer-vision'],
    difficulty: 'hard',
    url: 'https://arxiv.org/abs/2112.10752',
    citations: 8000,
  },
  {
    id: 'dqn',
    title: 'Playing Atari with Deep Reinforcement Learning',
    authors: ['Mnih et al.'],
    year: 2013,
    venue: 'NeurIPS Workshop',
    abstract: 'We present the first deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning.',
    topics: ['reinforcement-learning', 'deep-learning'],
    difficulty: 'medium',
    url: 'https://arxiv.org/abs/1312.5602',
    citations: 20000,
  },
  {
    id: 'gan',
    title: 'Generative Adversarial Nets',
    authors: ['Goodfellow et al.'],
    year: 2014,
    venue: 'NeurIPS',
    abstract: 'We propose a new framework for estimating generative models via an adversarial process.',
    topics: ['generative', 'gan'],
    difficulty: 'medium',
    url: 'https://arxiv.org/abs/1406.2661',
    citations: 40000,
  },
]

const ALL_TOPICS = Array.from(new Set(PAPERS.flatMap((p) => p.topics))).sort()

export default function PaperLibrary() {
  const [filter, setFilter] = useState<PaperFilter>({
    query: '',
    topics: [],
    difficulty: [],
    yearRange: [2013, 2025],
    sortBy: 'citations',
  });
  const [bookmarkedPapers, setBookmarkedPapers] = useState<Set<string>>(new Set());
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);

  const filteredPapers = useMemo(() => {
    let result = [...PAPERS];

    if (filter.query) {
      const q = filter.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q)
      );
    }

    if (filter.topics.length > 0) {
      result = result.filter((p) =>
        filter.topics.some((t) => p.topics.includes(t))
      );
    }

    if (filter.difficulty.length > 0) {
      result = result.filter((p) =>
        filter.difficulty.includes(p.difficulty)
      );
    }

    result = result.filter(
      (p) => p.year >= filter.yearRange[0] && p.year <= filter.yearRange[1]
    );

    switch (filter.sortBy) {
      case 'year':
        result.sort((a, b) => b.year - a.year);
        break;
      case 'citations':
        result.sort((a, b) => (b.citations || 0) - (a.citations || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [filter]);

  const toggleBookmark = (paperId: string) => {
    setBookmarkedPapers((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const toggleTopic = (topic: string) => {
    setFilter((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const toggleDifficulty = (diff: string) => {
    setFilter((prev) => ({
      ...prev,
      difficulty: prev.difficulty.includes(diff)
        ? prev.difficulty.filter((d) => d !== diff)
        : [...prev.difficulty, diff],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Paper Library</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Curated collection of foundational AI research papers. Filter by topic, difficulty, and year.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={filter.query}
              onChange={(e) => setFilter((prev) => ({ ...prev, query: e.target.value }))}
              placeholder="Search papers by title, author, or abstract..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topics</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter.topics.includes(topic)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => toggleDifficulty(diff)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter.difficulty.includes(diff)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex gap-2">
                {(['citations', 'year', 'title'] as const).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setFilter((prev) => ({ ...prev, sortBy: sort }))}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter.sortBy === sort
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Showing {filteredPapers.length} of {PAPERS.length} papers
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredPapers.map((paper) => (
              <motion.div
                key={paper.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {paper.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>{paper.authors.join(', ')}</span>
                      <span>|</span>
                      <span>{paper.year}</span>
                      <span>|</span>
                      <span>{paper.venue}</span>
                      {paper.citations && (
                        <>
                          <span>|</span>
                          <span>{paper.citations.toLocaleString()} citations</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {paper.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400"
                        >
                          {topic}
                        </span>
                      ))}
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full ${
                          paper.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : paper.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {paper.difficulty}
                      </span>
                    </div>
                    <button
                      onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {expandedPaper === paper.id ? 'Hide abstract' : 'Show abstract'}
                    </button>
                    <AnimatePresence>
                      {expandedPaper === paper.id && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-sm text-gray-600 dark:text-gray-400 mt-2 overflow-hidden"
                        >
                          {paper.abstract}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleBookmark(paper.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        bookmarkedPapers.has(paper.id)
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-yellow-500'
                      }`}
                      title={bookmarkedPapers.has(paper.id) ? 'Remove bookmark' : 'Bookmark paper'}
                    >
                      {bookmarkedPapers.has(paper.id) ? '★' : '☆'}
                    </button>
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors text-center"
                        title="Open paper"
                      >
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
