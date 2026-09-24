import type { Member, MeetingSlot } from '../types';
import { computeMeetingWindow } from './meetingSuggest';
import { isDayOff } from './memberStatus';
import { addDaysISO } from './timezone';

const SLOT_MINUTES = 15;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

/** Members based in Japan are treated as the "JP side" of the bridge; everyone
 * else is "overseas" — matches this app's own offshore-bridge framing. */
function isJpMember(member: Member): boolean {
  return member.timezone === 'Asia/Tokyo';
}

function overlapMinutes(slotStart: number, slotEnd: number, intervals: MeetingSlot[]): number {
  let total = 0;
  for (const iv of intervals) {
    const s = Math.max(slotStart, iv.startMs);
    const e = Math.min(slotEnd, iv.endMs);
    if (e > s) total += (e - s) / 60000;
  }
  return total;
}

interface MemberBurden {
  memberId: string;
  burdenMinutes: number;
}

interface RawCandidate {
  slot: MeetingSlot;
  burdens: MemberBurden[];
}

type Comparator = (a: RawCandidate, b: RawCandidate) => number;

function sumBurdenFor(burdens: MemberBurden[], ids: Set<string>): number {
  return burdens.filter((b) => ids.has(b.memberId)).reduce((sum, b) => sum + b.burdenMinutes, 0);
}

function totalBurden(burdens: MemberBurden[]): number {
  return burdens.reduce((sum, b) => sum + b.burdenMinutes, 0);
}

function compareOptimal(a: RawCandidate, b: RawCandidate): number {
  const diff = totalBurden(a.burdens) - totalBurden(b.burdens);
  return diff !== 0 ? diff : a.slot.startMs - b.slot.startMs;
}

function compareByGroupPriority(primaryIds: Set<string>, secondaryIds: Set<string>): Comparator {
  return (a, b) => {
    const pa = sumBurdenFor(a.burdens, primaryIds);
    const pb = sumBurdenFor(b.burdens, primaryIds);
    if (pa !== pb) return pa - pb;
    const sa = sumBurdenFor(a.burdens, secondaryIds);
    const sb = sumBurdenFor(b.burdens, secondaryIds);
    if (sa !== sb) return sa - sb;
    return a.slot.startMs - b.slot.startMs;
  };
}

function searchBestSlot(
  members: Member[],
  perMember: Record<string, MeetingSlot[]>,
  windowStart: number,
  windowEnd: number,
  durationMs: number,
  comparator: Comparator,
): RawCandidate | null {
  let best: RawCandidate | null = null;
  for (let t = windowStart; t + durationMs <= windowEnd; t += SLOT_MS) {
    const slotEnd = t + durationMs;
    const burdens: MemberBurden[] = members.map((m) => {
      const insideMinutes = overlapMinutes(t, slotEnd, perMember[m.id] ?? []);
      return { memberId: m.id, burdenMinutes: durationMs / 60000 - insideMinutes };
    });
    const candidate: RawCandidate = { slot: { startMs: t, endMs: slotEnd }, burdens };
    if (!best || comparator(candidate, best) < 0) best = candidate;
  }
  return best;
}

export type MeetingCandidateKind = 'optimal' | 'jpEarly' | 'overseasAfterHours';

export interface MeetingCandidateMemberInfo {
  memberId: string;
  burdenMinutes: number;
  isOutside: boolean;
}

export interface MeetingCandidate {
  kind: MeetingCandidateKind;
  slot: MeetingSlot;
  perMember: MeetingCandidateMemberInfo[];
  coveredCount: number;
  totalMembers: number;
  /** 0 (everyone fully outside their hours) to 100 (nobody bears any burden). */
  fairnessScore: number;
  burdenMemberIds: string[];
}

function toCandidate(kind: MeetingCandidateKind, raw: RawCandidate, durationMinutes: number): MeetingCandidate {
  const perMember = raw.burdens.map((b) => ({
    memberId: b.memberId,
    burdenMinutes: Math.round(b.burdenMinutes),
    isOutside: b.burdenMinutes > 0,
  }));
  const coveredCount = perMember.filter((m) => !m.isOutside).length;
  const burden = totalBurden(raw.burdens);
  const fairnessScore = Math.round(
    Math.max(0, 100 - (burden / (raw.burdens.length * durationMinutes)) * 100),
  );
  return {
    kind,
    slot: raw.slot,
    perMember,
    coveredCount,
    totalMembers: perMember.length,
    fairnessScore,
    burdenMemberIds: perMember.filter((m) => m.isOutside).map((m) => m.memberId),
  };
}

/**
 * Builds up to 3 candidate slots for a meeting of `durationMinutes`:
 * - "optimal": lowest total burden across everyone.
 * - "jpEarly": minimizes overseas members' burden first (JP side takes an early start instead).
 * - "overseasAfterHours": minimizes JP members' burden first (overseas side takes the after-hours slot instead).
 * The latter two are only produced when the team actually spans both JP and overseas members.
 */
export function findMeetingCandidates(
  members: Member[],
  referenceDateISO: string,
  durationMinutes: number,
): MeetingCandidate[] {
  if (members.length === 0) return [];
  const window = computeMeetingWindow(members, referenceDateISO);
  const durationMs = durationMinutes * 60 * 1000;

  const jpIds = new Set(members.filter(isJpMember).map((m) => m.id));
  const overseasIds = new Set(members.filter((m) => !isJpMember(m)).map((m) => m.id));

  const build = (kind: MeetingCandidateKind, comparator: Comparator): MeetingCandidate | null => {
    const raw = searchBestSlot(members, window.perMember, window.windowStart, window.windowEnd, durationMs, comparator);
    return raw ? toCandidate(kind, raw, durationMinutes) : null;
  };

  const candidates: MeetingCandidate[] = [];
  const optimal = build('optimal', compareOptimal);
  if (optimal) candidates.push(optimal);

  if (jpIds.size > 0 && overseasIds.size > 0) {
    const jpEarly = build('jpEarly', compareByGroupPriority(overseasIds, jpIds));
    const overseasAfterHours = build('overseasAfterHours', compareByGroupPriority(jpIds, overseasIds));
    if (jpEarly) candidates.push(jpEarly);
    if (overseasAfterHours) candidates.push(overseasAfterHours);
  }

  return candidates;
}

export interface DayComparison {
  dateISO: string;
  best: MeetingCandidate;
}

/**
 * The best ("optimal") candidate on each of the next `count` days that everyone
 * works — or, if the group shares no working day at all, days anyone works — so
 * the PM can see which day is fairest instead of only the best time on one day.
 */
export function compareUpcomingDays(
  members: Member[],
  fromISO: string,
  durationMinutes: number,
  count = 5,
  maxLookaheadDays = 21,
  nowMs: number = Date.now(),
): DayComparison[] {
  if (members.length === 0) return [];
  const collect = (qualifies: (dateISO: string) => boolean) => {
    const days: DayComparison[] = [];
    for (let offset = 0; offset <= maxLookaheadDays && days.length < count; offset += 1) {
      const dateISO = addDaysISO(fromISO, offset);
      if (!qualifies(dateISO)) continue;
      const best = findMeetingCandidates(members, dateISO, durationMinutes)[0];
      // Skip a day whose best slot has already started (e.g. today's afternoon slot, viewed in the evening).
      if (best && best.slot.startMs >= nowMs) days.push({ dateISO, best });
    }
    return days;
  };
  const days = collect((d) => members.every((m) => !isDayOff(m, d)));
  return days.length > 0 ? days : collect((d) => members.some((m) => !isDayOff(m, d)));
}
