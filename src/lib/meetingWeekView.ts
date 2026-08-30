import { formatInTimeZone } from 'date-fns-tz';
import type { RecurringMeeting } from '../types';
import { addDaysISO, localTimeToUtcMs } from './timezone';
import { weekdayOfISO } from './calendar';
import { occursOn } from './recurringMeetings';

/** The Sunday ("yyyy-MM-dd") of the week containing dateISO. */
export function startOfWeekISO(dateISO: string): string {
  return addDaysISO(dateISO, -weekdayOfISO(dateISO));
}

export interface WeekOccurrence {
  meeting: RecurringMeeting;
  dayIndex: number; // 0-6 within the supplied weekDates, already in displayTz terms
  startMinuteOfDay: number;
  endMinuteOfDay: number; // clipped to 24:00 if the meeting would cross into the next day
}

/**
 * Finds each recurring meeting's occurrence(s) that fall within a displayed
 * week, converted into `displayTz`. A meeting's weekday/time is fixed in its
 * own timezone, so converting to a different display timezone can shift
 * which calendar day it lands on — this scans a day of padding on both ends
 * of the week to catch that before placing occurrences on the grid.
 */
export function computeWeekOccurrences(
  meetings: RecurringMeeting[],
  weekDates: string[],
  displayTz: string,
): WeekOccurrence[] {
  const results: WeekOccurrence[] = [];
  const rangeStart = weekDates[0];
  const rangeEndExclusive = addDaysISO(weekDates[weekDates.length - 1], 1);

  for (const meeting of meetings) {
    for (let offset = -1; offset <= weekDates.length; offset += 1) {
      const candidateISO = addDaysISO(rangeStart, offset);
      if (!occursOn(meeting, candidateISO)) continue;

      const startUtc = localTimeToUtcMs(candidateISO, meeting.time, meeting.timezone);
      const endUtc = startUtc + meeting.durationMinutes * 60_000;

      const displayDateISO = formatInTimeZone(new Date(startUtc), displayTz, 'yyyy-MM-dd');
      if (displayDateISO < rangeStart || displayDateISO >= rangeEndExclusive) continue;
      const dayIndex = weekDates.indexOf(displayDateISO);
      if (dayIndex === -1) continue;

      const [sh, sm] = formatInTimeZone(new Date(startUtc), displayTz, 'HH:mm').split(':').map(Number);
      const startMinuteOfDay = sh * 60 + sm;

      const endDateISO = formatInTimeZone(new Date(endUtc), displayTz, 'yyyy-MM-dd');
      let endMinuteOfDay: number;
      if (endDateISO === displayDateISO) {
        const [eh, em] = formatInTimeZone(new Date(endUtc), displayTz, 'HH:mm').split(':').map(Number);
        endMinuteOfDay = eh * 60 + em;
      } else {
        endMinuteOfDay = 24 * 60; // meeting crosses midnight in the display timezone — clip for MVP
      }

      results.push({ meeting, dayIndex, startMinuteOfDay, endMinuteOfDay });
    }
  }

  return results;
}
