'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import LearnMoreSection from './LearnMoreSection';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Section = 'permutation' | 'tnetsim' | 'evolution';

/* ───────── 1. Permutation Invariance ───────── */

function PermutationInvariance() {
  const [activeDemo, setActiveDemo] = useState<'random' | 'sorted'>('random');
  const [pointCount] = useState(12);
  const seed = 42;

  const indices = useMemo(() => {
    const arr = Array.from({ length: pointCount }, (_, i) => i);
    if (activeDemo === 'random') {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i + 1) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return arr;
  }, [activeDemo, pointCount, seed]);

  /* Simulated per-point features and max-pool result */
  const features = useMemo(() =>
    indices.map((_, i) => ({ a: seededRandom(seed + i * 7 + 1), b: seededRandom(seed + i * 7 + 2), c: seededRandom(seed + i * 7 + 3) })),
    [indices, seed]
  );

  const pooled = useMemo(() => ({
    a: Math.max(...features.map(f => f.a)),
    b: Math.max(...features.map(f => f.b)),
    c: Math.max(...features.map(f => f.c)),
  }), [features]);

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Permutation Invariance</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        PointNet uses max pooling as its symmetric aggregation function. No matter how you
        shuffle the input points, the max-pooled output is identical — the network is
        permutation-invariant by design.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setActiveDemo('sorted')}
          className={`px-3 py-1.5 text-xs rounded ${
            activeDemo === 'sorted'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}>
          Sorted Input
        </button>
        <button onClick={() => setActiveDemo('random')}
          className={`px-3 py-1.5 text-xs rounded ${
            activeDemo === 'random'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}>
          Random-Shuffled Input
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="py-1 pr-2">Point</th>
              <th className="py-1 pr-2">Feature A</th>
              <th className="py-1 pr-2">Feature B</th>
              <th className="py-1 pr-2">Feature C</th>
            </tr>
          </thead>
          <tbody>
            {indices.map((origIdx, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-1 pr-2 text-gray-400">P<sub>{origIdx}</sub></td>
                <td className="py-1 pr-2">{features[i].a.toFixed(4)}</td>
                <td className="py-1 pr-2">{features[i].b.toFixed(4)}</td>
                <td className="py-1 pr-2">{features[i].c.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded border-l-4 border-indigo-400">
          <div className="text-xs text-gray-500 dark:text-gray-400">Max-pooled A</div>
          <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{pooled.a.toFixed(4)}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded border-l-4 border-green-400">
          <div className="text-xs text-gray-500 dark:text-gray-400">Max-pooled B</div>
          <div className="text-lg font-bold font-mono text-green-600 dark:text-green-400">{pooled.b.toFixed(4)}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded border-l-4 border-purple-400">
          <div className="text-xs text-gray-500 dark:text-gray-400">Max-pooled C</div>
          <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">{pooled.c.toFixed(4)}</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        Toggle between Sorted and Random-Shuffled — the max-pooled values stay the same.
        This is the key insight: max pooling over all points removes dependence on input order.
      </p>
    </div>
  );
}

/* ───────── 2. T-Net Simulation ───────── */

function TNetSimulation() {
  const [rotationAngle, setRotationAngle] = useState(45);
  const [showAligned, setShowAligned] = useState(false);

  const angleRad = (rotationAngle * Math.PI) / 180;
  const correction = showAligned ? angleRad * 0.85 : 0;

  /* Generate a few key points of a cube for the visualization */
  const cubeCorners = useMemo(() => {
    const pts: { x: number; y: number; z: number; label: string }[] = [];
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          pts.push({ x, y, z, label: 'corner' });
        }
      }
    }
    return pts;
  }, []);

  /* Rotate around Y axis (simulate misalignment) */
  const rotated = useMemo(() => {
    const c = Math.cos(angleRad), s = Math.sin(angleRad);
    return cubeCorners.map(p => ({
      x: p.x * c + p.z * s,
      y: p.y,
      z: -p.x * s + p.z * c,
      label: p.label,
    }));
  }, [cubeCorners, angleRad]);

  /* Apply T-Net correction */
  const corrected = useMemo(() => {
    if (!showAligned) return rotated;
    const c = Math.cos(-correction), s = Math.sin(-correction);
    return rotated.map(p => ({
      x: p.x * c + p.z * s,
      y: p.y,
      z: -p.x * s + p.z * c,
      label: p.label,
    }));
  }, [rotated, showAligned, correction]);

  const displayPoints = showAligned ? corrected : rotated;

  const proj = (px: number, py: number, pz: number, angleX: number) => {
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    const y1 = py * cosX - pz * sinX;
    const z1 = py * sinX + pz * cosX;
    return { sx: px * 80 + 150, sy: y1 * 80 + 100, depth: (z1 + 2) / 4 };
  };

  const projRotated = rotated.map(p => proj(p.x, p.y, p.z, 0.5));
  const projDisplay = displayPoints.map(p => proj(p.x, p.y, p.z, 0.5));

  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">3D Spatial Transformer (T-Net)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        T-Net is a mini-PointNet that predicts an affine transformation matrix to align the
        input point cloud. This provides rotation and translation invariance.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold">
                {showAligned ? 'After T-Net Alignment' : 'Misaligned Input'}
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Noise Angle: {rotationAngle}°</label>
                <input type="range" min="0" max="90" value={rotationAngle}
                  onChange={e => setRotationAngle(parseInt(e.target.value))} className="w-20" />
              </div>
            </div>
            <svg width="100%" height="220" viewBox="0 0 300 200">
              {/* Reference cube (faded) */}
              {showAligned && projRotated.map((p, i) => (
                <circle key={i} cx={p.sx} cy={p.sy} r={4} fill="#3b82f6" opacity={0.2} />
              ))}
              {/* Active points */}
              {projDisplay.map((p, i) => (
                <circle key={i} cx={p.sx} cy={p.sy} r={5}
                  fill={showAligned ? '#22c55e' : '#ef4444'}
                  opacity={p.depth * 0.5 + 0.3} />
              ))}
              {/* Connection lines for clarity */}
              {[0, 1, 2, 3].map(i => {
                const p1 = projDisplay[i];
                const p2 = projDisplay[i + 4];
                return (
                  <line key={`v${i}`} x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy}
                    stroke={showAligned ? '#22c55e' : '#ef4444'} strokeWidth={1} opacity={0.3} />
                );
              })}
              {[0, 1, 4, 5].map(i => {
                const p1 = projDisplay[i];
                const p2 = projDisplay[i + 2];
                return (
                  <line key={`h${i}`} x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy}
                    stroke={showAligned ? '#22c55e' : '#ef4444'} strokeWidth={1} opacity={0.3} />
                );
              })}
            </svg>
          </div>

          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showAligned}
                onChange={e => setShowAligned(e.target.checked)}
                className="w-4 h-4" />
              <span className="text-sm font-medium">Apply T-Net Alignment</span>
            </label>
            {showAligned && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                T-Net predicted a rotation of ~{((angleRad - correction) * 180 / Math.PI).toFixed(0)}°
                to realign the point cloud. The faded blue dots show the misaligned
                reference for comparison.
              </p>
            )}
          </div>
        </div>

        <div className="w-full lg:w-56 space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 text-xs">
            <h4 className="font-semibold mb-2">How T-Net Works</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Input: N×3 point cloud</li>
              <li>Mini-PointNet extracts features</li>
              <li>FC layers output 3×3 affine matrix</li>
              <li>Matrix applied to all points</li>
              <li>Aligned features fed to main PointNet</li>
            </ol>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400 text-xs">
            <strong>Key Insight:</strong> The T-Net transformation is learned end-to-end with the
            main network. It predicts the best alignment for the given task, not a
            fixed geometric correction.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 3. Evolution ───────── */

interface EvolutionMilestone {
  year: string;
  name: string;
  authors: string;
  keyIdea: string;
  color: string;
}

const EVOLUTION: EvolutionMilestone[] = [
  { year: '2017', name: 'PointNet', authors: 'Qi et al.', keyIdea: 'First direct processing of raw point clouds with shared MLPs + max pooling.', color: '#3b82f6' },
  { year: '2017', name: 'PointNet++', authors: 'Qi et al.', keyIdea: 'Hierarchical feature learning: grouping + sampling + PointNet on local regions.', color: '#8b5cf6' },
  { year: '2018', name: 'PointCNN', authors: 'Li et al.', keyIdea: 'X-transformation: learns a spatial weighting before convolution on point clouds.', color: '#ec4899' },
  { year: '2019', name: 'DGCNN (EdgeConv)', authors: 'Wang et al.', keyIdea: 'Dynamic graph construction in feature space; EdgeConv captures local neighborhood relations.', color: '#f59e0b' },
  { year: '2021', name: 'Point Transformer', authors: 'Zhao et al.', keyIdea: 'Self-attention on point clouds with vector attention mechanism.', color: '#10b981' },
  { year: '2023', name: '3D GPT', authors: 'Various', keyIdea: 'LLM-based 3D understanding: unified architecture for generation, captioning, and QA on 3D scenes.', color: '#ef4444' },
];

function PointNetEvolution() {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">Evolution of Point Cloud Learning</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        From PointNet&apos;s breakthrough in 2017 to modern transformer-based architectures, point
        cloud processing has evolved rapidly to capture richer local and global structure.
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600 transform -translate-x-0.5" />

        {EVOLUTION.map((m, i) => (
          <div key={i} className={`relative flex items-start mb-8 md:mb-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
            {/* Timeline dot */}
            <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 transform -translate-x-1/2 z-10"
              style={{ backgroundColor: m.color }} />

            {/* Year badge */}
            <div className={`flex items-center ${i % 2 === 0 ? 'md:justify-start md:pr-8' : 'md:justify-end md:pl-8'} w-full pl-10 md:pl-0`}>
              <div className="md:w-1/2">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: m.color }}>
                      {m.year}
                    </span>
                    <h4 className="font-semibold">{m.name}</h4>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{m.authors}</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{m.keyIdea}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Main ───────── */

export default function PointNetAdvancedDive() {
  const [section, setSection] = useState<Section>('permutation');

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'permutation', label: 'Permutation Invariance', icon: '🔀' },
    { id: 'tnetsim', label: 'T-Net Simulation', icon: '🔄' },
    { id: 'evolution', label: 'Evolution', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">PointNet Advanced Deep Dive</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore PointNet&apos;s core mechanisms — permutation invariance, the spatial transformer
          network, and how point cloud architectures have evolved over time.
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
          {section === 'permutation' && <PermutationInvariance />}
          {section === 'tnetsim' && <TNetSimulation />}
          {section === 'evolution' && <PointNetEvolution />}
        </motion.div>

        <LearnMoreSection
          title="Learn PointNet"
          gradientFrom="from-indigo-50"
          gradientTo="to-violet-50"
          darkGradientFrom="from-indigo-950/30"
          darkGradientTo="from-violet-950/30"
          hoverFrom="hover:from-indigo-100"
          hoverTo="hover:to-violet-100"
          darkHoverFrom="dark:hover:from-indigo-950/50"
          darkHoverTo="dark:hover:to-violet-950/50"
          analogyTitle="A Bag of Marbles"
          analogyIcon="🔮"
          analogyContent={
            <>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                Imagine you have a bag of colored marbles (a point cloud). You want to classify
                the bag — is it &quot;red-dominant&quot; or &quot;blue-dominant&quot;? You can&apos;t rely on
                the order you pull them out, only on the <strong>set statistics</strong>:
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-indigo-600 text-[10px] mb-2">Permutation Problem</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Unlike images (where pixel [0,0] is always top-left), point clouds have no
                    fixed order. Point [1,2,3] could be anywhere in the set. Standard neural
                    networks expect fixed ordering — this is the core challenge.
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="font-bold text-violet-600 text-[10px] mb-2">Max Pooling Solution</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    Max pooling is a <strong>symmetric function</strong>: max(a, b) = max(b, a).
                    By applying max pooling across all points, the output is the same regardless
                    of input order. This is PointNet&apos;s key innovation.
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong>Key insight:</strong> PointNet processes each point independently with shared MLPs,
                then aggregates globally with max pooling. The T-Net further learns an input-dependent
                spatial alignment before feature extraction.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-blue-700 dark:text-blue-400">🔗 Local + Global</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    PointNet only sees individual points (no local neighborhoods). PointNet++ fixes
                    this by grouping nearby points and applying PointNet to each group hierarchically,
                    like a CNN&apos;s convolutional layers.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
                  <h5 className="font-semibold text-[10px] mb-1 text-amber-700 dark:text-amber-400">🏗️ Scene Understanding</h5>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    PointNet can be extended to part segmentation (labeling each point) by combining
                    local features with the global feature vector, enabling per-point classification.
                  </p>
                </div>
              </div>
            </>
          }
          stepsTitle="How PointNet Processes Point Clouds"
          stepsContent={[
            { step: 1, title: 'Input: N×3 Point Cloud', desc: 'Each point has (x, y, z) coordinates. Points are unordered — any permutation is valid.', formula: 'X = {p_1, p_2, ..., p_N}, p_i ∈ R³' },
            { step: 2, title: 'Shared MLP on Each Point', desc: 'Apply the same small MLP to every point independently. This extracts per-point features.', formula: 'h_i = MLP(p_i), h_i ∈ R^d' },
            { step: 3, title: 'Symmetric Aggregation (Max Pool)', desc: 'Take the element-wise maximum across all point features. Output is permutation-invariant.', formula: 'g = max({h_1, h_2, ..., h_N}), g ∈ R^d' },
            { step: 4, title: 'Classification / Segmentation', desc: 'Global feature g is used for classification. For segmentation, concatenate g with each h_i.', formula: 'class = FC(g), seg_i = FC([h_i; g])' },
          ]}
          simpleTitle="PointNet with PyTorch"
          simpleCode={`import torch
import torch.nn as nn

class PointNet(nn.Module):
    def __init__(self, num_classes=40):
        super().__init__()
        # Per-point MLP (shared across all points)
        self.mlp = nn.Sequential(
            nn.Linear(3, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Linear(64, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Linear(128, 1024),
        )
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(1024, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Linear(256, num_classes),
        )
    
    def forward(self, x):
        # x: (batch, num_points, 3)
        batch_size, num_points, _ = x.shape
        
        # Apply MLP to each point: (B, N, 3) -> (B, N, 1024)
        features = self.mlp(x)
        
        # Max pooling over all points: (B, N, 1024) -> (B, 1024)
        global_feat = features.max(dim=1)[0]
        
        # Classify
        return self.classifier(global_feat)

# T-Net for spatial alignment
class TNet(nn.Module):
    def __init__(self, k=3):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(k, 64), nn.ReLU(),
            nn.Linear(64, 128), nn.ReLU(),
            nn.Linear(128, 1024),
        )
        self.fc = nn.Sequential(
            nn.Linear(1024, 512), nn.ReLU(),
            nn.Linear(512, 256), nn.ReLU(),
            nn.Linear(256, k * k),  # Output k×k matrix
        )
    
    def forward(self, x):
        B, N, K = x.shape
        features = self.mlp(x).max(dim=1)[0]
        matrix = self.fc(features).view(B, K, K)
        return torch.bmm(x, matrix)  # Apply transformation`}
          scratchTitle="PointNet from scratch"
          scratchCode={`import torch

class SimplePointNet(torch.nn.Module):
    """PointNet for point cloud classification"""
    def __init__(self, num_classes=10):
        super().__init__()
        # Per-point feature extractor (shared MLP)
        self.point_mlp = torch.nn.Sequential(
            torch.nn.Linear(3, 32),
            torch.nn.ReLU(),
            torch.nn.Linear(32, 64),
            torch.nn.ReLU(),
        )
        # Global feature aggregator
        self.global_mlp = torch.nn.Sequential(
            torch.nn.Linear(64, 128),
            torch.nn.ReLU(),
        )
        # Classifier
        self.classifier = torch.nn.Linear(128, num_classes)
    
    def forward(self, points):
        # points: (batch, num_points, 3)
        B, N, _ = points.shape
        
        # Per-point features
        feat = self.point_mlp(points)  # (B, N, 64)
        
        # Global feature via max pooling (permutation invariant!)
        global_feat = feat.max(dim=1)[0]  # (B, 64)
        
        # Classify
        global_feat = self.global_mlp(global_feat)
        return self.classifier(global_feat)

def permutation_test():
    """Verify permutation invariance"""
    model = SimplePointNet()
    points = torch.randn(1, 100, 3)
    
    # Shuffle points
    perm = torch.randperm(100)
    points_shuffled = points[:, perm, :]
    
    out1 = model(points)
    out2 = model(points_shuffled)
    
    print(f"Original output:  {out1[0, :3].detach()}")
    print(f"Shuffled output:  {out2[0, :3].detach()}")
    print(f"Difference: {(out1 - out2).abs().max().item():.8f}")
    # Should be ~0 (exact up to float precision)`}
        />
      </div>
    </div>
  );
}
