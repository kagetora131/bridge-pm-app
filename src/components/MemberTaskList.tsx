import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import { taskAmbiguousPhrases, taskGlossaryMismatches } from '../lib/translationWorkflow';
import { taskSecondaryTitle, taskTitle } from '../lib/taskText';
import { isBehindSchedule, isTaskOverdue, unresolvedDependency } from '../lib/calendarRisk';
import { plannedPaceOnDay } from '../lib/taskProgress';
import { applyStatus } from '../lib/taskUpdates';
import { todayISO } from '../lib/timezone';
import {
  STATUS_COLOR,
  STATUS_KEY,
  STATUS_ORDER,
  TRANSLATION_STATUS_COLOR,
  TRANSLATION_STATUS_KEY,
  TRANSLATION_STATUS_ORDER,
} from '../lib/taskLabels';
import type { GlossaryTerm, Project, Task, TaskStatus, TranslationStatus } from '../types';

const emptyDraft = {
  projectId: '',
  titleJa: '',
  titleEn: '',
  descriptionJa: '',
  descriptionEn: '',
  translationStatus: 'untranslated' as TranslationStatus,
  startDate: '',
  dueDate: '',
  status: 'todo' as TaskStatus,
  dependsOn: '',
};

export function MemberTaskList({
  memberId,
  heading,
  allTasks,
  setTasks,
  projects,
  glossary,
  onOpenTask,
  onDeleteTask,
}: {
  /** null lists the tasks nobody is assigned to. */
  memberId: string | null;
  heading: string;
  allTasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  projects: Project[];
  glossary: GlossaryTerm[];
  onOpenTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const { t, lang } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const today = todayISO();

  const myTasks = allTasks
    .filter((task) => task.assigneeId === memberId)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name;

  const startAdd = () => {
    setDraft(emptyDraft);
    setShowForm(true);
  };

  const submit = () => {
    if (!draft.titleJa.trim() && !draft.titleEn.trim()) return;
    const task: Task = {
      id: newId(),
      projectId: draft.projectId || null,
      titleJa: draft.titleJa,
      titleEn: draft.titleEn,
      descriptionJa: draft.descriptionJa,
      descriptionEn: draft.descriptionEn,
      translationStatus: draft.translationStatus,
      assigneeId: memberId,
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      status: draft.status,
      actualProgress: null,
      dependsOn: draft.dependsOn || null,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setShowForm(false);
  };

  const changeStatus = (id: string, status: TaskStatus) =>
    setTasks((prev) => prev.map((task) => (task.id === id ? applyStatus(task, status) : task)));

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">{heading}</p>
        <button type="button" onClick={startAdd} className="text-xs text-slate-500 hover:text-slate-900">
          + {t('addTask')}
        </button>
      </div>

      {showForm && (
        <div className="mb-2 grid gap-2 rounded-md bg-slate-50 p-2 sm:grid-cols-2">
          <select className="input" value={draft.projectId} onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}>
            <option value="">{t('noProject')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="input" value={draft.dependsOn} onChange={(e) => setDraft({ ...draft, dependsOn: e.target.value })}>
            <option value="">{t('noDependency')}</option>
            {allTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {taskTitle(task, lang)}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t('titleJa')}
            value={draft.titleJa}
            onChange={(e) => setDraft({ ...draft, titleJa: e.target.value })}
          />
          <input
            className="input"
            placeholder={t('titleEn')}
            value={draft.titleEn}
            onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })}
          />
          <textarea
            className="input"
            rows={2}
            placeholder={t('descriptionJa')}
            value={draft.descriptionJa}
            onChange={(e) => setDraft({ ...draft, descriptionJa: e.target.value })}
          />
          <textarea
            className="input"
            rows={2}
            placeholder={t('descriptionEn')}
            value={draft.descriptionEn}
            onChange={(e) => setDraft({ ...draft, descriptionEn: e.target.value })}
          />
          <label className="text-xs text-slate-500">
            {t('translationStatus')}
            <select
              className="input"
              value={draft.translationStatus}
              onChange={(e) => setDraft({ ...draft, translationStatus: e.target.value as TranslationStatus })}
            >
              {TRANSLATION_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {t(TRANSLATION_STATUS_KEY[s])}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            {t('startDate')}
            <input type="date" className="input" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
          </label>
          <label className="text-xs text-slate-500">
            {t('dueDate')}
            <input type="date" className="input" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
          </label>
          <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_KEY[s])}
              </option>
            ))}
          </select>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={submit} className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700">
              {t('save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {myTasks.length === 0 ? (
        <p className="text-xs text-slate-400">{t('noTasks')}</p>
      ) : (
        <ul className="space-y-1">
          {myTasks.map((task) => {
            const dependency = unresolvedDependency(task, allTasks);
            const glossaryMismatches = taskGlossaryMismatches(task, glossary);
            const ambiguousPhrases = taskAmbiguousPhrases(task);
            const secondary = taskSecondaryTitle(task, lang);
            const behind = isBehindSchedule(task, today) && !isTaskOverdue(task, today);
            const planned = plannedPaceOnDay(task, today);
            return (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <button
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className="min-w-0 flex-1 truncate text-left hover:text-slate-900"
                >
                  {projectName(task.projectId) && <span className="text-slate-400">{projectName(task.projectId)} · </span>}
                  <span className="font-medium text-slate-700">{taskTitle(task, lang)}</span>
                  {secondary && <span className="text-slate-400"> / {secondary}</span>}
                  {task.dueDate && (
                    <span className="text-slate-400">
                      {' '}
                      ({task.startDate ? `${task.startDate} 〜 ${task.dueDate}` : `${t('dueDate')}: ${task.dueDate}`})
                    </span>
                  )}
                  {task.actualProgress !== null && task.status !== 'done' && (
                    <span className={behind ? 'text-rose-600' : 'text-slate-400'}>
                      {' '}
                      · {t('progressVsPlanned', { actual: task.actualProgress, planned: planned ?? '—' })}
                    </span>
                  )}
                  {behind && <span className="text-rose-600"> ⚠ {t('riskBehindSchedule')}</span>}
                  {dependency && <span className="text-rose-600"> ⚠ {t('dependsOn')}: {taskTitle(dependency, lang)}</span>}
                  {glossaryMismatches.length > 0 && <span className="text-amber-600"> ⚠ {t('glossaryMismatchWarning')}</span>}
                  {ambiguousPhrases.length > 0 && <span className="text-amber-600"> ⚠ {t('ambiguousPhraseWarning')}</span>}
                </button>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${TRANSLATION_STATUS_COLOR[task.translationStatus]}`}>
                    {t(TRANSLATION_STATUS_KEY[task.translationStatus])}
                  </span>
                  <select
                    value={task.status}
                    onChange={(e) => changeStatus(task.id, e.target.value as TaskStatus)}
                    aria-label={t('status')}
                    className={`cursor-pointer rounded-full border-0 px-2 py-0.5 font-medium ${STATUS_COLOR[task.status]}`}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {t(STATUS_KEY[s])}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => onOpenTask(task.id)} className="text-slate-500 hover:text-slate-900">
                    {t('edit')}
                  </button>
                  <button type="button" onClick={() => onDeleteTask(task.id)} className="text-rose-500 hover:text-rose-700">
                    {t('delete')}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
