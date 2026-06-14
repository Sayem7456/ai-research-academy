export type ResearchTopicId =
  | 'reading-papers'
  | 'reproducing-papers'
  | 'benchmarking'
  | 'ablation-studies'
  | 'writing-papers'

export interface ResearchTopic {
  id: ResearchTopicId
  title: string
  description: string
  icon: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  venue: string
  abstract: string
  topics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  url?: string
  citations?: number
}

export interface PaperFilter {
  query: string
  topics: string[]
  difficulty: string[]
  yearRange: [number, number]
  sortBy: 'year' | 'citations' | 'title'
}
