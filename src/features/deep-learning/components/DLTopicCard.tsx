'use client';

import type { DLCategory } from '../types';

interface DLTopicCardProps {
  category: DLCategory;
  lessons?: { id: string; title: string; order: number }[];
  onStart?: () => void;
  onLessonClick?: (lessonId: string) => void;
}

export default function DLTopicCard({
  category,
  lessons,
  onStart,
  onLessonClick,
}: DLTopicCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg">
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart?.();
            }}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Start
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          {category.description}
        </p>
      </div>

      {lessons && lessons.length > 0 && (
        <div className="p-4 space-y-1">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onLessonClick?.(lesson.id)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400">
                {lesson.order}
              </span>
              <span className="text-sm">{lesson.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
