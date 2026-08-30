import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { buildMonthGrid, chunk } from '../lib/calendar';
import { WEEKDAY_LABELS } from '../lib/weekdays';
import { isTaskActiveOnDay, taskProgressOnDay } from '../lib/taskProgress';
import type { Member, Project, Task, TaskStatus } from '../types';

const STATUS_FILL: Record<TaskStatus, string> = {
  todo: 'bg-slate-300',
  'in-progress': 'bg-amber-400',
  blocked: 'bg-rose-400',
  done: 'bg-emerald-400',
};

const MAX_VISIBLE_PER_DAY = 4;

export function CalendarView({
  tasks,
  members,
  projects,
  onOpenTask,
}: {
  tasks: Task[];
  members: Member[];
  projects: Project[];
  onOpenTask: () => void;
}) {
  const { t, lang } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const weeks = useMemo(() => chunk(buildMonthGrid(year, month), 7), [year, month]);

  const visibleTasks = useMemo(
    () => (projectFilter === 'all' ? tasks : tasks.filter((task) => task.projectId === projectFilter)),
    [tasks, projectFilter],
  );

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
  });
  const weekdayLabels = WEEKDAY_LABELS[lang];
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name;

  // Quick-jump range: a few months back through well past the current year's
  // December, so any month can be reached in one action instead of repeated clicks.
  const jumpOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let offset = -3; offset <= 16; offset += 1) {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      options.push({
        value: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long' }),
      });
    }
    return options;
  }, [today, lang]);

  const jumpToMonth = (value: string) => {
    const [y, m] = value.split('-').map(Number);
    setYear(y);
    setMonth(m);
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{t('calendarHeading')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="all">{t('allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="prev month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t('today')}
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="next month"
          >
            ›
          </button>
          <select
            className="input w-auto"
            value={`${year}-${month}`}
            onChange={(e) => jumpToMonth(e.target.value)}
            aria-label={t('jumpToMonth')}
          >
            {jumpOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-3 text-sm font-medium text-slate-700">{monthLabel}</p>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs">
        {weekdayLabels.map((w) => (
          <div key={w} className="bg-slate-50 px-2 py-1 text-center font-medium text-slate-500">
            {w}
          </div>
        ))}
        {weeks.flat().map((cell) => {
          const dayTasks = visibleTasks
            .filter((task) => isTaskActiveOnDay(task, cell.iso))
            .map((task) => ({ task, pct: taskProgressOnDay(task, cell.iso) }));

          return (
            <div
              key={cell.iso}
              className={`min-h-24 p-1 ${cell.inCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'}`}
            >
              <p className="mb-1 text-right">
                <span
                  className={
                    cell.isToday
                      ? 'inline-block rounded-full bg-slate-900 px-1.5 text-white'
                      : cell.inCurrentMonth
                        ? 'text-slate-700'
                        : ''
                  }
                >
                  {cell.day}
                </span>
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, MAX_VISIBLE_PER_DAY).map(({ task, pct }) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={onOpenTask}
                    title={`${memberName(task.assigneeId) ?? t('unassigned')}${task.status === 'blocked' ? ` · ${t('statusBlocked')}` : ''}`}
                    className="relative block w-full overflow-hidden truncate rounded bg-slate-100 px-1 py-0.5 text-left text-slate-700 hover:bg-slate-200"
                  >
                    {pct !== null && (
                      <span className={`absolute inset-y-0 left-0 ${STATUS_FILL[task.status]}`} style={{ width: `${pct}%` }} />
                    )}
                    <span className="relative flex items-center gap-1">
                      <span className="truncate">{task.titleJa || task.titleEn}</span>
                      <span className="ml-auto shrink-0 font-medium">
                        {task.status === 'blocked' ? t('statusBlocked') : pct !== null ? `${pct}%` : ''}
                      </span>
                    </span>
                  </button>
                ))}
                {dayTasks.length > MAX_VISIBLE_PER_DAY && (
                  <p className="px-1 text-slate-400">+{dayTasks.length - MAX_VISIBLE_PER_DAY}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{t('progressDisclaimer')}</p>
    </section>
  );
}
