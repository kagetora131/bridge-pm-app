import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  currentDateLabelInZone,
  currentTimeInZone,
  currentWeekdayInZone,
  utcOffsetMinutes,
} from '../lib/timezone';
import { availableTimezones } from '../lib/timezoneList';
import { newId } from '../lib/storage';
import { DEFAULT_WORKING_DAYS, WEEKDAY_LABELS } from '../lib/weekdays';
import { computeWorkloads } from '../lib/workload';
import type { Assignment, Member } from '../types';

const emptyDraft = {
  name: '',
  role: '',
  location: '',
  timezone: 'Asia/Tokyo',
  workStart: '09:00',
  workEnd: '18:00',
  workingDays: DEFAULT_WORKING_DAYS,
  weeklyCapacityHours: 40,
  languages: '',
  hourlyRateUsd: 0,
  localCurrencyCode: '',
  localHourlyRate: '',
};

function isWorkingNow(member: Member): boolean {
  const workingDays = member.workingDays ?? DEFAULT_WORKING_DAYS;
  if (!workingDays.includes(currentWeekdayInZone(member.timezone))) return false;
  const nowHHmm = currentTimeInZone(member.timezone);
  return nowHHmm >= member.workStart && nowHHmm < member.workEnd;
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
  assignments,
}: {
  members: Member[];
  setMembers: (updater: (prev: Member[]) => Member[]) => void;
  assignments: Assignment[];
}) {
  const { t, lang } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [, forceTick] = useState(0);
  const timezones = availableTimezones();
  const weekdayLabels = WEEKDAY_LABELS[lang];
  const workloads = computeWorkloads(members, assignments);

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
      role: member.role ?? '',
      location: member.location,
      timezone: member.timezone,
      workStart: member.workStart,
      workEnd: member.workEnd,
      workingDays: member.workingDays ?? DEFAULT_WORKING_DAYS,
      weeklyCapacityHours: member.weeklyCapacityHours ?? 40,
      languages: member.languages.join(', '),
      hourlyRateUsd: member.hourlyRateUsd ?? 0,
      localCurrencyCode: member.localCurrencyCode ?? '',
      localHourlyRate: member.localHourlyRate != null ? String(member.localHourlyRate) : '',
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const toggleWorkingDay = (day: number) => {
    setDraft((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  const submit = () => {
    if (!draft.name.trim()) return;
    const languages = draft.languages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const { localCurrencyCode, localHourlyRate, ...rest } = draft;
    const payload = {
      ...rest,
      languages,
      localCurrencyCode: localCurrencyCode.trim() || undefined,
      localHourlyRate: localHourlyRate.trim() ? Number(localHourlyRate) : undefined,
    };

    if (editingId) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? { ...m, ...payload }
            : m,
        ),
      );
    } else {
      const member: Member = { id: newId(), ...payload };
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
            <Field label={t('role')}>
              <input className="input" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
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
            <Field label={t('weeklyCapacity')}>
              <input
                type="number"
                min={0}
                className="input"
                value={draft.weeklyCapacityHours}
                onChange={(e) => setDraft({ ...draft, weeklyCapacityHours: Number(e.target.value) })}
              />
            </Field>
            <Field label={t('hourlyRateUsd')}>
              <input
                type="number"
                min={0}
                className="input"
                value={draft.hourlyRateUsd}
                onChange={(e) => setDraft({ ...draft, hourlyRateUsd: Number(e.target.value) })}
              />
            </Field>
            <Field label={t('localRateReference')}>
              <div className="flex items-center gap-2">
                <input
                  className="input w-24"
                  placeholder="JPY"
                  value={draft.localCurrencyCode}
                  onChange={(e) => setDraft({ ...draft, localCurrencyCode: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  className="input"
                  placeholder={t('optional')}
                  value={draft.localHourlyRate}
                  onChange={(e) => setDraft({ ...draft, localHourlyRate: e.target.value })}
                />
              </div>
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
            <Field label={t('workingDays')}>
              <div className="flex gap-1">
                {weekdayLabels.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`h-8 w-8 rounded-md border text-xs font-medium ${
                      draft.workingDays.includes(day)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
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
            const working = isWorkingNow(member);
            const workload = workloads.get(member.id);
            const workingDays = member.workingDays ?? DEFAULT_WORKING_DAYS;
            return (
              <li key={member.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {member.name}
                      {member.role && <span className="ml-2 text-xs font-normal text-slate-400">{member.role}</span>}
                    </p>
                    <p className="text-sm text-slate-500">
                      {member.location} · {member.timezone} ({formatOffset(utcOffsetMinutes(member.timezone))})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('workHours')}: {member.workStart}–{member.workEnd} ·{' '}
                      {WEEKDAY_LABELS[lang].filter((_, d) => workingDays.includes(d)).join('')}
                      {member.languages.length > 0 && <> · {t('languages')}: {member.languages.join(', ')}</>}
                    </p>
                    {workload && (
                      <p className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-slate-500">
                          {t('weeklyCapacity')}: {workload.totalAllocatedHours}h / {workload.capacityHours}h ({workload.utilizationPct}%)
                        </span>
                        {workload.isOverloaded && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 font-medium text-rose-700">{t('overloaded')}</span>
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {t('hourlyRateUsd')}: ${member.hourlyRateUsd ?? 0}/h
                      {member.localCurrencyCode && member.localHourlyRate != null && (
                        <> ({t('localRateReference')}: {member.localHourlyRate} {member.localCurrencyCode}/h)</>
                      )}
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
