/**
 * Study Planning Engine
 * Main Application Component
 * Android-like experience with RTL Persian Calendar support, Spaced Repetition (SRS),
 * continuous dynamic replanning, and Google Drive backup structure.
 */

import React, { useState, useEffect } from 'react';
import {
  GoogleAuthState,
  StudyEngineState,
  StudyMode,
  UserSettings,
} from './types';
import {
  createInitialState,
  downloadDriveBundleFiles,
  loadStateFromLocal,
  resetAllData,
  saveStateToLocal,
} from './storage/studyStorage';
import {
  buildMonthlyPlan,
  buildWeeklyOverview,
  generateDayPlan,
  recalculateChain,
} from './engine/planningEngine';
import { AndroidFrame } from './components/AndroidFrame';
import { BottomNavBar, TabType } from './components/BottomNavBar';
import { TodayScreen } from './components/TodayScreen';
import { WeekScreen } from './components/WeekScreen';
import { MonthScreen } from './components/MonthScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { InitialSetupModal } from './components/InitialSetupModal';
import { DeviationReportModal } from './components/DeviationReportModal';
import { Cloud } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<StudyEngineState>(() => {
    const loaded = loadStateFromLocal();
    if (loaded) return loaded;
    const fresh = createInitialState('2026-09-17');
    fresh.settings.isConfigured = false; // Show initial configuration modal on first launch (Rule 34)
    return fresh;
  });

  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => state.currentDate);
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveStateToLocal(state);
  }, [state]);

  // Handle first setup completion (Rule 34)
  const handleCompleteSetup = ({
    startDate,
    settings,
  }: {
    startDate: string;
    settings: UserSettings;
  }) => {
    // Generate fresh baseline plan from initial parameters
    const freshState = createInitialState(startDate, settings);
    setState(freshState);
    setSelectedDate(startDate);
  };

  // Toggle completion of a specific task in today's plan
  const handleToggleTaskCompletion = (taskId: string) => {
    const plan = state.dailyPlans[selectedDate];
    if (!plan) return;

    const updatedTasks = plan.tasks.map((t) => {
      if (t.id === taskId) {
        const isNowCompleted = !t.completed;
        return {
          ...t,
          completed: isNowCompleted,
          completedDate: isNowCompleted ? selectedDate : undefined,
        };
      }
      return t;
    });

    const updatedPlan = {
      ...plan,
      tasks: updatedTasks,
    };

    // Recalculate progress metrics and chain
    const updatedDailyPlans = {
      ...state.dailyPlans,
      [selectedDate]: updatedPlan,
    };

    const chainRes = recalculateChain(
      selectedDate,
      updatedDailyPlans,
      state.progress.historyLogs,
      state.progress
    );

    // Calculate english lessons completed
    let englishCompleted = 0;
    for (const d in updatedDailyPlans) {
      for (const t of updatedDailyPlans[d].tasks) {
        if (t.completed && t.subject === 'english' && t.taskType === 'new_study') {
          englishCompleted++;
        }
      }
    }

    // Calculate total study minutes completed
    let totalMinutes = 0;
    for (const d in updatedDailyPlans) {
      for (const t of updatedDailyPlans[d].tasks) {
        if (t.completed) {
          totalMinutes += t.durationMinutes;
        }
      }
    }

    const updatedProgress = {
      ...state.progress,
      currentChain: chainRes.currentChain,
      longestChain: chainRes.longestChain,
      totalStudyMinutes: totalMinutes,
      englishLessonsCompleted: englishCompleted,
    };

    setState({
      ...state,
      dailyPlans: updatedDailyPlans,
      progress: updatedProgress,
    });
  };

  // Switch between Planned Study and Free Study modes (Rule 4)
  const handleChangeStudyMode = (mode: StudyMode) => {
    const newPlan = generateDayPlan(selectedDate, state, mode);

    setState({
      ...state,
      activeMode: mode,
      dailyPlans: {
        ...state.dailyPlans,
        [selectedDate]: newPlan,
      },
    });
  };

  // Update daily schedule constraints (start, lunch, end, unavailable)
  const handleUpdateDailyConstraints = (constraints: {
    studyStartTime: string;
    lunchStartTime: string;
    lunchDurationMinutes: number;
    studyEndTime: string;
    unavailableStart?: string;
    unavailableEnd?: string;
  }) => {
    const updatedSettings: UserSettings = {
      ...state.settings,
      studyStartTime: constraints.studyStartTime,
      lunchStartTime: constraints.lunchStartTime,
      lunchDurationMinutes: constraints.lunchDurationMinutes,
      studyEndTime: constraints.studyEndTime,
      unavailablePeriods:
        constraints.unavailableStart && constraints.unavailableEnd
          ? [{ id: 'daily-unavail', startTime: constraints.unavailableStart, endTime: constraints.unavailableEnd }]
          : [],
    };

    const tempState: StudyEngineState = {
      ...state,
      settings: updatedSettings,
    };

    const newPlan = generateDayPlan(
      selectedDate,
      tempState,
      state.dailyPlans[selectedDate]?.mode || state.activeMode
    );

    setState({
      ...tempState,
      dailyPlans: {
        ...state.dailyPlans,
        [selectedDate]: newPlan,
      },
    });
  };

  // Manual Deviation Report Submission (Rule 29)
  const handleSubmitDeviationReport = (report: {
    completedTaskIds: string[];
    incompleteTaskIds: string[];
    extraMinutesStudied: number;
    notes: string;
  }) => {
    const currentPlan = state.dailyPlans[selectedDate];
    if (!currentPlan) return;

    // Mark completed vs incomplete tasks
    const updatedTasks = currentPlan.tasks.map((t) => ({
      ...t,
      completed: report.completedTaskIds.includes(t.id),
      completedDate: report.completedTaskIds.includes(t.id) ? selectedDate : undefined,
    }));

    const updatedCurrentPlan = {
      ...currentPlan,
      tasks: updatedTasks,
    };

    const updatedDailyPlans = {
      ...state.dailyPlans,
      [selectedDate]: updatedCurrentPlan,
    };

    const chainRes = recalculateChain(
      selectedDate,
      updatedDailyPlans,
      state.progress.historyLogs,
      state.progress
    );

    setState({
      ...state,
      dailyPlans: updatedDailyPlans,
      progress: {
        ...state.progress,
        currentChain: chainRes.currentChain,
        longestChain: chainRes.longestChain,
        totalStudyMinutes: state.progress.totalStudyMinutes + report.extraMinutesStudied,
      },
    });
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setState({
      ...state,
      settings: newSettings,
    });
  };

  // Update Google Auth
  const handleUpdateAuthState = (newAuth: GoogleAuthState) => {
    setState({
      ...state,
      auth: newAuth,
    });
  };

  // Reset Data to Factory State (Rule 34: chain=0, completed=0, reviews=0)
  const handleResetData = () => {
    const freshState = resetAllData('2026-09-17');
    setState(freshState);
    setCurrentTab('today');
  };

  // Screen Title for Top Bar
  const screenTitles: Record<TabType, string> = {
    today: 'امروز — برنامه روزانه',
    week: 'هفته — نمای متوازن',
    month: 'ماه — چرخه ۴ هفته‌ای',
    progress: 'پیشرفت و استمرار',
    settings: 'تنظیمات و همگام‌سازی',
  };

  // Sync Badge for Android Frame Header
  const syncBadge = (
    <div className="flex items-center gap-1 text-[11px] text-stone-400">
      {state.auth.isSignedIn ? (
        <span className="flex items-center gap-1 text-teal-400 font-medium">
          <Cloud className="w-3.5 h-3.5" />
          <span>Drive</span>
        </span>
      ) : (
        <span className="text-stone-500">ذخیره محلی</span>
      )}
    </div>
  );

  return (
    <AndroidFrame
      currentScreenTitle={screenTitles[currentTab]}
      syncBadge={syncBadge}
    >
      {/* 1. Today Screen */}
      {currentTab === 'today' && (
        <TodayScreen
          state={state}
          currentDate={selectedDate}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          onChangeStudyMode={handleChangeStudyMode}
          onUpdateDailyConstraints={handleUpdateDailyConstraints}
          onOpenDeviationReport={() => setIsDeviationModalOpen(true)}
          onChangeDate={(newDate) => setSelectedDate(newDate)}
        />
      )}

      {/* 2. Week Screen */}
      {currentTab === 'week' && (
        <WeekScreen
          state={state}
          onSelectDate={(dateStr) => {
            setSelectedDate(dateStr);
            setCurrentTab('today');
          }}
        />
      )}

      {/* 3. Month Screen */}
      {currentTab === 'month' && <MonthScreen state={state} />}

      {/* 4. Progress Screen */}
      {currentTab === 'progress' && <ProgressScreen state={state} />}

      {/* 5. Settings Screen */}
      {currentTab === 'settings' && (
        <SettingsScreen
          state={state}
          onUpdateSettings={handleUpdateSettings}
          onUpdateAuthState={handleUpdateAuthState}
          onResetData={handleResetData}
          onImportState={(imported) => setState(imported)}
        />
      )}

      {/* Bottom Navigation (5 Tabs) */}
      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        streakCount={state.progress.currentChain}
      />

      {/* Initial Configuration Wizard Modal (Rule 34) */}
      <InitialSetupModal
        isOpen={!state.settings.isConfigured}
        initialDate={state.currentDate}
        defaultSettings={state.settings}
        onCompleteSetup={handleCompleteSetup}
      />

      {/* Manual Deviation Report Modal (Rule 29) */}
      <DeviationReportModal
        state={state}
        dateStr={selectedDate}
        isOpen={isDeviationModalOpen}
        onClose={() => setIsDeviationModalOpen(false)}
        onSubmitReport={handleSubmitDeviationReport}
      />
    </AndroidFrame>
  );
}
