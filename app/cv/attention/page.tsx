import Link from 'next/link';
import type { Metadata } from 'next';
import { AdvancedAttentionPlayground } from '@/features/computer-vision/components';

export const metadata: Metadata = {
  title: 'Attention Mechanisms — AI Research Academy',
  description: 'Explore attention mechanisms in computer vision: SE-Net, CBAM, QKV, multi-head, GQA, Flash, and window attention with interactive visualizations.',
};

export default function AttentionPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cv" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Computer Vision</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Attention Mechanisms</span>
        </nav>
        <AdvancedAttentionPlayground />
      </div>
    </main>
  );
}
