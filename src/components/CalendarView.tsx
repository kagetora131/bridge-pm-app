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
// スマホのマスに出す色の点の数(これを超えたら「+n」)
const MAX_DOTS_PER_DAY = 3;

// 表示している月の「最初に選ぶ日」: 今日がその月なら今日、そうでなければ1日。
function defaultSelectedDay(year: number, month: number, todayIso: string): string {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return todayIso.startsWith(prefix) ? todayIso : `${prefix}-01`;
}

export function CalendarView({
  tasks,
  members,
  projects,
  onOpenTask,
  defaultMemberId,
}: {
  tasks: Task[];
  members: Member[];
  projects: Project[];
  onOpenTask: (taskId: string) => void;
  defaultMemberId?: string;
}) {
  const { t, lang } = useI18n();
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => todayISO(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>(defaultMemberId ?? 'all');
  // スマホ用: 日を押すと、その日のタスクの一覧を表の下に出す
  const [selectedIso, setSelectedIso] = useState<string>(() => defaultSelectedDay(today.getFullYear(), today.getMonth(), todayIso));

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

  const goToMonth = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelectedIso(defaultSelectedDay(y, m, todayIso));
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    goToMonth(next.getFullYear(), next.getMonth());
  };

  const goToday = () => goToMonth(today.getFullYear(), today.getMonth());

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
    goToMonth(y, m);
  };

  // その日に進行中のタスクと、表示に使う情報(PCの表・スマホのマス・スマホの一覧で共通)
  const itemsOn = (iso: string) =>
    visibleTasks
      .filter((task) => isTaskActiveOnDay(task, iso))
      .map((task) => {
        const assignee = members.find((m) => m.id === task.assigneeId);
        const workingDays = assignee?.workingDays ?? DEFAULT_WORKING_DAYS;
        const holiday = assignee ? holidayOn(assignee.timezone, iso) : null;
        return {
          task,
          pct: taskProgressOnDay(task, iso),
          reasons: riskReasons(task, tasks, todayIso),
          dependency: unresolvedDependency(task, tasks),
          isRestDay: !workingDays.includes(weekdayOfISO(iso)) || holiday !== null,
          holidayName: holiday?.name ?? null,
        };
      });

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 sm:text-[11px]">
      {projects.map((p) => (
        <span key={p.id} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${colorForProject(p.id).swatch}`} />
          {p.name}
        </span>
      ))}
      <span className="flex items-center gap-1 text-rose-600">{t('calendarRiskLegend')}</span>
      <span className="flex items-center gap-1 text-slate-400">{t('calendarRestDayLegend')}</span>
    </div>
  );

  const selectedItems = itemsOn(selectedIso);
  const selectedLabel = `${selectedIso} (${weekdayLabels[weekdayOfISO(selectedIso)]})`;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('calendarHeading')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('calendarIntro')}</p>
        </div>
        {/* スマホでは「メンバー・プロジェクト」を1行、「前月・今日・翌月・月の選択」を1行の計2行に収める */}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <select className="input min-w-0 sm:w-auto" value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
            <option value="all">{t('allMembers')}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select className="input min-w-0 sm:w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="all">{t('allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="col-span-2 flex items-center gap-2 sm:contents">
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
              className="input min-w-0 flex-1 sm:w-auto sm:flex-none"
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
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{monthLabel}</p>
        <div className="hidden sm:block">{legend}</div>
      </div>

      {/* スマホ用: 凡例と注記は畳んでおく(最初は閉じる) */}
      <details className="mb-3 rounded-lg border border-slate-200 bg-white px-3 sm:hidden">
        <summary className="flex cursor-pointer items-center text-sm text-slate-600">{t('calendarLegendToggle')}</summary>
        <div className="space-y-2 pb-3">
          {legend}
          <p className="text-xs text-slate-500">{t('progressDisclaimer')}</p>
        </div>
      </details>

      {/* スマホ用: マスは日付と色の点だけ。日を押すと、下にその日のタスクの一覧を出す */}
      <div className="sm:hidden">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs">
          {weekdayLabels.map((w) => (
            <div key={w} className="bg-slate-50 px-1 py-1 text-center font-medium text-slate-500">
              {w}
            </div>
          ))}
          {weeks.flat().map((cell) => {
            const items = itemsOn(cell.iso);
            const hasRisk = items.some((item) => item.reasons.length > 0);
            const selected = cell.iso === selectedIso;
            return (
              <button
                key={cell.iso}
                type="button"
                data-compact
                onClick={() => setSelectedIso(cell.iso)}
                aria-pressed={selected}
                aria-label={t('calendarDayAria', { date: cell.iso, n: items.length })}
                className={`relative flex h-14 flex-col items-center justify-start gap-1 p-1 ${
                  cell.inCurrentMonth ? 'bg-white text-slate-700' : 'bg-slate-50 text-slate-300'
                } ${selected ? 'ring-2 ring-inset ring-slate-900' : ''}`}
              >
                <span className={cell.isToday ? 'inline-block rounded-full bg-slate-900 px-1.5 text-white' : ''}>{cell.day}</span>
                <span className="flex items-center justify-center gap-0.5">
                  {items.slice(0, MAX_DOTS_PER_DAY).map(({ task, isRestDay, reasons }) => (
                    <span
                      key={task.id}
                      className={`h-2 w-2 rounded-full ${colorForProject(task.projectId).swatch} ${
                        isRestDay && reasons.length === 0 ? 'opacity-30' : ''
                      }`}
                    />
                  ))}
                  {items.length > MAX_DOTS_PER_DAY && (
                    <span className="text-xs leading-none text-slate-500">+{items.length - MAX_DOTS_PER_DAY}</span>
                  )}
                </span>
                {hasRisk && (
                  <span aria-hidden="true" className="absolute right-0.5 top-0.5 text-xs leading-none text-rose-600">
                    ⚠
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-900">{t('calendarSelectedDay', { date: selectedLabel })}</h3>
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t('calendarNoTasksOnDay')}</p>
          ) : (
            <ul className="mt-1 divide-y divide-slate-100">
              {selectedItems.map(({ task, pct, reasons, dependency, isRestDay, holidayName }) => {
                const risk = reasons.length > 0;
                const project = projects.find((p) => p.id === task.projectId);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className="flex w-full items-start gap-2 py-2.5 text-left"
                    >
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${colorForProject(task.projectId).swatch}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">
                          {risk && <span className="text-rose-600">⚠ </span>}
                          {taskTitle(task, lang)}
                          {pct !== null && <span className="ml-1 font-normal text-slate-500">({pct}%)</span>}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {project?.name ?? t('noProject')} · {memberName(task.assigneeId) ?? t('unassigned')} · {t(STATUS_KEY[task.status])}
                        </span>
                        {risk && (
                          <span className="block text-xs text-rose-600">{reasons.map((r) => t(RISK_REASON_KEY[r])).join(' / ')}</span>
                        )}
                        {dependency && (
                          <span className="block text-xs text-slate-500">
                            {t('dependsOn')}: {taskTitle(dependency, lang)}
                          </span>
                        )}
                        {isRestDay && <span className="block text-xs text-slate-400">{holidayName ?? t('restDay')}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* PC用: 今までどおりの月の表 */}
      <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs sm:grid">
        {weekdayLabels.map((w) => (
          <div key={w} className="bg-slate-50 px-2 py-1 text-center font-medium text-slate-500">
            {w}
          </div>
        ))}
        {weeks.flat().map((cell) => {
          const dayTasks = itemsOn(cell.iso);

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
                  const project = projects.find((p) => p.id === task.projectId);
                  const titleParts = [
                    project?.name ?? t('noProject'),
                    memberName(task.assigneeId) ?? t('unassigned'),
                    t(STATUS_KEY[task.status]),
                  ];
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
                        // リスクありでも背景は元のプロジェクト色のまま保ち、左に赤の縁取りだけ足す
                        // (以前は背景を丸ごと赤にしていたため、どのプロジェクトの
                        // タスクか分からなくなり、リスク項目が多い日は赤一色に見えていた)
                        risk
                          ? `border-l-4 border-rose-600 ${color.fill} text-slate-900`
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
      <p className="mt-2 hidden text-[11px] text-slate-400 sm:block">{t('progressDisclaimer')}</p>

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
