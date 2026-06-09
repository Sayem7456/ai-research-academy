/**
 * RecentActivity - Display recent learning activities
 * Phase 8: User Dashboard
 */

'use client';

import React from 'react';
import { useProgressStore, useNotesStore, useBookmarksStore } from '@/store';

export function RecentActivity() {
  const progress = useProgressStore();
  const { notes } = useNotesStore();
  const { bookmarks } = useBookmarksStore();

  // Combine all activities
  const activities = [
    ...progress.completedTopics.map((topic) => ({
      id: `topic-${topic.id}`,
      type: 'topic' as const,
      title: topic.topicName,
      category: topic.category,
      timestamp: new Date(topic.completedAt),
      icon: '✅',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    })),
    ...progress.solvedProblems.map((problem) => ({
      id: `problem-${problem.id}`,
      type: 'problem' as const,
      title: problem.problemName,
      difficulty: problem.difficulty,
      timestamp: new Date(problem.solvedAt),
      icon: '🎯',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    })),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      type: 'note' as const,
      title: note.title,
      category: note.category,
      timestamp: new Date(note.updatedAt),
      icon: '📝',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    })),
    ...bookmarks.map((bookmark) => ({
      id: `bookmark-${bookmark.id}`,
      type: 'bookmark' as const,
      title: bookmark.title,
      category: bookmark.category,
      timestamp: new Date(bookmark.createdAt),
      icon: '🔖',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900',
    })),
  ];

  // Sort by timestamp (newest first) and take top 10
  const recentActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  // Format relative time
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (recentActivities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h2>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No recent activity</p>
            <p className="text-sm">Start learning to see your activity here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Recent Activity
      </h2>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${activity.bgColor} flex items-center justify-center text-xl`}>
              {activity.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {activity.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${activity.color}`}>
                  {activity.type === 'topic' && 'Completed Topic'}
                  {activity.type === 'problem' && `Solved ${activity.difficulty} Problem`}
                  {activity.type === 'note' && 'Created Note'}
                  {activity.type === 'bookmark' && 'Bookmarked'}
                </span>
                {'category' in activity && activity.category && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {activity.category}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Time */}
            <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(activity.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
