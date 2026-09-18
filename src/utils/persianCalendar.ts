/**
 * Persian (Solar Hijri / Jalali) Calendar Converter and Formatter
 * Complies with Iranian standard astronomical Solar Hijri calendar.
 */

export interface JalaliDate {
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 31
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEK_DAYS = [
  'یکشنبه', // Sunday = 0
  'دوشنبه', // Monday = 1
  'سه‌شنبه', // Tuesday = 2
  'چهارشنبه', // Wednesday = 3
  'پنجشنبه', // Thursday = 4
  'جمعه', // Friday = 5
  'شنبه', // Saturday = 6
];

/**
 * Converts Gregorian date to Jalali (Solar Hijri)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { year: jy, month: jm, day: jd };
}

/**
 * Converts Jalali date to Gregorian
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  return { year: gy, month: gm, day: days + 1 };
}

/**
 * Converts English digits (0-9) to Persian digits (۰-۹)
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Parses a YYYY-MM-DD string into a Date object at UTC midnight to avoid timezone shifts
 */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts YYYY-MM-DD to Jalali date object
 */
export function getJalaliFromDateStr(dateStr: string): JalaliDate {
  const [gy, gm, gd] = dateStr.split('-').map(Number);
  return gregorianToJalali(gy, gm, gd);
}

/**
 * Formats YYYY-MM-DD to Persian date string: ۱۴۰۵/۰۶/۲۶
 */
export function formatPersianDateShort(dateStr: string): string {
  const j = getJalaliFromDateStr(dateStr);
  const m = String(j.month).padStart(2, '0');
  const d = String(j.day).padStart(2, '0');
  return toPersianDigits(`${j.year}/${m}/${d}`);
}

/**
 * Formats YYYY-MM-DD to long Persian string: پنجشنبه ۲۶ شهریور ۱۴۰۵
 */
export function formatPersianDateLong(dateStr: string): string {
  const date = parseDateString(dateStr);
  const dayOfWeek = PERSIAN_WEEK_DAYS[date.getDay()];
  const j = getJalaliFromDateStr(dateStr);
  const monthName = PERSIAN_MONTH_NAMES[j.month - 1];
  return `${dayOfWeek} ${toPersianDigits(j.day)} ${monthName} ${toPersianDigits(j.year)}`;
}

/**
 * Returns month and day e.g. "۲۶ شهریور"
 */
export function formatPersianMonthDay(dateStr: string): string {
  const j = getJalaliFromDateStr(dateStr);
  const monthName = PERSIAN_MONTH_NAMES[j.month - 1];
  return `${toPersianDigits(j.day)} ${monthName}`;
}

/**
 * Returns Persian day of the week (e.g. "سه‌شنبه")
 */
export function getPersianDayOfWeek(dateStr: string): string {
  const date = parseDateString(dateStr);
  return PERSIAN_WEEK_DAYS[date.getDay()];
}

/**
 * Returns true if date is Tuesday (سه‌شنبه)
 */
export function isTuesday(dateStr: string): boolean {
  const date = parseDateString(dateStr);
  return date.getDay() === 2; // Sunday=0, Monday=1, Tuesday=2
}

/**
 * Add days to YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateToString(d);
}

/**
 * Diff in days between two YYYY-MM-DD dates (d2 - d1)
 */
export function diffDays(d1Str: string, d2Str: string): number {
  const d1 = parseDateString(d1Str);
  const d2 = parseDateString(d2Str);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Format minutes into Persian hours string (e.g. "۲ ساعت و ۳۰ دقیقه" or "۲ ساعت")
 */
export function formatMinutesToPersianHours(totalMinutes: number): string {
  if (totalMinutes <= 0) return '۰ ساعت';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) {
    return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`;
  }
  if (hours > 0) {
    return `${toPersianDigits(hours)} ساعت`;
  }
  return `${toPersianDigits(mins)} دقیقه`;
}
