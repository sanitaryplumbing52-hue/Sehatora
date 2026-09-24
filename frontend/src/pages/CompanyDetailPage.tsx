import { ArrowLeft, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Timeline } from "@/components/Timeline";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useCompany, useCompanyTimeline } from "@/hooks/useCompanies";
import type { IconType } from "@/types/icon";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "timeline", label: "Timeline" },
];

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data: company, isLoading } = useCompany(id);
  const { data: timeline } = useCompanyTimeline(id);

  if (isLoading || !company) {
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
        <button onClick={() => navigate("/companies")} className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to Companies
        </button>
        <h1 className="text-xl font-semibold text-ink dark:text-slate-100">{company.name}</h1>
        <p className="text-sm text-muted">{company.industry}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {company.tags.map((t) => (
            <Badge key={t.id} dot={t.color}>
              {t.name}
            </Badge>
          ))}
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
                <Row icon={Globe} label="Website" value={company.website} />
                <Row icon={Mail} label="Email" value={company.email} />
                <Row icon={Phone} label="Phone" value={company.phone} />
                <Row icon={MapPin} label="Location" value={[company.city, company.country].filter(Boolean).join(", ")} />
              </CardContent>
              {company.notes && (
                <CardContent className="border-t border-border dark:border-border-dark pt-4">
                  <p className="text-xs font-medium text-muted mb-1">Notes</p>
                  <p className="text-sm text-ink dark:text-slate-200 whitespace-pre-wrap">{company.notes}</p>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Contacts" value={String(company.contact_count ?? 0)} />
                <Row label="Deals" value={String(company.deal_count ?? 0)} />
                <Row label="Open pipeline value" value={String(company.open_deal_value ?? 0)} />
                <Row label="Employees" value={company.employees} />
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
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon?: IconType; label: string; value?: string }) {
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
