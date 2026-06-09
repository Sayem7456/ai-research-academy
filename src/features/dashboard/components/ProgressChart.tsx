/**
 * ProgressChart - Line chart showing learning progress over time
 * Phase 8: User Dashboard
 */

'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useProgressStore } from '@/store';

export function ProgressChart() {
  const progress = useProgressStore();

  // Generate chart data from progress
  const chartData = useMemo(() => {
    // Combine topics and problems into a single timeline
    const activities = [
      ...progress.completedTopics.map((topic) => ({
        date: new Date(topic.completedAt).toISOString().split('T')[0],
        type: 'topic',
      })),
      ...progress.solvedProblems.map((problem) => ({
        date: new Date(problem.solvedAt).toISOString().split('T')[0],
        type: 'problem',
      })),
    ];

    // Group by date
    const grouped = activities.reduce<Record<string, { topics: number; problems: number }>>((acc, activity) => {
      if (!acc[activity.date]) {
        acc[activity.date] = { topics: 0, problems: 0 };
      }
      if (activity.type === 'topic') {
        acc[activity.date].topics++;
      } else {
        acc[activity.date].problems++;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    const data = Object.entries(grouped)
      .map(([date, counts]) => ({
        date,
        topics: counts.topics,
        problems: counts.problems,
        total: counts.topics + counts.problems,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

    return data.filter((d) => d.date >= cutoff);
  }, [progress.completedTopics, progress.solvedProblems]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Progress Over Time
        </h2>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No activity data yet</p>
            <p className="text-sm">Complete topics and solve problems to see your progress!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Progress Over Time (Last 30 Days)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
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
          <Line
            type="monotone"
            dataKey="topics"
            stroke="#10B981"
            strokeWidth={2}
            name="Completed Topics"
            dot={{ fill: '#10B981', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="problems"
            stroke="#3B82F6"
            strokeWidth={2}
            name="Solved Problems"
            dot={{ fill: '#3B82F6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#8B5CF6"
            strokeWidth={2}
            name="Total Activity"
            dot={{ fill: '#8B5CF6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
