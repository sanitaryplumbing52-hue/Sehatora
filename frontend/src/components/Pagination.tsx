import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  numPages,
  count,
  onChange,
}: {
  page: number;
  numPages: number;
  count: number;
  onChange: (page: number) => void;
}) {
  if (numPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border dark:border-border-dark text-sm text-muted">
      <span>{count} results</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border dark:border-border-dark disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} of {numPages}
        </span>
        <button
          disabled={page >= numPages}
          onClick={() => onChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border dark:border-border-dark disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
