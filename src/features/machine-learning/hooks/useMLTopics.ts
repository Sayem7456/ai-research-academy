'use client';

import { useCallback } from 'react';
import { ML_CATEGORIES, ML_TOPICS, ALL_ML_LESSONS } from '../utils/ml-data';
import type { MLCategoryId, MLLesson } from '../types';

export function useMLTopics() {
  const getTopic = useCallback(
    (categoryId: MLCategoryId) => {
      return ML_TOPICS.find((t) => t.category.id === categoryId);
    },
    []
  );

  const getLesson = useCallback(
    (lessonId: string): MLLesson | undefined => {
      return ALL_ML_LESSONS.find((l) => l.id === lessonId);
    },
    []
  );

  const getLessonsByCategory = useCallback(
    (categoryId: MLCategoryId): MLLesson[] => {
      return ALL_ML_LESSONS.filter((l) => l.categoryId === categoryId);
    },
    []
  );

  return {
    categories: ML_CATEGORIES,
    topics: ML_TOPICS,
    allLessons: ALL_ML_LESSONS,
    getTopic,
    getLesson,
    getLessonsByCategory,
  };
}
