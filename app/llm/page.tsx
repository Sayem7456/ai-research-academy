import Link from 'next/link';

export default function LLMIndex() {
  const visualizations = [
    {
      title: 'Tokenization Explorer',
      description: 'See how different tokenization algorithms split text into tokens for LLM processing.',
      href: '/llm/tokenization',
      icon: '🔤',
      color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
    },
    {
      title: 'Embedding Explorer',
      description: 'Explore word embeddings and cosine similarity in dense vector spaces.',
      href: '/llm/embeddings',
      icon: '📊',
      color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
    },
    {
      title: 'Embedding Playground',
      description: 'Advanced deep dive — analogies, nearest neighbors, 2D projections, bias exploration, and more.',
      href: '/llm/embeddings-playground',
      icon: '🔬',
      color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600',
    },
    {
      title: 'Attention Visualizer',
      description: 'Visualize self-attention weights and see how tokens attend to each other.',
      href: '/llm/attention',
      icon: '🧠',
      color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
    },
    {
      title: 'QKV Visualizer',
      description: 'Understand Query, Key, and Value projections in Transformer attention.',
      href: '/llm/qkv',
      icon: '⚡',
      color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600',
    },
    {
      title: 'Transformer Animation',
      description: 'Watch how data flows through a Transformer layer with animated visualization.',
      href: '/llm/transformer',
      icon: '🔄',
      color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600',
    },
    {
      title: 'Positional Encoding Explorer',
      description: 'Explore sinusoidal positional encodings and understand how order is injected.',
      href: '/llm/positional-encoding',
      icon: '🌊',
      color: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600',
    },
    {
      title: 'RAG Pipeline Explorer',
      description: 'See how Retrieval-Augmented Generation grounds LLM responses in external knowledge.',
      href: '/llm/rag',
      icon: '📚',
      color: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600',
    },
    {
      title: 'Agent Workflow Visualizer',
      description: 'Watch LLM agents use tools in a Think-Act-Observe loop to solve complex tasks.',
      href: '/llm/agents',
      icon: '🤖',
      color: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            💬 Large Language Models
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive visualizations of LLM concepts: tokenization, embeddings, attention, 
            Transformers, and modern techniques like RAG and agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualizations.map((viz) => (
            <Link
              key={viz.href}
              href={viz.href}
              className={`block p-6 border-2 rounded-lg transition-all active:scale-95 ${viz.color}`}
            >
              <div className="text-4xl mb-3 select-none pointer-events-none">{viz.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {viz.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {viz.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">LLM Learning Path</h2>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-3">
              <span className="text-2xl select-none">1️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Tokenization</h3>
                <p className="text-gray-600 dark:text-gray-400">Start by understanding how text is converted to tokens.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">2️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Embeddings</h3>
                <p className="text-gray-600 dark:text-gray-400">Learn how tokens are represented as dense vectors.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">3️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Attention</h3>
                <p className="text-gray-600 dark:text-gray-400">The mechanism that powers all modern Transformers.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">4️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Transformer</h3>
                <p className="text-gray-600 dark:text-gray-400">The architecture behind GPT, BERT, and all modern LLMs.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">5️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">RAG & Agents</h3>
                <p className="text-gray-600 dark:text-gray-400">Modern techniques for grounding and tool use.</p>
              </div>
            </div>
          </div>
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
