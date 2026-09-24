import clsx from "clsx";
import { Calendar, CheckCircle2, Columns3, List, ListTodo, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCompleteTask, useTasks, useTasksKanban } from "@/hooks/useTasks";
import type { Task } from "@/types";

type ViewMode = "list" | "kanban" | "calendar";

const PRIORITY_TONE: Record<string, "default" | "primary" | "success" | "warning" | "danger" | "muted"> = {
  low: "muted",
  medium: "default",
  high: "danger",
};

export function TasksPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything you and your team need to follow up on"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border dark:border-border-dark p-0.5">
              {(
                [
                  { key: "list", icon: List },
                  { key: "kanban", icon: Columns3 },
                  { key: "calendar", icon: Calendar },
                ] as const
              ).map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    view === v.key ? "bg-primary text-white" : "text-muted hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <v.icon size={15} />
                </button>
              ))}
            </div>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> New Task
            </Button>
          </div>
        }
      />

      <div className="px-4 md:px-6 pb-10">
        {view === "list" && <ListView />}
        {view === "kanban" && <KanbanView />}
        {view === "calendar" && <CalendarView />}
      </div>

      <TaskFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const completeTask = useCompleteTask();
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border dark:border-border-dark last:border-0">
      <button
        onClick={() => task.status !== "completed" && completeTask.mutate(task.id)}
        className={clsx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          task.status === "completed" ? "bg-success border-success text-white" : "border-border dark:border-border-dark"
        )}
      >
        {task.status === "completed" && <CheckCircle2 size={14} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm font-medium truncate", task.status === "completed" ? "line-through text-muted" : "text-ink dark:text-slate-100")}>
          {task.name}
        </p>
        <p className="text-xs text-muted truncate">
          {task.contact_name || task.company_name || task.deal_name || "No related record"}
        </p>
      </div>
      <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
      <span className={clsx("text-xs w-24 text-right shrink-0", task.is_overdue ? "text-danger font-medium" : "text-muted")}>
        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
      </span>
    </div>
  );
}

function ListView() {
  const { data, isLoading } = useTasks({ page_size: 50, ordering: "due_date" });
  return (
    <Card>
      {isLoading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !data?.results.length ? (
        <EmptyState icon={ListTodo} title="No tasks yet" description="Create your first task to start tracking follow-ups." />
      ) : (
        data.results.map((task) => <TaskRow key={task.id} task={task} />)
      )}
    </Card>
  );
}

function KanbanView() {
  const { data, isLoading } = useTasksKanban();
  if (isLoading || !data) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-64" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {data.map((column) => (
        <div key={column.status} className="w-64 shrink-0 rounded-xl border border-border dark:border-border-dark bg-slate-50 dark:bg-surface-dark">
          <div className="px-3 py-2.5 border-b border-border dark:border-border-dark text-sm font-semibold text-ink dark:text-slate-100">
            {column.label} <span className="text-xs font-normal text-muted">({column.tasks.length})</span>
          </div>
          <div className="space-y-2 p-3 max-h-[60vh] overflow-y-auto">
            {column.tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark-card p-3">
                <p className="text-sm font-medium text-ink dark:text-slate-100">{task.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                  {task.due_date && <span className="text-xs text-muted">{new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView() {
  const { data, isLoading } = useTasks({ page_size: 100, ordering: "due_date" });

  const groups = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Task[]>();
    for (const task of data.results) {
      const key = task.due_date ? new Date(task.due_date).toDateString() : "No due date";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <Skeleton className="h-64" />;
  if (!groups.length) return <EmptyState icon={Calendar} title="Nothing scheduled" description="Tasks with due dates will appear here by day." />;

  return (
    <div className="space-y-4">
      {groups.map(([day, tasks]) => (
        <Card key={day}>
          <div className="px-5 py-3 border-b border-border dark:border-border-dark text-sm font-semibold text-ink dark:text-slate-100">{day}</div>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Card>
      ))}
    </div>
  );
}
