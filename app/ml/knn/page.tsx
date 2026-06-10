import type { Metadata } from "next";
import Link from "next/link";
import KNNVisualizer from "@/features/machine-learning/components/visualizations/KNNVisualizer";

export const metadata: Metadata = {
  title: "K-Nearest Neighbors (KNN) — Interactive Visualizer",
  description:
    "Learn K-Nearest Neighbors with an interactive visualization. Add training points, adjust K, and see real-time classification decision boundaries.",
};

export default function KNNPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/ml" className="hover:text-gray-900 transition-colors">Machine Learning</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">K-Nearest Neighbors</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">K-Nearest Neighbors (KNN)</h1>
            <p className="text-gray-600 mt-1">Interactive playground — click on the canvas to add points and explore</p>
          </div>
          <Link
            href="/content/ml/ml-knn"
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            View Full Lesson →
          </Link>
        </div>

        <KNNVisualizer />
      </div>
    </main>
  );
}
