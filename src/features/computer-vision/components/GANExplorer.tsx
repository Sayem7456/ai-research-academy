'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

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
  const [realImages] = useState(() =>
    Array.from({ length: 4 }, (_, i) => generateRealImage(i * 31 + 7))
  );
  const latentVectors = useRef(
    Array.from({ length: 4 }, () =>
      Array.from({ length: LATENT_DIM }, () => seededRandom(Math.random() * 10000) * 2 - 1)
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
      setTrainPhase(prev => (prev + 1) % PHASES.length);
      return next;
    });
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
    latentVectors.current = Array.from({ length: 4 }, () =>
      Array.from({ length: LATENT_DIM }, () => seededRandom(Math.random() * 10000) * 2 - 1)
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
              className={`px-4 py-2 text-sm rounded transition-colors ${
                isTraining ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              } hover:opacity-90`}>
              {isTraining ? 'Stop Training' : 'Start Training'}
            </button>
            <button onClick={reset}
              className="px-4 py-2 text-sm rounded transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
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
          <motion.div animate={isTraining && trainPhase === 0 ? { scale: 1.02 } : {}}>
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
    </div>
  );
}
