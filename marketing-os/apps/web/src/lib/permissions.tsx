'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { components } from '@/lib/api/schema';

type Membership = components['schemas']['Membership'];
type User = components['schemas']['User'];

type Session = { user: User; membership: Membership; memberships: Membership[] };
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ value, children }: { value: Session; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be used inside <SessionProvider>');
  return s;
}

/** UI affordance only — the API enforces every permission independently. */
export function useCan() {
  const { membership } = useSession();
  return (permission: string) => membership.permissions.includes(permission);
}
