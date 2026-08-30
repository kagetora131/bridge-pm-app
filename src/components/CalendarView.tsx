import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { buildMonthGrid, chunk, type CalendarDay } from '../lib/calendar';
import { WEEKDAY_LABELS } from '../lib/weekdays';
import { occursOn } from '../lib/recurringMeetings';
import type { Member, RecurringMeeting, Task, TaskStatus } from '../types';

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  'in-progress': 'bg-amber-500',
  blocked: 'bg-rose-500',
  done: 'bg-emerald-500',
};

const MEETING_COLOR = 'bg-indigo-500';
const TRACK_HEIGHT_REM = 1.25;
const HEADER_HEIGHT_REM = 1.5;

interface Segment {
  key: string;
  colStart: number; // 0-6 within the week
  colSpan: number; // >=1
  label: string;
  colorClass: string;
  onClick: () => void;
  titleAttr: string;
}

export function CalendarView({
  tasks,
  members,
  recurringMeetings,
  onOpenTask,
  onOpenMeeting,
}: {
  tasks: Task[];
  members: Member[];
  recurringMeetings: RecurringMeeting[];
  onOpenTask: () => void;
  onOpenMeeting: () => void;
}) {
  const { t, lang } = useI18n();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const weeks = useMemo(() => chunk(buildMonthGrid(year, month), 7), [year, month]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
  });
  const weekdayLabels = WEEKDAY_LABELS[lang];
  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name;

  // Quick-jump range: a few months back through well past the current year's
  // December, so any month can be reached in one action instead of repeated clicks.
  const jumpOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let offset = -3; offset <= 16; offset += 1) {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      options.push({
        value: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long' }),
      });
    }
    return options;
  }, [today, lang]);

  const jumpToMonth = (value: string) => {
    const [y, m] = value.split('-').map(Number);
    setYear(y);
    setMonth(m);
  };

  const buildWeekPlacements = (week: CalendarDay[]) => {
    const weekStartIso = week[0].iso;
    const weekEndIso = week[6].iso;
    const raw: Segment[] = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const start = task.startDate && task.startDate <= task.dueDate ? task.startDate : task.dueDate;
      const end = task.dueDate;
      if (end < weekStartIso || start > weekEndIso) continue;
      const clippedStart = start < weekStartIso ? weekStartIso : start;
      const clippedEnd = end > weekEndIso ? weekEndIso : end;
      const colStart = week.findIndex((d) => d.iso === clippedStart);
      const colEndIdx = week.findIndex((d) => d.iso === clippedEnd);
      if (colStart === -1 || colEndIdx === -1) continue;
      raw.push({
        key: `task-${task.id}-${weekStartIso}`,
        colStart,
        colSpan: colEndIdx - colStart + 1,
        label: task.titleJa || task.titleEn,
        colorClass: STATUS_COLOR[task.status],
        onClick: onOpenTask,
        titleAttr: memberName(task.assigneeId) ?? t('unassigned'),
      });
    }

    for (const meeting of recurringMeetings) {
      week.forEach((day, idx) => {
        if (!occursOn(meeting, day.iso)) return;
        raw.push({
          key: `meeting-${meeting.id}-${day.iso}`,
          colStart: idx,
          colSpan: 1,
          label: `${meeting.time} ${meeting.title}`,
          colorClass: MEETING_COLOR,
          onClick: onOpenMeeting,
          titleAttr: meeting.participantIds.map((id) => memberName(id)).filter(Boolean).join(', '),
        });
      });
    }

    const sorted = [...raw].sort((a, b) => a.colStart - b.colStart || b.colSpan - a.colSpan);
    const trackEnds: number[] = [];
    const placed: { segment: Segment; track: number }[] = [];
    for (const seg of sorted) {
      let track = trackEnds.findIndex((end) => end < seg.colStart);
      if (track === -1) {
        track = trackEnds.length;
        trackEnds.push(seg.colStart + seg.colSpan - 1);
      } else {
        trackEnds[track] = seg.colStart + seg.colSpan - 1;
      }
      placed.push({ segment: seg, track });
    }
    return placed;
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{t('calendarHeading')}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="prev month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            {t('today')}
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            aria-label="next month"
          >
            ›
          </button>
          <select
            className="input w-auto"
            value={`${year}-${month}`}
            onChange={(e) => jumpToMonth(e.target.value)}
            aria-label={t('jumpToMonth')}
          >
            {jumpOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{monthLabel}</p>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <Legend colorClass="bg-slate-400" label={t('statusTodo')} />
          <Legend colorClass="bg-amber-500" label={t('statusInProgress')} />
          <Legend colorClass="bg-rose-500" label={t('statusBlocked')} />
          <Legend colorClass="bg-emerald-500" label={t('statusDone')} />
          <Legend colorClass={MEETING_COLOR} label={t('recurringMeetingsHeading')} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-7 bg-slate-200">
          {weekdayLabels.map((w) => (
            <div key={w} className="bg-slate-50 px-2 py-1 text-center text-xs font-medium text-slate-500">
              {w}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => {
          const placements = buildWeekPlacements(week);
          const trackCount = placements.length > 0 ? Math.max(...placements.map((p) => p.track)) + 1 : 0;
          const minHeightRem = HEADER_HEIGHT_REM + trackCount * TRACK_HEIGHT_REM + 0.25;
          return (
            <div key={wi} className="relative border-t border-slate-200">
              <div className="grid grid-cols-7">
                {week.map((cell) => (
                  <div
                    key={cell.iso}
                    className={`border-l border-slate-100 px-1 pt-1 first:border-l-0 ${
                      cell.inCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'
                    }`}
                    style={{ minHeight: `${minHeightRem}rem` }}
                  >
                    <p className="text-right text-xs">
                      <span
                        className={
                          cell.isToday
                            ? 'inline-block rounded-full bg-slate-900 px-1.5 text-white'
                            : cell.inCurrentMonth
                              ? 'text-slate-700'
                              : ''
                        }
                      >
                        {cell.day}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0" style={{ top: `${HEADER_HEIGHT_REM}rem` }}>
                {placements.map(({ segment, track }) => (
                  <button
                    key={segment.key}
                    type="button"
                    onClick={segment.onClick}
                    title={segment.titleAttr}
                    className={`pointer-events-auto absolute flex items-center overflow-hidden truncate rounded px-1 text-[10px] font-medium text-white ${segment.colorClass} hover:opacity-90`}
                    style={{
                      left: `calc(${(segment.colStart / 7) * 100}% + 2px)`,
                      width: `calc(${(segment.colSpan / 7) * 100}% - 4px)`,
                      top: `${track * TRACK_HEIGHT_REM}rem`,
                      height: '1.1rem',
                    }}
                  >
                    {segment.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      {label}
    </span>
  );
}
