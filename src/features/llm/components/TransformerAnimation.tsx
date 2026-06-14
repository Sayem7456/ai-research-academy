'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LayerDef {
  name: string;
  color: string;
  shape: string;
  hasResidual?: boolean;
  residualFrom?: number;
}

const ENCODER_LAYERS: LayerDef[] = [
  { name: 'Input Embeddings', color: '#3b82f6', shape: '[batch, seq_len]' },
  { name: 'Positional Encoding', color: '#8b5cf6', shape: '[batch, seq_len, d_model]' },
  { name: 'Multi-Head Self-Attention', color: '#22c55e', shape: '[batch, seq_len, d_model]', hasResidual: true, residualFrom: 2 },
  { name: 'Add & Layer Norm', color: '#eab308', shape: '[batch, seq_len, d_model]' },
  { name: 'Feed Forward Network', color: '#ef4444', shape: '[batch, seq_len, d_model]', hasResidual: true, residualFrom: 4 },
  { name: 'Add & Layer Norm', color: '#f97316', shape: '[batch, seq_len, d_model]' },
  { name: 'Output Projection', color: '#06b6d4', shape: '[batch, seq_len, vocab_size]' },
];

const DECODER_LAYERS: LayerDef[] = [
  { name: 'Input Embeddings', color: '#3b82f6', shape: '[batch, seq_len]' },
  { name: 'Positional Encoding', color: '#8b5cf6', shape: '[batch, seq_len, d_model]' },
  { name: 'Masked Self-Attention', color: '#22c55e', shape: '[batch, seq_len, d_model]', hasResidual: true, residualFrom: 2 },
  { name: 'Add & Layer Norm', color: '#eab308', shape: '[batch, seq_len, d_model]' },
  { name: 'Cross-Attention', color: '#14b8a6', shape: '[batch, seq_len, d_model]', hasResidual: true, residualFrom: 4 },
  { name: 'Add & Layer Norm', color: '#eab308', shape: '[batch, seq_len, d_model]' },
  { name: 'Feed Forward Network', color: '#ef4444', shape: '[batch, seq_len, d_model]', hasResidual: true, residualFrom: 6 },
  { name: 'Add & Layer Norm', color: '#f97316', shape: '[batch, seq_len, d_model]' },
  { name: 'Output Projection', color: '#06b6d4', shape: '[batch, seq_len, vocab_size]' },
];

function getStepDetails(arch: 'encoder' | 'decoder'): { title: string; description: string; math: string }[] {
  if (arch === 'encoder') {
    return [
      { title: 'Input Embeddings', description: 'Token IDs are converted to dense vectors of dimension d_model.', math: 'embedding = Embed(token_id)' },
      { title: 'Positional Encoding', description: 'Sine/cosine functions inject position information.', math: 'PE(pos, 2i) = sin(pos / 10000^(2i/d_model))' },
      { title: 'Multi-Head Self-Attention', description: 'Each token attends to all others. Multiple heads capture different relationships.', math: 'MultiHead(Q,K,V) = Concat(head₁,...,headₕ)Wᴼ' },
      { title: 'Add & Layer Norm', description: 'Residual connection preserves signal. LayerNorm stabilizes training.', math: 'output = LayerNorm(x + MultiHead(x))' },
      { title: 'Feed Forward Network', description: 'Two linear layers with GELU. Expands d_model to 4× then projects back.', math: 'FFN(x) = Linear₂(GELU(Linear₁(x)))' },
      { title: 'Add & Layer Norm', description: 'Second residual and normalization after FFN.', math: 'output = LayerNorm(x + FFN(x))' },
      { title: 'Output Projection', description: 'Project to vocabulary size for next-token prediction.', math: 'logits = final_hidden × W_vocab' },
    ];
  }
  return [
    { title: 'Input Embeddings', description: 'Token IDs converted to dense vectors. For generation, inputs are previous tokens.', math: 'embedding = Embed(token_id)' },
    { title: 'Positional Encoding', description: 'Position information injected via sine/cosine functions.', math: 'PE(pos, 2i) = sin(pos / 10000^(2i/d_model))' },
    { title: 'Masked Self-Attention', description: 'Causal mask prevents attending to future tokens.', math: 'Attn(Q,K,V) = softmax(QKᵀ/√dₖ + Mask)V' },
    { title: 'Add & Layer Norm', description: 'Residual connection from masked attention input.', math: 'output = LayerNorm(x + MaskedAttn(x))' },
    { title: 'Cross-Attention', description: 'Q from decoder, K/V from encoder. Decoder reads the input.', math: 'CrossAttn(Q_dec, K_enc, V_enc)' },
    { title: 'Add & Layer Norm', description: 'Residual connection from cross-attention input.', math: 'output = LayerNorm(x + CrossAttn(x, enc_out))' },
    { title: 'Feed Forward Network', description: 'Two linear layers with GELU activation.', math: 'FFN(x) = Linear₂(GELU(Linear₁(x)))' },
    { title: 'Add & Layer Norm', description: 'Residual connection from FFN input.', math: 'output = LayerNorm(x + FFN(x))' },
    { title: 'Output Projection', description: 'Project to vocabulary for next-token prediction.', math: 'logits = final_hidden × W_vocab' },
  ];
}

export default function TransformerAnimation({ onViewChange }: { onViewChange?: (view: 'encoder' | 'decoder' | 'seq2seq') => void } = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [view, setView] = useState<'encoder' | 'decoder' | 'seq2seq'>('encoder');
  const [speed, setSpeed] = useState(1200);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleViewChange = useCallback((newView: 'encoder' | 'decoder' | 'seq2seq') => {
    setView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);

  const layers = view === 'encoder' ? ENCODER_LAYERS : DECODER_LAYERS;
  const stepDetails = getStepDetails(view === 'seq2seq' ? 'encoder' : view);
  const totalSteps = view === 'seq2seq' ? 15 : layers.length;

  const stopAnim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsAnimating(false);
  }, []);

  const resetAnim = useCallback(() => { stopAnim(); setCurrentStep(0); }, [stopAnim]);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setCurrentStep(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= totalSteps - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsAnimating(false);
      }
    }, speed);
  }, [totalSteps, speed]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  useEffect(() => { resetAnim(); }, [view, resetAnim]);

  const stepForward = () => { if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1); };
  const stepBackward = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Transformer Architecture</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Walk through the Transformer block by block. See tensor shapes at each step and how encoder connects to decoder.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(['encoder', 'decoder', 'seq2seq'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleViewChange(v)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                    view === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {v === 'seq2seq' ? 'Full Seq2Seq' : v === 'encoder' ? 'Encoder (BERT)' : 'Decoder (GPT)'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={stepBackward} disabled={currentStep === 0} className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-40">← Prev</button>
              <button onClick={isAnimating ? stopAnim : startAnim} className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {isAnimating ? '■ Stop' : '▶ Animate'}
              </button>
              <button onClick={stepForward} disabled={currentStep === totalSteps - 1} className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-40">Next →</button>
              <button onClick={resetAnim} className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Reset</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Step {currentStep + 1} / {totalSteps}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Speed:</span>
                <input type="range" min={400} max={2400} step={200} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-16 accent-blue-600" />
                <span className="text-[10px] font-mono text-gray-500 w-6">{(speed / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>

        {view !== 'seq2seq' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-4">Architecture Flow</h3>
              <div className="space-y-0">
                {layers.map((layer, i) => {
                  const isActive = i <= currentStep;
                  const isCurrent = i === currentStep;
                  const showResidual = layer.hasResidual && layer.residualFrom !== undefined && i <= currentStep;

                  return (
                    <React.Fragment key={i}>
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 ${isCurrent ? 'scale-[1.02] shadow-md' : ''}`}
                        style={{ backgroundColor: isActive ? layer.color + '20' : 'transparent', borderColor: isActive ? layer.color : '#d1d5db' }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-colors duration-300" style={{ backgroundColor: isActive ? layer.color : '#9ca3af' }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{layer.name}</span>
                            {showResidual && <span className="text-[10px] text-amber-600 dark:text-amber-400">← skip</span>}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {layer.shape}
                          </span>
                        </div>
                      </div>

                      {showResidual && (
                        <div className="flex items-center py-1 pl-6">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-px bg-amber-400"></div>
                            <svg width="12" height="8" viewBox="0 0 12 8" className="text-amber-400">
                              <path d="M0,4 L8,4 M6,1 L9,4 L6,7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span className="text-[9px] text-amber-500 dark:text-amber-400 italic">residual add</span>
                          </div>
                        </div>
                      )}

                      {i < layers.length - 1 && !showResidual && (
                        <div className="flex justify-center py-0.5">
                          <div className="w-px h-2 bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex-1">
              <div className="p-6 rounded-lg border-l-4 transition-colors duration-300" style={{ borderColor: layers[currentStep].color, backgroundColor: layers[currentStep].color + '10' }}>
                <h4 className="font-bold text-lg mb-2">{stepDetails[currentStep].title}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{stepDetails[currentStep].description}</p>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg overflow-x-auto">
                  <code className="text-xs font-mono text-purple-600 dark:text-purple-400 whitespace-pre-wrap">{stepDetails[currentStep].math}</code>
                </div>
                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-center">
                  <span className="text-[10px] text-gray-500">Output shape: </span>
                  <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">{layers[currentStep].shape}</span>
                </div>
              </div>

              {view === 'decoder' && currentStep === 2 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-xs text-amber-700 dark:text-amber-400 mb-1">Causal Mask</h4>
                  <p className="text-[11px] text-amber-600 dark:text-amber-300">
                    Upper-triangular matrix of −∞ added to scores before softmax. Forces each position to only attend to previous tokens.
                  </p>
                </div>
              )}

              {view === 'decoder' && currentStep === 4 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-xs text-amber-700 dark:text-amber-400 mb-1">Cross-Attention</h4>
                  <p className="text-[11px] text-amber-600 dark:text-amber-300">
                    Q from decoder, K/V from encoder output. This lets the decoder &quot;read&quot; the full input while generating tokens.
                  </p>
                </div>
              )}

              {view === 'encoder' && currentStep === 4 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-xs text-amber-700 dark:text-amber-400 mb-1">GELU Activation</h4>
                  <p className="text-[11px] text-amber-600 dark:text-amber-300">
                    Most modern Transformers use GELU instead of ReLU. Smoother gradients, better training dynamics.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-sm mb-4">Full Encoder-Decoder (Seq2Seq)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              The encoder processes the full input in parallel. The decoder generates tokens one at a time,
              using cross-attention to read the encoder output.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 mb-3 text-center">Encoder (×N layers)</h4>
                <div className="space-y-2">
                  {ENCODER_LAYERS.filter((_, i) => i < 6).map((layer, i) => {
                    const isActive = currentStep >= 0 && currentStep <= 5 && i <= currentStep;
                    return (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs transition-all duration-300 ${isActive ? 'bg-white dark:bg-gray-800 shadow-sm' : 'opacity-40'}`}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: isActive ? layer.color : '#9ca3af' }}>{i + 1}</div>
                        <span className="flex-1 font-medium">{layer.name}</span>
                        <span className="text-[9px] font-mono text-gray-500">{layer.shape}</span>
                      </div>
                    );
                  })}
                </div>
                <div className={`mt-3 p-2 rounded text-center transition-colors duration-300 ${currentStep >= 5 ? 'bg-blue-200 dark:bg-blue-800' : 'bg-blue-100 dark:bg-blue-900'}`}>
                  <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300">enc_out → decoder</span>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-2">
                <div className="text-[10px] text-gray-500 text-center">Encoder<br/>Output</div>
                <svg width="40" height="30" viewBox="0 0 40 30" className={`transition-colors duration-300 ${currentStep >= 5 ? 'text-amber-500' : 'text-gray-300'}`}>
                  <path d="M5,15 L30,15 M25,10 L32,15 L25,20" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="text-[10px] text-gray-500 text-center">Cross-<br/>Attention</div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-2 border-green-200 dark:border-green-800">
                <h4 className="font-bold text-sm text-green-700 dark:text-green-400 mb-3 text-center">Decoder (×N layers)</h4>
                <div className="space-y-2">
                  {DECODER_LAYERS.map((layer, i) => {
                    const isCrossAttn = layer.name === 'Cross-Attention';
                    const isActive = currentStep >= 6 && (i <= currentStep - 6);
                    return (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs transition-all duration-300 ${isActive ? 'bg-white dark:bg-gray-800 shadow-sm' : 'opacity-40'} ${isCrossAttn ? 'ring-2 ring-amber-400' : ''}`}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: isActive ? layer.color : '#9ca3af' }}>{i + 1}</div>
                        <span className="flex-1 font-medium">{layer.name}</span>
                        <span className="text-[9px] font-mono text-gray-500">{layer.shape}</span>
                      </div>
                    );
                  })}
                </div>
                <div className={`mt-3 p-2 rounded text-center transition-colors duration-300 ${currentStep >= 14 ? 'bg-green-200 dark:bg-green-800' : 'bg-green-100 dark:bg-green-900'}`}>
                  <span className="text-[10px] font-mono text-green-700 dark:text-green-300">logits → next token</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Current Step</h4>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                {currentStep <= 5 ? (
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Encoder: Processing layer {currentStep + 1} of 6</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                      The encoder processes all input tokens in parallel through this layer.
                      {currentStep === 0 && ' Token IDs are converted to dense vectors.'}
                      {currentStep === 1 && ' Position information is added via sine/cosine functions.'}
                      {currentStep === 2 && ' Self-attention allows each token to attend to all others.'}
                      {currentStep === 3 && ' Residual connection and layer normalization stabilize training.'}
                      {currentStep === 4 && ' Feed-forward network expands and compresses representations.'}
                      {currentStep === 5 && ' Final encoder layer. Output is passed to decoder cross-attention.'}
                    </p>
                  </div>
                ) : currentStep <= 14 ? (
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Decoder: Generating token (layer {currentStep - 5} of 9)</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                      The decoder generates one token at a time using:
                      {currentStep - 6 === 0 && ' Embedding of previous tokens.'}
                      {currentStep - 6 === 1 && ' Position encoding for the sequence.'}
                      {currentStep - 6 === 2 && ' Masked self-attention (cannot see future tokens).'}
                      {currentStep - 6 === 3 && ' Residual + normalization.'}
                      {currentStep - 6 === 4 && ' Cross-attention to encoder output (reads the input).'}
                      {currentStep - 6 === 5 && ' Residual + normalization after cross-attention.'}
                      {currentStep - 6 === 6 && ' Feed-forward network for prediction.'}
                      {currentStep - 6 === 7 && ' Residual + normalization after FFN.'}
                      {currentStep - 6 === 8 && ' Project to vocabulary for next token prediction.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Generation Complete</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                      The decoder has processed all layers. The output logits can be argmaxed or sampled to get the next token.
                      In autoregressive generation, this process repeats: append the predicted token and run the decoder again.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">How Seq2Seq Works</h4>
              <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>1. Encoder processes input:</strong> The full input sequence (e.g., &quot;The cat sat on the mat&quot;) is processed in parallel through N encoder layers.</p>
                <p><strong>2. Encoder output stored:</strong> The final encoder output [batch, seq_len, d_model] is cached for cross-attention.</p>
                <p><strong>3. Decoder generates autoregressively:</strong> Starting with a start token, the decoder predicts one token at a time using masked self-attention + cross-attention + FFN.</p>
                <p><strong>4. Cross-attention bridges encoder-decoder:</strong> Q from decoder, K/V from encoder. The decoder learns which input tokens are relevant for each generation step.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <span className="font-semibold text-blue-700 dark:text-blue-400">Encoder-Only (BERT)</span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Bidirectional attention. Good for understanding: classification, NER, QA.</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <span className="font-semibold text-green-700 dark:text-green-400">Decoder-Only (GPT)</span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Causal attention. Good for generation: text, code, reasoning.</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Encoder-Decoder (T5)</span>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Full seq2seq. Good for transformation: translation, summarization.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
          <h3 className="font-semibold text-sm mb-2">Key Concepts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Residual Connections:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Skip connections preserve gradients, enabling 100+ layer networks.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Layer Normalization:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Normalizes across features for stable training dynamics.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Tensor Shapes:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Shapes stay consistent through most layers. Only embeddings and output projection change dimensions.</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Position Encoding:</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Required because self-attention is permutation-invariant.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
