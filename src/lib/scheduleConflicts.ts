import type { Member, Task } from '../types';
import { isTaskActiveOnDay } from './taskProgress';
import { addDaysISO } from './timezone';

interface DailyConflict {
  memberId: string;
  dateISO: string;
  projectIds: (string | null)[];
}

export interface MemberConflictRange {
  memberId: string;
  projectIds: (string | null)[];
  startISO: string;
  endISO: string;
}

/**
 * Finds members whose assigned tasks from 2+ distinct projects are active on
 * the same calendar day within `datesISO` (a bridge PM needs to know when
 * someone is nominally booked on more than one project at once), then merges
 * consecutive days with the same project pair into compact ranges.
 */
export function computeScheduleConflictRanges(
  tasks: Task[],
  members: Member[],
  datesISO: string[],
): MemberConflictRange[] {
  const sortedDates = [...datesISO].sort();
  const daily: DailyConflict[] = [];

  for (const member of members) {
    const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
    if (memberTasks.length < 2) continue;
    for (const dateISO of sortedDates) {
      const activeToday = memberTasks.filter((t) => isTaskActiveOnDay(t, dateISO));
      const distinctProjects = [...new Set(activeToday.map((t) => t.projectId))];
      if (distinctProjects.length >= 2) {
        daily.push({ memberId: member.id, dateISO, projectIds: distinctProjects });
      }
    }
  }

  const bySignature = new Map<string, DailyConflict[]>();
  for (const entry of daily) {
    const signature = `${entry.memberId}:${[...entry.projectIds].sort().join(',')}`;
    if (!bySignature.has(signature)) bySignature.set(signature, []);
    bySignature.get(signature)!.push(entry);
  }

  const ranges: MemberConflictRange[] = [];
  for (const entries of bySignature.values()) {
    entries.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    let rangeStart = entries[0].dateISO;
    let prev = entries[0];
    for (let i = 1; i < entries.length; i += 1) {
      const cur = entries[i];
      if (addDaysISO(prev.dateISO, 1) !== cur.dateISO) {
        ranges.push({ memberId: prev.memberId, projectIds: prev.projectIds, startISO: rangeStart, endISO: prev.dateISO });
        rangeStart = cur.dateISO;
      }
      prev = cur;
    }
    ranges.push({ memberId: prev.memberId, projectIds: prev.projectIds, startISO: rangeStart, endISO: prev.dateISO });
  }

  return ranges.sort((a, b) => a.startISO.localeCompare(b.startISO));
}
