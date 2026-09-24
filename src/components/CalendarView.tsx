import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { buildMonthGrid, chunk, weekdayOfISO } from '../lib/calendar';
import { DEFAULT_WORKING_DAYS, WEEKDAY_LABELS } from '../lib/weekdays';
import { isTaskActiveOnDay, taskProgressOnDay } from '../lib/taskProgress';
import { riskReasons, unresolvedDependency } from '../lib/calendarRisk';
import { RISK_REASON_KEY, STATUS_KEY } from '../lib/taskLabels';
import { computeScheduleConflictRanges } from '../lib/scheduleConflicts';
import { colorForProject } from '../lib/projectColors';
import { todayISO } from '../lib/timezone';
import { holidayOn } from '../lib/holidays';
import { taskTitle } from '../lib/taskText';
import type { Member, Project, Task } from '../types';

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
  onOpenTask: (taskId: string) => void;
}) {
  const { t, lang } = useI18n();
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => todayISO(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  const weeks = useMemo(() => chunk(buildMonthGrid(year, month), 7), [year, month]);

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) => projectFilter === 'all' || task.projectId === projectFilter)
        .filter((task) => memberFilter === 'all' || task.assigneeId === memberFilter),
    [tasks, projectFilter, memberFilter],
  );

  const conflictRanges = useMemo(
    () => computeScheduleConflictRanges(tasks, members, weeks.flat().map((cell) => cell.iso)),
    [tasks, members, weeks],
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
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('calendarHeading')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('calendarIntro')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
            <option value="all">{t('allMembers')}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
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

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{monthLabel}</p>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {projects.map((p) => (
            <span key={p.id} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${colorForProject(p.id).swatch}`} />
              {p.name}
            </span>
          ))}
          <span className="flex items-center gap-1 text-rose-600">{t('calendarRiskLegend')}</span>
          <span className="flex items-center gap-1 text-slate-400">{t('calendarRestDayLegend')}</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs">
        {weekdayLabels.map((w) => (
          <div key={w} className="bg-slate-50 px-2 py-1 text-center font-medium text-slate-500">
            {w}
          </div>
        ))}
        {weeks.flat().map((cell) => {
          const dayTasks = visibleTasks
            .filter((task) => isTaskActiveOnDay(task, cell.iso))
            .map((task) => {
              const assignee = members.find((m) => m.id === task.assigneeId);
              const workingDays = assignee?.workingDays ?? DEFAULT_WORKING_DAYS;
              const holiday = assignee ? holidayOn(assignee.timezone, cell.iso) : null;
              return {
                task,
                pct: taskProgressOnDay(task, cell.iso),
                reasons: riskReasons(task, tasks, todayIso),
                dependency: unresolvedDependency(task, tasks),
                isRestDay: !workingDays.includes(weekdayOfISO(cell.iso)) || holiday !== null,
                holidayName: holiday?.name ?? null,
              };
            });

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
                {dayTasks.slice(0, MAX_VISIBLE_PER_DAY).map(({ task, pct, reasons, dependency, isRestDay, holidayName }) => {
                  const risk = reasons.length > 0;
                  const color = colorForProject(task.projectId);
                  const titleParts = [memberName(task.assigneeId) ?? t('unassigned'), t(STATUS_KEY[task.status])];
                  for (const r of reasons) titleParts.push(`⚠ ${t(RISK_REASON_KEY[r])}`);
                  if (dependency) titleParts.push(`${t('dependsOn')}: ${taskTitle(dependency, lang)}`);
                  if (isRestDay) titleParts.push(holidayName ?? t('restDay'));
                  const showAsRest = isRestDay && !risk;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      title={titleParts.join(' · ')}
                      className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium hover:opacity-80 ${
                        risk
                          ? 'border border-rose-500 bg-rose-50 text-rose-700'
                          : showAsRest
                            ? 'border border-dashed border-slate-200 bg-slate-50 text-slate-400'
                            : `${color.fill} text-slate-800`
                      }`}
                    >
                      {risk && '⚠ '}
                      <span className="truncate">{taskTitle(task, lang)}</span>
                      {showAsRest ? (
                        <span className="ml-1 font-normal">({t('restDayShort')})</span>
                      ) : (
                        pct !== null && <span className="ml-1 font-normal text-slate-500">({pct}%)</span>
                      )}
                    </button>
                  );
                })}
                {dayTasks.length > MAX_VISIBLE_PER_DAY && (
                  <p className="px-1 text-slate-400">+{dayTasks.length - MAX_VISIBLE_PER_DAY}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{t('progressDisclaimer')}</p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">{t('scheduleConflictHeading')}</h3>
        <p className="mt-1 text-xs text-slate-500">{t('scheduleConflictDesc')}</p>
        {conflictRanges.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">{t('noScheduleConflicts')}</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
            {conflictRanges.map((range, idx) => (
              <li key={idx} className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{memberName(range.memberId)}</span>
                <span className="text-slate-400">
                  {range.startISO === range.endISO ? range.startISO : `${range.startISO} 〜 ${range.endISO}`}
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  {range.projectIds.map((pid) => (
                    <span key={pid ?? 'none'} className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${colorForProject(pid).swatch}`} />
                      {pid ? (projects.find((p) => p.id === pid)?.name ?? pid) : t('noProject')}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

