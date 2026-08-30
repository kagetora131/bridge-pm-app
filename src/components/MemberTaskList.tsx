import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import type { Project, Task, TaskStatus } from '../types';

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

const emptyDraft = {
  projectId: '',
  titleJa: '',
  titleEn: '',
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
}: {
  memberId: string;
  allTasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  projects: Project[];
}) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  const myTasks = allTasks
    .filter((task) => task.assigneeId === memberId)
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name;
  const taskTitle = (task: Task | undefined) => task && (task.titleJa || task.titleEn);

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
        descriptionJa: '',
        descriptionEn: '',
        assigneeId: memberId,
        startDate: draft.startDate || null,
        dueDate: draft.dueDate || null,
        status: draft.status,
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
                  {taskTitle(task)}
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
            return (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="min-w-0 truncate">
                  {projectName(task.projectId) && <span className="text-slate-400">{projectName(task.projectId)} · </span>}
                  {task.titleJa || task.titleEn}
                  {task.startDate && task.dueDate && (
                    <span className="text-slate-400"> ({task.startDate} 〜 {task.dueDate})</span>
                  )}
                  {!task.startDate && task.dueDate && <span className="text-slate-400"> ({t('dueDate')}: {task.dueDate})</span>}
                  {dependencyUnresolved && <span className="text-rose-600"> ⚠ {t('dependsOn')}: {taskTitle(dependency)}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
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
