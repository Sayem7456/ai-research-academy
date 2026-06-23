import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reading Papers — AI Research Academy',
  description: 'Learn to efficiently read and understand AI research papers using the three-pass approach and structured reading checklists.',
};

export default function ReadingPapersPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/research" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Research</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Reading Papers</span>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
          <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              📄 Reading Papers
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {['research', 'papers', 'reading'].map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <h2>The Three-Pass Approach</h2>
            
            <h3>Pass 1: Skim (5-10 minutes)</h3>
            <p>Read the title, abstract, and introduction. Look at figures and their captions. Read the conclusion. This gives you the big picture.</p>
            <ul>
              <li>What problem do they solve?</li>
              <li>What is their approach?</li>
              <li>What are the main results?</li>
            </ul>

            <h3>Pass 2: Understand (30-60 minutes)</h3>
            <p>Read more carefully, focusing on figures and methods. Skip proofs and derivations on first pass.</p>
            <ul>
              <li>How does their method work?</li>
              <li>What are the key innovations?</li>
              <li>How do they evaluate?</li>
            </ul>

            <h3>Pass 3: Deep Dive (2+ hours)</h3>
            <p>Read everything. Critically evaluate. Think about how you would implement it.</p>
            <ul>
              <li>Are the claims supported by evidence?</li>
              <li>What are the limitations?</li>
              <li>How could this be improved?</li>
            </ul>

            <h2>Reading Checklist</h2>
            <ol>
              <li><strong>Abstract</strong> - What is the paper about?</li>
              <li><strong>Introduction</strong> - Why is this important?</li>
              <li><strong>Related Work</strong> - What came before?</li>
              <li><strong>Method</strong> - How does it work?</li>
              <li><strong>Experiments</strong> - Does it work?</li>
              <li><strong>Conclusion</strong> - What are the key takeaways?</li>
              <li><strong>References</strong> - What should I read next?</li>
            </ol>

            <h2>Critical Reading</h2>
            <ul>
              <li>Are the experiments fair?</li>
              <li>Is the baseline comparison appropriate?</li>
              <li>Are there potential biases in the dataset?</li>
              <li>Do the results actually support the claims?</li>
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
