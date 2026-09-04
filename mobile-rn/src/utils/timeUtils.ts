import { ClassLecture } from '../models/Schedule';

/**
 * Returns current day name (e.g., 'Monday', 'Tuesday')
 */
export function getTodayDayName(): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[new Date().getDay()];
}

/**
 * Returns current local time string in HH:MM format (24-hour)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${hrs}:${mins}`;
}

/**
 * Converts 24-hour HH:MM time string to 12-hour AM/PM format (e.g. '08:30' -> '8:30 AM', '14:15' -> '2:15 PM')
 */
export function format12HourTime(time24: string): string {
  if (!time24 || typeof time24 !== 'string') return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;

  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${period}`;
}

/**
 * Checks if a class is currently active based on system time and day
 */
export function isClassOngoing(cls: ClassLecture, nowTime24?: string): boolean {
  const today = getTodayDayName();
  if (cls.day !== today) return false;

  const current = nowTime24 || getCurrentTimeString();
  return current >= cls.startTime && current <= cls.endTime;
}

/**
 * Calculates minutes difference between timeA (HH:MM) and timeB (HH:MM)
 */
export function getMinutesDiff(timeA: string, timeB: string): number {
  if (!timeA || !timeB) return 0;
  const [hA, mA] = timeA.split(':').map(Number);
  const [hB, mB] = timeB.split(':').map(Number);
  return (hA * 60 + mA) - (hB * 60 + mB);
}

/**
 * Formats a human-readable countdown string (e.g., 'Starts in 45 mins', 'Starts in 1h 15m')
 */
export function formatCountdown(startTime: string, nowTime24?: string): string {
  const current = nowTime24 || getCurrentTimeString();
  const diff = getMinutesDiff(startTime, current);

  if (diff <= 0) return 'Starts now';
  if (diff < 60) return `Starts in ${diff} mins`;

  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${hrs}h`;
}

/**
 * Gets all classes scheduled for today, sorted chronologically
 */
export function getTodayClasses(classes: ClassLecture[]): ClassLecture[] {
  const today = getTodayDayName();
  return classes
    .filter((c) => c.day === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Returns the next upcoming class for today
 */
export function getNextClass(classes: ClassLecture[], nowTime24?: string): ClassLecture | null {
  const current = nowTime24 || getCurrentTimeString();
  const todayClasses = getTodayClasses(classes);
  return todayClasses.find((c) => c.startTime > current) || null;
}

/**
 * Returns the second next upcoming class for today (if any)
 */
export function getSecondNextClass(classes: ClassLecture[], nowTime24?: string): ClassLecture | null {
  const current = nowTime24 || getCurrentTimeString();
  const todayClasses = getTodayClasses(classes);
  const nextIndex = todayClasses.findIndex((c) => c.startTime > current);
  if (nextIndex !== -1 && nextIndex + 1 < todayClasses.length) {
    return todayClasses[nextIndex + 1];
  }
  return null;
}

/**
 * Checks if today is Saturday or Sunday and has no active classes
 */
export function isWeekend(classes: ClassLecture[]): boolean {
  const dayIndex = new Date().getDay();
  const isWeekendDay = dayIndex === 0 || dayIndex === 6;
  if (!isWeekendDay) return false;

  const today = getTodayDayName();
  const hasClassesToday = classes.some((c) => c.day === today);
  return !hasClassesToday;
}
