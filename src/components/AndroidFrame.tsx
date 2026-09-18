/**
 * Android Material 3 Device Frame & Layout Wrapper
 * Renders an authentic Android mobile environment with status bar,
 * gesture pill, and switchable full-width mode for tablets/desktop.
 */

import React, { useState } from 'react';
import { Battery, Wifi, Signal, Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { toPersianDigits } from '../utils/persianCalendar';

interface AndroidFrameProps {
  children: React.ReactNode;
  currentScreenTitle: string;
  syncBadge?: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  currentScreenTitle,
  syncBadge,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Time in HH:mm
  const currentTimeStr = toPersianDigits('13:20');

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 transition-all duration-300">
      {/* Top Bar with Mode Switcher */}
      <header className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-200 tracking-wide">Study Planning Engine</span>
          <span className="bg-stone-800 text-teal-400 px-2 py-0.5 rounded text-[11px] font-latin">
            com.studyplanning.engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          {syncBadge}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors text-xs"
            title={isExpanded ? 'نمایش در ابعاد گوشی اندروید' : 'نمایش عریض تمام‌صفحه'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>ابعاد گوشی</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>تمام صفحه</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main
        className={`w-full transition-all duration-300 ${
          isExpanded
            ? 'max-w-4xl rounded-2xl border border-stone-800 bg-stone-50 text-stone-900 shadow-2xl overflow-hidden min-h-[840px] flex flex-col'
            : 'max-w-md rounded-[38px] border-[10px] border-stone-800 bg-stone-50 text-stone-900 shadow-2xl overflow-hidden h-[860px] flex flex-col relative ring-1 ring-stone-700/50'
        }`}
      >
        {/* Android Status Bar */}
        <section aria-label="نوار وضعیت اندروید" className="bg-stone-900 text-stone-300 px-5 pt-2 pb-1.5 flex items-center justify-between text-xs select-none border-b border-stone-800/40 shrink-0">
          <div className="font-latin text-xs font-semibold tracking-wider text-stone-200">
            {currentTimeStr}
          </div>

          {/* Android Camera Notch in Mobile Mode */}
          {!isExpanded && (
            <div className="w-4 h-4 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-800"></div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-stone-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-stone-200" />
          </div>
        </section>

        {/* Dynamic App Content */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-stone-50 relative pb-16">
          {children}
        </div>

        {/* Android Bottom Navigation Pill Bar */}
        {!isExpanded && (
          <div className="bg-stone-100 py-2 flex items-center justify-center shrink-0 border-t border-stone-200">
            <div className="w-32 h-1 bg-stone-400 rounded-full"></div>
          </div>
        )}
      </main>
    </div>
  );
};
