import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reproducing Papers — AI Research Academy',
  description: 'A roadmap for reproducing AI research papers: common pitfalls, best practices, and systematic experiment design.',
};

export default function ReproducingPapersPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Research</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Reproducing Papers</span>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              📄 Reproducing Papers
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {['research', 'reproduction', 'implementation'].map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <h2>Reproduction Roadmap</h2>
            
            <h3>1. Understand</h3>
            <p>Before writing code, thoroughly understand the paper. What is the core contribution? What are the key equations? What is the training procedure?</p>

            <h3>2. Reimplement</h3>
            <p>Build from scratch, not from the authors&apos; code. Start with a simple baseline, add complexity incrementally, and verify each component works.</p>

            <h3>3. Compare</h3>
            <p>Compare your results with the paper. Are the numbers close? Where do they differ and why? What implementation details matter?</p>

            <h2>Common Pitfalls</h2>
            <ul>
              <li><strong>Wrong hyperparameters</strong> - Check supplementary materials</li>
              <li><strong>Different data preprocessing</strong> - Follow the paper exactly</li>
              <li><strong>Missing regularization</strong> - Look for details in code repos</li>
              <li><strong>Random seed sensitivity</strong> - Report mean and std over multiple runs</li>
            </ul>

            <h2>Best Practices</h2>
            <ol>
              <li>Use the same dataset splits as the paper</li>
              <li>Report metrics using the same formulas</li>
              <li>Test on the same hardware if possible</li>
              <li>Document everything - even failed attempts</li>
              <li>Share your code for others to verify</li>
            </ol>
          </div>
        </article>

        <div className="mt-6 text-center">
          <Link
            href="/research"
            className="inline-block px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-95 transition-all"
          >
            ← Back to Research
          </Link>
        </div>
      </div>
    </main>
  );
}
