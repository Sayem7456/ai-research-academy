/**
 * NoteSearch - Search interface for notes
 */

import React, { useState, useEffect } from 'react';
import { NoteCard } from './NoteCard';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '@/store';

interface NoteSearchProps {
  onNoteClick?: (note: Note) => void;
  onNoteEdit?: (note: Note) => void;
  onNoteDelete?: (id: string) => void;
  onNotePin?: (id: string) => void;
  onNoteUnpin?: (id: string) => void;
}

export function NoteSearch({
  onNoteClick,
  onNoteEdit,
  onNoteDelete,
  onNotePin,
  onNoteUnpin,
}: NoteSearchProps) {
  const { searchNotes } = useNotes();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const searchResults = searchNotes(query);
      setResults(searchResults);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, searchNotes]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="w-full px-4 py-3 pl-12 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 text-lg"
            autoFocus
          />
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search Tips */}
        {!query && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            💡 Try searching by title, keywords, tags, or content
          </div>
        )}
      </div>

      {/* Search Results */}
      <div>
        {isSearching ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Searching...</p>
          </div>
        ) : query.trim() ? (
          <>
            {/* Results Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Search Results
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  ({results.length} {results.length === 1 ? 'note' : 'notes'} found)
                </span>
              </h2>
            </div>

            {/* Results Grid */}
            {results.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  No notes found matching &ldquo;{query}&rdquo;
                </p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  Try different keywords or check your spelling
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((note) => (
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
          </>
        ) : null}
      </div>
    </div>
  );
}
