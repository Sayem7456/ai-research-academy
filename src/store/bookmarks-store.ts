/**
 * Bookmarks Store - Manages user bookmarks
 * Uses localStorage for persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookmarksStore, BookmarksState, Bookmark } from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: BookmarksState = {
  bookmarks: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for bookmark
 */
const generateId = (): string => {
  return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Search bookmarks by query string
 */
const searchInBookmark = (bookmark: Bookmark, query: string): boolean => {
  const searchQuery = query.toLowerCase();
  return (
    bookmark.title.toLowerCase().includes(searchQuery) ||
    bookmark.notes?.toLowerCase().includes(searchQuery) ||
    bookmark.tags?.some((tag) => tag.toLowerCase().includes(searchQuery)) ||
    false
  );
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useBookmarksStore = create<BookmarksStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      addBookmark: (bookmarkData) => {
        const newBookmark: Bookmark = {
          ...bookmarkData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          // Check if bookmark with same path already exists
          const exists = state.bookmarks.some(
            (b) => b.path === bookmarkData.path
          );

          if (exists) {
            console.warn('Bookmark for this path already exists');
            return state;
          }

          return {
            bookmarks: [...state.bookmarks, newBookmark],
          };
        });
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== id),
        }));
      },

      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === id ? { ...bookmark, ...updates } : bookmark
          ),
        }));
      },

      getBookmarksByCategory: (category) => {
        const state = get();
        return state.bookmarks.filter(
          (bookmark) => bookmark.category === category
        );
      },

      getBookmarksByType: (type) => {
        const state = get();
        return state.bookmarks.filter((bookmark) => bookmark.type === type);
      },

      searchBookmarks: (query) => {
        const state = get();
        if (!query.trim()) {
          return state.bookmarks;
        }
        return state.bookmarks.filter((bookmark) =>
          searchInBookmark(bookmark, query)
        );
      },

      clearBookmarks: () => {
        set(initialState);
      },
    }),
    {
      name: 'bookmarks-storage', // localStorage key
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get bookmarks sorted by creation date (newest first)
 */
export const selectBookmarksByDate = () => {
  return (state: BookmarksStore) =>
    [...state.bookmarks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

/**
 * Get bookmarks by tag
 */
export const selectBookmarksByTag = (tag: string) => {
  return (state: BookmarksStore) =>
    state.bookmarks.filter((bookmark) =>
      bookmark.tags?.includes(tag)
    );
};

/**
 * Get all unique tags from bookmarks
 */
export const selectAllTags = () => {
  return (state: BookmarksStore) => {
    const allTags = state.bookmarks.reduce<string[]>((tags, bookmark) => {
      if (bookmark.tags) {
        return [...tags, ...bookmark.tags];
      }
      return tags;
    }, []);
    return Array.from(new Set(allTags)).sort();
  };
};

/**
 * Get bookmark count by category
 */
export const selectBookmarkCountByCategory = () => {
  return (state: BookmarksStore) => {
    return state.bookmarks.reduce<Record<string, number>>((counts, bookmark) => {
      counts[bookmark.category] = (counts[bookmark.category] || 0) + 1;
      return counts;
    }, {});
  };
};

/**
 * Check if a path is bookmarked
 */
export const selectIsBookmarked = (path: string) => {
  return (state: BookmarksStore) =>
    state.bookmarks.some((bookmark) => bookmark.path === path);
};

/**
 * Get bookmark by path
 */
export const selectBookmarkByPath = (path: string) => {
  return (state: BookmarksStore) =>
    state.bookmarks.find((bookmark) => bookmark.path === path);
};

/**
 * Get recent bookmarks (last N items)
 */
export const selectRecentBookmarks = (count: number = 5) => {
  return (state: BookmarksStore) =>
    [...state.bookmarks]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, count);
};
