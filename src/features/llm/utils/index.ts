import type { LLMTopic, LLMTopicId } from '../types'
export { LLM_CATEGORIES, LLM_TOPIC_GROUPS, ALL_LLM_LESSONS, TOTAL_LLM_LESSONS } from './llm-data';

export const LLM_TOPICS: LLMTopic[] = [
  {
    id: 'tokenization',
    title: 'Tokenization',
    description: 'How text is split into tokens for LLM processing',
    icon: '🔤',
    difficulty: 'beginner',
  },
  {
    id: 'embeddings',
    title: 'Embeddings',
    description: 'Dense vector representations of tokens',
    icon: '📊',
    difficulty: 'beginner',
  },
  {
    id: 'attention',
    title: 'Attention',
    description: 'Self-attention mechanism that powers Transformers',
    icon: '🧠',
    difficulty: 'intermediate',
  },
  {
    id: 'transformer',
    title: 'Transformer',
    description: 'The architecture behind modern LLMs',
    icon: '⚡',
    difficulty: 'intermediate',
  },
  {
    id: 'bert',
    title: 'BERT',
    description: 'Bidirectional Encoder for language understanding',
    icon: '📖',
    difficulty: 'intermediate',
  },
  {
    id: 'gpt',
    title: 'GPT',
    description: 'Generative Pre-trained Transformer for text generation',
    icon: '💬',
    difficulty: 'intermediate',
  },
  {
    id: 'rag',
    title: 'RAG',
    description: 'Retrieval-Augmented Generation for grounded responses',
    icon: '📚',
    difficulty: 'advanced',
  },
  {
    id: 'agents',
    title: 'Agents',
    description: 'LLM-based autonomous agents with tool use',
    icon: '🤖',
    difficulty: 'advanced',
  },
]

export function getTopicById(id: LLMTopicId): LLMTopic | undefined {
  return LLM_TOPICS.find((t) => t.id === id)
}
