import { formatInTimeZone } from 'date-fns-tz';
import type { Member, RecurringMeeting } from '../types';
import { weekdayOfISO } from './calendar';
import { addDaysISO, localTimeToUtcMs } from './timezone';
import { holidayOn } from './holidays';

/** Whether a recurring meeting has an occurrence on the given calendar date. */
export function occursOn(meeting: RecurringMeeting, dateISO: string): boolean {
  if (weekdayOfISO(dateISO) !== meeting.weekday) return false;
  if (meeting.startDate && dateISO < meeting.startDate) return false;
  if (meeting.endDate && dateISO > meeting.endDate) return false;
  return true;
}

export interface MeetingOccurrence {
  meeting: RecurringMeeting;
  dateISO: string; // the meeting's own-timezone calendar date
  startMs: number;
}

/** All occurrences of the given meetings starting at or after `nowMs`, within `days` days of `fromISO`, soonest first. */
export function upcomingOccurrences(
  meetings: RecurringMeeting[],
  fromISO: string,
  nowMs: number,
  days: number,
): MeetingOccurrence[] {
  const results: MeetingOccurrence[] = [];
  // Start a day early: a meeting on "yesterday" in its own timezone can still be in the future elsewhere.
  for (let offset = -1; offset <= days; offset += 1) {
    const dateISO = addDaysISO(fromISO, offset);
    for (const meeting of meetings) {
      if (!occursOn(meeting, dateISO)) continue;
      const startMs = localTimeToUtcMs(dateISO, meeting.time, meeting.timezone);
      if (startMs >= nowMs) results.push({ meeting, dateISO, startMs });
    }
  }
  return results.sort((a, b) => a.startMs - b.startMs);
}

export interface HolidayConflict {
  memberId: string;
  holidayName: string;
}

/** Participants for whom this occurrence falls on a public holiday, judged by their own local date. */
export function holidayConflictsAt(meeting: RecurringMeeting, members: Member[], startMs: number): HolidayConflict[] {
  return meeting.participantIds.flatMap((id) => {
    const member = members.find((m) => m.id === id);
    if (!member) return [];
    const localDate = formatInTimeZone(new Date(startMs), member.timezone, 'yyyy-MM-dd');
    const holiday = holidayOn(member.timezone, localDate);
    return holiday ? [{ memberId: id, holidayName: holiday.name }] : [];
  });
}

export interface OccurrenceHolidayConflicts {
  occurrence: MeetingOccurrence;
  conflicts: HolidayConflict[];
}

/** Upcoming occurrences of one meeting (next `days` days) that land on at least one participant's holiday. */
export function upcomingHolidayConflicts(
  meeting: RecurringMeeting,
  members: Member[],
  fromISO: string,
  days = 56,
  nowMs: number = Date.now(),
): OccurrenceHolidayConflicts[] {
  return upcomingOccurrences([meeting], fromISO, nowMs, days)
    .map((occurrence) => ({ occurrence, conflicts: holidayConflictsAt(meeting, members, occurrence.startMs) }))
    .filter((x) => x.conflicts.length > 0);
}
