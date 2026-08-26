import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { currentDateLabelInZone, currentTimeInZone, utcOffsetMinutes } from '../lib/timezone';
import { availableTimezones } from '../lib/timezoneList';
import { newId } from '../lib/storage';
import type { Member } from '../types';

const emptyDraft = {
  name: '',
  location: '',
  timezone: 'Asia/Tokyo',
  workStart: '09:00',
  workEnd: '18:00',
  languages: '',
};

function isWithinWorkHours(nowHHmm: string, workStart: string, workEnd: string): boolean {
  return nowHHmm >= workStart && nowHHmm < workEnd;
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

export function MemberManager({
  members,
  setMembers,
}: {
  members: Member[];
  setMembers: (updater: (prev: Member[]) => Member[]) => void;
}) {
  const { t, lang } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [, forceTick] = useState(0);
  const timezones = availableTimezones();

  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const startAdd = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (member: Member) => {
    setDraft({
      name: member.name,
      location: member.location,
      timezone: member.timezone,
      workStart: member.workStart,
      workEnd: member.workEnd,
      languages: member.languages.join(', '),
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const submit = () => {
    if (!draft.name.trim()) return;
    const languages = draft.languages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? { ...m, ...draft, languages }
            : m,
        ),
      );
    } else {
      const member: Member = { id: newId(), ...draft, languages };
      setMembers((prev) => [...prev, member]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const remove = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t('membersHeading')}</h2>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t('addMember')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('name')}>
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label={t('location')}>
              <input className="input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            </Field>
            <Field label={t('timezone')}>
              <select className="input" value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('languages')}>
              <input
                className="input"
                placeholder="ja, en, vi..."
                value={draft.languages}
                onChange={(e) => setDraft({ ...draft, languages: e.target.value })}
              />
            </Field>
            <Field label={t('workHours')}>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="input"
                  value={draft.workStart}
                  onChange={(e) => setDraft({ ...draft, workStart: e.target.value })}
                />
                <span className="text-slate-400">–</span>
                <input
                  type="time"
                  className="input"
                  value={draft.workEnd}
                  onChange={(e) => setDraft({ ...draft, workEnd: e.target.value })}
                />
              </div>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
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

      {members.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noMembers')}</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => {
            const nowHHmm = currentTimeInZone(member.timezone);
            const working = isWithinWorkHours(nowHHmm, member.workStart, member.workEnd);
            return (
              <li key={member.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">
                      {member.location} · {member.timezone} ({formatOffset(utcOffsetMinutes(member.timezone))})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('workHours')}: {member.workStart}–{member.workEnd}
                      {member.languages.length > 0 && <> · {t('languages')}: {member.languages.join(', ')}</>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tabular-nums text-slate-900">{nowHHmm}</p>
                    <p className="text-xs text-slate-500">{currentDateLabelInZone(member.timezone, lang === 'ja' ? 'ja-JP' : 'en-US')}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        working ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {working ? t('workingNow') : t('offHoursNow')}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => startEdit(member)} className="text-sm text-slate-500 hover:text-slate-900">
                    {t('edit')}
                  </button>
                  <button type="button" onClick={() => remove(member.id)} className="text-sm text-rose-500 hover:text-rose-700">
                    {t('delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
