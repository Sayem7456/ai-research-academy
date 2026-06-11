'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'minimax' | 'latent' | 'evolution';

/* ───────── 1. Minimax Game ───────── */

function MinimaxGame() {
  const [gSkill, setGSkill] = useState(0.3);
  const [dSkill, setDSkill] = useState(0.5);
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
                onChange={e => setGSkill(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-medium">Discriminator Skill: {dSkill.toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.02" value={dSkill}
                onChange={e => setDSkill(parseFloat(e.target.value))} className="w-full" />
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
                {gSkill < dSkill - 0.15 ? 'Discriminator dominates — G needs to improve.' :
                 gSkill > dSkill + 0.15 ? 'Generator is fooling D — D needs to catch up.' :
                 gSkill < dSkill ? 'D has a slight edge over G.' :
                 'G has a slight edge over D.'}
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
              onChange={e => setShowNonSat(e.target.checked)} />
            Show non-saturating G loss
          </label>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <strong>Key Insight:</strong> At equilibrium, D(x) = D(G(z)) = 0.5. The generator
            produces samples indistinguishable from real data, and the discriminator guesses at
            random.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 2. Latent Space Explorer ───────── */

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
                className="w-full"
                disabled={interpolate}
              />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={interpolate}
                onChange={e => setInterpolate(e.target.checked)} />
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
              className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:opacity-90 transition-opacity">
              Random Sample
            </button>
            <button onClick={() => setLatent(Array.from({ length: LATENT_DIM }, () => 0))}
              className="px-3 py-1.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Zero Vector
            </button>
          </div>
        </div>
      </div>
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
  { name: 'Diffusion', year: '2020', venue: 'NeurIPS 2020', params: '~500M+', quality: 'State-of-the-art',
    idea: 'Denoising Diffusion Probabilistic Models (DDPM). Gradually add noise, then learn to reverse. Not a GAN but surpassed it.',
    impact: 'Surpassed GANs in image quality. Used in DALL-E 2, Stable Diffusion, Imagen.' },
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
