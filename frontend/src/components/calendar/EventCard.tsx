"use client";

import { Clock3 } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import type { PlannerEvent } from "@/lib/calendar/planner-store";

const EVENT_THEME: Record<PlannerEvent["type"], string> = {
  course: "border-green-200 bg-green-100/70 text-green-900",
  task: "border-blue-200 bg-blue-100/70 text-blue-900",
  exam: "border-purple-200 bg-purple-100/70 text-white",
  personal: "border-orange-200 bg-orange-100/70 text-orange-900"
};

interface EventCardProps {
  event: PlannerEvent;
  top: number;
  height: number;
  onClick: () => void;
}

export function EventCard({ event, top, height, onClick }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { eventId: event.id }
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`absolute left-1 right-1 rounded-xl border p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${EVENT_THEME[event.type]}`}
      style={{
        top,
        height,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.65 : 1,
        zIndex: isDragging ? 40 : 10
      }}
      {...listeners}
      {...attributes}
    >
      <p className="truncate text-xs font-semibold">{event.title}</p>
      <p className="mt-1 flex items-center gap-1 text-[11px] opacity-80">
        <Clock3 className="h-3 w-3" />
        {event.startTime} - {event.endTime}
      </p>
    </button>
  );
}
