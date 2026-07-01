'use client';

import { useCallback } from 'react';
import { DL_CATEGORIES, DL_TOPICS, ALL_DL_LESSONS } from '../utils/dl-data';
import type { DLCategoryId, DLLesson } from '../types';

export function useDLTopics() {
  const getTopic = useCallback(
    (categoryId: DLCategoryId) => {
      return DL_TOPICS.find((t) => t.category.id === categoryId);
    },
    []
  );

  const getLesson = useCallback(
    (lessonId: string): DLLesson | undefined => {
      return ALL_DL_LESSONS.find((l) => l.id === lessonId);
    },
    []
  );

  const getLessonsByCategory = useCallback(
    (categoryId: DLCategoryId): DLLesson[] => {
      return ALL_DL_LESSONS.filter((l) => l.categoryId === categoryId);
    },
    []
  );

  return {
    categories: DL_CATEGORIES,
    topics: DL_TOPICS,
    allLessons: ALL_DL_LESSONS,
    getTopic,
    getLesson,
    getLessonsByCategory,
  };
}
