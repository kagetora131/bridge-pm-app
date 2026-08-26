import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UILang } from '../types';
import { dictionaries, type TranslationKey } from './translations';
import { loadJSON, saveJSON } from '../lib/storage';

interface I18nValue {
  lang: UILang;
  setLang: (lang: UILang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UILang>(() => loadJSON<UILang>('uiLang', 'ja'));

  const setLang = (next: UILang) => {
    setLangState(next);
    saveJSON('uiLang', next);
  };

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key) => dictionaries[lang][key] ?? dictionaries.ja[key],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
