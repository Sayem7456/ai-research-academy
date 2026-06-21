import Link from 'next/link';

export default function BenchmarkingPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Research</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Benchmarking</span>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              📄 Benchmarking
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {['research', 'benchmarking', 'evaluation'].map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <h2>Designing Good Experiments</h2>
            
            <h3>Fair Comparison</h3>
            <ul>
              <li>Use the same dataset splits</li>
              <li>Use the same preprocessing</li>
              <li>Report confidence intervals</li>
              <li>Tune hyperparameters fairly (same budget for all methods)</li>
            </ul>

            <h3>Metrics</h3>
            <p>Choose metrics that match the task:</p>
            <ul>
              <li><strong>Classification:</strong> Accuracy, F1, AUC-ROC</li>
              <li><strong>Detection:</strong> mAP, IoU</li>
              <li><strong>Generation:</strong> BLEU, ROUGE, human eval</li>
              <li><strong>Ranking:</strong> NDCG, MRR</li>
            </ul>

            <h2>Reporting Results</h2>
            <ul>
              <li>Report mean and standard deviation</li>
              <li>Bold the best result</li>
              <li>Include all baselines</li>
              <li>Use appropriate statistical tests</li>
            </ul>

            <h2>Common Mistakes</h2>
            <ol>
              <li>Cherry-picking results</li>
              <li>Not reporting variance</li>
              <li>Comparing on different splits</li>
              <li>Ignoring computational cost</li>
              <li>Overfitting to benchmark metrics</li>
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
