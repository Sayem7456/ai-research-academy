/**
 * Dashboard Page - Full learning analytics and progress tracking
 * Phase 8: User Dashboard with Recharts visualizations
 */

'use client';

import React from 'react';
import Link from 'next/link';
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
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            📊 Learning Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Full analytics: progress charts, category breakdown, and activity timeline.
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