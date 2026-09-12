import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { computeMeetingWindow, nearestAllWorkingDayISO } from '../lib/meetingSuggest';
import { findMeetingCandidates, type MeetingCandidate, type MeetingCandidateKind } from '../lib/meetingCandidates';
import { computeBurdenHistory } from '../lib/meetingHistory';
import { browserTimezone, formatHourLabel, todayISO } from '../lib/timezone';
import { timezonesInUse } from '../lib/timezoneList';
import { newId } from '../lib/storage';
import { RecurringMeetings } from './RecurringMeetings';
import type { Member, MeetingDecisionLogEntry, MeetingSlot, RecurringMeeting } from '../types';

const DURATION_OPTIONS = [30, 45, 60];

const CANDIDATE_LABEL_KEY: Record<MeetingCandidateKind, 'candidateOptimal' | 'candidateJpEarly' | 'candidateOverseasAfterHours'> = {
  optimal: 'candidateOptimal',
  jpEarly: 'candidateJpEarly',
  overseasAfterHours: 'candidateOverseasAfterHours',
};

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

export function MeetingPlanner({
  members,
  recurringMeetings,
  setRecurringMeetings,
  meetingBurdenLog,
  setMeetingBurdenLog,
}: {
  members: Member[];
  recurringMeetings: RecurringMeeting[];
  setRecurringMeetings: (updater: (prev: RecurringMeeting[]) => RecurringMeeting[]) => void;
  meetingBurdenLog: MeetingDecisionLogEntry[];
  setMeetingBurdenLog: (updater: (prev: MeetingDecisionLogEntry[]) => MeetingDecisionLogEntry[]) => void;
}) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => members.slice(0, 3).map((m) => m.id));
  const [referenceDate, setReferenceDate] = useState(() =>
    nearestAllWorkingDayISO(members.slice(0, 3), todayISO()),
  );
  const [displayTz, setDisplayTz] = useState(browserTimezone());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [manualKind, setManualKind] = useState<MeetingCandidateKind | null>(null);
  const [decidedSlotSignature, setDecidedSlotSignature] = useState<string | null>(null);
  const [copiedKind, setCopiedKind] = useState<MeetingCandidateKind | null>(null);
  const timezones = timezonesInUse(members);

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.includes(m.id)),
    [members, selectedIds],
  );

  const meetingWindow = useMemo(
    () => (selectedMembers.length > 0 ? computeMeetingWindow(selectedMembers, referenceDate) : null),
    [selectedMembers, referenceDate],
  );

  const candidates = useMemo(
    () => (selectedMembers.length > 0 ? findMeetingCandidates(selectedMembers, referenceDate, durationMinutes) : []),
    [selectedMembers, referenceDate, durationMinutes],
  );

  const selectedKind: MeetingCandidateKind =
    (manualKind && candidates.some((c) => c.kind === manualKind) ? manualKind : candidates[0]?.kind) ?? 'optimal';

  const currentCandidate: MeetingCandidate | null =
    candidates.find((c) => c.kind === selectedKind) ?? candidates[0] ?? null;

  const slotSignature = (candidate: MeetingCandidate) => `${candidate.kind}:${candidate.slot.startMs}:${candidate.slot.endMs}`;

  const burdenHistory = useMemo(
    () => computeBurdenHistory(members, recurringMeetings, meetingBurdenLog, referenceDate).filter((h) => h.count > 0),
    [members, recurringMeetings, meetingBurdenLog, referenceDate],
  );
  const maxHistoryCount = Math.max(1, ...burdenHistory.map((h) => h.count));

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const memberName = (id: string) => selectedMembers.find((m) => m.id === id)?.name ?? members.find((m) => m.id === id)?.name ?? id;

  const buildCopyText = (candidate: MeetingCandidate): string => {
    const title = meetingTitle.trim() || t('meetingHeading');
    const lines = [
      `${t('meetingTitle')}: ${title}`,
      `${t('referenceDate')}: ${referenceDate}`,
      `${rangeLabel(candidate.slot, displayTz)} (${displayTz})`,
      '',
      ...selectedMembers.map((m) => {
        const info = candidate.perMember.find((p) => p.memberId === m.id);
        const localRange = `${formatHourLabel(candidate.slot.startMs, m.timezone)}–${formatHourLabel(candidate.slot.endMs, m.timezone)}`;
        return `- ${m.name} (${m.timezone}): ${localRange}${info?.isOutside ? ` ※${t('outsideBadgeShort')}` : ''}`;
      }),
    ];
    return lines.join('\n');
  };

  const handleDecide = (candidate: MeetingCandidate) => {
    const entry: MeetingDecisionLogEntry = {
      id: newId(),
      decidedAt: new Date().toISOString(),
      title: meetingTitle.trim() || t('meetingHeading'),
      slotStartMs: candidate.slot.startMs,
      slotEndMs: candidate.slot.endMs,
      burdenMemberIds: candidate.burdenMemberIds,
    };
    setMeetingBurdenLog((prev) => [entry, ...prev].slice(0, 200));
    setDecidedSlotSignature(slotSignature(candidate));
  };

  const handleCopy = async (candidate: MeetingCandidate) => {
    try {
      await navigator.clipboard.writeText(buildCopyText(candidate));
      setCopiedKind(candidate.kind);
      window.setTimeout(() => setCopiedKind((prev) => (prev === candidate.kind ? null : prev)), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the copy button just won't confirm.
    }
  };

  const hourTicks = meetingWindow
    ? Array.from({ length: 9 }, (_, i) => meetingWindow.windowStart + i * 3 * 60 * 60 * 1000)
    : [];

  return (
    <section>
      <RecurringMeetings meetings={recurringMeetings} setMeetings={setRecurringMeetings} members={members} />

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-900">{t('meetingHeading')}</h2>
        <p className="mt-1 text-xs text-slate-400">{t('meetingIntroText')}</p>
        <p className="mt-1 text-sm text-slate-500">{t('meetingDesc')}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <span className="mb-1 block font-medium">{t('meetingDurationLabel')}</span>
            <select className="input" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}>
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} {t('minutesUnit')}
                </option>
              ))}
            </select>
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

        <label className="mt-3 block text-sm text-slate-600">
          <span className="mb-1 block font-medium">{t('meetingTitleOptional')}</span>
          <input className="input" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
        </label>

        {selectedMembers.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">{t('selectAtLeastOne')}</p>
        ) : (
          meetingWindow && (
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
                      {meetingWindow.perMember[m.id].length === 0 && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-normal text-slate-400">{t('restDay')}</span>
                      )}
                    </p>
                    <Bar
                      windowStart={meetingWindow.windowStart}
                      windowEnd={meetingWindow.windowEnd}
                      intervals={meetingWindow.perMember[m.id]}
                      markerSlot={currentCandidate?.slot ?? null}
                      color="bg-sky-400"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">{t('timelineLegend')}</p>

              <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-900">{t('meetingCandidatesHeading')}</h3>
              {candidates.length === 0 ? (
                <p className="text-sm text-slate-500">{t('noMeetingCandidates')}</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-3">
                  {candidates.map((candidate) => {
                    const isSelected = candidate.kind === selectedKind;
                    const isDecided = decidedSlotSignature === slotSignature(candidate);
                    const isCopied = candidate.kind === copiedKind;
                    return (
                      <div
                        key={candidate.kind}
                        onClick={() => setManualKind(candidate.kind)}
                        className={`cursor-pointer rounded-lg border p-3 text-sm ${
                          isSelected ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-900">{t(CANDIDATE_LABEL_KEY[candidate.kind])}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              candidate.fairnessScore >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : candidate.fairnessScore >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {t('fairnessScoreLabel')} {candidate.fairnessScore}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {referenceDate} {rangeLabel(candidate.slot, displayTz)} ({displayTz})
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {t('dashboardMembersAvailableLabel')}: {candidate.coveredCount} / {candidate.totalMembers}
                        </p>

                        <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
                          {candidate.perMember.map((info) => {
                            const member = selectedMembers.find((m) => m.id === info.memberId);
                            if (!member) return null;
                            return (
                              <li key={info.memberId} className="flex items-center justify-between gap-2">
                                <span className="truncate">{member.name}</span>
                                <span className="flex items-center gap-1 shrink-0">
                                  <span className="tabular-nums text-slate-500">
                                    {formatHourLabel(candidate.slot.startMs, member.timezone)}–{formatHourLabel(candidate.slot.endMs, member.timezone)}
                                  </span>
                                  {info.isOutside && (
                                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                                      {t('outsideBadgeShort')}
                                    </span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        <p className="mt-2 text-xs text-slate-500">
                          {t('burdenThisTimeLabel')}:{' '}
                          {candidate.burdenMemberIds.length > 0
                            ? candidate.burdenMemberIds.map(memberName).join(', ')
                            : t('noBurdenMembers')}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDecide(candidate)}
                            className={`rounded-md px-2 py-1 text-xs font-medium ${
                              isDecided ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'
                            }`}
                          >
                            {isDecided ? t('decidedBadge') : t('decideCandidate')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(candidate)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            {isCopied ? t('copiedConfirm') : t('copyForCalendar')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">{t('burdenHistoryHeading')}</h3>
                <p className="mt-1 text-xs text-slate-500">{t('burdenHistoryDesc')}</p>
                {burdenHistory.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">{t('burdenHistoryEmpty')}</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {burdenHistory.map(({ memberId, count }) => (
                      <li key={memberId} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-32 shrink-0 truncate">{memberName(memberId)}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${(count / maxHistoryCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right text-slate-500">
                          {count}
                          {t('burdenCountUnit')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
