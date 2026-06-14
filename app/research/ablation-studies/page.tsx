import Link from 'next/link';

export default function AblationStudiesPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Research</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Ablation Studies</span>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Ablation Studies
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {['research', 'ablation', 'methodology'].map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <h2>What Are Ablation Studies?</h2>
            <p>Ablation studies systematically remove or disable components of a system to understand their individual contributions. They answer: &ldquo;What actually matters?&rdquo;</p>

            <h2>What to Ablate</h2>
            <ul>
              <li><strong>Components:</strong> Remove each module and measure performance drop</li>
              <li><strong>Hyperparameters:</strong> Learning rate, batch size, model size</li>
              <li><strong>Data:</strong> Training set size, data quality, domain</li>
            </ul>

            <h2>Designing Ablation Experiments</h2>
            
            <h3>Single Ablation</h3>
            <p>Remove one component at a time:</p>
            <pre><code>Full model: 92.3%
- Component A: 89.1% (-3.2%)
- Component B: 91.0% (-1.3%)
- Component C: 92.1% (-0.2%)</code></pre>

            <h3>Interaction Effects</h3>
            <p>Check if components help more together than individually:</p>
            <pre><code>A alone: +3.2%
B alone: +1.3%
A+B together: +4.8% (synergy!)</code></pre>

            <h2>Reporting Ablation Results</h2>
            <ol>
              <li>Present results in a clear table</li>
              <li>Explain why each component helps</li>
              <li>Discuss which components are most important</li>
              <li>Acknowledge components that don&apos;t help much</li>
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
