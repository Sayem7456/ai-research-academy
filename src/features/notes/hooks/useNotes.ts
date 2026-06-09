/**
 * Custom hook for notes management
 * Wraps the notes store and provides convenient methods
 */

import { useEffect } from 'react';
import { useNotesStore } from '@/store';
import type { Note } from '@/store';

/**
 * Hook for managing notes
 * Automatically loads notes on mount
 */
export function useNotes() {
  const loadNotes = useNotesStore((state) => state.loadNotes);
  const notes = useNotesStore((state) => state.notes);
  const isLoading = useNotesStore((state) => state.isLoading);
  const error = useNotesStore((state) => state.error);
  const createNote = useNotesStore((state) => state.createNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const pinNote = useNotesStore((state) => state.pinNote);
  const unpinNote = useNotesStore((state) => state.unpinNote);
  const searchNotes = useNotesStore((state) => state.searchNotes);
  const getNotesByCategory = useNotesStore((state) => state.getNotesByCategory);
  const getNotesByTopic = useNotesStore((state) => state.getNotesByTopic);
  const clearNotes = useNotesStore((state) => state.clearNotes);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    // State
    notes,
    isLoading,
    error,

    // Actions
    createNote,
    updateNote,
    deleteNote,
    pinNote,
    unpinNote,
    searchNotes,
    getNotesByCategory,
    getNotesByTopic,
    clearNotes,
  };
}

/**
 * Hook for a filtered and sorted notes list
 */
export function useFilteredNotes(options?: {
  category?: Note['category'];
  topicId?: string;
  tag?: string;
  searchQuery?: string;
}) {
  const { notes, searchNotes, getNotesByCategory, getNotesByTopic } = useNotes();

  let filteredNotes = notes;

  // Apply filters
  if (options?.searchQuery) {
    filteredNotes = searchNotes(options.searchQuery);
  } else if (options?.category) {
    filteredNotes = getNotesByCategory(options.category);
  } else if (options?.topicId) {
    filteredNotes = getNotesByTopic(options.topicId);
  }

  // Filter by tag if specified
  if (options?.tag) {
    filteredNotes = filteredNotes.filter((note) =>
      note.tags?.includes(options.tag!)
    );
  }

  // Sort: pinned first, then by updated date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // Pinned notes first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Then by updated date (newest first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return sortedNotes;
}

/**
 * Hook for note statistics
 */
export function useNoteStats() {
  const { notes } = useNotes();

  const stats = {
    total: notes.length,
    pinned: notes.filter((note) => note.isPinned).length,
    byCategory: notes.reduce<Record<string, number>>((acc, note) => {
      if (note.category) {
        acc[note.category] = (acc[note.category] || 0) + 1;
      }
      return acc;
    }, {}),
    allTags: Array.from(
      new Set(notes.flatMap((note) => note.tags || []))
    ).sort(),
    recent: notes
      .filter((note) => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return new Date(note.updatedAt) >= dayAgo;
      })
      .length,
  };

  return stats;
}
