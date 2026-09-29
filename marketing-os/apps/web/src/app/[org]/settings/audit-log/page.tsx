import type { Metadata } from 'next';
import { AuditLogPanel } from './audit-log-panel';

export const metadata: Metadata = { title: 'Audit log' };

export default function AuditLogPage() {
  return <AuditLogPanel />;
}
