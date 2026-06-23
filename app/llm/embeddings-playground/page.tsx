import type { Metadata } from "next";
import Link from 'next/link';
import { EmbeddingPlayground } from '@/features/llm/components';

export const metadata: Metadata = {
  title: "Embedding Playground — AI Research Academy",
  description:
    "Advanced interactive playground for exploring word embeddings. Solve analogies, find nearest neighbors, visualize 2D projections, inspect dimensions, explore contextual embeddings, discover biases, and train skip-gram from scratch.",
};

export default function EmbeddingsPlaygroundPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/llm" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">LLM</Link>
          <span>/</span>
          <Link href="/llm/embeddings" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Embeddings</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Playground</span>
        </nav>
        <EmbeddingPlayground />
      </div>
    </main>
  );
}
