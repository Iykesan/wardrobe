import { format, parseISO, isValid } from "date-fns";

/** A calendar date, not a UTC timestamp. Past dates are allowed for history. */
export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function calendarDate(value: string | Date): Date {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!isValidDateOnly(value)) throw new Error("Choose a valid calendar date.");
    return parseISO(value);
  }
  return new Date(value);
}
