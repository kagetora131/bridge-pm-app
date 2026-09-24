import { useCallback, useRef, useState } from 'react';
import { Header, type Section } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProjectsView } from './components/ProjectsView';
import { CalendarView } from './components/CalendarView';
import { MemberManager } from './components/MemberManager';
import { MeetingPlanner } from './components/MeetingPlanner';
import { Glossary } from './components/Glossary';
import { TaskDrawer } from './components/TaskDrawer';
import { UndoToast, type UndoAction } from './components/UndoToast';
import { DeleteChoiceDialog, type PendingDelete } from './components/DeleteChoiceDialog';
import { MyView } from './components/MyView';
import { useI18n } from './i18n/I18nContext';
import { usePersistentState } from './hooks/usePersistentState';
import { ensureLatestSeed } from './lib/seedVersion';
import { deleteMember, deleteProject, deleteTask, type RelatedTaskMode } from './lib/deletion';
import { taskTitle } from './lib/taskText';
import {
  seedAssignments,
  seedGlossary,
  seedMembers,
  seedProjects,
  seedRecurringMeetings,
  seedTasks,
} from './data/seed';
import type { Assignment, GlossaryTerm, Member, MeetingDecisionLogEntry, Project, RecurringMeeting, Task } from './types';

// Runs before the usePersistentState hooks below read localStorage, so a
// sample-data version bump takes effect on this very render rather than
// requiring a manual clear. Idempotent, so StrictMode's double-invoke is safe.
ensureLatestSeed();

export default function App() {
  const { t, lang } = useI18n();
  const [section, setSection] = useState<Section>('dashboard');
  const [projects, setProjects] = usePersistentState<Project[]>('projects', seedProjects);
  const [assignments, setAssignments] = usePersistentState<Assignment[]>('assignments', seedAssignments);
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', seedTasks);
  const [members, setMembers] = usePersistentState<Member[]>('members', seedMembers);
  const [glossary, setGlossary] = usePersistentState<GlossaryTerm[]>('glossary', seedGlossary);
  const [recurringMeetings, setRecurringMeetings] = usePersistentState<RecurringMeeting[]>(
    'recurringMeetings',
    seedRecurringMeetings,
  );
  const [meetingBurdenLog, setMeetingBurdenLog] = usePersistentState<MeetingDecisionLogEntry[]>(
    'meetingBurdenLog',
    [],
  );

  // A UI preference (not sample data), so it survives a sample-data reset; falls back to the overview if that member is gone.
  const [viewerId, setViewerId] = usePersistentState<string | null>('viewerId', null);
  const viewer = members.find((m) => m.id === viewerId) ?? null;

  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [undo, setUndo] = useState<UndoAction | null>(null);
  const undoSeq = useRef(0);

  const offerUndo = (message: string, restore: () => void) => {
    undoSeq.current += 1;
    setUndo({ key: undoSeq.current, message, restore });
  };
  const dismissUndo = useCallback(() => setUndo(null), []);
  const closeTask = useCallback(() => setOpenTaskId(null), []);

  const updateTask = (updated: Task) => setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((tk) => tk.id === taskId);
    if (!task) return;
    const snapshot = tasks;
    setTasks(deleteTask(tasks, taskId));
    if (openTaskId === taskId) setOpenTaskId(null);
    offerUndo(t('undoTaskDeleted', { name: taskTitle(task, lang) }), () => setTasks(snapshot));
  };

  const performDelete = (target: PendingDelete, mode: RelatedTaskMode) => {
    setPendingDelete(null);
    const n = target.relatedTaskCount;
    if (target.kind === 'member') {
      const snapshot = { members, tasks, assignments, recurringMeetings };
      const next = deleteMember(snapshot, target.id, mode);
      setMembers(next.members);
      setTasks(next.tasks);
      setAssignments(next.assignments);
      setRecurringMeetings(next.recurringMeetings);
      const detail = n === 0 ? '' : ` ${t(mode === 'keep' ? 'undoTasksUnassigned' : 'undoTasksAlsoDeleted', { n })}`;
      offerUndo(t('undoMemberDeleted', { name: target.name }) + detail, () => {
        setMembers(snapshot.members);
        setTasks(snapshot.tasks);
        setAssignments(snapshot.assignments);
        setRecurringMeetings(snapshot.recurringMeetings);
      });
    } else {
      const snapshot = { projects, tasks, assignments };
      const next = deleteProject(snapshot, target.id, mode);
      setProjects(next.projects);
      setTasks(next.tasks);
      setAssignments(next.assignments);
      const detail = n === 0 ? '' : ` ${t(mode === 'keep' ? 'undoTasksDetached' : 'undoTasksAlsoDeleted', { n })}`;
      offerUndo(t('undoProjectDeleted', { name: target.name }) + detail, () => {
        setProjects(snapshot.projects);
        setTasks(snapshot.tasks);
        setAssignments(snapshot.assignments);
      });
    }
  };

  // Only ask what to do with related tasks when there are any; otherwise delete right away (undo still available).
  const requestDelete = (target: PendingDelete) => {
    if (target.relatedTaskCount === 0) performDelete(target, 'keep');
    else setPendingDelete(target);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    requestDelete({
      kind: 'member',
      id: memberId,
      name: member.name,
      relatedTaskCount: tasks.filter((task) => task.assigneeId === memberId).length,
    });
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    requestDelete({
      kind: 'project',
      id: projectId,
      name: project.name,
      relatedTaskCount: tasks.filter((task) => task.projectId === projectId).length,
    });
  };

  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        section={section}
        onSectionChange={setSection}
        members={members}
        viewerId={viewer?.id ?? null}
        onViewerChange={setViewerId}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {section === 'dashboard' && viewer && (
          <MyView
            viewer={viewer}
            tasks={tasks}
            members={members}
            projects={projects}
            assignments={assignments}
            recurringMeetings={recurringMeetings}
            onOpenTask={setOpenTaskId}
          />
        )}
        {section === 'dashboard' && !viewer && (
          <Dashboard
            members={members}
            assignments={assignments}
            tasks={tasks}
            projects={projects}
            recurringMeetings={recurringMeetings}
            onNavigate={setSection}
            onOpenTask={setOpenTaskId}
          />
        )}
        {section === 'projects' && (
          <ProjectsView
            projects={projects}
            setProjects={setProjects}
            assignments={assignments}
            setAssignments={setAssignments}
            members={members}
            tasks={tasks}
            onDeleteProject={handleDeleteProject}
          />
        )}
        {section === 'calendar' && (
          <CalendarView
            key={viewer?.id ?? 'all'}
            tasks={tasks}
            members={members}
            projects={projects}
            onOpenTask={setOpenTaskId}
            defaultMemberId={viewer?.id}
          />
        )}
        {section === 'members' && (
          <MemberManager
            members={members}
            setMembers={setMembers}
            assignments={assignments}
            tasks={tasks}
            setTasks={setTasks}
            projects={projects}
            glossary={glossary}
            onOpenTask={setOpenTaskId}
            onDeleteTask={handleDeleteTask}
            onDeleteMember={handleDeleteMember}
          />
        )}
        {section === 'meeting' && (
          <MeetingPlanner
            key={viewer?.id ?? 'all'}
            defaultTimezone={viewer?.timezone}
            members={members}
            projects={projects}
            assignments={assignments}
            recurringMeetings={recurringMeetings}
            setRecurringMeetings={setRecurringMeetings}
            meetingBurdenLog={meetingBurdenLog}
            setMeetingBurdenLog={setMeetingBurdenLog}
          />
        )}
        {section === 'glossary' && <Glossary terms={glossary} setTerms={setGlossary} />}
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">{t('footerNote')}</footer>

      {openTask && (
        <TaskDrawer
          key={openTask.id}
          task={openTask}
          allTasks={tasks}
          members={members}
          projects={projects}
          glossary={glossary}
          onUpdate={updateTask}
          onDelete={handleDeleteTask}
          onClose={closeTask}
        />
      )}
      {pendingDelete && (
        <DeleteChoiceDialog
          pending={pendingDelete}
          onChoose={(mode) => performDelete(pendingDelete, mode)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {undo && <UndoToast key={undo.key} action={undo} onDismiss={dismissUndo} />}
    </div>
  );
}
