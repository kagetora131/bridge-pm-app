import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import type { Member, Project, Task, TaskStatus, UILang } from '../types';

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

type DisplayLang = UILang | 'both';

const emptyDraft = {
  projectId: '',
  titleJa: '',
  titleEn: '',
  descriptionJa: '',
  descriptionEn: '',
  assigneeId: '',
  dueDate: '',
  status: 'todo' as TaskStatus,
  dependsOn: '',
};

export function TaskBoard({
  tasks,
  setTasks,
  members,
  projects,
}: {
  tasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  members: Member[];
  projects: Project[];
}) {
  const { t } = useI18n();
  const [displayLang, setDisplayLang] = useState<DisplayLang>('both');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name ?? t('unassigned');
  const projectName = (id: string | null | undefined) => projects.find((p) => p.id === id)?.name;
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
      descriptionJa: task.descriptionJa,
      descriptionEn: task.descriptionEn,
      assigneeId: task.assigneeId ?? '',
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
                assigneeId: draft.assigneeId || null,
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
        assigneeId: draft.assigneeId || null,
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

  const renderTitle = (task: Task) => {
    if (displayLang === 'both') {
      return (
        <div>
          <p className="font-medium text-slate-900">{task.titleJa || task.titleEn}</p>
          {task.titleEn && task.titleJa && <p className="text-sm text-slate-500">{task.titleEn}</p>}
        </div>
      );
    }
    const primary = displayLang === 'ja' ? task.titleJa : task.titleEn;
    const fallback = displayLang === 'ja' ? task.titleEn : task.titleJa;
    return <p className="font-medium text-slate-900">{primary || fallback}</p>;
  };

  const renderDescription = (task: Task) => {
    if (!task.descriptionJa && !task.descriptionEn) return null;
    if (displayLang === 'both') {
      return (
        <div className="mt-1 space-y-1 text-sm text-slate-600">
          {task.descriptionJa && <p>{task.descriptionJa}</p>}
          {task.descriptionEn && <p className="text-slate-400">{task.descriptionEn}</p>}
        </div>
      );
    }
    const primary = displayLang === 'ja' ? task.descriptionJa : task.descriptionEn;
    const fallback = displayLang === 'ja' ? task.descriptionEn : task.descriptionJa;
    return <p className="mt-1 text-sm text-slate-600">{primary || fallback}</p>;
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{t('tasksHeading')}</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            {t('displayLang')}
            <select
              value={displayLang}
              onChange={(e) => setDisplayLang(e.target.value as DisplayLang)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="both">{t('both')}</option>
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </label>
          <button
            type="button"
            onClick={startAdd}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t('addTask')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('project')}>
              <select className="input" value={draft.projectId} onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}>
                <option value="">{t('noProject')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dependsOn')}>
              <select className="input" value={draft.dependsOn} onChange={(e) => setDraft({ ...draft, dependsOn: e.target.value })}>
                <option value="">{t('noDependency')}</option>
                {tasks
                  .filter((task) => task.id !== editingId)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {taskTitle(task)}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label={t('titleJa')}>
              <input
                className="input"
                value={draft.titleJa}
                onChange={(e) => setDraft({ ...draft, titleJa: e.target.value })}
              />
            </Field>
            <Field label={t('titleEn')}>
              <input
                className="input"
                value={draft.titleEn}
                onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })}
              />
            </Field>
            <Field label={t('descriptionJa')}>
              <textarea
                className="input"
                rows={3}
                value={draft.descriptionJa}
                onChange={(e) => setDraft({ ...draft, descriptionJa: e.target.value })}
              />
            </Field>
            <Field label={t('descriptionEn')}>
              <textarea
                className="input"
                rows={3}
                value={draft.descriptionEn}
                onChange={(e) => setDraft({ ...draft, descriptionEn: e.target.value })}
              />
            </Field>
            <Field label={t('assignee')}>
              <select
                className="input"
                value={draft.assigneeId}
                onChange={(e) => setDraft({ ...draft, assigneeId: e.target.value })}
              >
                <option value="">{t('unassigned')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('dueDate')}>
              <input
                type="date"
                className="input"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
              />
            </Field>
            <Field label={t('status')}>
              <select
                className="input"
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s])}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={submit} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              {t('save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noTasks')}</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const dependency = task.dependsOn ? tasks.find((other) => other.id === task.dependsOn) : undefined;
            const dependencyUnresolved = Boolean(dependency && dependency.status !== 'done');
            return (
            <li key={task.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {projectName(task.projectId) && (
                    <p className="mb-0.5 text-xs font-medium text-slate-400">{projectName(task.projectId)}</p>
                  )}
                  {renderTitle(task)}
                  {renderDescription(task)}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{t('assignee')}: {memberName(task.assigneeId)}</span>
                    {task.dueDate && <span>{t('dueDate')}: {task.dueDate}</span>}
                    <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[task.status]}`}>
                      {t(STATUS_KEY[task.status])}
                    </span>
                    {dependency && (
                      <span className={dependencyUnresolved ? 'text-rose-600' : 'text-slate-400'}>
                        {dependencyUnresolved ? '⚠ ' : ''}
                        {t('dependsOn')}: {taskTitle(dependency)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEdit(task)} className="text-sm text-slate-500 hover:text-slate-900">
                    {t('edit')}
                  </button>
                  <button type="button" onClick={() => remove(task.id)} className="text-sm text-rose-500 hover:text-rose-700">
                    {t('delete')}
                  </button>
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
