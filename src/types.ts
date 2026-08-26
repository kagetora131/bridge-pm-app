export type UILang = 'ja' | 'en';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Member {
  id: string;
  name: string;
  location: string;
  timezone: string; // IANA timezone id, e.g. "Asia/Tokyo"
  workStart: string; // "HH:mm" in the member's local time
  workEnd: string; // "HH:mm" in the member's local time
  languages: string[]; // e.g. ["ja"], ["vi", "en"]
}

export interface Task {
  id: string;
  titleJa: string;
  titleEn: string;
  descriptionJa: string;
  descriptionEn: string;
  assigneeId: string | null;
  dueDate: string | null; // ISO date "yyyy-MM-dd"
  status: TaskStatus;
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
