import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { computeMeetingWindow, findBestCompromise } from '../lib/meetingSuggest';
import { browserTimezone, formatHourLabel, todayISO } from '../lib/timezone';
import { availableTimezones } from '../lib/timezoneList';
import type { Member, MeetingSlot } from '../types';

function rangeLabel(slot: MeetingSlot, tz: string): string {
  return `${formatHourLabel(slot.startMs, tz)} – ${formatHourLabel(slot.endMs, tz)}`;
}

function Bar({
  windowStart,
  windowEnd,
  intervals,
  markerSlot,
  color,
}: {
  windowStart: number;
  windowEnd: number;
  intervals: MeetingSlot[];
  markerSlot: MeetingSlot | null;
  color: string;
}) {
  const span = windowEnd - windowStart;
  const pct = (ms: number) => `${((ms - windowStart) / span) * 100}%`;

  return (
    <div className="relative h-8 w-full overflow-hidden rounded-md bg-slate-100">
      {intervals.map((iv, idx) => (
        <div
          key={idx}
          className={`absolute top-0 h-full ${color}`}
          style={{ left: pct(iv.startMs), width: `${((iv.endMs - iv.startMs) / span) * 100}%` }}
        />
      ))}
      {markerSlot && (
        <>
          <div className="absolute top-0 h-full w-0.5 bg-rose-500" style={{ left: pct(markerSlot.startMs) }} />
          <div className="absolute top-0 h-full w-0.5 bg-rose-500" style={{ left: pct(markerSlot.endMs) }} />
        </>
      )}
    </div>
  );
}

export function MeetingPlanner({ members }: { members: Member[] }) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => members.slice(0, 3).map((m) => m.id));
  const [referenceDate, setReferenceDate] = useState(todayISO());
  const [displayTz, setDisplayTz] = useState(browserTimezone());
  const timezones = availableTimezones();

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.includes(m.id)),
    [members, selectedIds],
  );

  const window = useMemo(
    () => (selectedMembers.length > 0 ? computeMeetingWindow(selectedMembers, referenceDate) : null),
    [selectedMembers, referenceDate],
  );

  const compromise = useMemo(() => {
    if (!window || window.fullOverlap.length > 0) return null;
    return findBestCompromise(selectedMembers, window);
  }, [window, selectedMembers]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const hourTicks = window
    ? Array.from({ length: 9 }, (_, i) => window.windowStart + i * 3 * 60 * 60 * 1000)
    : [];

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{t('meetingHeading')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('meetingDesc')}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-600">{t('selectMembers')}</p>
          <div className="space-y-1 rounded-md border border-slate-200 bg-white p-2">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                {m.name}
                <span className="text-xs text-slate-400">({m.timezone})</span>
              </label>
            ))}
          </div>
        </div>
        <label className="block text-sm text-slate-600">
          <span className="mb-1 block font-medium">{t('referenceDate')}</span>
          <input
            type="date"
            className="input"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
          />
        </label>
        <label className="block text-sm text-slate-600">
          <span className="mb-1 block font-medium">{t('displayTimezone')}</span>
          <select className="input" value={displayTz} onChange={(e) => setDisplayTz(e.target.value)}>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedMembers.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t('selectAtLeastOne')}</p>
      ) : (
        window && (
          <div className="mt-6">
            <div className="mb-1 flex text-[10px] text-slate-400">
              {hourTicks.map((ms, idx) => (
                <div key={idx} style={{ width: `${100 / (hourTicks.length - 1)}%` }} className="text-center first:text-left last:text-right">
                  {formatHourLabel(ms, displayTz)}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {selectedMembers.map((m) => (
                <div key={m.id}>
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
                    {m.name}
                    {window.perMember[m.id].length === 0 && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-normal text-slate-400">{t('restDay')}</span>
                    )}
                  </p>
                  <Bar
                    windowStart={window.windowStart}
                    windowEnd={window.windowEnd}
                    intervals={window.perMember[m.id]}
                    markerSlot={
                      window.fullOverlap[0] ?? compromise?.slot ?? null
                    }
                    color="bg-sky-400"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">{t('timelineLegend')}</p>

            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
              {window.fullOverlap.length > 0 ? (
                <div>
                  <p className="font-medium text-emerald-700">{t('fullOverlapFound')}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {window.fullOverlap.map((slot, idx) => (
                      <li key={idx}>{rangeLabel(slot, displayTz)}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-amber-700">{t('noFullOverlap')}</p>
                  {compromise && (
                    <div className="mt-3 text-sm text-slate-700">
                      <p className="font-medium">{t('compromiseHeading')}: {rangeLabel(compromise.slot, displayTz)}</p>
                      <p className="mt-2 text-slate-600">
                        {t('coveredMembers')}:{' '}
                        {compromise.coveredMemberIds.length > 0
                          ? compromise.coveredMemberIds
                              .map((id) => selectedMembers.find((m) => m.id === id)?.name)
                              .filter(Boolean)
                              .join(', ')
                          : '—'}
                      </p>
                      {compromise.outside.length > 0 && (
                        <div className="mt-2">
                          <p className="text-slate-600">{t('outsideMembers')}:</p>
                          <ul className="ml-4 list-disc text-slate-600">
                            {compromise.outside.map((o) => {
                              const name = selectedMembers.find((m) => m.id === o.memberId)?.name;
                              const unit = o.direction === 'before' ? t('minutesBefore') : t('minutesAfter');
                              return (
                                <li key={o.memberId}>
                                  {name}: {Number.isFinite(o.minutesOutside) ? `${o.minutesOutside} ${unit}` : '—'}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </section>
  );
}
