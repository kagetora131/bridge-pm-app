import type { Assignment, Member, Project, RecurringMeeting, Task } from '../types';

/** What to do with the tasks attached to a member/project being deleted. */
export type RelatedTaskMode = 'keep' | 'delete';

function removeTasks(tasks: Task[], ids: Set<string>): Task[] {
  return tasks
    .filter((t) => !ids.has(t.id))
    .map((t) => (t.dependsOn && ids.has(t.dependsOn) ? { ...t, dependsOn: null } : t));
}

/** Removes a task and clears any other task's dependency on it (so nothing points at a missing task). */
export function deleteTask(tasks: Task[], taskId: string): Task[] {
  return removeTasks(tasks, new Set([taskId]));
}

export interface MemberData {
  members: Member[];
  tasks: Task[];
  assignments: Assignment[];
  recurringMeetings: RecurringMeeting[];
}

/** Removes a member plus their assignments and meeting seats; their tasks are either
 * kept as unassigned or deleted, per `mode`. */
export function deleteMember(data: MemberData, memberId: string, mode: RelatedTaskMode): MemberData {
  const theirTaskIds = new Set(data.tasks.filter((t) => t.assigneeId === memberId).map((t) => t.id));
  return {
    members: data.members.filter((m) => m.id !== memberId),
    assignments: data.assignments.filter((a) => a.memberId !== memberId),
    recurringMeetings: data.recurringMeetings.map((rm) =>
      rm.participantIds.includes(memberId) ? { ...rm, participantIds: rm.participantIds.filter((id) => id !== memberId) } : rm,
    ),
    tasks:
      mode === 'delete'
        ? removeTasks(data.tasks, theirTaskIds)
        : data.tasks.map((t) => (t.assigneeId === memberId ? { ...t, assigneeId: null } : t)),
  };
}

export interface ProjectData {
  projects: Project[];
  tasks: Task[];
  assignments: Assignment[];
}

/** Removes a project plus its assignments; its tasks are either kept (no project) or deleted, per `mode`. */
export function deleteProject(data: ProjectData, projectId: string, mode: RelatedTaskMode): ProjectData {
  const projectTaskIds = new Set(data.tasks.filter((t) => t.projectId === projectId).map((t) => t.id));
  return {
    projects: data.projects.filter((p) => p.id !== projectId),
    assignments: data.assignments.filter((a) => a.projectId !== projectId),
    tasks:
      mode === 'delete'
        ? removeTasks(data.tasks, projectTaskIds)
        : data.tasks.map((t) => (t.projectId === projectId ? { ...t, projectId: null } : t)),
  };
}
