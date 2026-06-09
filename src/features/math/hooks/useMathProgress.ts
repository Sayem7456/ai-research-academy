/**
 * useMathProgress Hook
 * Phase 9: Mathematics Module
 *
 * Wraps the global progress store with math-specific helpers.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useProgressStore } from '@/store';
import type { MathCategoryId, MathLesson, MathOverallProgress, MathCategoryProgress } from '../types';
import {
  calculateCategoryProgress,
  calculateOverallProgress,
  TOTAL_MATH_LESSONS,
} from '../utils';

export function useMathProgress() {
  const completedTopics = useProgressStore((s) => s.completedTopics);
  const totalXP = useProgressStore((s) => s.totalXP);
  const markTopicComplete = useProgressStore((s) => s.markTopicComplete);
  const markProblemSolved = useProgressStore((s) => s.markProblemSolved);

  const overallProgress: MathOverallProgress = useMemo(
    () => calculateOverallProgress(completedTopics, totalXP),
    [completedTopics, totalXP]
  );

  const getCategoryProgress = useCallback(
    (categoryId: MathCategoryId): MathCategoryProgress => {
      return calculateCategoryProgress(categoryId, completedTopics);
    },
    [completedTopics]
  );

  const isLessonCompleted = useCallback(
    (lessonId: string): boolean => {
      return completedTopics.some((t) => t.id === lessonId);
    },
    [completedTopics]
  );

  const completeLesson = useCallback(
    (lesson: MathLesson, score?: number) => {
      markTopicComplete({
        id: lesson.id,
        category: 'math',
        topicName: lesson.title,
        score,
      });
    },
    [markTopicComplete]
  );

  const completeProblem = useCallback(
    (problemId: string, lessonId: string, problemName: string, difficulty: 'easy' | 'medium' | 'hard', attempts: number) => {
      markProblemSolved({
        id: problemId,
        topicId: lessonId,
        problemName,
        difficulty,
        attempts,
      });
    },
    [markProblemSolved]
  );

  return {
    overallProgress,
    getCategoryProgress,
    isLessonCompleted,
    completeLesson,
    completeProblem,
    totalLessons: TOTAL_MATH_LESSONS,
  };
}
