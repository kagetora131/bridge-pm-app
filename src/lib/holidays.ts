/**
 * Public holidays for the countries this demo's sample team is based in —
 * keyed by IANA timezone, since that's what a Member already carries (no
 * separate "country" field needed). Covers 2026–2028 (the range the
 * calendar's month-jump can reach). Fixed-date and rule-based holidays
 * (Nth-weekday-of-month, Easter-relative) are computed precisely; Japan's
 * equinox-based holidays and the UAE's Islamic-calendar holidays are
 * estimates — see the `estimated` flag and README "制約事項" for details.
 *
 * This is reference data for a demo, not a maintained authoritative feed:
 * holidays a government confirms only shortly before the date (notably UAE
 * Islamic-calendar holidays) can shift by a day or two from these estimates.
 */

export interface HolidayEntry {
  date: string; // "yyyy-MM-dd"
  name: string;
  estimated?: boolean;
}

const JP_HOLIDAYS: HolidayEntry[] = [
  { date: '2026-01-01', name: '元日' },
  { date: '2026-01-12', name: '成人の日' },
  { date: '2026-02-11', name: '建国記念の日' },
  { date: '2026-02-23', name: '天皇誕生日' },
  { date: '2026-03-20', name: '春分の日', estimated: true },
  { date: '2026-04-29', name: '昭和の日' },
  { date: '2026-05-03', name: '憲法記念日' },
  { date: '2026-05-04', name: 'みどりの日' },
  { date: '2026-05-05', name: 'こどもの日' },
  { date: '2026-05-06', name: '振替休日' },
  { date: '2026-07-20', name: '海の日' },
  { date: '2026-08-11', name: '山の日' },
  { date: '2026-09-21', name: '敬老の日' },
  { date: '2026-09-22', name: '国民の休日', estimated: true },
  { date: '2026-09-23', name: '秋分の日', estimated: true },
  { date: '2026-10-12', name: 'スポーツの日' },
  { date: '2026-11-03', name: '文化の日' },
  { date: '2026-11-23', name: '勤労感謝の日' },
  { date: '2027-01-01', name: '元日' },
  { date: '2027-01-11', name: '成人の日' },
  { date: '2027-02-11', name: '建国記念の日' },
  { date: '2027-02-23', name: '天皇誕生日' },
  { date: '2027-03-21', name: '春分の日', estimated: true },
  { date: '2027-04-29', name: '昭和の日' },
  { date: '2027-05-03', name: '憲法記念日' },
  { date: '2027-05-04', name: 'みどりの日' },
  { date: '2027-05-05', name: 'こどもの日' },
  { date: '2027-07-19', name: '海の日' },
  { date: '2027-08-11', name: '山の日' },
  { date: '2027-09-20', name: '敬老の日' },
  { date: '2027-09-23', name: '秋分の日', estimated: true },
  { date: '2027-10-11', name: 'スポーツの日' },
  { date: '2027-11-03', name: '文化の日' },
  { date: '2027-11-23', name: '勤労感謝の日' },
  { date: '2028-01-01', name: '元日' },
];

const FR_HOLIDAYS: HolidayEntry[] = [
  { date: '2026-01-01', name: "Jour de l'an" },
  { date: '2026-04-06', name: 'Lundi de Pâques' },
  { date: '2026-05-01', name: 'Fête du Travail' },
  { date: '2026-05-08', name: 'Victoire 1945' },
  { date: '2026-05-14', name: 'Ascension' },
  { date: '2026-05-25', name: 'Lundi de Pentecôte' },
  { date: '2026-07-14', name: 'Fête nationale' },
  { date: '2026-08-15', name: 'Assomption' },
  { date: '2026-11-01', name: 'Toussaint' },
  { date: '2026-11-11', name: 'Armistice 1918' },
  { date: '2026-12-25', name: 'Noël' },
  { date: '2027-01-01', name: "Jour de l'an" },
  { date: '2027-03-29', name: 'Lundi de Pâques' },
  { date: '2027-05-01', name: 'Fête du Travail' },
  { date: '2027-05-06', name: 'Ascension' },
  { date: '2027-05-08', name: 'Victoire 1945' },
  { date: '2027-05-17', name: 'Lundi de Pentecôte' },
  { date: '2027-07-14', name: 'Fête nationale' },
  { date: '2027-08-15', name: 'Assomption' },
  { date: '2027-11-01', name: 'Toussaint' },
  { date: '2027-11-11', name: 'Armistice 1918' },
  { date: '2027-12-25', name: 'Noël' },
  { date: '2028-01-01', name: "Jour de l'an" },
];

const MX_HOLIDAYS: HolidayEntry[] = [
  { date: '2026-01-01', name: 'Año Nuevo' },
  { date: '2026-02-02', name: 'Día de la Constitución' },
  { date: '2026-03-16', name: 'Natalicio de Benito Juárez' },
  { date: '2026-05-01', name: 'Día del Trabajo' },
  { date: '2026-09-16', name: 'Día de la Independencia' },
  { date: '2026-11-16', name: 'Día de la Revolución' },
  { date: '2026-12-25', name: 'Navidad' },
  { date: '2027-01-01', name: 'Año Nuevo' },
  { date: '2027-02-01', name: 'Día de la Constitución' },
  { date: '2027-03-15', name: 'Natalicio de Benito Juárez' },
  { date: '2027-05-01', name: 'Día del Trabajo' },
  { date: '2027-09-16', name: 'Día de la Independencia' },
  { date: '2027-11-15', name: 'Día de la Revolución' },
  { date: '2027-12-25', name: 'Navidad' },
  { date: '2028-01-01', name: 'Año Nuevo' },
];

// Applies to both America/Los_Angeles and America/New_York (US federal holidays).
const US_HOLIDAYS: HolidayEntry[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
  { date: '2026-02-16', name: "Presidents' Day" },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth' },
  { date: '2026-07-04', name: 'Independence Day' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-10-12', name: 'Columbus Day' },
  { date: '2026-11-11', name: 'Veterans Day' },
  { date: '2026-11-26', name: 'Thanksgiving Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-01-18', name: 'Martin Luther King Jr. Day' },
  { date: '2027-02-15', name: "Presidents' Day" },
  { date: '2027-05-31', name: 'Memorial Day' },
  { date: '2027-06-19', name: 'Juneteenth' },
  { date: '2027-07-04', name: 'Independence Day' },
  { date: '2027-09-06', name: 'Labor Day' },
  { date: '2027-10-11', name: 'Columbus Day' },
  { date: '2027-11-11', name: 'Veterans Day' },
  { date: '2027-11-25', name: 'Thanksgiving Day' },
  { date: '2027-12-25', name: 'Christmas Day' },
  { date: '2028-01-01', name: "New Year's Day" },
];

// UAE: fixed Gregorian-date holidays are exact; Islamic (Hijri) calendar
// holidays are estimated (moon-sighting-dependent, officially confirmed by
// the UAE government only weeks ahead) and flagged accordingly.
const AE_HOLIDAYS: HolidayEntry[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-03-19', name: 'Eid al-Fitr (推定/estimated)', estimated: true },
  { date: '2026-03-20', name: 'Eid al-Fitr (推定/estimated)', estimated: true },
  { date: '2026-03-21', name: 'Eid al-Fitr (推定/estimated)', estimated: true },
  { date: '2026-05-26', name: 'Arafat Day (推定/estimated)', estimated: true },
  { date: '2026-05-27', name: 'Eid al-Adha (推定/estimated)', estimated: true },
  { date: '2026-05-28', name: 'Eid al-Adha (推定/estimated)', estimated: true },
  { date: '2026-05-29', name: 'Eid al-Adha (推定/estimated)', estimated: true },
  { date: '2026-06-16', name: 'Islamic New Year (推定/estimated)', estimated: true },
  { date: '2026-08-25', name: "Prophet's Birthday (推定/estimated)", estimated: true },
  { date: '2026-12-01', name: 'Commemoration Day' },
  { date: '2026-12-02', name: 'National Day' },
  { date: '2026-12-03', name: 'National Day' },
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-03-09', name: 'Eid al-Fitr (推定/estimated)', estimated: true },
  { date: '2027-03-10', name: 'Eid al-Fitr (推定/estimated)', estimated: true },
  { date: '2027-03-11', name: 'Eid al-Fitr (推定/estimated)', estimated: true },
  { date: '2027-05-15', name: 'Arafat Day (推定/estimated)', estimated: true },
  { date: '2027-05-16', name: 'Eid al-Adha (推定/estimated)', estimated: true },
  { date: '2027-05-17', name: 'Eid al-Adha (推定/estimated)', estimated: true },
  { date: '2027-05-18', name: 'Eid al-Adha (推定/estimated)', estimated: true },
  { date: '2027-06-05', name: 'Islamic New Year (推定/estimated)', estimated: true },
  { date: '2027-08-14', name: "Prophet's Birthday (推定/estimated)", estimated: true },
  { date: '2027-12-01', name: 'Commemoration Day' },
  { date: '2027-12-02', name: 'National Day' },
  { date: '2027-12-03', name: 'National Day' },
  { date: '2028-01-01', name: "New Year's Day" },
];

const HOLIDAYS_BY_TIMEZONE: Record<string, HolidayEntry[]> = {
  'Asia/Tokyo': JP_HOLIDAYS,
  'Europe/Paris': FR_HOLIDAYS,
  'America/Mexico_City': MX_HOLIDAYS,
  'America/Los_Angeles': US_HOLIDAYS,
  'America/New_York': US_HOLIDAYS,
  'Asia/Dubai': AE_HOLIDAYS,
};

const holidayMapCache = new Map<string, Map<string, HolidayEntry>>();

function mapFor(timeZone: string): Map<string, HolidayEntry> {
  let map = holidayMapCache.get(timeZone);
  if (!map) {
    const list = HOLIDAYS_BY_TIMEZONE[timeZone] ?? [];
    map = new Map(list.map((h) => [h.date, h]));
    holidayMapCache.set(timeZone, map);
  }
  return map;
}

/** The holiday on `dateISO` for a given timezone, or null if it's not a holiday there. */
export function holidayOn(timeZone: string, dateISO: string): HolidayEntry | null {
  return mapFor(timeZone).get(dateISO) ?? null;
}

export function isHoliday(timeZone: string, dateISO: string): boolean {
  return holidayOn(timeZone, dateISO) !== null;
}
