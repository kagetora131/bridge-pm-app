import type { Member, MeetingDecisionLogEntry, RecurringMeeting } from '../types';
import { addDaysISO, localTimeToUtcMs, weekdayInZoneAt } from './timezone';
import { occursOn } from './recurringMeetings';
import { DEFAULT_WORKING_DAYS } from './weekdays';

/** Which of a recurring meeting's participants find its fixed slot outside their own working hours. */
export function recurringMeetingBurdenMemberIds(
  meeting: RecurringMeeting,
  members: Member[],
  referenceISO: string,
): string[] {
  let occurrenceISO: string | null = null;
  for (let offset = 0; offset < 7; offset += 1) {
    const candidateISO = addDaysISO(referenceISO, offset);
    if (occursOn(meeting, candidateISO)) {
      occurrenceISO = candidateISO;
      break;
    }
  }
  if (!occurrenceISO) return [];
  const startMs = localTimeToUtcMs(occurrenceISO, meeting.time, meeting.timezone);

  return meeting.participantIds.filter((id) => {
    const member = members.find((m) => m.id === id);
    if (!member) return false;
    const workingDays = member.workingDays ?? DEFAULT_WORKING_DAYS;
    if (!workingDays.includes(weekdayInZoneAt(startMs, member.timezone))) return true;
    const hhmm = new Intl.DateTimeFormat('en-GB', {
      timeZone: member.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(startMs);
    return !(hhmm >= member.workStart && hhmm < member.workEnd);
  });
}

export interface BurdenHistoryEntry {
  memberId: string;
  count: number;
}

/**
 * Tallies how often each member has ended up bearing an off-hours meeting —
 * both the standing recurring meetings and any ad-hoc slots the PM has
 * decided on — so a skew toward one location/member is visible at a glance.
 */
export function computeBurdenHistory(
  members: Member[],
  recurringMeetings: RecurringMeeting[],
  log: MeetingDecisionLogEntry[],
  referenceISO: string,
): BurdenHistoryEntry[] {
  const counts = new Map<string, number>();
  const bump = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);

  for (const meeting of recurringMeetings) {
    recurringMeetingBurdenMemberIds(meeting, members, referenceISO).forEach(bump);
  }
  for (const entry of log) {
    entry.burdenMemberIds.forEach(bump);
  }

  return members
    .map((m) => ({ memberId: m.id, count: counts.get(m.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}
