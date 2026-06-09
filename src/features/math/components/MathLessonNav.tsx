/**
 * MathLessonNav - Navigation sidebar for math lessons
 * Phase 9: Mathematics Module
 */

'use client';

import React from 'react';
import type { MathCategoryId, MathTopic } from '../types';
import type { MathCategoryProgress } from '../types';

interface MathLessonNavProps {
  topics: MathTopic[];
  currentLessonId?: string;
  categoryProgress: Record<MathCategoryId, MathCategoryProgress>;
  onSelectLesson: (lessonId: string) => void;
}

export default function MathLessonNav({
  topics,
  currentLessonId,
  categoryProgress,
  onSelectLesson,
}: MathLessonNavProps) {
  return (
    <nav className="space-y-6">
      {topics.map((topic) => {
        const progress = categoryProgress[topic.category.id];
        return (
          <div key={topic.category.id}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{topic.category.icon}</span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {topic.category.title}
              </h4>
              {progress && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {progress.completedLessons}/{progress.totalLessons}
                </span>
              )}
            </div>

            {/* Category Progress Bar */}
            {progress && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mb-2">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: `${progress.percentage}%`,
                    backgroundColor: topic.category.color,
                  }}
                />
              </div>
            )}

            {/* Lessons */}
            <ul className="space-y-0.5">
              {topic.lessons.map((lesson) => {
                const isActive = lesson.id === currentLessonId;
                const isComplete = progress?.lessons.find(
                  (l) => l.lessonId === lesson.id
                )?.completed;

                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => onSelectLesson(lesson.id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : isComplete
                            ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {isComplete ? (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                          {lesson.order}
                        </span>
                      )}
                      <span className={`truncate ${isComplete ? 'line-through' : ''}`}>
                        {lesson.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
