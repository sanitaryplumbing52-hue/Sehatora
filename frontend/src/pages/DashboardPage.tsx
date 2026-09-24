import {
  CheckCircle2,
  DollarSign,
  Globe,
  Mail,
  MessageCircle,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  CalendarClock,
  ListTodo,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/PageHeader";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboardSummary } from "@/hooks/useDashboard";

const CHART_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#0891B2", "#64748B"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(
    value || 0
  );
}

export function DashboardPage() {
  const [range, setRange] = useState("last_30_days");
  const { data, isLoading } = useDashboardSummary(range);

  return (
    <div className="pb-10">
      <PageHeader
        title="Dashboard"
        description="Your CRM at a glance"
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      <div className="px-4 md:px-6 space-y-6">
        {isLoading || !data ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="Total Contacts" value={data.stats.total_contacts} icon={Users} />
              <StatCard label="New Leads" value={data.stats.new_leads} icon={Target} />
              <StatCard label="Qualified Leads" value={data.stats.qualified_leads} icon={CheckCircle2} tone="success" />
              <StatCard label="Open Deals" value={data.stats.open_deals} icon={Wallet} />
              <StatCard label="Pipeline Value" value={formatCurrency(data.stats.pipeline_value)} icon={TrendingUp} tone="primary" />
              <StatCard label="Won Deals" value={data.stats.won_deals} icon={Trophy} tone="success" />
              <StatCard label="Lost Deals" value={data.stats.lost_deals} icon={TrendingDown} tone="danger" />
              <StatCard label="Revenue" value={formatCurrency(data.stats.revenue)} icon={DollarSign} tone="success" />
              <StatCard label="Tasks Due Today" value={data.stats.tasks_due_today} icon={ListTodo} tone="warning" />
              <StatCard label="Upcoming Meetings" value={data.stats.upcoming_meetings} icon={CalendarClock} />
              <StatCard label="Email Activity" value={data.stats.email_activity} icon={Mail} />
              <StatCard label="WhatsApp Activity" value={data.stats.whatsapp_activity} icon={MessageCircle} />
              <StatCard label="Website Visitors" value={data.stats.website_visitors} icon={Globe} />
              <StatCard label="Conversion Rate" value={`${data.stats.conversion_rate}%`} icon={Percent} tone="primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leads Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.leads_over_time}>
                      <defs>
                        <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#leadsGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.revenue_over_time}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="value" fill="#16A34A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pipeline by Stage</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.pipeline_stages} layout="vertical" margin={{ left: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {data.charts.lead_sources.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.charts.lead_sources}
                          dataKey="count"
                          nameKey="source"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {data.charts.lead_sources.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="flex h-full items-center justify-center text-sm text-muted">No lead source data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.charts.conversion_funnel.map((stage, i) => {
                    const max = data.charts.conversion_funnel[0]?.count || 1;
                    const pct = Math.round((stage.count / max) * 100);
                    return (
                      <div key={stage.stage}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-ink dark:text-slate-200">{stage.stage}</span>
                          <span className="text-muted">{stage.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="max-h-72 overflow-y-auto space-y-3">
                  {data.charts.activity_timeline.length ? (
                    data.charts.activity_timeline.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <div className="flex-1">
                          <p className="text-ink dark:text-slate-100">{activity.title}</p>
                          <p className="text-xs text-muted">
                            {activity.actor_name || "System"} &middot; {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No activity yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
