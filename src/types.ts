/**
 * Study Planning Engine - Core Types
 * Application ID: com.studyplanning.engine
 */

export type StudyMode = 'planned' | 'free'; // طبق برنامه | آزاد

export type SubjectType = 'english' | 'dentistry' | 'ai' | 'general';

export type DentistryCategory =
  | 'ترمیم'
  | 'اندو'
  | 'بایومیمتیک'
  | 'ایمپلنت'
  | 'پروتز و روکش'
  | 'بلیچینگ'
  | 'کشیدن دندان'
  | 'تشخیص و طرح درمان'
  | 'دندانپزشکی کودکان';

export const DENTISTRY_CATEGORIES: DentistryCategory[] = [
  'ترمیم',
  'اندو',
  'بایومیمتیک',
  'ایمپلنت',
  'پروتز و روکش',
  'بلیچینگ',
  'کشیدن دندان',
  'تشخیص و طرح درمان',
  'دندانپزشکی کودکان',
];

export type EnglishBook =
  | 'Interchange'
  | 'Interchange 1'
  | 'Interchange 2'
  | 'Interchange 3';

export const ENGLISH_BOOKS: EnglishBook[] = [
  'Interchange',
  'Interchange 1',
  'Interchange 2',
  'Interchange 3',
];

export interface EnglishLessonRef {
  book: EnglishBook;
  lesson: number; // 1 to 16
}

export type TaskType = 'new_study' | 'review' | 'active_recall' | 'overdue_recovery' | 'free_block' | 'summary_review';

export interface StudyTask {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  subject: SubjectType;
  category?: DentistryCategory | string;
  book?: EnglishBook;
  lesson?: number;
  title: string; // e.g. "Interchange — Lesson 1" or "دندانپزشکی — ترمیم" or "مرور Interchange — Lesson 1"
  taskType: TaskType;
  completed: boolean;
  actualDurationMinutes?: number;
  notes?: string;
  createdDate: string;
  completedDate?: string;
  reviewStage?: number; // 0 (D0), 1 (D+1), 2 (D+3), 3 (D+7), 4 (D+14), 5 (D+30)
  sourceTaskId?: string;
}

export interface SpacedReview {
  id: string;
  sourceTaskId: string;
  sourceTitle: string;
  subject: SubjectType;
  book?: EnglishBook;
  lesson?: number;
  category?: DentistryCategory;
  reviewStage: number; // 0: D0, 1: D+1, 2: D+3, 3: D+7, 4: D+14, 5: D+30
  dueDate: string; // YYYY-MM-DD
  completedDate?: string;
  completed: boolean;
  activeRecallComponents?: ('Vocabulary' | 'Grammar' | 'Conversation' | 'Listening' | 'Pronunciation')[];
}

export interface UnavailablePeriod {
  id: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description?: string;
}

export interface UserSettings {
  studyStartTime: string; // e.g. "08:00"
  lunchStartTime: string; // e.g. "13:00"
  lunchDurationMinutes: number; // default 60
  studyEndTime: string; // e.g. "20:00"
  unavailablePeriods: UnavailablePeriod[];
  defaultStudyMode: StudyMode;
  tuesdayRestPreference: boolean; // default true (Tuesday = rest day)
  isConfigured: boolean;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  persianDate: string; // e.g. "۱۴۰۵/۰۶/۲۶"
  persianDateLong: string; // e.g. "پنجشنبه ۲۶ شهریور ۱۴۰۵"
  mode: StudyMode;
  isRestDay: boolean; // Tuesday rest
  tasks: StudyTask[];
  totalStudyMinutes: number;
  isCompleted: boolean;
  reportedDeviations?: {
    reportedAt: string;
    type: 'all_done' | 'partial' | 'missed' | 'extra';
    notes?: string;
  };
}

export interface WeekPlan {
  weekNumber: number; // 1, 2, 3, 4 ...
  cycleNumber: number; // 1, 2, 3 ...
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  shamsiStartDate: string; // e.g. "۲۶ شهریور ۱۴۰۵"
  shamsiEndDate: string; // e.g. "۱ مهر ۱۴۰۵"
  label: string; // "هفته ۱ — ۲۶ شهریور تا ۱ مهر ۱۴۰۵"
  englishTarget: string; // e.g. "Interchange — Lessons 1–3"
  dentistryTargetHours: number; // e.g. 15-20 hours
  aiTargetHours: number; // e.g. 4.5 hours
  summaryReviewIncluded: boolean;
  days: DayPlan[];
}

export interface MonthCyclePlan {
  cycleNumber: number;
  shamsiMonthName: string; // e.g. "شهریور - مهر ۱۴۰۵"
  startDate: string;
  endDate: string;
  shamsiStartEnd: string;
  weeks: WeekPlan[];
  englishTarget: string; // e.g. "Interchange — Lessons 1–12"
  dentistryHoursTarget: number; // minimum 60 hours
  aiHoursTarget: number; // 12-24 hours
  monthlyReviewScheduled: boolean; // "مرور کلی ماه گذشته"
  simulationTestScheduled: boolean; // "آزمون جامع شبیه‌سازی‌شده"
}

export interface StudyProgress {
  currentChain: number; // Daily streak 🔥
  longestChain: number;
  totalStudyMinutes: number;
  englishLessonsCompleted: number; // out of 64
  currentEnglishLessonIndex: number; // 0 to 64
  dentistryMonthlyMinutes: number; // target >= 3600 (60h)
  aiWeeklyMinutes: number; // target 180 - 360 (3-6h)
  completedReviewsCount: number;
  overdueReviewsCount: number;
  historyLogs: {
    date: string;
    minutesStudied: number;
    tasksCompleted: number;
    hadStudy: boolean;
  }[];
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface GoogleAuthState {
  isSignedIn: boolean;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  errorMessage?: string | null;
}

export interface StudyEngineState {
  settings: UserSettings;
  currentDate: string; // YYYY-MM-DD
  activeMode: StudyMode;
  dailyPlans: Record<string, DayPlan>; // keyed by date YYYY-MM-DD
  weeklyPlans: WeekPlan[];
  monthlyPlans: MonthCyclePlan[];
  reviews: SpacedReview[];
  progress: StudyProgress;
  auth: GoogleAuthState;
  nextDentistryCategoryIndex: number;
  version: number;
}
