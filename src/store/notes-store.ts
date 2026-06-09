/**
 * Notes Store - Manages user notes with IndexedDB persistence
 * Uses IndexedDB for larger storage capacity
 */

import { create } from 'zustand';
import type { NotesStore, NotesState, Note } from './types';
import * as db from './indexeddb-helper';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: NotesState = {
  notes: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for note
 */
const generateId = (): string => {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Search notes by query string
 */
const searchInNote = (note: Note, query: string): boolean => {
  const searchQuery = query.toLowerCase();
  return (
    note.title.toLowerCase().includes(searchQuery) ||
    note.content.toLowerCase().includes(searchQuery) ||
    note.tags?.some((tag) => tag.toLowerCase().includes(searchQuery)) ||
    false
  );
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useNotesStore = create<NotesStore>()((set, get) => ({
  // State
  ...initialState,

  // Actions
  loadNotes: async () => {
    set({ isLoading: true, error: null });

    try {
      const notes = await db.getAllNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load notes',
      });
    }
  },

  createNote: async (noteData) => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const newNote: Note = {
        ...noteData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      await db.addNote(newNote);

      set((state) => ({
        notes: [...state.notes, newNote],
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      });
    }
  },

  updateNote: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const existingNote = get().notes.find((note) => note.id === id);
      if (!existingNote) {
        throw new Error('Note not found');
      }

      const updatedNote: Note = {
        ...existingNote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.updateNote(updatedNote);

      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? updatedNote : note
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update note',
      });
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await db.deleteNote(id);

      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete note',
      });
    }
  },

  pinNote: async (id) => {
    await get().updateNote(id, { isPinned: true });
  },

  unpinNote: async (id) => {
    await get().updateNote(id, { isPinned: false });
  },

  searchNotes: (query) => {
    const state = get();
    if (!query.trim()) {
      return state.notes;
    }
    return state.notes.filter((note) => searchInNote(note, query));
  },

  getNotesByCategory: (category) => {
    const state = get();
    if (!category) return [];
    return state.notes.filter((note) => note.category === category);
  },

  getNotesByTopic: (topicId) => {
    const state = get();
    return state.notes.filter((note) => note.topicId === topicId);
  },

  clearNotes: async () => {
    set({ isLoading: true, error: null });

    try {
      await db.clearAllNotes();
      set({ notes: [], isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear notes',
      });
    }
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get notes sorted by update date (newest first)
 */
export const selectNotesByUpdateDate = () => {
  return (state: NotesStore) =>
    [...state.notes].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
};

/**
 * Get notes sorted by creation date (newest first)
 */
export const selectNotesByCreationDate = () => {
  return (state: NotesStore) =>
    [...state.notes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

/**
 * Get pinned notes
 */
export const selectPinnedNotes = () => {
  return (state: NotesStore) => state.notes.filter((note) => note.isPinned);
};

/**
 * Get unpinned notes
 */
export const selectUnpinnedNotes = () => {
  return (state: NotesStore) => state.notes.filter((note) => !note.isPinned);
};

/**
 * Get notes by tag
 */
export const selectNotesByTag = (tag: string) => {
  return (state: NotesStore) =>
    state.notes.filter((note) => note.tags?.includes(tag));
};

/**
 * Get all unique tags from notes
 */
export const selectAllTags = () => {
  return (state: NotesStore) => {
    const allTags = state.notes.reduce<string[]>((tags, note) => {
      if (note.tags) {
        return [...tags, ...note.tags];
      }
      return tags;
    }, []);
    return Array.from(new Set(allTags)).sort();
  };
};

/**
 * Get note count by category
 */
export const selectNoteCountByCategory = () => {
  return (state: NotesStore) => {
    return state.notes.reduce<Record<string, number>>((counts, note) => {
      if (note.category) {
        counts[note.category] = (counts[note.category] || 0) + 1;
      }
      return counts;
    }, {});
  };
};

/**
 * Get recent notes (last N items)
 */
export const selectRecentNotes = (count: number = 5) => {
  return (state: NotesStore) =>
    [...state.notes]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, count);
};
