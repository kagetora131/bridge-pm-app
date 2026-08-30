import { browserTimezone } from './timezone';

// A curated shortlist of major-city timezones covering common offshore-dev
// hubs, rather than the full ~400-zone IANA list — picking a member's own
// timezone doesn't need to mean scrolling past every Pacific atoll.
const CURATED = [
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Taipei',
  'Asia/Manila',
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Kuala_Lumpur',
  'Asia/Singapore',
  'Asia/Dhaka',
  'Asia/Kolkata',
  'Asia/Karachi',
  'Asia/Dubai',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Africa/Johannesburg',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

/** Business-relevant timezone list for a member's own "where are they based" field. */
export function availableTimezones(): string[] {
  return CURATED;
}

/**
 * Timezones actually in use by the current team, for "view schedules as"
 * selectors (meeting finder, week calendar, recurring-meeting reference tz) —
 * a Paris-based member should mean the dropdown offers Paris, not all ~400
 * IANA zones. Always includes the viewer's own browser timezone too, so the
 * selector never defaults to an option that isn't actually in the list.
 */
export function timezonesInUse(members: { timezone: string }[]): string[] {
  const set = new Set(members.map((m) => m.timezone));
  set.add(browserTimezone());
  return Array.from(set).sort();
}
