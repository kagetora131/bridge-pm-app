import { loadJSON, saveJSON } from './storage';
import { DATA_KEYS } from './seedVersion';

const EXPORT_FORMAT_VERSION = 1;

/** Bundles every locally-stored data key into one JSON document, so the demo's
 * localStorage-only data can be carried between browsers/devices manually. */
export function exportAllDataAsJSON(): string {
  const payload: Record<string, unknown> = {
    exportFormatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
  };
  for (const key of DATA_KEYS) {
    payload[key] = loadJSON<unknown>(key, null);
  }
  return JSON.stringify(payload, null, 2);
}

export function downloadDataExport(): void {
  const json = exportAllDataAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bridge-pm-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Restores localStorage keys from a previously exported JSON document, then
 * reloads so usePersistentState picks up the new values. Throws on invalid JSON. */
export function importDataFromJSON(json: string): void {
  const parsed = JSON.parse(json) as Record<string, unknown>;
  for (const key of DATA_KEYS) {
    if (parsed[key] != null) saveJSON(key, parsed[key]);
  }
  window.location.reload();
}
