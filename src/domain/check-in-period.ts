import type { CadenceType, CheckIn, Pod } from './types';

export interface PeriodWindow {
  key: string;
  start: Date;
  end: Date;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

function endOfWeek(d: Date): Date {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  return endOfDay(x);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function getCurrentPeriod(pod: Pod, now: Date = new Date(), anchor?: Date): PeriodWindow {
  const anchorDate = anchor ?? new Date(pod.createdAt);

  switch (pod.cadenceType) {
    case 'daily': {
      const start = startOfDay(now);
      const end = endOfDay(now);
      return { key: formatDayKey(start), start, end };
    }
    case 'weekly': {
      const start = startOfWeek(now);
      const end = endOfWeek(now);
      return { key: `W${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`, start, end };
    }
    case 'monthly': {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return { key: `M${start.getFullYear()}-${start.getMonth()}`, start, end };
    }
    case 'every_x_days': {
      const interval = pod.cadenceInterval ?? 1;
      const elapsed = daysBetween(anchorDate, now);
      const periodIndex = Math.floor(elapsed / interval);
      const start = new Date(anchorDate);
      start.setDate(start.getDate() + periodIndex * interval);
      const end = new Date(start);
      end.setDate(end.getDate() + interval - 1);
      return { key: `XD${periodIndex}`, start: startOfDay(start), end: endOfDay(end) };
    }
    case 'every_x_weeks': {
      const interval = (pod.cadenceInterval ?? 1) * 7;
      const elapsed = daysBetween(anchorDate, now);
      const periodIndex = Math.floor(elapsed / interval);
      const start = new Date(anchorDate);
      start.setDate(start.getDate() + periodIndex * interval);
      const end = new Date(start);
      end.setDate(end.getDate() + interval - 1);
      return { key: `XW${periodIndex}`, start: startOfDay(start), end: endOfDay(end) };
    }
    default:
      return getCurrentPeriod({ ...pod, cadenceType: 'daily' }, now, anchor);
  }
}

function formatDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isWithinPeriod(checkIn: CheckIn, period: PeriodWindow): boolean {
  const t = new Date(checkIn.createdAt).getTime();
  return t >= period.start.getTime() && t <= period.end.getTime();
}

export function getPeriodProgress(period: PeriodWindow, now: Date = new Date()): number {
  const total = period.end.getTime() - period.start.getTime();
  const elapsed = now.getTime() - period.start.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, elapsed / total));
}
