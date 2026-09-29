import { redirect } from 'next/navigation';
import { serverApi, unwrapServer } from '@/lib/api/server';

/** Entry point: send the user to their first organization, or to onboarding if they have none. */
export default async function Home() {
  const api = await serverApi();
  const memberships = await unwrapServer(api.GET('/me/organizations'));
  const first = memberships.data[0];
  redirect(first ? `/${first.organization.slug}/dashboard` : '/onboarding/organization');
}
