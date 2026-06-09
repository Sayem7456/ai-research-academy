/**
 * useMathTopics Hook
 * Phase 9: Mathematics Module
 *
 * Provides access to math curriculum data.
 */

'use client';

import { useCallback } from 'react';
import type { MathCategoryId, MathLesson, MathTopic } from '../types';
import {
  MATH_CATEGORIES,
  MATH_TOPICS,
  ALL_MATH_LESSONS,
  getLessonsByCategory,
  getLessonById,
  getNextLesson,
  getPreviousLesson,
  getPracticeQuestionsByLesson,
  getPracticeQuestionsByCategory,
} from '../utils';

export function useMathTopics() {
  const categories = MATH_CATEGORIES;
  const topics = MATH_TOPICS;
  const allLessons = ALL_MATH_LESSONS;

  const getTopic = useCallback(
    (categoryId: MathCategoryId): MathTopic | undefined => {
      return topics.find((t) => t.category.id === categoryId);
    },
    [topics]
  );

  const getLesson = useCallback(
    (lessonId: string): MathLesson | undefined => {
      return getLessonById(lessonId);
    },
    []
  );

  return {
    categories,
    topics,
    allLessons,
    getTopic,
    getLesson,
    getLessonsByCategory,
    getNextLesson,
    getPreviousLesson,
    getPracticeQuestionsByLesson,
    getPracticeQuestionsByCategory,
  };
}
