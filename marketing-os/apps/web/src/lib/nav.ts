export type NavItem = {
  slug: string;
  label: string;
  /** Phase in which the module ships (from the implementation plan). null = not scheduled yet. */
  phase: number | null;
  /** true once a real screen exists */
  built: boolean;
  description: string;
};

export type NavGroup = { label: string; items: NavItem[] };

const planned = (slug: string, label: string, phase: number | null, description: string): NavItem => ({ slug, label, phase, built: false, description });

/** Sidebar registry: every module in the product spec. Unbuilt modules show an honest "coming" page — never fake data. */
export const NAV: NavGroup[] = [
  { label: 'Overview', items: [{ slug: 'dashboard', label: 'Dashboard', phase: 1, built: true, description: 'Executive overview of connected data.' }] },
  {
    label: 'Workspace',
    items: [
      { slug: 'projects', label: 'Projects', phase: 1, built: true, description: 'Projects group websites, data sources, reports and work.' },
      { slug: 'websites', label: 'Websites', phase: 1, built: true, description: 'Every website across your projects.' },
    ],
  },
  {
    label: 'Search & content',
    items: [
      planned('seo', 'SEO', 2, 'Crawler, technical SEO audit, issue engine and Search Console performance.'),
      planned('keywords', 'Keywords', 2, 'Keyword groups, clusters, intent, mapping and ranking history.'),
      planned('content', 'Content', 6, 'Content calendar, briefs, topic clusters and content audits.'),
    ],
  },
  {
    label: 'Analytics & advertising',
    items: [
      planned('analytics', 'Analytics', 3, 'Google Analytics 4 acquisition, engagement, conversions and revenue.'),
      planned('google-ads', 'Google Ads', 4, 'Campaigns, keywords, search terms and campaign comparison.'),
      planned('meta-ads', 'Meta Ads', 4, 'Campaigns, ad sets and platform-reported vs analytics-attributed conversions.'),
      planned('tracking', 'Tracking', 3, 'Conversion dictionary and cross-platform consistency checks.'),
      planned('gtm', 'GTM', 8, 'Tags, triggers, variables and tracking architecture documentation.'),
      planned('sgtm', 'Server-side GTM', 8, 'Server-side tagging architecture, event flow and endpoint health.'),
      planned('ecommerce', 'E-commerce', 7, 'Orders, revenue, AOV, products and integrations.'),
    ],
  },
  {
    label: 'Intelligence',
    items: [
      planned('competitors', 'Competitors', null, 'Competitor research (not yet scheduled).'),
      planned('strategy', 'Strategy', 6, 'Evidence-based strategy workspace.'),
      planned('recommendations', 'Recommendations', 6, 'Evidence-backed recommendations with data sources and confidence.'),
      planned('experiments', 'Experiments', null, 'Hypotheses, baselines, variants and measured results (not yet scheduled).'),
      planned('reports', 'Reports', 5, 'Report builder with PDF, CSV and shareable exports.'),
    ],
  },
  {
    label: 'System',
    items: [
      { slug: 'integrations', label: 'Integrations', phase: 1, built: true, description: 'Connect data sources and monitor their health.' },
      planned('learning', 'Learning', null, 'Skill tracks, practical tasks and project simulator (not yet scheduled).'),
      { slug: 'settings', label: 'Settings', phase: 1, built: true, description: 'Organization, members, audit log and account.' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);

export function findNavItem(slug: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.slug === slug);
}
