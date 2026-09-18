/**
 * Monthly Overview Screen (ماه)
 * Divides study into 4-week cycles with exact Persian start/end dates,
 * exact English lesson targets, Dentistry 60-hour target, AI targets,
 * and mandatory end-of-cycle reviews & simulation exam.
 */

import React, { useState } from 'react';
import {
  MonthCyclePlan,
  StudyEngineState,
} from '../types';
import {
  toPersianDigits,
} from '../utils/persianCalendar';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface MonthScreenProps {
  state: StudyEngineState;
}

export const MonthScreen: React.FC<MonthScreenProps> = ({ state }) => {
  const [cycleIndex, setCycleIndex] = useState(0);

  const cycles = state.monthlyPlans;
  const currentCycle: MonthCyclePlan | undefined = cycles[cycleIndex] || cycles[0];

  if (!currentCycle) {
    return (
      <div className="p-8 text-center text-stone-500 text-xs">
        برنامه ماهانه هنوز آماده نشده است.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">
      {/* Month Cycle Header */}
      <section
        aria-label="عنوان چرخه ۴ هفته‌ای و جابجایی"
        className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 flex items-center justify-between"
      >
        <button
          onClick={() => setCycleIndex(Math.max(0, cycleIndex - 1))}
          disabled={cycleIndex === 0}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="چرخه قبل"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-xs text-teal-700 font-semibold mb-0.5">چرخه برنامه‌ریزی ۴ هفته‌ای</div>
          <h1 className="text-base font-bold text-stone-900">
            {currentCycle.shamsiMonthName}
          </h1>
          <div className="text-xs text-stone-500 mt-0.5">
            بازه خورشیدی: {currentCycle.shamsiStartEnd}
          </div>
        </div>

        <button
          onClick={() => setCycleIndex(Math.min(cycles.length - 1, cycleIndex + 1))}
          disabled={cycleIndex >= cycles.length - 1}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="چرخه بعد"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </section>

      {/* Targets Overview Card */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3 text-center">
          <div className="text-[11px] text-indigo-700 font-semibold mb-0.5">زبان انگلیسی</div>
          <div className="text-sm font-bold text-indigo-950 font-latin truncate">
            {currentCycle.englishTarget}
          </div>
          <div className="text-[10px] text-indigo-600 mt-1">۱۲ درس در هر ماه</div>
        </div>

        <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-3 text-center">
          <div className="text-[11px] text-teal-700 font-semibold mb-0.5">دندانپزشکی</div>
          <div className="text-sm font-bold text-teal-950">
            حداقل ۶۰ ساعت
          </div>
          <div className="text-[10px] text-teal-600 mt-1">ظرفیت تا ۱۵۰ ساعت</div>
        </div>

        <div className="bg-violet-50/80 border border-violet-200 rounded-2xl p-3 text-center">
          <div className="text-[11px] text-violet-700 font-semibold mb-0.5">هوش مصنوعی</div>
          <div className="text-sm font-bold text-violet-950">
            ۳ تا ۶ ساعت/هفته
          </div>
          <div className="text-[10px] text-violet-600 mt-1">مجموع ~۱۸ ساعت</div>
        </div>
      </div>

      {/* 4-Week Breakdown Cards (Rule 16) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-stone-700 px-1">
          تفکیک ۴ هفته‌ای چرخه ماهانه
        </div>

        {currentCycle.weeks.map((w, idx) => (
          <div
            key={w.weekNumber}
            className="bg-white rounded-xl p-3.5 border border-stone-200/90 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-stone-800 text-white font-bold text-xs px-2.5 py-0.5 rounded-md">
                  هفته {toPersianDigits(w.weekNumber)}
                </span>
                <span className="text-xs font-medium text-stone-800">
                  {w.shamsiStartDate} تا {w.shamsiEndDate}
                </span>
              </div>
              <span className="text-[11px] font-latin text-stone-500">
                Week {w.weekNumber}
              </span>
            </div>

            {/* Exact targets (Rule 16: Never write vague targets like "Continue Interchange") */}
            <div className="bg-stone-50 rounded-lg p-2.5 text-xs space-y-1.5 border border-stone-200/60">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">هدف دقیق زبان انگلیسی:</span>
                <span className="font-bold text-indigo-700 font-latin">
                  {w.englishTarget}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600">ساعات دندانپزشکی مورد انتظار:</span>
                <span className="font-medium text-teal-800">
                  حداقل {toPersianDigits(w.dentistryTargetHours)} ساعت
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600">هدف هوش مصنوعی (AI):</span>
                <span className="font-medium text-violet-800">
                  {toPersianDigits(w.aiTargetHours)} ساعت در هفته
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* End of 4-Week Cycle Mandates (Rule 16 & 26):
          1. مرور کلی ماه گذشته
          2. آزمون جامع شبیه‌سازی‌شده */}
      <section
        aria-label="الزامات پایان چرخه ۴ هفته‌ای"
        className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3 shadow-sm"
      >
        <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-teal-700" />
          <span>برنامه‌های اختصاصی پایان چرخه ۴ هفته‌ای</span>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">۱. مرور کلی ماه گذشته</div>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                ارزیابی و مرور فاصله‌دار عمیق تمام موضوعات تدریس‌شده در ۴ هفته اخیر با تاکید بر تثبیت در حافظه بلندمدت.
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">۲. آزمون جامع شبیه‌سازی‌شده</div>
              <p className="text-rose-800 text-[11px] mt-0.5 leading-relaxed">
                آزمون جامع با سوالات استاندارد و شبیه‌سازی شرایط برای سنجش تسلط بر ۱۲ درس زبان و مباحث دندانپزشکی.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
