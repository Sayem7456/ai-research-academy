'use client';

import { useCallback } from 'react';
import { LLM_CATEGORIES, LLM_TOPIC_GROUPS, ALL_LLM_LESSONS } from '../utils/llm-data';
import type { LLCategoryId, LLLesson } from '../types';

export function useLLMTopics() {
  const getTopic = useCallback(
    (categoryId: LLCategoryId) => {
      return LLM_TOPIC_GROUPS.find((t) => t.category.id === categoryId);
    },
    []
  );

  const getLesson = useCallback(
    (lessonId: string): LLLesson | undefined => {
      return ALL_LLM_LESSONS.find((l) => l.id === lessonId);
    },
    []
  );

  const getLessonsByCategory = useCallback(
    (categoryId: LLCategoryId): LLLesson[] => {
      return ALL_LLM_LESSONS.filter((l) => l.categoryId === categoryId);
    },
    []
  );

  return {
    categories: LLM_CATEGORIES,
    topicGroups: LLM_TOPIC_GROUPS,
    allLessons: ALL_LLM_LESSONS,
    getTopic,
    getLesson,
    getLessonsByCategory,
  };
}
