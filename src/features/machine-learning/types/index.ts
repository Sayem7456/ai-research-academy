import type { Difficulty } from '@/store/types';

export type MLCategoryId = 'regression' | 'classification' | 'unsupervised';

export interface MLCategory {
  id: MLCategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalLessons: number;
}

export interface MLLesson {
  id: string;
  title: string;
  slug: string;
  categoryId: MLCategoryId;
  description: string;
  order: number;
  topics: string[];
  prerequisites?: string[];
  visualComponents?: string[];
}

export interface MLTopic {
  category: MLCategory;
  lessons: MLLesson[];
}

export interface MLProgress {
  categoryId: MLCategoryId;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export interface MLOverallProgress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  categories: MLProgress[];
}
