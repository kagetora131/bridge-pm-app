import type { CompromiseResult, Member, MeetingSlot } from '../types';
import { DAY_MS, addDaysISO, localTimeToUtcMs, utcMidnight } from './timezone';

const SLOT_MINUTES = 30;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

/**
 * Returns the member's working-hours intervals (UTC ms), clipped to the
 * [windowStart, windowEnd) window. Scans a few neighbouring local calendar
 * dates so that a member whose local "today" differs from the reference
 * UTC day still has their spillover hours represented in the window.
 */
export function memberIntervalsInWindow(
  member: Member,
  windowStart: number,
  windowEnd: number,
  referenceDateISO: string,
): MeetingSlot[] {
  const intervals: MeetingSlot[] = [];
  for (let offset = -1; offset <= 2; offset += 1) {
    const dateISO = addDaysISO(referenceDateISO, offset);
    const start = localTimeToUtcMs(dateISO, member.workStart, member.timezone);
    const end = localTimeToUtcMs(dateISO, member.workEnd, member.timezone);
    if (end <= start) continue; // overnight shifts not supported in MVP
    const clippedStart = Math.max(start, windowStart);
    const clippedEnd = Math.min(end, windowEnd);
    if (clippedEnd > clippedStart) {
      intervals.push({ startMs: clippedStart, endMs: clippedEnd });
    }
  }
  return mergeIntervals(intervals);
}

function mergeIntervals(intervals: MeetingSlot[]): MeetingSlot[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
  const merged: MeetingSlot[] = [sorted[0]];
  for (const cur of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (cur.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, cur.endMs);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function intersectIntervalSets(a: MeetingSlot[], b: MeetingSlot[]): MeetingSlot[] {
  const result: MeetingSlot[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].startMs, b[j].startMs);
    const end = Math.min(a[i].endMs, b[j].endMs);
    if (end > start) result.push({ startMs: start, endMs: end });
    if (a[i].endMs < b[j].endMs) i += 1;
    else j += 1;
  }
  return result;
}

export interface MeetingWindow {
  windowStart: number;
  windowEnd: number;
  perMember: Record<string, MeetingSlot[]>;
  fullOverlap: MeetingSlot[];
}

/** Computes each member's working intervals plus the full-overlap slots within one UTC day. */
export function computeMeetingWindow(members: Member[], referenceDateISO: string): MeetingWindow {
  const windowStart = utcMidnight(referenceDateISO);
  const windowEnd = windowStart + DAY_MS;

  const perMember: Record<string, MeetingSlot[]> = {};
  for (const m of members) {
    perMember[m.id] = memberIntervalsInWindow(m, windowStart, windowEnd, referenceDateISO);
  }

  let fullOverlap: MeetingSlot[] = members.length > 0 ? [{ startMs: windowStart, endMs: windowEnd }] : [];
  for (const m of members) {
    fullOverlap = intersectIntervalSets(fullOverlap, perMember[m.id]);
    if (fullOverlap.length === 0) break;
  }

  return { windowStart, windowEnd, perMember, fullOverlap };
}

function isSlotCoveredBy(slotStart: number, slotEnd: number, intervals: MeetingSlot[]): boolean {
  return intervals.some((iv) => iv.startMs <= slotStart && iv.endMs >= slotEnd);
}

function minutesToNearestEdge(slotCenter: number, intervals: MeetingSlot[]): { minutes: number; direction: 'before' | 'after' } {
  if (intervals.length === 0) {
    return { minutes: Infinity, direction: 'after' };
  }
  let best = { minutes: Infinity, direction: 'after' as 'before' | 'after' };
  for (const iv of intervals) {
    if (slotCenter < iv.startMs) {
      const minutes = (iv.startMs - slotCenter) / 60000;
      if (minutes < best.minutes) best = { minutes, direction: 'before' };
    } else if (slotCenter > iv.endMs) {
      const minutes = (slotCenter - iv.endMs) / 60000;
      if (minutes < best.minutes) best = { minutes, direction: 'after' };
    } else {
      return { minutes: 0, direction: 'after' };
    }
  }
  return best;
}

/**
 * When no slot works for everyone, finds the best-effort compromise: the
 * slot covering the most members, breaking ties by minimizing the total
 * "burden" (minutes outside working hours) placed on the remaining members.
 */
export function findBestCompromise(
  members: Member[],
  window: MeetingWindow,
): CompromiseResult | null {
  if (members.length === 0) return null;
  const { windowStart, windowEnd, perMember } = window;

  let best: CompromiseResult | null = null;
  let bestCoverage = -1;
  let bestBurden = Infinity;

  for (let t = windowStart; t + SLOT_MS <= windowEnd; t += SLOT_MS) {
    const slotEnd = t + SLOT_MS;
    const covered: string[] = [];
    const outside: CompromiseResult['outside'] = [];
    let burden = 0;

    for (const m of members) {
      const intervals = perMember[m.id];
      if (isSlotCoveredBy(t, slotEnd, intervals)) {
        covered.push(m.id);
      } else {
        const center = (t + slotEnd) / 2;
        const { minutes, direction } = minutesToNearestEdge(center, intervals);
        const finiteMinutes = Number.isFinite(minutes) ? minutes : 24 * 60;
        outside.push({ memberId: m.id, direction, minutesOutside: Math.round(finiteMinutes) });
        burden += finiteMinutes;
      }
    }

    if (covered.length > bestCoverage || (covered.length === bestCoverage && burden < bestBurden)) {
      bestCoverage = covered.length;
      bestBurden = burden;
      best = { slot: { startMs: t, endMs: slotEnd }, coveredMemberIds: covered, outside };
    }
  }

  return best;
}
