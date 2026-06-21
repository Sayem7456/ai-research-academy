import type { Metadata } from "next";
import Link from 'next/link';
import { EmbeddingExplorer } from '@/features/llm/components';

export const metadata: Metadata = {
  title: "Word Embeddings — Interactive Explorer",
  description:
    "Explore word embeddings interactively. Visualize vector representations, compute cosine similarities, and see how vector arithmetic captures analogical relationships like king − man + woman ≈ queen.",
};

export default function EmbeddingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/llm" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">LLM</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Embeddings</span>
        </nav>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">💬 Word Embeddings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Interactive playground — select words, visualize vectors, and explore cosine similarity</p>
          </div>
          <Link
            href="/llm/embeddings-playground"
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Deep Dive →
          </Link>
        </div>
        <EmbeddingExplorer />
      </div>
    </main>
  );
}
