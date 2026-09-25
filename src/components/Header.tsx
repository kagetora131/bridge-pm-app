import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { resetToSampleData } from '../lib/seedVersion';
import { downloadDataExport, importDataFromJSON } from '../lib/dataPortability';
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
  const [showGuide, setShowGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{t('appTitle')}</h1>
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800"
              title={t('demoModeNote')}
            >
              {t('demoModeBadge')}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {t('today')}: {todayLabel}
            </span>
          </div>
          <p className="text-sm text-slate-500">{t('appSubtitle')}</p>
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium">{t('viewerLabel')}:</span>
            <select
              className={`rounded-md border px-2 py-1 text-xs ${
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
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
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
      {showGuide && <GuidedTour onClose={() => setShowGuide(false)} />}
    </header>
  );
}
