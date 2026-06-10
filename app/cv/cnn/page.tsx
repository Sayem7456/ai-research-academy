import Link from 'next/link';
import { ConvolutionExplorer } from '@/features/computer-vision/components';

export default function CNNPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex gap-3 text-sm">
          <Link href="/cv/cnn/layers" className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            CNN Layer Viewer →
          </Link>
          <Link href="/cv/cnn/pooling" className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Pooling Simulator →
          </Link>
        </div>
        <ConvolutionExplorer />
      </div>
    </main>
  );
}
