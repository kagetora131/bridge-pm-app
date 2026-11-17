import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { addDaysISO, browserTimezone, todayISO } from '../lib/timezone';
import { timezonesInUse } from '../lib/timezoneList';
import { computeWeekOccurrences, startOfWeekISO } from '../lib/meetingWeekView';
import { WEEKDAY_LABELS } from '../lib/weekdays';
import { holidayConflictsAt } from '../lib/recurringMeetings';
import type { Member, RecurringMeeting } from '../types';

const HOUR_HEIGHT_REM = 2.25;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
// 会議が1つも無い週は、開いたときにこの時刻の付近を見せる(深夜の空欄ではなく、日中から)
const DEFAULT_SCROLL_HOUR = 8;

function formatHM(minuteOfDay: number): string {
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`;
}

export function MeetingWeekView({
  meetings,
  members,
  defaultTimezone,
}: {
  meetings: RecurringMeeting[];
  members: Member[];
  defaultTimezone?: string;
}) {
  const { t, lang } = useI18n();
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(todayISO()));
  const [displayTz, setDisplayTz] = useState(() => defaultTimezone ?? browserTimezone());
  const scrollRef = useRef<HTMLDivElement>(null);
  const timezones = timezonesInUse(members);
  const weekdayLabels = WEEKDAY_LABELS[lang];

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart]);
  const occurrences = useMemo(
    () => computeWeekOccurrences(meetings, weekDates, displayTz),
    [meetings, weekDates, displayTz],
  );

  // PCの表: 開いたとき(週・タイムゾーンを変えたときも)、その週の最初の会議の1時間前へ。
  // 会議が無い週は8:00へ。0:00から始まる深夜の空欄が先に見えてしまうのを避ける。
  const firstMinute = occurrences.length > 0 ? Math.min(...occurrences.map((o) => o.startMinuteOfDay)) : null;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetHour = firstMinute === null ? DEFAULT_SCROLL_HOUR : Math.max(0, Math.floor(firstMinute / 60) - 1);
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    el.scrollTop = targetHour * HOUR_HEIGHT_REM * rootPx;
  }, [weekStart, displayTz, firstMinute]);

  const shiftWeek = (deltaWeeks: number) => setWeekStart(addDaysISO(weekStart, deltaWeeks * 7));
  const goThisWeek = () => setWeekStart(startOfWeekISO(todayISO()));

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
  const todayIso = todayISO();

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="prev week"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goThisWeek}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t('thisWeek')}
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="next week"
          >
            ›
          </button>
          <span className="text-sm font-medium text-slate-700">
            {weekDates[0]} 〜 {weekDates[6]}
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="shrink-0">{t('displayTimezone')}</span>
          <select className="input min-w-0 flex-1 sm:w-auto sm:flex-none" value={displayTz} onChange={(e) => setDisplayTz(e.target.value)}>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* スマホ用: 週の表の代わりに、日ごとの一覧(日付 → その日の会議)。時刻は選んだタイムゾーンで出す */}
      <div className="space-y-3 sm:hidden">
        {weekDates.map((d, i) => {
          const dayOccurrences = occurrences
            .filter((o) => o.dayIndex === i)
            .sort((a, b) => a.startMinuteOfDay - b.startMinuteOfDay);
          const isToday = d === todayIso;
          return (
            <section key={d}>
              <h4 className={`flex items-center gap-1 text-sm font-semibold ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>
                {d.slice(5)} ({weekdayLabels[i]})
                {isToday && <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />}
              </h4>
              {dayOccurrences.length === 0 ? (
                <p className="mt-1 text-xs text-slate-400">{t('weekNoMeetings')}</p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {dayOccurrences.map(({ meeting, startMinuteOfDay, endMinuteOfDay, startMs }) => {
                    const conflicts = holidayConflictsAt(meeting, members, startMs);
                    const hasConflict = conflicts.length > 0;
                    return (
                      <li
                        key={`${meeting.id}-${i}`}
                        className={`rounded-md border-l-4 px-3 py-2 ${
                          hasConflict ? 'border-amber-400 bg-amber-50' : 'border-indigo-500 bg-indigo-50'
                        }`}
                      >
                        <p className="text-xs font-medium tabular-nums text-slate-600">
                          {formatHM(startMinuteOfDay)}–{formatHM(endMinuteOfDay)}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {hasConflict && '⚠ '}
                          {meeting.title}
                        </p>
                        <p className="text-xs text-slate-600">{meeting.participantIds.map(memberName).join(', ')}</p>
                        {conflicts.map((c) => (
                          <p key={c.memberId} className="text-xs text-amber-800">
                            ⚠ {memberName(c.memberId)}: {c.holidayName}
                          </p>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* PC用: 今までどおりの週の表(縦に最大34remで内側にスクロール。日付の行は上に固定) */}
      <div ref={scrollRef} className="hidden max-h-[34rem] overflow-auto rounded-lg border border-slate-200 sm:block">
        <div className="flex min-w-[36rem]">
          <div className="w-12 shrink-0">
            <div className="sticky top-0 z-10 h-8 border-b border-slate-200 bg-white" />
            {HOURS.map((h) => (
              <div key={h} className="border-t border-slate-100 pr-1 text-right text-[10px] text-slate-400" style={{ height: `${HOUR_HEIGHT_REM}rem` }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            <div className="sticky top-0 z-10 grid h-8 grid-cols-7 border-b border-slate-200 bg-slate-50">
              {weekDates.map((d, i) => (
                <div
                  key={d}
                  className={`flex items-center justify-center border-l border-slate-200 text-xs font-medium first:border-l-0 ${
                    d === todayIso ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {weekdayLabels[i]} {d.slice(5)}
                  {d === todayIso && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-slate-900" />}
                </div>
              ))}
            </div>

            <div className="relative grid grid-cols-7" style={{ height: `${HOUR_HEIGHT_REM * 24}rem` }}>
              {weekDates.map((d) => (
                <div key={d} className="border-l border-slate-100 first:border-l-0">
                  {HOURS.map((h) => (
                    <div key={h} className="border-t border-slate-100" style={{ height: `${HOUR_HEIGHT_REM}rem` }} />
                  ))}
                </div>
              ))}

              <div className="pointer-events-none absolute inset-0">
                {occurrences.map(({ meeting, dayIndex, startMinuteOfDay, endMinuteOfDay, startMs }) => {
                  const conflicts = holidayConflictsAt(meeting, members, startMs);
                  const hasConflict = conflicts.length > 0;
                  const tooltip = [
                    meeting.participantIds.map(memberName).join(', '),
                    ...conflicts.map((c) => `⚠ ${memberName(c.memberId)}: ${c.holidayName}`),
                  ].join('\n');
                  return (
                    <button
                      key={`${meeting.id}-${dayIndex}`}
                      type="button"
                      title={tooltip}
                      className={`pointer-events-auto absolute overflow-hidden rounded px-1 py-0.5 text-left text-[10px] font-medium ${
                        hasConflict ? 'bg-amber-300 text-amber-950 hover:bg-amber-400' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                      }`}
                      style={{
                        left: `calc(${(dayIndex / 7) * 100}% + 2px)`,
                        width: `calc(${(1 / 7) * 100}% - 4px)`,
                        top: `${(startMinuteOfDay / 60) * HOUR_HEIGHT_REM}rem`,
                        height: `${Math.max(1, ((endMinuteOfDay - startMinuteOfDay) / 60) * HOUR_HEIGHT_REM)}rem`,
                      }}
                    >
                      <div className="truncate">
                        {hasConflict && '⚠ '}
                        {meeting.title}
                      </div>
                      <div className={`truncate ${hasConflict ? 'text-amber-900' : 'text-indigo-100'}`}>
                        {formatHM(startMinuteOfDay)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400 sm:text-[11px]">{t('weekViewHolidayLegend')}</p>
    </div>
  );
}
