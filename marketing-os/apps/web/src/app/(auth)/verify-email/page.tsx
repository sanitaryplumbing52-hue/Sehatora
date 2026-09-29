import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/api/server';
import { VerifyPanel } from './verify-panel';

export const metadata: Metadata = { title: 'Verify your email' };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const api = await serverApi();
  const { data, response } = await api.GET('/me');
  if (response.status === 401) redirect('/login');
  if (data?.data.email_verified) redirect('/');
  return <VerifyPanel email={data?.data.email ?? ''} invalidLink={status === 'invalid'} />;
}
