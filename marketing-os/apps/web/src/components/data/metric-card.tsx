import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { components } from '@/lib/api/schema';
import { formatMetricValue, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export type Metric = components['schemas']['MetricEnvelope'];

const STATUS_TEXT: Record<Metric['status'], string> = {
  ok: '',
  not_connected: 'Not connected',
  unavailable: 'Data unavailable',
  insufficient_data: 'Insufficient data',
  stale: 'Stale',
  error: 'Sync failed',
  no_data: 'No data',
};

const SOURCE_NAMES: Record<string, string> = {
  google_search_console: 'Google Search Console',
  google_analytics_4: 'Google Analytics 4',
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
};
const sourceName = (k: string) => SOURCE_NAMES[k] ?? k;

/**
 * The single place a metric is rendered. It has no code path that shows a number
 * without a value from the API: anything else renders the status in words.
 */
export function MetricCard({ metric, className }: { metric: Metric; className?: string }) {
  const value = formatMetricValue(metric);
  const showValue = (metric.status === 'ok' || metric.status === 'stale') && value !== null;
  const updated = formatRelativeTime(metric.last_synced_at);
  const delta = typeof metric.comparison?.delta_pct === 'number' ? metric.comparison.delta_pct : null;

  return (
    <div data-testid={`metric-${metric.key}`} data-status={metric.status} className={cn('flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ink-2">{metric.label}</h3>
        {metric.status === 'stale' && <Badge tone="warn">Stale</Badge>}
        {metric.status === 'error' && <Badge tone="danger">Sync failed</Badge>}
      </div>

      {showValue ? (
        <div className="mt-2">
          <p className="text-2xl font-semibold text-ink">{value}</p>
          {delta !== null && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-2">
              {delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : delta < 0 ? <ArrowDownRight className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
              <span>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}% vs previous period
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-base font-medium text-ink-3">{STATUS_TEXT[metric.status]}</p>
          {metric.reason && <p className="mt-0.5 text-xs text-ink-3">{metric.reason}</p>}
          {metric.action && (
            <Link href={metric.action.href} className="mt-2 inline-block text-xs font-medium text-accent underline underline-offset-2">
              {metric.action.label}
            </Link>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-ink-3">
        {metric.source ? (
          <>
            Source: {sourceName(metric.source.provider)}
            {updated && <> · Updated {updated}</>}
          </>
        ) : (
          <>Needs: {metric.expected_sources.map(sourceName).join(' or ') || '—'}</>
        )}
      </p>

      <details className="mt-2 text-xs text-ink-3">
        <summary className="cursor-pointer select-none text-ink-2 hover:text-ink">Source &amp; calculation</summary>
        <dl className="mt-1.5 space-y-1">
          <div>
            <dt className="inline font-medium text-ink-2">Calculation: </dt>
            <dd className="inline">{metric.calculation}</dd>
          </div>
          {metric.period && (
            <div>
              <dt className="inline font-medium text-ink-2">Period: </dt>
              <dd className="inline">{metric.period.start} – {metric.period.end}</dd>
            </div>
          )}
          {metric.attribution_note && (
            <div>
              <dt className="inline font-medium text-ink-2">Attribution: </dt>
              <dd className="inline">{metric.attribution_note}</dd>
            </div>
          )}
          {metric.lineage_id && (
            <div>
              <dt className="inline font-medium text-ink-2">Lineage: </dt>
              <dd className="inline font-mono">{metric.lineage_id}</dd>
            </div>
          )}
        </dl>
      </details>
    </div>
  );
}
