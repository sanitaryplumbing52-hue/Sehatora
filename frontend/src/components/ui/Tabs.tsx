import clsx from "clsx";

export interface TabDef {
  key: string;
  label: string;
  soon?: boolean;
}

export function Tabs({ tabs, active, onChange }: { tabs: TabDef[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border dark:border-border-dark px-4 md:px-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !tab.soon && onChange(tab.key)}
          className={clsx(
            "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-ink dark:hover:text-slate-200",
            tab.soon && "opacity-50 cursor-not-allowed"
          )}
        >
          {tab.label}
          {tab.soon && <span className="ml-1 text-[10px] text-muted">soon</span>}
        </button>
      ))}
    </div>
  );
}
