/**
 * MathOverview - Main overview page for the Mathematics module
 * Phase 9: Mathematics Module
 * Phase 10: Added visualizations section
 *
 * Displays:
 * - Progress tracker widget
 * - All 4 math categories with lesson cards
 * - Interactive visualizations gallery
 * - Quick links to content pages
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMathProgress } from '../hooks/useMathProgress';
import { useMathTopics } from '../hooks/useMathTopics';
import MathTopicCard from './MathTopicCard';
import MathProgressTracker from './MathProgressTracker';
import VisualizationsOverview from './visualizations/VisualizationsOverview';
import type { MathCategoryId } from '../types';

export default function MathOverview() {
  const { overallProgress, getCategoryProgress, isLessonCompleted } = useMathProgress();
  const { categories, topics } = useMathTopics();
  const [expandedCategory, setExpandedCategory] = useState<MathCategoryId | null>(null);
  const [view, setView] = useState<'curriculum' | 'visualizations'>('curriculum');

  if (view === 'visualizations') {
    return (
      <div>
        <div className="max-w-6xl mx-auto pt-8 px-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/math" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Mathematics</Link>
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
            Back to Mathematics overview
          </button>
        </div>
        <VisualizationsOverview />
      </div>
    );
  }

  const toggleCategory = (catId: MathCategoryId) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Mathematics</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Mathematics
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Build the mathematical foundations for AI research — from linear algebra and calculus
              to probability and statistics.
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
        {/* Mobile visualizations button */}
        <button
          onClick={() => setView('visualizations')}
          className="sm:hidden flex items-center gap-2 w-full px-5 py-2.5 mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Interactive Visualizations
        </button>
      </div>

      {/* Progress + Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <MathProgressTracker progress={overallProgress} />
        </div>
        <div className="space-y-4">
          {/* Quick Start Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              {overallProgress.completedLessons === 0 ? 'Start Here' : 'Continue Learning'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {overallProgress.completedLessons === 0
                ? 'Begin with Linear Algebra to build the foundations needed for Machine Learning and Deep Learning.'
                : `${overallProgress.completedLessons} of ${overallProgress.totalLessons} lessons completed. Keep going!`}
            </p>
            <div className="space-y-2">
              {categories.map((cat, idx) => {
                const catProgress = getCategoryProgress(cat.id);
                return (
                  <div key={cat.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <span className="text-gray-700 dark:text-gray-300 flex-1">{cat.title}</span>
                    {catProgress.completedLessons > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{catProgress.completedLessons}/{catProgress.totalLessons}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Topics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const progress = getCategoryProgress(category.id);
            const topic = topics.find((t) => t.category.id === category.id);
            const lessons = topic?.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              order: l.order,
              completed: isLessonCompleted(l.id),
            })) ?? [];

            return (
              <div key={category.id} onClick={() => toggleCategory(category.id)} className="cursor-pointer">
                <MathTopicCard
                  category={category}
                  progress={progress}
                  lessons={expandedCategory === category.id ? lessons : undefined}
                  onStart={() => {
                    const firstIncomplete = topic?.lessons.find((l) => !isLessonCompleted(l.id));
                    const target = firstIncomplete ?? topic?.lessons[0];
                    if (target) window.location.href = `/content/math/${target.slug}`;
                  }}
                  onLessonClick={(lessonId) => {
                    window.location.href = `/content/math/${topic?.lessons.find((l) => l.id === lessonId)?.slug ?? lessonId}`;
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Visualizations Quick Access */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Interactive Visualizations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              7 interactive tools: Matrix, Vector, Eigenvector, PCA, Gradient Descent, Distributions, and Bayesian Updates.
            </p>
          </div>
          <button
            onClick={() => setView('visualizations')}
            className="flex-shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}
