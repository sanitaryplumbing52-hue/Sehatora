import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { MOBILE_PRIMARY_NAV, NAV_ITEMS } from "@/utils/nav";

export function MobileBottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-border bg-white dark:bg-surface-dark-card dark:border-border-dark pb-[env(safe-area-inset-bottom)]">
        {MOBILE_PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
                isActive ? "text-primary" : "text-muted"
              )
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted"
        >
          <Menu size={20} />
          More
        </button>
      </nav>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative max-h-[75vh] overflow-y-auto rounded-t-xl bg-white dark:bg-surface-dark-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink dark:text-slate-100">All modules</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-muted">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setDrawerOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-center text-[11px] font-medium text-muted hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <item.icon size={18} />
                  </span>
                  <span className="line-clamp-2 leading-tight">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
