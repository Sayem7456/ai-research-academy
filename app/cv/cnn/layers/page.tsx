import Link from 'next/link';
import { CNNLayerViewer } from '@/features/computer-vision/components';

export default function CNNLayerViewerPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Link href="/cv/cnn" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            ← Back to Convolution Explorer
          </Link>
        </div>
        <CNNLayerViewer />
      </div>
    </main>
  );
}
