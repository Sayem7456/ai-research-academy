/**
 * Recently Viewed Store - Tracks recently viewed items
 * Uses localStorage for persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RecentlyViewedStore,
  RecentlyViewedState,
  RecentItem,
} from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: RecentlyViewedState = {
  items: [],
  maxItems: 50, // Maximum number of recent items to keep
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for recent item
 */
const generateId = (): string => {
  return `recent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Remove duplicates and keep only the most recent
 */
const deduplicateItems = (items: RecentItem[]): RecentItem[] => {
  const seen = new Map<string, RecentItem>();

  // Process in reverse to keep most recent
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (!seen.has(item.path)) {
      seen.set(item.path, item);
    }
  }

  // Convert back to array and sort by viewedAt (newest first)
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      addRecentItem: (itemData) => {
        const newItem: RecentItem = {
          ...itemData,
          id: generateId(),
          viewedAt: new Date().toISOString(),
        };

        set((state) => {
          // Add new item to the beginning
          let updatedItems = [newItem, ...state.items];

          // Remove duplicates (keep most recent)
          updatedItems = deduplicateItems(updatedItems);

          // Enforce max items limit
          if (updatedItems.length > state.maxItems) {
            updatedItems = updatedItems.slice(0, state.maxItems);
          }

          return { items: updatedItems };
        });
      },

      removeRecentItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearRecentItems: () => {
        set({ items: [] });
      },

      getRecentByCategory: (category) => {
        const state = get();
        return state.items.filter((item) => item.category === category);
      },

      getRecentByType: (type) => {
        const state = get();
        return state.items.filter((item) => item.type === type);
      },

      updateItemDuration: (id, duration) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, duration } : item
          ),
        }));
      },
    }),
    {
      name: 'recently-viewed-storage', // localStorage key
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get recent items (already sorted by viewedAt)
 */
export const selectRecentItems = (limit?: number) => {
  return (state: RecentlyViewedStore) => {
    const items = state.items;
    return limit ? items.slice(0, limit) : items;
  };
};

/**
 * Get items viewed today
 */
export const selectTodayItems = () => {
  return (state: RecentlyViewedStore) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return state.items.filter((item) => {
      const viewedDate = new Date(item.viewedAt);
      return viewedDate >= today;
    });
  };
};

/**
 * Get items viewed this week
 */
export const selectWeekItems = () => {
  return (state: RecentlyViewedStore) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return state.items.filter((item) => {
      const viewedDate = new Date(item.viewedAt);
      return viewedDate >= weekAgo;
    });
  };
};

/**
 * Get most viewed items by category
 */
export const selectMostViewedByCategory = () => {
  return (state: RecentlyViewedStore) => {
    const categoryCounts = state.items.reduce<Record<string, number>>(
      (counts, item) => {
        counts[item.category] = (counts[item.category] || 0) + 1;
        return counts;
      },
      {}
    );

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));
  };
};

/**
 * Get total time spent (sum of all durations)
 */
export const selectTotalTimeSpent = () => {
  return (state: RecentlyViewedStore) => {
    return state.items.reduce((total, item) => {
      return total + (item.duration || 0);
    }, 0);
  };
};

/**
 * Check if a path was recently viewed
 */
export const selectWasRecentlyViewed = (path: string) => {
  return (state: RecentlyViewedStore) =>
    state.items.some((item) => item.path === path);
};

/**
 * Get recent item by path
 */
export const selectRecentItemByPath = (path: string) => {
  return (state: RecentlyViewedStore) =>
    state.items.find((item) => item.path === path);
};

/**
 * Get items grouped by date
 */
export const selectItemsGroupedByDate = () => {
  return (state: RecentlyViewedStore) => {
    const groups: Record<string, RecentItem[]> = {};

    state.items.forEach((item) => {
      const date = new Date(item.viewedAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return groups;
  };
};
