/**
 * Dashboard Page - User learning analytics and progress tracking
 * Phase 8: User Dashboard with Recharts visualizations
 */

'use client';

import React from 'react';
import {
  StatsCards,
  ProgressChart,
  CategoryProgress,
  RecentActivity,
} from '@/features/dashboard/components';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📊 Learning Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your progress, view analytics, and see your learning journey
          </p>
        </div>

        <div className="mb-8">
          <StatsCards />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProgressChart />
          <CategoryProgress />
        </div>

        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}