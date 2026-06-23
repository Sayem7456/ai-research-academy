import Link from 'next/link';
import { FasterRCNNVisualizer, FasterRCNNAdvancedDive } from '@/features/computer-vision/components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Faster R-CNN — AI Research Academy",
  description:
    "Learn about Faster R-CNN with an interactive visualization. See how the region proposal network and detection network work together.",
};

export default function FasterRCNNPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cv" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Computer Vision</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Faster R-CNN</span>
        </nav>
        <FasterRCNNVisualizer />
        <FasterRCNNAdvancedDive />
      </div>
    </main>
  );
}
