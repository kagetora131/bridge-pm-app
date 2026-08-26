import { useState } from 'react';
import { Header, type Section } from './components/Header';
import { TaskBoard } from './components/TaskBoard';
import { MemberManager } from './components/MemberManager';
import { MeetingPlanner } from './components/MeetingPlanner';
import { Glossary } from './components/Glossary';
import { useI18n } from './i18n/I18nContext';
import { usePersistentState } from './hooks/usePersistentState';
import { seedGlossary, seedMembers, seedTasks } from './data/seed';
import type { GlossaryTerm, Member, Task } from './types';

export default function App() {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>('tasks');
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', seedTasks);
  const [members, setMembers] = usePersistentState<Member[]>('members', seedMembers);
  const [glossary, setGlossary] = usePersistentState<GlossaryTerm[]>('glossary', seedGlossary);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header section={section} onSectionChange={setSection} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {section === 'tasks' && <TaskBoard tasks={tasks} setTasks={setTasks} members={members} />}
        {section === 'members' && <MemberManager members={members} setMembers={setMembers} />}
        {section === 'meeting' && <MeetingPlanner members={members} />}
        {section === 'glossary' && <Glossary terms={glossary} setTerms={setGlossary} />}
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">{t('footerNote')}</footer>
    </div>
  );
}
