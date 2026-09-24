import type { Task, TaskStatus } from '../types';

/** Records actual progress and moves the status along with it: 100% completes the
 * task, any progress on a to-do starts it, and dropping below 100% reopens a done
 * task. A blocked task stays blocked until it reaches 100%. */
export function applyProgress(task: Task, progress: number): Task {
  let status: TaskStatus = task.status;
  if (progress >= 100) status = 'done';
  else if (task.status === 'done') status = 'in-progress';
  else if (task.status === 'todo' && progress > 0) status = 'in-progress';
  return { ...task, actualProgress: progress, status };
}

/** Changes status; marking a task done also records it as 100% complete. */
export function applyStatus(task: Task, status: TaskStatus): Task {
  return { ...task, status, actualProgress: status === 'done' ? 100 : task.actualProgress };
}
