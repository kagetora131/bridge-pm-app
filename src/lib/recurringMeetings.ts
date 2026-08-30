import type { RecurringMeeting } from '../types';
import { weekdayOfISO } from './calendar';

/** Whether a recurring meeting has an occurrence on the given calendar date. */
export function occursOn(meeting: RecurringMeeting, dateISO: string): boolean {
  if (weekdayOfISO(dateISO) !== meeting.weekday) return false;
  if (meeting.startDate && dateISO < meeting.startDate) return false;
  if (meeting.endDate && dateISO > meeting.endDate) return false;
  return true;
}
