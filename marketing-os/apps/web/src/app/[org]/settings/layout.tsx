import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/card';
import { SettingsTabs } from './settings-tabs';

export default async function SettingsLayout({ children, params }: { children: ReactNode; params: Promise<{ org: string }> }) {
  const { org } = await params;
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsTabs orgSlug={org} />
      <div className="mt-6">{children}</div>
    </>
  );
}
