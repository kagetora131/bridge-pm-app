import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import type { GlossaryTerm } from '../types';

const emptyDraft = { termJa: '', termEn: '', note: '' };

export function Glossary({
  terms,
  setTerms,
}: {
  terms: GlossaryTerm[];
  setTerms: (updater: (prev: GlossaryTerm[]) => GlossaryTerm[]) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (term) =>
        term.termJa.toLowerCase().includes(q) ||
        term.termEn.toLowerCase().includes(q) ||
        term.note.toLowerCase().includes(q),
    );
  }, [terms, query]);

  const submit = () => {
    if (!draft.termJa.trim() && !draft.termEn.trim()) return;
    const term: GlossaryTerm = { id: newId(), ...draft };
    setTerms((prev) => [term, ...prev]);
    setDraft(emptyDraft);
    setShowForm(false);
  };

  const remove = (id: string) => setTerms((prev) => prev.filter((term) => term.id !== id));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('glossaryHeading')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('translationLanguageNote')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input"
            placeholder={t('searchGlossary')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t('addTerm')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <input
            className="input"
            placeholder={t('termJa')}
            value={draft.termJa}
            onChange={(e) => setDraft({ ...draft, termJa: e.target.value })}
          />
          <input
            className="input"
            placeholder={t('termEn')}
            value={draft.termEn}
            onChange={(e) => setDraft({ ...draft, termEn: e.target.value })}
          />
          <input
            className="input"
            placeholder={t('note')}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
          <div className="sm:col-span-3 flex gap-2">
            <button type="button" onClick={submit} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              {t('save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noTerms')}</p>
      ) : (
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400">
              <th className="px-2">{t('termJa')}</th>
              <th className="px-2">{t('termEn')}</th>
              <th className="px-2">{t('note')}</th>
              <th className="px-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((term) => (
              <tr key={term.id} className="rounded-lg bg-white shadow-sm">
                <td className="rounded-l-lg px-2 py-2 font-medium text-slate-900">{term.termJa}</td>
                <td className="px-2 py-2 text-slate-700">{term.termEn}</td>
                <td className="px-2 py-2 text-slate-500">{term.note}</td>
                <td className="rounded-r-lg px-2 py-2 text-right">
                  <button type="button" onClick={() => remove(term.id)} className="text-rose-500 hover:text-rose-700">
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
