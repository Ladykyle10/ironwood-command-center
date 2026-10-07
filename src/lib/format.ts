import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isYesterday, parseISO, startOfDay } from "date-fns";

export const fmtDate = (iso?: string, pattern = "MMM d") => (iso ? format(parseISO(iso), pattern) : "—");
export const fmtDateLong = (iso?: string) => (iso ? format(parseISO(iso), "MMMM d, yyyy") : "—");
export const fmtDateTime = (iso?: string) => (iso ? format(parseISO(iso), "MMM d, h:mm a") : "—");

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return differenceInCalendarDays(parseISO(iso), startOfDay(new Date()));
}

/** "Due in 5 days" / "Due today" / "3 days overdue" */
export function dueLabel(iso?: string): { text: string; tone: "overdue" | "soon" | "normal" | "none" } {
  const d = daysUntil(iso);
  if (d === null) return { text: "No due date", tone: "none" };
  if (d < 0) return { text: `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`, tone: "overdue" };
  if (d === 0) return { text: "Due today", tone: "soon" };
  if (d === 1) return { text: "Due tomorrow", tone: "soon" };
  if (d <= 7) return { text: `Due in ${d} days`, tone: "soon" };
  return { text: `Due ${fmtDate(iso, "MMM d")}`, tone: "normal" };
}

export function relativeDay(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d");
}

export function timeAgo(iso: string): string {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const titleCase = (s: string) =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const plural = (n: number, word: string, pluralWord?: string) =>
  `${n} ${n === 1 ? word : pluralWord ?? word + "s"}`;
