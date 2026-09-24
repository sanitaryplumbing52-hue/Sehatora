import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { ContactFormModal } from "@/components/contacts/ContactFormModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useContacts } from "@/hooks/useContacts";

const STATUS_TONE: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "muted"> = {
  new: "primary",
  open: "default",
  in_progress: "warning",
  connected: "success",
  bad_timing: "muted",
  unqualified: "danger",
};

export function ContactsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useContacts({ page, search: search || undefined, page_size: 20 });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Everyone you're building a relationship with"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Contact
          </Button>
        }
      />

      <div className="px-4 md:px-6 pb-10">
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border dark:border-border-dark">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search contacts..."
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : !data?.results.length ? (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Add your first contact to start building your pipeline."
              action={
                <Button onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> New Contact
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted border-b border-border dark:border-border-dark">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Company</th>
                    <th className="px-5 py-3 hidden md:table-cell">Owner</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Lead Score</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className="border-b border-border dark:border-border-dark last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={contact.full_name} src={contact.avatar} size={32} />
                          <div>
                            <p className="font-medium text-ink dark:text-slate-100">{contact.full_name}</p>
                            <p className="text-xs text-muted">{contact.email || contact.phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted">{contact.company_name || "—"}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted">{contact.owner_name || "Unassigned"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[contact.lead_status] ?? "default"}>{contact.lead_status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-muted">{contact.lead_score}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-muted">
                        {contact.last_activity_at ? new Date(contact.last_activity_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} numPages={data.num_pages} count={data.count} onChange={setPage} />
            </div>
          )}
        </Card>
      </div>

      <ContactFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
