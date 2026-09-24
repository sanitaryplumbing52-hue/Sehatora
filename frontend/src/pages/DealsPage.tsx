import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { LayoutGrid, Plus } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { DealCard } from "@/components/deals/DealCard";
import { DealColumn } from "@/components/deals/DealColumn";
import { DealFormModal } from "@/components/deals/DealFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDealsKanban, useMoveDealStage, usePipelines } from "@/hooks/useDeals";
import type { Deal } from "@/types";

export function DealsPage() {
  const { data: pipelines } = usePipelines();
  const [pipelineId, setPipelineId] = useState<string | undefined>();
  const activePipelineId = pipelineId ?? pipelines?.find((p) => p.is_default)?.id ?? pipelines?.[0]?.id;

  const { data: board, isLoading } = useDealsKanban(activePipelineId);
  const moveStage = useMoveDealStage();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveDeal((event.active.data.current?.deal as Deal) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;
    const deal = active.data.current?.deal as Deal | undefined;
    if (!deal || deal.stage === over.id) return;
    moveStage.mutate({ id: deal.id, stageId: String(over.id) });
  }

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Drag deals across stages as they progress"
        actions={
          <div className="flex items-center gap-2">
            {pipelines && pipelines.length > 1 && (
              <Select value={activePipelineId} onChange={(e) => setPipelineId(e.target.value)} className="w-48">
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> New Deal
            </Button>
          </div>
        }
      />

      <div className="px-4 md:px-6 pb-10">
        {isLoading || !board ? (
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-72" />
            ))}
          </div>
        ) : !board.stages.length ? (
          <EmptyState icon={LayoutGrid} title="No pipeline configured" description="Create a pipeline in Settings to start tracking deals." />
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {board.stages.map((stage) => (
                <DealColumn
                  key={stage.id}
                  id={stage.id}
                  name={stage.name}
                  totalValue={stage.total_value}
                  currency={board.stages[0]?.deals[0]?.currency ?? "AED"}
                  deals={stage.deals}
                  isWon={stage.is_won}
                  isLost={stage.is_lost}
                />
              ))}
            </div>
            <DragOverlay>{activeDeal && <DealCard deal={activeDeal} />}</DragOverlay>
          </DndContext>
        )}
      </div>

      {pipelines && <DealFormModal open={modalOpen} onClose={() => setModalOpen(false)} pipelines={pipelines} defaultPipelineId={activePipelineId} />}
    </div>
  );
}
