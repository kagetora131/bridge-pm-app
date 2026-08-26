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

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
