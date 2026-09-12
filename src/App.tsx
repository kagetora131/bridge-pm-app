import { useState } from 'react';
import { Header, type Section } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProjectsView } from './components/ProjectsView';
import { CalendarView } from './components/CalendarView';
import { MemberManager } from './components/MemberManager';
import { MeetingPlanner } from './components/MeetingPlanner';
import { Glossary } from './components/Glossary';
import { useI18n } from './i18n/I18nContext';
import { usePersistentState } from './hooks/usePersistentState';
import { ensureLatestSeed } from './lib/seedVersion';
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
  const { t } = useI18n();
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header section={section} onSectionChange={setSection} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {section === 'dashboard' && (
          <Dashboard
            members={members}
            assignments={assignments}
            tasks={tasks}
            projects={projects}
            recurringMeetings={recurringMeetings}
            onNavigate={setSection}
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
          />
        )}
        {section === 'calendar' && (
          <CalendarView
            tasks={tasks}
            members={members}
            projects={projects}
            onOpenTask={() => setSection('members')}
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
          />
        )}
        {section === 'meeting' && (
          <MeetingPlanner
            members={members}
            recurringMeetings={recurringMeetings}
            setRecurringMeetings={setRecurringMeetings}
            meetingBurdenLog={meetingBurdenLog}
            setMeetingBurdenLog={setMeetingBurdenLog}
          />
        )}
        {section === 'glossary' && <Glossary terms={glossary} setTerms={setGlossary} />}
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">{t('footerNote')}</footer>
    </div>
  );
}
