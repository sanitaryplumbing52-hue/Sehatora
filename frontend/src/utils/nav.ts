import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  FileSignature,
  FileText,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  MessagesSquare,
  Package,
  Phone,
  PieChart,
  Settings,
  Sparkles,
  Target,
  TicketCheck,
  Users,
  UserSquare2,
  Workflow,
  Zap,
} from "lucide-react";
import type { IconType } from "@/types/icon";

export interface NavItem {
  label: string;
  path: string;
  icon: IconType;
  status: "live" | "soon";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, status: "live" },
  { label: "Contacts", path: "/contacts", icon: Users, status: "live" },
  { label: "Companies", path: "/companies", icon: Building2, status: "live" },
  { label: "Leads", path: "/leads", icon: Target, status: "live" },
  { label: "Deals", path: "/deals", icon: LayoutGrid, status: "live" },
  { label: "Pipelines", path: "/pipelines", icon: Workflow, status: "live" },
  { label: "Tasks", path: "/tasks", icon: FileText, status: "live" },
  { label: "Activities", path: "/activities", icon: Zap, status: "live" },
  { label: "Emails", path: "/emails", icon: Mail, status: "soon" },
  { label: "WhatsApp", path: "/whatsapp", icon: MessagesSquare, status: "soon" },
  { label: "Calls", path: "/calls", icon: Phone, status: "soon" },
  { label: "Meetings", path: "/meetings", icon: Calendar, status: "soon" },
  { label: "Website Visitors", path: "/visitors", icon: Globe, status: "soon" },
  { label: "Forms", path: "/forms", icon: FileSignature, status: "soon" },
  { label: "Website Tracking", path: "/tracking", icon: BarChart3, status: "soon" },
  { label: "Campaigns", path: "/campaigns", icon: Sparkles, status: "soon" },
  { label: "Reports", path: "/reports", icon: PieChart, status: "soon" },
  { label: "Automation", path: "/automation", icon: Workflow, status: "soon" },
  { label: "Documents", path: "/documents", icon: FileText, status: "soon" },
  { label: "Products", path: "/products", icon: Package, status: "soon" },
  { label: "Quotes", path: "/quotes", icon: FileSignature, status: "soon" },
  { label: "Tickets", path: "/tickets", icon: TicketCheck, status: "soon" },
  { label: "Team", path: "/team", icon: UserSquare2, status: "live" },
  { label: "Notifications", path: "/notifications", icon: Bell, status: "live" },
  { label: "Settings", path: "/settings", icon: Settings, status: "live" },
];

export const MOBILE_PRIMARY_NAV: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[4],
  NAV_ITEMS[6],
];
