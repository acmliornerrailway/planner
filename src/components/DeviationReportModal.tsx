/**
 * Manual Reporting Modal (گزارش انحرافات و ثبت مطالعه)
 * Allows reporting completed, partially completed, missed, or extra study.
 * Triggers the planning engine to recalculate only what is necessary.
 */

import React, { useState } from 'react';
import { StudyEngineState, StudyTask } from '../types';
import { toPersianDigits } from '../utils/persianCalendar';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  PlusCircle,
  X,
  FileCheck,
} from 'lucide-react';

interface DeviationReportModalProps {
  state: StudyEngineState;
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (report: {
    completedTaskIds: string[];
    incompleteTaskIds: string[];
    extraMinutesStudied: number;
    notes: string;
  }) => void;
}

export const DeviationReportModal: React.FC<DeviationReportModalProps> = ({
  state,
  dateStr,
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  if (!isOpen) return null;

  const currentPlan = state.dailyPlans[dateStr];
  const tasks: StudyTask[] = currentPlan?.tasks || [];

  const [completedIds, setCompletedIds] = useState<string[]>(
    tasks.filter((t) => t.completed).map((t) => t.id)
  );
  const [extraMinutes, setExtraMinutes] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const toggleTask = (taskId: string) => {
    if (completedIds.includes(taskId)) {
      setCompletedIds(completedIds.filter((id) => id !== taskId));
    } else {
      setCompletedIds([...completedIds, taskId]);
    }
  };

  const handleSelectAll = () => {
    setCompletedIds(tasks.map((t) => t.id));
  };

  const handleDeselectAll = () => {
    setCompletedIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incompleteIds = tasks
      .filter((t) => !completedIds.includes(t.id))
      .map((t) => t.id);

    onSubmitReport({
      completedTaskIds: completedIds,
      incompleteTaskIds: incompleteIds,
      extraMinutesStudied: Number(extraMinutes) || 0,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        id="deviation-report-modal"
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in text-stone-900"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-sm text-stone-900">گزارش انحرافات و تطبیق برنامه</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-teal-900 leading-relaxed">
            موتور مطالعه وظایف تکمیل‌نشده را شناسایی کرده، مرورهای فاصله‌دار را حفظ می‌کند و کارهای مهم باقی‌مانده را بدون تخریب سیستم مرور به روزهای آینده منتقل می‌کند.
          </div>

          {/* Task Completion Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-800">
                وضعیت اجرای وظایف امروز ({currentPlan?.persianDateLong || dateStr})
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-teal-700 hover:underline font-semibold"
                >
                  همه تکمیل شدند
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-stone-500 hover:underline"
                >
                  هیچکدام
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="p-4 bg-stone-50 rounded-xl text-center text-stone-500">
                وظیفه‌ای برای این روز ثبت نشده بود.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isChecked = completedIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-400 shrink-0" />
                        )}
                        <span className={`font-medium ${isChecked ? 'line-through opacity-80' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-latin text-stone-500">
                        {toPersianDigits(task.durationMinutes)} min
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Extra Study Time Input */}
          <div className="border-t border-stone-200 pt-3">
            <label className="block font-bold text-stone-800 mb-1">
              مطالعه اضافی خارج از برنامه (به دقیقه):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="15"
                value={extraMinutes}
                onChange={(e) => setExtraMinutes(Math.max(0, Number(e.target.value)))}
                className="w-32 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 font-latin text-xs focus:ring-2 focus:ring-teal-600"
                placeholder="0"
              />
              <span className="text-stone-500">دقیقه به کل زمان مطالعه روز افزوده می‌شود</span>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              یادداشت یا علت انحراف (اختیاری):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثلاً: وقت بیشتری صرف مرور گرامر زبان شد یا نوبت درمان بیمار طول کشید..."
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-800 text-xs focus:ring-2 focus:ring-teal-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-stone-200 pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-semibold shadow-xs transition-colors"
            >
              اعمال گزارش و بازتنظیم هوشمند برنامه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
