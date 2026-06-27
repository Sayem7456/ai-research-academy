'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'minimax' | 'latent' | 'evolution';

interface LearnMoreSectionProps {
  title: string;
  gradientFrom: string;
  gradientTo: string;
  darkGradientFrom: string;
  darkGradientTo: string;
  hoverFrom: string;
  hoverTo: string;
  darkHoverFrom: string;
  darkHoverTo: string;
  analogyTitle: string;
  analogyIcon: string;
  analogyContent: React.ReactNode;
  stepsTitle: string;
  stepsContent: { step: number; title: string; desc: string; formula: string }[];
  simpleTitle: string;
  simpleCode: string;
  scratchTitle: string;
  scratchCode: string;
}

function LearnMoreSection({
  title, gradientFrom, gradientTo, darkGradientFrom, darkGradientTo,
  hoverFrom, hoverTo, darkHoverFrom, darkHoverTo,
  analogyTitle, analogyIcon, analogyContent,
  stepsTitle, stepsContent, simpleTitle, simpleCode, scratchTitle, scratchCode
}: LearnMoreSectionProps) {
  const [showLearn, setShowLearn] = useState(false);
  const [learnTab, setLearnTab] = useState<'analogy' | 'steps' | 'simple' | 'scratch'>('analogy');

  const tabs = [
    { id: 'analogy' as const, label: '💡 Analogy' },
    { id: 'steps' as const, label: '📝 How It Works' },
    { id: 'simple' as const, label: '🐍 Simple PyTorch' },
    { id: 'scratch' as const, label: '🔧 From Scratch' },
  ];

  return (
    <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setShowLearn(!showLearn)}
        className={`w-full px-4 py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo} dark:${darkGradientFrom} dark:${darkGradientTo} flex items-center justify-between cursor-pointer ${hoverFrom} ${hoverTo} dark:${darkHoverFrom} dark:${darkHoverTo} transition-all`}>
        <span className="font-semibold text-sm">{title}</span>
        <motion.span animate={{ rotate: showLearn ? 180 : 0 }} className="text-gray-500">▼</motion.span>
      </button>
      <AnimatePresence>
        {showLearn && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                {tabs.map(tab => (
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
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
                      <h4 className="font-semibold text-sm mb-2">{analogyIcon} {analogyTitle}</h4>
                      {analogyContent}
                    </div>
                  </motion.div>
                )}

                {learnTab === 'steps' && (
                  <motion.div key="steps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <h4 className="font-semibold text-sm mb-3">{stepsTitle}</h4>
                    <div className="space-y-3">
                      {stepsContent.map(item => (
                        <div key={item.step} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-xs mb-1">{item.title}</h5>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">{item.desc}</p>
                            <code className="text-[10px] font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">{item.formula}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {learnTab === 'simple' && (
                  <motion.div key="simple" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <div className="text-[10px] text-gray-400 mb-2">{simpleTitle}</div>
                      <pre className="text-xs text-gray-100 font-mono whitespace-pre">{simpleCode}</pre>
                    </div>
                  </motion.div>
                )}

                {learnTab === 'scratch' && (
                  <motion.div key="scratch" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <div className="text-[10px] text-gray-400 mb-2">{scratchTitle}</div>
                      <pre className="text-xs text-gray-100 font-mono whitespace-pre">{scratchCode}</pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────── 1. Minimax Game ───────── */

function MinimaxGame() {
  const [gSkill, setGSkill] = useState(0.3);
  const [showNonSat, setShowNonSat] = useState(true);

  const dReal = 0.95 - gSkill * 0.45;
  const dFake = 0.05 + gSkill * 0.45;
  const gLossSat = -Math.log(Math.max(0.01, 1 - dFake));
  const gLossNonSat = -Math.log(Math.max(0.01, dFake));
  const dLoss = -(Math.log(Math.max(0.01, dReal)) + Math.log(Math.max(0.01, 1 - dFake)));
  const maxLoss = Math.max(gLossSat, gLossNonSat, dLoss, 1);

  const isBalanced = Math.abs(dReal - 0.5) < 0.08 && Math.abs(dFake - 0.5) < 0.08;

  const curvePoints = Array.from({ length: 30 }).map((_, i) => {
    const t = i / 29;
    const dR = 0.95 - t * 0.45;
    const dF = 0.05 + t * 0.45;
    return {
      gSat: -Math.log(Math.max(0.01, 1 - dF)),
      gNon: -Math.log(Math.max(0.01, dF)),
      d: -(Math.log(Math.max(0.01, dR)) + Math.log(Math.max(0.01, 1 - dF))),
    };
  });

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Minimax Game</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        GAN training is a two-player minimax game: G tries to minimize log(1 − D(G(z))), while D
        tries to maximize log(D(x)) + log(1 − D(G(z))). The Nash equilibrium is reached when
        D(x) = D(G(z)) = 0.5.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold text-sm mb-3">Loss Landscape</h4>
            <svg width="100%" height="200" viewBox="0 0 300 180">
              {curvePoints.map((pt, i) => {
                const t = i / 29;
                const x = 30 + t * 240;
                const isPast = t <= gSkill;
                return (
                  <g key={i}>
                    {i > 0 && (
                      <>
                        <line x1={30 + ((i - 1) / 29) * 240}
                          y1={160 - (curvePoints[i - 1].d / maxLoss) * 140}
                          x2={x} y2={160 - (pt.d / maxLoss) * 140}
                          stroke="#ef4444" strokeWidth={1.5} opacity={0.6} />
                        <line x1={30 + ((i - 1) / 29) * 240}
                          y1={160 - (curvePoints[i - 1].gSat / maxLoss) * 140}
                          x2={x} y2={160 - (pt.gSat / maxLoss) * 140}
                          stroke="#a855f7" strokeWidth={1.5} opacity={0.6} />
                        {showNonSat && (
                          <line x1={30 + ((i - 1) / 29) * 240}
                            y1={160 - (curvePoints[i - 1].gNon / maxLoss) * 140}
                            x2={x} y2={160 - (pt.gNon / maxLoss) * 140}
                            stroke="#f59e0b" strokeWidth={1.5} opacity={0.4}
                            strokeDasharray="3 2" />
                        )}
                      </>
                    )}
                    <circle cx={x}
                      cy={160 - (pt.d / maxLoss) * 140}
                      r={2} fill="#ef4444" opacity={isPast ? 1 : 0.2} />
                    <circle cx={x}
                      cy={160 - (pt.gSat / maxLoss) * 140}
                      r={2} fill="#a855f7" opacity={isPast ? 1 : 0.2} />
                  </g>
                );
              })}
              <line x1={30 + 0.5 * 240} y1="10" x2={30 + 0.5 * 240} y2="160"
                stroke="#22c55e" strokeWidth="1" strokeDasharray="4 2" />
              <text x={30 + 0.5 * 240} y="8" textAnchor="middle" fontSize="8" fill="#22c55e">
                Equilibrium
              </text>
              <text x="10" y="12" fontSize="8" fill="#a855f7">G loss</text>
              <text x="10" y="24" fontSize="8" fill="#ef4444">D loss</text>
              {showNonSat && <text x="10" y="36" fontSize="8" fill="#f59e0b">G (non-sat)</text>}
              <text x="150" y="178" textAnchor="middle" fontSize="8" fill="#9ca3af">Training progress →</text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">Generator Skill: {gSkill.toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.02" value={gSkill}
                onChange={e => setGSkill(parseFloat(e.target.value))} className="w-full cursor-pointer" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Discriminator adapts to G</label>
              <div className="h-5" />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-full lg:w-56 space-y-3">
          <div className={`p-3 rounded-lg border-l-4 text-xs ${
            isBalanced ? 'bg-green-50 dark:bg-green-950/30 border-green-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <h4 className="font-semibold mb-1">Current State</h4>
            {isBalanced ? (
              <p className="text-green-700 dark:text-green-300 text-[11px]">
                Near equilibrium! Both G and D are well-matched.
              </p>
            ) : (
              <p className="text-gray-700 dark:text-gray-300 text-[11px]">
                {gSkill < 0.35 ? 'Generator is weak — G needs to improve.' :
                 gSkill > 0.65 ? 'Generator is strong — D needs to catch up.' :
                 'Training in progress — approaching equilibrium.'}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 text-xs space-y-2">
            <h4 className="font-semibold">Loss Values</h4>
            <div className="flex justify-between">
              <span className="text-purple-600 dark:text-purple-400">G loss (sat):</span>
              <span className="font-mono">{gLossSat.toFixed(3)}</span>
            </div>
            {showNonSat && (
              <div className="flex justify-between">
                <span className="text-amber-600 dark:text-amber-400">G loss (non-sat):</span>
                <span className="font-mono">{gLossNonSat.toFixed(3)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400">D loss:</span>
              <span className="font-mono">{dLoss.toFixed(3)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-green-600 dark:text-green-400">D(x):</span>
              <span className="font-mono">{dReal.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600 dark:text-blue-400">D(G(z)):</span>
              <span className="font-mono">{dFake.toFixed(3)}</span>
            </div>
          </div>

          <label className="flex items-center gap-1.5 text-xs cursor-pointer px-1">
            <input type="checkbox" checked={showNonSat}
              onChange={e => setShowNonSat(e.target.checked)} className="cursor-pointer" />
            Show non-saturating G loss
          </label>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <strong>Key Insight:</strong> At equilibrium, D(x) = D(G(z)) = 0.5. The generator
            produces samples indistinguishable from real data, and the discriminator guesses at
            random.
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <LearnMoreSection
        title="Learn Minimax Game"
        gradientFrom="from-amber-50"
        gradientTo="to-red-50"
        darkGradientFrom="from-amber-950/30"
        darkGradientTo="to-red-950/30"
        hoverFrom="hover:from-amber-100"
        hoverTo="hover:to-red-100"
        darkHoverFrom="dark:hover:from-amber-950/50"
        darkHoverTo="dark:hover:to-red-950/50"
        analogyTitle="Counterfeiter vs Police"
        analogyIcon="💰"
        analogyContent={
          <>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
              Think of GAN training like a battle between a <strong>counterfeiter</strong> (Generator)
              and the <strong>police</strong> (Discriminator):
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-purple-600 text-[10px] mb-2">Counterfeiter (G)</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  Prints fake money. Goal: make bills so realistic that police can&apos;t tell them apart from real money.
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-red-600 text-[10px] mb-2">Police (D)</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  Inspects bills. Goal: correctly identify real vs counterfeit. Gets better at spotting fakes.
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              <strong>Nash Equilibrium:</strong> When the police can only guess randomly (50/50),
              the counterfeiter has achieved perfect fakes. Neither side can improve unilaterally.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border-l-4 border-red-400">
                <h5 className="font-semibold text-[10px] mb-1 text-red-700 dark:text-red-400">📉 Saturating Loss Problem</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  When police (D) is too good, the counterfeiter (G) gets no useful feedback.
                  Like a student who always fails — they stop trying. Gradients vanish.
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-400">
                <h5 className="font-semibold text-[10px] mb-1 text-green-700 dark:text-green-400">📈 Non-Saturating Solution</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Instead of &quot;don&apos;t get caught&quot;, tell the counterfeiter &quot;make the police believe it&apos;s real&quot;.
                  Always provides useful gradients — like constructive feedback.
                </p>
              </div>
            </div>
          </>
        }
        stepsTitle="The Minimax Objective"
        stepsContent={[
          { step: 1, title: 'The Minimax Objective', desc: 'Two-player zero-sum game: G minimizes, D maximizes.', formula: 'min_G max_V(D,G) = E[log D(x)] + E[log(1 - D(G(z)))]' },
          { step: 2, title: 'D Maximizes Its Score', desc: 'D wants high D(x) for real data, low D(G(z)) for fakes.', formula: 'D* = argmax E[log D(x)] + E[log(1 - D(G(z)))]' },
          { step: 3, title: 'G Minimizes D Score', desc: 'G wants D(G(z)) to be high (fool D).', formula: 'G* = argmin E[log(1 - D(G(z)))]' },
          { step: 4, title: 'Nash Equilibrium', desc: 'Optimal point: D can\'t improve, G can\'t improve.', formula: 'D(x) = D(G(z)) = 0.5, p_g = p_data' },
        ]}
        simpleTitle="GAN loss functions with PyTorch"
        simpleCode={`import torch
import torch.nn as nn

# === Saturating Loss (Original GAN) ===
# G tries to minimize: log(1 - D(G(z)))
# Problem: gradients vanish when D is too good

d_loss_real = -torch.mean(torch.log(d_real + 1e-8))
d_loss_fake = -torch.mean(torch.log(1 - d_fake + 1e-8))
d_loss = d_loss_real + d_loss_fake

g_loss_sat = -torch.mean(torch.log(1 - d_fake + 1e-8))

# === Non-Saturating Loss (Better) ===
# G tries to maximize: log(D(G(z)))
# Provides stronger gradients when D is confident

g_loss_non_sat = -torch.mean(torch.log(d_fake + 1e-8))

# === Wasserstein Loss (WGAN) ===
# Uses Earth Mover's distance instead of JS divergence
# More stable training, meaningful loss curves

g_loss_w = -torch.mean(d_fake)  # Maximize D(fake)
d_loss_w = torch.mean(d_fake) - torch.mean(d_real)  # EM distance`}
        scratchTitle="Minimax loss from scratch"
        scratchCode={`import torch

def g_loss_saturating(d_fake):
    """Original GAN loss: log(1 - D(G(z)))"""
    return -torch.mean(torch.log(1 - d_fake + 1e-8))

def g_loss_non_saturating(d_fake):
    """Non-saturating: log(D(G(z)))"""
    return -torch.mean(torch.log(d_fake + 1e-8))

def d_loss(d_real, d_fake):
    """Discriminator loss: -[log D(x) + log(1 - D(G(z)))]"""
    return -torch.mean(
        torch.log(d_real + 1e-8) + 
        torch.log(1 - d_fake + 1e-8)
    )

def wasserstein_d_loss(d_real, d_fake):
    """WGAN: Wasserstein distance estimate"""
    return -(torch.mean(d_real) - torch.mean(d_fake))

def gradient_penalty(discriminator, real, fake, device='cpu'):
    """WGAN-GP: Gradient penalty for Lipschitz constraint"""
    alpha = torch.rand(real.size(0), 1, 1, 1, device=device)
    interpolated = (alpha * real + (1 - alpha) * fake).requires_grad_(True)
    d_interp = discriminator(interpolated)
    
    gradients = torch.autograd.grad(
        outputs=d_interp, inputs=interpolated,
        grad_outputs=torch.ones_like(d_interp),
        create_graph=True, retain_graph=True
    )[0]
    
    gradients = gradients.view(real.size(0), -1)
    penalty = ((gradients.norm(2, dim=1) - 1) ** 2).mean()
    return penalty`}
      />
    </div>
  );
}

const LATENT_DIM = 4;
const IMG_SIZE = 28;

function latToImage(latent: number[]): number[][] {
  const img: number[][] = Array.from({ length: IMG_SIZE }, () =>
    Array.from({ length: IMG_SIZE }, () => 0)
  );
  const cx = 14 + latent[0] * 6;
  const cy = 14 + latent[1] * 6;
  const radius = 3 + (latent[2] + 1) * 3;
  const brightness = 0.5 + (latent[3] + 1) * 0.25;
  for (let y = 0; y < IMG_SIZE; y++) {
    for (let x = 0; x < IMG_SIZE; x++) {
      let val = 0;
      for (let i = 0; i < LATENT_DIM; i++) {
        val += latent[i] * Math.sin((x * (i + 1) + y * (i + 1)) * 0.08);
      }
      const noise = Math.max(0, Math.min(1, (Math.sin(val) + 1) / 2));
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      let circle = 0;
      if (dist < radius) circle = brightness;
      else if (dist < radius + 2) circle = brightness * 0.15;
      img[y][x] = noise * 0.15 + circle * 0.85;
    }
  }
  return img;
}

function LatentExplorer() {
  const [latent, setLatent] = useState(() =>
    Array.from({ length: LATENT_DIM }, (_, i) => seededRandom(i * 13 + 7) * 2 - 1)
  );
  const [interpolate, setInterpolate] = useState(false);
  const [interpPos, setInterpPos] = useState(0);

  const latentB = latent.map((v, i) => v * -0.7 + seededRandom(i * 31 + 100) * 0.6 - 0.3);
  const displayLatent = interpolate
    ? latent.map((v, i) => v + (latentB[i] - v) * interpPos)
    : latent;

  const image = latToImage(displayLatent);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Latent Space Explorer</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The generator maps points in latent space (z) to output images. Smooth interpolation
        in latent space produces smooth transitions in the output — a key property of GANs.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-white"
            style={{ width: 140, height: 140 }}>
            <svg viewBox={`0 0 ${IMG_SIZE} ${IMG_SIZE}`} className="w-full h-full">
              {image.map((row, y) => row.map((val, x) => (
                <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1}
                  fill={`rgba(168, 85, 247, ${val})`} />
              )))}
            </svg>
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            Generated output
          </div>
        </div>

          <div className="flex-1 space-y-3">
            <h4 className="text-sm font-semibold">Latent Vector z</h4>
            {Array.from({ length: LATENT_DIM }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">z[{i}]</span>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    {(interpolate ? displayLatent[i] : latent[i]).toFixed(3)}
                  </span>
                </div>
                <input type="range" min="-1" max="1" step="0.02"
                  value={interpolate ? displayLatent[i] : latent[i]}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setLatent(prev => { const n = [...prev]; n[i] = v; return n; });
                  }}
                  className={`w-full cursor-pointer ${interpolate ? 'opacity-50' : ''}`}
                  disabled={interpolate}
                />
              </div>
            ))}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={interpolate}
                onChange={e => setInterpolate(e.target.checked)} className="cursor-pointer" />
              Interpolation mode
            </label>
            {interpolate && (
              <div className="flex-1">
                <input type="range" min="0" max="1" step="0.02" value={interpPos}
                  onChange={e => setInterpPos(parseFloat(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>z<sub>A</sub></span>
                  <span>z<sub>B</sub></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setLatent(Array.from({ length: LATENT_DIM }, (_, i) => seededRandom(i * 17 + Date.now()) * 2 - 1))}
              className="px-3 py-1.5 text-xs rounded cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Random Sample
            </button>
            <button onClick={() => setLatent(Array.from({ length: LATENT_DIM }, () => 0))}
              className="px-3 py-1.5 text-xs rounded cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Zero Vector
            </button>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <LearnMoreSection
        title="Learn Latent Space"
        gradientFrom="from-purple-50"
        gradientTo="to-blue-50"
        darkGradientFrom="from-purple-950/30"
        darkGradientTo="from-blue-950/30"
        hoverFrom="hover:from-purple-100"
        hoverTo="hover:to-blue-100"
        darkHoverFrom="dark:hover:from-purple-950/50"
        darkHoverTo="dark:hover:to-blue-950/50"
        analogyTitle="Recipe Ingredients"
        analogyIcon="🧪"
        analogyContent={
          <>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
              Think of the latent vector like a <strong>recipe</strong> — each ingredient (dimension)
              contributes to the final dish (image):
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-purple-600 text-[10px] mb-2">Latent Vector z</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  Recipe with ingredients: z = [position, size, brightness, ...]
                  Each number controls a different aspect of the output.
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-blue-600 text-[10px] mb-2">Generated Image</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  The dish created from the recipe. Similar recipes produce similar dishes.
                  Smooth changes in ingredients = smooth changes in output.
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              <strong>Key insight:</strong> A well-trained GAN has a <strong>smooth latent space</strong> —
              nearby points produce similar images. This enables interpolation: gradually changing
              one image into another by moving through latent space.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border-l-4 border-cyan-400">
                <h5 className="font-semibold text-[10px] mb-1 text-cyan-700 dark:text-cyan-400">🔄 Interpolation</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Like morphing between two recipes: Start with chocolate cake, gradually add
                  lemon zest while removing chocolate — you get a smooth transition to lemon cake.
                </p>
              </div>
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border-l-4 border-violet-400">
                <h5 className="font-semibold text-[10px] mb-1 text-violet-700 dark:text-violet-400">🎭 Disentanglement</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Ideally, each dimension controls one feature: z[0] = position, z[1] = size,
                  z[2] = color. Like having separate knobs for each ingredient.
                </p>
              </div>
            </div>
          </>
        }
        stepsTitle="Latent Space Interpolation"
        stepsContent={[
          { step: 1, title: 'Sample Two Points', desc: 'Draw two random latent vectors z_A and z_B from N(0, I).', formula: 'z_A ~ N(0, I), z_B ~ N(0, I)' },
          { step: 2, title: 'Linear Interpolation', desc: 'Create a path between z_A and z_B by mixing them.', formula: 'z_t = (1-t) * z_A + t * z_B, t in [0, 1]' },
          { step: 3, title: 'Generate Along Path', desc: 'Feed each z_t to G to get a sequence of images.', formula: 'images_t = G(z_t) for t = 0, 0.1, ..., 1' },
          { step: 4, title: 'Observe Smooth Transition', desc: 'Images gradually change from one to another — no sudden jumps.', formula: 'G(z_0) → G(z_0.1) → ... → G(z_1)' },
        ]}
        simpleTitle="Latent space interpolation with PyTorch"
        simpleCode={`import torch

# Sample two latent vectors
z_a = torch.randn(1, 64)  # Point A
z_b = torch.randn(1, 64)  # Point B

# Linear interpolation
t = 0.5  # 0 = z_a, 1 = z_b
z_interp = (1 - t) * z_a + t * z_b

# Generate images at each point
img_a = generator(z_a)
img_b = generator(z_b)
img_interp = generator(z_interp)

# Spherical interpolation (better for high dimensions)
def slerp(z_a, z_b, t):
    """Spherical linear interpolation"""
    theta = torch.acos(torch.clamp(
        torch.sum(z_a * z_b) / (z_a.norm() * z_b.norm()), -1, 1
    ))
    return (torch.sin((1-t)*theta) / torch.sin(theta) * z_a +
            torch.sin(t*theta) / torch.sin(theta) * z_b)`}
        scratchTitle="Latent space from scratch"
        scratchCode={`import torch

def linear_interpolate(z_a, z_b, t):
    """Simple linear interpolation in latent space"""
    return (1 - t) * z_a + t * z_b

def spherical_interpolate(z_a, z_b, t):
    """Spherical interpolation (SLERP) - better for high-dim"""
    z_a_flat = z_a.view(-1)
    z_b_flat = z_b.view(-1)
    
    cos_angle = torch.dot(z_a_flat, z_b_flat) / (z_a_flat.norm() * z_b_flat.norm())
    cos_angle = torch.clamp(cos_angle, -0.999, 0.999)
    angle = torch.acos(cos_angle)
    
    if angle.abs() < 1e-6:
        return (1 - t) * z_a + t * z_b
    
    return (torch.sin((1-t)*angle) / torch.sin(angle) * z_a +
            torch.sin(t*angle) / torch.sin(angle) * z_b)

def interpolate_and_generate(generator, z_a, z_b, steps=10):
    """Generate interpolation sequence"""
    images = []
    for i in range(steps):
        t = i / (steps - 1)
        z = spherical_interpolate(z_a, z_b, t)
        img = generator(z.unsqueeze(0))
        images.append(img.detach())
    return images

# Disentanglement example
# z[0] might control position, z[1] controls size, etc.
z = torch.zeros(1, 64)
for pos in torch.linspace(-1, 1, 5):
    z[0, 0] = pos  # Vary only position dimension
    img = generator(z)
    # Images show circle moving horizontally`}
      />
    </div>
  );
}

/* ───────── 3. Architecture Evolution ───────── */

const GAN_MILESTONES = [
  { name: 'GAN', year: '2014', venue: 'NeurIPS 2014', params: '~2M', quality: 'Low',
    idea: 'The original GAN: Generator and Discriminator compete in a minimax game. Fully connected networks on MNIST/CIFAR.',
    impact: 'Introduced the adversarial training paradigm that revolutionized generative modeling.' },
  { name: 'DCGAN', year: '2015', venue: 'ICLR 2016', params: '~3M', quality: 'Medium',
    idea: 'Replaces FC layers with convolutional/deconvolutional layers. Batch norm, ReLU in G, LeakyReLU in D. Stable training.',
    impact: 'Established the CNN-based GAN architecture. Widely adopted as a baseline.' },
  { name: 'WGAN', year: '2017', venue: 'ICLR 2017', params: '~3M', quality: 'Medium',
    idea: 'Replaces JS divergence with Wasserstein distance. Uses weight clipping (later gradient penalty). More stable training.',
    impact: 'Solved many training stability issues. Gradient penalty (WGAN-GP) became standard.' },
  { name: 'CycleGAN', year: '2017', venue: 'ICCV 2017', params: '~11M', quality: 'Medium',
    idea: 'Unpaired image-to-image translation using cycle consistency loss. Two GANs + forward/backward cycle.',
    impact: 'Enabled style transfer without paired data. Horse↔zebra, summer↔winter.' },
  { name: 'ProGAN', year: '2017', venue: 'ICLR 2018', params: '~23M', quality: 'High',
    idea: 'Progressive growing: start with 4×4, add layers as training progresses. Both G and D grow together.',
    impact: 'First GAN to generate 1024×1024 high-quality faces. Paved the way for StyleGAN.' },
  { name: 'BigGAN', year: '2018', venue: 'ICLR 2019', params: '~160M', quality: 'Very High',
    idea: 'Large-scale GAN with batch size 2048, spectral normalization, class-conditional batch norm. Trained on ImageNet.',
    impact: 'State-of-the-art class-conditional generation on ImageNet 256×256.' },
  { name: 'StyleGAN', year: '2019', venue: 'CVPR 2019', params: '~30M', quality: 'Very High',
    idea: 'Style-based generator: mapping network + adaptive instance norm (AdaIN). Noise inputs for stochastic variation.',
    impact: 'Unprecedented control over style and content. StyleGAN2/3 further improved quality.' },
];

function GANEvolution() {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">GAN Architecture Evolution</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        From the original GAN to StyleGAN, adversarial training has evolved dramatically — and
        recently been challenged by diffusion models.
      </p>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {GAN_MILESTONES.map((v, i) => (
          <button key={i} onClick={() => setSelected(i)}
            className={`flex-1 p-2 text-xs rounded-t text-center transition-all border-b-2 whitespace-nowrap ${
              selected === i
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 font-semibold text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <div>{v.name}</div>
            <div className="text-[10px] opacity-75">{v.year}</div>
          </button>
        ))}
      </div>

      <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-950/30">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-lg">{GAN_MILESTONES[selected].name}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{GAN_MILESTONES[selected].year} &middot; {GAN_MILESTONES[selected].venue}</span>
          </div>
          <div className="flex gap-3 text-xs ml-4">
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Params</div>
              <div className="text-gray-600 dark:text-gray-400">{GAN_MILESTONES[selected].params}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-700 dark:text-gray-300">Quality</div>
              <div className="text-gray-600 dark:text-gray-400">{GAN_MILESTONES[selected].quality}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
          {GAN_MILESTONES[selected].idea}
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-800 text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-400">Impact:</span>
          <span className="text-gray-700 dark:text-gray-300 ml-1">{GAN_MILESTONES[selected].impact}</span>
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        {GAN_MILESTONES.map((v, i) => (
          <div key={i} className={`flex-1 text-center ${i <= selected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {i > 0 && <span className="mx-1">{'—'}</span>}
            <span className={i <= selected ? 'font-semibold' : ''}>{v.year}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
        <strong>Note:</strong> Diffusion models (DDPM, 2020) surpassed GANs in image quality but use a
        fundamentally different approach — iterative denoising rather than adversarial training. They are
        not GANs but represent the current state-of-the-art in generative modeling.
      </div>

      {/* Learn More Section */}
      <LearnMoreSection
        title="Learn GAN Evolution"
        gradientFrom="from-cyan-50"
        gradientTo="to-blue-50"
        darkGradientFrom="from-cyan-950/30"
        darkGradientTo="from-blue-950/30"
        hoverFrom="hover:from-cyan-100"
        hoverTo="hover:to-blue-100"
        darkHoverFrom="dark:hover:from-cyan-950/50"
        darkHoverTo="dark:hover:to-blue-950/50"
        analogyTitle="Evolution of Photography"
        analogyIcon="📸"
        analogyContent={
          <>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
              GAN evolution mirrors the history of photography — each breakthrough brought
              higher quality and more control:
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-cyan-600 text-[10px] mb-2">Early Days (2014-2015)</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  <strong>GAN/DCGAN</strong> = Daguerreotype. First attempt, low resolution,
                  but proved the concept works.
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-blue-600 text-[10px] mb-2">Film Era (2017)</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  <strong>WGAN/ProGAN</strong> = Better cameras. Wasserstein distance stabilized
                  training. Progressive growing enabled higher resolution.
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-purple-600 text-[10px] mb-2">Digital Revolution (2018-2019)</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  <strong>BigGAN/StyleGAN</strong> = Digital photography. Unprecedented quality
                  and control over generation.
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-amber-600 text-[10px] mb-2">Beyond GANs (2020+)</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  <strong>Diffusion Models</strong> = Computational photography. Different approach
                  (denoising) but even higher quality.
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border-l-4 border-emerald-400">
                <h5 className="font-semibold text-[10px] mb-1 text-emerald-700 dark:text-emerald-400">🔑 Key Insight</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Each generation solved a specific problem: DCGAN made training stable,
                  WGAN provided meaningful loss, ProGAN enabled high resolution, StyleGAN
                  gave control. Progress is cumulative.
                </p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border-l-4 border-rose-400">
                <h5 className="font-semibold text-[10px] mb-1 text-rose-700 dark:text-rose-400">🚀 What&apos;s Next?</h5>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Diffusion models surpassed GANs in quality, but GANs are still used for
                  fast inference (no denoising steps). Hybrid approaches combine both.
                </p>
              </div>
            </div>
          </>
        }
        stepsTitle="Key Architectural Innovations"
        stepsContent={[
          { step: 1, title: 'DCGAN (2015)', desc: 'Replace FC layers with transposed convolutions. Batch norm, ReLU in G, LeakyReLU in D.', formula: 'ConvTranspose2d → BatchNorm → ReLU' },
          { step: 2, title: 'WGAN (2017)', desc: 'Wasserstein distance + weight clipping. Meaningful loss curves, stable training.', formula: 'L_D = E[D(fake)] - E[D(real)]' },
          { step: 3, title: 'ProGAN (2017)', desc: 'Progressive growing: 4×4 → 8×8 → ... → 1024×1024. Both G and D grow together.', formula: 'Start small, grow incrementally' },
          { step: 4, title: 'StyleGAN (2019)', desc: 'Mapping network z → w, AdaIN for style injection, noise for stochastic variation.', formula: 'z → MLP → w → AdaIN(style, content)' },
        ]}
        simpleTitle="DCGAN-style generator with PyTorch"
        simpleCode={`import torch
import torch.nn as nn

# DCGAN-style generator
class DCGANGenerator(nn.Module):
    def __init__(self, latent_dim=100, channels=3):
        super().__init__()
        self.main = nn.Sequential(
            # latent_dim -> 512 x 4 x 4
            nn.ConvTranspose2d(latent_dim, 512, 4, 1, 0),
            nn.BatchNorm2d(512),
            nn.ReLU(True),
            # 512 x 4 x 4 -> 256 x 8 x 8
            nn.ConvTranspose2d(512, 256, 4, 2, 1),
            nn.BatchNorm2d(256),
            nn.ReLU(True),
            # 256 x 8 x 8 -> 128 x 16 x 16
            nn.ConvTranspose2d(256, 128, 4, 2, 1),
            nn.BatchNorm2d(128),
            nn.ReLU(True),
            # 128 x 16 x 16 -> 3 x 32 x 32
            nn.ConvTranspose2d(128, channels, 4, 2, 1),
            nn.Tanh()
        )
    
    def forward(self, z):
        return self.main(z.view(-1, 100, 1, 1))`}
        scratchTitle="DCGAN from scratch"
        scratchCode={`import torch

class DCGANGenerator(torch.nn.Module):
    """DCGAN generator with transposed convolutions"""
    def __init__(self, latent_dim=100):
        super().__init__()
        self.fc = torch.nn.Linear(latent_dim, 512 * 4 * 4)
        
        self.deconv = torch.nn.Sequential(
            # 4x4 -> 8x8
            torch.nn.ConvTranspose2d(512, 256, 4, 2, 1),
            torch.nn.BatchNorm2d(256),
            torch.nn.ReLU(),
            # 8x8 -> 16x16
            torch.nn.ConvTranspose2d(256, 128, 4, 2, 1),
            torch.nn.BatchNorm2d(128),
            torch.nn.ReLU(),
            # 16x16 -> 32x32
            torch.nn.ConvTranspose2d(128, 3, 4, 2, 1),
            torch.nn.Tanh()
        )
    
    def forward(self, z):
        x = torch.relu(self.fc(z))
        x = x.view(-1, 512, 4, 4)
        return self.deconv(x)

class SpectralNormDiscriminator(torch.nn.Module):
    """Discriminator with spectral normalization (from WGAN-GP)"""
    def __init__(self):
        super().__init__()
        self.conv = torch.nn.Sequential(
            torch.nn.utils.spectral_norm(
                torch.nn.Conv2d(3, 64, 4, 2, 1)),
            torch.nn.LeakyReLU(0.2),
            torch.nn.utils.spectral_norm(
                torch.nn.Conv2d(64, 128, 4, 2, 1)),
            torch.nn.LeakyReLU(0.2),
        )
        self.fc = torch.nn.Linear(128 * 8 * 8, 1)
    
    def forward(self, x):
        x = self.conv(x)
        x = x.view(x.size(0), -1)
        return self.fc(x)`}
      />
    </div>
  );
}

/* ───────── Main Component ───────── */

export default function GANAdvancedDive() {
  const [section, setSection] = useState<Section>('minimax');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'minimax', label: 'Minimax Game', icon: '⚖️' },
    { id: 'latent', label: 'Latent Space', icon: '🧩' },
    { id: 'evolution', label: 'Evolution', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">GAN Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore how GANs work under the hood — from the minimax game and latent space
          interpolation to the evolution of adversarial architectures.
        </p>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t whitespace-nowrap transition-colors ${
                section === s.id
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === 'minimax' && <MinimaxGame />}
          {section === 'latent' && <LatentExplorer />}
          {section === 'evolution' && <GANEvolution />}
        </motion.div>
      </div>
    </div>
  );
}
