import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { riskReasons } from '../lib/calendarRisk';
import { plannedPaceOnDay } from '../lib/taskProgress';
import { applyProgress, applyStatus } from '../lib/taskUpdates';
import { isWorkingNow } from '../lib/memberStatus';
import { currentTimeInZone, todayISO } from '../lib/timezone';
import { colorForProject } from '../lib/projectColors';
import { taskAmbiguousPhrases, taskGlossaryMismatches } from '../lib/translationWorkflow';
import { taskSecondaryTitle, taskTitle } from '../lib/taskText';
import {
  PROGRESS_STEPS,
  RISK_REASON_KEY,
  STATUS_KEY,
  STATUS_ORDER,
  TRANSLATION_STATUS_KEY,
  TRANSLATION_STATUS_ORDER,
} from '../lib/taskLabels';
import type { GlossaryTerm, Member, Project, Task, TaskStatus, TranslationStatus } from '../types';

type TextField = 'titleJa' | 'titleEn' | 'descriptionJa' | 'descriptionEn';

export function TaskDrawer({
  task,
  allTasks,
  members,
  projects,
  glossary,
  onUpdate,
  onDelete,
  onClose,
}: {
  task: Task;
  allTasks: Task[];
  members: Member[];
  projects: Project[];
  glossary: GlossaryTerm[];
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  // Text fields are edited locally and committed on blur/close, so typing doesn't
  // rewrite the stored task (and re-render the calendar) on every keystroke.
  const [text, setText] = useState<Record<TextField, string>>({
    titleJa: task.titleJa,
    titleEn: task.titleEn,
    descriptionJa: task.descriptionJa,
    descriptionEn: task.descriptionEn,
  });
  const commitText = () => {
    if (!text.titleJa.trim() && !text.titleEn.trim()) return;
    const changed = (Object.keys(text) as TextField[]).some((k) => text[k] !== task[k]);
    if (changed) onUpdate({ ...task, ...text });
  };

  const close = () => {
    commitText();
    onClose();
  };

  // Re-subscribed on every render so Escape always commits the latest typed text.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const update = (patch: Partial<Task>) => onUpdate({ ...task, ...patch });

  const assignee = members.find((m) => m.id === task.assigneeId);
  const project = projects.find((p) => p.id === task.projectId);
  const reasons = riskReasons(task, allTasks, today);
  const planned = plannedPaceOnDay(task, today);
  const glossaryMismatches = taskGlossaryMismatches({ ...task, ...text }, glossary);
  const ambiguousPhrases = taskAmbiguousPhrases({ ...task, ...text });
  const secondary = taskSecondaryTitle(task, lang);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onClick={close}>
      <aside
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-label={t('taskDetailHeading')}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${colorForProject(task.projectId).swatch}`} />
              {project?.name ?? t('noProject')}
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">{taskTitle(task, lang)}</h2>
            {secondary && <p className="text-xs text-slate-400">{secondary}</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              {reasons.length === 0 ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">{t('noRisks')}</span>
              ) : (
                reasons.map((r) => (
                  <span key={r} className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                    ⚠ {t(RISK_REASON_KEY[r])}
                  </span>
                ))
              )}
            </div>
          </div>
          <button type="button" onClick={close} aria-label={t('close')} className="text-xl leading-none text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('status')}>
              <select
                className="input"
                value={task.status}
                onChange={(e) => onUpdate(applyStatus(task, e.target.value as TaskStatus))}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s])}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('assignee')}>
              <select className="input" value={task.assigneeId ?? ''} onChange={(e) => update({ assigneeId: e.target.value || null })}>
                <option value="">{t('unassigned')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {assignee && (
            <p className="-mt-3 text-xs text-slate-400">
              {assignee.location} · {t('assigneeLocalNow', { time: currentTimeInZone(assignee.timezone) })} ·{' '}
              {isWorkingNow(assignee) ? t('workingNow') : t('offHoursNow')}
            </p>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold text-slate-600">{t('actualProgressLabel')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESS_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onUpdate(applyProgress(task, step))}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                    task.actualProgress === step
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {step}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => update({ actualProgress: null })}
                className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-700"
              >
                {t('progressClear')}
              </button>
            </div>
            <div className="mt-3 space-y-1.5">
              <ProgressBar label={t('actualProgressLabel')} value={task.actualProgress} color="bg-slate-900" emptyLabel={t('progressNotRecorded')} />
              <ProgressBar label={t('plannedPaceTodayLabel')} value={planned} color="bg-slate-300" emptyLabel="—" />
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{t('progressAutoStatusNote')}</p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold text-slate-600">{t('scheduleSection')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('startDate')}>
                <input type="date" className="input" value={task.startDate ?? ''} onChange={(e) => update({ startDate: e.target.value || null })} />
              </Field>
              <Field label={t('dueDate')}>
                <input type="date" className="input" value={task.dueDate ?? ''} onChange={(e) => update({ dueDate: e.target.value || null })} />
              </Field>
              <Field label={t('project')}>
                <select className="input" value={task.projectId ?? ''} onChange={(e) => update({ projectId: e.target.value || null })}>
                  <option value="">{t('noProject')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('dependsOn')}>
                <select className="input" value={task.dependsOn ?? ''} onChange={(e) => update({ dependsOn: e.target.value || null })}>
                  <option value="">{t('noDependency')}</option>
                  {allTasks
                    .filter((other) => other.id !== task.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {taskTitle(other, lang)}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-600">{t('translationSection')}</h3>
              <select
                className="input w-auto py-0.5 text-xs"
                value={task.translationStatus}
                onChange={(e) => update({ translationStatus: e.target.value as TranslationStatus })}
                aria-label={t('translationStatus')}
              >
                {TRANSLATION_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {t(TRANSLATION_STATUS_KEY[s])}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              {(['titleJa', 'titleEn'] as const).map((field) => (
                <Field key={field} label={t(field)}>
                  <input
                    className="input"
                    value={text[field]}
                    onChange={(e) => setText({ ...text, [field]: e.target.value })}
                    onBlur={commitText}
                  />
                </Field>
              ))}
              {(['descriptionJa', 'descriptionEn'] as const).map((field) => (
                <Field key={field} label={t(field)}>
                  <textarea
                    className="input"
                    rows={2}
                    value={text[field]}
                    onChange={(e) => setText({ ...text, [field]: e.target.value })}
                    onBlur={commitText}
                  />
                </Field>
              ))}
            </div>
            {glossaryMismatches.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                ⚠ {t('glossaryMismatchWarning')}: {glossaryMismatches.map((m) => `${m.termJa} → ${m.termEn}`).join(', ')}
              </p>
            )}
            {ambiguousPhrases.length > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                ⚠ {t('ambiguousPhraseWarning')}: {ambiguousPhrases.join(', ')}
              </p>
            )}
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <p className="text-[11px] text-slate-400">{t('autoSaveNote')}</p>
          <button type="button" onClick={() => onDelete(task.id)} className="text-sm text-rose-500 hover:text-rose-700">
            {t('delete')}
          </button>
        </div>
      </aside>
    </div>
  );
}

function ProgressBar({ label, value, color, emptyLabel }: { label: string; value: number | null; color: string; emptyLabel: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="w-36 shrink-0 truncate">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        {value !== null && <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />}
      </div>
      <span className="w-14 shrink-0 text-right tabular-nums">{value === null ? emptyLabel : `${value}%`}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-slate-500">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
