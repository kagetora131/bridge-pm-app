export type UILang = 'ja' | 'en';

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'done';

export interface Member {
  id: string;
  name: string;
  role: string; // job function, e.g. "企画", "プログラム", "ブリッジPM"
  location: string;
  timezone: string; // IANA timezone id, e.g. "Asia/Tokyo"
  workStart: string; // "HH:mm" in the member's local time
  workEnd: string; // "HH:mm" in the member's local time
  /** Local weekdays the member works: 0=Sun, 1=Mon, ... 6=Sat. Lets locations
   * whose weekend isn't Sat/Sun (e.g. Dubai: Fri/Sat off) be modeled correctly. */
  workingDays: number[];
  weeklyCapacityHours: number;
  languages: string[]; // e.g. ["ja"], ["vi", "en"]
  hourlyRateUsd: number; // used for all budget/burn-rate math — kept in USD so projects can mix currencies
  /** Reference-only local-currency rate, never used in calculations (all cost math is USD-only). */
  localCurrencyCode?: string; // e.g. "JPY", "EUR", "MXN"
  localHourlyRate?: number;
}

export interface Project {
  id: string;
  name: string;
  genre: string;
  status: ProjectStatus;
  phase: string; // free-text current phase, e.g. "ローカライズ／PR準備"
  startDate: string | null; // "yyyy-MM-dd"
  targetRelease: string | null; // "yyyy-MM-dd"
  totalBudgetUsd: number;
}

/** A member's staffing allocation on a project (used to detect overload). */
export interface Assignment {
  id: string;
  memberId: string;
  projectId: string;
  roleInProject: string;
  allocatedHoursPerWeek: number;
}

export interface Task {
  id: string;
  projectId: string | null;
  titleJa: string;
  titleEn: string;
  descriptionJa: string;
  descriptionEn: string;
  assigneeId: string | null;
  dueDate: string | null; // ISO date "yyyy-MM-dd"
  status: TaskStatus;
  dependsOn: string | null; // another task's id
  createdAt: string; // ISO datetime
}

export interface GlossaryTerm {
  id: string;
  termJa: string;
  termEn: string;
  note: string;
}

export interface MeetingSlot {
  startMs: number;
  endMs: number;
}

export interface CompromiseResult {
  slot: MeetingSlot;
  coveredMemberIds: string[];
  outside: Array<{
    memberId: string;
    direction: 'before' | 'after';
    minutesOutside: number;
  }>;
}
