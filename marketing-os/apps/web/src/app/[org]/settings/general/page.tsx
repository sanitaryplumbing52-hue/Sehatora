import type { Metadata } from 'next';
import { OrgSettings } from './org-settings';

export const metadata: Metadata = { title: 'Organization settings' };

export default function GeneralSettingsPage() {
  return <OrgSettings />;
}
