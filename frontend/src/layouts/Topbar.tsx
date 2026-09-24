import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { useMarkAllNotificationsRead, useNotifications, useUnreadCount } from "@/hooks/useNotifications";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

export function Topbar({ onOpenMobileDrawer }: { onOpenMobileDrawer?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: results } = useGlobalSearch(query);
  const { data: unreadCount } = useUnreadCount();
  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-white dark:bg-surface-dark-card dark:border-border-dark px-4 md:px-6">
      <button onClick={onOpenMobileDrawer} className="md:hidden p-1 text-muted">
        <Menu size={22} />
      </button>

      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search contacts, companies, deals..."
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-surface-dark dark:border-border-dark"
          />
        </div>

        {searchOpen && query.length > 1 && results && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-white dark:bg-surface-dark-card dark:border-border-dark shadow-popover max-h-96 overflow-y-auto">
            <SearchSection title="Contacts" items={results.contacts.map((c) => ({ id: c.id, label: c.full_name, path: `/contacts/${c.id}` }))} navigate={navigate} close={() => setSearchOpen(false)} />
            <SearchSection title="Companies" items={results.companies.map((c) => ({ id: c.id, label: c.name, path: `/companies/${c.id}` }))} navigate={navigate} close={() => setSearchOpen(false)} />
            <SearchSection title="Deals" items={results.deals.map((d) => ({ id: d.id, label: d.name, path: `/deals` }))} navigate={navigate} close={() => setSearchOpen(false)} />
            <SearchSection title="Leads" items={results.leads.map((l) => ({ id: l.id, label: l.contact_detail?.full_name ?? "Lead", path: `/leads` }))} navigate={navigate} close={() => setSearchOpen(false)} />
            {[results.contacts, results.companies, results.deals, results.leads].every((arr) => arr.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-muted">No results for "{query}"</p>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-muted hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-muted hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Bell size={18} />
            {!!unreadCount && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-border bg-white dark:bg-surface-dark-card dark:border-border-dark shadow-popover">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
                <span className="text-sm font-semibold">Notifications</span>
                <button onClick={() => markAllRead.mutate()} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications?.results.length ? (
                  notifications.results.map((n) => (
                    <div key={n.id} className={`px-4 py-3 text-sm border-b border-border dark:border-border-dark last:border-0 ${!n.is_read ? "bg-primary-light/40 dark:bg-primary/10" : ""}`}>
                      <p className="font-medium text-ink dark:text-slate-100">{n.title}</p>
                      {n.body && <p className="text-xs text-muted mt-0.5">{n.body}</p>}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-muted">You're all caught up</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Avatar name={user?.full_name ?? user?.username ?? "?"} src={user?.avatar} size={30} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-border bg-white dark:bg-surface-dark-card dark:border-border-dark shadow-popover py-1">
              <div className="px-4 py-2 border-b border-border dark:border-border-dark">
                <p className="text-sm font-semibold text-ink dark:text-slate-100">{user?.full_name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Settings size={15} /> Settings
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <UserIcon size={15} /> My profile
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchSection({
  title,
  items,
  navigate,
  close,
}: {
  title: string;
  items: { id: string; label: string; path: string }[];
  navigate: (p: string) => void;
  close: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="py-1">
      <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            navigate(item.path);
            close();
          }}
          className="flex w-full items-center px-4 py-2 text-sm text-ink dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
