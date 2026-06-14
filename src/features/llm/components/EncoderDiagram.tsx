'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface BlockNodeData {
  label: string;
  sublabel?: string;
  color: string;
  icon?: string;
}

function BlockNode({ data }: { data: BlockNodeData }) {
  return (
    <div
      className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[140px] text-center"
      style={{ borderColor: data.color, backgroundColor: `${data.color}15` }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ backgroundColor: data.color }} />
      {data.icon && <div className="text-lg mb-1">{data.icon}</div>}
      <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{data.label}</div>
      {data.sublabel && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">{data.sublabel}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ backgroundColor: data.color }} />
    </div>
  );
}

function ResidualNode({ data }: { data: BlockNodeData }) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ backgroundColor: data.color }} />
      <div
        className="px-3 py-2 rounded-full border-2 shadow-md text-center"
        style={{ borderColor: data.color, backgroundColor: `${data.color}20` }}
      >
        <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ backgroundColor: data.color }} />
      <Handle
        type="source"
        id="skip"
        position={Position.Right}
        className="w-3 h-3"
        style={{ backgroundColor: data.color }}
      />
    </div>
  );
}

const nodeTypes = {
  block: BlockNode,
  residual: ResidualNode,
};

export default function EncoderDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const defaultNodes: Node[] = useMemo(
    () => [
      {
        id: 'input',
        type: 'block',
        position: { x: 250, y: 0 },
        data: { label: 'Input Tokens', sublabel: '[batch, seq_len]', color: '#6366f1', icon: '📝' },
      },
      {
        id: 'embedding',
        type: 'block',
        position: { x: 250, y: 100 },
        data: { label: 'Token Embedding', sublabel: 'nn.Embedding(vocab, d)', color: '#8b5cf6', icon: '📦' },
      },
      {
        id: 'positional',
        type: 'block',
        position: { x: 250, y: 200 },
        data: { label: 'Positional Encoding', sublabel: 'sin/cos or learned', color: '#a855f7', icon: '📍' },
      },
      {
        id: 'add1',
        type: 'residual',
        position: { x: 250, y: 300 },
        data: { label: 'Add + LayerNorm', color: '#ec4899', icon: '➕' },
      },
      {
        id: 'mha',
        type: 'block',
        position: { x: 250, y: 400 },
        data: { label: 'Multi-Head Self-Attention', sublabel: 'Q, K, V projections', color: '#3b82f6', icon: '🔍' },
      },
      {
        id: 'add2',
        type: 'residual',
        position: { x: 250, y: 500 },
        data: { label: 'Add + LayerNorm', color: '#ec4899', icon: '➕' },
      },
      {
        id: 'ffn',
        type: 'block',
        position: { x: 250, y: 600 },
        data: { label: 'Feed-Forward Network', sublabel: 'GELU(xW₁+b₁)W₂+b₂', color: '#10b981', icon: '⚡' },
      },
      {
        id: 'add3',
        type: 'residual',
        position: { x: 250, y: 700 },
        data: { label: 'Add + LayerNorm', color: '#ec4899', icon: '➕' },
      },
      {
        id: 'output',
        type: 'block',
        position: { x: 250, y: 800 },
        data: { label: 'Encoder Output', sublabel: '[batch, seq_len, d_model]', color: '#f59e0b', icon: '📤' },
      },
      // Repeat indicator nodes
      {
        id: 'repeat_label',
        type: 'block',
        position: { x: 480, y: 450 },
        data: { label: '× N Layers', sublabel: 'BERT: 12, GPT-3: 96', color: '#64748b', icon: '🔄' },
      },
    ],
    []
  );

  const defaultEdges: Edge[] = useMemo(
    () => [
      { id: 'e-input-embed', source: 'input', target: 'embedding', animated: true, style: { stroke: '#6366f1' } },
      { id: 'e-embed-pos', source: 'embedding', target: 'positional', style: { stroke: '#8b5cf6' } },
      { id: 'e-pos-add1', source: 'positional', target: 'add1', style: { stroke: '#a855f7' } },
      { id: 'e-add1-mha', source: 'add1', target: 'mha', style: { stroke: '#ec4899' } },
      { id: 'e-mha-add2', source: 'mha', target: 'add2', style: { stroke: '#3b82f6' } },
      { id: 'e-add2-ffn', source: 'add2', target: 'ffn', style: { stroke: '#ec4899' } },
      { id: 'e-ffn-add3', source: 'ffn', target: 'add3', style: { stroke: '#10b981' } },
      { id: 'e-add3-output', source: 'add3', target: 'output', style: { stroke: '#ec4899' } },
      // Skip connections
      {
        id: 'skip-add1-mha',
        source: 'add1',
        sourceHandle: 'skip',
        target: 'mha',
        type: 'smoothstep',
        style: { stroke: '#f472b6', strokeDasharray: '5,5' },
        label: 'residual',
        labelStyle: { fontSize: 9, fill: '#f472b6' },
      },
      {
        id: 'skip-add2-ffn',
        source: 'add2',
        sourceHandle: 'skip',
        target: 'ffn',
        type: 'smoothstep',
        style: { stroke: '#f472b6', strokeDasharray: '5,5' },
        label: 'residual',
        labelStyle: { fontSize: 9, fill: '#f472b6' },
      },
      // Repeat indicator
      {
        id: 'e-repeat',
        source: 'output',
        sourceHandle: 'skip',
        target: 'repeat_label',
        type: 'smoothstep',
        style: { stroke: '#64748b', strokeDasharray: '4,4' },
      },
    ],
    []
  );

  return (
    <div className="h-[500px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
      <ReactFlow
        nodes={defaultNodes}
        edges={defaultEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={15} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as BlockNodeData;
            return data?.color || '#64748b';
          }}
          maskColor="rgba(0,0,0,0.08)"
        />
      </ReactFlow>
    </div>
  );
}
