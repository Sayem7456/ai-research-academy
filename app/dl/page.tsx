import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deep Learning Visualizations — AI Research Academy',
  description: 'Interactive visualizations for understanding deep learning: perceptrons, backpropagation, optimization, regularization, CNNs, RNNs, transfer learning, and generative models.',
};

export default function DLIndex() {
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
      description: 'Apply edge, blur, sharpen, and emboss filters to images. See how 3×3 convolution transforms pixel values.',
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🧠 Deep Learning
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Neural networks from perceptrons to generative models. Interactive visualizations of
            forward/backward propagation, optimization, CNNs, RNNs, and more.
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Deep Learning Learning Path</h2>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-3">
              <span className="text-2xl select-none">1️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Perceptron & Activations</h3>
                <p className="text-gray-600 dark:text-gray-400">The building block of all neural networks. Understand weights, bias, and activation functions.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">2️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Backpropagation</h3>
                <p className="text-gray-600 dark:text-gray-400">How neural networks learn. Chain rule, computational graphs, gradient flow.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">3️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Optimization</h3>
                <p className="text-gray-600 dark:text-gray-400">SGD, Adam, learning rate schedules. How to navigate the loss landscape efficiently.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">4️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Regularization</h3>
                <p className="text-gray-600 dark:text-gray-400">Dropout, batch norm, weight decay. Prevent overfitting and improve generalization.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">5️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">CNNs</h3>
                <p className="text-gray-600 dark:text-gray-400">Convolution, pooling, feature maps. How computers see and understand images.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">6️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">RNNs & LSTMs</h3>
                <p className="text-gray-600 dark:text-gray-400">Processing sequences. Hidden states, gates, and handling long-range dependencies.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">7️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Transfer Learning</h3>
                <p className="text-gray-600 dark:text-gray-400">Reusing pre-trained models. Feature extraction vs fine-tuning strategies.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">8️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Generative Models</h3>
                <p className="text-gray-600 dark:text-gray-400">Autoencoders, VAEs, and latent spaces. Creating new data by learning distributions.</p>
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
