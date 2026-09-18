/**
 * Study Planning Engine - Storage & Sync Module
 * Handles local persistence (localStorage), Google Sign-In state,
 * Google Drive file export/import, and offline-first synchronization.
 */

import {
  DayPlan,
  GoogleAuthState,
  MonthCyclePlan,
  StudyEngineState,
  StudyProgress,
  UserSettings,
  WeekPlan,
} from '../types';
import {
  buildMonthlyPlan,
  buildWeeklyOverview,
  generateDayPlan,
} from '../engine/planningEngine';

const STORAGE_KEY_STATE = 'study_planning_engine_state_v1';
const STORAGE_KEY_SETTINGS = 'study_planning_engine_settings';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  studyStartTime: '08:00',
  lunchStartTime: '13:00',
  lunchDurationMinutes: 60,
  studyEndTime: '20:00',
  unavailablePeriods: [],
  defaultStudyMode: 'planned',
  tuesdayRestPreference: true, // Tuesday = rest day
  isConfigured: false,
};

export const INITIAL_PROGRESS: StudyProgress = {
  currentChain: 0,
  longestChain: 0,
  totalStudyMinutes: 0,
  englishLessonsCompleted: 0,
  currentEnglishLessonIndex: 0,
  dentistryMonthlyMinutes: 0,
  aiWeeklyMinutes: 0,
  completedReviewsCount: 0,
  overdueReviewsCount: 0,
  historyLogs: [],
};

export const INITIAL_AUTH_STATE: GoogleAuthState = {
  isSignedIn: false,
  email: null,
  displayName: null,
  photoUrl: null,
  lastSyncedAt: null,
  syncStatus: 'offline',
  errorMessage: null,
};

/**
 * Initializes fresh StudyEngineState
 */
export function createInitialState(
  initialDate: string = '2026-09-17',
  customSettings?: Partial<UserSettings>
): StudyEngineState {
  const settings: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    ...customSettings,
    isConfigured: true,
  };

  const state: StudyEngineState = {
    settings,
    currentDate: initialDate,
    activeMode: settings.defaultStudyMode,
    dailyPlans: {},
    weeklyPlans: [],
    monthlyPlans: [],
    reviews: [],
    progress: { ...INITIAL_PROGRESS },
    auth: { ...INITIAL_AUTH_STATE, syncStatus: 'offline' },
    nextDentistryCategoryIndex: 0,
    version: 1,
  };

  // Generate today's initial plan
  const todayPlan = generateDayPlan(initialDate, state, settings.defaultStudyMode);
  state.dailyPlans[initialDate] = todayPlan;

  // Generate weekly overview
  const week1 = buildWeeklyOverview(initialDate, 1, 1, state);
  state.weeklyPlans = [week1];

  // Generate monthly cycle plan
  const monthCycle1 = buildMonthlyPlan(initialDate, 1, state);
  state.monthlyPlans = [monthCycle1];

  return state;
}

/**
 * Load state from localStorage
 */
export function loadStateFromLocal(): StudyEngineState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.settings && parsed.dailyPlans) {
      return parsed as StudyEngineState;
    }
  } catch (err) {
    console.error('Failed to load state from localStorage', err);
  }
  return null;
}

/**
 * Save state to localStorage
 */
export function saveStateToLocal(state: StudyEngineState): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

/**
 * Google Drive Export Bundle Structure (Rule 20)
 * Study Planning Engine/data/
 * - study_state.json
 * - daily_plans.json
 * - weekly_plans.json
 * - monthly_plans.json
 */
export interface DriveDataBundle {
  study_state: {
    settings: UserSettings;
    currentDate: string;
    progress: StudyProgress;
    reviews: any[];
    nextDentistryCategoryIndex: number;
    version: number;
  };
  daily_plans: Record<string, DayPlan>;
  weekly_plans: WeekPlan[];
  monthly_plans: MonthCyclePlan[];
}

export function exportDataBundle(state: StudyEngineState): DriveDataBundle {
  return {
    study_state: {
      settings: state.settings,
      currentDate: state.currentDate,
      progress: state.progress,
      reviews: state.reviews,
      nextDentistryCategoryIndex: state.nextDentistryCategoryIndex,
      version: state.version,
    },
    daily_plans: state.dailyPlans,
    weekly_plans: state.weeklyPlans,
    monthly_plans: state.monthlyPlans,
  };
}

export function downloadJsonFile(fileName: string, data: any): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all 4 files for Google Drive (Rule 20)
 */
export function downloadDriveBundleFiles(state: StudyEngineState): void {
  const bundle = exportDataBundle(state);
  downloadJsonFile('study_state.json', bundle.study_state);
  downloadJsonFile('daily_plans.json', bundle.daily_plans);
  downloadJsonFile('weekly_plans.json', bundle.weekly_plans);
  downloadJsonFile('monthly_plans.json', bundle.monthly_plans);
}

/**
 * Restore from exported JSON
 */
export function importDataBundle(
  importedBundle: Partial<DriveDataBundle>,
  currentState: StudyEngineState
): StudyEngineState {
  const newState: StudyEngineState = {
    ...currentState,
    settings: importedBundle.study_state?.settings || currentState.settings,
    progress: importedBundle.study_state?.progress || currentState.progress,
    reviews: importedBundle.study_state?.reviews || currentState.reviews,
    nextDentistryCategoryIndex:
      importedBundle.study_state?.nextDentistryCategoryIndex ?? currentState.nextDentistryCategoryIndex,
    dailyPlans: importedBundle.daily_plans || currentState.dailyPlans,
    weeklyPlans: importedBundle.weekly_plans || currentState.weeklyPlans,
    monthlyPlans: importedBundle.monthly_plans || currentState.monthlyPlans,
    auth: {
      ...currentState.auth,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
    },
  };
  saveStateToLocal(newState);
  return newState;
}

/**
 * Reset all data
 */
export function resetAllData(todayDateStr: string): StudyEngineState {
  localStorage.removeItem(STORAGE_KEY_STATE);
  localStorage.removeItem(STORAGE_KEY_SETTINGS);
  const fresh = createInitialState(todayDateStr);
  fresh.settings.isConfigured = false;
  return fresh;
}
