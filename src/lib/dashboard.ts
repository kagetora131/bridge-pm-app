import type { Assignment, Member, MeetingSlot, Project, RecurringMeeting, Task } from '../types';
import { computeWorkloads, type MemberWorkload } from './workload';
import { computeProjectBudget, type ProjectBudget } from './budget';
import { upcomingOccurrences, type MeetingOccurrence } from './recurringMeetings';
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

/** The soonest future occurrence across all recurring meetings, as of `nowMs`. */
export function nextRecurringMeetingOccurrence(
  meetings: RecurringMeeting[],
  fromISO: string,
  nowMs: number = Date.now(),
  maxLookaheadDays = 21,
): MeetingOccurrence | null {
  return upcomingOccurrences(meetings, fromISO, maxLookaheadDays, nowMs)[0] ?? null;
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

/**
 * Picks the ~3 most pressing items a bridge PM should look at today.
 *
 * "Overdue" and "over-budget" are shown with a red badge (the most severe), while
 * "blocked" / "behind schedule" / "overloaded" get an amber badge. When there happen
 * to be 3+ overdue tasks, taking the top 3 by raw priority would fill every slot with
 * red items and bury any blocked/behind/overloaded items that also need attention —
 * the panel reads as "everything is on fire" even when it's one project's problem.
 * So: surface at most one red item, then fill the rest from the amber categories
 * (round-robin, so one bad project's many blocked tasks don't crowd out others).
 * Only fall back to a second red item if there aren't enough amber items to fill the panel.
 */
export function computeTodayFocus(input: {
  overdue: Task[];
  overBudget: OverBudgetProjectInfo[];
  blocked: BlockedTaskInfo[];
  behind: Task[];
  overloaded: OverloadedMemberInfo[];
}, limit = 3): TodayFocusItem[] {
  const redQueues: TodayFocusItem[][] = [
    input.overdue.map((task): TodayFocusItem => ({ kind: 'overdueTask', refId: task.id })),
    input.overBudget.map((x): TodayFocusItem => ({ kind: 'overBudgetProject', refId: x.project.id })),
  ];
  const amberQueues: TodayFocusItem[][] = [
    input.blocked.map((x): TodayFocusItem => ({ kind: 'blockedTask', refId: x.task.id })),
    input.behind.map((task): TodayFocusItem => ({ kind: 'behindScheduleTask', refId: task.id })),
    input.overloaded.map((x): TodayFocusItem => ({ kind: 'overloadedMember', refId: x.member.id })),
  ];

  function roundRobin(queues: TodayFocusItem[][], max: number): TodayFocusItem[] {
    const remaining = queues.map((q) => [...q]);
    const out: TodayFocusItem[] = [];
    let tookAny = true;
    while (out.length < max && tookAny) {
      tookAny = false;
      for (const q of remaining) {
        if (out.length >= max) break;
        const next = q.shift();
        if (next) {
          out.push(next);
          tookAny = true;
        }
      }
    }
    return out;
  }

  const allRed = roundRobin(redQueues, limit);
  const firstRed = allRed.slice(0, Math.min(1, limit));
  const ambers = roundRobin(amberQueues, limit - firstRed.length);
  const extraRed = allRed.slice(firstRed.length, limit - ambers.length);
  return [...firstRed, ...ambers, ...extraRed];
}
