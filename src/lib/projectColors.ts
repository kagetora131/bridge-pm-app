// Complete, literal Tailwind class names (not built via string interpolation)
// so the build's class scanner can find them.
const PALETTE = [
  { fill: 'bg-sky-200', border: 'border-sky-500', swatch: 'bg-sky-500' },
  { fill: 'bg-violet-200', border: 'border-violet-500', swatch: 'bg-violet-500' },
  { fill: 'bg-teal-200', border: 'border-teal-500', swatch: 'bg-teal-500' },
  { fill: 'bg-orange-200', border: 'border-orange-500', swatch: 'bg-orange-500' },
  { fill: 'bg-fuchsia-200', border: 'border-fuchsia-500', swatch: 'bg-fuchsia-500' },
  { fill: 'bg-lime-200', border: 'border-lime-600', swatch: 'bg-lime-500' },
  { fill: 'bg-cyan-200', border: 'border-cyan-500', swatch: 'bg-cyan-500' },
  { fill: 'bg-pink-200', border: 'border-pink-500', swatch: 'bg-pink-500' },
] as const;

interface ProjectColor {
  fill: string;
  border: string;
  swatch: string;
}

const NO_PROJECT_COLOR: ProjectColor = { fill: 'bg-slate-200', border: 'border-slate-400', swatch: 'bg-slate-400' };

/** Deterministic per-project color, stable regardless of project list order
 * (so removing/reordering other projects never reshuffles an existing one's color). */
export function colorForProject(projectId: string | null): ProjectColor {
  if (!projectId) return NO_PROJECT_COLOR;
  let hash = 0;
  for (let i = 0; i < projectId.length; i += 1) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
