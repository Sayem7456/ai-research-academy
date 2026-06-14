import Link from 'next/link';
import type { Metadata } from 'next';
import { DecoderMathPage } from '@/features/llm/components';

export const metadata: Metadata = {
  title: 'Transformer Decoder: Math & Code — AI Research Academy',
  description:
    'Complete mathematical intuition behind the Transformer decoder with PyTorch implementations. Covers masked self-attention, cross-attention, causal masking, autoregressive generation, and weight tying.',
  openGraph: {
    title: 'Transformer Decoder: Math & Code',
    description:
      'Deep dive into Transformer decoder mathematics with step-by-step derivations and PyTorch code.',
  },
};

export default function DecoderMathRoute() {
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
          <span className="text-gray-900 dark:text-gray-100 font-medium">Decoder Math & Code</span>
        </nav>
        <DecoderMathPage />
      </div>
    </main>
  );
}
