import Link from 'next/link';
import { ConvolutionExplorer } from '@/features/computer-vision/components';

export default function CNNPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cv" className="hover:text-blue-600 transition-colors">Computer Vision</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">CNN</span>
          <span className="mx-3 text-gray-300">|</span>
          <Link href="/cv/cnn/layers" className="text-blue-600 hover:text-blue-800 transition-colors">
            Layer Viewer
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/cv/cnn/pooling" className="text-blue-600 hover:text-blue-800 transition-colors">
            Pooling
          </Link>
        </nav>
        <ConvolutionExplorer />
      </div>
    </main>
  );
}
