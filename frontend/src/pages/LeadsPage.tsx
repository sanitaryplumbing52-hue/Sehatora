import { Plus, Target } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useConvertLeadToDeal, useLeads } from "@/hooks/useLeads";

const STATUS_TONE: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "muted"> = {
  new: "primary",
  contacted: "default",
  qualified: "warning",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
  nurturing: "muted",
};

const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost", "nurturing"];

export function LeadsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useLeads({ page, status: status || undefined, page_size: 20 });
  const convertToDeal = useConvertLeadToDeal();

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Prospects moving through your qualification process"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Lead
          </Button>
        }
      />

      <div className="px-4 md:px-6 pb-10">
        <Card>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border dark:border-border-dark">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-48"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : !data?.results.length ? (
            <EmptyState icon={Target} title="No leads yet" description="Leads convert from contacts as they show buying intent." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted border-b border-border dark:border-border-dark">
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Source</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden md:table-cell">Score</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Owner</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((lead) => (
                    <tr key={lead.id} className="border-b border-border dark:border-border-dark last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={lead.contact_detail?.full_name ?? "?"} size={30} />
                          <div>
                            <p className="font-medium text-ink dark:text-slate-100">{lead.contact_detail?.full_name}</p>
                            <p className="text-xs text-muted">{lead.company_name || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted capitalize">{lead.source}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[lead.status] ?? "default"}>{lead.status}</Badge>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted">{lead.score}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-muted">{lead.owner_name || "Unassigned"}</td>
                      <td className="px-5 py-3 text-right">
                        {!["won", "lost"].includes(lead.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={convertToDeal.isPending}
                            onClick={() =>
                              convertToDeal.mutate(
                                { id: lead.id },
                                { onError: () => toast.error("Could not convert lead — check pipelines exist") }
                              )
                            }
                          >
                            Convert to Deal
                          </Button>
                        )}
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

      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
