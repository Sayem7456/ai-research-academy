export type LLMTopicId =
  | 'tokenization'
  | 'embeddings'
  | 'attention'
  | 'transformer'
  | 'bert'
  | 'gpt'
  | 'rag'
  | 'agents'

export interface LLMTopic {
  id: LLMTopicId
  title: string
  description: string
  icon: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export type LLCategoryId = 'tokenization-embeddings' | 'attention' | 'transformer' | 'advanced';

export interface LLCategory {
  id: LLCategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalLessons: number;
}

export interface LLLesson {
  id: string;
  title: string;
  slug: string;
  categoryId: LLCategoryId;
  description: string;
  order: number;
  topics: string[];
  prerequisites?: string[];
  visualComponents?: string[];
}

export interface LLMTopicGroup {
  category: LLCategory;
  lessons: LLLesson[];
}

export interface Token {
  id: string
  text: string
  start: number
  end: number
  type: 'word' | 'subword' | 'special' | 'punctuation'
}

export interface EmbeddingVector {
  token: string
  values: number[]
}

export interface AttentionWeight {
  from: number
  to: number
  weight: number
}

export interface QKVMatrix {
  query: number[][]
  key: number[][]
  value: number[][]
}

export interface TransformerLayer {
  attentionWeights: number[][]
  feedForwardOutput: number[]
}

export interface RAGDocument {
  id: string
  content: string
  metadata: Record<string, unknown>
  embedding?: number[]
}

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface AgentStep {
  thought: string
  action?: string
  observation?: string
}
