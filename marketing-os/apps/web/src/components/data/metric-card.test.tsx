import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { components } from '@/lib/api/schema';
import { MetricCard } from './metric-card';

type Metric = components['schemas']['MetricEnvelope'];

const base: Metric = {
  key: 'organic_clicks',
  label: 'Organic clicks',
  status: 'not_connected',
  value: null,
  unit: 'count',
  currency: null,
  period: null,
  comparison: null,
  source: null,
  expected_sources: ['google_search_console'],
  last_synced_at: null,
  calculation: 'SUM(clicks)',
  attribution_note: null,
  lineage_id: null,
  reason: 'No data source is connected for this metric.',
  action: { label: 'Connect account', href: '/acme/integrations' },
};

describe('MetricCard', () => {
  it('renders "Not connected" with a connect link and no number', () => {
    render(<MetricCard metric={base} />);
    const card = screen.getByTestId('metric-organic_clicks');
    expect(card).toHaveAttribute('data-status', 'not_connected');
    expect(within(card).getByText('Not connected')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Connect account' })).toHaveAttribute('href', '/acme/integrations');
    expect(within(card).getByText(/Needs: Google Search Console/)).toBeInTheDocument();
    expect(card.textContent).not.toMatch(/\d{2,}/); // no digits presented as data
  });

  it.each([
    ['unavailable', 'Data unavailable'],
    ['insufficient_data', 'Insufficient data'],
    ['no_data', 'No data'],
    ['error', 'Sync failed'],
  ] as const)('renders the %s status in words, never a value', (status, text) => {
    render(<MetricCard metric={{ ...base, status, action: null }} />);
    expect(within(screen.getByTestId('metric-organic_clicks')).getAllByText(text).length).toBeGreaterThan(0);
    expect(screen.getByTestId('metric-organic_clicks').textContent).not.toMatch(/\d/);
  });

  it('never renders a value when status is not ok/stale, even if one were supplied', () => {
    render(<MetricCard metric={{ ...base, status: 'unavailable', value: 48293 }} />);
    expect(screen.queryByText('48,293')).not.toBeInTheDocument();
  });

  it('renders value, comparison, source and freshness when ok', () => {
    render(
      <MetricCard
        metric={{
          ...base,
          status: 'ok',
          value: 48293,
          reason: null,
          action: null,
          comparison: { delta_pct: 18.4, basis: 'previous_period' },
          source: { provider: 'google_search_console', account: 'sc-domain:example.com' },
          last_synced_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
          period: { start: '2026-09-01', end: '2026-09-28' },
        }}
      />,
    );
    const card = screen.getByTestId('metric-organic_clicks');
    expect(within(card).getByText('48,293')).toBeInTheDocument();
    expect(within(card).getByText(/\+18\.4% vs previous period/)).toBeInTheDocument();
    expect(within(card).getByText(/Source: Google Search Console/)).toBeInTheDocument();
    expect(within(card).getByText(/Updated 2 hours ago/)).toBeInTheDocument();
    expect(within(card).getByText('SUM(clicks)')).toBeInTheDocument();
  });

  it('flags stale values', () => {
    render(<MetricCard metric={{ ...base, status: 'stale', value: 10, action: null, source: { provider: 'google_ads', account: null } }} />);
    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('formats percent, ratio, currency and position units', () => {
    const ok = { ...base, status: 'ok' as const, action: null, reason: null };
    const { rerender } = render(<MetricCard metric={{ ...ok, unit: 'percent', value: 0.034 }} />);
    expect(screen.getByText('3.4%')).toBeInTheDocument();
    rerender(<MetricCard metric={{ ...ok, unit: 'ratio', value: 5.4213 }} />);
    expect(screen.getByText('5.42×')).toBeInTheDocument();
    rerender(<MetricCard metric={{ ...ok, unit: 'currency', currency: 'AED', value: 12500 }} />);
    expect(screen.getByText(/AED/)).toBeInTheDocument();
    rerender(<MetricCard metric={{ ...ok, unit: 'position', value: 7.26 }} />);
    expect(screen.getByText('7.3')).toBeInTheDocument();
  });
});
