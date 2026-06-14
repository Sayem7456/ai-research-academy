'use client';

import React from 'react';
import type { PaperFilter } from '../types';

interface PaperFilterPanelProps {
  filter: PaperFilter;
  onFilterChange: (filter: PaperFilter) => void;
  resultCount: number;
  totalCount: number;
}

export default function PaperFilterPanel({ filter, onFilterChange, resultCount, totalCount }: PaperFilterPanelProps) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Search</label>
        <input
          type="text"
          value={filter.query}
          onChange={(e) => onFilterChange({ ...filter, query: e.target.value })}
          placeholder="Search by title, author, or keyword..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Sort By</label>
          <div className="flex gap-2">
            {(['year', 'citations', 'title'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => onFilterChange({ ...filter, sortBy: sort })}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter.sortBy === sort
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {resultCount} of {totalCount} papers
      </div>
    </div>
  );
}
