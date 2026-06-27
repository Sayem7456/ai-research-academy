'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';
import LearnMoreSection from './LearnMoreSection';

const YOLO_ARCHITECTURE: Architecture = {
  title: 'YOLO (You Only Look Once)',
  description: 'Single-stage real-time object detection',
  layers: [
    {
      id: 'input',
      type: 'input',
      name: 'Input',
      shape: '416×416×3',
      description: 'Resized input image',
    },
    {
      id: 'backbone',
      type: 'conv',
      name: 'Darknet-53 Backbone',
      params: { layers: '53' },
      shape: '13×13×1024',
      description: 'Feature extraction network',
    },
    {
      id: 'neck',
      type: 'conv',
      name: 'Feature Pyramid',
      params: { scales: '3' },
      shape: 'Multi-scale',
      description: 'Detect at 3 different scales',
    },
    {
      id: 'head1',
      type: 'conv',
      name: 'Detection Head (13×13)',
      params: { anchors: '3' },
      shape: '13×13×255',
      description: 'Large objects (255 = 3×(5+80))',
    },
    {
      id: 'head2',
      type: 'conv',
      name: 'Detection Head (26×26)',
      params: { anchors: '3' },
      shape: '26×26×255',
      description: 'Medium objects',
    },
    {
      id: 'head3',
      type: 'conv',
      name: 'Detection Head (52×52)',
      params: { anchors: '3' },
      shape: '52×52×255',
      description: 'Small objects',
    },
    {
      id: 'nms',
      type: 'output',
      name: 'NMS',
      shape: 'N boxes',
      description: 'Non-maximum suppression filters overlapping boxes',
    },
    {
      id: 'output',
      type: 'output',
      name: 'Output',
      shape: '[x,y,w,h,conf,class]',
      description: 'Bounding boxes with class probabilities',
    },
  ],
};

export default function YOLOVisualizer() {
  const [selectedScale, setSelectedScale] = useState<'13' | '26' | '52'>('13');
  const [showNMS, setShowNMS] = useState(true);

  const scales = {
    '13': { name: 'Coarse (13×13)', objects: 'Large objects', receptive: 'Large receptive field' },
    '26': { name: 'Medium (26×26)', objects: 'Medium objects', receptive: 'Medium receptive field' },
    '52': { name: 'Fine (52×52)', objects: 'Small objects', receptive: 'Small receptive field' },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">YOLO (You Only Look Once)</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          YOLO is a single-stage object detector that frames detection as a regression problem,
          predicting bounding boxes and class probabilities directly in one forward pass.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Key Innovation: Single-Stage Detection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">Two-Stage (R-CNN, Faster R-CNN)</h4>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div>1. Region proposals (~2000 regions)</div>
                <div>2. Classify each region</div>
                <div className="text-red-600 dark:text-red-400">Slow: ~5-7 FPS</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1">Single-Stage (YOLO)</h4>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div>1. Divide image into grid</div>
                <div>2. Predict boxes + classes directly</div>
                <div className="text-green-600 dark:text-green-400">Fast: ~45-155 FPS</div>
              </div>
            </div>
          </div>
        </div>

        <ArchitectureViewer
          architecture={YOLO_ARCHITECTURE}
          interactive={true}
          showDetails={true}
        />

        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
          <h3 className="font-semibold mb-3">Multi-Scale Detection</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Detection Scale</label>
            <div className="flex gap-2">
              {(['13', '26', '52'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setSelectedScale(scale)}
                  className={`px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                    selectedScale === scale
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {scale}×{scale}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={selectedScale}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Scale:</span>
                <span>{scales[selectedScale].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Detects:</span>
                <span>{scales[selectedScale].objects}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Field:</span>
                <span>{scales[selectedScale].receptive}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Anchors:</span>
                <span>3 per cell</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border-l-4 border-orange-400"
          >
            <h4 className="font-semibold text-sm mb-2">Anchor Boxes</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              Pre-defined box shapes based on training data. Each grid cell predicts 3 boxes.
            </p>
            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded">
              <div>Each box predicts:</div>
              <div>• x, y (center offset)</div>
              <div>• w, h (width, height)</div>
              <div>• confidence (objectness)</div>
              <div>• class probabilities (80 for COCO)</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400"
          >
            <h4 className="font-semibold text-sm mb-2">Non-Maximum Suppression (NMS)</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              Removes duplicate detections by suppressing boxes with high IoU overlap.
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>1. Sort boxes by confidence</div>
              <div>2. Keep highest confidence box</div>
              <div>3. Remove boxes with IoU &gt; threshold</div>
              <div>4. Repeat for remaining boxes</div>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-950/30 rounded-lg border-l-4 border-gray-400 dark:border-gray-500">
          <h3 className="font-semibold mb-3 text-sm">YOLO Evolution</h3>
          <div className="space-y-2 text-xs">
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">YOLOv1 (2016):</span>
              <span className="text-gray-600 dark:text-gray-400">First single-stage detector, 45 FPS</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">YOLOv2 (2017):</span>
              <span className="text-gray-600 dark:text-gray-400">Anchor boxes, batch normalization</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">YOLOv3 (2018):</span>
              <span className="text-gray-600 dark:text-gray-400">Multi-scale predictions, FPN</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-blue-700 dark:text-blue-400 min-w-[80px]">YOLOv4 (2020):</span>
              <span className="text-gray-600 dark:text-gray-400">CSPDarknet, Mish activation</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">YOLOv5-8:</span>
              <span className="text-gray-600 dark:text-gray-400">Further optimizations, SOTA performance</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
          <h3 className="font-semibold mb-3 text-sm">Applications</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div>✓ Real-time Video Surveillance</div>
            <div>✓ Autonomous Driving</div>
            <div>✓ Robotics</div>
            <div>✓ Sports Analytics</div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            <strong>Paper:</strong> "You Only Look Once: Unified, Real-Time Object Detection" (Redmon et al., 2016)
          </p>
        </div>
      </div>

      <LearnMoreSection
        title="Learn More: YOLO Single-Shot Detection"
        gradientFrom="from-red-500"
        gradientTo="to-orange-500"
        darkGradientFrom="from-red-600"
        darkGradientTo="to-orange-600"
        hoverFrom="hover:from-red-600"
        hoverTo="hover:to-orange-600"
        darkHoverFrom="dark:hover:from-red-700"
        darkHoverTo="dark:hover:to-orange-700"
        analogyTitle="The Single Glance Analogy"
        analogyIcon="👁️"
        analogyContent={
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Imagine looking at a scene and <strong>instantly identifying everything</strong> in one glance —
            no need to examine each region separately like two-stage detectors. YOLO divides the image into
            a grid, and each grid cell simultaneously predicts "what" and "where" objects are, like a
            well-organized detective who scans an entire room at once instead of checking each corner sequentially.
          </p>
        }
        stepsTitle="How YOLO Detection Works"
        stepsContent={[
          {
            step: 1,
            title: "Divide image into grid",
            desc: "The input image is divided into an S×S grid (e.g., 13×13). Each cell is responsible for detecting objects whose center falls within it.",
            formula: "Grid: S × S cells, each covering (416/S) × (416/S) pixels"
          },
          {
            step: 2,
            title: "Predict bounding boxes per cell",
            desc: "Each cell predicts B anchor boxes with (x, y, w, h, confidence). Confidence = P(object) × IoU.",
            formula: "Each cell → B boxes × (5 + C) values"
          },
          {
            step: 3,
            title: "Multi-scale feature fusion",
            desc: "Features from backbone are fused at 3 scales (13×13, 26×26, 52×52) via FPN for detecting large, medium, and small objects.",
            formula: "FPN: 13×13 (large) ⊕ 26×26 (medium) ⊕ 52×52 (small)"
          },
          {
            step: 4,
            title: "Non-maximum suppression",
            desc: "After prediction, overlapping boxes with high IoU are suppressed, keeping only the best detection per object.",
            formula: "For each class: sort by score → keep best → suppress IoU > threshold"
          }
        ]}
        simpleTitle="YOLO in PyTorch"
        simpleCode={`class YOLOv3(nn.Module):
    def __init__(self, num_classes=80):
        super().__init__()
        # Backbone: Darknet-53
        self.backbone = Darknet53()

        # Detection heads at 3 scales
        self.head_13 = self._make_head(1024, 255)  # 13×13
        self.head_26 = self._make_head(512, 255)   # 26×26
        self.head_52 = self._make_head(256, 255)   # 52×52

    def _make_head(self, in_ch, out_ch):
        return nn.Sequential(
            self._conv_block(in_ch, 256, 1),
            self._conv_block(256, 512, 3),
            self._conv_block(512, 1024, 3),
            nn.Conv2d(1024, out_ch, 1)
        )

    def forward(self, x):
        features = self.backbone(x)
        # Detect at 3 scales
        pred_13 = self.head_13(features[0])
        pred_26 = self.head_26(features[1])
        pred_52 = self.head_52(features[2])
        return pred_13, pred_26, pred_52`}
        scratchTitle="YOLO Forward Pass from Scratch"
        scratchCode={`import numpy as np

def darknet_forward(x, weights):
    """Simplified Darknet backbone"""
    for layer in weights:
        x = conv_batch_relu(x, layer['conv'], layer['bn'])
        if layer.get('pool'):
            x = maxpool(x, layer['pool'])
    return x

def yolo_head(x, W, B=3, C=80):
    """
    x: feature map (batch, channels, H, W)
    W: weight matrix (channels, B*(5+C), 1, 1)
    Returns: (batch, B*(5+C), H, W)
    """
    batch, ch, H, W_map = x.shape
    out = conv1x1(x, W)  # (batch, B*(5+C), H, W)

    # Reshape to per-box predictions
    out = out.reshape(batch, B, 5 + C, H, W_map)
    out = out.transpose(0, 1, 3, 4, 2)  # (B, B, H, W, 5+C)

    # Apply sigmoid to tx, ty, confidence
    out[..., 0:2] = sigmoid(out[..., 0:2])  # center offsets
    out[..., 4:5] = sigmoid(out[..., 4:5])  # objectness

    # Apply softmax to class scores
    out[..., 5:] = softmax(out[..., 5:])

    return out

def non_max_suppression(predictions, iou_threshold=0.5):
    """Filter overlapping boxes"""
    boxes = predictions[predictions[..., 4] > 0.25]
    boxes = boxes[boxes[:, 4].argsort()[::-1]]

    keep = []
    while len(boxes) > 0:
        best = boxes[0]
        keep.append(best)
        ious = compute_iou(best, boxes[1:])
        boxes = boxes[1:][ious < iou_threshold]
    return np.array(keep)`}
      />
    </div>
  );
}
