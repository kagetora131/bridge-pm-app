import type { GlossaryTerm, Task } from '../types';

// Not a linguistic analysis — a small, explainable keyword list for phrasing
// that machine translation commonly mishandles (vague quantifiers, soft
// requests, omitted subjects). The point is to prompt a human read-through
// before a translation ships, not to grade translation quality.
const AMBIGUOUS_PATTERNS = ['など', 'よしなに', '適宜', 'なるべく', '別途', 'なるはや', '一部', '基本的に'];

export interface GlossaryMismatch {
  termJa: string;
  termEn: string;
}

/** Glossary terms that appear in the Japanese source but whose registered
 * English translation isn't reflected anywhere in the translated text. */
export function findGlossaryMismatches(sourceJa: string, translatedEn: string, glossary: GlossaryTerm[]): GlossaryMismatch[] {
  if (!sourceJa.trim() || !translatedEn.trim()) return [];
  const lowerEn = translatedEn.toLowerCase();
  return glossary
    .filter((term) => term.termJa && sourceJa.includes(term.termJa))
    .filter((term) => term.termEn && !lowerEn.includes(term.termEn.toLowerCase()))
    .map((term) => ({ termJa: term.termJa, termEn: term.termEn }));
}

export function findAmbiguousPhrases(sourceJa: string): string[] {
  return AMBIGUOUS_PATTERNS.filter((pattern) => sourceJa.includes(pattern));
}

export function taskGlossaryMismatches(task: Task, glossary: GlossaryTerm[]): GlossaryMismatch[] {
  return findGlossaryMismatches(`${task.titleJa} ${task.descriptionJa}`, `${task.titleEn} ${task.descriptionEn}`, glossary);
}

export function taskAmbiguousPhrases(task: Task): string[] {
  return findAmbiguousPhrases(`${task.titleJa} ${task.descriptionJa}`);
}
