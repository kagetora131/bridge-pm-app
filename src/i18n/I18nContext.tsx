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

// 保存済みの選択が無い初回訪問時に使うデフォルト言語。
// ホームページの表示言語(同一オリジンのlocalStorageを共有)を端末の言語設定より
// 優先し、それも無ければ端末の言語設定から判定する(日本語以外は英語をデフォルトに
// して、フランス語・スペイン語など未対応言語の訪問者にも英語を表示する)。
function detectDefaultLang(): UILang {
  try {
    const hpLang = window.localStorage.getItem('kagetora-lang');
    if (hpLang === 'ja' || hpLang === 'en') return hpLang;
  } catch {
    // ignore
  }
  try {
    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  } catch {
    return 'ja';
  }
}

// URLに ?lang=ja / ?lang=en があれば、保存済み設定より優先する
// (ホームページの表示言語のままアプリを開けるようにするため)。
function resolveInitialLang(): UILang {
  try {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'ja' || urlLang === 'en') return urlLang;
  } catch {
    // ignore
  }
  return loadJSON<UILang>('uiLang', detectDefaultLang());
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UILang>(resolveInitialLang);

  // Keep <html lang> in sync with the displayed language (accessibility/SEO —
  // it's static "en" in index.html, which is wrong whenever the UI is Japanese).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // ?lang= で開かれた場合、初期表示には反映済みなので選択を保存しURLからは消しておく。
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const urlLang = url.searchParams.get('lang');
      if (urlLang === 'ja' || urlLang === 'en') {
        saveJSON('uiLang', urlLang);
        url.searchParams.delete('lang');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch {
      // ignore
    }
  }, []);

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
