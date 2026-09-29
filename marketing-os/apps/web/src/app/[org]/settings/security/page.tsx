import type { Metadata } from 'next';
import { ActivityCard } from './activity-card';
import { PasswordCard } from './password-card';
import { SessionsCard } from './sessions-card';
import { TwoFactorCard } from './two-factor-card';

export const metadata: Metadata = { title: 'Security' };

export default function SecurityPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <TwoFactorCard />
      <PasswordCard />
      <SessionsCard />
      <ActivityCard />
    </div>
  );
}
