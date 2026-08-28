import { useState } from 'react';
import { Header, type Section } from './components/Header';
import { ProjectsView } from './components/ProjectsView';
import { TaskBoard } from './components/TaskBoard';
import { CalendarView } from './components/CalendarView';
import { MemberManager } from './components/MemberManager';
import { MeetingPlanner } from './components/MeetingPlanner';
import { Glossary } from './components/Glossary';
import { useI18n } from './i18n/I18nContext';
import { usePersistentState } from './hooks/usePersistentState';
import { seedAssignments, seedGlossary, seedMembers, seedProjects, seedTasks } from './data/seed';
import type { Assignment, GlossaryTerm, Member, Project, Task } from './types';

export default function App() {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>('tasks');
  const [projects, setProjects] = usePersistentState<Project[]>('projects', seedProjects);
  const [assignments, setAssignments] = usePersistentState<Assignment[]>('assignments', seedAssignments);
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', seedTasks);
  const [members, setMembers] = usePersistentState<Member[]>('members', seedMembers);
  const [glossary, setGlossary] = usePersistentState<GlossaryTerm[]>('glossary', seedGlossary);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header section={section} onSectionChange={setSection} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {section === 'projects' && (
          <ProjectsView
            projects={projects}
            setProjects={setProjects}
            assignments={assignments}
            setAssignments={setAssignments}
            members={members}
            tasks={tasks}
          />
        )}
        {section === 'tasks' && (
          <TaskBoard tasks={tasks} setTasks={setTasks} members={members} projects={projects} />
        )}
        {section === 'calendar' && (
          <CalendarView tasks={tasks} members={members} onOpenTask={() => setSection('tasks')} />
        )}
        {section === 'members' && (
          <MemberManager members={members} setMembers={setMembers} assignments={assignments} />
        )}
        {section === 'meeting' && <MeetingPlanner members={members} />}
        {section === 'glossary' && <Glossary terms={glossary} setTerms={setGlossary} />}
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">{t('footerNote')}</footer>
    </div>
  );
}
