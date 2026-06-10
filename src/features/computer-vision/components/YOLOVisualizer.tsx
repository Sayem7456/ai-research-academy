'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ArchitectureViewer, { type Architecture } from './ArchitectureViewer';

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
              <h4 className="font-semibold text-red-700 mb-1">Two-Stage (R-CNN, Faster R-CNN)</h4>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div>1. Region proposals (~2000 regions)</div>
                <div>2. Classify each region</div>
                <div className="text-red-600">Slow: ~5-7 FPS</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-1">Single-Stage (YOLO)</h4>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div>1. Divide image into grid</div>
                <div>2. Predict boxes + classes directly</div>
                <div className="text-green-600">Fast: ~45-155 FPS</div>
              </div>
            </div>
          </div>
        </div>

        <ArchitectureViewer
          architecture={YOLO_ARCHITECTURE}
          interactive={true}
          showDetails={true}
        />

        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Multi-Scale Detection</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Detection Scale</label>
            <div className="flex gap-2">
              {(['13', '26', '52'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setSelectedScale(scale)}
                  className={`px-4 py-2 text-sm rounded ${
                    selectedScale === scale
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
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
            className="p-3 bg-white dark:bg-gray-800 rounded border border-purple-200"
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
            className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400"
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

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
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
              <span className="font-semibold text-blue-700 min-w-[80px]">YOLOv4 (2020):</span>
              <span className="text-gray-600 dark:text-gray-400">CSPDarknet, Mish activation</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">YOLOv5-8:</span>
              <span className="text-gray-600 dark:text-gray-400">Further optimizations, SOTA performance</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
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
    </div>
  );
}
