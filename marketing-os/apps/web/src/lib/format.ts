import type { components } from './api/schema';

type Metric = components['schemas']['MetricEnvelope'];

const nf = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('en', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** Formats a metric value by its unit. Returns null when there is no value — callers must show a status instead. */
export function formatMetricValue(m: Pick<Metric, 'value' | 'unit' | 'currency'>): string | null {
  if (m.value === null || m.value === undefined) return null;
  switch (m.unit) {
    case 'count':
      return nf.format(m.value);
    case 'percent':
      return `${new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(m.value * 100)}%`;
    case 'ratio':
      return `${nf2.format(m.value)}×`;
    case 'position':
      return new Intl.NumberFormat('en', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(m.value);
    case 'currency':
      return m.currency
        ? new Intl.NumberFormat('en', { style: 'currency', currency: m.currency, maximumFractionDigits: 0 }).format(m.value)
        : nf.format(m.value);
    default:
      return String(m.value);
  }
}

export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.round((now.getTime() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, 'second'], [3600, 'minute'], [86400, 'hour'], [2592000, 'day'], [31536000, 'month']];
  let divisor = 1;
  for (const [limit, unit] of steps) {
    if (Math.abs(seconds) < limit) return rtf.format(-Math.round(seconds / divisor), unit);
    divisor = limit;
  }
  return rtf.format(-Math.round(seconds / 31536000), 'year');
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
