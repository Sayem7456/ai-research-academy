export type DLCategoryId = 'foundations' | 'training' | 'architectures' | 'advanced';

export interface DLCategory {
  id: DLCategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalLessons: number;
}

export interface DLLesson {
  id: string;
  title: string;
  slug: string;
  categoryId: DLCategoryId;
  description: string;
  order: number;
  topics: string[];
  prerequisites?: string[];
  visualComponents?: string[];
}

export interface DLTopic {
  category: DLCategory;
  lessons: DLLesson[];
}
