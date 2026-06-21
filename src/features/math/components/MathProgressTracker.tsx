/**
 * MathProgressTracker - Overall progress widget for math module
 * Phase 9: Mathematics Module
 */

'use client';

import React from 'react';
import type { MathOverallProgress } from '../types';

interface MathProgressTrackerProps {
  progress: MathOverallProgress;
}

export default function MathProgressTracker({ progress }: MathProgressTrackerProps) {
  const ringPercentage = Math.min(progress.percentage, 100);
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (ringPercentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Mathematics Progress
      </h3>

      <div className="flex items-center gap-6">
        {/* Circular Progress Ring */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              className={ringPercentage > 0 ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {progress.percentage}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Lessons completed</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {progress.completedLessons} / {progress.totalLessons}
            </span>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {progress.categories.map((cat) => (
              <div key={cat.categoryId} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(cat.categoryId) }} />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 truncate">
                  {getCategoryLabel(cat.categoryId)}
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {cat.completedLessons}/{cat.totalLessons}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(id: string): string {
  const colors: Record<string, string> = {
    'linear-algebra': '#10B981',
    'calculus': '#3B82F6',
    'probability': '#8B5CF6',
    'statistics': '#F59E0B',
  };
  return colors[id] || '#6B7280';
}

function getCategoryLabel(id: string): string {
  const labels: Record<string, string> = {
    'linear-algebra': 'Linear Algebra',
    'calculus': 'Calculus',
    'probability': 'Probability',
    'statistics': 'Statistics',
  };
  return labels[id] || id;
}
