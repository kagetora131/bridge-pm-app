import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import { taskAmbiguousPhrases, taskGlossaryMismatches } from '../lib/translationWorkflow';
import { taskSecondaryTitle, taskTitle } from '../lib/taskText';
import type { GlossaryTerm, Project, Task, TaskStatus, TranslationStatus } from '../types';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done'];
const STATUS_KEY: Record<TaskStatus, 'statusTodo' | 'statusInProgress' | 'statusBlocked' | 'statusDone'> = {
  todo: 'statusTodo',
  'in-progress': 'statusInProgress',
  blocked: 'statusBlocked',
  done: 'statusDone',
};
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-amber-100 text-amber-800',
  blocked: 'bg-rose-100 text-rose-800',
  done: 'bg-emerald-100 text-emerald-800',
};

const TRANSLATION_STATUS_ORDER: TranslationStatus[] = ['untranslated', 'draft', 'reviewed'];
const TRANSLATION_STATUS_KEY: Record<TranslationStatus, 'translationStatusUntranslated' | 'translationStatusDraft' | 'translationStatusReviewed'> = {
  untranslated: 'translationStatusUntranslated',
  draft: 'translationStatusDraft',
  reviewed: 'translationStatusReviewed',
};
const TRANSLATION_STATUS_COLOR: Record<TranslationStatus, string> = {
  untranslated: 'bg-slate-100 text-slate-500',
  draft: 'bg-sky-100 text-sky-800',
  reviewed: 'bg-emerald-100 text-emerald-800',
};

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
  allTasks,
  setTasks,
  projects,
  glossary,
}: {
  memberId: string;
  allTasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  projects: Project[];
  glossary: GlossaryTerm[];
}) {
  const { t, lang } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  const myTasks = allTasks
    .filter((task) => task.assigneeId === memberId)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name;

  const startAdd = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (task: Task) => {
    setDraft({
      projectId: task.projectId ?? '',
      titleJa: task.titleJa,
      titleEn: task.titleEn,
      descriptionJa: task.descriptionJa,
      descriptionEn: task.descriptionEn,
      translationStatus: task.translationStatus,
      startDate: task.startDate ?? '',
      dueDate: task.dueDate ?? '',
      status: task.status,
      dependsOn: task.dependsOn ?? '',
    });
    setEditingId(task.id);
    setShowForm(true);
  };

  const submit = () => {
    if (!draft.titleJa.trim() && !draft.titleEn.trim()) return;
    if (editingId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingId
            ? {
                ...task,
                projectId: draft.projectId || null,
                titleJa: draft.titleJa,
                titleEn: draft.titleEn,
                descriptionJa: draft.descriptionJa,
                descriptionEn: draft.descriptionEn,
                translationStatus: draft.translationStatus,
                startDate: draft.startDate || null,
                dueDate: draft.dueDate || null,
                status: draft.status,
                dependsOn: draft.dependsOn || null,
              }
            : task,
        ),
      );
    } else {
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
    }
    setShowForm(false);
    setEditingId(null);
  };

  const remove = (id: string) => setTasks((prev) => prev.filter((task) => task.id !== id));

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">{t('assignedTasks')}</p>
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
            {allTasks
              .filter((task) => task.id !== editingId)
              .map((task) => (
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
            const dependency = task.dependsOn ? allTasks.find((other) => other.id === task.dependsOn) : undefined;
            const dependencyUnresolved = Boolean(dependency && dependency.status !== 'done');
            const glossaryMismatches = taskGlossaryMismatches(task, glossary);
            const ambiguousPhrases = taskAmbiguousPhrases(task);
            return (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="min-w-0 truncate">
                  {projectName(task.projectId) && <span className="text-slate-400">{projectName(task.projectId)} · </span>}
                  {taskTitle(task, lang)}
                  {taskSecondaryTitle(task, lang) && <span className="text-slate-400"> / {taskSecondaryTitle(task, lang)}</span>}
                  {task.startDate && task.dueDate && (
                    <span className="text-slate-400"> ({task.startDate} 〜 {task.dueDate})</span>
                  )}
                  {!task.startDate && task.dueDate && <span className="text-slate-400"> ({t('dueDate')}: {task.dueDate})</span>}
                  {dependencyUnresolved && <span className="text-rose-600"> ⚠ {t('dependsOn')}: {dependency && taskTitle(dependency, lang)}</span>}
                  {glossaryMismatches.length > 0 && (
                    <span className="text-amber-600" title={glossaryMismatches.map((m) => `${m.termJa} → ${m.termEn}`).join(', ')}>
                      {' '}
                      ⚠ {t('glossaryMismatchWarning')}
                    </span>
                  )}
                  {ambiguousPhrases.length > 0 && (
                    <span className="text-amber-600" title={ambiguousPhrases.join(', ')}>
                      {' '}
                      ⚠ {t('ambiguousPhraseWarning')}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${TRANSLATION_STATUS_COLOR[task.translationStatus]}`}>
                    {t(TRANSLATION_STATUS_KEY[task.translationStatus])}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[task.status]}`}>{t(STATUS_KEY[task.status])}</span>
                  <button type="button" onClick={() => startEdit(task)} className="text-slate-500 hover:text-slate-900">
                    {t('edit')}
                  </button>
                  <button type="button" onClick={() => remove(task.id)} className="text-rose-500 hover:text-rose-700">
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
