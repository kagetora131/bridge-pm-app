import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const DAY_MS = 24 * 60 * 60 * 1000;

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** UTC midnight (ms since epoch) for an ISO date string "yyyy-MM-dd". */
export function utcMidnight(dateISO: string): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Adds `days` calendar days to an ISO date string, returned as ISO date string. */
export function addDaysISO(dateISO: string, days: number): string {
  const ms = utcMidnight(dateISO) + days * DAY_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Today's date in the browser's local calendar (not UTC — avoids an off-by-one near local midnight). */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts a member's local "HH:mm" working-hours boundary on a given local
 * calendar date + timezone into an absolute UTC instant (ms since epoch).
 */
export function localTimeToUtcMs(dateISO: string, hhmm: string, timeZone: string): number {
  return fromZonedTime(`${dateISO}T${hhmm}:00`, timeZone).getTime();
}

/** Current local time string "HH:mm" for a timezone. */
export function currentTimeInZone(timeZone: string): string {
  return formatInTimeZone(new Date(), timeZone, 'HH:mm');
}

/** Current local date+weekday label for a timezone, e.g. "8/26 (水)". */
export function currentDateLabelInZone(timeZone: string, locale: string): string {
  const zoned = toZonedTime(new Date(), timeZone);
  return zoned.toLocaleDateString(locale, {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    timeZone,
  });
}

/** Current local weekday (0=Sun...6=Sat) for a timezone. */
export function currentWeekdayInZone(timeZone: string): number {
  return toZonedTime(new Date(), timeZone).getDay();
}

/** UTC offset in minutes for a timezone at the current instant (e.g. JST -> 540). */
export function utcOffsetMinutes(timeZone: string): number {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone }));
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

export function formatHourLabel(ms: number, timeZone: string): string {
  return formatInTimeZone(new Date(ms), timeZone, 'HH:mm');
}

export function formatDateTimeLabel(ms: number, timeZone: string): string {
  return formatInTimeZone(new Date(ms), timeZone, 'yyyy-MM-dd HH:mm');
}
