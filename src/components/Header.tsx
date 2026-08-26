import { useI18n } from '../i18n/I18nContext';

export type Section = 'tasks' | 'members' | 'meeting' | 'glossary';

const SECTIONS: Section[] = ['tasks', 'members', 'meeting', 'glossary'];

const NAV_KEY: Record<Section, 'navTasks' | 'navMembers' | 'navMeeting' | 'navGlossary'> = {
  tasks: 'navTasks',
  members: 'navMembers',
  meeting: 'navMeeting',
  glossary: 'navGlossary',
};

export function Header({
  section,
  onSectionChange,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
}) {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('appTitle')}</h1>
          <p className="text-sm text-slate-500">{t('appSubtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
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
                {t(NAV_KEY[s])}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('langToggle')}
          </button>
        </div>
      </div>
    </header>
  );
}
