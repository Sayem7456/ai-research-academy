'use client';

import React, { useState } from 'react';
import DecoderDiagram from './DecoderDiagram';

const SECTIONS = [
  { id: 'overview', title: '1. Decoder Overview', icon: '🔍' },
  { id: 'masked', title: '2. Masked Self-Attention', icon: '🎭' },
  { id: 'cross', title: '3. Cross-Attention', icon: '🔗' },
  { id: 'ffn', title: '4. Feed-Forward Network', icon: '⚡' },
  { id: 'residual', title: '5. Residual & LayerNorm', icon: '🔗' },
  { id: 'output', title: '6. Output Projection', icon: '📤' },
  { id: 'full', title: '7. Full Decoder', icon: '🏗️' },
];

function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-medium text-gray-500">{title}</span>
          <button onClick={handleCopy} className="text-[10px] text-blue-600 hover:text-blue-800 dark:text-blue-400">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="p-4 bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="text-sm font-mono text-center text-gray-800 dark:text-gray-200">
        {children}
      </div>
    </div>
  );
}

function InsightBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">{title}</h4>
      <div className="text-sm text-blue-700 dark:text-blue-300">{children}</div>
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Component</th>
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Encoder</th>
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Decoder</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Self-Attention</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Bidirectional</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-yellow-50 dark:bg-yellow-900">Causal (masked)</td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Cross-Attention</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">None</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-green-50 dark:bg-green-900">Q from decoder, K/V from encoder</td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Input</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Full sequence</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-purple-50 dark:bg-purple-900">Shifted right (autoregressive)</td>
          </tr>
          <tr>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Output</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Contextual embeddings</td>
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-orange-50 dark:bg-orange-900">Next token logits</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CausalMaskVisualization() {
  const tokens = ['<s>', 'I', 'love', 'AI', '<e>'];
  const n = tokens.length;

  return (
    <div className="my-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold mb-3 text-center">Causal Attention Mask</h4>
      <div className="overflow-x-auto">
        <table className="text-[10px] font-mono mx-auto border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1"></th>
              {tokens.map((t, i) => (
                <th key={i} className="px-2 py-1 text-gray-500">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tokens.map((rowToken, i) => (
              <tr key={i}>
                <td className="px-2 py-1 font-semibold text-gray-500">{rowToken}</td>
                {tokens.map((_, j) => (
                  <td key={j} className="px-2 py-1 text-center">
                    <span className={`inline-block w-6 h-6 rounded ${
                      j <= i 
                        ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {j <= i ? '✓' : '✗'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Each token can only attend to itself and previous tokens (not future tokens)
      </p>
    </div>
  );
}

function CrossAttentionVisualization() {
  return (
    <div className="my-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold mb-3 text-center">Cross-Attention Flow</h4>
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900 rounded-lg border border-purple-300 dark:border-purple-700">
            <div className="text-xs font-semibold text-purple-800 dark:text-purple-200">Decoder</div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400">Q</div>
          </div>
        </div>
        <div className="text-2xl text-gray-400">x</div>
        <div className="text-center">
          <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-300 dark:border-blue-700">
            <div className="text-xs font-semibold text-blue-800 dark:text-blue-200">Encoder</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400">K, V</div>
          </div>
        </div>
        <div className="text-2xl text-gray-400">&rarr;</div>
        <div className="text-center">
          <div className="px-3 py-2 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
            <div className="text-xs font-semibold text-green-800 dark:text-green-200">Output</div>
            <div className="text-[10px] text-green-600 dark:text-green-400">Context-aware</div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Decoder queries attend to encoder&apos;s key-value pairs
      </p>
    </div>
  );
}

export default function DecoderMathPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const overviewCode = [
    '# Complete decoder layer structure',
    'class DecoderLayer(nn.Module):',
    '    def __init__(self, d_model, num_heads, d_ff, dropout=0.1):',
    '        super().__init__()',
    '        # Three main components',
    '        self.masked_self_attn = MultiHeadAttention(d_model, num_heads)',
    '        self.cross_attn = MultiHeadAttention(d_model, num_heads)',
    '        self.ffn = FeedForward(d_model, d_ff)',
    '        ',
    '        # Layer norms',
    '        self.norm1 = nn.LayerNorm(d_model)',
    '        self.norm2 = nn.LayerNorm(d_model)',
    '        self.norm3 = nn.LayerNorm(d_model)',
    '        ',
    '        # Dropout',
    '        self.dropout = nn.Dropout(dropout)',
    '',
    '    def forward(self, x, encoder_output, ',
    '                tgt_mask=None, memory_mask=None):',
    '        # 1. Masked self-attention',
    '        h = self.masked_self_attn(x, x, x, mask=tgt_mask)',
    '        x = self.norm1(x + self.dropout(h))',
    '        ',
    '        # 2. Cross-attention (attend to encoder)',
    '        h = self.cross_attn(x, encoder_output, encoder_output)',
    '        x = self.norm2(x + self.dropout(h))',
    '        ',
    '        # 3. Feed-forward',
    '        h = self.ffn(x)',
    '        x = self.norm3(x + self.dropout(h))',
    '        ',
    '        return x',
  ].join('\n');

  const causalMaskCode = [
    'import torch',
    'import torch.nn.functional as F',
    '',
    'def create_causal_mask(seq_len: int, device: torch.device) -> torch.Tensor:',
    '    """Create upper triangular mask for causal attention."""',
    '    mask = torch.triu(torch.ones(seq_len, seq_len, device=device), diagonal=1)',
    '    mask = mask.masked_fill(mask == 1, float(\'-inf\'))',
    '    return mask',
    '',
    '# Example',
    'seq_len = 5',
    'mask = create_causal_mask(seq_len, torch.device(\'cpu\'))',
    'print(mask)',
    '# tensor([[0., -inf, -inf, -inf, -inf],',
    '#         [0.,   0., -inf, -inf, -inf],',
    '#         [0.,   0.,   0., -inf, -inf],',
    '#         [0.,   0.,   0.,   0., -inf],',
    '#         [0.,   0.,   0.,   0.,   0.]])',
    '',
    '# Apply mask to attention scores',
    'attn_scores = torch.randn(seq_len, seq_len)',
    'attn_scores = attn_scores.masked_fill(mask == float(\'-inf\'), float(\'-inf\'))',
    'attn_weights = F.softmax(attn_scores, dim=-1)',
  ].join('\n');

  const crossAttentionCode = [
    'class CrossAttention(nn.Module):',
    '    def __init__(self, d_model: int, num_heads: int):',
    '        super().__init__()',
    '        self.num_heads = num_heads',
    '        self.d_k = d_model // num_heads',
    '        ',
    '        self.W_q = nn.Linear(d_model, d_model)',
    '        self.W_k = nn.Linear(d_model, d_model)',
    '        self.W_v = nn.Linear(d_model, d_model)',
    '        self.W_o = nn.Linear(d_model, d_model)',
    '    ',
    '    def forward(self, decoder_hidden, encoder_output, ',
    '                mask=None):',
    '        batch_size = decoder_hidden.size(0)',
    '        ',
    '        # Q from decoder',
    '        Q = self.W_q(decoder_hidden).view(',
    '            batch_size, -1, self.num_heads, self.d_k',
    '        ).transpose(1, 2)',
    '        ',
    '        # K, V from encoder',
    '        K = self.W_k(encoder_output).view(',
    '            batch_size, -1, self.num_heads, self.d_k',
    '        ).transpose(1, 2)',
    '        ',
    '        V = self.W_v(encoder_output).view(',
    '            batch_size, -1, self.num_heads, self.d_k',
    '        ).transpose(1, 2)',
    '        ',
    '        # Standard attention (no causal mask)',
    '        scores = torch.matmul(Q, K.transpose(-2, -1)) / (self.d_k ** 0.5)',
    '        ',
    '        if mask is not None:',
    '            scores = scores.masked_fill(mask == 0, float(\'-inf\'))',
    '        ',
    '        attn_weights = F.softmax(scores, dim=-1)',
    '        context = torch.matmul(attn_weights, V)',
    '        ',
    '        # Reshape and project',
    '        context = context.transpose(1, 2).contiguous().view(',
    '            batch_size, -1, self.num_heads * self.d_k',
    '        )',
    '        return self.W_o(context)',
  ].join('\n');

  const feedforwardCode = [
    'class FeedForward(nn.Module):',
    '    def __init__(self, d_model: int, d_ff: int, dropout: float = 0.1):',
    '        super().__init__()',
    '        self.linear1 = nn.Linear(d_model, d_ff)',
    '        self.linear2 = nn.Linear(d_ff, d_model)',
    '        self.dropout = nn.Dropout(dropout)',
    '        self.activation = nn.GELU()',
    '    ',
    '    def forward(self, x: torch.Tensor) -> torch.Tensor:',
    '        # x: [batch, seq_len, d_model]',
    '        x = self.linear1(x)        # [batch, seq_len, d_ff]',
    '        x = self.activation(x)     # Non-linearity',
    '        x = self.dropout(x)',
    '        x = self.linear2(x)        # [batch, seq_len, d_model]',
    '        return x',
    '',
    '# Alternative: Use nn.Sequential',
    'ffn = nn.Sequential(',
    '    nn.Linear(d_model, d_ff),',
    '    nn.GELU(),',
    '    nn.Dropout(dropout),',
    '    nn.Linear(d_ff, d_model)',
    ')',
  ].join('\n');

  const residualLayernormCode = [
    'class DecoderLayer(nn.Module):',
    '    def __init__(self, d_model, num_heads, d_ff, ',
    '                 dropout=0.1, pre_norm=True):',
    '        super().__init__()',
    '        self.pre_norm = pre_norm',
    '        ',
    '        self.masked_attn = MultiHeadAttention(d_model, num_heads)',
    '        self.cross_attn = MultiHeadAttention(d_model, num_heads)',
    '        self.ffn = FeedForward(d_model, d_ff)',
    '        ',
    '        self.norm1 = nn.LayerNorm(d_model)',
    '        self.norm2 = nn.LayerNorm(d_model)',
    '        self.norm3 = nn.LayerNorm(d_model)',
    '        self.dropout = nn.Dropout(dropout)',
    '    ',
    '    def forward(self, x, memory, tgt_mask=None):',
    '        if self.pre_norm:',
    '            # Pre-norm: norm before sub-layer',
    '            h = self.norm1(x)',
    '            h = self.masked_attn(h, h, h, mask=tgt_mask)',
    '            x = x + self.dropout(h)',
    '            ',
    '            h = self.norm2(x)',
    '            h = self.cross_attn(h, memory, memory)',
    '            x = x + self.dropout(h)',
    '            ',
    '            h = self.norm3(x)',
    '            h = self.ffn(h)',
    '            x = x + self.dropout(h)',
    '        else:',
    '            # Post-norm: norm after sub-layer',
    '            h = self.masked_attn(x, x, x, mask=tgt_mask)',
    '            x = self.norm1(x + self.dropout(h))',
    '            ',
    '            h = self.cross_attn(x, memory, memory)',
    '            x = self.norm2(x + self.dropout(h))',
    '            ',
    '            h = self.ffn(x)',
    '            x = self.norm3(x + self.dropout(h))',
    '        ',
    '        return x',
  ].join('\n');

  const outputProjectionCode = [
    'class TransformerDecoder(nn.Module):',
    '    def __init__(self, vocab_size, d_model, num_heads, ',
    '                 num_layers, d_ff, max_len=512,',
    '                 tie_weights=True):',
    '        super().__init__()',
    '        self.embedding = nn.Embedding(vocab_size, d_model)',
    '        self.pos_encoding = PositionalEncoding(d_model, max_len)',
    '        ',
    '        self.layers = nn.ModuleList([',
    '            DecoderLayer(d_model, num_heads, d_ff)',
    '            for _ in range(num_layers)',
    '        ])',
    '        ',
    '        self.final_norm = nn.LayerNorm(d_model)',
    '        ',
    '        # Output projection',
    '        self.output_proj = nn.Linear(d_model, vocab_size)',
    '        ',
    '        # Weight tying',
    '        if tie_weights:',
    '            self.output_proj.weight = self.embedding.weight',
    '    ',
    '    def forward(self, tgt, memory, tgt_mask=None):',
    '        # Embed target tokens',
    '        x = self.embedding(tgt)',
    '        x = self.pos_encoding(x)',
    '        ',
    '        # Pass through decoder layers',
    '        for layer in self.layers:',
    '            x = layer(x, memory, tgt_mask)',
    '        ',
    '        x = self.final_norm(x)',
    '        ',
    '        # Project to vocabulary',
    '        logits = self.output_proj(x)  # [batch, seq_len, vocab_size]',
    '        return logits',
    '',
    '# Usage',
    'model = TransformerDecoder(',
    '    vocab_size=30000,',
    '    d_model=512,',
    '    num_heads=8,',
    '    num_layers=6,',
    '    d_ff=2048,',
    '    tie_weights=True',
    ')',
    '',
    '# Training',
    'tgt = torch.randint(0, 30000, (32, 128))  # [batch, seq_len]',
    'encoder_output = torch.randn(32, 128, 512)  # from encoder',
    'logits = model(tgt, encoder_output)  # [32, 128, 30000]',
  ].join('\n');

  const fullDecoderCode = [
    'class TransformerDecoder(nn.Module):',
    '    def __init__(self, vocab_size, d_model=512, num_heads=8,',
    '                 num_layers=6, d_ff=2048, max_len=512,',
    '                 dropout=0.1, tie_weights=True):',
    '        super().__init__()',
    '        self.d_model = d_model',
    '        self.num_layers = num_layers',
    '        ',
    '        # Embedding + positional encoding',
    '        self.embedding = nn.Embedding(vocab_size, d_model)',
    '        self.pos_encoding = PositionalEncoding(d_model, max_len)',
    '        self.dropout = nn.Dropout(dropout)',
    '        ',
    '        # Stack of decoder layers',
    '        self.layers = nn.ModuleList([',
    '            DecoderLayer(d_model, num_heads, d_ff, dropout)',
    '            for _ in range(num_layers)',
    '        ])',
    '        ',
    '        self.final_norm = nn.LayerNorm(d_model)',
    '        self.output_proj = nn.Linear(d_model, vocab_size)',
    '        ',
    '        if tie_weights:',
    '            self.output_proj.weight = self.embedding.weight',
    '        ',
    '        self._init_weights()',
    '    ',
    '    def _init_weights(self):',
    '        for p in self.parameters():',
    '            if p.dim() > 1:',
    '                nn.init.xavier_uniform_(p)',
    '    ',
    '    def forward(self, tgt, memory, ',
    '                tgt_mask=None, memory_mask=None):',
    '        seq_len = tgt.size(1)',
    '        ',
    '        # Create causal mask',
    '        if tgt_mask is None:',
    '            tgt_mask = self._generate_causal_mask(seq_len, tgt.device)',
    '        ',
    '        # Embed and add positional encoding',
    '        x = self.embedding(tgt) * (self.d_model ** 0.5)',
    '        x = self.pos_encoding(x)',
    '        x = self.dropout(x)',
    '        ',
    '        # Decoder layers',
    '        for layer in self.layers:',
    '            x = layer(x, memory, tgt_mask)',
    '        ',
    '        x = self.final_norm(x)',
    '        logits = self.output_proj(x)',
    '        ',
    '        return logits',
    '    ',
    '    def _generate_causal_mask(self, seq_len, device):',
    '        mask = torch.triu(',
    '            torch.ones(seq_len, seq_len, device=device), ',
    '            diagonal=1',
    '        )',
    '        return mask.masked_fill(mask == 1, float(\'-inf\'))',
    '',
    '',
    '# Complete Seq2Seq Model',
    'class Seq2SeqTransformer(nn.Module):',
    '    def __init__(self, src_vocab, tgt_vocab, d_model=512,',
    '                 num_heads=8, num_layers=6, d_ff=2048):',
    '        super().__init__()',
    '        self.encoder = TransformerEncoder(',
    '            src_vocab, d_model, num_heads, num_layers, d_ff',
    '        )',
    '        self.decoder = TransformerDecoder(',
    '            tgt_vocab, d_model, num_heads, num_layers, d_ff',
    '        )',
    '    ',
    '    def forward(self, src, tgt, src_mask=None, tgt_mask=None):',
    '        memory = self.encoder(src, src_mask)',
    '        output = self.decoder(tgt, memory, tgt_mask)',
    '        return output',
    '',
    '# Inference helper',
    'def greedy_decode(model, src, max_len, start_token, end_token):',
    '    memory = model.encoder(src)',
    '    ys = torch.full((src.size(0), 1), start_token, dtype=torch.long)',
    '    ',
    '    for _ in range(max_len - 1):',
    '        tgt_mask = model.decoder._generate_causal_mask(',
    '            ys.size(1), ys.device',
    '        )',
    '        logits = model.decoder(ys, memory, tgt_mask)',
    '        next_token = logits[:, -1, :].argmax(dim=-1, keepdim=True)',
    '        ys = torch.cat([ys, next_token], dim=1)',
    '        ',
    '        if (next_token == end_token).all():',
    '            break',
    '    ',
    '    return ys',
  ].join('\n');

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <nav className="w-56 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-1">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3 uppercase tracking-wider">
            Decoder Lesson
          </h3>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {section.icon} {section.title}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-w-0 max-w-3xl">
        {activeSection === 'overview' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Decoder Overview</h2>
            
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                The Transformer decoder generates output sequences autoregressively—producing one token at a time
                while attending to both previously generated tokens and the encoder&apos;s output.
              </p>

              <InsightBox title="🎯 Key Insight: Autoregressive Generation">
                Unlike the encoder which processes all tokens in parallel, the decoder generates tokens sequentially.
                At each step, it can only see tokens generated so far (not future tokens), which is enforced by causal masking.
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Encoder vs Decoder</h3>
              <ComparisonTable />

              <h3 className="font-semibold text-lg mt-6">Decoder Layer Components</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Masked Multi-Head Self-Attention:</strong> attends to previous tokens only</li>
                <li><strong>Cross-Attention:</strong> attends to encoder output (Q from decoder, K/V from encoder)</li>
                <li><strong>Feed-Forward Network:</strong> same as encoder</li>
                <li><strong>Residual Connections + LayerNorm:</strong> same as encoder</li>
              </ul>

              <MathBlock>
                <p>Decoder Input: shifted right token sequence</p>
                <p>For i in range(num_layers):</p>
                <p className="ml-4">x = LayerNorm(x + MaskedSelfAttention(x))</p>
                <p className="ml-4">x = LayerNorm(x + CrossAttention(x, encoder_output))</p>
                <p className="ml-4">x = LayerNorm(x + FFN(x))</p>
                <p>Output: logits over vocabulary</p>
              </MathBlock>

              <CodeBlock title="decoder_overview.py" code={overviewCode} />
            </div>
          </section>
        )}

        {activeSection === 'masked' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Masked Self-Attention</h2>
            
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Masked self-attention is identical to regular self-attention except it prevents positions from
                attending to subsequent positions. This is crucial for autoregressive generation.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Formulation</h3>
              <MathBlock>
                <p>Q = XW_Q, K = XW_K, V = XW_V</p>
                <p>Attention(Q, K, V) = softmax(QK^T / sqrt(d_k) + M) V</p>
                <p>where M_ij = -INF if j {'>'} i, else 0</p>
              </MathBlock>

              <InsightBox title="🔑 Key Difference from Encoder">
                The only difference is the mask matrix M. In encoder (BERT), all tokens can attend to each other.
                In decoder (GPT), token i can only attend to tokens 0, 1, ..., i.
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Why Causal Masking?</h3>
              <p>
                During training, we process all tokens in parallel for efficiency. But the model should not
                &quot;cheat&quot; by looking at future tokens. The mask ensures that at position i, the model
                only uses information from positions 0 to i.
              </p>

              <CausalMaskVisualization />

              <h3 className="font-semibold text-lg mt-6">Mask Creation</h3>
              <CodeBlock title="causal_mask.py" code={causalMaskCode} />

              <InsightBox title="💡 Implementation Note">
                In practice, we add the mask to attention scores before softmax.
                -INF positions become 0 after softmax, effectively masking those attention weights.
              </InsightBox>
            </div>
          </section>
        )}

        {activeSection === 'cross' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Cross-Attention</h2>
            
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Cross-attention is the mechanism that allows the decoder to attend to the encoder&apos;s output.
                It uses Q from the decoder and K, V from the encoder.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Formulation</h3>
              <MathBlock>
                <p>Q_dec = X_dec * W_Q</p>
                <p>K_enc = X_enc * W_K</p>
                <p>V_enc = X_enc * W_V</p>
                <p>CrossAttn(Q_dec, K_enc, V_enc) = softmax(Q_dec * K_enc^T / sqrt(d_k)) * V_enc</p>
              </MathBlock>

              <CrossAttentionVisualization />

              <h3 className="font-semibold text-lg mt-6">Intuition</h3>
              <p>
                Cross-attention answers: <em>&quot;For each decoder position, which encoder positions are most relevant?&quot;</em>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>In machine translation: decoder attends to relevant source words</li>
                <li>In summarization: decoder attends to relevant parts of input</li>
                <li>In QA: decoder attends to relevant context passages</li>
              </ul>

              <h3 className="font-semibold text-lg mt-6">Cross-Attention vs Self-Attention</h3>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full mt-4">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">Aspect</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">Self-Attention</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2">Cross-Attention</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Q source</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Same sequence</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Decoder</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">K, V source</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Same sequence</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Encoder output</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Mask</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Causal (decoder)</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">None (full attention)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock title="cross_attention.py" code={crossAttentionCode} />
            </div>
          </section>
        )}

        {activeSection === 'ffn' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Feed-Forward Network</h2>
            
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                The FFN in the decoder is identical to the encoder&apos;s FFN. It applies a position-wise
                (applied independently to each position) transformation.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Formulation</h3>
              <MathBlock>
                <p>FFN(x) = GELU(xW_1 + b_1)W_2 + b_2</p>
                <p>where W_1 &isin; R{'{'}d_model x d_ff{'}'}, W_2 &isin; R{'{'}d_ff x d_model{'}'}</p>
                <p>Typically d_ff = 4 x d_model</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Why Position-wise?</h3>
              <p>
                The same FFN is applied to each position independently. This is equivalent to a 1x1 convolution.
                The non-linearity comes from the GELU activation between the two linear layers.
              </p>

              <h3 className="font-semibold text-lg mt-6">GELU Activation</h3>
              <MathBlock>
                <p>GELU(x) = x * Phi(x)</p>
                <p>where Phi(x) is the CDF of standard normal distribution</p>
                <p>Approximation: GELU(x) ~ 0.5x(1 + tanh(sqrt(2/pi)(x + 0.044715x^3)))</p>
              </MathBlock>

              <InsightBox title="💡 GELU vs ReLU">
                GELU is smoother than ReLU and allows small negative values to pass through.
                This has been shown to improve training stability and performance in transformers.
              </InsightBox>

              <CodeBlock title="feedforward.py" code={feedforwardCode} />
            </div>
          </section>
        )}

        {activeSection === 'residual' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Residual Connection & Layer Normalization</h2>
            
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                The decoder uses the same residual connection pattern as the encoder, applied after each
                sub-layer (masked attention, cross-attention, FFN).
              </p>

              <h3 className="font-semibold text-lg mt-6">Residual Connection Pattern</h3>
              <MathBlock>
                <p>For each sub-layer (attn, cross-attn, FFN):</p>
                <p>output = LayerNorm(x + SubLayer(x))</p>
                <p>This creates a &quot;residual stream&quot; through the network</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Layer Normalization</h3>
              <MathBlock>
                <p>LayerNorm(x) = gamma * (x - mu) / sqrt(sigma^2 + epsilon) + beta</p>
                <p>where mu, sigma^2 are mean and variance across features (not batch)</p>
                <p>gamma, beta are learnable scale and shift parameters</p>
              </MathBlock>

              <InsightBox title="🔑 Why Residual Connections Matter">
                <ul className="list-disc list-inside space-y-1">
                  <li>Prevent vanishing gradients in deep networks</li>
                  <li>Allow gradients to flow directly through the skip connections</li>
                  <li>Enable training of very deep transformers (100+ layers)</li>
                </ul>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Pre-Norm vs Post-Norm</h3>
              <p>Two common variants exist:</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-sm mb-2">Post-Norm (Original)</h4>
                  <MathBlock>
                    <p>x = LayerNorm(x + SubLayer(x))</p>
                  </MathBlock>
                  <p className="text-xs text-gray-500">Used in original Transformer paper</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-sm mb-2">Pre-Norm (Modern)</h4>
                  <MathBlock>
                    <p>x = x + SubLayer(LayerNorm(x))</p>
                  </MathBlock>
                  <p className="text-xs text-gray-500">Used in GPT-2+, more stable training</p>
                </div>
              </div>

              <CodeBlock title="residual_layernorm.py" code={residualLayernormCode} />
            </div>
          </section>
        )}

        {activeSection === 'output' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Output Projection</h2>
            
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                After the final decoder layer, the output is projected to vocabulary logits
                and converted to probabilities via softmax.
              </p>

              <h3 className="font-semibold text-lg mt-6">Output Pipeline</h3>
              <MathBlock>
                <p>decoder_output: [batch, seq_len, d_model]</p>
                <p>logits = decoder_output * W_vocab + b_vocab</p>
                <p>logits: [batch, seq_len, vocab_size]</p>
                <p>probs = softmax(logits / temperature)</p>
                <p>next_token = argmax(probs) during inference</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Weight Tying (Optional)</h3>
              <p>
                Many modern transformers tie (share) the output projection weights with the input embedding matrix.
                This reduces parameters and often improves performance.
              </p>
              <MathBlock>
                <p>W_vocab = W_embedding^T</p>
                <p>This works because: embed(word) and project_to_vocab(word) should be inverses</p>
              </MathBlock>

              <InsightBox title="💡 Weight Tying Intuition">
                If two words have similar embeddings, they should have similar probabilities of being predicted.
                Weight tying enforces this symmetry.
              </InsightBox>

              <CodeBlock title="output_projection.py" code={outputProjectionCode} />
            </div>
          </section>
        )}

        {activeSection === 'full' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Full Decoder Architecture</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                The complete Transformer decoder combines all components. Let&apos;s see how everything fits together.
              </p>

              <h3 className="font-semibold text-lg mt-6">Interactive Architecture Diagram</h3>
              <DecoderDiagram />

              <h3 className="font-semibold text-lg mt-6">Complete Decoder Layer</h3>
              <MathBlock>
                <p>x = Embedding(target_tokens) + PositionalEncoding</p>
                <p>For each layer:</p>
                <p className="ml-4">x = LayerNorm(x + MaskedMultiHeadSelfAttention(x))</p>
                <p className="ml-4">x = LayerNorm(x + MultiHeadCrossAttention(x, encoder_output))</p>
                <p className="ml-4">x = LayerNorm(x + FeedForward(x))</p>
                <p>logits = OutputProjection(x)</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Full Seq2Seq (Encoder-Decoder)</h3>
              <MathBlock>
                <p>encoder_output = Encoder(source_tokens)</p>
                <p>start_token = &lt;s&gt;</p>
                <p>for t in range(max_len):</p>
                <p className="ml-4">logits = Decoder(partial_output, encoder_output)</p>
                <p className="ml-4">next_token = argmax(logits[:, -1, :])</p>
                <p className="ml-4">partial_output = concat(partial_output, next_token)</p>
                <p className="ml-4">if next_token == &lt;e&gt;: break</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="full_decoder.py" code={fullDecoderCode} />

              <InsightBox title="🎯 Summary: Encoder vs Decoder">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Encoder:</strong> Bidirectional attention, processes full input, outputs contextual representations</li>
                  <li><strong>Decoder:</strong> Causal attention, autoregressive generation, cross-attends to encoder</li>
                  <li><strong>Together:</strong> Seq2Seq models for translation, summarization, etc.</li>
                </ul>
              </InsightBox>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
