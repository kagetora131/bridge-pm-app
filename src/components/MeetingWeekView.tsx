import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { addDaysISO, browserTimezone, todayISO } from '../lib/timezone';
import { timezonesInUse } from '../lib/timezoneList';
import { computeWeekOccurrences, startOfWeekISO } from '../lib/meetingWeekView';
import { WEEKDAY_LABELS } from '../lib/weekdays';
import type { Member, RecurringMeeting } from '../types';

const HOUR_HEIGHT_REM = 2.25;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function MeetingWeekView({ meetings, members }: { meetings: RecurringMeeting[]; members: Member[] }) {
  const { t, lang } = useI18n();
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO(todayISO()));
  const [displayTz, setDisplayTz] = useState(browserTimezone());
  const timezones = timezonesInUse(members);
  const weekdayLabels = WEEKDAY_LABELS[lang];

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart]);
  const occurrences = useMemo(
    () => computeWeekOccurrences(meetings, weekDates, displayTz),
    [meetings, weekDates, displayTz],
  );

  const shiftWeek = (deltaWeeks: number) => setWeekStart(addDaysISO(weekStart, deltaWeeks * 7));
  const goThisWeek = () => setWeekStart(startOfWeekISO(todayISO()));

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
  const todayIso = todayISO();

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
          {t('displayTimezone')}
          <select className="input w-auto" value={displayTz} onChange={(e) => setDisplayTz(e.target.value)}>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <div className="flex min-w-[36rem]">
          <div className="w-12 shrink-0">
            <div className="h-8 border-b border-slate-200" />
            {HOURS.map((h) => (
              <div key={h} className="border-t border-slate-100 pr-1 text-right text-[10px] text-slate-400" style={{ height: `${HOUR_HEIGHT_REM}rem` }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            <div className="grid h-8 grid-cols-7 border-b border-slate-200 bg-slate-50">
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
                {occurrences.map(({ meeting, dayIndex, startMinuteOfDay, endMinuteOfDay }) => (
                  <button
                    key={`${meeting.id}-${dayIndex}`}
                    type="button"
                    title={meeting.participantIds.map(memberName).join(', ')}
                    className="pointer-events-auto absolute overflow-hidden rounded bg-indigo-500 px-1 py-0.5 text-left text-[10px] font-medium text-white hover:bg-indigo-600"
                    style={{
                      left: `calc(${(dayIndex / 7) * 100}% + 2px)`,
                      width: `calc(${(1 / 7) * 100}% - 4px)`,
                      top: `${(startMinuteOfDay / 60) * HOUR_HEIGHT_REM}rem`,
                      height: `${Math.max(1, ((endMinuteOfDay - startMinuteOfDay) / 60) * HOUR_HEIGHT_REM)}rem`,
                    }}
                  >
                    <div className="truncate">{meeting.title}</div>
                    <div className="truncate text-indigo-100">
                      {String(Math.floor(startMinuteOfDay / 60)).padStart(2, '0')}:{String(startMinuteOfDay % 60).padStart(2, '0')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
