import type { Assignment, Member, Project } from '../types';
import { DAY_MS, utcMidnight } from './timezone';

const DAYS_PER_WEEK = 7;
const BUSINESS_DAYS_PER_WEEK = 5;

export interface ProjectBudget {
  weeklyBurnRateUsd: number;
  elapsedWeeks: number;
  spentToDateUsd: number;
  totalWeeks: number;
  projectedTotalCostUsd: number;
  isOverBudgetProjected: boolean;
  /** totalBudgetUsd - projectedTotalCostUsd. Negative means projected to exceed budget. */
  budgetVarianceUsd: number;
  costPerExtraBusinessDayUsd: number;
}

/** Sum of (member hourly rate × allocated hours/week) across a project's assignments. */
export function computeWeeklyBurnRate(projectId: string, assignments: Assignment[], members: Member[]): number {
  return assignments
    .filter((a) => a.projectId === projectId)
    .reduce((sum, a) => {
      const rate = members.find((m) => m.id === a.memberId)?.hourlyRateUsd ?? 0;
      return sum + rate * a.allocatedHoursPerWeek;
    }, 0);
}

/**
 * Budget/burn-rate projection for a project, as of `referenceDateISO`.
 *
 * Deliberately simplified: assumes the current staffing (weekly burn rate)
 * holds constant for the entire start→target-release span. Real projects
 * change staffing by phase, so this is a directional estimate, not a forecast
 * — callers should always surface that caveat alongside the numbers.
 * Returns null when the project has no start date or target release date to
 * measure a span from.
 */
export function computeProjectBudget(
  project: Project,
  assignments: Assignment[],
  members: Member[],
  referenceDateISO: string,
): ProjectBudget | null {
  if (!project.startDate || !project.targetRelease) return null;

  const weeklyBurnRateUsd = computeWeeklyBurnRate(project.id, assignments, members);

  const startMs = utcMidnight(project.startDate);
  const endMs = utcMidnight(project.targetRelease);
  const refMs = utcMidnight(referenceDateISO);

  const totalDays = Math.max(0, endMs - startMs) / DAY_MS;
  const totalWeeks = totalDays / DAYS_PER_WEEK;

  const elapsedDays = Math.min(Math.max(0, refMs - startMs), endMs - startMs) / DAY_MS;
  const elapsedWeeks = elapsedDays / DAYS_PER_WEEK;

  const spentToDateUsd = elapsedWeeks * weeklyBurnRateUsd;
  const projectedTotalCostUsd = totalWeeks * weeklyBurnRateUsd;
  const budgetVarianceUsd = project.totalBudgetUsd - projectedTotalCostUsd;

  return {
    weeklyBurnRateUsd,
    elapsedWeeks,
    spentToDateUsd,
    totalWeeks,
    projectedTotalCostUsd,
    isOverBudgetProjected: projectedTotalCostUsd > project.totalBudgetUsd,
    budgetVarianceUsd,
    costPerExtraBusinessDayUsd: weeklyBurnRateUsd / BUSINESS_DAYS_PER_WEEK,
  };
}

/** Extra cost of pushing the schedule out by `extraBusinessDays`, at the current burn rate. */
export function simulateExtensionCost(costPerExtraBusinessDayUsd: number, extraBusinessDays: number): number {
  return costPerExtraBusinessDayUsd * extraBusinessDays;
}

export function formatUsd(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}$${Math.abs(rounded).toLocaleString('en-US')}`;
}
