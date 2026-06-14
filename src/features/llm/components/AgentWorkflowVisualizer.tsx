'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface Tool {
  name: string;
  description: string;
  icon: string;
}

interface AgentStep {
  thought: string;
  action?: { tool: string; input: string };
  observation?: string;
}

const TOOLS: Tool[] = [
  { name: 'search', description: 'Search the web for information', icon: '🔍' },
  { name: 'calculator', description: 'Perform mathematical calculations', icon: '🧮' },
  { name: 'code', description: 'Write and execute code', icon: '💻' },
  { name: 'file_read', description: 'Read contents of a file', icon: '📄' },
  { name: 'file_write', description: 'Write content to a file', icon: '✏️' },
];

const SCENARIOS: Record<string, AgentStep[]> = {
  'Research task': [
    { thought: 'The user wants to know about quantum computing. I should search for recent information.' },
    { thought: 'I need to search for quantum computing basics first.', action: { tool: 'search', input: 'quantum computing basics 2024' }, observation: 'Found comprehensive article on quantum computing fundamentals.' },
    { thought: 'Good, I have basic info. Now let me find recent developments.', action: { tool: 'search', input: 'quantum computing breakthroughs 2024' }, observation: 'Found 3 recent breakthroughs in quantum error correction.' },
    { thought: 'I have enough information to provide a comprehensive answer.', action: { tool: 'code', input: 'generate_summary("quantum computing research")' }, observation: 'Summary generated with key findings.' },
    { thought: 'I have gathered sufficient information from multiple sources.' },
  ],
  'Code debugging': [
    { thought: 'The user has a Python error. I need to see the code first.' },
    { thought: 'Let me read the file to see the error.', action: { tool: 'file_read', input: 'main.py' }, observation: 'File contains a function with a TypeError on line 42.' },
    { thought: 'I see the issue - passing string to int. Let me fix it.', action: { tool: 'code', input: 'fix_type_error(line=42, type=int)' }, observation: 'Fixed: added int() conversion.' },
    { thought: 'Let me verify the fix works.', action: { tool: 'calculator', input: 'test_function(input="42")' }, observation: 'Test passed. Function now works correctly.' },
    { thought: 'The bug is fixed and verified.' },
  ],
  'Data analysis': [
    { thought: 'User wants to analyze sales data. I need to load and process it.' },
    { thought: 'First, let me read the data file.', action: { tool: 'file_read', input: 'sales_2024.csv' }, observation: 'CSV contains 1000 rows with date, product, amount columns.' },
    { thought: 'Now I need to compute summary statistics.', action: { tool: 'code', input: 'pandas.describe(sales_2024.csv)' }, observation: 'Total revenue: $1.2M, avg per transaction: $120.' },
    { thought: 'Let me calculate the growth rate.', action: { tool: 'calculator', input: '(1200000 - 950000) / 950000 * 100' }, observation: 'Growth rate: 26.3%' },
    { thought: 'I have all the key metrics. Ready to present findings.' },
  ],
};

type AgentStage = 'think' | 'act' | 'observe';

export default function AgentWorkflowVisualizer() {
  const [selectedScenario, setSelectedScenario] = useState('Research task');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentStage, setCurrentStage] = useState<AgentStage>('think');
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = SCENARIOS[selectedScenario];

  const stopAnim = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAnimating(false);
    setCurrentStep(0);
    setCurrentStage('think');
  }, []);

  const startAnim = useCallback(() => {
    setIsAnimating(true);
    setCurrentStep(0);
    setCurrentStage('think');
    let step = 0;
    let stage: AgentStage = 'think';
    intervalRef.current = setInterval(() => {
      if (stage === 'think') {
        stage = steps[step].action ? 'act' : 'observe';
        setCurrentStage(stage);
      } else if (stage === 'act') {
        stage = 'observe';
        setCurrentStage(stage);
      } else {
        step++;
        if (step >= steps.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnimating(false);
          return;
        }
        stage = 'think';
        setCurrentStep(step);
        setCurrentStage(stage);
      }
    }, 1200);
  }, [steps]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stageColors: Record<AgentStage, string> = {
    think: '#3b82f6',
    act: '#22c55e',
    observe: '#f59e0b',
  };

  const stageLabels: Record<AgentStage, string> = {
    think: '🧠 Thinking',
    act: '⚡ Acting',
    observe: '👁️ Observing',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <h2 className="text-2xl font-bold mb-2">Agent Workflow Visualizer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          LLM agents use a Think → Act → Observe loop to solve complex tasks with tools.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Scenario</label>
              <div className="space-y-1">
                {Object.keys(SCENARIOS).map((scenario) => (
                  <button
                    key={scenario}
                    onClick={() => { setSelectedScenario(scenario); stopAnim(); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedScenario === scenario
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {scenario}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <button
                onClick={isAnimating ? stopAnim : startAnim}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  isAnimating ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isAnimating ? '■ Stop' : '▶ Run Agent'}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Available Tools</h3>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-1.5"
              >
                <span>{tool.icon}</span>
                <span className="font-mono font-medium">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3">Agent Execution Trace</h3>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: i <= currentStep ? 1 : 0.3,
                  y: 0,
                }}
                className={`p-4 rounded-lg border-l-4 transition-all ${
                  i === currentStep
                    ? 'bg-gray-50 dark:bg-gray-900'
                    : i < currentStep
                    ? 'bg-gray-50/50 dark:bg-gray-900/50'
                    : 'bg-white dark:bg-gray-800'
                }`}
                style={{
                  borderColor: i <= currentStep ? stageColors[currentStage] : '#d1d5db',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400">Step {i + 1}</span>
                  {i === currentStep && isAnimating && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: stageColors[currentStage] }}
                    >
                      {stageLabels[currentStage]}
                    </motion.span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">💬</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{step.thought}</p>
                  </div>

                  {step.action && (i < currentStep || (i === currentStep && currentStage !== 'think')) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2"
                    >
                      <span className="text-green-500 mt-0.5">⚡</span>
                      <div className="text-sm">
                        <span className="font-mono text-green-700 dark:text-green-400">
                          {step.action.tool}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          {step.action.input}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {step.observation && (i < currentStep || (i === currentStep && currentStage === 'observe')) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">👁️</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        {step.observation}
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-400">
          <h3 className="font-semibold text-sm mb-2">ReAct Pattern</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300">
            The <strong>ReAct</strong> (Reasoning + Acting) framework interleaves reasoning traces with actions.
            The agent thinks about what to do, takes an action using a tool, observes the result, and repeats until the task is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
