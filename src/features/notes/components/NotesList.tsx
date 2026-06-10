/**
 * NotesList - Display and manage all notes with filtering
 */

import React, { useState } from 'react';
import { NoteCard } from './NoteCard';
import { useFilteredNotes, useNoteStats } from '../hooks/useNotes';
import type { Note } from '@/store';

interface NotesListProps {
  onNoteClick?: (note: Note) => void;
  onNoteEdit?: (note: Note) => void;
  onNoteDelete?: (id: string) => void;
  onNotePin?: (id: string) => void;
  onNoteUnpin?: (id: string) => void;
}

export function NotesList({
  onNoteClick,
  onNoteEdit,
  onNoteDelete,
  onNotePin,
  onNoteUnpin,
}: NotesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<Note['category'] | undefined>();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useFilteredNotes({
    category: selectedCategory,
    tag: selectedTag,
    searchQuery: searchQuery.trim() || undefined,
  });

  const stats = useNoteStats();

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory(undefined);
    setSelectedTag('');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedTag || searchQuery;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.total}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Notes</div>
        </div>
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.pinned}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pinned</div>
        </div>
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.recent}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Recent (24h)</div>
        </div>
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.allTags.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tags</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory || ''}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? (e.target.value as Note['category']) : undefined
                )
              }
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Categories</option>
              <option value="math">Mathematics ({stats.byCategory.math || 0})</option>
              <option value="ml">Machine Learning ({stats.byCategory.ml || 0})</option>
              <option value="cv">Computer Vision ({stats.byCategory.cv || 0})</option>
              <option value="llm">LLM ({stats.byCategory.llm || 0})</option>
              <option value="research">Research ({stats.byCategory.research || 0})</option>
            </select>
          </div>

          {/* Tag Filter */}
          {stats.allTags.length > 0 && (
            <div>
              <label htmlFor="tag-filter" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Tag
              </label>
              <select
                id="tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">All Tags</option>
                {stats.allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {hasActiveFilters ? 'Filtered Notes' : 'All Notes'}
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              ({filteredNotes.length})
            </span>
          </h2>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? 'No notes match your filters. Try adjusting your search criteria.'
                : 'No notes yet. Create your first note to get started!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={onNoteClick}
                onEdit={onNoteEdit}
                onDelete={onNoteDelete}
                onPin={onNotePin}
                onUnpin={onNoteUnpin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
