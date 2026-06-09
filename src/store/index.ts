/**
 * Store Entry Point
 * Phase 6: State Management
 * 
 * Exports all Zustand stores, selectors, and types
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Progress types
  CompletedTopic,
  SolvedProblem,
  ProgressState,
  ProgressActions,
  ProgressStore,
  
  // Bookmarks types
  Bookmark,
  BookmarksState,
  BookmarksActions,
  BookmarksStore,
  
  // Notes types
  Note,
  NotesState,
  NotesActions,
  NotesStore,
  
  // Preferences types
  ThemeSettings,
  DisplaySettings,
  LearningSettings,
  PreferencesState,
  PreferencesActions,
  PreferencesStore,
  
  // Recently Viewed types
  RecentItem,
  RecentlyViewedState,
  RecentlyViewedActions,
  RecentlyViewedStore,
  
  // Utility types
  StoreCategory,
  ItemType,
  Difficulty,
  ThemeMode,
} from './types';

// ============================================================================
// STORE EXPORTS
// ============================================================================

// Progress Store
export {
  useProgressStore,
  selectTopicsByCategory,
  selectProblemsByDifficulty,
  selectProblemsByTopic,
  selectCategoryProgress,
  selectRecentActivity,
  selectIsStreakActive,
} from './progress-store';

// Bookmarks Store
export {
  useBookmarksStore,
  selectBookmarksByDate,
  selectBookmarksByTag,
  selectAllTags,
  selectBookmarkCountByCategory,
  selectIsBookmarked,
  selectBookmarkByPath,
  selectRecentBookmarks,
} from './bookmarks-store';

// Notes Store
export {
  useNotesStore,
  selectNotesByUpdateDate,
  selectNotesByCreationDate,
  selectPinnedNotes,
  selectUnpinnedNotes,
  selectNotesByTag,
  selectAllTags as selectAllNoteTags,
  selectNoteCountByCategory,
  selectRecentNotes,
} from './notes-store';

// Preferences Store
export {
  usePreferencesStore,
  selectEffectiveTheme,
  selectThemeVariables,
  selectIsDarkMode,
  selectEnabledFeatures,
  selectIsFeatureEnabled,
} from './preferences-store';

// Recently Viewed Store
export {
  useRecentlyViewedStore,
  selectRecentItems,
  selectTodayItems,
  selectWeekItems,
  selectMostViewedByCategory,
  selectTotalTimeSpent,
  selectWasRecentlyViewed,
  selectRecentItemByPath,
  selectItemsGroupedByDate,
} from './recently-viewed-store';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

// Export IndexedDB helper for advanced usage
export * as indexedDB from './indexeddb-helper';
