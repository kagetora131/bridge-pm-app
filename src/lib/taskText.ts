import type { Task, UILang } from '../types';

/** A task's title in the UI language, falling back to the other language when that translation is empty. */
export function taskTitle(task: Task, lang: UILang): string {
  return lang === 'en' ? task.titleEn || task.titleJa : task.titleJa || task.titleEn;
}

/** The title in the language *not* shown by `taskTitle`, if it exists and differs — for side-by-side display. */
export function taskSecondaryTitle(task: Task, lang: UILang): string {
  const other = lang === 'en' ? task.titleJa : task.titleEn;
  return other && other !== taskTitle(task, lang) ? other : '';
}
