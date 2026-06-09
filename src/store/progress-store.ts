/**
 * Progress Store - Tracks learning progress and achievements
 * Uses localStorage for persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ProgressStore,
  ProgressState,
  CompletedTopic,
  SolvedProblem,
} from './types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ProgressState = {
  completedTopics: [],
  solvedProblems: [],
  totalXP: 0,
  streak: 0,
  lastActivityDate: null,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate XP based on difficulty
 */
const calculateXP = (difficulty: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'easy':
      return 10;
    case 'medium':
      return 25;
    case 'hard':
      return 50;
    default:
      return 0;
  }
};

/**
 * Check if two dates are consecutive days
 */
const isConsecutiveDay = (lastDate: string, currentDate: string): boolean => {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const diffTime = Math.abs(current.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

/**
 * Check if date is today
 */
const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      markTopicComplete: (topic) => {
        const completedAt = new Date().toISOString();
        const newTopic: CompletedTopic = {
          ...topic,
          completedAt,
        };

        set((state) => {
          // Check if topic already completed
          const alreadyCompleted = state.completedTopics.some(
            (t) => t.id === topic.id
          );

          if (alreadyCompleted) {
            return state;
          }

          // Add XP for topic completion
          const xpGain = 30; // Base XP for completing a topic
          const newTotalXP = state.totalXP + xpGain;

          return {
            completedTopics: [...state.completedTopics, newTopic],
            totalXP: newTotalXP,
          };
        });

        // Update streak after marking complete
        get().updateStreak();
      },

      markProblemSolved: (problem) => {
        const solvedAt = new Date().toISOString();
        const newProblem: SolvedProblem = {
          ...problem,
          solvedAt,
        };

        set((state) => {
          // Check if problem already solved
          const alreadySolved = state.solvedProblems.some(
            (p) => p.id === problem.id
          );

          if (alreadySolved) {
            return state;
          }

          // Calculate XP based on difficulty
          const xpGain = calculateXP(problem.difficulty);
          const newTotalXP = state.totalXP + xpGain;

          return {
            solvedProblems: [...state.solvedProblems, newProblem],
            totalXP: newTotalXP,
          };
        });

        // Update streak after solving problem
        get().updateStreak();
      },

      updateStreak: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];

          // No previous activity - start streak at 1
          if (!state.lastActivityDate) {
            return {
              streak: 1,
              lastActivityDate: today,
            };
          }

          // Already logged activity today - don't change streak
          if (isToday(state.lastActivityDate)) {
            return state;
          }

          // Consecutive day - increment streak
          if (isConsecutiveDay(state.lastActivityDate, today)) {
            return {
              streak: state.streak + 1,
              lastActivityDate: today,
            };
          }

          // Streak broken - reset to 1
          return {
            streak: 1,
            lastActivityDate: today,
          };
        });
      },

      resetProgress: () => {
        set(initialState);
      },

      getTopicProgress: (category) => {
        const state = get();
        const categoryTopics = state.completedTopics.filter(
          (topic) => topic.category === category
        );
        return categoryTopics.length;
      },

      getTotalProgress: () => {
        const state = get();
        return state.completedTopics.length + state.solvedProblems.length;
      },
    }),
    {
      name: 'progress-storage', // localStorage key
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get completed topics by category
 */
export const selectTopicsByCategory = (
  category: CompletedTopic['category']
) => {
  return (state: ProgressStore) =>
    state.completedTopics.filter((topic) => topic.category === category);
};

/**
 * Get solved problems by difficulty
 */
export const selectProblemsByDifficulty = (
  difficulty: SolvedProblem['difficulty']
) => {
  return (state: ProgressStore) =>
    state.solvedProblems.filter((problem) => problem.difficulty === difficulty);
};

/**
 * Get solved problems for a specific topic
 */
export const selectProblemsByTopic = (topicId: string) => {
  return (state: ProgressStore) =>
    state.solvedProblems.filter((problem) => problem.topicId === topicId);
};

/**
 * Calculate completion percentage for a category
 * Note: This requires knowing total topics per category
 */
export const selectCategoryProgress = (
  category: CompletedTopic['category'],
  totalTopics: number
) => {
  return (state: ProgressStore) => {
    const completed = state.completedTopics.filter(
      (topic) => topic.category === category
    ).length;
    return totalTopics > 0 ? (completed / totalTopics) * 100 : 0;
  };
};

/**
 * Get recent activity (last 7 days)
 */
export const selectRecentActivity = () => {
  return (state: ProgressStore) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTopics = state.completedTopics.filter(
      (topic) => new Date(topic.completedAt) >= sevenDaysAgo
    );

    const recentProblems = state.solvedProblems.filter(
      (problem) => new Date(problem.solvedAt) >= sevenDaysAgo
    );

    return {
      topics: recentTopics,
      problems: recentProblems,
      total: recentTopics.length + recentProblems.length,
    };
  };
};

/**
 * Check if streak is active (activity within last 24 hours)
 */
export const selectIsStreakActive = () => {
  return (state: ProgressStore) => {
    if (!state.lastActivityDate) return false;
    const lastActivity = new Date(state.lastActivityDate);
    const now = new Date();
    const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };
};
