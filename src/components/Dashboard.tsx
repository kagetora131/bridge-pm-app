import { useI18n } from '../i18n/I18nContext';
import {
  behindScheduleTasks,
  blockedTasksWithDependencies,
  computeTodayFocus,
  nextRecurringMeetingOccurrence,
  overBudgetProjects,
  overdueTasks,
  overloadedMembers,
  recommendedTeamSlot,
  type TodayFocusItem,
} from '../lib/dashboard';
import { computeWorkforceSnapshot } from '../lib/memberStatus';
import { formatUsd } from '../lib/budget';
import { daysBetweenInclusive, plannedPaceOnDay } from '../lib/taskProgress';
import { browserTimezone, formatDateTimeLabel, formatHourLabel, todayISO } from '../lib/timezone';
import { WEEKDAY_LABELS } from '../lib/weekdays';
import { taskTitle } from '../lib/taskText';
import type { Section } from './Header';
import type { Assignment, Member, Project, RecurringMeeting, Task } from '../types';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400">{children}</p>;
}

export function Dashboard({
  members,
  assignments,
  tasks,
  projects,
  recurringMeetings,
  onNavigate,
  onOpenTask,
}: {
  members: Member[];
  assignments: Assignment[];
  tasks: Task[];
  projects: Project[];
  recurringMeetings: RecurringMeeting[];
  onNavigate: (section: Section) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const displayTz = browserTimezone();

  const { workingNow, endingSoon } = computeWorkforceSnapshot(members);
  const blocked = blockedTasksWithDependencies(tasks);
  const overloaded = overloadedMembers(members, assignments);
  const overBudget = overBudgetProjects(projects, assignments, members, today);
  const overdue = overdueTasks(tasks, today);
  const behind = behindScheduleTasks(tasks, today);
  const nextMeeting = nextRecurringMeetingOccurrence(recurringMeetings, today);
  const recommended = recommendedTeamSlot(members, today);
  const focusItems = computeTodayFocus({ overdue, overBudget, blocked, behind, overloaded });

  const titleOf = (task: Task) => taskTitle(task, lang);
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
  const projectName = (id: string | null) => (id ? (projects.find((p) => p.id === id)?.name ?? id) : null);

  const renderFocusItem = (item: TodayFocusItem, idx: number) => {
    if (item.kind === 'overdueTask') {
      const task = tasks.find((tk) => tk.id === item.refId);
      if (!task || !task.dueDate) return null;
      const days = daysBetweenInclusive(task.dueDate, today) - 1;
      return (
        <FocusRow
          key={idx}
          badge={t('dashboardOverdueBadge')}
          badgeColor="bg-rose-100 text-rose-700"
          project={projectName(task.projectId)}
          title={titleOf(task)}
          detail={`${t('dueDate')}: ${task.dueDate} (${days}${t('daysUnit')})`}
          onView={() => onOpenTask(task.id)}
        />
      );
    }
    if (item.kind === 'overBudgetProject') {
      const project = projects.find((p) => p.id === item.refId);
      if (!project) return null;
      const budget = overBudget.find((x) => x.project.id === project.id)?.budget;
      return (
        <FocusRow
          key={idx}
          badge={t('overBudgetRisk')}
          badgeColor="bg-rose-100 text-rose-700"
          title={project.name}
          detail={budget ? `${t('budgetVariance')}: ${formatUsd(budget.budgetVarianceUsd)}` : ''}
          onView={() => onNavigate('projects')}
        />
      );
    }
    if (item.kind === 'blockedTask') {
      const task = tasks.find((tk) => tk.id === item.refId);
      if (!task) return null;
      const dependency = blocked.find((b) => b.task.id === task.id)?.dependency;
      return (
        <FocusRow
          key={idx}
          badge={t('statusBlocked')}
          badgeColor="bg-amber-100 text-amber-800"
          project={projectName(task.projectId)}
          title={titleOf(task)}
          detail={`${t('dependsOn')}: ${dependency ? titleOf(dependency) : t('dashboardNoDependencyShort')}`}
          onView={() => onOpenTask(task.id)}
        />
      );
    }
    if (item.kind === 'behindScheduleTask') {
      const task = tasks.find((tk) => tk.id === item.refId);
      if (!task) return null;
      return (
        <FocusRow
          key={idx}
          badge={t('dashboardBehindBadge')}
          badgeColor="bg-amber-100 text-amber-800"
          project={projectName(task.projectId)}
          title={titleOf(task)}
          detail={t('progressVsPlanned', { actual: task.actualProgress ?? 0, planned: plannedPaceOnDay(task, today) ?? '—' })}
          onView={() => onOpenTask(task.id)}
        />
      );
    }
    const member = members.find((m) => m.id === item.refId);
    if (!member) return null;
    const workload = overloaded.find((x) => x.member.id === member.id)?.workload;
    return (
      <FocusRow
        key={idx}
        badge={t('overloaded')}
        badgeColor="bg-amber-100 text-amber-800"
        title={member.name}
        detail={workload ? `${workload.totalAllocatedHours}h / ${workload.capacityHours}h` : ''}
        onView={() => onNavigate('members')}
      />
    );
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{t('dashboardHeading')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('dashboardIntro')}</p>

      <div className="mt-4 rounded-lg border border-slate-900 bg-slate-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">{t('dashboardTodayFocusHeading')}</h3>
        {focusItems.length === 0 ? (
          <p className="text-xs text-slate-300">{t('dashboardNoFocusItems')}</p>
        ) : (
          <ul className="space-y-2">{focusItems.map(renderFocusItem)}</ul>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title={t('dashboardWorkforceHeading')}>
          {workingNow.length === 0 ? (
            <Empty>{t('dashboardNoOneWorking')}</Empty>
          ) : (
            <ul className="space-y-1 text-xs text-slate-600">
              {workingNow.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span>{m.name}</span>
                  <span className="text-slate-400">{m.location}</span>
                </li>
              ))}
            </ul>
          )}
          <h4 className="mb-1 mt-3 text-xs font-medium text-slate-500">{t('dashboardEndingSoonHeading')}</h4>
          {endingSoon.length === 0 ? (
            <Empty>{t('dashboardNoOneEndingSoon')}</Empty>
          ) : (
            <ul className="space-y-1 text-xs text-slate-600">
              {endingSoon.map(({ member, minutesLeft }) => (
                <li key={member.id} className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <span className="text-amber-700">
                    {t('dashboardMinutesUntilEndLabel')} {minutesLeft}
                    {t('minutesUnit')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('dashboardBlockedHeading')}>
          {blocked.length === 0 ? (
            <Empty>{t('dashboardNoBlockedTasks')}</Empty>
          ) : (
            <ul className="space-y-2 text-xs text-slate-600">
              {blocked.map(({ task, dependency }) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    className="text-left font-medium text-slate-800 hover:underline"
                  >
                    {projectName(task.projectId) && <span className="text-slate-400">{projectName(task.projectId)} · </span>}
                    {titleOf(task)}
                  </button>
                  <p className="text-slate-400">
                    {t('dependsOn')}: {dependency ? titleOf(dependency) : t('dashboardNoDependencyShort')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('dashboardOverloadedHeading')}>
          {overloaded.length === 0 ? (
            <Empty>{t('dashboardNoOverloadedMembers')}</Empty>
          ) : (
            <ul className="space-y-1 text-xs text-slate-600">
              {overloaded.map(({ member, workload }) => (
                <li key={member.id} className="flex items-center justify-between">
                  <span>{member.name}</span>
                  <span className="font-medium text-rose-600">
                    {workload.totalAllocatedHours}h / {workload.capacityHours}h
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('dashboardBudgetRiskHeading')}>
          {overBudget.length === 0 ? (
            <Empty>{t('dashboardNoBudgetRiskProjects')}</Empty>
          ) : (
            <ul className="space-y-2 text-xs text-slate-600">
              {overBudget.map(({ project, budget }) => (
                <li key={project.id}>
                  <p className="font-medium text-slate-800">{project.name}</p>
                  <p className="text-rose-600">
                    {t('projectedTotalCost')}: {formatUsd(budget.projectedTotalCostUsd)} / {formatUsd(project.totalBudgetUsd)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('dashboardNextMeetingHeading')}>
          {!nextMeeting ? (
            <Empty>{t('dashboardNoUpcomingMeetings')}</Empty>
          ) : (
            <div className="text-xs text-slate-600">
              <p className="font-medium text-slate-800">{nextMeeting.meeting.title}</p>
              <p className="mt-1 text-slate-500">
                {WEEKDAY_LABELS[lang][nextMeeting.meeting.weekday]} {formatDateTimeLabel(nextMeeting.startMs, displayTz)}
              </p>
              <p className="mt-1 text-slate-400">
                {nextMeeting.meeting.participantIds.map(memberName).join(', ')}
              </p>
            </div>
          )}
        </Card>

        <Card title={t('dashboardRecommendedSlotHeading')}>
          {!recommended || !recommended.slot ? (
            <Empty>{t('noFullOverlap')}</Empty>
          ) : (
            <div className="text-xs text-slate-600">
              <p className={`font-medium ${recommended.isFullOverlap ? 'text-emerald-700' : 'text-amber-700'}`}>
                {t(recommended.isFullOverlap ? 'fullOverlapFound' : 'noFullOverlap')}
              </p>
              <p className="mt-1 text-slate-800">
                {recommended.referenceDateISO} {formatHourLabel(recommended.slot.startMs, displayTz)}–
                {formatHourLabel(recommended.slot.endMs, displayTz)}
              </p>
              <p className="mt-1 text-slate-400">
                {t('dashboardMembersAvailableLabel')}: {recommended.coveredCount} / {recommended.totalMembers}
              </p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function FocusRow({
  badge,
  badgeColor,
  project,
  title,
  detail,
  onView,
}: {
  badge: string;
  badgeColor: string;
  project?: string | null;
  title: string;
  detail: string;
  onView: () => void;
}) {
  const { t } = useI18n();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-800 px-3 py-2">
      <div className="min-w-0">
        <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor}`}>{badge}</span>
        {project && <span className="mr-1 text-xs text-slate-400">{project} ·</span>}
        <span className="text-sm font-medium text-white">{title}</span>
        {detail && <span className="ml-2 text-xs text-slate-300">{detail}</span>}
      </div>
      <button type="button" onClick={onView} className="shrink-0 text-xs text-slate-300 underline hover:text-white">
        {t('dashboardViewDetails')}
      </button>
    </li>
  );
}
