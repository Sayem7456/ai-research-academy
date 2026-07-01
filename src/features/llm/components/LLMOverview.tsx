'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLLMTopics } from '../hooks/useLLMTopics';
import LLMTopicCard from './LLMTopicCard';
import LLMVisualizationsOverview from './LLMVisualizationsOverview';
import type { LLCategoryId } from '../types';

export default function LLMOverview() {
  const { categories, topicGroups } = useLLMTopics();
  const [expandedCategory, setExpandedCategory] = useState<LLCategoryId | null>(null);
  const [view, setView] = useState<'curriculum' | 'visualizations'>('curriculum');

  if (view === 'visualizations') {
    return (
      <div>
        <div className="max-w-6xl mx-auto pt-8 px-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/llm" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">LLM</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Visualizations</span>
          </nav>
          <button
            onClick={() => setView('curriculum')}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to LLM overview
          </button>
        </div>
        <LLMVisualizationsOverview />
      </div>
    );
  }

  const toggleCategory = (catId: LLCategoryId) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Large Language Models</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              💬 Large Language Models
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              From tokenization to Transformers — understand the architecture, attention mechanism,
              and advanced techniques powering modern LLMs.
            </p>
          </div>
          <button
            onClick={() => setView('visualizations')}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Interactive Visualizations
          </button>
        </div>
        <button
          onClick={() => setView('visualizations')}
          className="sm:hidden flex items-center gap-2 w-full px-5 py-2.5 mt-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Interactive Visualizations
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Topics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const topic = topicGroups.find((t) => t.category.id === category.id);
            const lessons = topic?.lessons ?? [];

            return (
              <div key={category.id} onClick={() => toggleCategory(category.id)} className="cursor-pointer">
                <LLMTopicCard
                  category={category}
                  lessons={expandedCategory === category.id ? lessons.map((l) => ({
                    id: l.id,
                    title: l.title,
                    order: l.order,
                  })) : undefined}
                  onStart={() => {
                    const first = topic?.lessons[0];
                    if (first) window.location.href = `/content/llm/${first.slug}`;
                  }}
                  onLessonClick={(lessonId) => {
                    window.location.href = `/content/llm/${topic?.lessons.find((l) => l.id === lessonId)?.slug ?? lessonId}`;
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
