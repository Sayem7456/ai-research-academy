/**
 * Type definitions for all Zustand stores
 * Phase 6: State Management
 */

// ============================================================================
// PROGRESS STORE TYPES
// ============================================================================

export interface CompletedTopic {
  id: string;
  category: 'math' | 'ml' | 'cv' | 'llm' | 'research';
  topicName: string;
  completedAt: string; // ISO date string
  score?: number;
}

export interface SolvedProblem {
  id: string;
  topicId: string;
  problemName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solvedAt: string; // ISO date string
  attempts: number;
  timeSpent?: number; // in seconds
}

export interface ProgressState {
  completedTopics: CompletedTopic[];
  solvedProblems: SolvedProblem[];
  totalXP: number;
  streak: number;
  lastActivityDate: string | null;
}

export interface ProgressActions {
  markTopicComplete: (topic: Omit<CompletedTopic, 'completedAt'>) => void;
  markProblemSolved: (problem: Omit<SolvedProblem, 'solvedAt'>) => void;
  updateStreak: () => void;
  resetProgress: () => void;
  getTopicProgress: (category: CompletedTopic['category']) => number;
  getTotalProgress: () => number;
}

export interface ProgressStore extends ProgressState, ProgressActions {}

// ============================================================================
// BOOKMARKS STORE TYPES
// ============================================================================

export interface Bookmark {
  id: string;
  type: 'topic' | 'problem' | 'paper' | 'visualization';
  title: string;
  path: string; // URL path to the resource
  category: 'math' | 'ml' | 'cv' | 'llm' | 'research';
  notes?: string;
  tags?: string[];
  createdAt: string; // ISO date string
}

export interface BookmarksState {
  bookmarks: Bookmark[];
}

export interface BookmarksActions {
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  getBookmarksByCategory: (category: Bookmark['category']) => Bookmark[];
  getBookmarksByType: (type: Bookmark['type']) => Bookmark[];
  searchBookmarks: (query: string) => Bookmark[];
  clearBookmarks: () => void;
}

export interface BookmarksStore extends BookmarksState, BookmarksActions {}

// ============================================================================
// NOTES STORE TYPES
// ============================================================================

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown content
  topicId?: string;
  category?: 'math' | 'ml' | 'cv' | 'llm' | 'research';
  tags?: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isPinned?: boolean;
}

export interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
}

export interface NotesActions {
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  pinNote: (id: string) => Promise<void>;
  unpinNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Note[];
  getNotesByCategory: (category: Note['category']) => Note[];
  getNotesByTopic: (topicId: string) => Note[];
  clearNotes: () => Promise<void>;
  loadNotes: () => Promise<void>;
}

export interface NotesStore extends NotesState, NotesActions {}

// ============================================================================
// PREFERENCES STORE TYPES
// ============================================================================

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'sans' | 'serif' | 'mono';
}

export interface DisplaySettings {
  showVisualizations: boolean;
  showMathNotation: boolean;
  showCodeExamples: boolean;
  compactMode: boolean;
  sidebarCollapsed: boolean;
}

export interface LearningSettings {
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  showHints: boolean;
  autoSaveProgress: boolean;
  notificationsEnabled: boolean;
}

export interface PreferencesState {
  theme: ThemeSettings;
  display: DisplaySettings;
  learning: LearningSettings;
}

export interface PreferencesActions {
  updateTheme: (theme: Partial<ThemeSettings>) => void;
  updateDisplay: (display: Partial<DisplaySettings>) => void;
  updateLearning: (learning: Partial<LearningSettings>) => void;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (json: string) => void;
}

export interface PreferencesStore extends PreferencesState, PreferencesActions {}

// ============================================================================
// RECENTLY VIEWED STORE TYPES
// ============================================================================

export interface RecentItem {
  id: string;
  type: 'topic' | 'problem' | 'paper' | 'visualization';
  title: string;
  path: string; // URL path
  category: 'math' | 'ml' | 'cv' | 'llm' | 'research';
  viewedAt: string; // ISO date string
  duration?: number; // Time spent in seconds
  thumbnail?: string; // Optional thumbnail URL
}

export interface RecentlyViewedState {
  items: RecentItem[];
  maxItems: number;
}

export interface RecentlyViewedActions {
  addRecentItem: (item: Omit<RecentItem, 'id' | 'viewedAt'>) => void;
  removeRecentItem: (id: string) => void;
  clearRecentItems: () => void;
  getRecentByCategory: (category: RecentItem['category']) => RecentItem[];
  getRecentByType: (type: RecentItem['type']) => RecentItem[];
  updateItemDuration: (id: string, duration: number) => void;
}

export interface RecentlyViewedStore extends RecentlyViewedState, RecentlyViewedActions {}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type StoreCategory = 'math' | 'ml' | 'cv' | 'llm' | 'research';
export type ItemType = 'topic' | 'problem' | 'paper' | 'visualization';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemeMode = 'light' | 'dark' | 'system';
