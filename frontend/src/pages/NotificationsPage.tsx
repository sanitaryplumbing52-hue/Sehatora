import { Bell } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay on top of leads, deals, tasks and assignments"
        actions={
          <Button variant="outline" onClick={() => markAllRead.mutate()}>
            Mark all as read
          </Button>
        }
      />
      <div className="px-4 md:px-6 pb-10">
        <Card>
          {isLoading ? (
            <TableSkeleton cols={3} />
          ) : !data?.results.length ? (
            <EmptyState icon={Bell} title="You're all caught up" description="New leads, deal wins and task reminders will show up here." />
          ) : (
            data.results.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead.mutate(n.id)}
                className={`flex w-full items-start gap-3 px-5 py-4 text-left border-b border-border dark:border-border-dark last:border-0 ${
                  !n.is_read ? "bg-primary-light/30 dark:bg-primary/10" : ""
                }`}
              >
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                <div>
                  <p className="text-sm font-medium text-ink dark:text-slate-100">{n.title}</p>
                  {n.body && <p className="text-sm text-muted mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </button>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
