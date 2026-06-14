'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type TokenizerType = 'word' | 'bpe' | 'wordpiece';
type TabId = 'overview' | 'compare' | 'bpe-steps' | 'special-tokens' | 'vocab-analysis';

interface Token {
  text: string;
  start: number;
  end: number;
  type: 'word' | 'subword' | 'special' | 'punctuation';
  color: string;
  id?: number;
}

interface BPEMergeStep {
  round: number;
  units: string[];
  mergedPair: string;
  mergedInto: string;
  pairRank: number;
}

const VOCAB: Set<string> = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or',
  'nor', 'not', 'so', 'very', 'just', 'own', 'same', 'than', 'too', 'also',
  'back', 'even', 'still', 'new', 'good', 'old', 'great', 'high', 'low',
  'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public',
  'bad', 'different', 'other', 'more', 'most', 'such', 'only', 'each',
  'much', 'some', 'every', 'all', 'any', 'both', 'many', 'token', 'un',
  'happy', 'happiness', 'unhappy', 'unhappiness', 'believe', 'believable',
  'unbelievable', 'unbelievably', 'possible', 'impossible', 'impossibly',
  'understand', 'understanding', 'understood', 'sub', 'cat', 'dog',
  'play', 'jump', 'think', 'thinker',
]);

function wordTokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\w+|[^\w\s]|\s+)/g;
  let match;
  let pos = 0;
  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    if (token.trim()) {
      tokens.push({
        text: token,
        start: pos,
        end: pos + token.length,
        type: /[^\w]/.test(token) ? 'punctuation' : 'word',
        color: /[^\w]/.test(token) ? '#ef4444' : '#3b82f6',
      });
    }
    pos += token.length;
  }
  return tokens;
}

function bpeTokenizeWithSteps(text: string): { tokens: Token[]; steps: BPEMergeStep[] } {
  const steps: BPEMergeStep[] = [];
  const tokens: Token[] = [];
  const words = text.split(/\s+/);
  let pos = 0;

  const pairFreq: Record<string, number> = {};
  for (const word of words) {
    const chars = word.split('');
    for (let i = 0; i < chars.length - 1; i++) {
      const pair = chars[i] + chars[i + 1];
      pairFreq[pair] = (pairFreq[pair] || 0) + 1;
    }
  }
  const sortedPairs = Object.entries(pairFreq).sort((a, b) => b[1] - a[1]);
  const MERGE_RANKS: Record<string, number> = {};
  sortedPairs.forEach(([pair], rank) => { MERGE_RANKS[pair] = rank; });

  for (const word of words) {
    let units = word.split('');
    for (let mergeRound = 0; mergeRound < 5; mergeRound++) {
      let bestRank = Infinity;
      let bestIdx = -1;
      for (let i = 0; i < units.length - 1; i++) {
        const pair = units[i] + units[i + 1];
        const rank = MERGE_RANKS[pair] ?? Infinity;
        if (rank < bestRank) { bestRank = rank; bestIdx = i; }
      }
      if (bestIdx === -1) break;
      const merged = units[bestIdx] + units[bestIdx + 1];
      steps.push({
        round: steps.length + 1,
        units: [...units],
        mergedPair: units[bestIdx] + ' + ' + units[bestIdx + 1],
        mergedInto: merged,
        pairRank: bestRank,
      });
      units = [...units.slice(0, bestIdx), merged, ...units.slice(bestIdx + 2)];
    }
    for (const unit of units) {
      const isWhole = unit === word;
      tokens.push({
        text: unit, start: pos, end: pos + unit.length,
        type: isWhole ? 'word' : 'subword',
        color: isWhole ? '#3b82f6' : '#8b5cf6',
      });
      pos += unit.length;
    }
    pos += 1;
  }
  return { tokens, steps };
}

function bpeTokenize(text: string): Token[] {
  return bpeTokenizeWithSteps(text).tokens;
}

function wordpieceTokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const words = text.split(/\s+/);
  let pos = 0;

  const VOCAB: Set<string> = new Set();
  const commonPrefixes = [
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'very', 'just',
    'own', 'same', 'than', 'too', 'also', 'back', 'even', 'still',
    'new', 'good', 'old', 'great', 'high', 'low', 'small', 'large',
    'next', 'early', 'young', 'important', 'few', 'public', 'bad',
    'different', 'other', 'more', 'most', 'such', 'only', 'each',
    'much', 'some', 'every', 'all', 'any', 'both', 'few', 'many',
    'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'un', '##ha', '##iness', '##ness', '##ing', '##ed', '##er',
    '##est', '##ly', '##tion', '##ment', '##ness', '##able',
    'token', '##ization', 'tokenize', 'tokenized', 'tokenizer',
    'understand', 'understanding', 'understood',
    'happy', 'happiness', 'unhappy', 'unhappiness',
    'believe', 'believable', 'unbelievable', 'unbelievably',
    'possible', 'impossible', 'impossibly',
    'do', 're', 'mi', 'fa', 'so', 'la', 'ti',
    'sub', '##word', 'subword',
    'the', '##quick', '##brown', '##fox',
    'cat', '##s', 'dog', '##like', '##run',
    'play', '##ing', 'jump', '##ed',
    'think', '##ing', 'thinker',
  ];
  for (const w of commonPrefixes) VOCAB.add(w);

  for (const word of words) {
    const lower = word.toLowerCase();
    if (lower.length <= 2 || VOCAB.has(lower)) {
      tokens.push({
        text: word,
        start: pos,
        end: pos + word.length,
        type: 'word',
        color: '#3b82f6',
      });
      pos += word.length + 1;
      continue;
    }

    let remaining = lower;
    let start = pos;
    let isFirst = true;

    while (remaining.length > 0) {
      let end = remaining.length;
      let found = false;

      while (end > 0) {
        const piece = remaining.slice(0, end);
        const prefixed = isFirst ? piece : `##${piece}`;
        const inVocab = VOCAB.has(piece) || VOCAB.has(prefixed) || end <= 2;

        if (inVocab) {
          const displayText = isFirst ? piece : `##${piece}`;
          tokens.push({
            text: displayText,
            start,
            end: start + displayText.length,
            type: isFirst ? 'word' : 'subword',
            color: isFirst ? '#3b82f6' : '#8b5cf6',
          });
          start += displayText.length;
          remaining = remaining.slice(end);
          isFirst = false;
          found = true;
          break;
        }
        end--;
      }

      if (!found) {
        const displayText = isFirst ? remaining : `##${remaining}`;
        tokens.push({
          text: displayText,
          start,
          end: start + displayText.length,
          type: isFirst ? 'word' : 'subword',
          color: isFirst ? '#3b82f6' : '#8b5cf6',
        });
        break;
      }
    }
    pos += word.length + 1;
  }
  return tokens;
}

function generateTokenIds(tokens: Token[]): Token[] {
  const seen = new Map<string, number>();
  let nextId = 100;
  return tokens.map((t) => {
    const key = t.text.toLowerCase();
    if (!seen.has(key)) seen.set(key, nextId++);
    return { ...t, id: seen.get(key) };
  });
}

function computeStats(tokens: Token[], input: string) {
  const words = input.split(/\s+/).filter(Boolean);
  const subwordCount = tokens.filter((t) => t.type === 'subword').length;
  const wholeWordCount = tokens.filter((t) => t.type === 'word').length;
  const uniqueTokens = new Set(tokens.map((t) => t.text.toLowerCase())).size;
  return {
    tokenCount: tokens.length,
    charCount: input.length,
    compressionRatio: input.length / tokens.length,
    avgTokensPerWord: tokens.length / words.length,
    uniqueTokens,
    subwordCount,
    wholeWordCount,
  };
}

const SPECIAL_TOKENS = [
  { token: '[CLS]', desc: 'Classification (BERT start)', usedBy: 'BERT', color: '#22c55e' },
  { token: '[SEP]', desc: 'Sentence separator (BERT)', usedBy: 'BERT', color: '#eab308' },
  { token: '[PAD]', desc: 'Padding for batch alignment', usedBy: 'All', color: '#94a3b8' },
  { token: '[MASK]', desc: 'Masked token for pretraining', usedBy: 'BERT', color: '#f97316' },
  { token: '<|im_start|>', desc: 'Chat turn start', usedBy: 'GPT', color: '#06b6d4' },
  { token: '<|im_end|>', desc: 'Chat turn end', usedBy: 'GPT', color: '#06b6d4' },
  { token: '<|endoftext|>', desc: 'End of text delimiter', usedBy: 'GPT', color: '#a78bfa' },
  { token: '[UNK]', desc: 'Unknown token', usedBy: 'Both', color: '#ef4444' },
];

const LABEL_MAP: Record<TokenizerType, string> = {
  word: 'Word',
  bpe: 'BPE',
  wordpiece: 'WordPiece',
};

export default function TokenizationExplorer() {
  const [input, setInput] = useState('unhappiness tokenization unbelievable');
  const [tokenizer, setTokenizer] = useState<TokenizerType>('word');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [compareLeft, setCompareLeft] = useState<TokenizerType>('bpe');
  const [compareRight, setCompareRight] = useState<TokenizerType>('wordpiece');

  const tokens = useMemo(() => {
    switch (tokenizer) {
      case 'word': return wordTokenize(input);
      case 'bpe': return bpeTokenize(input);
      case 'wordpiece': return wordpieceTokenize(input);
    }
  }, [input, tokenizer]);

  const tokensWithIds = useMemo(() => generateTokenIds(tokens), [tokens]);
  const stats = useMemo(() => computeStats(tokens, input), [tokens, input]);
  const bpeSteps = useMemo(() => bpeTokenizeWithSteps(input).steps, [input]);

  const compareLeftTokens = useMemo(() => {
    switch (compareLeft) {
      case 'word': return wordTokenize(input);
      case 'bpe': return bpeTokenize(input);
      case 'wordpiece': return wordpieceTokenize(input);
    }
  }, [input, compareLeft]);

  const compareRightTokens = useMemo(() => {
    switch (compareRight) {
      case 'word': return wordTokenize(input);
      case 'bpe': return bpeTokenize(input);
      case 'wordpiece': return wordpieceTokenize(input);
    }
  }, [input, compareRight]);

  const compareLeftStats = useMemo(() => computeStats(compareLeftTokens, input), [compareLeftTokens, input]);
  const compareRightStats = useMemo(() => computeStats(compareRightTokens, input), [compareRightTokens, input]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'compare', label: 'Compare' },
    { id: 'bpe-steps', label: 'BPE Steps' },
    { id: 'special-tokens', label: 'Special Tokens' },
    { id: 'vocab-analysis', label: 'Vocab Analysis' },
  ];

  const tokenizerInfo: Record<TokenizerType, { name: string; description: string; example: string }> = {
    word: {
      name: 'Word Tokenizer',
      description: 'Splits text on whitespace and punctuation. Simple but cannot handle unknown words.',
      example: '"unhappiness" → ["unhappiness"] (one token)',
    },
    bpe: {
      name: 'BPE (Byte-Pair Encoding)',
      description: 'Starts with characters, iteratively merges the most frequent adjacent pairs. Used by GPT-2/3/4.',
      example: '"unhappiness" → merges character pairs until vocabulary target is reached',
    },
    wordpiece: {
      name: 'WordPiece',
      description: 'Greedy longest-match-first. Used by BERT. Marks continuation subwords with ##.',
      example: '"unhappiness" → ["un", "##happi", "##ness"]',
    },
  };

  const info = tokenizerInfo[tokenizer];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-2xl font-bold">Tokenization Explorer</h2>
          <Link
            href="/content/llm/llm-tokenization"
            className="shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all"
          >
            View Full Lesson
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          See how different tokenization algorithms split text into tokens. Tokens are the fundamental units that LLMs process.
        </p>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <label className="block text-sm font-medium mb-2">Input Text</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter text to tokenize..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Try compound words like &quot;unhappiness&quot;, &quot;tokenization&quot;, &quot;unbelievable&quot; to see subword tokenization in action.
          </p>
        </div>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Tokenizer</h3>
              <div className="flex gap-2">
                {(['word', 'bpe', 'wordpiece'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTokenizer(type)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      tokenizer === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {LABEL_MAP[type]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Tokenized Output</h3>
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[80px]">
                <AnimatePresence mode="wait">
                  {tokensWithIds.map((token, i) => (
                    <motion.div
                      key={`${tokenizer}-${i}-${token.text}-${token.id}`}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex flex-col items-center"
                    >
                      <div
                        className="px-3 py-2 rounded-lg text-sm font-mono font-medium text-white shadow-sm"
                        style={{ backgroundColor: token.color }}
                      >
                        {token.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 font-mono">
                        ID:{token.id}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {token.type}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tokens: <span className="font-semibold">{stats.tokenCount}</span>
                  {' | '}Chars: <span className="font-semibold">{stats.charCount}</span>
                  {' | '}Compression: <span className="font-semibold">{stats.compressionRatio.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#3b82f6] inline-block" /> word
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#8b5cf6] inline-block" /> subword
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#ef4444] inline-block" /> punctuation
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
              <h3 className="font-semibold mb-2">{info.name}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{info.description}</p>
              <p className="text-sm font-mono text-amber-700 dark:text-amber-400">{info.example}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-400">Word</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Complete words as tokens. Simple, large vocabulary, cannot handle unknown words.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-400">Subword</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Breaks rare words into common subunits. Balances vocabulary size and coverage.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">Special Tokens</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  [CLS], [SEP], [PAD], [MASK] - BERT uses these for classification and boundary marking.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Tokenizer</label>
                <select
                  value={compareLeft}
                  onChange={(e) => setCompareLeft(e.target.value as TokenizerType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {(['word', 'bpe', 'wordpiece'] as const).map((t) => (
                    <option key={t} value={t}>{LABEL_MAP[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Right Tokenizer</label>
                <select
                  value={compareRight}
                  onChange={(e) => setCompareRight(e.target.value as TokenizerType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {(['word', 'bpe', 'wordpiece'] as const).map((t) => (
                    <option key={t} value={t}>{LABEL_MAP[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 text-blue-600 dark:text-blue-400">
                  {LABEL_MAP[compareLeft]} ({compareLeftStats.tokenCount} tokens)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {compareLeftTokens.map((token, i) => (
                    <div key={i} className="px-2 py-1 rounded text-xs font-mono text-white" style={{ backgroundColor: token.color }}>
                      {token.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 text-purple-600 dark:text-purple-400">
                  {LABEL_MAP[compareRight]} ({compareRightStats.tokenCount} tokens)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {compareRightTokens.map((token, i) => (
                    <div key={i} className="px-2 py-1 rounded text-xs font-mono text-white" style={{ backgroundColor: token.color }}>
                      {token.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{compareLeftStats.tokenCount}</div>
                <div className="text-xs text-gray-500">{LABEL_MAP[compareLeft]} tokens</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{compareRightStats.tokenCount}</div>
                <div className="text-xs text-gray-500">{LABEL_MAP[compareRight]} tokens</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{compareLeftStats.compressionRatio.toFixed(1)}x</div>
                <div className="text-xs text-gray-500">{LABEL_MAP[compareLeft]} compression</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-amber-600">{compareRightStats.compressionRatio.toFixed(1)}x</div>
                <div className="text-xs text-gray-500">{LABEL_MAP[compareRight]} compression</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bpe-steps' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Watch how BPE iteratively merges the most frequent character pairs.
              Each round picks the highest-frequency pair and merges it.
            </p>
            <div className="space-y-3">
              {bpeSteps.slice(0, 12).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {step.round}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {step.units.map((u, j) => (
                        <span key={j} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                          {u}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Merge: <span className="font-mono text-blue-600 dark:text-blue-400">{step.mergedPair}</span>
                      {' -> '}
                      <span className="font-mono text-green-600 dark:text-green-400 font-semibold">{step.mergedInto}</span>
                      {' '}(rank {step.pairRank})
                    </div>
                  </div>
                </motion.div>
              ))}
              {bpeSteps.length === 0 && (
                <p className="text-center text-gray-500 py-8">No merges possible for this input.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'special-tokens' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Special tokens are reserved tokens that models use for structure and control.
              They are not produced by tokenization but added during preprocessing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPECIAL_TOKENS.map((st) => (
                <div
                  key={st.token}
                  className="p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-900"
                  style={{ borderColor: st.color }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono font-bold text-white"
                      style={{ backgroundColor: st.color }}
                    >
                      {st.token}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                      {st.usedBy}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{st.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">How they are used:</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                <p><strong>BERT:</strong> [CLS] The cat sat [SEP] The dog ran [SEP]</p>
                <p><strong>GPT:</strong> {'<|im_start|>'}system You are helpful. {'<|im_end|>'} {'<|im_start|>'}user Hi{'<|im_end|>'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vocab-analysis' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyze vocabulary usage: how many unique tokens, subword vs whole-word ratio, and token ID mapping.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{stats.tokenCount}</div>
                <div className="text-xs text-gray-500">Total Tokens</div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{stats.uniqueTokens}</div>
                <div className="text-xs text-gray-500">Unique Tokens</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{stats.wholeWordCount}</div>
                <div className="text-xs text-gray-500">Whole Words</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                <div className="text-lg font-bold text-amber-600">{stats.subwordCount}</div>
                <div className="text-xs text-gray-500">Subwords</div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Token ID Mapping</h4>
              <div className="flex flex-wrap gap-2">
                {tokensWithIds.map((token, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: token.color }}>
                      {token.text}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {'\u2192'} {token.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border-l-4 border-amber-400">
              <h4 className="font-semibold text-sm mb-1">Compression Ratio</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {stats.charCount} characters compressed to {stats.tokenCount} tokens
                ({stats.compressionRatio.toFixed(1)}x). Average {stats.avgTokensPerWord.toFixed(1)} tokens per word.
                {stats.subwordCount > 0 && ` ${stats.subwordCount} subword splits needed for rare/complex words.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
