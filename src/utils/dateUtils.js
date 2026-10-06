import { DateTime } from 'luxon';

/**
 * Get current DateTime in specified timezone (fallback to 'UTC')
 */
export const nowInTimezone = (timezone = 'UTC') => {
  try {
    return DateTime.now().setZone(timezone);
  } catch (err) {
    return DateTime.now().setZone('UTC');
  }
};

/**
 * Get YYYY-MM-DD string in user's timezone
 */
export const getTodayDateKey = (timezone = 'UTC') => {
  return nowInTimezone(timezone).toFormat('yyyy-MM-dd');
};

/**
 * Map standard JS weekday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * Luxon weekday is 1 = Monday, 7 = Sunday.
 */
export const getStandardWeekday = (dateTime) => {
  // Luxon: 1 (Mon) -> 1, ..., 6 (Sat) -> 6, 7 (Sun) -> 0
  return dateTime.weekday === 7 ? 0 : dateTime.weekday;
};

/**
 * Convert Date or ISO string to user timezone
 */
export const toUserZone = (date, timezone = 'UTC') => {
  if (!date) return null;
  const dt = date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date);
  return dt.setZone(timezone);
};

/**
 * Combine local calendar date (YYYY-MM-DD) and time (HH:mm) into a UTC JS Date object
 */
export const createScheduledDate = (dateKey, timeStr, timezone = 'UTC') => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const dt = DateTime.fromFormat(dateKey, 'yyyy-MM-dd', { zone: timezone }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  });
  return dt.toJSDate();
};

/**
 * Generate all days in a month (YYYY-MM)
 */
export const getMonthDays = (monthKey, timezone = 'UTC') => {
  const dt = DateTime.fromFormat(monthKey, 'yyyy-MM', { zone: timezone });
  if (!dt.isValid) {
    throw new Error('Invalid month format. Expected YYYY-MM');
  }

  const daysInMonth = dt.daysInMonth;
  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDt = dt.set({ day });
    days.push({
      date: dayDt.toFormat('yyyy-MM-dd'),
      weekday: dayDt.toFormat('cccc'), // e.g. "Monday"
      weekdayIndex: getStandardWeekday(dayDt),
      dayNumber: day
    });
  }

  return days;
};

/**
 * Validates HH:mm string (24-hour)
 */
export const isValidTimeFormat = (timeStr) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
};

/**
 * Validates YYYY-MM-DD string
 */
export const isValidDateKey = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return DateTime.fromFormat(dateStr, 'yyyy-MM-dd').isValid;
};
