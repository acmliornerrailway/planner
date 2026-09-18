/**
 * Study Planning Engine - Core Deterministic Engine
 * Implements continuous plan recalculation, spaced repetition,
 * English curriculum pacing, Dentistry 9-category rotation, and time block allocation.
 */

import {
  DayPlan,
  DentistryCategory,
  DENTISTRY_CATEGORIES,
  ENGLISH_BOOKS,
  EnglishBook,
  MonthCyclePlan,
  SpacedReview,
  StudyEngineState,
  StudyMode,
  StudyProgress,
  StudyTask,
  UnavailablePeriod,
  UserSettings,
  WeekPlan,
} from '../types';
import {
  addDays,
  diffDays,
  formatDateToString,
  formatPersianDateLong,
  formatPersianDateShort,
  formatPersianMonthDay,
  isTuesday,
  parseDateString,
  toPersianDigits,
} from '../utils/persianCalendar';

// Helper: convert HH:mm to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: convert minutes from midnight to HH:mm
export function minutesToTime(totalMinutes: number): string {
  const norm = Math.max(0, Math.min(23 * 60 + 59, Math.floor(totalMinutes)));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface RawTimeSlot {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

/**
 * Calculates available study blocks for a day given constraints.
 * Rules:
 * - Before 15:00: ~2 hour (120 min) blocks.
 * - After 15:00: ~1.5 hour (90 min) blocks.
 * - Lunch: usually 1 hour, excluded from study blocks.
 * - Unavailable periods: excluded from study blocks.
 * - Reasonable breaks (15-30 min) placed between consecutive long study blocks.
 * - Display only study blocks (no breaks/lunch in returned list).
 */
export function computeDailyStudyBlocks(
  studyStartTime: string,
  lunchStartTime: string,
  lunchDurationMinutes: number,
  studyEndTime: string,
  unavailablePeriods: UnavailablePeriod[]
): RawTimeSlot[] {
  const startMin = timeToMinutes(studyStartTime);
  const endMin = timeToMinutes(studyEndTime);
  const lunchStart = timeToMinutes(lunchStartTime);
  const lunchEnd = lunchStart + lunchDurationMinutes;

  if (startMin >= endMin) return [];

  // Create segments excluding lunch and unavailable periods
  interface Interval {
    start: number;
    end: number;
  }

  // Blocked intervals
  const blocked: Interval[] = [{ start: lunchStart, end: lunchEnd }];
  for (const period of unavailablePeriods) {
    blocked.push({
      start: timeToMinutes(period.startTime),
      end: timeToMinutes(period.endTime),
    });
  }

  // Sort blocked intervals
  blocked.sort((a, b) => a.start - b.end);

  // Merge overlapping blocked intervals
  const mergedBlocked: Interval[] = [];
  for (const b of blocked) {
    if (mergedBlocked.length === 0) {
      mergedBlocked.push({ ...b });
    } else {
      const prev = mergedBlocked[mergedBlocked.length - 1];
      if (b.start <= prev.end) {
        prev.end = Math.max(prev.end, b.end);
      } else {
        mergedBlocked.push({ ...b });
      }
    }
  }

  // Find free chunks within [startMin, endMin]
  const freeChunks: Interval[] = [];
  let cursor = startMin;

  for (const b of mergedBlocked) {
    if (b.end <= startMin || b.start >= endMin) continue;
    const bStart = Math.max(startMin, b.start);
    const bEnd = Math.min(endMin, b.end);

    if (cursor < bStart) {
      freeChunks.push({ start: cursor, end: bStart });
    }
    cursor = Math.max(cursor, bEnd);
  }

  if (cursor < endMin) {
    freeChunks.push({ start: cursor, end: endMin });
  }

  // Break free chunks into discrete study blocks
  // 15:00 = 900 minutes
  const SPLIT_TIME = 15 * 60;
  const blocks: RawTimeSlot[] = [];

  for (const chunk of freeChunks) {
    let current = chunk.start;

    while (current < chunk.end) {
      const remainingInChunk = chunk.end - current;
      if (remainingInChunk < 45) {
        // Less than 45 min is too short for a study block
        break;
      }

      const isBeforeSplit = current < SPLIT_TIME;
      const targetDuration = isBeforeSplit ? 120 : 90; // 2h before 15:00, 1.5h after 15:00
      const breakDuration = 20; // 20 min break

      let blockDuration = Math.min(targetDuration, remainingInChunk);

      // If remaining chunk after this block is tiny (e.g. < 40 min), absorb or adjust
      const potentialRemainder = remainingInChunk - blockDuration - breakDuration;
      if (potentialRemainder > 0 && potentialRemainder < 45) {
        // adjust block to take available without leaving a useless remnant
        blockDuration = Math.min(remainingInChunk, targetDuration + 15);
      }

      blocks.push({
        startTime: minutesToTime(current),
        endTime: minutesToTime(current + blockDuration),
        durationMinutes: blockDuration,
      });

      // advance cursor with break
      current += blockDuration + breakDuration;
    }
  }

  return blocks;
}

/**
 * Returns English book and lesson number for an absolute index (0 to 63)
 */
export function getEnglishLessonRef(lessonIndex: number): { book: EnglishBook; lesson: number } {
  const safeIndex = Math.max(0, Math.min(63, lessonIndex));
  const bookIndex = Math.floor(safeIndex / 16);
  const lessonNumber = (safeIndex % 16) + 1;
  return {
    book: ENGLISH_BOOKS[bookIndex],
    lesson: lessonNumber,
  };
}

/**
 * SRS Interval schedule: D0, D+1, D+3, D+7, D+14, D+30
 */
export const SRS_OFFSETS = [0, 1, 3, 7, 14, 30];

export const ACTIVE_RECALL_COMPONENTS: ('Vocabulary' | 'Grammar' | 'Conversation' | 'Listening' | 'Pronunciation')[] = [
  'Vocabulary',
  'Grammar',
  'Conversation',
  'Listening',
  'Pronunciation',
];

/**
 * Creates spaced repetition review entries for a finished study item
 */
export function createReviewsForTask(task: StudyTask): SpacedReview[] {
  const reviews: SpacedReview[] = [];
  // Stages 1 to 5 (D+1, D+3, D+7, D+14, D+30)
  for (let stage = 1; stage < SRS_OFFSETS.length; stage++) {
    const offset = SRS_OFFSETS[stage];
    const dueDate = addDays(task.date, offset);

    // Pick active recall components rotation for English
    const components =
      task.subject === 'english'
        ? [
            ACTIVE_RECALL_COMPONENTS[(stage - 1) % ACTIVE_RECALL_COMPONENTS.length],
            ACTIVE_RECALL_COMPONENTS[stage % ACTIVE_RECALL_COMPONENTS.length],
          ]
        : undefined;

    reviews.push({
      id: `rev_${task.id}_stage_${stage}_${Math.random().toString(36).substring(2, 7)}`,
      sourceTaskId: task.id,
      sourceTitle: task.title,
      subject: task.subject,
      book: task.book,
      lesson: task.lesson,
      category: task.category as DentistryCategory | undefined,
      reviewStage: stage,
      dueDate,
      completed: false,
      activeRecallComponents: components,
    });
  }
  return reviews;
}

/**
 * Checks and updates daily chain streak
 */
export function recalculateChain(
  currentDateStr: string,
  dailyPlans: Record<string, DayPlan>,
  history: StudyProgress['historyLogs'],
  existingProgress: StudyProgress
): { currentChain: number; longestChain: number } {
  // Sort dates up to yesterday
  const sortedDates = Object.keys(dailyPlans)
    .filter((d) => d <= currentDateStr)
    .sort();

  if (sortedDates.length === 0) {
    return { currentChain: 0, longestChain: 0 };
  }

  let chain = 0;
  let maxChain = existingProgress.longestChain || 0;

  // Evaluate day by day
  for (const dateStr of sortedDates) {
    const plan = dailyPlans[dateStr];
    if (!plan) continue;

    // Is it a rest day (Tuesday) with no study scheduled?
    if (plan.isRestDay && (!plan.tasks || plan.tasks.length === 0)) {
      // Tuesday rest day maintains streak without breaking!
      continue;
    }

    const hasCompletedAny = plan.tasks && plan.tasks.some((t) => t.completed);
    const hasStudyMinutes = (plan.reportedDeviations && plan.reportedDeviations.type !== 'missed') || hasCompletedAny;

    if (plan.mode === 'free') {
      // Free study preserves chain if actual study occurred
      if (hasStudyMinutes || hasCompletedAny) {
        chain++;
      }
    } else {
      // Planned study day:
      // The chain is NOT broken merely because the user partially completed a planned day.
      // Chain broken only when: there was a planned study day AND there was no study at all.
      if (hasStudyMinutes || hasCompletedAny) {
        chain++;
      } else {
        // No study at all on a planned study day -> broken
        chain = 0;
      }
    }

    if (chain > maxChain) {
      maxChain = chain;
    }
  }

  return { currentChain: chain, longestChain: maxChain };
}

/**
 * Returns the chain badge label, e.g.
 * 🔥 1, 🔥 2 ... Day 30: 🔥🎁, Day 60: 🔥🎁🎁
 */
export function getChainDisplay(chainLength: number): string {
  if (chainLength <= 0) return '۰ روز';
  let badge = `🔥 ${toPersianDigits(chainLength)}`;
  if (chainLength >= 90) {
    badge += ' 🎁🎁🎁';
  } else if (chainLength >= 60) {
    badge += ' 🎁🎁';
  } else if (chainLength >= 30) {
    badge += ' 🎁';
  }
  return badge;
}

/**
 * Core Deterministic Daily Plan Generation:
 * Previous Plan + Completed Work + Incomplete Work + Due Reviews + New Time Constraints = Updated Plan
 */
export function generateDayPlan(
  dateStr: string,
  state: StudyEngineState,
  requestedMode?: StudyMode
): DayPlan {
  const mode = requestedMode || state.settings.defaultStudyMode;
  const isTuesdayRest = isTuesday(dateStr) && state.settings.tuesdayRestPreference;

  // If Tuesday and rest preference enabled, and user has not overridden to study
  if (isTuesdayRest && !requestedMode) {
    return {
      date: dateStr,
      persianDate: formatPersianDateShort(dateStr),
      persianDateLong: formatPersianDateLong(dateStr),
      mode,
      isRestDay: true,
      tasks: [],
      totalStudyMinutes: 0,
      isCompleted: true,
    };
  }

  // 1. Calculate available time blocks
  const rawSlots = computeDailyStudyBlocks(
    state.settings.studyStartTime,
    state.settings.lunchStartTime,
    state.settings.lunchDurationMinutes,
    state.settings.studyEndTime,
    state.settings.unavailablePeriods
  );

  // If Free Study Mode:
  // "show ONLY the daily schedule. Do NOT assign subjects, lessons, or topics.
  // The daily table must contain only empty study blocks."
  if (mode === 'free') {
    const freeTasks: StudyTask[] = rawSlots.map((slot, idx) => ({
      id: `free_${dateStr}_${idx}_${slot.startTime}`,
      date: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      subject: 'general',
      title: `بلاک مطالعه آزاد ${toPersianDigits(idx + 1)} (${toPersianDigits(slot.durationMinutes)} دقیقه)`,
      taskType: 'free_block',
      completed: false,
      createdDate: dateStr,
    }));

    const totalMinutes = freeTasks.reduce((sum, t) => sum + t.durationMinutes, 0);

    return {
      date: dateStr,
      persianDate: formatPersianDateShort(dateStr),
      persianDateLong: formatPersianDateLong(dateStr),
      mode: 'free',
      isRestDay: false,
      tasks: freeTasks,
      totalStudyMinutes: totalMinutes,
      isCompleted: false,
    };
  }

  // Planned Study Mode:
  // Conflict resolution priority:
  // 1. Preserve continuity of previous plan
  // 2. Preserve due spaced reviews
  // 3. Preserve Active Recall
  // 4. Recover important overdue work
  // 5. New material
  // 6. Use remaining available time

  // Identify due reviews for this date (and overdue past reviews not yet completed)
  const pendingReviews = state.reviews.filter(
    (r) => !r.completed && r.dueDate <= dateStr
  );

  // Identify overdue/incomplete tasks from previous days
  const incompletePreviousTasks: StudyTask[] = [];
  const prevDates = Object.keys(state.dailyPlans).filter((d) => d < dateStr);
  for (const pd of prevDates) {
    const prevPlan = state.dailyPlans[pd];
    if (prevPlan && prevPlan.mode === 'planned') {
      for (const t of prevPlan.tasks) {
        if (!t.completed && t.taskType !== 'free_block') {
          // Avoid duplicate carry-forward if already placed
          incompletePreviousTasks.push(t);
        }
      }
    }
  }

  const assignedTasks: StudyTask[] = [];
  let currentEnglishLessonIdx = state.progress.currentEnglishLessonIndex || 0;
  let categoryIdx = state.nextDentistryCategoryIndex || 0;

  // Let's determine how many slots we have
  let slotIndex = 0;

  // Step A: Allocate Due Reviews & Active Recall (Priority 1, 2, 3)
  for (const rev of pendingReviews) {
    if (slotIndex >= rawSlots.length) break;
    const slot = rawSlots[slotIndex];

    let revTitle = '';
    if (rev.subject === 'english' && rev.book && rev.lesson) {
      revTitle = `مرور ${rev.book} — Lesson ${rev.lesson}`;
      if (rev.activeRecallComponents && rev.activeRecallComponents.length > 0) {
        revTitle += ` (${rev.activeRecallComponents.join(' / ')})`;
      }
    } else if (rev.subject === 'dentistry' && rev.category) {
      revTitle = `مرور ${rev.category}`;
    } else {
      revTitle = rev.sourceTitle.startsWith('مرور') ? rev.sourceTitle : `مرور ${rev.sourceTitle}`;
    }

    assignedTasks.push({
      id: `task_${dateStr}_rev_${rev.id}`,
      date: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      subject: rev.subject,
      category: rev.category,
      book: rev.book,
      lesson: rev.lesson,
      title: revTitle,
      taskType: rev.activeRecallComponents ? 'active_recall' : 'review',
      completed: false,
      createdDate: dateStr,
      reviewStage: rev.reviewStage,
      sourceTaskId: rev.sourceTaskId,
    });
    slotIndex++;
  }

  // Step B: Recover Important Overdue / Incomplete Work (Priority 4)
  for (const incTask of incompletePreviousTasks) {
    if (slotIndex >= rawSlots.length) break;
    // Don't duplicate if already added
    if (assignedTasks.some((t) => t.sourceTaskId === incTask.id || t.title === incTask.title)) {
      continue;
    }
    const slot = rawSlots[slotIndex];
    assignedTasks.push({
      id: `task_${dateStr}_rec_${incTask.id}`,
      date: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      subject: incTask.subject,
      category: incTask.category,
      book: incTask.book,
      lesson: incTask.lesson,
      title: `جبرانی: ${incTask.title}`,
      taskType: 'overdue_recovery',
      completed: false,
      createdDate: dateStr,
      sourceTaskId: incTask.id,
    });
    slotIndex++;
  }

  // Step C: New Material (English, Dentistry, AI)
  // Check how many slots remain
  // Rule 9: English pace = 3 new Lessons per week. A complete English lesson must occupy a 2-hour study block.
  // Rule 11: Dentistry 9 categories cycled logically. Minimum target 60h/month.
  // Rule 13: AI target 3-6 hours/week (e.g. 1.5h block 2-3 times/week).
  const dateObj = parseDateString(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat

  // Check if we should schedule English today:
  // Typically schedule English on Sat (6), Mon (1), Wed (3) or when slots allow (3 times per week)
  const isEnglishDay = dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 3;
  let scheduledEnglishToday = false;

  while (slotIndex < rawSlots.length) {
    const slot = rawSlots[slotIndex];

    // Try English if English day and not yet scheduled today and lesson index < 64
    if (isEnglishDay && !scheduledEnglishToday && currentEnglishLessonIdx < 64 && slot.durationMinutes >= 90) {
      const lessonRef = getEnglishLessonRef(currentEnglishLessonIdx);
      assignedTasks.push({
        id: `task_${dateStr}_eng_${currentEnglishLessonIdx}`,
        date: dateStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes,
        subject: 'english',
        book: lessonRef.book,
        lesson: lessonRef.lesson,
        title: `${lessonRef.book} — Lesson ${lessonRef.lesson}`,
        taskType: 'new_study',
        completed: false,
        createdDate: dateStr,
      });
      scheduledEnglishToday = true;
      currentEnglishLessonIdx++;
      slotIndex++;
      continue;
    }

    // Try AI on certain days (e.g., Sunday and Thursday, or when slot is ~90 min)
    const isAiDay = dayOfWeek === 0 || dayOfWeek === 4;
    const hasAiTask = assignedTasks.some((t) => t.subject === 'ai');
    if (isAiDay && !hasAiTask && slot.durationMinutes <= 105) {
      assignedTasks.push({
        id: `task_${dateStr}_ai_${slotIndex}`,
        date: dateStr,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: slot.durationMinutes,
        subject: 'ai',
        title: `AI — ${(slot.durationMinutes / 60).toFixed(1)} ساعت`,
        taskType: 'new_study',
        completed: false,
        createdDate: dateStr,
      });
      slotIndex++;
      continue;
    }

    // Dentistry category assignment (9 categories cycled logically)
    const category = DENTISTRY_CATEGORIES[categoryIdx % DENTISTRY_CATEGORIES.length];
    assignedTasks.push({
      id: `task_${dateStr}_dent_${slotIndex}_${category}`,
      date: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: slot.durationMinutes,
      subject: 'dentistry',
      category: category,
      title: `دندانپزشکی — ${category}`,
      taskType: 'new_study',
      completed: false,
      createdDate: dateStr,
    });
    categoryIdx++;
    slotIndex++;
  }

  const totalStudyMinutes = assignedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);

  return {
    date: dateStr,
    persianDate: formatPersianDateShort(dateStr),
    persianDateLong: formatPersianDateLong(dateStr),
    mode: 'planned',
    isRestDay: false,
    tasks: assignedTasks,
    totalStudyMinutes,
    isCompleted: false,
  };
}

/**
 * Builds weekly overview for a given week starting date
 */
export function buildWeeklyOverview(
  weekStartDate: string,
  weekNumber: number,
  cycleNumber: number,
  state: StudyEngineState
): WeekPlan {
  const days: DayPlan[] = [];
  const weekEndDate = addDays(weekStartDate, 6);

  let weekEnglishLessons: string[] = [];

  for (let i = 0; i < 7; i++) {
    const curDate = addDays(weekStartDate, i);
    // Reuse existing plan if already present in state, or generate deterministic plan
    let dayPlan = state.dailyPlans[curDate];
    if (!dayPlan) {
      dayPlan = generateDayPlan(curDate, state);
    }
    days.push(dayPlan);

    // Collect English lessons
    for (const t of dayPlan.tasks) {
      if (t.subject === 'english' && t.taskType === 'new_study' && t.book && t.lesson) {
        weekEnglishLessons.push(`${t.book} — Lesson ${t.lesson}`);
      }
    }
  }

  // Format English target, e.g. "Interchange — Lessons 1–3"
  let englishTarget = 'Interchange — Lessons 1–3';
  if (weekEnglishLessons.length > 0) {
    const first = weekEnglishLessons[0];
    const last = weekEnglishLessons[weekEnglishLessons.length - 1];
    englishTarget = first === last ? first : `${first.split(' — ')[0]} — Lessons ${first.split('Lesson ')[1]}–${last.split('Lesson ')[1]}`;
  } else {
    englishTarget = `Interchange — Lessons ${toPersianDigits((weekNumber - 1) * 3 + 1)}–${toPersianDigits(weekNumber * 3)}`;
  }

  const shamsiStartDate = formatPersianMonthDay(weekStartDate);
  const shamsiEndDate = formatPersianDateLong(weekEndDate).split(' ').slice(1).join(' ');

  return {
    weekNumber,
    cycleNumber,
    startDate: weekStartDate,
    endDate: weekEndDate,
    shamsiStartDate,
    shamsiEndDate,
    label: `هفته ${toPersianDigits(weekNumber)} — ${shamsiStartDate} تا ${shamsiEndDate}`,
    englishTarget,
    dentistryTargetHours: 15,
    aiTargetHours: 4.5,
    summaryReviewIncluded: true,
    days,
  };
}

/**
 * Builds 4-week monthly cycle plan
 */
export function buildMonthlyPlan(
  cycleStartDate: string,
  cycleNumber: number,
  state: StudyEngineState
): MonthCyclePlan {
  const weeks: WeekPlan[] = [];
  let curWeekStart = cycleStartDate;

  for (let w = 1; w <= 4; w++) {
    const weekNumber = (cycleNumber - 1) * 4 + w;
    const weekPlan = buildWeeklyOverview(curWeekStart, weekNumber, cycleNumber, state);
    weeks.push(weekPlan);
    curWeekStart = addDays(curWeekStart, 7);
  }

  const cycleEndDate = addDays(curWeekStart, -1);
  const startMonthDay = formatPersianMonthDay(cycleStartDate);
  const endLong = formatPersianDateLong(cycleEndDate).split(' ').slice(1).join(' ');

  return {
    cycleNumber,
    shamsiMonthName: `چرخه ${toPersianDigits(cycleNumber)} (${startMonthDay} تا ${endLong})`,
    startDate: cycleStartDate,
    endDate: cycleEndDate,
    shamsiStartEnd: `${startMonthDay} تا ${endLong}`,
    weeks,
    englishTarget: `Interchange — Lessons ${toPersianDigits((cycleNumber - 1) * 12 + 1)}–${toPersianDigits(cycleNumber * 12)}`,
    dentistryHoursTarget: 60, // 60 hours minimum per month
    aiHoursTarget: 18,
    monthlyReviewScheduled: true, // مرور کلی ماه گذشته
    simulationTestScheduled: true, // آزمون جامع شبیه‌سازی‌شده
  };
}

/**
 * Recalculate State from User Feedback / Deviations
 */
export function recalculateStateWithDeviations(
  state: StudyEngineState,
  targetDate: string,
  deviations: {
    completedTaskIds: string[];
    incompleteTaskIds: string[];
    extraMinutesStudied?: number;
    notes?: string;
  }
): StudyEngineState {
  const nextState: StudyEngineState = JSON.parse(JSON.stringify(state));
  const currentPlan = nextState.dailyPlans[targetDate];

  if (!currentPlan) return state;

  const newReviews: SpacedReview[] = [...nextState.reviews];

  // Mark tasks completed/incomplete
  let newCompletedEnglishLessons = 0;
  let totalMinutesStudiedToday = deviations.extraMinutesStudied || 0;

  for (const task of currentPlan.tasks) {
    const wasCompleted = task.completed;
    const isNowCompleted = deviations.completedTaskIds.includes(task.id);
    task.completed = isNowCompleted;

    if (isNowCompleted) {
      task.completedDate = targetDate;
      totalMinutesStudiedToday += task.durationMinutes;

      // If it was not completed before, generate spaced repetition reviews
      if (!wasCompleted) {
        if (task.taskType === 'new_study' && (task.subject === 'english' || task.subject === 'dentistry')) {
          const generatedReviews = createReviewsForTask(task);
          newReviews.push(...generatedReviews);
        }
        if (task.subject === 'english' && task.taskType === 'new_study') {
          newCompletedEnglishLessons++;
        }
      }
    } else {
      task.completedDate = undefined;
    }
  }

  // Mark corresponding review items as completed if this task was a review
  for (const task of currentPlan.tasks) {
    if (task.completed && (task.taskType === 'review' || task.taskType === 'active_recall')) {
      const matchRev = newReviews.find((r) => r.id === task.sourceTaskId || task.id.includes(r.id));
      if (matchRev) {
        matchRev.completed = true;
        matchRev.completedDate = targetDate;
      }
    }
  }

  currentPlan.reportedDeviations = {
    reportedAt: new Date().toISOString(),
    type: deviations.incompleteTaskIds.length === 0 ? 'all_done' : 'partial',
    notes: deviations.notes,
  };

  currentPlan.isCompleted = currentPlan.tasks.length > 0 && currentPlan.tasks.every((t) => t.completed);

  // Update progress
  nextState.reviews = newReviews;
  nextState.progress.englishLessonsCompleted = Math.min(
    64,
    nextState.progress.englishLessonsCompleted + newCompletedEnglishLessons
  );
  nextState.progress.currentEnglishLessonIndex = Math.max(
    nextState.progress.currentEnglishLessonIndex,
    nextState.progress.englishLessonsCompleted
  );
  nextState.progress.totalStudyMinutes += totalMinutesStudiedToday;

  // Recalculate chain
  const chainResult = recalculateChain(
    targetDate,
    nextState.dailyPlans,
    nextState.progress.historyLogs,
    nextState.progress
  );
  nextState.progress.currentChain = chainResult.currentChain;
  nextState.progress.longestChain = chainResult.longestChain;

  // Recalculate reviews counts
  nextState.progress.completedReviewsCount = newReviews.filter((r) => r.completed).length;
  nextState.progress.overdueReviewsCount = newReviews.filter((r) => !r.completed && r.dueDate < targetDate).length;

  return nextState;
}
