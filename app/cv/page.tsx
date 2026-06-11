import Link from 'next/link';

export default function CVIndex() {
  const visualizations = [
    {
      title: 'CNN (Convolutional Neural Networks)',
      description: 'Interactive visualization of convolution, activation, and pooling operations. See how CNNs extract features from images.',
      href: '/cv/cnn',
      icon: '🔲',
      color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
    },
    {
      title: 'ResNet (Residual Networks)',
      description: 'Explore skip connections that enable training very deep networks. Understand residual learning.',
      href: '/cv/resnet',
      icon: '🔗',
      color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600',
    },
    {
      title: 'Faster R-CNN & Mask R-CNN',
      description: 'Two-stage object detection with region proposals. RPN anchors, RoI pooling, and instance segmentation.',
      href: '/cv/faster-rcnn',
      icon: '📦',
      color: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600',
    },
    {
      title: 'YOLO (You Only Look Once)',
      description: 'Real-time object detection with single-stage architecture. Understand multi-scale predictions.',
      href: '/cv/yolo',
      icon: '⚡',
      color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600',
    },
    {
      title: 'U-Net',
      description: 'Encoder-decoder architecture for semantic segmentation. See how skip connections preserve spatial details.',
      href: '/cv/unet',
      icon: '🎯',
      color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600',
    },
    {
      title: 'Vision Transformer (ViT)',
      description: 'Apply Transformer architecture to images via patch embeddings. Explore self-attention for vision.',
      href: '/cv/vision-transformer',
      icon: '👁️',
      color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
    },
    {
      title: 'Attention Mechanisms (SE-Net, CBAM)',
      description: 'Channel and spatial attention in CNNs. Squeeze-and-excitation, CBAM, and self-attention for vision.',
      href: '/cv/attention',
      icon: '🧠',
      color: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600',
    },
    {
      title: 'GANs (Generative Adversarial Networks)',
      description: 'Interactive GAN training demo. Generator vs discriminator, minimax game, and distribution learning.',
      href: '/cv/gan',
      icon: '🎭',
      color: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600',
    },
    {
      title: 'Neural Style Transfer',
      description: 'Separate and recombine content and style using VGG. Content loss, style loss (Gram matrices), and optimization.',
      href: '/cv/style-transfer',
      icon: '🎨',
      color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600',
    },
    {
      title: 'Object Tracking (SORT/DeepSORT)',
      description: 'Track objects across video frames. Kalman filters, IoU matching, and appearance-based re-identification.',
      href: '/cv/tracking',
      icon: '🎯',
      color: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600',
    },
    {
      title: '3D Vision — PointNet',
      description: 'Deep learning on unordered point clouds. Shared MLPs, T-Net, and permutation-invariant aggregation.',
      href: '/cv/pointnet',
      icon: '🧊',
      color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 safe-top safe-bottom transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            👁️ Computer Vision
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive visualizations of deep learning architectures for computer vision.
            Explore CNNs, detection, segmentation, transformers, generative models, tracking, and 3D vision.
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Computer Vision Learning Path</h2>
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-3">
              <span className="text-2xl select-none">1️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Foundations: CNN</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start with convolutional neural networks. Understand convolution, pooling, and how local features are extracted.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">2️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Deep Networks: ResNet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Learn how skip connections solve vanishing gradients, enabling networks with 50-152 layers.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">3️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Segmentation: U-Net</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore encoder-decoder architectures for pixel-wise prediction. Essential for medical imaging.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">4️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Transformers: ViT</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover how Transformers (from NLP) apply to vision through patch embeddings and self-attention.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">5️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Two-Stage Detection: Faster R-CNN</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Understand region proposals, anchor boxes, RoI pooling, and instance segmentation with Mask R-CNN.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">6️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Object Tracking: SORT/DeepSORT</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Link detections across frames using Kalman filters, Hungarian matching, and appearance features.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">7️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Attention: SE-Net, CBAM, Self-Attention</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Learn how channel recalibration and spatial attention boost performance with minimal overhead.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">8️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Generative: GANs</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore adversarial training, generator vs discriminator dynamics, and distribution learning.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">9️⃣</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">Creative: Neural Style Transfer</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Combine content and style via VGG features and Gram matrix optimization.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl select-none">🔟</span>
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1">3D: PointNet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Process unordered point clouds directly with shared MLPs and permutation-invariant aggregation.
                </p>
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
