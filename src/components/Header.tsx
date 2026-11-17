import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import { resetToSampleData } from '../lib/seedVersion';
import { downloadDataExport, importDataFromJSON } from '../lib/dataPortability';
import { loadJSON, saveJSON } from '../lib/storage';
import { browserTimezone, currentDateLabelInZone } from '../lib/timezone';
import { GuidedTour } from './GuidedTour';
import type { Member } from '../types';

export type Section = 'dashboard' | 'projects' | 'calendar' | 'members' | 'meeting' | 'glossary';

export const SECTIONS: Section[] = ['dashboard', 'projects', 'calendar', 'members', 'meeting', 'glossary'];

const NAV_KEY: Record<Section, 'navDashboard' | 'navProjects' | 'navCalendar' | 'navMembers' | 'navMeeting' | 'navGlossary'> = {
  dashboard: 'navDashboard',
  projects: 'navProjects',
  calendar: 'navCalendar',
  members: 'navMembers',
  meeting: 'navMeeting',
  glossary: 'navGlossary',
};

// スマホの下タブ用の短い名前(6項目が折り返さず1列に収まる長さ)
const SHORT_NAV_KEY: Record<Section, TranslationKey> = {
  dashboard: 'navShortDashboard',
  projects: 'navShortProjects',
  calendar: 'navShortCalendar',
  members: 'navShortMembers',
  meeting: 'navShortMeeting',
  glossary: 'navShortGlossary',
};

// 使い方ガイドを自動で出したかどうか。初めて開いた人にだけ1回出す(localStorage:bridge-pm:guideSeen)。
const GUIDE_SEEN_KEY = 'guideSeen';

function NavIcon({ section }: { section: Section }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (section) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />
        </svg>
      );
    case 'projects':
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        </svg>
      );
    case 'members':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      );
    case 'meeting':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'glossary':
      return (
        <svg {...common}>
          <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h11" />
        </svg>
      );
  }
}

export function Header({
  section,
  onSectionChange,
  members,
  viewerId,
  onViewerChange,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
  members: Member[];
  viewerId: string | null;
  onViewerChange: (memberId: string | null) => void;
}) {
  const { t, lang, setLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(() => !loadJSON<boolean>(GUIDE_SEEN_KEY, false));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeGuide = () => {
    setShowGuide(false);
    saveJSON(GUIDE_SEEN_KEY, true);
  };

  // カレンダー機能を持つアプリなので、開くたびに「今の実際の日付」を
  // 常に確認できるよう、ヘッダーに本日の日付を表示する(デモ用の固定日付では
  // なく、閲覧者のブラウザから見た本日)。
  const todayLabel = currentDateLabelInZone(browserTimezone(), lang === 'ja' ? 'ja-JP' : 'en-US');

  const handleReset = () => {
    setMenuOpen(false);
    if (window.confirm(t('resetConfirm'))) {
      resetToSampleData();
    }
  };

  const handleExport = () => {
    setMenuOpen(false);
    downloadDataExport();
  };

  const handleImportClick = () => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      importDataFromJSON(text);
    } catch {
      window.alert(t('importError'));
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="relative mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-4">
        <div>
          {/* スマホでは、右上に置く「言語・⋯」と重ならないよう右に余白を空ける */}
          <div className="flex min-h-11 items-center gap-2 pr-32 sm:min-h-0 sm:pr-0">
            <h1 className="text-xl font-bold text-slate-900">{t('appTitle')}</h1>
            <span
              className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 sm:inline"
              title={t('demoModeNote')}
            >
              {t('demoModeBadge')}
            </span>
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:inline">
              {t('today')}: {todayLabel}
            </span>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">{t('appSubtitle')}</p>
          {/* スマホ用: サブタイトル・デモモード・今日の日付を、小さく1か所にまとめる */}
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 sm:hidden">
            <span>{t('appSubtitle')}</span>
            <span aria-hidden="true">·</span>
            <span title={t('demoModeNote')}>{t('demoModeBadge')}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t('today')}: {todayLabel}
            </span>
          </p>
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="shrink-0 font-medium">{t('viewerLabel')}:</span>
            <select
              className={`min-w-0 flex-1 rounded-md border px-2 py-1 text-xs sm:flex-none ${
                viewerId ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'
              }`}
              value={viewerId ?? ''}
              onChange={(e) => onViewerChange(e.target.value || null)}
            >
              <option value="">{t('viewerOverall')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* スマホでは右上(題名と同じ行)に置く。PCは今までどおり右側 */}
        <div className="absolute right-4 top-3 flex items-center gap-2 sm:static sm:gap-4">
          <nav className="hidden flex-wrap gap-1 rounded-lg bg-slate-100 p-1 sm:flex">
            {SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSectionChange(s)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  section === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s === 'dashboard' && viewerId ? t('navMyPage') : t(NAV_KEY[s])}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="shrink-0 whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('langToggle')}
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="menu"
              className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowGuide(true);
                    }}
                    className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                  >
                    {t('guideTour')}
                  </button>
                  <button type="button" onClick={handleExport} className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
                    {t('exportData')}
                  </button>
                  <button type="button" onClick={handleImportClick} className="block w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50">
                    {t('importData')}
                  </button>
                  <button type="button" onClick={handleReset} className="block w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50">
                    {t('resetSampleData')}
                  </button>
                </div>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
      </div>

      {/* スマホ用: 画面の下に固定するタブ(6項目を1列。アイコン+短い名前) */}
      <nav
        aria-label={t('mobileNavLabel')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-6">
          {SECTIONS.map((s) => {
            const active = section === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => onSectionChange(s)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 border-t-2 px-0.5 text-xs font-medium ${
                    active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
                  }`}
                >
                  <NavIcon section={s} />
                  <span className="max-w-full truncate">
                    {s === 'dashboard' && viewerId ? t('navShortMyPage') : t(SHORT_NAV_KEY[s])}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {showGuide && <GuidedTour onClose={closeGuide} />}
    </header>
  );
}
