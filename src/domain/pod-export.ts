import { statusLabel } from '@/src/domain/member-status';
import type { Pod, PodMemberView } from '@/src/domain/types';

function formatCheckInDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function escapeTsvCell(value: string): string {
  if (/[\t\n\r"]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function periodValue(member: PodMemberView, pod: Pod): string {
  const checkIn = member.periodCheckIn;
  if (!checkIn) return '';
  if (pod.goalType === 'completion') return 'Done';
  return `${checkIn.value}${pod.unit ? ` ${pod.unit}` : ''}`;
}

export function formatPodExportTsv(pod: Pod, roster: PodMemberView[]): string {
  const header = ['name', 'status', 'streak', 'last_check_in', 'this_period'].map(escapeTsvCell).join('\t');
  const rows = roster.map((m) =>
    [
      m.profile.name,
      statusLabel(m.status),
      String(m.currentStreak),
      formatCheckInDate(m.lastCheckIn?.createdAt),
      periodValue(m, pod),
    ]
      .map(escapeTsvCell)
      .join('\t')
  );
  return [header, ...rows].join('\n');
}

/** Plain text that pastes cleanly into Apple Notes. */
export function formatPodExportNotes(pod: Pod, roster: PodMemberView[]): string {
  const exported = new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const goalLine = `${pod.goalName} · ${pod.targetValue}${pod.unit ? ` ${pod.unit}` : ''} · ${pod.cadenceType}`;

  const lines = [
    `Peas in a Pod — ${pod.name}`,
    goalLine,
    `Exported ${exported}`,
    '',
    ...roster.map((m) => {
      const last = formatCheckInDate(m.lastCheckIn?.createdAt) || '—';
      const period = periodValue(m, pod) || '—';
      return `${m.profile.name}\t${statusLabel(m.status)}\tStreak ${m.currentStreak}\tLast ${last}\tPeriod ${period}`;
    }),
  ];

  return lines.join('\n');
}

export function podExportFilename(pod: Pod): string {
  const slug = pod.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `${slug || 'pod'}-${date}.tsv`;
}
