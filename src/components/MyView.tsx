import { useI18n } from '../i18n/I18nContext';
import { isDayOff, isWorkingNow } from '../lib/memberStatus';
import { holidayOn } from '../lib/holidays';
import { riskReasons } from '../lib/calendarRisk';
import { plannedPaceOnDay } from '../lib/taskProgress';
import { computeWorkload } from '../lib/workload';
import { holidayConflictsAt, upcomingOccurrences } from '../lib/recurringMeetings';
import { currentDateISOInZone, currentDateLabelInZone, currentTimeInZone, formatDateTimeLabel, todayISO } from '../lib/timezone';
import { taskTitle } from '../lib/taskText';
import { RISK_REASON_KEY, STATUS_COLOR, STATUS_KEY } from '../lib/taskLabels';
import { colorForProject } from '../lib/projectColors';
import type { Assignment, Member, Project, RecurringMeeting, Task } from '../types';

const MEETING_LOOKAHEAD_DAYS = 14;
const MAX_MEETINGS_SHOWN = 8;

/** The "view as a member" home screen: just this person's tasks, local time, and meetings. */
export function MyView({
  viewer,
  tasks,
  members,
  projects,
  assignments,
  recurringMeetings,
  onOpenTask,
}: {
  viewer: Member;
  tasks: Task[];
  members: Member[];
  projects: Project[];
  assignments: Assignment[];
  recurringMeetings: RecurringMeeting[];
  onOpenTask: (taskId: string) => void;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const localDate = currentDateISOInZone(viewer.timezone);
  const holiday = holidayOn(viewer.timezone, localDate);
  const dayOff = isDayOff(viewer, localDate);
  const working = isWorkingNow(viewer);
  const workload = computeWorkload(viewer, assignments);

  const myTasks = tasks
    .filter((task) => task.assigneeId === viewer.id && task.status !== 'done')
    .map((task) => ({ task, reasons: riskReasons(task, tasks, today) }))
    .sort((a, b) => b.reasons.length - a.reasons.length || (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999'));

  const myMeetings = upcomingOccurrences(
    recurringMeetings.filter((rm) => rm.participantIds.includes(viewer.id)),
    today,
    MEETING_LOOKAHEAD_DAYS,
  ).slice(0, MAX_MEETINGS_SHOWN);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name;

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{t('myPageHeading', { name: viewer.name })}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('myPageIntro')}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-900 bg-slate-900 p-4 text-white">
        <div>
          <p className="text-sm font-medium">
            {viewer.name} <span className="text-slate-400">· {viewer.role}</span>
          </p>
          <p className="text-xs text-slate-400">
            {viewer.location} · {viewer.timezone}
          </p>
          <p className="mt-2 text-xs text-slate-300">
            {t('weeklyCapacity')}: {workload.totalAllocatedHours}h / {workload.capacityHours}h
            {workload.isOverloaded && (
              <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 font-medium text-white">{t('overloaded')}</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tabular-nums">{currentTimeInZone(viewer.timezone)}</p>
          <p className="text-xs text-slate-400">{currentDateLabelInZone(viewer.timezone, lang === 'ja' ? 'ja-JP' : 'en-US')}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              working ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-700 text-slate-200'
            }`}
          >
            {working ? t('workingNow') : t('offHoursNow')}
          </span>
          {(holiday || dayOff) && (
            <p className="mt-1 text-xs text-amber-300">
              {holiday ? t('todayHolidayNote', { name: holiday.name }) : t('todayDayOffNote')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('myTasksHeading')}</h3>
          {myTasks.length === 0 ? (
            <p className="text-xs text-slate-400">{t('noMyTasks')}</p>
          ) : (
            <ul className="space-y-2">
              {myTasks.map(({ task, reasons }) => {
                const planned = plannedPaceOnDay(task, today);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onOpenTask(task.id)}
                      className="w-full rounded-md border border-slate-100 p-2 text-left text-xs hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${colorForProject(task.projectId).swatch}`} />
                        {projectName(task.projectId) ?? t('noProject')}
                        {task.dueDate && <> · {t('dueDate')}: {task.dueDate}</>}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium text-slate-800">{taskTitle(task, lang)}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[task.status]}`}>{t(STATUS_KEY[task.status])}</span>
                        {reasons.map((r) => (
                          <span key={r} className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">
                            ⚠ {t(RISK_REASON_KEY[r])}
                          </span>
                        ))}
                        {task.actualProgress !== null && (
                          <span className="text-slate-500">
                            {t('progressVsPlanned', { actual: task.actualProgress, planned: planned ?? '—' })}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">{t('myMeetingsHeading')}</h3>
          {myMeetings.length === 0 ? (
            <p className="text-xs text-slate-400">{t('noMyMeetings')}</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {myMeetings.map(({ meeting, startMs }) => {
                const conflicts = holidayConflictsAt(meeting, members, startMs);
                const mine = conflicts.some((c) => c.memberId === viewer.id);
                return (
                  <li key={`${meeting.id}-${startMs}`} className="rounded-md border border-slate-100 p-2">
                    <p className="font-medium text-slate-800">{meeting.title}</p>
                    <p className="text-slate-500">
                      {formatDateTimeLabel(startMs, viewer.timezone)} ({viewer.timezone})
                    </p>
                    <p className="text-slate-400">{meeting.participantIds.map(memberName).join(', ')}</p>
                    {conflicts.length > 0 && (
                      <p className="mt-1 text-amber-700">
                        ⚠ {mine ? t('myHolidayConflict') : t('holidayConflictHeading')}:{' '}
                        {conflicts.map((c) => `${memberName(c.memberId)} (${c.holidayName})`).join(', ')}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
