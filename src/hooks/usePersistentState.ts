import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';

export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => loadJSON<T>(key, initial));

  useEffect(() => {
    saveJSON(key, state);
  }, [key, state]);

  return [state, setState] as const;
}
