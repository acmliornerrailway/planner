/**
 * Weekly Overview Screen (هفته)
 * Displays weekly schedule, exact English lesson targets, Dentistry categories,
 * AI blocks, SRS reviews, Free Study days, and the mandatory end-of-week summary review.
 */

import React, { useState } from 'react';
import {
  StudyEngineState,
  WeekPlan,
} from '../types';
import {
  formatMinutesToPersianHours,
  formatPersianMonthDay,
  toPersianDigits,
} from '../utils/persianCalendar';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Coffee,
  BookmarkCheck,
} from 'lucide-react';

interface WeekScreenProps {
  state: StudyEngineState;
  onSelectDate: (dateStr: string) => void;
}

export const WeekScreen: React.FC<WeekScreenProps> = ({ state, onSelectDate }) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const weeklyPlans = state.weeklyPlans;
  const currentWeek: WeekPlan | undefined = weeklyPlans[selectedWeekIndex] || weeklyPlans[0];

  if (!currentWeek) {
    return (
      <div className="p-8 text-center text-stone-500 text-xs">
        برنامه هفتگی هنوز بارگذاری نشده است.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
      {/* Header with Week Label and Navigation */}
      <section
        aria-label="عنوان هفته و جابجایی"
        className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 flex items-center justify-between"
      >
        <button
          onClick={() => setSelectedWeekIndex(Math.max(0, selectedWeekIndex - 1))}
          disabled={selectedWeekIndex === 0}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="هفته قبل"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-xs text-teal-700 font-semibold mb-0.5">نمای هفتگی متوازن</div>
          <h1 className="text-base font-bold text-stone-900">
            {currentWeek.label}
          </h1>
          <div className="text-xs text-stone-500 mt-0.5">
            هدف زبان هفته: <span className="font-semibold text-indigo-700 font-latin">{currentWeek.englishTarget}</span>
          </div>
        </div>

        <button
          onClick={() => setSelectedWeekIndex(Math.min(weeklyPlans.length - 1, selectedWeekIndex + 1))}
          disabled={selectedWeekIndex >= weeklyPlans.length - 1}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="هفته بعد"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </section>

      {/* Days List */}
      <div className="space-y-3">
        {currentWeek.days.map((day, idx) => {
          const isToday = day.date === state.currentDate;
          const isRestDay = day.isRestDay;
          const isFree = day.mode === 'free';
          const tasks = day.tasks || [];
          const completedCount = tasks.filter((t) => t.completed).length;

          // Distinct subject summaries
          const englishTasks = tasks.filter((t) => t.subject === 'english' && t.taskType === 'new_study');
          const reviews = tasks.filter((t) => t.taskType === 'review' || t.taskType === 'active_recall');
          const dentistryTasks = tasks.filter((t) => t.subject === 'dentistry' && t.taskType === 'new_study');
          const aiTasks = tasks.filter((t) => t.subject === 'ai');

          return (
            <div
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer hover:shadow-xs ${
                isToday
                  ? 'border-teal-400 ring-2 ring-teal-200/50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isToday ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-800'
                  }`}>
                    {day.persianDateLong.split(' ')[0]}
                  </span>
                  <span className="text-xs text-stone-600 font-medium">
                    {formatPersianMonthDay(day.date)}
                  </span>
                  {isToday && (
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                      امروز
                    </span>
                  )}
                </div>

                <div className="text-xs text-stone-500 font-latin">
                  {day.date}
                </div>
              </div>

              {/* Day Contents */}
              {isRestDay ? (
                <div className="bg-stone-50 rounded-lg p-2.5 flex items-center gap-2 text-xs text-stone-600">
                  <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>روز استراحت هفتگی (سه‌شنبه) — بدون برنامه تحمیلی</span>
                </div>
              ) : isFree ? (
                <div className="bg-sky-50 rounded-lg p-2.5 flex items-center justify-between text-xs text-sky-900">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-bold">مطالعه آزاد (Free Study)</span>
                  </div>
                  <span className="text-[11px] text-sky-700">
                    {toPersianDigits(tasks.length)} بلاک زمانی آزاد
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {/* English Lesson */}
                  {englishTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-1.5 bg-indigo-50/70 text-indigo-900 rounded-md border border-indigo-100"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold font-latin">{t.title}</span>
                      </div>
                      <span className="text-[11px] font-latin text-indigo-700 shrink-0">
                        {t.startTime} - {t.endTime}
                      </span>
                    </div>
                  ))}

                  {/* Dentistry Category */}
                  {dentistryTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-1.5 bg-teal-50/70 text-teal-900 rounded-md border border-teal-100"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="text-[11px] font-latin text-teal-700 shrink-0">
                        {t.startTime} - {t.endTime}
                      </span>
                    </div>
                  ))}

                  {/* AI Study */}
                  {aiTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-1.5 bg-violet-50/70 text-violet-900 rounded-md border border-violet-100"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="text-[11px] font-latin text-violet-700 shrink-0">
                        {t.startTime} - {t.endTime}
                      </span>
                    </div>
                  ))}

                  {/* Spaced Reviews */}
                  {reviews.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-1.5 bg-amber-50/70 text-amber-900 rounded-md border border-amber-100"
                    >
                      <span className="font-medium truncate">{t.title}</span>
                      <span className="text-[10px] font-semibold text-amber-800 shrink-0">
                        مرور فاصله‌دار
                      </span>
                    </div>
                  ))}

                  {/* Completion Status Bar */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                    <span>
                      {tasks.length > 0
                        ? `${toPersianDigits(completedCount)} از ${toPersianDigits(tasks.length)} مورد انجام شده`
                        : 'بدون وظیفه'}
                    </span>
                    <span>
                      مجموع: {formatMinutesToPersianHours(day.totalStudyMinutes)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mandatory Rule 15 & 25: At the end of every week include: مرور جمع‌بندی کل هفته */}
      <section
        id="weekly-summary-review"
        aria-label="مرور جمع‌بندی کل هفته"
        className="bg-gradient-to-r from-teal-800 to-stone-800 text-white rounded-2xl p-4 shadow-sm space-y-2"
      >
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-5 h-5 text-teal-300" />
          <h2 className="font-bold text-sm">مرور جمع‌بندی کل هفته</h2>
        </div>
        <p className="text-xs text-stone-200 leading-relaxed">
          در پایان هر هفته، یک جلسه مرور جامع جهت تثبیت درس‌های زبان مطالعه‌شده، موضوعات دندانپزشکی مرور شده و ارزیابی تداوم زنجیره یادگیری منظور شده است.
        </p>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-teal-700/50 text-teal-200">
          <span>هدف‌گذاری زبان هفته: {currentWeek.englishTarget}</span>
          <span>وضعیت: فعال در چرخه سیستم</span>
        </div>
      </section>
    </div>
  );
};
