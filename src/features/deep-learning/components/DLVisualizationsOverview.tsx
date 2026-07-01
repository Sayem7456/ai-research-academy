'use client';

import Link from 'next/link';

const visualizations = [
  {
    title: 'Perceptron Playground',
    description: 'A single neuron with adjustable weights, bias, and activation functions. See the decision boundary move in real-time.',
    href: '/dl/perceptron',
    icon: '⚡',
    color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600',
  },
  {
    title: 'Backpropagation Visualizer',
    description: 'Step through forward pass, loss, backward pass, and weight update. Watch a single neuron learn.',
    href: '/dl/backpropagation',
    icon: '🔄',
    color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
  },
  {
    title: 'Loss Landscape Explorer',
    description: 'Visualize how SGD, Momentum, and Adam navigate a 3D loss surface to find the minimum.',
    href: '/dl/optimization',
    icon: '🏔️',
    color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
  },
  {
    title: 'Regularization Demo',
    description: 'See how dropout, L2 weight decay, and data augmentation prevent overfitting on polynomial regression.',
    href: '/dl/regularization',
    icon: '🛡️',
    color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
  },
  {
    title: 'CNN Filter Visualizer',
    description: 'Apply edge, blur, sharpen, and emboss filters to images. See how 3x3 convolution transforms pixel values.',
    href: '/dl/cnns',
    icon: '🖼️',
    color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
  },
  {
    title: 'RNN Sequence Visualizer',
    description: 'Watch RNN, LSTM, and GRU cells process text tokens step-by-step, maintaining hidden state.',
    href: '/dl/rnns',
    icon: '📝',
    color: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600',
  },
  {
    title: 'Transfer Learning Playground',
    description: 'Compare feature extraction, fine-tuning, and training from scratch. See how dataset size affects accuracy.',
    href: '/dl/transfer-learning',
    icon: '🔀',
    color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600',
  },
  {
    title: 'VAE Latent Space Explorer',
    description: 'Sample from a VAE latent space, interpolate between points, and watch smooth transitions in output.',
    href: '/dl/generative',
    icon: '🎨',
    color: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600',
  },
];

export default function DLVisualizationsOverview() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🧠 Interactive Visualizations
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore deep learning concepts through interactive playgrounds — from perceptrons
          and backpropagation to CNNs, RNNs, and generative models.
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
    </div>
  );
}
