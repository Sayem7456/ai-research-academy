import type { Metadata } from "next";
import Link from "next/link";
import DecisionTreeBuilder from '@/features/machine-learning/components/visualizations/DecisionTreeBuilder';

export const metadata: Metadata = {
  title: "Decision Tree — Interactive Visualizer",
  description:
    "Learn Decision Trees with an interactive visualization. Add training points, adjust depth, and see how splits partition the feature space.",
};

export default function DecisionTreePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/ml" className="hover:text-gray-900 transition-colors">Machine Learning</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Decision Tree</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Decision Tree</h1>
            <p className="text-gray-600 mt-1">Interactive playground — click on the canvas to add points and explore</p>
          </div>
          <Link
            href="/content/ml/ml-decision-tree"
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            View Full Lesson →
          </Link>
        </div>

        <DecisionTreeBuilder />
      </div>
    </main>
  );
}
