"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  subscription: { plan: string; status: string } | null;
}

export function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => setUsers(json.users ?? []));
  }, []);

  async function toggleRole(user: AdminUser) {
    const role = user.role === "ADMIN" ? "USER" : "ADMIN";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role }),
    });
    if (res.ok) {
      setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast({ title: `${user.email} is now ${role}` });
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Plan</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3">{u.name}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">
                <Badge variant={u.role === "ADMIN" ? "accent" : "outline"}>{u.role}</Badge>
              </td>
              <td className="p-3">{u.subscription?.plan ?? "FREE"}</td>
              <td className="p-3 text-right">
                <Button size="sm" variant="outline" onClick={() => toggleRole(u)}>
                  Make {u.role === "ADMIN" ? "User" : "Admin"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
