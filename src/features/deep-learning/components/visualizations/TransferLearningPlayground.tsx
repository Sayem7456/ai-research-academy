'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';

type Architecture = 'resnet18' | 'vgg16' | 'efficientnet' | 'vit';
type Dataset = 'cifar10' | 'imagenette' | 'medical' | 'custom';
type ViewMode = 'interactive' | 'tutorial';
type Preset = 'extraction' | 'finetune-top' | 'finetune-all' | null;

interface LayerInfo {
  id: string;
  name: string;
  type: 'conv' | 'fc' | 'pool' | 'norm';
  frozen: boolean;
  params: number;
  outputShape: string;
  description: string;
}

interface TrainingState {
  isTraining: boolean;
  epoch: number;
  maxEpochs: number;
  trainLoss: number[];
  valLoss: number[];
  trainAcc: number[];
  valAcc: number[];
  learningRate: number;
  speed: number;
}

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  highlight?: string;
  action?: string;
}

const ARCHITECTURES: Record<Architecture, {
  name: string;
  description: string;
  layers: Omit<LayerInfo, 'frozen'>[];
  totalParams: number;
  top1Accuracy: number;
}> = {
  resnet18: {
    name: 'ResNet-18',
    description: 'Lightweight residual network with skip connections. Good balance of speed and accuracy.',
    layers: [
      { id: 'conv1', name: 'Conv1', type: 'conv', params: 9400, outputShape: '64×112×112', description: 'Initial 7×7 convolution, detects low-level features' },
      { id: 'bn1', name: 'BatchNorm1', type: 'norm', params: 128, outputShape: '64×112×112', description: 'Normalizes activations for stable training' },
      { id: 'layer1', name: 'ResBlock1', type: 'conv', params: 21500, outputShape: '64×56×56', description: 'Early layers: edges, textures, simple patterns' },
      { id: 'layer2', name: 'ResBlock2', type: 'conv', params: 83000, outputShape: '128×28×28', description: 'Mid layers: parts, shapes, motifs' },
      { id: 'layer3', name: 'ResBlock3', type: 'conv', params: 332000, outputShape: '256×14×14', description: 'Deep layers: complex patterns, object parts' },
      { id: 'layer4', name: 'ResBlock4', type: 'conv', params: 1320000, outputShape: '512×7×7', description: 'Top layers: high-level semantic features' },
      { id: 'avgpool', name: 'AvgPool', type: 'pool', params: 0, outputShape: '512×1×1', description: 'Global average pooling' },
      { id: 'fc', name: 'FC Layer', type: 'fc', params: 1000, outputShape: '1000', description: 'Final classification layer' },
    ],
    totalParams: 11689512,
    top1Accuracy: 69.8,
  },
  vgg16: {
    name: 'VGG-16',
    description: 'Deep architecture with uniform 3×3 convolutions. High accuracy but many parameters.',
    layers: [
      { id: 'block1', name: 'Block1 (Conv×2)', type: 'conv', params: 38700, outputShape: '64×224×224', description: 'First block: basic edge detection' },
      { id: 'pool1', name: 'Pool1', type: 'pool', params: 0, outputShape: '64×112×112', description: 'Downsampling' },
      { id: 'block2', name: 'Block2 (Conv×2)', type: 'conv', params: 221000, outputShape: '128×112×112', description: 'Texture patterns' },
      { id: 'pool2', name: 'Pool2', type: 'pool', params: 0, outputShape: '128×56×56', description: 'Downsampling' },
      { id: 'block3', name: 'Block3 (Conv×3)', type: 'conv', params: 1475000, outputShape: '256×56×56', description: 'Low-level parts' },
      { id: 'block4', name: 'Block4 (Conv×3)', type: 'conv', params: 2950000, outputShape: '512×28×28', description: 'Object parts' },
      { id: 'block5', name: 'Block5 (Conv×3)', type: 'conv', params: 2950000, outputShape: '512×14×14', description: 'Semantic features' },
      { id: 'fc1', name: 'FC1', type: 'fc', params: 102760000, outputShape: '4096', description: 'Dense classification' },
      { id: 'fc2', name: 'FC2', type: 'fc', params: 4096000, outputShape: '4096', description: 'Feature refinement' },
      { id: 'fc3', name: 'FC3', type: 'fc', params: 1000, outputShape: '1000', description: 'Final output' },
    ],
    totalParams: 138357544,
    top1Accuracy: 71.3,
  },
  efficientnet: {
    name: 'EfficientNet-B0',
    description: 'Compound-scaled architecture. Best accuracy/efficiency tradeoff.',
    layers: [
      { id: 'stem', name: 'Stem (Conv3×3)', type: 'conv', params: 410, outputShape: '32×112×112', description: 'Initial feature extraction' },
      { id: 'mb1', name: 'MBConv1', type: 'conv', params: 2400, outputShape: '16×112×112', description: 'Mobile inverted bottleneck block' },
      { id: 'mb2', name: 'MBConv2', type: 'conv', params: 8600, outputShape: '24×56×56', description: 'Depthwise separable convolution' },
      { id: 'mb3', name: 'MBConv3', type: 'conv', params: 24000, outputShape: '40×28×28', description: 'Efficient feature extraction' },
      { id: 'mb4', name: 'MBConv4', type: 'conv', params: 68000, outputShape: '80×14×14', description: 'Mid-level features' },
      { id: 'mb5', name: 'MBConv5', type: 'conv', params: 188000, outputShape: '112×14×14', description: 'Complex patterns' },
      { id: 'mb6', name: 'MBConv6', type: 'conv', params: 515000, outputShape: '192×7×7', description: 'High-level semantics' },
      { id: 'head', name: 'Head (Conv1×1)', type: 'conv', params: 128000, outputShape: '1280×7×7', description: 'Channel expansion' },
      { id: 'pool', name: 'GlobalAvgPool', type: 'pool', params: 0, outputShape: '1280×1×1', description: 'Spatial reduction' },
      { id: 'fc', name: 'FC Layer', type: 'fc', params: 1000, outputShape: '1000', description: 'Classification head' },
    ],
    totalParams: 5288548,
    top1Accuracy: 77.1,
  },
  vit: {
    name: 'Vision Transformer',
    description: 'Transformer-based architecture. State-of-the-art with large datasets.',
    layers: [
      { id: 'patch', name: 'Patch Embed', type: 'conv', params: 59000, outputShape: '196×192', description: 'Image → patch tokens' },
      { id: 'cls', name: 'CLS Token', type: 'fc', params: 192, outputShape: '1×192', description: 'Classification token' },
      { id: 'pos', name: 'Position Embed', type: 'fc', params: 38000, outputShape: '197×192', description: 'Spatial position encoding' },
      { id: 'block1', name: 'Transformer Block1', type: 'conv', params: 360000, outputShape: '197×192', description: 'Self-attention + FFN' },
      { id: 'block2', name: 'Transformer Block2', type: 'conv', params: 360000, outputShape: '197×192', description: 'Cross-patch attention' },
      { id: 'block3', name: 'Transformer Block3', type: 'conv', params: 360000, outputShape: '197×192', description: 'Global feature mixing' },
      { id: 'block4', name: 'Transformer Block4', type: 'conv', params: 360000, outputShape: '197×192', description: 'Deep representation' },
      { id: 'norm', name: 'Layer Norm', type: 'norm', params: 384, outputShape: '197×192', description: 'Final normalization' },
      { id: 'head', name: 'MLP Head', type: 'fc', params: 1000, outputShape: '1000', description: 'Classification output' },
    ],
    totalParams: 1498000,
    top1Accuracy: 81.8,
  },
};

const DATASETS: Record<Dataset, {
  name: string;
  description: string;
  size: number;
  classes: number;
  domainSimilarity: Record<Architecture, number>;
  imageExample: string;
}> = {
  cifar10: {
    name: 'CIFAR-10',
    description: '60K 32×32 color images in 10 classes (airplane, car, bird, etc.)',
    size: 60000,
    classes: 10,
    domainSimilarity: { resnet18: 0.7, vgg16: 0.7, efficientnet: 0.75, vit: 0.65 },
    imageExample: '🚗✈️🐕',
  },
  imagenette: {
    name: 'ImageNette',
    description: '10 easy classes from ImageNet. Real-world images at 224×224.',
    size: 13000,
    classes: 10,
    domainSimilarity: { resnet18: 0.95, vgg16: 0.95, efficientnet: 0.95, vit: 0.95 },
    imageExample: '🐕🐠🎪',
  },
  medical: {
    name: 'Medical Imaging',
    description: 'X-ray images for disease detection. Domain differs from ImageNet.',
    size: 5000,
    classes: 2,
    domainSimilarity: { resnet18: 0.3, vgg16: 0.3, efficientnet: 0.35, vit: 0.25 },
    imageExample: '🫁🔬💊',
  },
  custom: {
    name: 'Custom Dataset',
    description: 'User-defined dataset. Domain similarity depends on content.',
    size: 1000,
    classes: 5,
    domainSimilarity: { resnet18: 0.5, vgg16: 0.5, efficientnet: 0.5, vit: 0.5 },
    imageExample: '📊🎯🔧',
  },
};

const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 1, title: 'Welcome to Transfer Learning', content: 'Transfer learning reuses a pre-trained model on a new task. Instead of training from scratch, we start with knowledge learned from millions of images.' },
  { id: 2, title: 'Choose an Architecture', content: 'Different architectures have different strengths. ResNet is fast and reliable, EfficientNet is efficient, and ViT is state-of-the-art but needs more data.', highlight: 'architecture' },
  { id: 3, title: 'Select a Dataset', content: 'The dataset determines your task. Notice how "Domain Similarity" changes - higher means the pre-trained features transfer better.', highlight: 'dataset' },
  { id: 4, title: 'Freeze Layers', content: 'Click on layers to freeze/unfreeze them. Frozen layers keep their pre-trained weights. Unfrozen layers will be updated during training.', highlight: 'layers', action: 'Click on a layer to toggle its frozen state' },
  { id: 5, title: 'Adjust Dataset Size', content: 'Smaller datasets benefit more from transfer learning. Try reducing the size and see how accuracy drops for training from scratch vs. transfer learning.', highlight: 'datasetSize' },
  { id: 6, title: 'Start Training', content: 'Click "Start Training" to see the model learn. Watch the loss and accuracy curves. Notice how transfer learning converges faster.', highlight: 'training' },
  { id: 7, title: 'Compare Strategies', content: 'Try different combinations: freeze more layers for small datasets, unfreeze more for large datasets. The optimal strategy depends on your data.', highlight: 'comparison' },
  { id: 8, title: 'Key Takeaways', content: '1) Start with feature extraction (freeze all). 2) Fine-tune top layers if needed. 3) Use small learning rates. 4) More data → can unfreeze more layers.' },
];

export default function TransferLearningPlayground() {
  const [viewMode, setViewMode] = useState<ViewMode>('interactive');
  const [architecture, setArchitecture] = useState<Architecture>('resnet18');
  const [dataset, setDataset] = useState<Dataset>('cifar10');
  const [activePreset, setActivePreset] = useState<Preset>(null);
  const [layers, setLayers] = useState<LayerInfo[]>(() => {
    const arch = ARCHITECTURES['resnet18'];
    return arch.layers.map((l, i) => ({
      ...l,
      frozen: i < arch.layers.length - 2,
    }));
  });
  const [datasetSize, setDatasetSize] = useState(100);
  const [training, setTraining] = useState<TrainingState>({
    isTraining: false,
    epoch: 0,
    maxEpochs: 50,
    trainLoss: [],
    valLoss: [],
    trainAcc: [],
    valAcc: [],
    learningRate: 0.001,
    speed: 1,
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    setActivePreset(null);
    const arch = ARCHITECTURES[architecture];
    setLayers(arch.layers.map((l, i) => ({
      ...l,
      frozen: i < arch.layers.length - 2,
    })));
    resetTraining();
  }, [architecture]);

  const resetTraining = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setTraining(prev => ({
      isTraining: false,
      epoch: 0,
      maxEpochs: 50,
      trainLoss: [],
      valLoss: [],
      trainAcc: [],
      valAcc: [],
      learningRate: 0.001,
      speed: prev.speed,
    }));
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setActivePreset(null);
    setLayers(prev => prev.map(l =>
      l.id === layerId ? { ...l, frozen: !l.frozen } : l
    ));
    resetTraining();
  }, [resetTraining]);

  const trainableLayers = useMemo(() => layers.filter(l => !l.frozen), [layers]);
  const frozenLayers = useMemo(() => layers.filter(l => l.frozen), [layers]);
  const trainableParams = useMemo(() =>
    trainableLayers.reduce((sum, l) => sum + l.params, 0), [trainableLayers]);
  const totalParams = useMemo(() =>
    layers.reduce((sum, l) => sum + l.params, 0), [layers]);

  const domainSimilarity = DATASETS[dataset].domainSimilarity[architecture];

  const computeAccuracy = useCallback((epoch: number, isTransfer: boolean) => {
    const arch = ARCHITECTURES[architecture];
    const fraction = epoch / 50;
    const trainableRatio = trainableLayers.length / layers.length;
    const dataRatio = datasetSize / 1000;

    let accuracy: number;

    if (isTransfer) {
      // Transfer learning: feature extraction vs fine-tuning
      const isFeatureExtraction = trainableRatio <= 0.25;

      if (isFeatureExtraction) {
        // Feature extraction: freeze most layers, only train classifier
        // Good with small data + high similarity, limited ceiling
        const base = 30 + domainSimilarity * 35;
        const dataEffect = Math.min(dataRatio * 15, 15);
        const ceiling = 75 + domainSimilarity * 15;
        accuracy = base + dataEffect * fraction;
        accuracy = Math.min(accuracy, ceiling);
      } else {
        // Fine-tuning: unfreeze some layers
        // Better ceiling but needs more data, risk of overfitting with small data
        const base = 25 + domainSimilarity * 30;
        const dataEffect = Math.min(dataRatio * 25, 25);
        const overfitPenalty = dataRatio < 0.1 ? (0.1 - dataRatio) * 200 * trainableRatio : 0;
        const ceiling = 80 + domainSimilarity * 12;
        accuracy = base + dataEffect * fraction - overfitPenalty * (1 - fraction * 0.5);
        accuracy = Math.min(accuracy, ceiling);
      }
    } else {
      // Training from scratch
      // Needs lots of data, slow convergence
      const base = 10;
      const dataEffect = Math.min(dataRatio * 40, 40);
      const archBonus = (arch.top1Accuracy - 60) * 0.3;
      const ceiling = 55 + archBonus + dataRatio * 20;
      accuracy = base + (dataEffect + archBonus) * fraction;
      accuracy = Math.min(accuracy, ceiling);
    }

    // Small random noise for realism
    const noise = ((epoch * 7 + trainableLayers.length * 13) % 10 - 5) * 0.3;
    return Math.max(0, Math.min(98, accuracy + noise));
  }, [architecture, dataset, datasetSize, trainableLayers.length, layers.length, domainSimilarity]);

  const startTraining = useCallback(() => {
    resetTraining();
    setTraining(prev => ({ ...prev, isTraining: true }));

    let epoch = 0;
    const maxEpochs = 50;

    const trainStep = () => {
      if (epoch >= maxEpochs) {
        setTraining(prev => ({ ...prev, isTraining: false }));
        return;
      }

      const trainAcc = computeAccuracy(epoch, true);
      const valAcc = computeAccuracy(epoch, true) - 2 - Math.random() * 3;

      // Loss depends on accuracy: higher accuracy = lower loss
      const targetLoss = 2.5 * (1 - trainAcc / 100);
      const trainLoss = targetLoss + 0.05 + Math.random() * 0.05;
      const valLoss = trainLoss + 0.1 + Math.random() * 0.15;

      setTraining(prev => ({
        ...prev,
        epoch: Math.min(epoch + 1, maxEpochs),
        trainLoss: [...prev.trainLoss, trainLoss],
        valLoss: [...prev.valLoss, valLoss],
        trainAcc: [...prev.trainAcc, trainAcc],
        valAcc: [...prev.valAcc, Math.max(0, valAcc)],
      }));

      epoch++;
      const delay = Math.max(10, 200 / training.speed);
      animationRef.current = window.setTimeout(trainStep, delay) as unknown as number;
    };

    animationRef.current = window.setTimeout(trainStep, 100) as unknown as number;
  }, [computeAccuracy, resetTraining, training.speed]);

  const stopTraining = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setTraining(prev => ({ ...prev, isTraining: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  const getLayerColor = (layer: LayerInfo) => {
    if (layer.frozen) return { bg: '#6B7280', border: '#4B5563', text: 'FROZEN' };
    switch (layer.type) {
      case 'conv': return { bg: '#22C55E', border: '#16A34A', text: 'TRAIN' };
      case 'fc': return { bg: '#3B82F6', border: '#2563EB', text: 'TRAIN' };
      case 'pool': return { bg: '#A855F7', border: '#9333EA', text: 'STATIC' };
      case 'norm': return { bg: '#F59E0B', border: '#D97706', text: 'TRAIN' };
      default: return { bg: '#6366F1', border: '#4F46E5', text: 'TRAIN' };
    }
  };

  const formatParams = (params: number) => {
    if (params === 0) return '—';
    if (params < 1000) return `${params}`;
    if (params < 1000000) return `${(params / 1000).toFixed(1)}K`;
    return `${(params / 1000000).toFixed(2)}M`;
  };

  const currentStep = TUTORIAL_STEPS[tutorialStep];
  const finalAccuracy = training.trainAcc.length > 0 ? training.trainAcc[training.trainAcc.length - 1] : 0;

  const getHighlightClass = (section: string) => {
    if (viewMode !== 'tutorial' || !currentStep?.highlight) return '';
    return currentStep.highlight === section
      ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900'
      : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('interactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'interactive' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Interactive
          </button>
          <button
            onClick={() => { setViewMode('tutorial'); setTutorialStep(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'tutorial' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tutorial
          </button>
        </div>
      </div>

      {viewMode === 'tutorial' && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                Step {tutorialStep + 1}/{TUTORIAL_STEPS.length}
              </span>
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">{currentStep.title}</h4>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                disabled={tutorialStep === 0}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setTutorialStep(Math.min(TUTORIAL_STEPS.length - 1, tutorialStep + 1))}
                disabled={tutorialStep === TUTORIAL_STEPS.length - 1}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
          <p className="text-sm text-indigo-800 dark:text-indigo-200">{currentStep.content}</p>
          {currentStep.action && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
              👆 {currentStep.action}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 ${getHighlightClass('architecture')}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Model Architecture — {ARCHITECTURES[architecture].name}</h3>
              <div className="flex gap-2">
                <select
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value as Architecture)}
                  className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 cursor-pointer"
                >
                  <option value="resnet18">ResNet-18</option>
                  <option value="vgg16">VGG-16</option>
                  <option value="efficientnet">EfficientNet-B0</option>
                  <option value="vit">Vision Transformer</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              {layers.map((layer, i) => {
                const colors = getLayerColor(layer);
                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                    title={layer.description}
                  >
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{layer.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {layer.type}
                        </span>
                        {layer.frozen && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                            🔒
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{layer.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {formatParams(layer.params)}
                      </div>
                      <div
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: colors.bg + '20', color: colors.bg }}
                      >
                        {colors.text}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{trainableLayers.length}/{layers.length} layers trainable</span>
              <span>{formatParams(trainableParams)} / {formatParams(totalParams)} params</span>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 ${getHighlightClass('training')}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Training Progress</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Speed:</span>
                {[0.5, 1, 2, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setTraining(prev => ({ ...prev, speed: s }))}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                      training.speed === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Epoch</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{training.epoch}/{training.maxEpochs}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {training.epoch > 0 ? `${finalAccuracy.toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>

            <div className="h-32 relative bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
              {training.trainAcc.length > 1 ? (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <polyline
                    points={training.trainAcc.map((v, i) => `${(i / (training.maxEpochs - 1)) * 100},${100 - v}`).join(' ')}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points={training.valAcc.map((v, i) => `${(i / (training.maxEpochs - 1)) * 100},${100 - v}`).join(' ')}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  Start training to see accuracy curves
                </div>
              )}
              <div className="absolute bottom-1 right-2 flex gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-green-500 inline-block"></span> Train</span>
                <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-500 inline-block border-dashed"></span> Val</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-32 relative bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                {training.trainLoss.length > 1 ? (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <polyline
                      points={training.trainLoss.map((v, i) => `${(i / (training.maxEpochs - 1)) * 100},${100 - (v / 2.6) * 100}`).join(' ')}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                      points={training.valLoss.map((v, i) => `${(i / (training.maxEpochs - 1)) * 100},${100 - (v / 2.6) * 100}`).join(' ')}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                    Start training to see loss curves
                  </div>
                )}
                <div className="absolute top-1 left-2 text-[10px] text-gray-500">Loss</div>
                <div className="absolute bottom-1 right-2 flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-red-500 inline-block"></span> Train</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-500 inline-block border-dashed"></span> Val</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {!training.isTraining ? (
                <button
                  onClick={startTraining}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 transition-all cursor-pointer"
                >
                  ▶ Start Training
                </button>
              ) : (
                <button
                  onClick={stopTraining}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                >
                  ⏹ Stop
                </button>
              )}
              <button
                onClick={resetTraining}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                ↺ Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 ${getHighlightClass('dataset')}`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dataset</h3>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as Dataset)}
              className="w-full text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 mb-3 cursor-pointer"
            >
              <option value="cifar10">CIFAR-10 (60K images)</option>
              <option value="imagenette">ImageNette (13K images)</option>
              <option value="medical">Medical Imaging (5K images)</option>
              <option value="custom">Custom Dataset (1K images)</option>
            </select>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{DATASETS[dataset].description}</div>
              <div className="text-lg mt-2">{DATASETS[dataset].imageExample}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Domain Similarity</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {(domainSimilarity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${domainSimilarity * 100}%`,
                    backgroundColor: domainSimilarity > 0.7 ? '#22C55E' : domainSimilarity > 0.4 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {domainSimilarity > 0.7 ? 'High similarity — great for transfer learning' :
                 domainSimilarity > 0.4 ? 'Medium similarity — fine-tune top layers' :
                 'Low similarity — consider training from scratch'}
              </div>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 ${getHighlightClass('datasetSize')}`}>
            <label className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mb-2">
              <span>Dataset Size</span>
              <strong className="text-gray-900 dark:text-gray-100">{datasetSize} samples</strong>
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={datasetSize}
              onChange={(e) => setDatasetSize(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>10</span>
              <span>500</span>
              <span>1000</span>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300 ${getHighlightClass('comparison')}`}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Strategy Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Frozen Layers</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{frozenLayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Trainable Layers</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{trainableLayers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Trainable Params</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatParams(trainableParams)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Training Cost</span>
                <span className={`font-medium ${trainableLayers.length < 3 ? 'text-green-600' : trainableLayers.length < 6 ? 'text-amber-600' : 'text-red-600'}`}>
                  {trainableLayers.length < 3 ? 'Low' : trainableLayers.length < 6 ? 'Medium' : 'High'}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">💡 Recommendation</div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300">
                {trainableLayers.length <= 2
                  ? 'Good for small datasets. Pre-trained features are preserved.'
                  : trainableLayers.length <= 4
                  ? 'Balanced approach. Fine-tunes important features while preserving basics.'
                  : 'Heavy fine-tuning. Only recommended with large, similar datasets.'}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActivePreset('extraction');
                  setLayers(prev => prev.map((l, i) => ({ ...l, frozen: i < prev.length - 1 })));
                  resetTraining();
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePreset === 'extraction'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-gray-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                }`}
              >
                Feature Extraction
              </button>
              <button
                onClick={() => {
                  setActivePreset('finetune-top');
                  setLayers(prev => prev.map((l, i) => ({ ...l, frozen: i < prev.length - 3 })));
                  resetTraining();
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePreset === 'finetune-top'
                    ? 'bg-green-600 text-white shadow-md ring-2 ring-green-400 ring-offset-1 dark:ring-offset-gray-800'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40'
                }`}
              >
                Fine-tune Top
              </button>
              <button
                onClick={() => {
                  setActivePreset('finetune-all');
                  setLayers(prev => prev.map(l => ({ ...l, frozen: false })));
                  resetTraining();
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePreset === 'finetune-all'
                    ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400 ring-offset-1 dark:ring-offset-gray-800'
                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                }`}
              >
                Fine-tune All
              </button>
              <button
                onClick={() => {
                  setActivePreset(null);
                  resetTraining();
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Training Dynamics Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">What Happens During Training</h3>
          <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${
            training.isTraining 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : training.epoch > 0 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {training.isTraining ? '● Training Active' : training.epoch > 0 ? '✓ Training Complete' : '○ Idle'}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frozen Layers Visualization */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full bg-gray-400 ${training.isTraining ? 'animate-pulse' : ''}`}></div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Frozen Layers</h4>
            </div>
            
            <div className="space-y-3">
              {/* Visual: Weights stay constant */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Weight Values (unchanged)</div>
                <div className="flex gap-1">
                  {[0.23, -0.45, 0.67, -0.12, 0.89, -0.34, 0.56, -0.78].map((w, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div className="h-12 rounded flex items-center justify-center text-[8px] font-mono bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-500">
                        {w.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1">
                  <span className={`inline-block ${training.isTraining ? 'animate-bounce' : ''}`}>🔒</span> Weights locked — no gradient updates
                </div>
              </div>
              
              {/* Gradient flow blocked */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Gradient Flow</div>
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="flex items-center gap-1">
                    <span className={`text-green-500 text-lg ${training.isTraining ? 'animate-pulse' : 'opacity-30'}`}>↓</span>
                    <span className={`text-green-500 text-lg ${training.isTraining ? 'animate-pulse' : 'opacity-30'}`} style={{ animationDelay: '0.2s' }}>↓</span>
                    <span className={`text-green-500 text-lg ${training.isTraining ? 'animate-pulse' : 'opacity-30'}`} style={{ animationDelay: '0.4s' }}>↓</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center border-2 border-red-300 dark:border-red-700">
                    <span className={`text-red-500 text-xl font-bold ${training.isTraining ? 'animate-pulse' : ''}`}>✕</span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">BLOCKED</div>
                </div>
                <div className="flex justify-center">
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 w-full opacity-50"></div>
                  </div>
                </div>
              </div>
              
              {/* Explanation */}
              <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                <p>• <strong>No backward pass</strong> — gradients don't flow through</p>
                <p>• <strong>No weight updates</strong> — parameters stay as pre-trained</p>
                <p>• <strong>Preserves features</strong> — edges, textures, shapes remain</p>
                <p>• <strong>Faster training</strong> — fewer computations needed</p>
              </div>
            </div>
          </div>
          
          {/* Trainable Layers Visualization */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full bg-green-500 ${training.isTraining ? 'animate-pulse' : ''}`}></div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Trainable Layers</h4>
            </div>
            
            <div className="space-y-3">
              {/* Visual: Weights change */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                  {training.isTraining ? 'Weight Updates (changing)' : training.epoch > 0 ? 'Weight Updates (final)' : 'Weight Updates (initial)'}
                </div>
                <div className="flex gap-1">
                  {[
                    { before: 0.23, after: 0.31 },
                    { before: -0.45, after: -0.38 },
                    { before: 0.67, after: 0.72 },
                    { before: -0.12, after: -0.08 },
                    { before: 0.89, after: 0.85 },
                    { before: -0.34, after: -0.29 },
                    { before: 0.56, after: 0.61 },
                    { before: -0.78, after: -0.71 },
                  ].map((w, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div className={`h-5 rounded flex items-center justify-center text-[8px] font-mono ${
                        training.epoch > 0 && !training.isTraining
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 line-through'
                      }`}>
                        {training.epoch > 0 && !training.isTraining ? w.after.toFixed(2) : w.before.toFixed(2)}
                      </div>
                      <div className={`text-[10px] my-0.5 ${
                        training.isTraining ? 'text-green-500 animate-bounce' : 'text-gray-300 dark:text-gray-600'
                      }`} style={{ animationDelay: `${i * 0.1}s` }}>
                        {training.isTraining ? '↓' : training.epoch > 0 ? '✓' : '—'}
                      </div>
                      <div className="h-5 rounded flex items-center justify-center text-[8px] font-mono bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 font-bold border border-green-400 dark:border-green-600">
                        {w.after.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-center flex items-center justify-center gap-1">
                  {training.isTraining ? (
                    <span className="text-green-600 dark:text-green-400">
                      <span className="inline-block animate-bounce">🔓</span> Weights updating via gradient descent
                    </span>
                  ) : training.epoch > 0 ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Weights optimized — training complete
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      ○ Waiting for training to start
                    </span>
                  )}
                </div>
              </div>
              
              {/* Gradient flow passes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Gradient Flow</div>
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="flex items-center gap-1">
                    <span className={`text-green-500 text-lg ${training.isTraining ? 'animate-bounce' : training.epoch > 0 ? 'text-green-400' : 'text-gray-300 dark:text-gray-600'}`} style={{ animationDelay: '0s' }}>
                      {training.isTraining ? '↓' : training.epoch > 0 ? '✓' : '—'}
                    </span>
                    <span className={`text-green-500 text-lg ${training.isTraining ? 'animate-bounce' : training.epoch > 0 ? 'text-green-400' : 'text-gray-300 dark:text-gray-600'}`} style={{ animationDelay: '0.15s' }}>
                      {training.isTraining ? '↓' : training.epoch > 0 ? '✓' : '—'}
                    </span>
                    <span className={`text-green-500 text-lg ${training.isTraining ? 'animate-bounce' : training.epoch > 0 ? 'text-green-400' : 'text-gray-300 dark:text-gray-600'}`} style={{ animationDelay: '0.3s' }}>
                      {training.isTraining ? '↓' : training.epoch > 0 ? '✓' : '—'}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    training.isTraining 
                      ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700' 
                      : training.epoch > 0
                        ? 'bg-green-200 dark:bg-green-800 border-green-400 dark:border-green-600'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }`}>
                    <span className={`text-xl font-bold ${
                      training.isTraining ? 'text-green-500 animate-pulse' : training.epoch > 0 ? 'text-green-600 dark:text-green-300' : 'text-gray-400'
                    }`}>
                      {training.isTraining ? '✓' : training.epoch > 0 ? '✓' : '○'}
                    </span>
                  </div>
                  <div className={`text-[11px] font-medium ${
                    training.isTraining ? 'text-green-600 dark:text-green-400' : training.epoch > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`}>
                    {training.isTraining ? 'UPDATING' : training.epoch > 0 ? 'COMPLETE' : 'IDLE'}
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${
                      training.isTraining ? 'bg-green-500 animate-pulse' : training.epoch > 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'
                    }`} style={{ width: training.epoch > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Explanation */}
              <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
                <p>• <strong>Full backward pass</strong> — gradients computed via backprop</p>
                <p>• <strong>Weight updates</strong> — W = W - lr × gradient</p>
                <p>• <strong>Learns task-specific features</strong> — adapts to your data</p>
                <p>• <strong>Risk of overfitting</strong> — if too many layers unfrozen with small data</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Training Loop Summary */}
        <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-3">Training Loop: Forward → Loss → Backward → Update</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-transparent dark:from-indigo-900/30 animate-pulse"></div>
              <div className="relative">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold mb-1">1. Forward Pass</div>
                <div className="text-gray-500 dark:text-gray-400">Input flows through all layers</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-transparent dark:from-orange-900/30 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              <div className="relative">
                <div className="text-orange-600 dark:text-orange-400 font-semibold mb-1">2. Compute Loss</div>
                <div className="text-gray-500 dark:text-gray-400">Compare prediction vs actual</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-transparent dark:from-red-900/30 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <div className="relative">
                <div className="text-red-600 dark:text-red-400 font-semibold mb-1">3. Backward Pass</div>
                <div className="text-gray-500 dark:text-gray-400">Gradients stop at frozen layers</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-transparent dark:from-green-900/30 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
              <div className="relative">
                <div className="text-green-600 dark:text-green-400 font-semibold mb-1">4. Update Weights</div>
                <div className="text-gray-500 dark:text-gray-400">W = W - lr × ∇L</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Current Configuration Summary */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className={`rounded-lg p-3 text-center transition-all duration-300 ${
            frozenLayers.length > 0 
              ? 'bg-gray-100 dark:bg-gray-700' 
              : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'
          }`}>
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{frozenLayers.length}</div>
            <div className="text-gray-500 dark:text-gray-400">Frozen Layers</div>
            <div className="text-[10px] text-gray-400 mt-1">No gradient updates</div>
          </div>
          <div className={`rounded-lg p-3 text-center transition-all duration-300 ${
            trainableLayers.length > 0 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'
          }`}>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{trainableLayers.length}</div>
            <div className="text-green-600 dark:text-green-400">Trainable Layers</div>
            <div className="text-[10px] text-green-500 mt-1">Updating via backprop</div>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{formatParams(trainableParams)}</div>
            <div className="text-indigo-600 dark:text-indigo-400">Trainable Params</div>
            <div className="text-[10px] text-indigo-500 mt-1">{((trainableParams / totalParams) * 100).toFixed(1)}% of total</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">🎓 How Transfer Learning Works</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-blue-800 dark:text-blue-200">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="font-semibold mb-1">1. Pre-training</div>
            <div>Model learns general features (edges, textures, shapes) from millions of images.</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="font-semibold mb-1">2. Feature Extraction</div>
            <div>Freeze early layers, train only the new classifier head on your data.</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="font-semibold mb-1">3. Fine-tuning</div>
            <div>Unfreeze top layers with small learning rate to adapt to your specific task.</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="font-semibold mb-1">4. Adaptation</div>
            <div>Model specializes in your domain while retaining general knowledge.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
