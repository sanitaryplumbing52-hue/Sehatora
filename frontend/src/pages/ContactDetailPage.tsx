import { ArrowLeft, Building2, ListTodo, Mail, MapPin, Phone, Tag as TagIcon, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Timeline } from "@/components/Timeline";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useContact, useContactDeals, useContactTasks, useContactTimeline } from "@/hooks/useContacts";
import type { IconType } from "@/types/icon";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
  { key: "deals", label: "Deals" },
  { key: "tasks", label: "Tasks" },
  { key: "emails", label: "Emails", soon: true },
  { key: "whatsapp", label: "WhatsApp", soon: true },
  { key: "calls", label: "Calls", soon: true },
  { key: "meetings", label: "Meetings", soon: true },
  { key: "tickets", label: "Tickets", soon: true },
  { key: "documents", label: "Documents", soon: true },
];

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data: contact, isLoading } = useContact(id);
  const { data: timeline } = useContactTimeline(id);
  const { data: deals } = useContactDeals(id);
  const { data: tasks } = useContactTasks(id);

  if (isLoading || !contact) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 md:px-6 pt-5 pb-3">
        <button onClick={() => navigate("/contacts")} className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to Contacts
        </button>
        <div className="flex items-start gap-4">
          <Avatar name={contact.full_name} src={contact.avatar} size={56} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-ink dark:text-slate-100">{contact.full_name}</h1>
            <p className="text-sm text-muted">
              {contact.job_title}
              {contact.job_title && contact.company_name && " at "}
              {contact.company_name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="primary">{contact.lifecycle_stage}</Badge>
              <Badge>{contact.lead_status.replace("_", " ")}</Badge>
              {contact.tags.map((t) => (
                <Badge key={t.id} dot={t.color}>
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="px-4 md:px-6 py-6">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <DetailRow icon={Mail} label="Email" value={contact.email} />
                <DetailRow icon={Phone} label="Phone" value={contact.phone} />
                <DetailRow icon={Phone} label="WhatsApp" value={contact.whatsapp} />
                <DetailRow icon={Building2} label="Company" value={contact.company_name} />
                <DetailRow icon={MapPin} label="Location" value={[contact.city, contact.country].filter(Boolean).join(", ")} />
                <DetailRow icon={TagIcon} label="Lead Source" value={contact.lead_source} />
              </CardContent>
              {contact.notes && (
                <CardContent className="border-t border-border dark:border-border-dark pt-4">
                  <p className="text-xs font-medium text-muted mb-1">Notes</p>
                  <p className="text-sm text-ink dark:text-slate-200 whitespace-pre-wrap">{contact.notes}</p>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Created" value={new Date(contact.created_at).toLocaleDateString()} />
                <DetailRow label="Last Activity" value={contact.last_activity_at ? new Date(contact.last_activity_at).toLocaleDateString() : "—"} />
                <DetailRow label="Last Contacted" value={contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString() : "—"} />
                <DetailRow label="Next Follow-up" value={contact.next_follow_up_at ? new Date(contact.next_follow_up_at).toLocaleDateString() : "—"} />
                <DetailRow label="Lead Score" value={String(contact.lead_score)} />
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "timeline" && (
          <Card>
            <CardContent>
              <Timeline activities={timeline} />
            </CardContent>
          </Card>
        )}

        {tab === "deals" && (
          <Card>
            <CardContent>
              {deals?.length ? (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between rounded-lg border border-border dark:border-border-dark p-3">
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-slate-100">{deal.name}</p>
                        <p className="text-xs text-muted">{deal.stage_name}</p>
                      </div>
                      <p className="text-sm font-semibold text-ink dark:text-slate-100">{deal.currency} {deal.amount}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Wallet} title="No deals yet" description="Deals linked to this contact will show up here." />
              )}
            </CardContent>
          </Card>
        )}

        {tab === "tasks" && (
          <Card>
            <CardContent>
              {tasks?.length ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border border-border dark:border-border-dark p-3">
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-slate-100">{task.name}</p>
                        <p className="text-xs text-muted">{task.due_date ? new Date(task.due_date).toLocaleString() : "No due date"}</p>
                      </div>
                      <Badge tone={task.status === "completed" ? "success" : task.is_overdue ? "danger" : "default"}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ListTodo} title="No tasks yet" description="Tasks linked to this contact will show up here." />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon?: IconType; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {Icon && <Icon size={15} className="text-muted shrink-0" />}
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-ink dark:text-slate-200">{value || "—"}</p>
      </div>
    </div>
  );
}
