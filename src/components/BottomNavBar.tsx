/**
 * Bottom Navigation Bar
 * Implements the 5 core navigation tabs:
 * 1. امروز (Today)
 * 2. هفته (Week)
 * 3. ماه (Month)
 * 4. پیشرفت (Progress)
 * 5. تنظیمات (Settings)
 */

import React from 'react';
import { Calendar, CalendarRange, Flame, Settings, CheckSquare } from 'lucide-react';

export type TabType = 'today' | 'week' | 'month' | 'progress' | 'settings';

interface BottomNavBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  streakCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  streakCount,
}) => {
  const tabs = [
    {
      id: 'today' as TabType,
      label: 'امروز',
      icon: CheckSquare,
    },
    {
      id: 'week' as TabType,
      label: 'هفته',
      icon: Calendar,
    },
    {
      id: 'month' as TabType,
      label: 'ماه',
      icon: CalendarRange,
    },
    {
      id: 'progress' as TabType,
      label: 'پیشرفت',
      icon: Flame,
      badge: streakCount > 0 ? `${streakCount}` : undefined,
    },
    {
      id: 'settings' as TabType,
      label: 'تنظیمات',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="bottom-nav"
      className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 flex items-center justify-around z-20 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`nav-btn-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
              isActive
                ? 'text-teal-800 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <div className="absolute top-0 w-10 h-6 bg-teal-100 rounded-full -z-10 animate-fade-in" />
            )}

            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {tab.badge && (
                <span className="absolute -top-1.5 -left-2 bg-amber-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center leading-none">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
