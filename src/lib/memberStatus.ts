import type { Member } from '../types';
import { currentDateISOInZone, currentTimeInZone, currentWeekdayInZone } from './timezone';
import { DEFAULT_WORKING_DAYS } from './weekdays';
import { isHoliday } from './holidays';
import { weekdayOfISO } from './calendar';

/** Whether `dateISO` (the member's local calendar date) is a weekly rest day or public holiday for them. */
export function isDayOff(member: Member, dateISO: string): boolean {
  const workingDays = member.workingDays ?? DEFAULT_WORKING_DAYS;
  return !workingDays.includes(weekdayOfISO(dateISO)) || isHoliday(member.timezone, dateISO);
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Whether a member is inside their working hours right now, in their own timezone. */
export function isWorkingNow(member: Member): boolean {
  const workingDays = member.workingDays ?? DEFAULT_WORKING_DAYS;
  if (!workingDays.includes(currentWeekdayInZone(member.timezone))) return false;
  if (isHoliday(member.timezone, currentDateISOInZone(member.timezone))) return false;
  const nowHHmm = currentTimeInZone(member.timezone);
  return nowHHmm >= member.workStart && nowHHmm < member.workEnd;
}

/** Minutes remaining until this member's workday ends, or null if they're not working now. */
export function minutesUntilWorkEnd(member: Member): number | null {
  if (!isWorkingNow(member)) return null;
  const nowMinutes = hhmmToMinutes(currentTimeInZone(member.timezone));
  return hhmmToMinutes(member.workEnd) - nowMinutes;
}

export interface EndingSoonMember {
  member: Member;
  minutesLeft: number;
}

export interface WorkforceSnapshot {
  workingNow: Member[];
  endingSoon: EndingSoonMember[];
}

/** Who's on the clock right now, and who's about to sign off (within `thresholdMinutes`). */
export function computeWorkforceSnapshot(members: Member[], thresholdMinutes = 60): WorkforceSnapshot {
  const workingNow = members.filter(isWorkingNow);
  const endingSoon = workingNow
    .map((member) => ({ member, minutesLeft: minutesUntilWorkEnd(member) ?? Infinity }))
    .filter((x) => x.minutesLeft <= thresholdMinutes)
    .sort((a, b) => a.minutesLeft - b.minutesLeft);
  return { workingNow, endingSoon };
}
