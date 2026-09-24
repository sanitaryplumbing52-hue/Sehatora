import {
  CalendarCheck,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  PlusCircle,
  RefreshCw,
  StickyNote,
  TrendingUp,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import type { Activity } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  created: PlusCircle,
  updated: RefreshCw,
  note: StickyNote,
  email_sent: Mail,
  email_received: Mail,
  email_opened: Mail,
  link_clicked: Mail,
  whatsapp_message: MessageCircle,
  call: Phone,
  meeting: CalendarCheck,
  task: FileText,
  deal_stage_change: TrendingUp,
  status_change: TrendingUp,
  website_visit: TrendingUp,
  form_submission: FileText,
  file_uploaded: Upload,
};

export function Timeline({ activities }: { activities?: Activity[] }) {
  if (!activities?.length) {
    return <EmptyState icon={StickyNote} title="No activity yet" description="Actions on this record will show up here." />;
  }

  return (
    <div className="space-y-5">
      {activities.map((activity) => {
        const Icon = ICONS[activity.activity_type] ?? StickyNote;
        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary dark:bg-primary/20">
              <Icon size={15} />
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm text-ink dark:text-slate-100">{activity.title}</p>
              {activity.description && <p className="mt-0.5 text-sm text-muted">{activity.description}</p>}
              <p className="mt-1 text-xs text-muted">
                {activity.actor_name || "System"} &middot; {new Date(activity.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
