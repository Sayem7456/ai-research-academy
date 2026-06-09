/**
 * Mathematics Module Utilities
 * Phase 9: Mathematics Module
 */

import type { MathCategoryId, MathLesson, MathOverallProgress, MathCategoryProgress } from '../types';
import { MATH_TOPICS, ALL_MATH_LESSONS, TOTAL_MATH_LESSONS, MATH_CATEGORIES } from './math-data';
import type { CompletedTopic } from '@/store/types';

export { MATH_CATEGORIES, MATH_TOPICS, ALL_MATH_LESSONS, TOTAL_MATH_LESSONS } from './math-data';
export { getPracticeQuestionsByLesson, getPracticeQuestionsByCategory, getPracticeQuestionsByDifficulty, MATH_PRACTICE_QUESTIONS } from './math-data';

/**
 * Get a category definition by its ID
 */
export function getCategoryById(id: MathCategoryId) {
  return MATH_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get all lessons for a given category
 */
export function getLessonsByCategory(categoryId: MathCategoryId): MathLesson[] {
  const topic = MATH_TOPICS.find((t) => t.category.id === categoryId);
  return topic?.lessons ?? [];
}

/**
 * Get a single lesson by its ID
 */
export function getLessonById(lessonId: string): MathLesson | undefined {
  return ALL_MATH_LESSONS.find((l) => l.id === lessonId);
}

/**
 * Get the next lesson in sequence for a given lesson
 */
export function getNextLesson(lessonId: string): MathLesson | undefined {
  const lesson = getLessonById(lessonId);
  if (!lesson) return undefined;

  const categoryLessons = getLessonsByCategory(lesson.categoryId);
  const currentIndex = categoryLessons.findIndex((l) => l.id === lessonId);
  if (currentIndex < categoryLessons.length - 1) {
    return categoryLessons[currentIndex + 1];
  }

  // Move to next category
  const categoryIndex = MATH_CATEGORIES.findIndex((c) => c.id === lesson.categoryId);
  if (categoryIndex < MATH_CATEGORIES.length - 1) {
    const nextCategory = MATH_CATEGORIES[categoryIndex + 1];
    return getLessonsByCategory(nextCategory.id)[0];
  }

  return undefined;
}

/**
 * Get the previous lesson in sequence
 */
export function getPreviousLesson(lessonId: string): MathLesson | undefined {
  const lesson = getLessonById(lessonId);
  if (!lesson) return undefined;

  const categoryLessons = getLessonsByCategory(lesson.categoryId);
  const currentIndex = categoryLessons.findIndex((l) => l.id === lessonId);
  if (currentIndex > 0) {
    return categoryLessons[currentIndex - 1];
  }

  // Move to previous category
  const categoryIndex = MATH_CATEGORIES.findIndex((c) => c.id === lesson.categoryId);
  if (categoryIndex > 0) {
    const prevCategory = MATH_CATEGORIES[categoryIndex - 1];
    const prevLessons = getLessonsByCategory(prevCategory.id);
    return prevLessons[prevLessons.length - 1];
  }

  return undefined;
}

/**
 * Calculate progress for a specific category
 */
export function calculateCategoryProgress(
  categoryId: MathCategoryId,
  completedTopics: CompletedTopic[]
): MathCategoryProgress {
  const lessons = getLessonsByCategory(categoryId);
  const completedLessonIds = new Set(
    completedTopics
      .filter((t) => t.category === 'math')
      .map((t) => t.id)
  );

  const lessonProgress = lessons.map((lesson) => ({
    lessonId: lesson.id,
    categoryId: lesson.categoryId,
    completed: completedLessonIds.has(lesson.id),
    completedAt: completedTopics.find((t) => t.id === lesson.id)?.completedAt,
    score: completedTopics.find((t) => t.id === lesson.id)?.score,
  }));

  const completedCount = lessonProgress.filter((l) => l.completed).length;

  return {
    categoryId,
    totalLessons: lessons.length,
    completedLessons: completedCount,
    percentage: lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0,
    lessons: lessonProgress,
  };
}

/**
 * Calculate overall math progress
 */
export function calculateOverallProgress(
  completedTopics: CompletedTopic[],
  totalXP: number
): MathOverallProgress {
  const categories = MATH_CATEGORIES.map((cat) =>
    calculateCategoryProgress(cat.id, completedTopics)
  );

  const totalCompleted = categories.reduce((sum, c) => sum + c.completedLessons, 0);

  return {
    totalLessons: TOTAL_MATH_LESSONS,
    completedLessons: totalCompleted,
    percentage: TOTAL_MATH_LESSONS > 0 ? Math.round((totalCompleted / TOTAL_MATH_LESSONS) * 100) : 0,
    totalXP,
    categories,
  };
}

/**
 * Generate content path for a math lesson
 */
export function getLessonContentPath(lesson: MathLesson): string {
  return `/content/math/${lesson.slug}`;
}
