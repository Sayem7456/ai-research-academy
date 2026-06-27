'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function LearnMoreSection({
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
