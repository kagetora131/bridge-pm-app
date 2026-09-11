import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UILang } from '../types';
import { dictionaries, type TranslationKey } from './translations';
import { loadJSON, saveJSON } from '../lib/storage';

interface I18nValue {
  lang: UILang;
  setLang: (lang: UILang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

// 保存済みの選択が無い初回訪問時に使うデフォルト言語。端末の言語設定が日本語以外なら
// 英語をデフォルトにする(フランス語・スペイン語など未対応言語の訪問者にも英語を表示するため)。
function detectDefaultLang(): UILang {
  try {
    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  } catch {
    return 'ja';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UILang>(() => loadJSON<UILang>('uiLang', detectDefaultLang()));

  // Keep <html lang> in sync with the displayed language (accessibility/SEO —
  // it's static "en" in index.html, which is wrong whenever the UI is Japanese).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
