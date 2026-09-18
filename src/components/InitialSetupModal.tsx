/**
 * Initial Setup Wizard Modal (پیکربندی اولیه موتور مطالعه)
 * Displayed on first launch to configure:
 * - Today's date (defaults to 2026-09-17 / ۲۶ شهریور ۱۴۰۵)
 * - Study start time
 * - Lunch time & duration
 * - Study end time
 * - Unavailable periods
 * - Study mode (Planned vs Free)
 */

import React, { useState } from 'react';
import { StudyMode, UserSettings } from '../types';
import {
  formatPersianDateLong,
  toPersianDigits,
} from '../utils/persianCalendar';
import {
  Sparkles,
  Clock,
  Coffee,
  Calendar,
  Layers,
  ArrowLeft,
  Check,
} from 'lucide-react';

interface InitialSetupModalProps {
  isOpen: boolean;
  initialDate: string;
  defaultSettings: UserSettings;
  onCompleteSetup: (config: {
    startDate: string;
    settings: UserSettings;
  }) => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  isOpen,
  initialDate,
  defaultSettings,
  onCompleteSetup,
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(defaultSettings.studyStartTime);
  const [lunchTime, setLunchTime] = useState(defaultSettings.lunchStartTime);
  const [lunchDuration, setLunchDuration] = useState(defaultSettings.lunchDurationMinutes);
  const [endTime, setEndTime] = useState(defaultSettings.studyEndTime);
  const [unavailStart, setUnavailStart] = useState('');
  const [unavailEnd, setUnavailEnd] = useState('');
  const [mode, setMode] = useState<StudyMode>(defaultSettings.defaultStudyMode);
  const [tuesdayRest, setTuesdayRest] = useState(defaultSettings.tuesdayRestPreference);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const unavailablePeriods =
      unavailStart && unavailEnd
        ? [{ id: 'p1', startTime: unavailStart, endTime: unavailEnd }]
        : [];

    onCompleteSetup({
      startDate: date,
      settings: {
        ...defaultSettings,
        studyStartTime: startTime,
        lunchStartTime: lunchTime,
        lunchDurationMinutes: Number(lunchDuration) || 60,
        studyEndTime: endTime,
        unavailablePeriods,
        defaultStudyMode: mode,
        tuesdayRestPreference: tuesdayRest,
        isConfigured: true,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="initial-setup-dialog"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-stone-900 animate-scale-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 to-stone-900 text-white p-5">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>پیکربندی اولیه سیستم</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">
            راه‌اندازی موتور مطالعه (Study Planning Engine)
          </h1>
          <p className="text-xs text-stone-300 mt-1 leading-relaxed">
            تنظیم زمان‌های روزانه و پیش‌فرض‌های سیستم برای تولید اولین نسخه برنامه مدون و پویا
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Date Selector */}
          <div className="space-y-1">
            <label className="block font-bold text-stone-800">
              تاریخ شروع برنامه‌ریزی:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
            <div className="text-[11px] text-teal-800 font-medium">
              معادل خورشیدی: {formatPersianDateLong(date)}
            </div>
          </div>

          {/* Time Bounds */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-stone-800 mb-1">ساعت شروع مطالعه:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">ساعت پایان مطالعه:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
          </div>

          {/* Lunch Bounds */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-stone-800 mb-1">ساعت شروع ناهار:</label>
              <input
                type="time"
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">مدت ناهار (دقیقه):</label>
              <input
                type="number"
                min="30"
                max="120"
                step="15"
                value={lunchDuration}
                onChange={(e) => setLunchDuration(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
          </div>

          {/* Optional Unavailable period */}
          <div className="border-t border-stone-200 pt-3">
            <label className="block font-bold text-stone-800 mb-1">
              بازه زمانی غیرقابل‌مطالعه یا اشتغال در طول روز (اختیاری):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-stone-500">از ساعت:</span>
                <input
                  type="time"
                  value={unavailStart}
                  onChange={(e) => setUnavailStart(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-500">تا ساعت:</span>
                <input
                  type="time"
                  value={unavailEnd}
                  onChange={(e) => setUnavailEnd(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs"
                />
              </div>
            </div>
          </div>

          {/* Mode & Tuesday Preference */}
          <div className="border-t border-stone-200 pt-3 space-y-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1.5">حالت مطالعه پیش‌فرض:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('planned')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    mode === 'planned'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  طبق برنامه (Planned)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('free')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    mode === 'free'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  آزاد (Free Study)
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                checked={tuesdayRest}
                onChange={(e) => setTuesdayRest(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium text-stone-800">
                سه‌شنبه‌ها به عنوان روز استراحت پیش‌فرض در نظر گرفته شود (قانون ۱۴)
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-stone-200">
            <button
              type="submit"
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>راه‌اندازی موتور و ساخت اولین برنامه</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
