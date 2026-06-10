/**
 * MathLessonTemplate - Reusable lesson template component
 * Phase 9: Mathematics Module
 *
 * Provides a consistent layout for all math lessons with:
 * - Header with title and metadata
 * - Content area (for MDX rendered content)
 * - Lesson navigation (prev/next)
 * - Complete lesson button
 * - Practice section link
 */

'use client';

import React, { useState } from 'react';
import type { MathLesson, MathCategory } from '../types';

interface MathLessonTemplateProps {
  lesson: MathLesson;
  category: MathCategory;
  isCompleted: boolean;
  previousLesson?: MathLesson;
  nextLesson?: MathLesson;
  onMarkComplete: () => void;
  onNavigate: (lessonId: string) => void;
  onGoToPractice?: () => void;
  children?: React.ReactNode;
}

export default function MathLessonTemplate({
  lesson,
  category,
  isCompleted,
  previousLesson,
  nextLesson,
  onMarkComplete,
  onNavigate,
  onGoToPractice,
  children,
}: MathLessonTemplateProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = () => {
    if (!isCompleted) {
      onMarkComplete();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span>{category.icon}</span>
        <span>{category.title}</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{lesson.title}</span>
        {isCompleted && (
          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
            Completed
          </span>
        )}
      </div>

      {/* Lesson Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {lesson.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {lesson.description}
        </p>

        {/* Topics Covered */}
        <div className="flex flex-wrap gap-2 mb-4">
          {lesson.topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              {topic}
            </span>
          ))}
        </div>

        {/* Visual Components */}
        {lesson.visualComponents && lesson.visualComponents.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Interactive: {lesson.visualComponents.join(', ')}</span>
          </div>
        )}

        {/* Papers to Read */}
        {lesson.papers && lesson.papers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Papers to Read
            </h4>
            <ul className="space-y-1">
              {lesson.papers.map((paper, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                  {paper.title} {paper.year && `(${paper.year})`}
                  {paper.difficulty && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      paper.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      paper.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {paper.difficulty}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Content Area */}
      {children && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-6">
        {!isCompleted ? (
          <button
            onClick={handleComplete}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark as Complete
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completed
          </div>
        )}

        {onGoToPractice && (
          <button
            onClick={onGoToPractice}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Practice Problems
          </button>
        )}
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center">
          <div className="text-6xl animate-bounce mt-20">
            🎉
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
        {previousLesson ? (
          <button
            onClick={() => onNavigate(previousLesson.id)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <div className="text-left">
              <div className="text-xs text-gray-500 dark:text-gray-400">Previous</div>
              <div className="text-sm font-medium">{previousLesson.title}</div>
            </div>
          </button>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <button
            onClick={() => onNavigate(nextLesson.id)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">Next</div>
              <div className="text-sm font-medium">{nextLesson.title}</div>
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last lesson in Mathematics track
          </div>
        )}
      </div>
    </div>
  );
}
