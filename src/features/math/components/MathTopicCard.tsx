/**
 * MathTopicCard - Card component for a math category
 * Phase 9: Mathematics Module
 */

'use client';

import React from 'react';
import type { MathCategory, MathCategoryProgress } from '../types';

interface MathTopicCardProps {
  category: MathCategory;
  progress: MathCategoryProgress;
  onLessonClick?: (lessonId: string) => void;
  onStart?: () => void;
  lessons?: { id: string; title: string; order: number; completed: boolean }[];
}

export default function MathTopicCard({
  category,
  progress,
  onLessonClick,
  onStart,
  lessons,
}: MathTopicCardProps) {
  const progressColor = progress.percentage === 100
    ? 'text-green-600 dark:text-green-400'
    : progress.percentage > 0
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-gray-400 dark:text-gray-500';

  const barColor = progress.percentage === 100
    ? 'bg-green-500'
    : progress.percentage > 0
      ? 'bg-blue-500'
      : 'bg-gray-300 dark:bg-gray-600';

  const ctaLabel = progress.percentage === 0
    ? 'Start'
    : progress.percentage === 100
      ? 'Review'
      : 'Continue';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg">
      {/* Header */}
      <div
        className="p-6 border-b border-gray-200 dark:border-gray-700"
        style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {category.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {category.totalLessons} lessons
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-right ${progressColor}`}>
              <span className="text-2xl font-bold">{progress.percentage}%</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart?.();
              }}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          {category.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{progress.completedLessons} of {progress.totalLessons} completed</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`${barColor} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Lesson List */}
      {lessons && lessons.length > 0 && (
        <div className="p-4 space-y-1">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onLessonClick?.(lesson.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                lesson.completed
                  ? 'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-current">
                {lesson.completed ? (
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-gray-400 dark:text-gray-300">{lesson.order}</span>
                )}
              </span>
              <span className={`text-sm ${lesson.completed ? 'line-through' : ''}`}>
                {lesson.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
