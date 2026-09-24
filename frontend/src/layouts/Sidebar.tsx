import clsx from "clsx";
import { ChevronsLeft, ChevronsRight, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useUIStore } from "@/stores/uiStore";
import { NAV_ITEMS } from "@/utils/nav";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-white dark:bg-surface-dark-card dark:border-border-dark transition-all duration-200",
        sidebarCollapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4 border-b border-border dark:border-border-dark">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shrink-0">
          <Sparkles size={18} />
        </div>
        {!sidebarCollapsed && <span className="text-base font-semibold text-ink dark:text-slate-100">Sehatora CRM</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary dark:bg-primary/20 dark:text-blue-300"
                  : "text-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-slate-100"
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {!sidebarCollapsed && (
              <span className="flex-1 truncate flex items-center gap-2">
                {item.label}
                {item.status === "soon" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted bg-slate-100 dark:bg-slate-700 rounded px-1.5 py-0.5">
                    Soon
                  </span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center gap-2 border-t border-border dark:border-border-dark px-4 py-3 text-sm text-muted hover:text-ink dark:hover:text-slate-100"
      >
        {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        {!sidebarCollapsed && "Collapse"}
      </button>
    </aside>
  );
}
