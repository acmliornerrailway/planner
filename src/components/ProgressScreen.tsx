/**
 * Progress Screen (پیشرفت)
 * Displays current chain, longest chain, total study hours,
 * English 64-lesson progress, Dentistry 60-150h target, AI target,
 * and SRS spaced repetition metrics with clean charts.
 */

import React from 'react';
import {
  DentistryCategory,
  DENTISTRY_CATEGORIES,
  ENGLISH_BOOKS,
  StudyEngineState,
} from '../types';
import {
  formatMinutesToPersianHours,
  toPersianDigits,
} from '../utils/persianCalendar';
import {
  getChainDisplay,
} from '../engine/planningEngine';
import {
  Flame,
  Award,
  BookOpen,
  Clock,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Gift,
} from 'lucide-react';

interface ProgressScreenProps {
  state: StudyEngineState;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ state }) => {
  const progress = state.progress;

  // English details
  const totalLessons = 64;
  const completedLessons = Math.min(totalLessons, progress.englishLessonsCompleted || 0);
  const englishPercent = Math.round((completedLessons / totalLessons) * 100);

  // Dentistry hours calculation (from daily plans in current month)
  let dentistryMinutesMonth = 0;
  for (const date in state.dailyPlans) {
    const plan = state.dailyPlans[date];
    for (const t of plan.tasks) {
      if (t.completed && t.subject === 'dentistry') {
        dentistryMinutesMonth += t.durationMinutes;
      }
    }
  }
  const dentistryHours = Math.round((dentistryMinutesMonth / 60) * 10) / 10;
  const dentistryMinTargetHours = 60;
  const dentistryMaxCapacityHours = 150;
  const dentistryPercent = Math.min(100, Math.round((dentistryHours / dentistryMinTargetHours) * 100));

  // AI hours calculation (this week)
  let aiMinutesWeek = 0;
  for (const date in state.dailyPlans) {
    const plan = state.dailyPlans[date];
    for (const t of plan.tasks) {
      if (t.completed && t.subject === 'ai') {
        aiMinutesWeek += t.durationMinutes;
      }
    }
  }
  const aiHoursWeek = Math.round((aiMinutesWeek / 60) * 10) / 10;

  // Spaced reviews stats
  const totalReviews = state.reviews.length;
  const completedReviews = state.reviews.filter((r) => r.completed).length;
  const overdueReviews = state.reviews.filter(
    (r) => !r.completed && r.dueDate < state.currentDate
  ).length;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
      {/* Top Banner: Progress Chain & Milestones */}
      <section
        aria-label="خلاصه زنجیره مطالعه و رکوردها"
        className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-3xl p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-200 font-medium">زنجیره استمرار مطالعه (Study Chain)</div>
            <h1 className="text-2xl font-black mt-0.5">
              {getChainDisplay(progress.currentChain)}
            </h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
            <Flame className="w-7 h-7 text-amber-200 fill-amber-200 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/40 text-xs">
          <div>
            <span className="text-amber-200">طولانی‌ترین رکورد:</span>{' '}
            <span className="font-bold">{toPersianDigits(progress.longestChain)} روز</span>
          </div>
          <div className="text-left">
            <span className="text-amber-200">کل زمان مطالعه:</span>{' '}
            <span className="font-bold">{formatMinutesToPersianHours(progress.totalStudyMinutes)}</span>
          </div>
        </div>

        {/* Milestone Gift Badges */}
        <div className="bg-black/20 rounded-xl p-2.5 flex items-center justify-around text-[11px] text-amber-100">
          <div className={`flex items-center gap-1 ${progress.currentChain >= 30 ? 'font-bold text-yellow-300' : 'opacity-60'}`}>
            <Gift className="w-3.5 h-3.5" />
            <span>روز ۳۰: 🔥🎁</span>
          </div>
          <div className={`flex items-center gap-1 ${progress.currentChain >= 60 ? 'font-bold text-yellow-300' : 'opacity-60'}`}>
            <Gift className="w-3.5 h-3.5" />
            <span>روز ۶۰: 🔥🎁🎁</span>
          </div>
          <div className={`flex items-center gap-1 ${progress.currentChain >= 90 ? 'font-bold text-yellow-300' : 'opacity-60'}`}>
            <Gift className="w-3.5 h-3.5" />
            <span>روز ۹۰: 🔥🎁🎁🎁</span>
          </div>
        </div>
      </section>

      {/* English System (Rule 9: 4 Books, 16 lessons each, 64 total) */}
      <section
        aria-label="پیشرفت ۴ کتاب زبان انگلیسی"
        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-stone-900">پیشرفت سیستم زبان انگلیسی (۴ کتاب)</h2>
          </div>
          <span className="text-xs font-bold text-indigo-700 font-latin">
            {toPersianDigits(completedLessons)} / ۶۴ Lesson
          </span>
        </div>

        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${englishPercent}%` }}
          />
        </div>

        {/* 4 Books Progress Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {ENGLISH_BOOKS.map((book, bIdx) => {
            const bookCompleted = Math.max(0, Math.min(16, completedLessons - bIdx * 16));
            return (
              <div
                key={book}
                className="bg-stone-50 rounded-xl p-2.5 text-center border border-stone-100"
              >
                <div className="text-[11px] font-latin font-semibold text-stone-800 truncate">
                  {book}
                </div>
                <div className="text-xs font-bold text-indigo-800 mt-1">
                  {toPersianDigits(bookCompleted)} / ۱۶
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  {bookCompleted === 16 ? 'تکمیل شد ✓' : `${toPersianDigits(Math.round((bookCompleted / 16) * 100))}٪`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-stone-500 text-center">
          هدف کل: اتمام هر ۴ کتاب (۱۲۸ ساعت مطالعه مفید) تا پایان اسفند ۱۴۰۵
        </div>
      </section>

      {/* Dentistry Hours & AI Target */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dentistry (Rule 12: Minimum 60h/month, capacity up to 150h) */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">دندانپزشکی در ماه جاری</span>
            <span className="text-xs font-bold text-teal-700">
              {toPersianDigits(dentistryHours)} ساعت
            </span>
          </div>

          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${dentistryPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-500">
            <span>حداقل ماهانه: ۶۰ ساعت</span>
            <span>سقف ظرفیت: ۱۵۰ ساعت</span>
          </div>

          {/* 9 Categories representation indicator */}
          <div className="pt-2 border-t border-stone-100">
            <div className="text-[10px] text-stone-600 font-semibold mb-1">
              چرخش منظم ۹ حوزه اصلی دندانپزشکی:
            </div>
            <div className="flex flex-wrap gap-1">
              {DENTISTRY_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Target (Rule 13: 3-6 hours per week) */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-900">هوش مصنوعی (AI) این هفته</span>
              <span className="text-xs font-bold text-violet-700">
                {toPersianDigits(aiHoursWeek)} ساعت
              </span>
            </div>

            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (aiHoursWeek / 4.5) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
              <span>هدف هفتگی: ۳ تا ۶ ساعت</span>
              <span>منابع انتخابی کاربر</span>
            </div>
          </div>

          <div className="p-2.5 bg-violet-50/70 border border-violet-100 rounded-xl text-[11px] text-violet-900 leading-relaxed mt-2">
            موتور مطالعه زمان جلسات را برنامه‌ریزی می‌کند؛ انتخاب ابزار، ویدیو و منابع به طور کامل در اختیار شماست.
          </div>
        </div>
      </div>

      {/* Spaced Repetition System (SRS) Metrics */}
      <section
        aria-label="شاخص‌های سیستم مرور فاصله‌دار"
        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold text-stone-900">وضعیت سیستم مرور فاصله‌دار (Spaced Repetition)</h2>
          </div>
          <span className="text-xs font-semibold text-stone-600">
            فواصل: D0, D+1, D+3, D+7, D+14, D+30
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
            <div className="text-stone-500 text-[11px]">کل مرورها</div>
            <div className="text-sm font-bold text-stone-800 mt-0.5">
              {toPersianDigits(totalReviews)}
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
            <div className="text-emerald-700 text-[11px]">انجام‌شده</div>
            <div className="text-sm font-bold mt-0.5">
              {toPersianDigits(completedReviews)}
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-900">
            <div className="text-amber-700 text-[11px]">عقب‌افتاده / سررسید</div>
            <div className="text-sm font-bold mt-0.5">
              {toPersianDigits(overdueReviews)}
            </div>
          </div>
        </div>

        {overdueReviews > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {toPersianDigits(overdueReviews)} مرور سررسید شده در نوبت هستند و موتور به طور خودکار اولویت آنها را در روزهای آتی بالاتر از درس جدید قرار می‌دهد.
            </span>
          </div>
        )}
      </section>
    </div>
  );
};
