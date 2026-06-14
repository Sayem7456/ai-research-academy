'use client';

import React, { useMemo } from 'react';
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

function InputNode({ data }: { data: BlockNodeData }) {
  return (
    <div
      className="px-4 py-3 rounded-lg border-2 border-dashed shadow-md min-w-[140px] text-center"
      style={{ borderColor: data.color, backgroundColor: `${data.color}10` }}
    >
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ backgroundColor: data.color }} />
      {data.icon && <div className="text-lg mb-1">{data.icon}</div>}
      <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{data.label}</div>
      {data.sublabel && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">{data.sublabel}</div>
      )}
    </div>
  );
}

function OutputNode({ data }: { data: BlockNodeData }) {
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
    </div>
  );
}

const nodeTypes = {
  block: BlockNode,
  residual: ResidualNode,
  input: InputNode,
  output: OutputNode,
};

export default function DecoderDiagram() {
  const defaultNodes: Node[] = useMemo(
    () => [
      // Encoder side
      {
        id: 'encoder_output',
        type: 'input',
        position: { x: 450, y: 0 },
        data: { label: 'Encoder Output', sublabel: '[batch, src_len, d_model]', color: '#3b82f6', icon: '📥' },
      },
      // Decoder inputs
      {
        id: 'tgt_tokens',
        type: 'input',
        position: { x: 100, y: 0 },
        data: { label: 'Target Tokens (shifted)', sublabel: '[batch, tgt_len]', color: '#f59e0b', icon: '🎯' },
      },
      {
        id: 'embedding',
        type: 'block',
        position: { x: 100, y: 100 },
        data: { label: 'Token Embedding', sublabel: 'nn.Embedding(vocab, d)', color: '#8b5cf6', icon: '📦' },
      },
      {
        id: 'positional',
        type: 'block',
        position: { x: 100, y: 200 },
        data: { label: 'Positional Encoding', sublabel: 'sin/cos or learned', color: '#a855f7', icon: '📍' },
      },
      // Masked self-attention
      {
        id: 'masked_attn',
        type: 'block',
        position: { x: 100, y: 320 },
        data: { label: 'Masked Self-Attention', sublabel: 'Causal mask applied', color: '#ef4444', icon: '🎭' },
      },
      {
        id: 'add1',
        type: 'residual',
        position: { x: 100, y: 420 },
        data: { label: 'Add + LayerNorm', color: '#ec4899', icon: '➕' },
      },
      // Cross-attention
      {
        id: 'cross_attn',
        type: 'block',
        position: { x: 100, y: 520 },
        data: { label: 'Cross-Attention', sublabel: 'Q: decoder, K/V: encoder', color: '#22c55e', icon: '🔗' },
      },
      {
        id: 'add2',
        type: 'residual',
        position: { x: 100, y: 620 },
        data: { label: 'Add + LayerNorm', color: '#ec4899', icon: '➕' },
      },
      // FFN
      {
        id: 'ffn',
        type: 'block',
        position: { x: 100, y: 720 },
        data: { label: 'Feed-Forward Network', sublabel: 'GELU(xW₁+b₁)W₂+b₂', color: '#06b6d4', icon: '⚡' },
      },
      {
        id: 'add3',
        type: 'residual',
        position: { x: 100, y: 820 },
        data: { label: 'Add + LayerNorm', color: '#ec4899', icon: '➕' },
      },
      // Output
      {
        id: 'output_proj',
        type: 'block',
        position: { x: 100, y: 920 },
        data: { label: 'Output Projection', sublabel: 'Linear(d_model, vocab)', color: '#f97316', icon: '📤' },
      },
      {
        id: 'softmax',
        type: 'output',
        position: { x: 100, y: 1020 },
        data: { label: 'Softmax → Next Token', sublabel: 'vocab_size logits', color: '#eab308', icon: '🎲' },
      },
      // Repeat indicator
      {
        id: 'repeat_label',
        type: 'block',
        position: { x: 320, y: 670 },
        data: { label: '× N Layers', sublabel: 'GPT-3: 96, GPT-4: ~120', color: '#64748b', icon: '🔄' },
      },
      // Cross-attention connection indicator
      {
        id: 'k_v_label',
        type: 'block',
        position: { x: 450, y: 520 },
        data: { label: 'K, V', color: '#3b82f6', icon: '🔑' },
      },
    ],
    []
  );

  const defaultEdges: Edge[] = useMemo(
    () => [
      // Encoder flow
      { id: 'e-tgt-embed', source: 'tgt_tokens', target: 'embedding', animated: true, style: { stroke: '#f59e0b' } },
      { id: 'e-embed-pos', source: 'embedding', target: 'positional', style: { stroke: '#8b5cf6' } },
      { id: 'e-pos-masked', source: 'positional', target: 'masked_attn', style: { stroke: '#a855f7' } },
      { id: 'e-masked-add1', source: 'masked_attn', target: 'add1', style: { stroke: '#ef4444' } },
      { id: 'e-add1-cross', source: 'add1', target: 'cross_attn', style: { stroke: '#ec4899' } },
      { id: 'e-cross-add2', source: 'cross_attn', target: 'add2', style: { stroke: '#22c55e' } },
      { id: 'e-add2-ffn', source: 'add2', target: 'ffn', style: { stroke: '#ec4899' } },
      { id: 'e-ffn-add3', source: 'ffn', target: 'add3', style: { stroke: '#06b6d4' } },
      { id: 'e-add3-output', source: 'add3', target: 'output_proj', style: { stroke: '#ec4899' } },
      { id: 'e-output-softmax', source: 'output_proj', target: 'softmax', style: { stroke: '#f97316' } },
      // Encoder to cross-attention
      { id: 'e-encoder-kv', source: 'encoder_output', target: 'k_v_label', style: { stroke: '#3b82f6' } },
      { id: 'e-kv-cross', source: 'k_v_label', target: 'cross_attn', animated: true, style: { stroke: '#3b82f6', strokeDasharray: '5,5' } },
      // Repeat indicator
      {
        id: 'e-repeat',
        source: 'add3',
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
