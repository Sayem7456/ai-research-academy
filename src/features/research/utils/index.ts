import type { ResearchTopic, ResearchTopicId } from '../types'

export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'reading-papers',
    title: 'Reading Papers',
    description: 'How to efficiently read and understand AI research papers',
    icon: '📖',
    difficulty: 'beginner',
  },
  {
    id: 'reproducing-papers',
    title: 'Reproducing Papers',
    description: 'Step-by-step guide to reproducing research results',
    icon: '🔄',
    difficulty: 'intermediate',
  },
  {
    id: 'benchmarking',
    title: 'Benchmarking',
    description: 'How to properly evaluate and compare models',
    icon: '📊',
    difficulty: 'intermediate',
  },
  {
    id: 'ablation-studies',
    title: 'Ablation Studies',
    description: 'Systematically removing components to understand contributions',
    icon: '🧪',
    difficulty: 'advanced',
  },
  {
    id: 'writing-papers',
    title: 'Writing Papers',
    description: 'Structure and write effective research papers',
    icon: '✍️',
    difficulty: 'advanced',
  },
]

export function getTopicById(id: ResearchTopicId): ResearchTopic | undefined {
  return RESEARCH_TOPICS.find((t) => t.id === id)
}
