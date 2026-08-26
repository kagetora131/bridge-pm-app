export interface CalendarDay {
  iso: string; // "yyyy-MM-dd", local calendar date (matches <input type="date"> values)
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local-calendar ISO date "yyyy-MM-dd" (no timezone conversion, unlike lib/timezone's UTC-based todayISO). */
export function localISO(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Builds a flat list of day cells covering a full month, padded with the
 * trailing days of the previous/next month so the result is always a
 * multiple of 7 (ready to be chunked into calendar-grid weeks).
 */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const startWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const todayIso = localISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const cells: CalendarDay[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    const day = daysInPrevMonth - startWeekday + 1 + i;
    cells.push({ iso: localISO(year, month - 1, day), day, inCurrentMonth: false, isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = localISO(year, month, day);
    cells.push({ iso, day, inCurrentMonth: true, isToday: iso === todayIso });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= trailing; day += 1) {
    cells.push({ iso: localISO(year, month + 1, day), day, inCurrentMonth: false, isToday: false });
  }

  return cells;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
