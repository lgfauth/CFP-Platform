/**
 * Public contract of an event registration, shared by frontend and API.
 * `date` is a calendar day in ISO format (`YYYY-MM-DD`), without time.
 */
export interface EventDTO {
  id: string;
  name: string;
  address: string;
  date: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number, length = 2): string =>
  String(value).padStart(length, '0');

/** Formats the local calendar day of `date` as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

/** True only for a strict `YYYY-MM-DD` string that exists in the calendar. */
export function isValidIsoDate(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const match = ISO_DATE.exec(value);
  if (!match) {
    return false;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const candidate = new Date(year, month - 1, day);
  candidate.setFullYear(year);

  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

/**
 * True when `value` is a valid ISO date strictly after the local calendar
 * day of `now` (today and past days are rejected).
 */
export function isFutureIsoDate(value: string, now: Date = new Date()): boolean {
  return isValidIsoDate(value) && value > toIsoDate(now);
}

/** The first selectable event date: the local day after `now`. */
export function minFutureIsoDate(now: Date = new Date()): string {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return toIsoDate(tomorrow);
}
