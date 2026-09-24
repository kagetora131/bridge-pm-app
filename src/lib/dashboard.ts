import type { Assignment, Member, MeetingSlot, Project, RecurringMeeting, Task } from '../types';
import { computeWorkloads, type MemberWorkload } from './workload';
import { computeProjectBudget, type ProjectBudget } from './budget';
import { addDaysISO, localTimeToUtcMs } from './timezone';
import { occursOn } from './recurringMeetings';
import { computeMeetingWindow, findBestCompromise, nearestAllWorkingDayISO } from './meetingSuggest';
import type { MeetingWindow } from './meetingSuggest';
import { isBehindSchedule } from './calendarRisk';

export interface BlockedTaskInfo {
  task: Task;
  dependency: Task | null;
}

/** Blocked tasks paired with the (possibly still-unfinished) task each depends on. */
export function blockedTasksWithDependencies(tasks: Task[]): BlockedTaskInfo[] {
  return tasks
    .filter((task) => task.status === 'blocked')
    .map((task) => ({
      task,
      dependency: task.dependsOn ? (tasks.find((other) => other.id === task.dependsOn) ?? null) : null,
    }));
}

export interface OverloadedMemberInfo {
  member: Member;
  workload: MemberWorkload;
}

export function overloadedMembers(members: Member[], assignments: Assignment[]): OverloadedMemberInfo[] {
  const workloads = computeWorkloads(members, assignments);
  return members
    .map((member) => ({ member, workload: workloads.get(member.id)! }))
    .filter((x) => x.workload.isOverloaded);
}

export interface OverBudgetProjectInfo {
  project: Project;
  budget: ProjectBudget;
}

export function overBudgetProjects(
  projects: Project[],
  assignments: Assignment[],
  members: Member[],
  todayISO: string,
): OverBudgetProjectInfo[] {
  const result: OverBudgetProjectInfo[] = [];
  for (const project of projects) {
    const budget = computeProjectBudget(project, assignments, members, todayISO);
    if (budget?.isOverBudgetProjected) result.push({ project, budget });
  }
  return result;
}

/** In-progress tasks whose recorded actual progress lags the planned pace (and aren't already overdue). */
export function behindScheduleTasks(tasks: Task[], todayISO: string): Task[] {
  return tasks.filter((task) => isBehindSchedule(task, todayISO) && !(task.dueDate && task.dueDate < todayISO));
}

/** Not-done tasks whose due date has already passed. */
export function overdueTasks(tasks: Task[], todayISO: string): Task[] {
  return tasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < todayISO);
}

export interface NextMeetingOccurrence {
  meeting: RecurringMeeting;
  dateISO: string;
  startMs: number;
}

/** The soonest future occurrence across all recurring meetings, as of `nowMs`. */
export function nextRecurringMeetingOccurrence(
  meetings: RecurringMeeting[],
  fromISO: string,
  nowMs: number = Date.now(),
  maxLookaheadDays = 21,
): NextMeetingOccurrence | null {
  let best: NextMeetingOccurrence | null = null;
  for (let offset = -1; offset <= maxLookaheadDays; offset += 1) {
    const candidateISO = addDaysISO(fromISO, offset);
    for (const meeting of meetings) {
      if (!occursOn(meeting, candidateISO)) continue;
      const startMs = localTimeToUtcMs(candidateISO, meeting.time, meeting.timezone);
      if (startMs < nowMs) continue;
      if (!best || startMs < best.startMs) {
        best = { meeting, dateISO: candidateISO, startMs };
      }
    }
  }
  return best;
}

export interface RecommendedSlot {
  window: MeetingWindow;
  referenceDateISO: string;
  totalMembers: number;
  coveredCount: number;
  slot: MeetingSlot | null;
  isFullOverlap: boolean;
}

/** Best available meeting window across the whole team, for a quick "can everyone even meet" glance. */
export function recommendedTeamSlot(members: Member[], todayISO: string): RecommendedSlot | null {
  if (members.length === 0) return null;
  const referenceDateISO = nearestAllWorkingDayISO(members, todayISO);
  const window = computeMeetingWindow(members, referenceDateISO);
  if (window.fullOverlap.length > 0) {
    return {
      window,
      referenceDateISO,
      totalMembers: members.length,
      coveredCount: members.length,
      slot: window.fullOverlap[0],
      isFullOverlap: true,
    };
  }
  const compromise = findBestCompromise(members, window);
  return {
    window,
    referenceDateISO,
    totalMembers: members.length,
    coveredCount: compromise?.coveredMemberIds.length ?? 0,
    slot: compromise?.slot ?? null,
    isFullOverlap: false,
  };
}

export type TodayFocusKind = 'overdueTask' | 'overBudgetProject' | 'blockedTask' | 'behindScheduleTask' | 'overloadedMember';

export interface TodayFocusItem {
  kind: TodayFocusKind;
  refId: string;
}

/** Picks the ~3 most pressing items a bridge PM should look at today, highest-severity first. */
export function computeTodayFocus(input: {
  overdue: Task[];
  overBudget: OverBudgetProjectInfo[];
  blocked: BlockedTaskInfo[];
  behind: Task[];
  overloaded: OverloadedMemberInfo[];
}, limit = 3): TodayFocusItem[] {
  const items: TodayFocusItem[] = [
    ...input.overdue.map((task): TodayFocusItem => ({ kind: 'overdueTask', refId: task.id })),
    ...input.overBudget.map((x): TodayFocusItem => ({ kind: 'overBudgetProject', refId: x.project.id })),
    ...input.blocked.map((x): TodayFocusItem => ({ kind: 'blockedTask', refId: x.task.id })),
    ...input.behind.map((task): TodayFocusItem => ({ kind: 'behindScheduleTask', refId: task.id })),
    ...input.overloaded.map((x): TodayFocusItem => ({ kind: 'overloadedMember', refId: x.member.id })),
  ];
  return items.slice(0, limit);
}
