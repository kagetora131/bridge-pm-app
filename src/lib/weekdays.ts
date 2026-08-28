import type { UILang } from '../types';

/** Index 0 = Sunday ... 6 = Saturday, matching Date#getDay(). */
export const WEEKDAY_LABELS: Record<UILang, string[]> = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri
