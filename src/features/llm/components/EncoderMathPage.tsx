'use client';

import React, { useState } from 'react';
import EncoderDiagram from './EncoderDiagram';

const SECTIONS = [
  { id: 'embeddings', title: '1. Input Embeddings', icon: '📦' },
  { id: 'positional', title: '2. Positional Encoding', icon: '📍' },
  { id: 'attention', title: '3. Self-Attention', icon: '🔍' },
  { id: 'multihead', title: '4. Multi-Head Attention', icon: '👥' },
  { id: 'residual', title: '5. Residual & LayerNorm', icon: '🔗' },
  { id: 'ffn', title: '6. Feed-Forward Network', icon: '⚡' },
  { id: 'full', title: '7. Full Encoder', icon: '🏗️' },
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
    <div className="my-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
      <h4 className="font-semibold text-xs text-amber-700 dark:text-amber-400 mb-1">{title}</h4>
      <div className="text-[11px] text-amber-600 dark:text-amber-300">{children}</div>
    </div>
  );
}

export default function EncoderMathPage() {
  const [activeSection, setActiveSection] = useState('embeddings');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h1 className="text-3xl font-bold mb-2">Transformer Encoder: Math & Code</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Complete mathematical intuition behind every component of the Transformer encoder,
          with corresponding PyTorch implementations.
        </p>

        <nav className="mb-6 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeSection === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </nav>

        {activeSection === 'embeddings' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Input Embeddings</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                The embedding layer converts discrete token IDs into continuous dense vectors.
                This is a lookup table: each token ID maps to a learned vector of dimension d_model.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Definition</h3>
              <MathBlock>
                <p>Given vocabulary V and embedding dimension d_model:</p>
                <p className="mt-2">E ∈ ℝ^(|V| × d_model)</p>
                <p>embedding(x) = E[x]</p>
                <p className="mt-2 text-xs text-gray-500">where x is a token ID (integer)</p>
              </MathBlock>

              <InsightBox title="Why not one-hot encoding?">
                One-hot vectors are sparse (mostly zeros) and high-dimensional (|V| = 50,000+).
                They have no notion of similarity — &quot;cat&quot; and &quot;dog&quot; are equally far apart.
                Learned embeddings put semantically similar tokens closer together in vector space.
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Dimension Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="p-2 text-left border">Component</th>
                      <th className="p-2 text-left border">Shape</th>
                      <th className="p-2 text-left border">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 border">Input</td><td className="p-2 border font-mono">[batch, seq_len]</td><td className="p-2 border">[32, 128]</td></tr>
                    <tr><td className="p-2 border">Embedding matrix</td><td className="p-2 border font-mono">[vocab_size, d_model]</td><td className="p-2 border">[50257, 768]</td></tr>
                    <tr><td className="p-2 border">Output</td><td className="p-2 border font-mono">[batch, seq_len, d_model]</td><td className="p-2 border">[32, 128, 768]</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="embedding.py" code={`import torch
import torch.nn as nn

class TokenEmbedding(nn.Module):
    def __init__(self, vocab_size: int, d_model: int):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, d_model)
        self.d_model = d_model

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [batch, seq_len] (token IDs)
        # output: [batch, seq_len, d_model]
        return self.embed(x) * math.sqrt(self.d_model)

# Example usage
embed = TokenEmbedding(vocab_size=50257, d_model=768)
tokens = torch.randint(0, 50257, (2, 10))  # batch=2, seq_len=10
output = embed(tokens)
print(output.shape)  # torch.Size([2, 10, 768])`} />

              <InsightBox title="Why multiply by √d_model?">
                The embedding values are initialized with small random values (mean ≈ 0, std ≈ 1/√d_model).
                Multiplying by √d_model scales them up so the dot products in attention are not too small.
                This is a heuristic from the original paper — PyTorch&apos;s nn.Embedding doesn&apos;t do this by default.
              </InsightBox>
            </div>
          </section>
        )}

        {activeSection === 'positional' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Positional Encoding</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Self-attention is permutation-invariant — it treats the input as a set, not a sequence.
                Positional encodings inject order information using sine and cosine functions.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Definition</h3>
              <MathBlock>
                <p>For position pos and dimension i:</p>
                <p className="mt-2">PE(pos, 2i) = sin(pos / 10000^(2i/d_model))</p>
                <p>PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))</p>
                <p className="mt-3 text-xs text-gray-500">The encoding is added to the embedding: x = embedding + PE</p>
              </MathBlock>

              <InsightBox title="Why sine and cosine?">
                <p>1. <strong>Unique per position:</strong> Each position gets a unique encoding vector.</p>
                <p>2. <strong>Relative positions:</strong> PE(pos+k) can be expressed as a linear function of PE(pos), so the model can learn relative distances.</p>
                <p>3. <strong>Bounded values:</strong> sin/cos ∈ [-1, 1], so they don&apos;t blow up with increasing position.</p>
                <p>4. <strong>Extrapolation:</strong> Can generalize to sequence lengths not seen during training.</p>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Visualization</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Positional encoding for different positions (y-axis) across dimensions (x-axis):</p>
                <div className="overflow-x-auto">
                  <svg viewBox="0 0 320 160" className="w-full max-w-lg">
                    {Array.from({ length: 20 }, (_, pos) =>
                      Array.from({ length: 16 }, (_, dim) => {
                        const val = dim % 2 === 0
                          ? Math.sin(pos / Math.pow(10000, dim / 64))
                          : Math.cos(pos / Math.pow(10000, (dim - 1) / 64));
                        const r = val > 0 ? Math.round(59 + val * 100) : 59;
                        const g = val > 0 ? 130 : Math.round(130 + Math.abs(val) * 100);
                        const b = val > 0 ? 246 : Math.round(246 - Math.abs(val) * 100);
                        return (
                          <rect
                            key={`${pos}-${dim}`}
                            x={dim * 20}
                            y={pos * 8}
                            width={18}
                            height={7}
                            fill={`rgb(${r},${g},${b})`}
                            opacity={0.3 + Math.abs(val) * 0.7}
                          />
                        );
                      })
                    )}
                  </svg>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Blue = positive, Red = negative. Each row is a position, each column is a dimension.</p>
              </div>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="positional_encoding.py" code={`import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)  # [max_len, d_model]
        position = torch.arange(0, max_len).unsqueeze(1).float()

        # Compute the frequency term: 1 / 10000^(2i/d_model)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * -(math.log(10000.0) / d_model)
        )

        # Even indices: sin
        pe[:, 0::2] = torch.sin(position * div_term)
        # Odd indices: cos
        pe[:, 1::2] = torch.cos(position * div_term)

        pe = pe.unsqueeze(0)  # [1, max_len, d_model]
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [batch, seq_len, d_model]
        # output: [batch, seq_len, d_model]
        return x + self.pe[:, :x.size(1), :]

# Example
pe = PositionalEncoding(d_model=768, max_len=5000)
x = torch.randn(2, 10, 768)  # batch=2, seq_len=10
output = pe(x)
print(output.shape)  # torch.Size([2, 10, 768])`} />

              <InsightBox title="Learned vs Fixed Positional Encodings">
                The original paper uses fixed sinusoidal encodings. BERT and GPT use learned position embeddings
                (a nn.Embedding layer for positions). Both work well in practice. Sinusoidal has the advantage
                of potentially extrapolating to longer sequences.
              </InsightBox>
            </div>
          </section>
        )}

        {activeSection === 'attention' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Self-Attention</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Self-attention allows each token to attend to all other tokens in the sequence.
                It computes a weighted sum of values, where the weights are determined by the
                compatibility between queries and keys.
              </p>

              <h3 className="font-semibold text-lg mt-6">Step 1: Compute Q, K, V</h3>
              <MathBlock>
                <p>Given input X ∈ ℝ^(seq_len × d_model):</p>
                <p className="mt-2">Q = XW_Q, K = XW_K, V = XW_V</p>
                <p className="mt-2">where W_Q, W_K, W_V ∈ ℝ^(d_model × d_k)</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Step 2: Compute Attention Scores</h3>
              <MathBlock>
                <p>scores = QK^T / √d_k</p>
                <p className="mt-2">scores ∈ ℝ^(seq_len × seq_len)</p>
                <p className="mt-2 text-xs text-gray-500">scores[i][j] = how much token i should attend to token j</p>
              </MathBlock>

              <InsightBox title="Why divide by √d_k?">
                <p>Without scaling, the dot products grow with d_k. For d_k = 64, dot products have variance ≈ 64.</p>
                <p>Large values push softmax into saturated regions (gradients ≈ 0).</p>
                <p>Dividing by √d_k normalizes the variance to ≈ 1, keeping softmax in a useful range.</p>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Step 3: Apply Masking (Decoder only)</h3>
              <MathBlock>
                <p>For causal attention (decoder):</p>
                <p className="mt-2">Mask[i][j] = 0 if j ≤ i, else -∞</p>
                <p>masked_scores = scores + Mask</p>
                <p className="mt-2 text-xs text-gray-500">This prevents token i from attending to tokens j {'>'} i</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Step 4: Softmax</h3>
              <MathBlock>
                <p>weights = softmax(masked_scores, dim=-1)</p>
                <p className="mt-2">weights[i] sums to 1.0 for each row i</p>
                <p className="mt-2 text-xs text-gray-500">weights[i][j] = probability that token i attends to token j</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Step 5: Weighted Sum of Values</h3>
              <MathBlock>
                <p>output = weights × V</p>
                <p className="mt-2">output ∈ ℝ^(seq_len × d_k)</p>
                <p className="mt-2 text-xs text-gray-500">Each token&apos;s output is a weighted combination of all Value vectors</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Complete Attention Formula</h3>
              <MathBlock>
                <p className="text-lg font-bold">Attention(Q, K, V) = softmax(QK^T / √d_k) V</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="attention.py" code={`import torch
import torch.nn as nn
import torch.nn.functional as F
import math

def scaled_dot_product_attention(
    Q: torch.Tensor,
    K: torch.Tensor,
    V: torch.Tensor,
    mask: torch.Tensor = None
) -> tuple[torch.Tensor, torch.Tensor]:
    """
    Args:
        Q: [batch, seq_len, d_k]
        K: [batch, seq_len, d_k]
        V: [batch, seq_len, d_k]
        mask: [batch, seq_len, seq_len] (optional, for causal masking)
    Returns:
        output: [batch, seq_len, d_k]
        weights: [batch, seq_len, seq_len]
    """
    d_k = Q.size(-1)

    # Step 1: Compute scores
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    # scores: [batch, seq_len, seq_len]

    # Step 2: Apply mask (if provided)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))

    # Step 3: Softmax to get weights
    weights = F.softmax(scores, dim=-1)

    # Step 4: Weighted sum of values
    output = torch.matmul(weights, V)

    return output, weights

# Example: Single head attention
batch, seq_len, d_k = 2, 10, 64
Q = torch.randn(batch, seq_len, d_k)
K = torch.randn(batch, seq_len, d_k)
V = torch.randn(batch, seq_len, d_k)

output, weights = scaled_dot_product_attention(Q, K, V)
print(f"Output: {output.shape}")    # [2, 10, 64]
print(f"Weights: {weights.shape}")  # [2, 10, 10]

# Verify weights sum to 1
print(f"Weight sums: {weights.sum(dim=-1)}")  # Should be all 1.0`} />
            </div>
          </section>
        )}

        {activeSection === 'multihead' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Multi-Head Attention</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                Instead of computing one attention function with d_model dimensions, we project
                into h separate heads of dimension d_k = d_model / h. Each head learns different
                relationship patterns.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Definition</h3>
              <MathBlock>
                <p>head_i = Attention(XW_i^Q, XW_i^K, XW_i^V)</p>
                <p className="mt-2">MultiHead(Q, K, V) = Concat(head_1, ..., head_h) W^O</p>
                <p className="mt-2">where:</p>
                <p>W_i^Q, W_i^K, W_i^V ∈ ℝ^(d_model × d_k)</p>
                <p>W^O ∈ ℝ^(d_model × d_model)</p>
                <p>d_k = d_model / h</p>
              </MathBlock>

              <InsightBox title="Why multiple heads?">
                <p>1. <strong>Different relationship types:</strong> Head 1 might learn positional patterns, Head 2 might learn syntactic dependencies, Head 3 might learn semantic similarity.</p>
                <p>2. <strong>Computational cost:</strong> h heads of d_k dimensions costs the same as 1 head of d_model dimensions (same total parameters).</p>
                <p>3. <strong>Ensemble effect:</strong> Multiple attention patterns provide robustness — if one head fails, others compensate.</p>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Parameter Count</h3>
              <MathBlock>
                <p>Per head:</p>
                <p>W_i^Q: d_model × d_k = 768 × 64 = 49,152</p>
                <p>W_i^K: d_model × d_k = 768 × 64 = 49,152</p>
                <p>W_i^V: d_model × d_k = 768 × 64 = 49,152</p>
                <p className="mt-2">Output projection W^O: d_model × d_model = 768 × 768 = 589,824</p>
                <p className="mt-2 font-bold">Total: h × (3 × d_model × d_k) + d_model² = 12 × 147,456 + 589,824 = 2,359,296</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="multi_head_attention.py" code={`import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int):
        super().__init__()
        assert d_model % num_heads == 0

        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        # Linear projections for Q, K, V
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)

        # Output projection
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None):
        """
        Args:
            x: [batch, seq_len, d_model]
            mask: optional [batch, seq_len, seq_len]
        Returns:
            output: [batch, seq_len, d_model]
        """
        batch_size, seq_len, _ = x.shape

        # 1. Linear projections and reshape
        Q = self.W_q(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        # Q, K, V: [batch, num_heads, seq_len, d_k]

        # 2. Compute attention scores
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        # scores: [batch, num_heads, seq_len, seq_len]

        # 3. Apply mask if provided
        if mask is not None:
            scores = scores.masked_fill(mask.unsqueeze(1) == 0, float('-inf'))

        # 4. Softmax to get weights
        weights = F.softmax(scores, dim=-1)

        # 5. Weighted sum of values
        context = torch.matmul(weights, V)
        # context: [batch, num_heads, seq_len, d_k]

        # 6. Reshape and project
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)
        output = self.W_o(context)
        # output: [batch, seq_len, d_model]

        return output

# Example
mha = MultiHeadAttention(d_model=768, num_heads=12)
x = torch.randn(2, 10, 768)
output = mha(x)
print(output.shape)  # [2, 10, 768]

# Count parameters
total_params = sum(p.numel() for p in mha.parameters())
print(f"Parameters: {total_params:,}")  # 2,359,296`} />
            </div>
          </section>
        )}

        {activeSection === 'residual' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Residual Connection & Layer Normalization</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                After each sub-layer (attention or FFN), we add the input back (residual connection)
                and apply layer normalization. This preserves gradients and stabilizes training.
              </p>

              <h3 className="font-semibold text-lg mt-6">Residual Connection</h3>
              <MathBlock>
                <p>output = x + Sublayer(x)</p>
                <p className="mt-2 text-xs text-gray-500">The input bypasses the sub-layer and is added to its output</p>
              </MathBlock>

              <InsightBox title="Why residual connections?">
                <p>1. <strong>Gradient flow:</strong> Gradients can flow directly through the skip connection, bypassing the sub-layer. This prevents vanishing gradients in deep networks.</p>
                <p>2. <strong>Identity mapping:</strong> If a sub-layer is not useful, the network can learn to output ≈ 0, effectively skipping it. This makes deep networks easier to train.</p>
                <p>3. <strong>Ensemble effect:</strong> A deep residual network can be viewed as an ensemble of many shallow networks.</p>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Layer Normalization</h3>
              <MathBlock>
                <p>LayerNorm(x) = γ ⊙ (x - μ) / √(σ² + ε) + β</p>
                <p className="mt-2">where:</p>
                <p>μ = mean(x, dim=-1) — mean across features</p>
                <p>σ² = var(x, dim=-1) — variance across features</p>
                <p>γ, β ∈ ℝ^d_model — learned scale and shift parameters</p>
                <p>ε — small constant for numerical stability</p>
              </MathBlock>

              <InsightBox title="LayerNorm vs BatchNorm">
                <p><strong>BatchNorm</strong> normalizes across the batch dimension. Requires large batch sizes and behaves differently during train/test.</p>
                <p><strong>LayerNorm</strong> normalizes across the feature dimension. Works with any batch size and has the same behavior during train/test.</p>
                <p>Transformers use LayerNorm because sequence lengths vary and batch sizes can be small.</p>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Pre-Norm vs Post-Norm</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-2">Post-Norm (Original)</h4>
                  <code className="text-[10px] font-mono block">x = LayerNorm(x + Sublayer(x))</code>
                  <p className="text-[10px] text-gray-500 mt-1">Used in original Transformer. Requires warmup for stable training.</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-2">Pre-Norm (Modern)</h4>
                  <code className="text-[10px] font-mono block">x = x + Sublayer(LayerNorm(x))</code>
                  <p className="text-[10px] text-gray-500 mt-1">Used in GPT-2+. More stable training, better gradients.</p>
                </div>
              </div>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="residual_layernorm.py" code={`import torch
import torch.nn as nn

class TransformerSublayer(nn.Module):
    """Generic sub-layer with residual connection and LayerNorm."""
    def __init__(self, d_model: int, sublayer_fn, pre_norm: bool = True):
        super().__init__()
        self.sublayer = sublayer_fn
        self.norm = nn.LayerNorm(d_model)
        self.pre_norm = pre_norm

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.pre_norm:
            # Pre-norm: LayerNorm → Sublayer → Residual
            return x + self.sublayer(self.norm(x))
        else:
            # Post-norm: Sublayer → Residual → LayerNorm
            return self.norm(x + self.sublayer(x))

# Example: Post-norm attention sub-layer
class PostNormAttentionSublayer(nn.Module):
    def __init__(self, d_model: int, num_heads: int):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, num_heads)
        self.norm = nn.LayerNorm(d_model)

    def forward(self, x):
        return self.norm(x + self.attention(x))

# Example: Pre-norm attention sub-layer
class PreNormAttentionSublayer(nn.Module):
    def __init__(self, d_model: int, num_heads: int):
        super().__init__()
        self.attention = MultiHeadAttention(d_model, num_heads)
        self.norm = nn.LayerNorm(d_model)

    def forward(self, x):
        return x + self.attention(self.norm(x))

# Verify shapes
d_model, num_heads = 768, 12
x = torch.randn(2, 10, d_model)

post_norm = PostNormAttentionSublayer(d_model, num_heads)
pre_norm = PreNormAttentionSublayer(d_model, num_heads)

print(post_norm(x).shape)  # [2, 10, 768]
print(pre_norm(x).shape)   # [2, 10, 768]`} />
            </div>
          </section>
        )}

        {activeSection === 'ffn' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Feed-Forward Network</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                The feed-forward network is applied independently to each position.
                It consists of two linear transformations with an activation in between.
              </p>

              <h3 className="font-semibold text-lg mt-6">Mathematical Definition</h3>
              <MathBlock>
                <p>FFN(x) = Linear_2(Activation(Linear_1(x)))</p>
                <p className="mt-2">Linear_1: ℝ^d_model → ℝ^(4 × d_model)</p>
                <p>Linear_2: ℝ^(4 × d_model) → ℝ^d_model</p>
                <p className="mt-2 text-xs text-gray-500">The hidden dimension is typically 4× the model dimension</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Activation Functions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-2">ReLU (Original)</h4>
                  <code className="text-[10px] font-mono block">ReLU(x) = max(0, x)</code>
                  <p className="text-[10px] text-gray-500 mt-1">Simple but has dead neuron problem (gradients = 0 for x &lt; 0).</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-xs mb-2">GELU (Modern)</h4>
                  <code className="text-[10px] font-mono block">GELU(x) ≈ x · Φ(x)</code>
                  <p className="text-[10px] text-gray-500 mt-1">Smoother, non-zero gradients everywhere. Used in BERT, GPT-2+.</p>
                </div>
              </div>

              <InsightBox title="Why 4× expansion?">
                <p>The expansion to 4 × d_model (e.g., 768 → 3072) allows the network to learn more complex representations.</p>
                <p>The first linear layer projects to a higher-dimensional space where nonlinear transformations can capture richer patterns.</p>
                <p>The second linear layer projects back, compressing the information to the original dimension.</p>
              </InsightBox>

              <h3 className="font-semibold text-lg mt-6">Parameter Count</h3>
              <MathBlock>
                <p>Linear_1: d_model × (4 × d_model) + (4 × d_model) = 768 × 3072 + 3072 = 2,359,296</p>
                <p>Linear_2: (4 × d_model) × d_model + d_model = 3072 × 768 + 768 = 2,359,296</p>
                <p className="mt-2 font-bold">Total: ~4.7M parameters (about half of the attention layer)</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="feedforward.py" code={`import torch
import torch.nn as nn

class FeedForward(nn.Module):
    def __init__(self, d_model: int, d_ff: int = None, activation: str = 'gelu'):
        super().__init__()
        d_ff = d_ff or 4 * d_model

        self.linear1 = nn.Linear(d_model, d_ff)
        self.linear2 = nn.Linear(d_ff, d_model)

        if activation == 'gelu':
            self.activation = nn.GELU()
        elif activation == 'relu':
            self.activation = nn.ReLU()
        else:
            raise ValueError(f"Unknown activation: {activation}")

        self.dropout = nn.Dropout(0.1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [batch, seq_len, d_model]
        # Expand
        h = self.linear1(x)       # [batch, seq_len, 4*d_model]
        h = self.activation(h)    # Apply nonlinearity
        h = self.dropout(h)
        # Project back
        output = self.linear2(h)  # [batch, seq_len, d_model]
        return output

# Example
ffn = FeedForward(d_model=768, activation='gelu')
x = torch.randn(2, 10, 768)
output = ffn(x)
print(output.shape)  # [2, 10, 768]

# Count parameters
total_params = sum(p.numel() for p in ffn.parameters())
print(f"Parameters: {total_params:,}")  # 4,720,128`} />
            </div>
          </section>
        )}

        {activeSection === 'full' && (
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Full Encoder Layer</h2>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                A complete Transformer encoder layer combines all the components we&apos;ve discussed.
                The full encoder stacks N such layers.
              </p>

              <h3 className="font-semibold text-lg mt-6">Architecture Diagram</h3>
              <EncoderDiagram />

              <h3 className="font-semibold text-lg mt-6">Complete Encoder Layer</h3>
              <MathBlock>
                <p>x = Embedding(tokens) + PositionalEncoding</p>
                <p>x = LayerNorm(x + MultiHeadSelfAttention(x))</p>
                <p>x = LayerNorm(x + FeedForward(x))</p>
                <p>output = x</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">Full Encoder (N layers)</h3>
              <MathBlock>
                <p>x_0 = Embedding(tokens) + PositionalEncoding</p>
                <p>for i in range(N):</p>
                <p className="ml-4">x_i = LayerNorm(x_{'{i-1}'} + MHA(x_{'{i-1}'}))</p>
                <p className="ml-4">x_i = LayerNorm(x_i + FFN(x_i))</p>
                <p>encoder_output = x_N</p>
              </MathBlock>

              <h3 className="font-semibold text-lg mt-6">PyTorch Implementation</h3>
              <CodeBlock title="encoder_layer.py" code={`import torch
import torch.nn as nn

class EncoderLayer(nn.Module):
    def __init__(self, d_model: int, num_heads: int, d_ff: int = None,
                 dropout: float = 0.1, pre_norm: bool = False):
        super().__init__()
        d_ff = d_ff or 4 * d_model

        # Multi-head attention
        self.self_attn = MultiHeadAttention(d_model, num_heads)
        self.norm1 = nn.LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)

        # Feed-forward network
        self.ffn = FeedForward(d_model, d_ff)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout2 = nn.Dropout(dropout)

        self.pre_norm = pre_norm

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        if self.pre_norm:
            # Pre-norm
            h = self.norm1(x)
            h = self.self_attn(h, mask)
            x = x + self.dropout1(h)

            h = self.norm2(x)
            h = self.ffn(h)
            x = x + self.dropout2(h)
        else:
            # Post-norm
            h = self.self_attn(x, mask)
            x = self.norm1(x + self.dropout1(h))

            h = self.ffn(x)
            x = self.norm2(x + self.dropout2(h))

        return x


class TransformerEncoder(nn.Module):
    def __init__(self, vocab_size: int, d_model: int = 768,
                 num_heads: int = 12, num_layers: int = 6,
                 max_len: int = 5000, dropout: float = 0.1):
        super().__init__()

        # Embedding + Positional Encoding
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoding = PositionalEncoding(d_model, max_len)
        self.dropout = nn.Dropout(dropout)

        # Stack of encoder layers
        self.layers = nn.ModuleList([
            EncoderLayer(d_model, num_heads, dropout=dropout)
            for _ in range(num_layers)
        ])

        self.norm = nn.LayerNorm(d_model)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        """
        Args:
            x: [batch, seq_len] (token IDs)
            mask: optional attention mask
        Returns:
            [batch, seq_len, d_model] (encoder output)
        """
        # Embed and add positional encoding
        x = self.embedding(x) * math.sqrt(self.d_model)
        x = self.pos_encoding(x)
        x = self.dropout(x)

        # Pass through encoder layers
        for layer in self.layers:
            x = layer(x, mask)

        # Final layer norm
        x = self.norm(x)

        return x


# Example: BERT-base configuration
encoder = TransformerEncoder(
    vocab_size=30522,  # BERT vocab size
    d_model=768,
    num_heads=12,
    num_layers=12
)

tokens = torch.randint(0, 30522, (2, 10))  # [batch=2, seq_len=10]
output = encoder(tokens)
print(f"Output shape: {output.shape}")  # [2, 10, 768]

# Count total parameters
total_params = sum(p.numel() for p in encoder.parameters())
print(f"Total parameters: {total_params:,}")  # ~86M (BERT-base)`} />

              <InsightBox title="BERT-base vs BERT-large">
                <p><strong>BERT-base:</strong> d_model=768, num_heads=12, num_layers=12 → ~86M parameters</p>
                <p><strong>BERT-large:</strong> d_model=1024, num_heads=16, num_layers=24 → ~340M parameters</p>
                <p>The encoder-only architecture is used for understanding tasks: classification, NER, question answering, sentence similarity.</p>
              </InsightBox>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
