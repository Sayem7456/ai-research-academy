import Link from 'next/link';
import { ConvolutionExplorer } from '@/features/computer-vision/components';

export default function CNNPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cv" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Computer Vision</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">CNN</span>
          <span className="mx-3 text-gray-300 dark:text-gray-600">|</span>
          <Link href="/cv/cnn/layers" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            Layer Viewer
          </Link>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <Link href="/cv/cnn/pooling" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            Pooling
          </Link>
        </nav>
        <ConvolutionExplorer />
      </div>
    </main>
  );
}
