import { format } from "date-fns";
import { calendarDate } from "./dates";

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const formatShortDate = (value: string | Date) =>
  format(calendarDate(value), "EEE, MMM d");

export const formatLongDate = (value: string | Date) =>
  format(calendarDate(value), "MMMM d, yyyy");

export const formatISODate = (value: string | Date) =>
  format(calendarDate(value), "yyyy-MM-dd");

export const normalizeText = (value: string) => value.trim().toLowerCase();

export const sortByOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);
