import Link from 'next/link';

export default function WritingPapersPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Research</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Writing Papers</span>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Writing Papers
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {['research', 'writing', 'communication'].map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <h2>Paper Structure</h2>
            
            <h3>Abstract (150-300 words)</h3>
            <ol>
              <li>Problem statement (1-2 sentences)</li>
              <li>Gap in existing work (1 sentence)</li>
              <li>Your approach (1-2 sentences)</li>
              <li>Key results (1-2 sentences)</li>
            </ol>

            <h3>Introduction (1-2 pages)</h3>
            <ol>
              <li><strong>Motivation:</strong> Why is this problem important?</li>
              <li><strong>Background:</strong> What existing work exists?</li>
              <li><strong>Gap:</strong> What is missing?</li>
              <li><strong>Contribution:</strong> What do you propose?</li>
              <li><strong>Results:</strong> What are your main findings?</li>
            </ol>

            <h3>Method (3-5 pages)</h3>
            <ol>
              <li>Problem formulation</li>
              <li>Overview of your approach</li>
              <li>Detailed description of each component</li>
              <li>Training procedure</li>
              <li>Implementation details</li>
            </ol>

            <h3>Experiments (3-5 pages)</h3>
            <ol>
              <li><strong>Setup:</strong> Datasets, metrics, baselines</li>
              <li><strong>Main Results:</strong> Comparison with baselines</li>
              <li><strong>Analysis:</strong> Why does it work?</li>
              <li><strong>Ablation:</strong> What matters?</li>
            </ol>

            <h2>Writing Tips</h2>
            <ol>
              <li><strong>Write the abstract last</strong> - it summarizes the whole paper</li>
              <li><strong>Use active voice</strong> - &ldquo;We propose&rdquo; not &ldquo;It is proposed&rdquo;</li>
              <li><strong>Be specific</strong> - &ldquo;95.2%&rdquo; not &ldquo;high accuracy&rdquo;</li>
              <li><strong>Use figures</strong> - They convey complex ideas quickly</li>
              <li><strong>Cite properly</strong> - Give credit where it&apos;s due</li>
            </ol>

            <h2>Common Mistakes</h2>
            <ul>
              <li>Overselling contributions</li>
              <li>Ignoring limitations</li>
              <li>Poor figure quality</li>
              <li>Missing important citations</li>
              <li>Inconsistent notation</li>
            </ul>
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
