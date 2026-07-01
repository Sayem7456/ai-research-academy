import type { DLCategory, DLCategoryId, DLLesson, DLTopic } from '../types';

export const DL_CATEGORIES: DLCategory[] = [
  {
    id: 'foundations',
    title: 'Neural Network Foundations',
    description: 'The building blocks of deep learning — from single neurons to the backpropagation algorithm that makes learning possible.',
    icon: '⚡',
    color: '#8B5CF6',
    totalLessons: 2,
  },
  {
    id: 'training',
    title: 'Training Techniques',
    description: 'Optimization algorithms and regularization methods that train models efficiently and prevent overfitting.',
    icon: '🛠️',
    color: '#3B82F6',
    totalLessons: 2,
  },
  {
    id: 'architectures',
    title: 'Network Architectures',
    description: 'CNNs for vision and RNNs for sequences — the specialized architectures that power modern AI applications.',
    icon: '🏗️',
    color: '#F59E0B',
    totalLessons: 2,
  },
  {
    id: 'advanced',
    title: 'Advanced Topics',
    description: 'Transfer learning and generative models — reusing pre-trained networks and creating new data from scratch.',
    icon: '🚀',
    color: '#14B8A6',
    totalLessons: 2,
  },
];

const foundationsLessons: DLLesson[] = [
  {
    id: 'dl-perceptron',
    title: 'Perceptron & Activations',
    slug: 'dl-perceptron',
    categoryId: 'foundations',
    description: 'A single neuron with adjustable weights, bias, and activation functions — the fundamental building block of all neural networks.',
    order: 1,
    topics: ['Biological inspiration', 'Weighted sum', 'Activation functions', 'Decision boundary', 'Limitations of single neuron'],
    visualComponents: ['Interactive neuron', 'Decision boundary explorer'],
  },
  {
    id: 'dl-backpropagation',
    title: 'Backpropagation',
    slug: 'dl-backpropagation',
    categoryId: 'foundations',
    description: 'The chain rule applied to neural networks — forward pass, loss computation, backward pass, and weight update.',
    order: 2,
    topics: ['Computational graphs', 'Chain rule', 'Forward pass', 'Loss computation', 'Gradient computation', 'Weight update'],
    visualComponents: ['Step-by-step visualizer', 'Gradient flow animation'],
    prerequisites: ['dl-perceptron'],
  },
];

const trainingLessons: DLLesson[] = [
  {
    id: 'dl-optimization',
    title: 'Optimization',
    slug: 'dl-optimization',
    categoryId: 'training',
    description: 'SGD, Momentum, Adam, and learning rate schedules — how optimizers navigate the loss landscape to find minima.',
    order: 1,
    topics: ['Gradient descent variants', 'SGD with momentum', 'Adam optimizer', 'Learning rate schedules', 'Loss landscape geometry'],
    visualComponents: ['3D loss landscape explorer', 'Optimizer trajectory comparison'],
    prerequisites: ['dl-backpropagation'],
  },
  {
    id: 'dl-regularization',
    title: 'Regularization',
    slug: 'dl-regularization',
    categoryId: 'training',
    description: 'Dropout, L1/L2 weight decay, data augmentation, and early stopping — techniques to prevent overfitting.',
    order: 2,
    topics: ['Overfitting', 'L1 vs L2 regularization', 'Dropout', 'Data augmentation', 'Early stopping', 'Batch normalization'],
    visualComponents: ['Regularization comparison demo', 'Overfitting visualization'],
    prerequisites: ['dl-optimization'],
  },
];

const architecturesLessons: DLLesson[] = [
  {
    id: 'dl-cnns',
    title: 'Convolutional Neural Networks',
    slug: 'dl-cnns',
    categoryId: 'architectures',
    description: 'Convolution, pooling, and feature maps — how specialized neural networks process visual information.',
    order: 1,
    topics: ['Convolution operation', 'Filters and kernels', 'Stride and padding', 'Pooling layers', 'Feature map visualization'],
    visualComponents: ['Filter visualizer', 'Convolution animation'],
    prerequisites: ['dl-backpropagation'],
  },
  {
    id: 'dl-rnns',
    title: 'RNNs & LSTMs',
    slug: 'dl-rnns',
    categoryId: 'architectures',
    description: 'Recurrent neural networks, LSTM gates, and GRU cells — processing sequential data with memory.',
    order: 2,
    topics: ['Sequential data', 'Hidden state', 'RNN cell', 'LSTM gates', 'GRU', 'Vanishing gradients'],
    visualComponents: ['Sequence processing animation', 'Gate activation viewer'],
    prerequisites: ['dl-backpropagation'],
  },
];

const advancedLessons: DLLesson[] = [
  {
    id: 'dl-transfer-learning',
    title: 'Transfer Learning',
    slug: 'dl-transfer-learning',
    categoryId: 'advanced',
    description: 'Reusing pre-trained models with feature extraction and fine-tuning — training better models with less data.',
    order: 1,
    topics: ['Pre-trained models', 'Feature extraction', 'Fine-tuning', 'Dataset size impact', 'Domain adaptation'],
    visualComponents: ['Transfer learning comparison playground'],
    prerequisites: ['dl-cnns'],
  },
  {
    id: 'dl-generative',
    title: 'Generative Models',
    slug: 'dl-generative',
    categoryId: 'advanced',
    description: 'Autoencoders, VAEs, and latent spaces — learning data distributions to generate new samples.',
    order: 2,
    topics: ['Autoencoders', 'Variational autoencoders', 'Latent space', 'Reparameterization trick', 'Interpolation'],
    visualComponents: ['VAE latent space explorer', 'Interpolation visualizer'],
    prerequisites: ['dl-backpropagation'],
  },
];

export const DL_TOPICS: DLTopic[] = [
  { category: DL_CATEGORIES[0], lessons: foundationsLessons },
  { category: DL_CATEGORIES[1], lessons: trainingLessons },
  { category: DL_CATEGORIES[2], lessons: architecturesLessons },
  { category: DL_CATEGORIES[3], lessons: advancedLessons },
];

export const ALL_DL_LESSONS: DLLesson[] = [
  ...foundationsLessons,
  ...trainingLessons,
  ...architecturesLessons,
  ...advancedLessons,
];

export const TOTAL_DL_LESSONS = ALL_DL_LESSONS.length;
