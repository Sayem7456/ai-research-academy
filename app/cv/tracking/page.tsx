import Link from 'next/link';
import { ObjectTrackingExplorer, TrackingAdvancedDive } from '@/features/computer-vision/components';

export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cv" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Computer Vision</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Object Tracking</span>
        </nav>
        <ObjectTrackingExplorer />
        <div className="mt-8">
          <TrackingAdvancedDive />
        </div>
      </div>
    </main>
  );
}
