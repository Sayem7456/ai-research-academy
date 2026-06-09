/**
 * CategoryProgress - Progress breakdown by category (math, ml, cv, llm, research)
 * Phase 8: User Dashboard
 */

'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useProgressStore } from '@/store';
import type { CompletedTopic } from '@/store';

const CATEGORY_COLORS: Record<CompletedTopic['category'], string> = {
  math: '#10B981', // green
  ml: '#3B82F6', // blue
  cv: '#8B5CF6', // purple
  llm: '#F59E0B', // amber
  research: '#EF4444', // red
};

const CATEGORY_LABELS: Record<CompletedTopic['category'], string> = {
  math: 'Mathematics',
  ml: 'Machine Learning',
  cv: 'Computer Vision',
  llm: 'Large Language Models',
  research: 'Research Skills',
};

export function CategoryProgress() {
  const progress = useProgressStore();

  // Calculate progress by category
  const chartData = useMemo(() => {
    const categories: CompletedTopic['category'][] = ['math', 'ml', 'cv', 'llm', 'research'];

    return categories.map((category) => {
      const topicsCount = progress.completedTopics.filter(
        (topic) => topic.category === category
      ).length;

      const problemsCount = progress.solvedProblems.filter(
        (problem) => {
          // Find the corresponding topic to get its category
          const topic = progress.completedTopics.find(
            (t) => t.id === problem.topicId
          );
          return topic?.category === category;
        }
      ).length;

      return {
        category: CATEGORY_LABELS[category],
        categoryKey: category,
        topics: topicsCount,
        problems: problemsCount,
        total: topicsCount + problemsCount,
      };
    });
  }, [progress.completedTopics, progress.solvedProblems]);

  const totalActivity = chartData.reduce((sum, item) => sum + item.total, 0);

  if (totalActivity === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Progress by Category
        </h2>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No progress data yet</p>
            <p className="text-sm">Start learning to see your category breakdown!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Progress by Category
      </h2>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="category"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
          />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <Bar dataKey="topics" name="Completed Topics" stackId="a">
            {chartData.map((entry) => (
              <Cell key={entry.categoryKey} fill={CATEGORY_COLORS[entry.categoryKey as CompletedTopic['category']]} />
            ))}
          </Bar>
          <Bar dataKey="problems" name="Solved Problems" stackId="a" opacity={0.6}>
            {chartData.map((entry) => (
              <Cell key={entry.categoryKey} fill={CATEGORY_COLORS[entry.categoryKey as CompletedTopic['category']]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Category Breakdown */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {chartData.map((item) => (
          <div
            key={item.categoryKey}
            className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
          >
            <div
              className="w-4 h-4 rounded-full mx-auto mb-2"
              style={{ backgroundColor: CATEGORY_COLORS[item.categoryKey as CompletedTopic['category']] }}
            />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {item.category}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {item.total}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {item.topics}T / {item.problems}P
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
