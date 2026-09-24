import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { newId } from '../lib/storage';
import { timezonesInUse } from '../lib/timezoneList';
import { WEEKDAY_LABELS } from '../lib/weekdays';
import { upcomingHolidayConflicts } from '../lib/recurringMeetings';
import { todayISO } from '../lib/timezone';
import { MeetingWeekView } from './MeetingWeekView';
import type { Member, RecurringMeeting } from '../types';

const emptyDraft = {
  title: '',
  participantIds: [] as string[],
  weekday: 1,
  time: '10:00',
  durationMinutes: 60,
  timezone: 'Asia/Tokyo',
  startDate: '',
  endDate: '',
  notes: '',
};

export function RecurringMeetings({
  meetings,
  setMeetings,
  members,
  defaultTimezone,
}: {
  meetings: RecurringMeeting[];
  setMeetings: (updater: (prev: RecurringMeeting[]) => RecurringMeeting[]) => void;
  members: Member[];
  defaultTimezone?: string;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const weekdayLabels = WEEKDAY_LABELS[lang];
  const timezones = timezonesInUse(members);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

  const startAdd = () => {
    setDraft({ ...emptyDraft, timezone: timezones[0] ?? emptyDraft.timezone });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (meeting: RecurringMeeting) => {
    setDraft({
      title: meeting.title,
      participantIds: meeting.participantIds,
      weekday: meeting.weekday,
      time: meeting.time,
      durationMinutes: meeting.durationMinutes ?? 60,
      timezone: meeting.timezone,
      startDate: meeting.startDate ?? '',
      endDate: meeting.endDate ?? '',
      notes: meeting.notes,
    });
    setEditingId(meeting.id);
    setShowForm(true);
  };

  const toggleParticipant = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter((x) => x !== id)
        : [...prev.participantIds, id],
    }));
  };

  const submit = () => {
    if (!draft.title.trim()) return;
    const payload = {
      title: draft.title,
      participantIds: draft.participantIds,
      weekday: draft.weekday,
      time: draft.time,
      durationMinutes: draft.durationMinutes,
      timezone: draft.timezone,
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      notes: draft.notes,
    };
    if (editingId) {
      setMeetings((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...payload } : m)));
    } else {
      setMeetings((prev) => [...prev, { id: newId(), ...payload }]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const remove = (id: string) => setMeetings((prev) => prev.filter((m) => m.id !== id));

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('recurringMeetingsHeading')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('recurringMeetingsDesc')}</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {t('addRecurringMeeting')}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('meetingTitle')}>
              <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={t('recurrenceTimezone')}>
              <select className="input" value={draft.timezone} onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('weekday')}>
              <select className="input" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
                {weekdayLabels.map((label, idx) => (
                  <option key={idx} value={idx}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('meetingTime')}>
              <input type="time" className="input" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </Field>
            <Field label={t('durationMinutes')}>
              <input
                type="number"
                min={15}
                step={15}
                className="input"
                value={draft.durationMinutes}
                onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })}
              />
            </Field>
            <Field label={t('recurrenceStart')}>
              <input type="date" className="input" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
            </Field>
            <Field label={t('recurrenceEnd')}>
              <input type="date" className="input" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
            </Field>
            <Field label={t('note')}>
              <input className="input" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </Field>
          </div>
          <div className="mt-3">
            <p className="mb-1 text-sm font-medium text-slate-600">{t('participants')}</p>
            <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-3">
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={draft.participantIds.includes(m.id)} onChange={() => toggleParticipant(m.id)} />
                  {m.name}
                </label>
              ))}
            </div>
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

      {meetings.length > 0 && (
        <div className="mb-6">
          <MeetingWeekView meetings={meetings} members={members} defaultTimezone={defaultTimezone} />
        </div>
      )}

      {meetings.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noRecurringMeetings')}</p>
      ) : (
        <ul className="space-y-2">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{meeting.title}</p>
                <p className="text-xs text-slate-500">
                  {t('every')} {weekdayLabels[meeting.weekday]} {meeting.time} ({meeting.timezone})
                  {meeting.participantIds.length > 0 && <> · {meeting.participantIds.map(memberName).join(', ')}</>}
                </p>
                {(meeting.startDate || meeting.endDate) && (
                  <p className="text-xs text-slate-400">
                    {meeting.startDate ?? '—'} 〜 {meeting.endDate ?? t('noEnd')}
                  </p>
                )}
                {meeting.notes && <p className="text-xs text-slate-400">{meeting.notes}</p>}
                {upcomingHolidayConflicts(meeting, members, today)
                  .slice(0, 2)
                  .map(({ occurrence, conflicts }) => (
                    <p key={occurrence.startMs} className="mt-1 text-xs text-amber-700">
                      ⚠ {t('holidayConflictHeading')}: {occurrence.dateISO} ({weekdayLabels[meeting.weekday]}) —{' '}
                      {conflicts.map((c) => `${memberName(c.memberId)} (${c.holidayName})`).join(', ')}
                    </p>
                  ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(meeting)} className="text-sm text-slate-500 hover:text-slate-900">
                  {t('edit')}
                </button>
                <button type="button" onClick={() => remove(meeting.id)} className="text-sm text-rose-500 hover:text-rose-700">
                  {t('delete')}
                </button>
              </div>
            </li>
          ))}
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
