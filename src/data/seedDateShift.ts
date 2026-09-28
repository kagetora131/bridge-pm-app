import { addDaysISO, todayISO, utcMidnight, DAY_MS } from '../lib/timezone';

/**
 * このダミーデータの日付は元々「2026-09-12に見た状態」として書かれた(seed.tsの
 * コメント参照: どのタスクが期限切れか・ブロック中かは、この日を基準にした物語)。
 * 日付を絶対値のまま置いておくと、ビューアが2026-09-12から離れるほどタスクが
 * 期限切れだらけに見えたり(過去)、逆に何もかも未来の予定に見えたり(将来)して、
 * デモとして破綻する。
 *
 * そこで「元の日付から見て基準日(2026-09-12)の何日前/後だったか」という相対値を
 * 保ったまま、実際に表示する日付は毎回「今日を新しい基準日とみなして」計算し直す。
 * これにより、いつ開いても「1件だけ期限切れ、数件が進行中、来週締切が1件」という
 * 同じ物語がそのまま今日基準で再現され、月をまたぐたびに手直しする必要がなくなる。
 */
const AUTHORED_BASELINE_ISO = '2026-09-12';

function daysBetweenISO(fromISO: string, toISO: string): number {
  return Math.round((utcMidnight(toISO) - utcMidnight(fromISO)) / DAY_MS);
}

/** 執筆時点の基準日から見た日付(YYYY-MM-DD)を、今日を基準にした日付へ移し替える。 */
export function shiftDate(originalISO: string, todayOverride?: string): string {
  const today = todayOverride ?? todayISO();
  const offsetDays = daysBetweenISO(AUTHORED_BASELINE_ISO, originalISO);
  return addDaysISO(today, offsetDays);
}

/** createdAt等、日時(ISO 8601、末尾Z)の日付部分だけを移し替え、時刻はそのまま保つ。 */
export function shiftDateTime(originalISODateTime: string, todayOverride?: string): string {
  const [datePart, timePart] = originalISODateTime.split('T');
  return `${shiftDate(datePart, todayOverride)}T${timePart}`;
}
