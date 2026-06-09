/**
 * Mathematics Module Types
 * Phase 9: Mathematics Module
 */

import type { Difficulty } from '@/store/types';

// ============================================================================
// MATH CATEGORY
// ============================================================================

export type MathCategoryId = 'linear-algebra' | 'calculus' | 'probability' | 'statistics';

export interface MathCategory {
  id: MathCategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalLessons: number;
}

// ============================================================================
// MATH LESSON
// ============================================================================

export interface MathLesson {
  id: string;
  title: string;
  slug: string;
  categoryId: MathCategoryId;
  description: string;
  order: number;
  topics: string[];
  prerequisites?: string[];
  visualComponents?: string[];
  papers?: PaperReference[];
}

// ============================================================================
// MATH TOPIC (CATEGORY + LESSONS)
// ============================================================================

export interface MathTopic {
  category: MathCategory;
  lessons: MathLesson[];
}

// ============================================================================
// PRACTICE SYSTEM
// ============================================================================

export type PracticeType = 'mcq' | 'coding' | 'math';

export interface MCQOption {
  id: string;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  lessonId: string;
  categoryId: MathCategoryId;
  type: PracticeType;
  difficulty: Difficulty;
  question: string;
  options?: MCQOption[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  codeTemplate?: string;
  xp: number;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface MathLessonProgress {
  lessonId: string;
  categoryId: MathCategoryId;
  completed: boolean;
  completedAt?: string;
  score?: number;
  timeSpent?: number;
}

export interface MathCategoryProgress {
  categoryId: MathCategoryId;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lessons: MathLessonProgress[];
}

export interface MathOverallProgress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  totalXP: number;
  categories: MathCategoryProgress[];
}

// ============================================================================
// PAPER REFERENCES
// ============================================================================

export interface PaperReference {
  title: string;
  year?: string;
  difficulty?: Difficulty;
  url?: string;
}
