import type { Task } from '../types';
import { plannedPaceOnDay } from './taskProgress';

/** Actual progress this many points (or more) below the planned pace counts as "behind schedule". */
export const BEHIND_SCHEDULE_THRESHOLD = 20;

export function isTaskOverdue(task: Task, todayISO: string): boolean {
  return task.status !== 'done' && Boolean(task.dueDate) && task.dueDate! < todayISO;
}

/** The task this one depends on, if that dependency isn't done yet — null otherwise. */
export function unresolvedDependency(task: Task, allTasks: Task[]): Task | null {
  if (!task.dependsOn) return null;
  const dependency = allTasks.find((t) => t.id === task.dependsOn);
  return dependency && dependency.status !== 'done' ? dependency : null;
}

/** Recorded actual progress lags the date-based planned pace by the threshold or more. */
export function isBehindSchedule(task: Task, todayISO: string): boolean {
  if (task.status === 'done' || task.actualProgress == null) return false;
  const planned = plannedPaceOnDay(task, todayISO);
  return planned !== null && planned - task.actualProgress >= BEHIND_SCHEDULE_THRESHOLD;
}

export type RiskReason = 'blocked' | 'overdue' | 'dependency' | 'behind';

export function riskReasons(task: Task, allTasks: Task[], todayISO: string): RiskReason[] {
  const reasons: RiskReason[] = [];
  if (task.status === 'blocked') reasons.push('blocked');
  if (isTaskOverdue(task, todayISO)) reasons.push('overdue');
  if (unresolvedDependency(task, allTasks)) reasons.push('dependency');
  if (isBehindSchedule(task, todayISO)) reasons.push('behind');
  return reasons;
}

/** A task is a "risk" worth calling out if it's blocked, overdue, waiting on an
 * unfinished dependency, or recorded as behind its planned pace. */
export function isRiskTask(task: Task, allTasks: Task[], todayISO: string): boolean {
  return riskReasons(task, allTasks, todayISO).length > 0;
}
