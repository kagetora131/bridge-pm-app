import type { Task } from '../types';
import { DAY_MS, utcMidnight } from './timezone';

/** Inclusive day count between two "yyyy-MM-dd" dates (same day = 1). */
export function daysBetweenInclusive(startISO: string, endISO: string): number {
  return Math.round((utcMidnight(endISO) - utcMidnight(startISO)) / DAY_MS) + 1;
}

function taskSpan(task: Task): { start: string; end: string } | null {
  if (!task.dueDate) return null;
  const start = task.startDate && task.startDate <= task.dueDate ? task.startDate : task.dueDate;
  return { start, end: task.dueDate };
}

/** Whether a task's start–due span covers this calendar day (independent of status). */
export function isTaskActiveOnDay(task: Task, dateISO: string): boolean {
  const span = taskSpan(task);
  return span !== null && dateISO >= span.start && dateISO <= span.end;
}

/**
 * Estimated completion percentage for a task on a given calendar day.
 * Not a report of actual work done — there is no field for that — but a
 * simple elapsed-time pace indicator (day N of D days → N/D). 'done' tasks
 * show 100% throughout, 'todo' show 0%, and 'blocked' returns null (its own
 * status badge communicates more than a misleading progress number would).
 * Returns null when dateISO falls outside the task's start–due span, too —
 * check `isTaskActiveOnDay` first to tell that apart from "blocked".
 */
export function taskProgressOnDay(task: Task, dateISO: string): number | null {
  const span = taskSpan(task);
  if (!span || dateISO < span.start || dateISO > span.end) return null;

  if (task.status === 'done') return 100;
  if (task.status === 'todo') return 0;
  if (task.status === 'blocked') return null;

  const totalDays = daysBetweenInclusive(span.start, span.end);
  const elapsedDays = daysBetweenInclusive(span.start, dateISO);
  return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
}
