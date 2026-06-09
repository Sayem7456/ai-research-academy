/**
 * Preferences Store - Manages user preferences and settings
 * Uses localStorage for persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PreferencesStore,
  PreferencesState,
  ThemeSettings,
  DisplaySettings,
  LearningSettings,
} from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const defaultTheme: ThemeSettings = {
  mode: 'system',
  accentColor: '#3b82f6', // blue-500
  fontSize: 'medium',
  fontFamily: 'sans',
};

const defaultDisplay: DisplaySettings = {
  showVisualizations: true,
  showMathNotation: true,
  showCodeExamples: true,
  compactMode: false,
  sidebarCollapsed: false,
};

const defaultLearning: LearningSettings = {
  difficultyLevel: 'intermediate',
  showHints: true,
  autoSaveProgress: true,
  notificationsEnabled: true,
};

const initialState: PreferencesState = {
  theme: defaultTheme,
  display: defaultDisplay,
  learning: defaultLearning,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      updateTheme: (themeUpdates) => {
        set((state) => ({
          theme: { ...state.theme, ...themeUpdates },
        }));
      },

      updateDisplay: (displayUpdates) => {
        set((state) => ({
          display: { ...state.display, ...displayUpdates },
        }));
      },

      updateLearning: (learningUpdates) => {
        set((state) => ({
          learning: { ...state.learning, ...learningUpdates },
        }));
      },

      resetPreferences: () => {
        set(initialState);
      },

      exportPreferences: () => {
        const state = get();
        const exportData = {
          theme: state.theme,
          display: state.display,
          learning: state.learning,
          exportedAt: new Date().toISOString(),
          version: 1,
        };
        return JSON.stringify(exportData, null, 2);
      },

      importPreferences: (json) => {
        try {
          const importData = JSON.parse(json);

          // Validate imported data structure
          if (!importData.theme || !importData.display || !importData.learning) {
            throw new Error('Invalid preferences format');
          }

          set({
            theme: { ...defaultTheme, ...importData.theme },
            display: { ...defaultDisplay, ...importData.display },
            learning: { ...defaultLearning, ...importData.learning },
          });
        } catch (error) {
          console.error('Failed to import preferences:', error);
          throw error;
        }
      },
    }),
    {
      name: 'preferences-storage', // localStorage key
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get computed theme mode based on system preference
 */
export const selectEffectiveTheme = () => {
  return (state: PreferencesStore): 'light' | 'dark' => {
    if (state.theme.mode === 'system') {
      // Check system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light'; // Default fallback
    }
    return state.theme.mode;
  };
};

/**
 * Get CSS variables for current theme
 */
export const selectThemeVariables = () => {
  return (state: PreferencesStore) => {
    const effectiveMode = selectEffectiveTheme()(state);
    return {
      '--accent-color': state.theme.accentColor,
      '--font-size': state.theme.fontSize,
      '--font-family': state.theme.fontFamily,
      '--theme-mode': effectiveMode,
    };
  };
};

/**
 * Check if dark mode is active
 */
export const selectIsDarkMode = () => {
  return (state: PreferencesStore) => {
    return selectEffectiveTheme()(state) === 'dark';
  };
};

/**
 * Get all enabled features
 */
export const selectEnabledFeatures = () => {
  return (state: PreferencesStore) => {
    const features: string[] = [];
    if (state.display.showVisualizations) features.push('visualizations');
    if (state.display.showMathNotation) features.push('math');
    if (state.display.showCodeExamples) features.push('code');
    if (state.learning.showHints) features.push('hints');
    if (state.learning.notificationsEnabled) features.push('notifications');
    return features;
  };
};

/**
 * Check if a specific feature is enabled
 */
export const selectIsFeatureEnabled = (feature: string) => {
  return (state: PreferencesStore) => {
    switch (feature) {
      case 'visualizations':
        return state.display.showVisualizations;
      case 'math':
        return state.display.showMathNotation;
      case 'code':
        return state.display.showCodeExamples;
      case 'hints':
        return state.learning.showHints;
      case 'notifications':
        return state.learning.notificationsEnabled;
      case 'autoSave':
        return state.learning.autoSaveProgress;
      default:
        return false;
    }
  };
};
