import type { Task } from '../types';

export function isTaskOverdue(task: Task, todayISO: string): boolean {
  return task.status !== 'done' && Boolean(task.dueDate) && task.dueDate! < todayISO;
}

/** The task this one depends on, if that dependency isn't done yet — null otherwise. */
export function unresolvedDependency(task: Task, allTasks: Task[]): Task | null {
  if (!task.dependsOn) return null;
  const dependency = allTasks.find((t) => t.id === task.dependsOn);
  return dependency && dependency.status !== 'done' ? dependency : null;
}

/** A task is a "risk" worth calling out on the calendar if it's blocked, overdue, or
 * waiting on a dependency that isn't finished yet. */
export function isRiskTask(task: Task, allTasks: Task[], todayISO: string): boolean {
  return task.status === 'blocked' || isTaskOverdue(task, todayISO) || unresolvedDependency(task, allTasks) !== null;
}
