'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export type Layer = {
  id: string;
  type: 'input' | 'conv' | 'pool' | 'fc' | 'activation' | 'norm' | 'dropout' | 'residual' | 'attention' | 'output';
  name: string;
  params?: Record<string, string | number>;
  shape?: string;
  description?: string;
  color?: string;
};

export type Connection = {
  from: string;
  to: string;
  type?: 'normal' | 'residual' | 'skip';
};

export type Architecture = {
  title: string;
  layers: Layer[];
  connections?: Connection[];
  description?: string;
};

interface ArchitectureViewerProps {
  architecture: Architecture;
  interactive?: boolean;
  showDetails?: boolean;
  vertical?: boolean;
}

const LAYER_COLORS: Record<Layer['type'], string> = {
  input: 'bg-blue-100 dark:bg-blue-950/30 border-blue-400',
  conv: 'bg-purple-100 dark:bg-purple-950/30 border-purple-400',
  pool: 'bg-green-100 dark:bg-green-950/30 border-green-400',
  fc: 'bg-orange-100 dark:bg-orange-950/30 border-orange-400',
  activation: 'bg-yellow-100 dark:bg-yellow-950/30 border-yellow-400',
  norm: 'bg-pink-100 dark:bg-pink-950/30 border-pink-400',
  dropout: 'bg-gray-100 dark:bg-gray-800 border-gray-400',
  residual: 'bg-indigo-100 dark:bg-indigo-950/30 border-indigo-400',
  attention: 'bg-red-100 dark:bg-red-950/30 border-red-400',
  output: 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-400',
};

export default function ArchitectureViewer({
  architecture,
  interactive = true,
  showDetails = true,
  vertical = false,
}: ArchitectureViewerProps) {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const getLayerColor = (layer: Layer) => {
    return layer.color || LAYER_COLORS[layer.type];
  };

  const renderLayer = (layer: Layer, index: number) => {
    const isSelected = selectedLayer === layer.id;
    const isHovered = hoveredLayer === layer.id;
    const colorClass = getLayerColor(layer);

    return (
      <motion.div
        key={layer.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className={`relative ${vertical ? 'mb-4' : 'mx-2'}`}
      >
        <motion.div
          className={`
            border-2 rounded-lg p-4 cursor-pointer transition-all
            ${colorClass}
            ${isSelected ? 'ring-4 ring-blue-500 shadow-lg' : ''}
            ${isHovered ? 'scale-105 shadow-md' : ''}
          `}
          onClick={() => interactive && setSelectedLayer(isSelected ? null : layer.id)}
          onMouseEnter={() => interactive && setHoveredLayer(layer.id)}
          onMouseLeave={() => interactive && setHoveredLayer(null)}
          whileHover={interactive ? { scale: 1.05 } : {}}
        >
          <div className="text-center">
            <div className="font-semibold text-sm mb-1">{layer.name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase">{layer.type}</div>
            {layer.shape && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{layer.shape}</div>
            )}
          </div>
        </motion.div>

        {isSelected && showDetails && layer.description && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg w-64 text-sm"
            style={{ top: '100%' }}
          >
            <div className="font-semibold mb-2">{layer.name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{layer.description}</div>
            {layer.params && Object.keys(layer.params).length > 0 && (
              <div className="text-xs space-y-1">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Parameters:</div>
                {Object.entries(layer.params).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{key}:</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderConnection = (from: Layer, to: Layer, type: 'normal' | 'residual' | 'skip' = 'normal') => {
    const strokeColor = type === 'residual' ? '#6366f1' : type === 'skip' ? '#10b981' : '#9ca3af';
    const strokeWidth = type === 'normal' ? 2 : 3;
    const strokeDasharray = type === 'normal' ? 'none' : '5,5';

    return (
      <div
        key={`${from.id}-${to.id}`}
        className={`${vertical ? 'h-4' : 'w-4'} flex items-center justify-center`}
      >
        {vertical ? (
          <svg width="2" height="16" className="overflow-visible">
            <line
              x1="1"
              y1="0"
              x2="1"
              y2="16"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
            />
            <polygon
              points="1,16 -2,12 4,12"
              fill={strokeColor}
            />
          </svg>
        ) : (
          <svg width="16" height="2" className="overflow-visible">
            <line
              x1="0"
              y1="1"
              x2="16"
              y2="1"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
            />
            <polygon
              points="16,1 12,-2 12,4"
              fill={strokeColor}
            />
          </svg>
        )}
      </div>
    );
  };

  const layers = architecture.layers;
  const connections = architecture.connections || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{architecture.title}</h3>
        {architecture.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{architecture.description}</p>
        )}
      </div>

      <div className={`flex ${vertical ? 'flex-col items-center' : 'flex-row items-center justify-start'} overflow-x-auto pb-4 px-2`}>
        {layers.map((layer, index) => (
          <React.Fragment key={layer.id}>
            {renderLayer(layer, index)}
            {index < layers.length - 1 && (
              renderConnection(layer, layers[index + 1], 'normal')
            )}
          </React.Fragment>
        ))}
      </div>

      {connections.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Special Connections</h4>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {connections.map((conn, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono">{conn.from}</span>
                <span>→</span>
                <span className="font-mono">{conn.to}</span>
                {conn.type && conn.type !== 'normal' && (
                  <span className={`px-2 py-0.5 rounded text-white text-[10px] ${
                    conn.type === 'residual' ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`}>
                    {conn.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {interactive && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Click on a layer to see details
        </div>
      )}
    </div>
  );
}
