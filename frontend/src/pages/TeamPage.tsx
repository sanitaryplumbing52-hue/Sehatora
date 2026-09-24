import { useQuery } from "@tanstack/react-query";
import { UserSquare2 } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { usersApi } from "@/api/resources";

export function TeamPage() {
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  return (
    <div>
      <PageHeader title="Team" description="Everyone in your organization" />
      <div className="px-4 md:px-6 pb-10">
        <Card>
          {isLoading ? (
            <TableSkeleton />
          ) : !users?.length ? (
            <EmptyState icon={UserSquare2} title="No team members yet" description="Invite teammates from Settings > Users." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted border-b border-border dark:border-border-dark">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Role</th>
                    <th className="px-5 py-3 hidden md:table-cell">Team</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border dark:border-border-dark last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.full_name} src={user.avatar} size={32} />
                          <div>
                            <p className="font-medium text-ink dark:text-slate-100">{user.full_name}</p>
                            <p className="text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted">{user.role_name || "—"}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted">{user.team_name || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={user.is_active ? "success" : "muted"}>{user.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
