/**
 * Home Page - Unified landing page with navigation, stats, and activity
 * Combines a welcoming hero, navigation cards, compact stats, and recent activity.
 * The full analytics dashboard remains at /dashboard.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useProgressStore, useNotesStore, useBookmarksStore } from '@/store';
import { StatsCards, RecentActivity } from '@/features/dashboard/components';

const NAV_CARDS = [
  {
    href: '/math',
    icon: '📐',
    title: 'Mathematics',
    description: 'Linear algebra, calculus, probability, and statistics — 27 interactive lessons.',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    href: '/math/visualizations',
    icon: '🎨',
    title: 'Visualizations',
    description: '7 interactive tools: matrix transforms, gradient descent, distributions, PCA, and more.',
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    href: '/ml',
    icon: '🤖',
    title: 'Machine Learning',
    description: 'Core ML algorithms with visual intuition: regression, trees, SVM, clustering, and PCA.',
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    href: '/notes',
    icon: '📝',
    title: 'Personal Notes',
    description: 'Your learning journal — create, search, and organize notes. Stored locally, works offline.',
    color: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    href: '/dashboard',
    icon: '📊',
    title: 'Full Dashboard',
    description: 'Detailed analytics: progress charts, category breakdown, and 30-day activity timeline.',
    color: 'from-orange-500 to-amber-600',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
];

const LEARNING_PATH = [
  { step: 1, label: 'Mathematics', icon: '📐', href: '/math', color: 'bg-emerald-500' },
  { step: 2, label: 'Machine Learning', icon: '🤖', href: '/ml', color: 'bg-blue-500' },
  { step: 3, label: 'Computer Vision', icon: '👁️', href: '#', color: 'bg-purple-500', soon: true },
  { step: 4, label: 'LLMs', icon: '💬', href: '#', color: 'bg-amber-500', soon: true },
  { step: 5, label: 'Research', icon: '📄', href: '#', color: 'bg-red-500', soon: true },
];

export default function HomePage() {
  const progress = useProgressStore();
  const { notes } = useNotesStore();
  const hasActivity = progress.completedTopics.length > 0 || progress.solvedProblems.length > 0 || notes.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Section */}
        <div className="mb-10">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-8 sm:p-12 text-white shadow-xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

            <div className="relative">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                AI Research Learning Platform
              </h1>
              <p className="text-lg text-blue-100 max-w-2xl mb-6">
                Your journey from Mathematics to AI Research. Interactive lessons, visualizations,
                and practice problems — all in your browser, all stored locally.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/math"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md"
                >
                  Start Learning
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/math/visualizations"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 text-white rounded-lg font-semibold hover:bg-white/25 transition-colors border border-white/20"
                >
                  Explore Visualizations
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Explore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {NAV_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`group bg-white dark:bg-gray-800 rounded-xl border ${card.borderColor} p-5 hover:shadow-lg transition-all`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-3 shadow-sm`}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Learning Path
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {LEARNING_PATH.map((item, idx) => (
                <React.Fragment key={item.step}>
                  {item.soon ? (
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-50">
                      <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-lg text-white`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.label}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Coming soon</p>
                      </div>
                    </div>
                  ) : (
                    <Link href={item.href} className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
                      <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-lg text-white shadow-md`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{item.label}</p>
                        <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Available now</p>
                      </div>
                    </Link>
                  )}
                  {idx < LEARNING_PATH.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 flex-shrink-0 mx-1" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Stats + Activity */}
        {hasActivity ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Your Progress
                </h2>
                <Link
                  href="/dashboard"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View full dashboard →
                </Link>
              </div>
              <StatsCards />
            </div>

            <div className="mb-8">
              <RecentActivity />
            </div>
          </>
        ) : (
          /* Empty State - guide new users */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center mb-8">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Ready to start your journey?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Begin with Mathematics to build the foundations. Complete lessons and solve practice
              problems to track your progress here.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/math"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Start with Mathematics
              </Link>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-600 py-6 border-t border-gray-200 dark:border-gray-800">
          <p>Frontend only — No backend, no database. All progress stored locally in your browser.</p>
          <p className="mt-1">Next.js · TypeScript · Tailwind · Framer Motion · MDX · Zustand · Recharts</p>
        </div>
      </div>
    </div>
  );
}
