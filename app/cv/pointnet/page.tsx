import Link from 'next/link';
import type { Metadata } from 'next';
import { PointNetExplorer, PointNetAdvancedDive } from '@/features/computer-vision/components';

export const metadata: Metadata = {
  title: 'PointNet / 3D Vision — AI Research Academy',
  description: 'Explore PointNet and 3D vision: deep learning on point clouds, spatial transformations, and 3D object recognition.',
};

export default function PointNetPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cv" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Computer Vision</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">PointNet</span>
        </nav>
        <PointNetExplorer />
        <div className="mt-8">
          <PointNetAdvancedDive />
        </div>
      </div>
    </main>
  );
}
