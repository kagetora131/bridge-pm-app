import type { TaskStatus, TranslationStatus } from '../types';
import type { TranslationKey } from '../i18n/translations';
import type { RiskReason } from './calendarRisk';

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done'];

export const STATUS_KEY: Record<TaskStatus, TranslationKey> = {
  todo: 'statusTodo',
  'in-progress': 'statusInProgress',
  blocked: 'statusBlocked',
  done: 'statusDone',
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-amber-100 text-amber-800',
  blocked: 'bg-rose-100 text-rose-800',
  done: 'bg-emerald-100 text-emerald-800',
};

export const TRANSLATION_STATUS_ORDER: TranslationStatus[] = ['untranslated', 'draft', 'reviewed'];

export const TRANSLATION_STATUS_KEY: Record<TranslationStatus, TranslationKey> = {
  untranslated: 'translationStatusUntranslated',
  draft: 'translationStatusDraft',
  reviewed: 'translationStatusReviewed',
};

export const TRANSLATION_STATUS_COLOR: Record<TranslationStatus, string> = {
  untranslated: 'bg-slate-100 text-slate-500',
  draft: 'bg-sky-100 text-sky-800',
  reviewed: 'bg-emerald-100 text-emerald-800',
};

export const RISK_REASON_KEY: Record<RiskReason, TranslationKey> = {
  blocked: 'statusBlocked',
  overdue: 'dashboardOverdueBadge',
  dependency: 'riskDependencyUnresolved',
  behind: 'riskBehindSchedule',
};

export const PROGRESS_STEPS = [0, 25, 50, 75, 100];
