/**
 * StatsCards - Dashboard statistics overview cards
 * Phase 8: User Dashboard
 */

'use client';

import React from 'react';
import { useProgressStore, useNotesStore, useBookmarksStore } from '@/store';

export function StatsCards() {
  const progress = useProgressStore();
  const { notes } = useNotesStore();
  const { bookmarks } = useBookmarksStore();

  const stats = [
    {
      label: 'Completed Topics',
      value: progress.completedTopics.length,
      icon: '✅',
      color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    },
    {
      label: 'Solved Problems',
      value: progress.solvedProblems.length,
      icon: '🎯',
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    },
    {
      label: 'Total XP',
      value: progress.totalXP,
      icon: '⭐',
      color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    },
    {
      label: 'Current Streak',
      value: progress.streak,
      suffix: progress.streak === 1 ? ' day' : ' days',
      icon: '🔥',
      color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    },
    {
      label: 'Personal Notes',
      value: notes.length,
      icon: '📝',
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    },
    {
      label: 'Bookmarks',
      value: bookmarks.length,
      icon: '🔖',
      color: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
                {stat.suffix && (
                  <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">
                    {stat.suffix}
                  </span>
                )}
              </p>
            </div>
            <div className={`text-4xl p-3 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
