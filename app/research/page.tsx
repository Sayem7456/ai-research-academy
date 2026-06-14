import Link from 'next/link';
import { PaperLibrary } from '@/features/research/components';

export default function ResearchIndex() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📄 Research Skills
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Learn how to read, reproduce, and write AI research papers. Build the skills
            needed to become an effective AI researcher.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Research Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Reading Papers',
                description: 'Efficiently read and understand AI research papers using the three-pass approach.',
                href: '/research/reading-papers',
                icon: '📖',
                color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400',
              },
              {
                title: 'Reproducing Papers',
                description: 'Step-by-step guide to reproducing research results from scratch.',
                href: '/research/reproducing-papers',
                icon: '🔄',
                color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:border-green-400',
              },
              {
                title: 'Benchmarking',
                description: 'How to properly evaluate and compare models with fair experiments.',
                href: '/research/benchmarking',
                icon: '📊',
                color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400',
              },
              {
                title: 'Ablation Studies',
                description: 'Systematically remove components to understand what matters in your method.',
                href: '/research/ablation-studies',
                icon: '🧪',
                color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400',
              },
              {
                title: 'Writing Papers',
                description: 'Structure and write effective research papers that get accepted.',
                href: '/research/writing-papers',
                icon: '✍️',
                color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-400',
              },
            ].map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                className={`block p-6 border-2 rounded-lg transition-all active:scale-95 ${topic.color}`}
              >
                <div className="text-4xl mb-3 select-none pointer-events-none">{topic.icon}</div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {topic.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {topic.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Paper Library</h2>
          <PaperLibrary />
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 active:scale-95 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
