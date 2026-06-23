import Link from 'next/link';
import type { Metadata } from 'next';
import { RAGPipelineExplorer } from '@/features/llm/components';

export const metadata: Metadata = {
  title: 'RAG Pipeline Explorer — AI Research Academy',
  description: 'Interactive visualization of Retrieval-Augmented Generation: document chunking, embedding, retrieval, and answer generation.',
};

export default function RAGPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/llm" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">LLM</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">RAG Pipeline</span>
        </nav>
        <RAGPipelineExplorer />
      </div>
    </main>
  );
}
