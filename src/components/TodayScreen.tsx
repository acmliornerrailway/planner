/**
 * Today Screen (امروز)
 * Displays Persian date, daily streak flame/gifts, study mode toggle,
 * study blocks with completion checkboxes (strike-through), and bottom total study time.
 */

import React, { useState } from 'react';
import {
  DayPlan,
  StudyEngineState,
  StudyMode,
  StudyTask,
} from '../types';
import {
  formatMinutesToPersianHours,
  toPersianDigits,
} from '../utils/persianCalendar';
import {
  getChainDisplay,
} from '../engine/planningEngine';
import {
  Clock,
  Coffee,
  CheckCircle2,
  Circle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  BookOpen,
  CalendarCheck,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';

interface TodayScreenProps {
  state: StudyEngineState;
  currentDate: string;
  onToggleTaskCompletion: (taskId: string) => void;
  onChangeStudyMode: (mode: StudyMode) => void;
  onUpdateDailyConstraints: (constraints: {
    studyStartTime: string;
    lunchStartTime: string;
    lunchDurationMinutes: number;
    studyEndTime: string;
    unavailableStart?: string;
    unavailableEnd?: string;
  }) => void;
  onOpenDeviationReport: () => void;
  onChangeDate?: (newDateStr: string) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  state,
  currentDate,
  onToggleTaskCompletion,
  onChangeStudyMode,
  onUpdateDailyConstraints,
  onOpenDeviationReport,
  onChangeDate,
}) => {
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);

  // Form states for schedule configuration
  const [startTime, setStartTime] = useState(state.settings.studyStartTime);
  const [lunchTime, setLunchTime] = useState(state.settings.lunchStartTime);
  const [lunchDuration, setLunchDuration] = useState(state.settings.lunchDurationMinutes);
  const [endTime, setEndTime] = useState(state.settings.studyEndTime);
  const [unavailStart, setUnavailStart] = useState(
    state.settings.unavailablePeriods[0]?.startTime || ''
  );
  const [unavailEnd, setUnavailEnd] = useState(
    state.settings.unavailablePeriods[0]?.endTime || ''
  );

  const plan: DayPlan | undefined = state.dailyPlans[currentDate];

  const handleSaveConstraints = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDailyConstraints({
      studyStartTime: startTime,
      lunchStartTime: lunchTime,
      lunchDurationMinutes: Number(lunchDuration) || 60,
      studyEndTime: endTime,
      unavailableStart: unavailStart || undefined,
      unavailableEnd: unavailEnd || undefined,
    });
    setShowScheduleConfig(false);
  };

  const tasks = plan?.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Calculate actual total study time of today's blocks
  const totalStudyMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const completedStudyMinutes = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + t.durationMinutes, 0);

  const isRestDay = plan?.isRestDay ?? false;
  const currentMode = plan?.mode || state.activeMode || 'planned';

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
      {/* Top Card: Persian Date, Streak & Progress Chain */}
      <section
        aria-label="خلاصه روز و زنجیره پیشرفت"
        className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-teal-700 tracking-wide mb-0.5">
              برنامه روزانه موتور مطالعه
            </div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">
              {plan?.persianDateLong || 'امروز'}
            </h1>
            <div className="text-xs text-stone-500 mt-0.5">
              تاریخ خورشیدی: {plan?.persianDate || ''}
            </div>
          </div>

          {/* Progress Chain Flame Badge */}
          <div className="flex flex-col items-end">
            <div className="text-xs text-stone-500 mb-0.5">زنجیره مطالعه (Streak)</div>
            <div
              id="streak-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm shadow-xs"
              title="زنجیره استمرار مطالعه روزانه"
            >
              <span>{getChainDisplay(state.progress.currentChain)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Summary */}
        {!isRestDay && tasks.length > 0 && (
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5">
              <span>
                پیشرفت امروز: {toPersianDigits(completedCount)} از {toPersianDigits(tasks.length)} وظیفه تکمیل شده
              </span>
              <span className="font-bold text-teal-700">{toPersianDigits(progressPercent)}٪</span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Study Mode Selector & Schedule Controls */}
      <div className="bg-stone-100/90 rounded-2xl p-1.5 flex items-center justify-between text-xs border border-stone-200/80">
        <div className="flex items-center gap-1 p-0.5 bg-stone-200/60 rounded-xl">
          <button
            id="mode-planned-btn"
            onClick={() => onChangeStudyMode('planned')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentMode === 'planned'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            طبق برنامه (Planned)
          </button>
          <button
            id="mode-free-btn"
            onClick={() => onChangeStudyMode('free')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentMode === 'free'
                ? 'bg-white text-stone-900 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            آزاد (Free Study)
          </button>
        </div>

        <button
          id="toggle-schedule-config-btn"
          onClick={() => setShowScheduleConfig(!showScheduleConfig)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-stone-600 hover:text-stone-900 bg-white rounded-lg border border-stone-200 shadow-xs transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>تنظیم زمان‌بندی</span>
          {showScheduleConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Daily Constraints Form (Rule 3: User inputs for daily plan generation) */}
      {showScheduleConfig && (
        <form
          onSubmit={handleSaveConstraints}
          className="bg-white rounded-2xl p-4 border border-teal-200 shadow-sm space-y-3 animate-fade-in text-xs"
        >
          <div className="font-semibold text-stone-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>تنظیم بازه‌های زمانی مطالعه امروز</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-stone-600 mb-1">ساعت شروع مطالعه</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-latin text-xs focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-stone-600 mb-1">ساعت شروع ناهار</label>
              <input
                type="time"
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-latin text-xs focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-stone-600 mb-1">مدت ناهار (دقیقه)</label>
              <input
                type="number"
                min="30"
                max="120"
                step="15"
                value={lunchDuration}
                onChange={(e) => setLunchDuration(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-latin text-xs focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-stone-600 mb-1">ساعت پایان مطالعه</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-latin text-xs focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {/* Optional Unavailable Period */}
          <div className="pt-2 border-t border-stone-100">
            <div className="text-stone-600 font-medium mb-1.5">بازه زمانی غیرقابل‌مطالعه یا آزاد (اختیاری):</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-stone-500">از ساعت:</span>
                <input
                  type="time"
                  value={unavailStart}
                  onChange={(e) => setUnavailStart(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-latin text-xs"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500">تا ساعت:</span>
                <input
                  type="time"
                  value={unavailEnd}
                  onChange={(e) => setUnavailEnd(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-latin text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowScheduleConfig(false)}
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium shadow-xs"
            >
              به‌روزرسانی و محاسبه مجدد برنامه
            </button>
          </div>
        </form>
      )}

      {/* Free Study Notice Banner */}
      {currentMode === 'free' && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-3 text-xs flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">حالت مطالعه آزاد فعال است</div>
            <p className="text-sky-800 leading-relaxed">
              در این حالت درس یا موضوعی از پیش تعیین نشده و فقط زمان‌های مطالعه محاسبه شده‌اند. مطالعه در این روز زنجیره پیشرفت (Streak) شما را حفظ می‌کند.
            </p>
          </div>
        </div>
      )}

      {/* Tuesday Rest Day Notice (Rule 14) */}
      {isRestDay && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-center space-y-2">
          <Coffee className="w-8 h-8 text-emerald-600 mx-auto" />
          <div className="font-bold text-sm">سه‌شنبه — روز استراحت هفتگی</div>
          <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
            مطابق تنظیمات، سه‌شنبه‌ها روز استراحت برنامه‌ریزی‌شده است و زنجیره مطالعه شما حفظ می‌شود.
          </p>
          <button
            onClick={() => onChangeStudyMode('planned')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>مطالعه استثنایی در روز سه‌شنبه</span>
          </button>
        </div>
      )}

      {/* Study Blocks List (Rule 6: Display ONLY study blocks, no breaks or lunch) */}
      {!isRestDay && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 px-1">
            <span>بلاک‌های مطالعه امروز ({toPersianDigits(tasks.length)} بلاک)</span>
            <span className="text-stone-500 font-normal text-[11px]">
              استراحت و ناهار به طور خودکار در فواصل محاسبه شده‌اند
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-stone-500 border border-stone-200 text-xs">
              هیچ بلاک مطالعه‌ای در این بازه زمانی تشکیل نشد. لطفاً ساعات شروع و پایان را بررسی کنید.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => {
                const isTaskCompleted = task.completed;

                // Color tags based on subject/type
                let tagColor = 'bg-stone-100 text-stone-700 border-stone-200';
                let tagLabel = 'عمومی';

                if (task.subject === 'english') {
                  tagColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                  tagLabel = 'زبان انگلیسی';
                } else if (task.subject === 'dentistry') {
                  tagColor = 'bg-teal-50 text-teal-800 border-teal-200';
                  tagLabel = task.category ? `دندانپزشکی — ${task.category}` : 'دندانپزشکی';
                } else if (task.subject === 'ai') {
                  tagColor = 'bg-violet-50 text-violet-800 border-violet-200';
                  tagLabel = 'هوش مصنوعی (AI)';
                } else if (task.taskType === 'free_block') {
                  tagColor = 'bg-sky-50 text-sky-800 border-sky-200';
                  tagLabel = 'آزاد';
                }

                if (task.taskType === 'review' || task.taskType === 'active_recall') {
                  tagColor = 'bg-amber-50 text-amber-900 border-amber-200';
                  tagLabel = 'مرور فاصله‌دار (SRS)';
                } else if (task.taskType === 'overdue_recovery') {
                  tagColor = 'bg-rose-50 text-rose-900 border-rose-200';
                  tagLabel = 'جبرانی عقب‌افتاده';
                }

                return (
                  <div
                    key={task.id}
                    id={`study-task-${task.id}`}
                    onClick={() => onToggleTaskCompletion(task.id)}
                    className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                      isTaskCompleted
                        ? 'border-emerald-200 bg-emerald-50/40 opacity-80'
                        : 'border-stone-200 hover:border-teal-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Checkbox and Task Details */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        aria-label={isTaskCompleted ? 'علامت به عنوان ناتمام' : 'علامت به عنوان انجام شده'}
                        className="shrink-0 text-stone-400 hover:text-teal-600 transition-colors"
                      >
                        {isTaskCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-400" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isTaskCompleted
                              ? 'line-through text-stone-400'
                              : 'text-stone-900'
                          }`}
                        >
                          {task.title}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${tagColor}`}>
                            {tagLabel}
                          </span>

                          <span className="text-[11px] text-stone-500 font-latin flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400 inline" />
                            {task.startTime} — {task.endTime}
                          </span>

                          <span className="text-[11px] text-stone-500">
                            ({toPersianDigits(task.durationMinutes)} دقیقه)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Mandatory Widget (Rule 6): مجموع زمان مطالعه روز */}
      <div
        id="daily-total-study-time"
        className="bg-teal-900 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between mt-auto"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-teal-300" />
          <div>
            <div className="text-xs text-teal-200 font-medium">مجموع زمان مطالعه روز</div>
            <div className="text-base font-bold">
              {formatMinutesToPersianHours(totalStudyMinutes)}
            </div>
          </div>
        </div>

        <div className="text-left">
          <div className="text-xs text-teal-300">مطالعه انجام‌شده:</div>
          <div className="text-sm font-semibold text-teal-100">
            {formatMinutesToPersianHours(completedStudyMinutes)}
          </div>
        </div>
      </div>

      {/* Manual Deviation Reporting Button (Rule 29) */}
      <div className="pt-2 flex justify-center">
        <button
          id="open-report-deviations-btn"
          onClick={onOpenDeviationReport}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl border border-stone-300 text-xs font-medium transition-colors shadow-xs"
        >
          <CalendarCheck className="w-4 h-4 text-teal-700" />
          <span>گزارش انحرافات، تغییر زمان یا مطالعه اضافه</span>
        </button>
      </div>
    </div>
  );
};
