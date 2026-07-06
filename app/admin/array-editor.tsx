"use client";

import type { ReactNode } from "react";
import {
  useFieldArray,
  useFormContext,
  type FieldArrayPath,
} from "react-hook-form";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { SiteContent } from "@/lib/site-content-schema";

type ArrayEditorProps = {
  name: FieldArrayPath<SiteContent>;
  label: string;
  /** Factory for a new blank item (must satisfy the array's item schema). */
  defaultItem: () => unknown;
  renderItem: (index: number) => ReactNode;
  /** Optional per-row heading. */
  itemTitle?: (index: number) => string;
  addLabel?: string;
};

function SortableRow({
  id,
  title,
  onRemove,
  children,
}: {
  id: string;
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-white/[0.08] bg-black/30 p-3"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab rounded border border-white/10 px-1.5 py-0.5 text-white/40 hover:text-white/70 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span className="flex-1 truncate text-[12px] font-medium uppercase tracking-[0.12em] text-white/45">
          {title}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded border border-red-300/20 px-2 py-0.5 text-xs text-red-200/70 hover:border-red-300/40"
        >
          Remove
        </button>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export function ArrayEditor({
  name,
  label,
  defaultItem,
  renderItem,
  itemTitle,
  addLabel = "+ Add item",
}: ArrayEditorProps) {
  const { control } = useFormContext<SiteContent>();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/45">
          {label} <span className="text-white/25">({fields.length})</span>
        </span>
        <button
          type="button"
          onClick={() => append(defaultItem() as never)}
          className="rounded-lg border border-cyan-200/30 bg-cyan-200/10 px-3 py-1.5 text-[13px] text-cyan-50 hover:border-cyan-100/50"
        >
          {addLabel}
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[13px] text-white/35">
          No items yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map((f, i) => (
                <SortableRow
                  key={f.id}
                  id={f.id}
                  title={itemTitle ? itemTitle(i) : `#${i + 1}`}
                  onRemove={() => remove(i)}
                >
                  {renderItem(i)}
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
