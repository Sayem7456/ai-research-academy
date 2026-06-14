'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TransformerAnimation } from '@/features/llm/components';

export default function TransformerPage() {
  const [activeView, setActiveView] = useState<'encoder' | 'decoder' | 'seq2seq'>('encoder');

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/llm" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">LLM</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Transformer</span>
        </nav>
        <TransformerAnimation onViewChange={setActiveView} />
        <div className="mt-6 text-center">
          <Link
            href={activeView === 'decoder' ? '/llm/decoder-math' : '/llm/encoder-math'}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {activeView === 'decoder' ? 'Decoder Math & Code →' : 'Encoder Math & Code →'}
          </Link>
          <p className="text-xs text-gray-500 mt-2">Deep dive into the mathematics and PyTorch implementation</p>
        </div>
      </div>
    </main>
  );
}
