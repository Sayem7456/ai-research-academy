import type { LLCategory, LLCategoryId, LLLesson, LLMTopicGroup } from '../types';

export const LLM_CATEGORIES: LLCategory[] = [
  {
    id: 'tokenization-embeddings',
    title: 'Tokenization & Embeddings',
    description: 'How text is split into tokens and converted into dense vector representations that capture semantic meaning.',
    icon: '🔤',
    color: '#8B5CF6',
    totalLessons: 2,
  },
  {
    id: 'attention',
    title: 'Attention Mechanism',
    description: 'The core innovation behind Transformers — learning which parts of the input to focus on when producing each output.',
    icon: '🧠',
    color: '#10B981',
    totalLessons: 2,
  },
  {
    id: 'transformer',
    title: 'Transformer Architecture',
    description: 'The encoder-decoder architecture that powers GPT, BERT, and virtually all modern language models.',
    icon: '🔄',
    color: '#3B82F6',
    totalLessons: 2,
  },
  {
    id: 'advanced',
    title: 'Advanced LLM Topics',
    description: 'Retrieval-augmented generation and agent workflows — extending LLMs with external knowledge and tool use.',
    icon: '🚀',
    color: '#F59E0B',
    totalLessons: 2,
  },
];

const tokenEmbedLessons: LLLesson[] = [
  {
    id: 'llm-tokenization',
    title: 'Tokenization',
    slug: 'llm-tokenization',
    categoryId: 'tokenization-embeddings',
    description: 'How BPE, WordPiece, and SentencePiece split text into tokens — the first step in any LLM pipeline.',
    order: 1,
    topics: ['BPE', 'WordPiece', 'SentencePiece', 'Vocabulary', 'Special tokens'],
    visualComponents: ['Interactive tokenizer', 'Subword splitting animation'],
  },
  {
    id: 'llm-embeddings',
    title: 'Word Embeddings',
    slug: 'llm-embeddings',
    categoryId: 'tokenization-embeddings',
    description: 'Dense vector representations that capture semantic meaning — from word2vec to modern contextual embeddings.',
    order: 2,
    topics: ['One-hot encoding', 'Word2vec', 'GloVe', 'Contextual embeddings', 'Cosine similarity', 'Analogies'],
    visualComponents: ['Embedding explorer', 'Similarity heatmap', '2D projection'],
    prerequisites: ['llm-tokenization'],
  },
];

const attentionLessons: LLLesson[] = [
  {
    id: 'llm-attention',
    title: 'Self-Attention',
    slug: 'llm-attention',
    categoryId: 'attention',
    description: 'The mechanism that lets each token attend to every other token — computing weighted contextual representations.',
    order: 1,
    topics: ['Scaled dot-product attention', 'Attention weights', 'Softmax', 'Multi-head attention', 'Contextual representation'],
    visualComponents: ['Attention weight heatmap', 'Token-to-token attention visualization'],
  },
  {
    id: 'llm-qkv',
    title: 'Query, Key, Value',
    slug: 'llm-qkv',
    categoryId: 'attention',
    description: 'The QKV projection mechanism — how queries, keys, and values are computed and used in attention.',
    order: 2,
    topics: ['QKV projections', 'Dot product scoring', 'Value weighting', 'Multi-head splitting', 'Output projection'],
    visualComponents: ['QKV matrix visualizer', 'Dot product animation'],
    prerequisites: ['llm-attention'],
  },
];

const transformerLessons: LLLesson[] = [
  {
    id: 'llm-transformer',
    title: 'Transformer',
    slug: 'llm-transformer',
    categoryId: 'transformer',
    description: 'The full encoder-decoder architecture — from input embeddings to output tokens with self-attention and feed-forward layers.',
    order: 1,
    topics: ['Encoder stack', 'Decoder stack', 'Self-attention', 'Cross-attention', 'Feed-forward', 'Layer norm', 'Residual connections'],
    visualComponents: ['Transformer animation', 'Data flow visualization'],
    prerequisites: ['llm-qkv'],
  },
  {
    id: 'llm-positional-encoding',
    title: 'Positional Encoding',
    slug: 'llm-positional-encoding',
    categoryId: 'transformer',
    description: 'How Transformers encode sequence order using sinusoidal functions — since attention is permutation-invariant.',
    order: 2,
    topics: ['Sinusoidal encoding', 'Learned encoding', 'Frequency bands', 'Position interpolation', 'Relative positions'],
    visualComponents: ['Encoding curve explorer', 'Position heatmap'],
    prerequisites: ['llm-transformer'],
  },
];

const advancedLessons: LLLesson[] = [
  {
    id: 'llm-rag',
    title: 'Retrieval-Augmented Generation',
    slug: 'llm-rag',
    categoryId: 'advanced',
    description: 'Grounding LLM responses in external knowledge — document chunking, embedding, retrieval, and answer generation.',
    order: 1,
    topics: ['Document chunking', 'Embedding', 'Vector search', 'Context injection', 'Answer generation'],
    visualComponents: ['RAG pipeline explorer', 'Retrieval visualization'],
    prerequisites: ['llm-embeddings'],
  },
  {
    id: 'llm-agents',
    title: 'LLM Agents & Tools',
    slug: 'llm-agents',
    categoryId: 'advanced',
    description: 'LLM agents that use tools in a Think-Act-Observe loop — planning, reasoning, and autonomous task completion.',
    order: 2,
    topics: ['Agent loop', 'Tool use', 'Planning', 'Memory', 'Multi-step reasoning'],
    visualComponents: ['Agent workflow visualizer', 'Tool call animation'],
    prerequisites: ['llm-rag'],
  },
];

export const LLM_TOPIC_GROUPS: LLMTopicGroup[] = [
  { category: LLM_CATEGORIES[0], lessons: tokenEmbedLessons },
  { category: LLM_CATEGORIES[1], lessons: attentionLessons },
  { category: LLM_CATEGORIES[2], lessons: transformerLessons },
  { category: LLM_CATEGORIES[3], lessons: advancedLessons },
];

export const ALL_LLM_LESSONS: LLLesson[] = [
  ...tokenEmbedLessons,
  ...attentionLessons,
  ...transformerLessons,
  ...advancedLessons,
];

export const TOTAL_LLM_LESSONS = ALL_LLM_LESSONS.length;
