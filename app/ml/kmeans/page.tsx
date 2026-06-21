import type { Metadata } from "next";
import Link from "next/link";
import KMeansAnimation from '@/features/machine-learning/components/visualizations/KMeansAnimation';

export const metadata: Metadata = {
  title: "K-Means Clustering — Interactive Visualizer",
  description:
    "Learn K-Means clustering with an interactive animation. Add points, adjust K, and watch centroids converge step by step.",
};

export default function KMeansPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/ml" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Machine Learning</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">K-Means Clustering</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🤖 K-Means Clustering</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Interactive playground — click on the canvas to add points and explore</p>
          </div>
          <Link
            href="/content/ml/ml-kmeans"
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all"
          >
            View Full Lesson →
          </Link>
        </div>

        <KMeansAnimation />
      </div>
    </main>
  );
}
