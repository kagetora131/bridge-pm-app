import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import { assignmentsForProject } from '../lib/workload';
import type { Assignment, Member, Project, ProjectStatus, Task } from '../types';

const STATUS_ORDER: ProjectStatus[] = ['planning', 'active', 'on-hold', 'done'];
const STATUS_KEY: Record<ProjectStatus, 'projectStatusPlanning' | 'projectStatusActive' | 'projectStatusOnHold' | 'projectStatusDone'> = {
  planning: 'projectStatusPlanning',
  active: 'projectStatusActive',
  'on-hold': 'projectStatusOnHold',
  done: 'projectStatusDone',
};
const STATUS_COLOR: Record<ProjectStatus, string> = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-sky-100 text-sky-800',
  'on-hold': 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
};

const emptyProjectDraft = {
  name: '',
  genre: '',
  status: 'planning' as ProjectStatus,
  phase: '',
  startDate: '',
  targetRelease: '',
};

const emptyAssignmentDraft = { memberId: '', roleInProject: '', allocatedHoursPerWeek: 10 };

export function ProjectsView({
  projects,
  setProjects,
  assignments,
  setAssignments,
  members,
  tasks,
}: {
  projects: Project[];
  setProjects: (updater: (prev: Project[]) => Project[]) => void;
  assignments: Assignment[];
  setAssignments: (updater: (prev: Assignment[]) => Assignment[]) => void;
  members: Member[];
  tasks: Task[];
}) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyProjectDraft);
  const [assignmentDraftFor, setAssignmentDraftFor] = useState<string | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState(emptyAssignmentDraft);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

  const startAdd = () => {
    setDraft(emptyProjectDraft);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (project: Project) => {
    setDraft({
      name: project.name,
      genre: project.genre,
      status: project.status,
      phase: project.phase,
      startDate: project.startDate ?? '',
      targetRelease: project.targetRelease ?? '',
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const submit = () => {
    if (!draft.name.trim()) return;
    const payload = {
      name: draft.name,
      genre: draft.genre,
      status: draft.status,
      phase: draft.phase,
      startDate: draft.startDate || null,
      targetRelease: draft.targetRelease || null,
    };
    if (editingId) {
      setProjects((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
    } else {
      const project: Project = { id: newId(), ...payload };
      setProjects((prev) => [...prev, project]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setAssignments((prev) => prev.filter((a) => a.projectId !== id));
  };

  const startAssignmentAdd = (projectId: string) => {
    setAssignmentDraft(emptyAssignmentDraft);
    setAssignmentDraftFor(projectId);
  };

  const submitAssignment = (projectId: string) => {
    if (!assignmentDraft.memberId) return;
    const assignment: Assignment = {
      id: newId(),
      projectId,
      memberId: assignmentDraft.memberId,
      roleInProject: assignmentDraft.roleInProject,
      allocatedHoursPerWeek: assignmentDraft.allocatedHoursPerWeek,
    };
    setAssignments((prev) => [...prev, assignment]);
    setAssignmentDraftFor(null);
  };

  const removeAssignment = (id: string) => setAssignments((prev) => prev.filter((a) => a.id !== id));

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t('projectsHeading')}</h2>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t('addProject')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('projectName')}>
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label={t('genre')}>
              <input className="input" value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} />
            </Field>
            <Field label={t('status')}>
              <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ProjectStatus })}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s])}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('phase')}>
              <input className="input" value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })} />
            </Field>
            <Field label={t('startDate')}>
              <input type="date" className="input" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label={t('targetRelease')}>
              <input type="date" className="input" value={draft.targetRelease} onChange={(e) => setDraft({ ...draft, targetRelease: e.target.value })} />
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

      {projects.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noProjects')}</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => {
            const projectAssignments = assignmentsForProject(assignments, project.id);
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const doneCount = projectTasks.filter((task) => task.status === 'done').length;

            return (
              <li key={project.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {project.name}
                      {project.genre && <span className="ml-2 text-xs font-normal text-slate-400">{project.genre}</span>}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {project.phase}
                      {(project.startDate || project.targetRelease) && (
                        <> · {project.startDate ?? '—'} 〜 {project.targetRelease ?? '—'}</>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('linkedTasks')}: {projectTasks.length} ({t('statusDone')} {doneCount})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[project.status]}`}>
                      {t(STATUS_KEY[project.status])}
                    </span>
                    <button type="button" onClick={() => startEdit(project)} className="text-sm text-slate-500 hover:text-slate-900">
                      {t('edit')}
                    </button>
                    <button type="button" onClick={() => removeProject(project.id)} className="text-sm text-rose-500 hover:text-rose-700">
                      {t('delete')}
                    </button>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-600">{t('assignments')}</p>
                    <button
                      type="button"
                      onClick={() => startAssignmentAdd(project.id)}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      + {t('addAssignment')}
                    </button>
                  </div>

                  {assignmentDraftFor === project.id && (
                    <div className="mb-2 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-2">
                      <label className="text-xs text-slate-600">
                        <span className="mb-0.5 block">{t('member')}</span>
                        <select
                          className="input"
                          value={assignmentDraft.memberId}
                          onChange={(e) => setAssignmentDraft({ ...assignmentDraft, memberId: e.target.value })}
                        >
                          <option value="">—</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-slate-600">
                        <span className="mb-0.5 block">{t('roleInProject')}</span>
                        <input
                          className="input"
                          value={assignmentDraft.roleInProject}
                          onChange={(e) => setAssignmentDraft({ ...assignmentDraft, roleInProject: e.target.value })}
                        />
                      </label>
                      <label className="text-xs text-slate-600">
                        <span className="mb-0.5 block">{t('allocatedHours')}</span>
                        <input
                          type="number"
                          min={0}
                          className="input w-20"
                          value={assignmentDraft.allocatedHoursPerWeek}
                          onChange={(e) => setAssignmentDraft({ ...assignmentDraft, allocatedHoursPerWeek: Number(e.target.value) })}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => submitAssignment(project.id)}
                        className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                      >
                        {t('save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentDraftFor(null)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  )}

                  {projectAssignments.length === 0 ? (
                    <p className="text-xs text-slate-400">{t('noAssignments')}</p>
                  ) : (
                    <ul className="space-y-1">
                      {projectAssignments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between text-xs text-slate-600">
                          <span>
                            {memberName(a.memberId)} · {a.roleInProject} · {a.allocatedHoursPerWeek}h/{t('week')}
                          </span>
                          <button type="button" onClick={() => removeAssignment(a.id)} className="text-rose-500 hover:text-rose-700">
                            {t('delete')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
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
