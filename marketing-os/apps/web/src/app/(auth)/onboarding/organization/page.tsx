import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { serverApi, unwrapServer } from '@/lib/api/server';
import { CreateOrgForm } from './create-org-form';

export const metadata: Metadata = { title: 'Create organization' };

export default async function OnboardingOrganizationPage() {
  const api = await serverApi();
  await unwrapServer(api.GET('/me/organizations'), { nextPath: '/onboarding/organization' }); // 401/unverified handling
  const me = await unwrapServer(api.GET('/me'));
  if (!me.data.email_verified) redirect('/verify-email');
  return <CreateOrgForm />;
}
