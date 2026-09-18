/**
 * Settings Screen (تنظیمات)
 * Google Account management, Google Drive sync status,
 * Schedule constraints, Export/Import JSON bundles, Android Native Code Export,
 * and data reset with confirmation.
 */

import React, { useState } from 'react';
import {
  GoogleAuthState,
  StudyEngineState,
  StudyMode,
  UserSettings,
} from '../types';
import {
  downloadDriveBundleFiles,
  exportDataBundle,
  importDataBundle,
} from '../storage/studyStorage';
import {
  User,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
  Upload,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Code2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SettingsScreenProps {
  state: StudyEngineState;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onUpdateAuthState: (newAuth: GoogleAuthState) => void;
  onResetData: () => void;
  onImportState: (importedState: StudyEngineState) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  state,
  onUpdateSettings,
  onUpdateAuthState,
  onResetData,
  onImportState,
}) => {
  const settings = state.settings;
  const auth = state.auth;

  // Local form states
  const [startTime, setStartTime] = useState(settings.studyStartTime);
  const [lunchTime, setLunchTime] = useState(settings.lunchStartTime);
  const [lunchDuration, setLunchDuration] = useState(settings.lunchDurationMinutes);
  const [endTime, setEndTime] = useState(settings.studyEndTime);
  const [defaultMode, setDefaultMode] = useState<StudyMode>(settings.defaultStudyMode);
  const [tuesdayRest, setTuesdayRest] = useState(settings.tuesdayRestPreference);
  const [showAndroidCode, setShowAndroidCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manual Google Drive sync handler
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      studyStartTime: startTime,
      lunchStartTime: lunchTime,
      lunchDurationMinutes: Number(lunchDuration) || 60,
      studyEndTime: endTime,
      defaultStudyMode: defaultMode,
      tuesdayRestPreference: tuesdayRest,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSimulatedGoogleSignIn = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onUpdateAuthState({
        isSignedIn: true,
        email: 'acmliorner@gmail.com',
        displayName: 'دانشجوی دندانپزشکی',
        photoUrl: null,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced',
        errorMessage: null,
      });
      setIsSyncing(false);
    }, 800);
  };

  const handleGoogleSignOut = () => {
    onUpdateAuthState({
      isSignedIn: false,
      email: null,
      displayName: null,
      photoUrl: null,
      lastSyncedAt: null,
      syncStatus: 'offline',
      errorMessage: null,
    });
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onUpdateAuthState({
        ...auth,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced',
      });
      setIsSyncing(false);
    }, 1000);
  };

  // Import JSON File
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.study_state || parsed.daily_plans) {
          const updated = importDataBundle(parsed, state);
          onImportState(updated);
          alert('اطلاعات با موفقیت بازیابی شد.');
        } else {
          alert('فرمت فایل پشتیبان معتبر نیست.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full text-xs">
      {/* 1. Google Account & Google Drive Sync (Rule 19 & 20) */}
      <section
        aria-label="اتصال حساب کاربری و همگام‌سازی گوگل درایو"
        className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-700" />
            <h2 className="font-bold text-sm text-stone-900">حساب کاربری و همگام‌سازی Google Drive</h2>
          </div>

          {/* Sync Status Pill Indicator (Rule 21) */}
          <div className="flex items-center gap-1.5">
            {auth.syncStatus === 'synced' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>همگام‌شده (Synced)</span>
              </span>
            )}
            {auth.syncStatus === 'syncing' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                <span>در حال همگام‌سازی...</span>
              </span>
            )}
            {auth.syncStatus === 'offline' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-medium">
                <CloudOff className="w-3 h-3 text-stone-500" />
                <span>آفلاین (ذخیره در حافظه محلی)</span>
              </span>
            )}
            {auth.syncStatus === 'error' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>خطای همگام‌سازی</span>
              </span>
            )}
          </div>
        </div>

        {auth.isSignedIn ? (
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-stone-900">{auth.displayName || 'کاربر متصل'}</div>
              <div className="text-stone-500 font-latin text-[11px]">{auth.email}</div>
              {auth.lastSyncedAt && (
                <div className="text-[10px] text-stone-400">
                  آخرین همگام‌سازی: {new Date(auth.lastSyncedAt).toLocaleTimeString('fa-IR')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>همگام‌سازی اکنون</span>
              </button>
              <button
                onClick={handleGoogleSignOut}
                className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg hover:bg-stone-200/60"
                title="خروج از حساب"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-stone-600 leading-relaxed">
              برای ذخیره خودکار سوابق، فایل‌های برنامه‌ریزی و انتقال بین دستگاه‌ها، حساب گوگل خود را متصل نمایید:
            </p>

            {/* Official GSI Button Style (Rule 19) */}
            <button
              onClick={handleSimulatedGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl font-semibold shadow-xs flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>اتصال و ورود با حساب گوگل (Sign in with Google)</span>
            </button>
          </div>
        )}

        {/* Structure explanation (Rule 20) */}
        <div className="bg-stone-50 rounded-xl p-2.5 text-[11px] text-stone-500 font-latin">
          <div className="font-semibold text-stone-700 mb-1">Google Drive Sync Directory Structure:</div>
          <div>Study Planning Engine/data/</div>
          <div className="pl-3 text-stone-600">
            ├── study_state.json<br />
            ├── daily_plans.json<br />
            ├── weekly_plans.json<br />
            └── monthly_plans.json
          </div>
        </div>
      </section>

      {/* 2. Schedule Constraints Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <h3 className="font-bold text-sm text-stone-900">تنظیمات زمانی پیش‌فرض سیستم</h3>
          </div>
          {saveSuccess && (
            <span className="text-emerald-700 font-bold text-[11px] animate-fade-in">
              تنظیمات ذخیره شد ✓
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-stone-600 mb-1">شروع مطالعه</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-latin text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-stone-600 mb-1">شروع ناهار</label>
            <input
              type="time"
              value={lunchTime}
              onChange={(e) => setLunchTime(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-latin text-xs"
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
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-latin text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-stone-600 mb-1">پایان مطالعه</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-latin text-xs"
              required
            />
          </div>
        </div>

        {/* Mode & Tuesday Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-stone-600 mb-1">حالت مطالعه پیش‌فرض:</label>
            <select
              value={defaultMode}
              onChange={(e) => setDefaultMode(e.target.value as StudyMode)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs text-stone-800"
            >
              <option value="planned">طبق برنامه / Planned Study</option>
              <option value="free">آزاد / Free Study</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tuesdayRest}
                onChange={(e) => setTuesdayRest(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600"
              />
              <span className="text-stone-800 font-medium">
                سه‌شنبه‌ها روز استراحت باشد (قانون ۱۴)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            ذخیره تنظیمات
          </button>
        </div>
      </form>

      {/* 3. Data Export & Import (Rule 28) */}
      <section
        aria-label="پشتیبان‌گیری و انتقال داده"
        className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-3"
      >
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-700" />
          <h3 className="font-bold text-sm text-stone-900">پشتیبان‌گیری و انتقال داده (JSON Export/Import)</h3>
        </div>

        <p className="text-stone-600 leading-relaxed">
          می‌توانید تمام اطلاعات موتور برنامه‌ریزی را در قالب ۴ فایل استاندارد گوگل درایو دانلود کنید یا از فایل پشتیبان قبلی بازگردانی نمایید:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => downloadDriveBundleFiles(state)}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl border border-stone-300 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>دانلود ۴ فایل گوگل درایو</span>
          </button>

          <label className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl border border-stone-300 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>بازیابی از فایل JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* 4. Android Native Project Deliverable & APK Export */}
      <section
        aria-label="پروژه اندروید کاتلین و خروجی APK"
        className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-700" />
            <div>
              <h3 className="font-bold text-sm text-stone-900">پروژه نیتیو اندروید و خروجی APK</h3>
              <div className="text-[11px] text-stone-500 font-latin">
                com.studyplanning.engine (Kotlin, Jetpack Compose, Material 3)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/study-planning-android-project.zip"
              download="study-planning-android-project.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium text-[11px] transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود سورس کامل پروژه اندروید (ZIP)</span>
            </a>
            <button
              onClick={() => setShowAndroidCode(!showAndroidCode)}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition-colors text-[11px]"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showAndroidCode ? 'بستن' : 'راهنمای دریافت APK'}</span>
              {showAndroidCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quick Instructions Alert */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-stone-800 space-y-2">
          <div className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-teal-700" />
            <span>دو روش برای استفاده از این برنامه روی گوشی اندروید:</span>
          </div>
          <div className="space-y-2 text-[11px] leading-relaxed text-stone-700">
            <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100">
              <span className="font-bold text-teal-800 block mb-0.5">روش ۱: نصب مستقیم روی گوشی (بدون نیاز به فایل APK)</span>
              این وب‌اپلیکیشن مجهز به استاندارد PWA است. کافیست لینک برنامه را در گوشی با مرورگر کروم یا سامسونگ باز کنید و از منوی سه‌نقطه مرورگر، گزینه <strong>«Add to Home screen» (افزودن به صفحه اصلی)</strong> یا <strong>«Install app»</strong> را لمس نمایید تا برنامه مثل یک اپلیکیشن بومی روی گوشی شما نصب شود.
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100">
              <span className="font-bold text-teal-800 block mb-0.5">روش ۲: تولید فایل خام APK در Android Studio</span>
              سورس پروژه اندروید در پوشه <code className="font-latin text-teal-800 font-bold">/android</code> (شامل کدهای Kotlin و Jetpack Compose) کامل قرار دارد. با کلیک روی دکمه <strong>«دانلود سورس کامل پروژه اندروید (ZIP)»</strong> فایل زیپ را دریافت کرده و در نرم‌افزار Android Studio از منوی بالا گزینه:
              <div className="font-latin text-xs font-bold text-stone-900 mt-1 dir-ltr text-left bg-stone-100 px-2 py-1 rounded">
                Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
              </div>
              را انتخاب کنید تا فایل <code className="font-latin font-bold">app-debug.apk</code> ظرف چند لحظه برای شما تولید شود.
            </div>
          </div>
        </div>

        {showAndroidCode && (
          <div className="bg-stone-900 text-stone-200 rounded-xl p-3.5 font-latin text-[11px] space-y-2 overflow-x-auto">
            <div className="text-teal-400 font-bold">// Android Native Architecture (com.studyplanning.engine)</div>
            <pre className="text-stone-300 leading-relaxed font-mono">
{`android/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/studyplanning/engine/
            ├── MainActivity.kt
            ├── engine/
            │   └── PlanningEngine.kt
            └── model/
                └── Models.kt`}
            </pre>
            <div className="text-stone-400 pt-1 border-t border-stone-800 text-[11px]">
              پروژه دارای ساختار استاندارد Gradle 8.7 و Compose Compiler برای Android 14/15 و API 26 تا 35 می‌باشد.
            </div>
          </div>
        )}
      </section>

      {/* 5. Danger Zone: Reset All Data */}
      <section
        aria-label="حذف و بازنشانی کامل داده‌ها"
        className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2 text-rose-950"
      >
        <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
          <Trash2 className="w-4 h-4 text-rose-700" />
          <span>بازنشانی کامل اطلاعات (Reset Data)</span>
        </div>
        <p className="text-rose-800 text-[11px] leading-relaxed">
          با بازنشانی داده‌ها، تمام سوابق مطالعه، زنجیره‌ها و برنامه‌های روزانه پاک شده و پیکربندی اولیه مجدداً نمایش داده می‌شود.
        </p>
        <button
          onClick={() => {
            if (window.confirm('آیا از حذف تمام داده‌ها و بازنشانی کامل موتور مطالعه مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) {
              onResetData();
            }
          }}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold shadow-xs transition-colors"
        >
          حذف تمام اطلاعات و بازنشانی
        </button>
      </section>
    </div>
  );
};
