import Link from 'next/link';

export default function CVIndex() {
  const visualizations = [
    {
      title: 'CNN (Convolutional Neural Networks)',
      description: 'Interactive visualization of convolution, activation, and pooling operations. See how CNNs extract features from images.',
      href: '/cv/cnn',
      icon: '🔲',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    },
    {
      title: 'ResNet (Residual Networks)',
      description: 'Explore skip connections that enable training very deep networks. Understand residual learning.',
      href: '/cv/resnet',
      icon: '🔗',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    },
    {
      title: 'U-Net',
      description: 'Encoder-decoder architecture for semantic segmentation. See how skip connections preserve spatial details.',
      href: '/cv/unet',
      icon: '🎯',
      color: 'bg-green-50 border-green-200 hover:border-green-400',
    },
    {
      title: 'Vision Transformer (ViT)',
      description: 'Apply Transformer architecture to images via patch embeddings. Explore self-attention for vision.',
      href: '/cv/vision-transformer',
      icon: '👁️',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    },
    {
      title: 'YOLO (You Only Look Once)',
      description: 'Real-time object detection with single-stage architecture. Understand multi-scale predictions.',
      href: '/cv/yolo',
      icon: '⚡',
      color: 'bg-red-50 border-red-200 hover:border-red-400',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            👁️ Computer Vision
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interactive visualizations of deep learning architectures for computer vision.
            Explore CNNs, ResNets, U-Net, Vision Transformers, and object detection models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualizations.map((viz) => (
            <Link
              key={viz.href}
              href={viz.href}
              className={`block p-6 border-2 rounded-lg transition-all ${viz.color}`}
            >
              <div className="text-4xl mb-3">{viz.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {viz.title}
              </h2>
              <p className="text-sm text-gray-600">
                {viz.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Computer Vision Learning Path</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Foundations: CNN</h3>
                <p className="text-gray-600">
                  Start with convolutional neural networks. Understand convolution, pooling, and how local features are extracted.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Deep Networks: ResNet</h3>
                <p className="text-gray-600">
                  Learn how skip connections solve vanishing gradients, enabling networks with 50-152 layers.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Segmentation: U-Net</h3>
                <p className="text-gray-600">
                  Explore encoder-decoder architectures for pixel-wise prediction. Essential for medical imaging.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Transformers: ViT</h3>
                <p className="text-gray-600">
                  Discover how Transformers (from NLP) apply to vision through patch embeddings and self-attention.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">5️⃣</span>
              <div>
                <h3 className="font-semibold text-base mb-1">Detection: YOLO</h3>
                <p className="text-gray-600">
                  Master real-time object detection with single-stage architectures and multi-scale predictions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
