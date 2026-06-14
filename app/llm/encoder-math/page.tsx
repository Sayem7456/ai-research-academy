import Link from 'next/link';
import type { Metadata } from 'next';
import { EncoderMathPage } from '@/features/llm/components';

export const metadata: Metadata = {
  title: 'Transformer Encoder: Math & Code — AI Research Academy',
  description:
    'Complete mathematical intuition behind the Transformer encoder with PyTorch implementations. Covers embeddings, positional encoding, self-attention, multi-head attention, residual connections, layer normalization, and feed-forward networks.',
  openGraph: {
    title: 'Transformer Encoder: Math & Code',
    description:
      'Deep dive into Transformer encoder mathematics with step-by-step derivations and PyTorch code.',
  },
};

export default function EncoderMathRoute() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/llm" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">LLM</Link>
          <span>/</span>
          <Link href="/llm/transformer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Transformer</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Encoder Math & Code</span>
        </nav>
        <EncoderMathPage />
        <div className="mt-6 text-center">
          <Link
            href="/llm/decoder-math"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Decoder Math & Code →
          </Link>
          <p className="text-xs text-gray-500 mt-2">Continue to Transformer Decoder deep dive</p>
        </div>
      </div>
    </main>
  );
}
