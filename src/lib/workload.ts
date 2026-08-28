import type { Assignment, Member } from '../types';

export interface MemberWorkload {
  memberId: string;
  totalAllocatedHours: number;
  capacityHours: number;
  isOverloaded: boolean;
  utilizationPct: number;
}

/** Derives allocation totals and overload status from assignments — never
 * stored redundantly on the member, so it can't drift out of sync. */
export function computeWorkload(member: Member, assignments: Assignment[]): MemberWorkload {
  const capacityHours = member.weeklyCapacityHours ?? 40;
  const totalAllocatedHours = assignments
    .filter((a) => a.memberId === member.id)
    .reduce((sum, a) => sum + a.allocatedHoursPerWeek, 0);

  return {
    memberId: member.id,
    totalAllocatedHours,
    capacityHours,
    isOverloaded: totalAllocatedHours > capacityHours,
    utilizationPct: capacityHours > 0 ? Math.round((totalAllocatedHours / capacityHours) * 100) : 0,
  };
}

export function computeWorkloads(members: Member[], assignments: Assignment[]): Map<string, MemberWorkload> {
  return new Map(members.map((m) => [m.id, computeWorkload(m, assignments)]));
}

export function assignmentsForProject(assignments: Assignment[], projectId: string): Assignment[] {
  return assignments.filter((a) => a.projectId === projectId);
}

export function assignmentsForMember(assignments: Assignment[], memberId: string): Assignment[] {
  return assignments.filter((a) => a.memberId === memberId);
}
