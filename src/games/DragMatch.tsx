import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { shuffle } from "../lib/shuffle";
import type { Side } from "../types";
import { GameShell } from "./GameShell";

const BATCH_SIZE = 8;

export function DragMatch({ set }: { set: PlayableSet }) {
  const batches = useMemo(() => chunk(set.pairs, BATCH_SIZE), [set.pairs]);
  const [batchIndex, setBatchIndex] = useState(0);
  const batch = batches[batchIndex];

  const [rightOrder, setRightOrder] = useState<string[]>(() =>
    shuffle(batch.map((p) => p.id)),
  );
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => Object.fromEntries(batch.map((p) => [p.id, null])),
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
  );

  function resetBatch(index: number) {
    const b = batches[index];
    setRightOrder(shuffle(b.map((p) => p.id)));
    setAssignments(Object.fromEntries(b.map((p) => [p.id, null])));
    setChecked({});
  }

  const placedIds = new Set(Object.values(assignments).filter(Boolean));
  const pool = rightOrder.filter((id) => !placedIds.has(id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const draggedPairId = active.id as string;
    const slotLeftId = over.id as string;
    if (checked[slotLeftId]) return;
    setAssignments((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === draggedPairId) next[key] = null;
      }
      next[slotLeftId] = draggedPairId;
      return next;
    });
  }

  function check() {
    const results: Record<string, boolean> = {};
    for (const p of batch) {
      results[p.id] = assignments[p.id] === p.id;
    }
    setChecked(results);
    setTimeout(() => {
      setAssignments((prev) => {
        const next = { ...prev };
        for (const p of batch) {
          if (!results[p.id]) next[p.id] = null;
        }
        return next;
      });
      setChecked((prev) => {
        const kept: Record<string, boolean> = {};
        for (const key of Object.keys(prev)) if (prev[key]) kept[key] = true;
        return kept;
      });
    }, 900);
  }

  const allCorrect = batch.every((p) => checked[p.id]);
  const hasLastBatch = batchIndex === batches.length - 1;

  function unassign(leftId: string) {
    if (checked[leftId]) return;
    setAssignments((prev) => ({ ...prev, [leftId]: null }));
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Drag & Match"
      status={
        <div className="text-sm text-slate-200">
          Batch {batchIndex + 1} of {batches.length}
        </div>
      }
    >
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 w-full">
            {batch.map((p) => {
              const assignedId = assignments[p.id];
              const assignedPair = batch.find((x) => x.id === assignedId);
              const isChecked = checked[p.id];
              return (
                <div key={p.id} className="contents">
                  <div className="flex items-center bg-white rounded-lg px-4 py-3 shadow font-medium min-h-16">
                    <SideView side={p.left} imageClassName="max-h-20" />
                  </div>
                  <Slot
                    id={p.id}
                    filledSide={assignedPair?.right}
                    state={
                      isChecked === undefined
                        ? "empty"
                        : isChecked
                          ? "correct"
                          : "wrong"
                    }
                    onClear={() => unassign(p.id)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 justify-center min-h-16 bg-slate-200/60 rounded-lg p-3 w-full">
            {pool.length === 0 && (
              <span className="text-slate-400 text-sm py-3">
                All answers placed — click Check
              </span>
            )}
            {pool.map((id) => {
              const pair = batch.find((x) => x.id === id)!;
              return <Chip key={id} id={id} side={pair.right} />;
            })}
          </div>

          <div className="flex gap-4">
            {!allCorrect ? (
              <button
                onClick={check}
                disabled={pool.length > 0}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-semibold px-6 py-3"
              >
                Check
              </button>
            ) : hasLastBatch ? (
              <div className="text-xl font-bold text-green-700">
                All batches complete! 🎉
              </div>
            ) : (
              <button
                onClick={() => {
                  setBatchIndex((i) => i + 1);
                  resetBatch(batchIndex + 1);
                }}
                className="rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3"
              >
                Next batch →
              </button>
            )}
          </div>
        </div>
      </DndContext>
    </GameShell>
  );
}

function Chip({ id, side }: { id: string; side: Side }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg bg-amber-100 hover:bg-amber-200 px-4 py-2 font-medium shadow cursor-grab touch-none ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <SideView side={side} imageClassName="max-h-16" />
    </button>
  );
}

function Slot({
  id,
  filledSide,
  state,
  onClear,
}: {
  id: string;
  filledSide?: Side;
  state: "empty" | "correct" | "wrong";
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: state === "correct" });
  const base = "rounded-lg px-4 py-3 border-2 border-dashed min-h-12 flex items-center justify-between";
  const color =
    state === "correct"
      ? "bg-green-100 border-green-400"
      : state === "wrong"
        ? "bg-red-100 border-red-400"
        : isOver
          ? "bg-blue-50 border-blue-400"
          : "bg-white border-slate-300";
  return (
    <div ref={setNodeRef} className={`${base} ${color}`}>
      <span className="font-medium">
        {filledSide && <SideView side={filledSide} imageClassName="max-h-16" />}
      </span>
      {filledSide && state !== "correct" && (
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 text-sm"
          aria-label="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out.length > 0 ? out : [[]];
}
