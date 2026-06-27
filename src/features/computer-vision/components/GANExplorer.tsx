'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const LATENT_DIM = 8;
const IMAGE_SIZE = 28;
const MAX_EPOCHS = 50;

function generateRealImage(seed: number): number[][] {
  const img: number[][] = Array.from({ length: IMAGE_SIZE }, () =>
    Array.from({ length: IMAGE_SIZE }, () => 0)
  );
  const cx = Math.floor(seededRandom(seed * 7) * 20 + 4);
  const cy = Math.floor(seededRandom(seed * 13) * 20 + 4);
  const r = Math.floor(seededRandom(seed * 3) * 6 + 4);
  for (let y = 0; y < IMAGE_SIZE; y++) {
    for (let x = 0; x < IMAGE_SIZE; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < r) img[y][x] = seededRandom(y * 17 + x * 11 + seed) * 0.3 + 0.7;
      else if (dist < r + 2) img[y][x] = seededRandom(y * 5 + x * 23 + seed + 100) * 0.3;
    }
  }
  return img;
}

function generateFakeImage(latent: number[], improvement: number): number[][] {
  const img: number[][] = Array.from({ length: IMAGE_SIZE }, () =>
    Array.from({ length: IMAGE_SIZE }, () => 0)
  );
  const cx = 14 + latent[0] * 5;
  const cy = 14 + latent[1] * 5;
  const radius = 3 + Math.abs(latent[2]) * 3;
  for (let y = 0; y < IMAGE_SIZE; y++) {
    for (let x = 0; x < IMAGE_SIZE; x++) {
      let val = 0;
      for (let i = 0; i < LATENT_DIM; i++) {
        val += latent[i] * Math.sin((x * (i + 1) + y * (i + 1)) * 0.1);
      }
      const noiseVal = Math.max(0, Math.min(1, (Math.sin(val) + 1) / 2));
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      let targetVal = 0;
      if (dist < radius) targetVal = 0.85;
      else if (dist < radius + 2) targetVal = 0.15;
      img[y][x] = noiseVal * (1 - improvement) + targetVal * improvement;
    }
  }
  return img;
}

const PHASES = [
  { label: 'Real batch → D(x)', desc: 'Discriminator classifies real images as real', color: 'text-green-600 dark:text-green-400', border: 'border-green-400' },
  { label: 'Noise → G → D(G(z))', desc: 'Generator creates fakes, Discriminator classifies them', color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-400' },
  { label: 'Update Discriminator', desc: 'D learns to better distinguish real from fake', color: 'text-red-600 dark:text-red-400', border: 'border-red-400' },
  { label: 'Update Generator', desc: 'G learns to produce more realistic fakes', color: 'text-purple-600 dark:text-purple-400', border: 'border-purple-400' },
];

export default function GANExplorer() {
  const [epoch, setEpoch] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [trainPhase, setTrainPhase] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');
  const [realImages] = useState(() =>
    Array.from({ length: 4 }, (_, i) => generateRealImage(i * 31 + 7))
  );
  const latentVectors = useRef(
    Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: LATENT_DIM }, (_, j) => seededRandom(i * 100 + j * 7 + 42) * 2 - 1)
    )
  );
  const [fakeImages, setFakeImages] = useState(() =>
    latentVectors.current.map(latent => generateFakeImage(latent, 0))
  );
  const [dRealScore, setDRealScore] = useState(0.88);
  const [dFakeScore, setDFakeScore] = useState(0.15);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const improvement = Math.min(1, epoch / MAX_EPOCHS);

  const trainStep = useCallback(() => {
    setEpoch(e => {
      const next = e + 1;
      const imp = Math.min(1, next / MAX_EPOCHS);
      setFakeImages(latentVectors.current.map(latent => generateFakeImage(latent, imp)));
      setDRealScore(0.85 + seededRandom(next * 3 + 1) * 0.1);
      setDFakeScore(0.15 + imp * 0.35 + seededRandom(next * 7 + 100) * 0.02);
      return next;
    });
    setTrainPhase(prev => (prev + 1) % PHASES.length);
  }, []);

  const toggleTraining = useCallback(() => {
    if (isTraining) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setIsTraining(false);
    } else {
      setIsTraining(true);
      intervalRef.current = setInterval(trainStep, 700);
    }
  }, [isTraining, trainStep]);

  const reset = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsTraining(false);
    setEpoch(0);
    setTrainPhase(0);
    latentVectors.current = Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: LATENT_DIM }, (_, j) => seededRandom(i * 100 + j * 7 + 42) * 2 - 1)
    );
    setFakeImages(latentVectors.current.map(latent => generateFakeImage(latent, 0)));
    setDRealScore(0.88);
    setDFakeScore(0.15);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">GAN Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Generative Adversarial Networks pit a Generator against a Discriminator in a minimax
          game — the Generator learns to create realistic data while the Discriminator learns to
          tell real from fake.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold mb-3">Training Controls</h3>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={toggleTraining}
              className={`px-4 py-2 text-sm rounded cursor-pointer transition-colors ${
                isTraining ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
              {isTraining ? 'Stop Training' : 'Start Training'}
            </button>
            <button onClick={reset}
              className="px-4 py-2 text-sm rounded cursor-pointer transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
              Reset
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Epoch: {epoch}</span>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold text-green-600 dark:text-green-400">D(x): </span>
                <span className="text-gray-700 dark:text-gray-300">{dRealScore.toFixed(3)}</span>
              </div>
              <div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">D(G(z)): </span>
                <span className="text-gray-700 dark:text-gray-300">{dFakeScore.toFixed(3)}</span>
              </div>
              <div>
                <span className="font-semibold text-purple-600 dark:text-purple-400">Convergence: </span>
                <span className="text-gray-700 dark:text-gray-300">{(improvement * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {isTraining && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-l-4 border-indigo-400">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-indigo-900 dark:text-indigo-200 font-semibold">
                  {PHASES[trainPhase].label}
                </span>
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                {PHASES[trainPhase].desc}
              </div>
              <div className="flex gap-1 mt-2">
                {PHASES.map((p, i) => (
                  <div key={i} className={`flex-1 h-1 rounded transition-colors ${
                    i === trainPhase ? 'bg-indigo-500' : i < trainPhase ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div animate={isTraining && (trainPhase === 0 || trainPhase === 2) ? { scale: 1.02 } : {}}>
            <h3 className="font-semibold text-sm mb-3 text-center text-green-700 dark:text-green-400">
              Real Images (from Dataset)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {realImages.map((img, i) => (
                <div key={i} className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white">
                  <svg viewBox={`0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}`} className="w-full">
                    {img.map((row, y) => row.map((val, x) => (
                      <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1}
                        fill={`rgba(34,197,94,${val})`} />
                    )))}
                  </svg>
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
              Real data distribution — simple circles
            </p>
          </motion.div>

          <motion.div animate={isTraining && (trainPhase === 1 || trainPhase === 3) ? { scale: 1.02 } : {}}>
            <h3 className="font-semibold text-sm mb-3 text-center text-blue-700 dark:text-blue-400">
              Fake Images (from Generator)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {fakeImages.map((img, i) => (
                <div key={i} className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white">
                  <svg viewBox={`0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}`} className="w-full">
                    {img.map((row, y) => row.map((val, x) => (
                      <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1}
                        fill={`rgba(59,130,246,${val})`} />
                    )))}
                  </svg>
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
              Generated samples {improvement > 0.5 ? '— converging to real distribution' : '— improving over time'}
            </p>
          </motion.div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div animate={isTraining && (trainPhase === 1 || trainPhase === 3) ? { scale: 1.03 } : {}}
            className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
            <h3 className="font-semibold text-sm mb-2">Generator (G)</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Takes random noise z ~ p(z) and transforms it into fake data G(z). Aims to
              maximize D(G(z)) — fool the discriminator. Learns the mapping from latent space
              to data distribution.
            </p>
            <div className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded">
              Loss<sub>G</sub> = log(1 − D(G(z)))
            </div>
          </motion.div>

          <motion.div animate={isTraining && (trainPhase === 0 || trainPhase === 2) ? { scale: 1.03 } : {}}
            className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400">
            <h3 className="font-semibold text-sm mb-2">Discriminator (D)</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Binary classifier that distinguishes real from fake. Maximizes D(x) for real data
              and minimizes D(G(z)) for fake. Provides gradient signal to improve the generator.
            </p>
            <div className="mt-2 text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded">
              Loss<sub>D</sub> = −(log(D(x)) + log(1 − D(G(z))))
            </div>
          </motion.div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">GAN Variants</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-purple-700 dark:text-purple-400">DCGAN</span>
              <div className="text-gray-600 dark:text-gray-400">Convolutional GAN</div>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-purple-700 dark:text-purple-400">WGAN</span>
              <div className="text-gray-600 dark:text-gray-400">Wasserstein distance</div>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-purple-700 dark:text-purple-400">StyleGAN</span>
              <div className="text-gray-600 dark:text-gray-400">Style-based generator</div>
            </div>
            <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-purple-700 dark:text-purple-400">cGAN</span>
              <div className="text-gray-600 dark:text-gray-400">Conditional generation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button onClick={() => setShowLearn(!showLearn)}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 flex items-center justify-between cursor-pointer hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-950/50 dark:hover:to-blue-950/50 transition-all">
          <span className="font-semibold text-sm">Learn GANs</span>
          <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
        </button>
        <AnimatePresence>
          {showLearn && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  {[
                    { id: 'analogy' as const, label: '💡 Analogy', },
                    { id: 'steps' as const, label: '📝 How It Works', },
                    { id: 'simple' as const, label: '🐍 Simple PyTorch', },
                    { id: 'scratch' as const, label: '🔧 From Scratch', },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setLearnTab(tab.id)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-all ${
                        learnTab === tab.id
                          ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {learnTab === 'analogy' && (
                    <motion.div key="analogy" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
                        <h4 className="font-semibold text-sm mb-2">🎨 Art Forger vs Art Critic</h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                          Imagine an <strong>art forger</strong> (Generator) trying to create realistic paintings,
                          while an <strong>art critic</strong> (Discriminator) tries to detect forgeries:
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-purple-600 text-[10px] mb-2">🎨 Generator (Forger)</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              Takes random inspiration (noise) and creates fake paintings.
                              Tries to fool the critic into thinking they&apos;re real.
                            </div>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-red-600 text-[10px] mb-2">🔍 Discriminator (Critic)</div>
                            <div className="text-[10px] text-gray-600 dark:text-gray-400">
                              Examines paintings and decides: real or fake?
                              Gets better at spotting forgeries over time.
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          As they compete, the forger gets better at creating realistic art, and the critic
                          gets better at detecting fakes. Eventually, the forger creates art that&apos;s
                          <strong> indistinguishable from real paintings</strong> — that&apos;s Nash equilibrium!
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
                          <h5 className="font-semibold text-[10px] mb-1 text-amber-700 dark:text-amber-400">🎯 The Training Dance</h5>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            Think of it like a dance: The forger shows a painting, the critic says &quot;fake!&quot;
                            The forger learns from the feedback and tries again. Over hundreds of rounds,
                            the forger&apos;s technique improves until the critic can&apos;t tell anymore.
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
                          <h5 className="font-semibold text-[10px] mb-1 text-blue-700 dark:text-blue-400">⚖️ Balance is Key</h5>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            If the critic is too good early on, the forger gives up (vanishing gradients).
                            If the forger is too good, the critic can&apos;t learn (mode collapse).
                            They must improve together — like sparring partners.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
                        <h5 className="font-semibold text-[10px] mb-1 text-green-700 dark:text-green-400">🏆 Nash Equilibrium</h5>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                          The end goal: The critic guesses randomly (50/50) because every painting looks real.
                          The forger has learned the true distribution of art. Neither can improve without
                          the other changing strategy — this is the Nash equilibrium.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'steps' && (
                    <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: 'Sample Random Noise', desc: 'Draw z from simple distribution (usually Gaussian). This is the "seed" for generation.', formula: 'z ~ N(0, I)' },
                          { step: 2, title: 'Generate Fake Image', desc: 'Generator transforms noise into a fake image. Initially random noise, gradually improves.', formula: 'x_fake = G(z)' },
                          { step: 3, title: 'D Classifies Real vs Fake', desc: 'Discriminator outputs probability: 1 = real, 0 = fake. Trained on both real and fake images.', formula: 'D(x) → [0, 1]' },
                          { step: 4, title: 'Update Discriminator', desc: 'D learns to correctly classify real as 1 and fake as 0. Binary cross-entropy loss.', formula: 'L_D = -[log D(x_real) + log(1 - D(x_fake))]' },
                          { step: 5, title: 'Update Generator', desc: 'G learns to make D(G(z)) close to 1. Wants to fool the discriminator.', formula: 'L_G = -log D(G(z))' },
                          { step: 6, title: 'Repeat Until Convergence', desc: 'At equilibrium: D(x) = D(G(z)) = 0.5. Generator produces realistic samples.', formula: 'D(x) = D(G(z)) = 0.5' },
                        ].map(item => (
                          <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                              <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
                        <strong>Training tip:</strong> G and D must be balanced. If D is too strong, G gets no
                        useful gradients (vanishing). If G is too strong, D can't distinguish real from fake
                        (mode collapse). Typical ratio: 1 step of G per 1-5 steps of D.
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'simple' && (
                    <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">Basic GAN with PyTorch nn.Sequential</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch
import torch.nn as nn

# Simple Generator: noise → image
G = nn.Sequential(
    nn.Linear(64, 128),
    nn.ReLU(),
    nn.Linear(128, 784),
    nn.Sigmoid()  # Output in [0, 1]
)

# Simple Discriminator: image → real/fake
D = nn.Sequential(
    nn.Linear(784, 128),
    nn.LeakyReLU(0.2),
    nn.Linear(128, 1),
    nn.Sigmoid()
)

criterion = nn.BCELoss()
opt_g = torch.optim.Adam(G.parameters(), lr=2e-4)
opt_d = torch.optim.Adam(D.parameters(), lr=2e-4)

# Training loop
for epoch in range(100):
    # === Train Discriminator ===
    z = torch.randn(32, 64)
    fake = G(z).detach()  # Detach so G doesn't update
    
    real_loss = criterion(D(real_images), torch.ones(32, 1))
    fake_loss = criterion(D(fake), torch.zeros(32, 1))
    d_loss = (real_loss + fake_loss) / 2
    
    opt_d.zero_grad()
    d_loss.backward()
    opt_d.step()
    
    # === Train Generator ===
    z = torch.randn(32, 64)
    fake = G(z)
    g_loss = criterion(D(fake), torch.ones(32, 1))
    
    opt_g.zero_grad()
    g_loss.backward()
    opt_g.step()

print(f"D loss: {d_loss:.4f}, G loss: {g_loss:.4f}")`}</pre>
                      </div>
                    </motion.div>
                  )}

                  {learnTab === 'scratch' && (
                    <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <div className="text-[10px] text-gray-400 mb-2">GAN from scratch — manual gradients</div>
                        <pre className="text-xs text-gray-100 font-mono whitespace-pre">{`import torch

class Generator(torch.nn.Module):
    def __init__(self, latent_dim=64, hidden=128, img_dim=784):
        super().__init__()
        self.fc1 = torch.nn.Linear(latent_dim, hidden)
        self.fc2 = torch.nn.Linear(hidden, img_dim)
    
    def forward(self, z):
        z = torch.relu(self.fc1(z))
        return torch.sigmoid(self.fc2(z))

class Discriminator(torch.nn.Module):
    def __init__(self, img_dim=784, hidden=128):
        super().__init__()
        self.fc1 = torch.nn.Linear(img_dim, hidden)
        self.fc2 = torch.nn.Linear(hidden, 1)
    
    def forward(self, x):
        x = torch.nn.functional.leaky_relu(self.fc1(x), 0.2)
        return torch.sigmoid(self.fc2(x))

# Initialize
G = Generator()
D = Discriminator()
lr = 0.001

for epoch in range(100):
    # --- Train Discriminator ---
    z = torch.randn(32, 64)
    fake = G(z).detach()
    
    # D(real) should be 1, D(fake) should be 0
    d_real = D(real_images)
    d_fake = D(fake)
    
    d_loss = -torch.mean(
        torch.log(d_real + 1e-8) + 
        torch.log(1 - d_fake + 1e-8)
    )
    
    # Manual backward pass
    d_loss.backward()
    for p in D.parameters():
        p.data -= lr * p.grad
        p.grad.zero_()
    
    # --- Train Generator ---
    z = torch.randn(32, 64)
    fake = G(z)
    d_fake = D(fake)
    
    # G wants D(fake) to be 1 (fool discriminator)
    g_loss = -torch.mean(torch.log(d_fake + 1e-8))
    
    g_loss.backward()
    for p in G.parameters():
        p.data -= lr * p.grad
        p.grad.zero_()

print(f"D loss: {d_loss:.4f}, G loss: {g_loss:.4f}")`}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
