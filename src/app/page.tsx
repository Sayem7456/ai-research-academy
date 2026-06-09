export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🎓 AI Research Learning Platform
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your journey from Mathematics to AI Research starts here
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <a
            href="/ml"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <div className="text-3xl mb-2">🤖</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Machine Learning
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Interactive ML algorithm visualizations
            </p>
          </a>

          <a
            href="/dashboard"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <div className="text-3xl mb-2">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your progress and view analytics
            </p>
          </a>
          
          <a
            href="/notes"
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <div className="text-3xl mb-2">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Notes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and manage your learning notes
            </p>
          </a>
        </div>
      </div>
    </main>
  )
}
