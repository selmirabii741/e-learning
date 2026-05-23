"use client";

import { format, parseISO } from "date-fns";
import { CalendarPlus, CalendarRange, Check, Trash2 } from "lucide-react";
import type { PlannerTask } from "@/lib/calendar/planner-store";

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-green-100 text-green-700"
} as const;

interface TaskItemProps {
  task: PlannerTask;
  onToggle: () => void;
  onDelete: () => void;
  onAddToCalendar: () => void;
}

export function TaskItem({ task, onToggle, onDelete, onAddToCalendar }: TaskItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition ${
            task.completed ? "border-green-600 bg-green-600 text-white" : "border-slate-300 hover:border-green-500"
          }`}
          aria-label={task.completed ? "Mark task as active" : "Mark task as completed"}
        >
          <Check className="h-3 w-3" />
        </button>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${task.completed ? "text-[#8FA098] line-through" : "text-white"}`}>
            {task.title}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#8FA098]">
            <CalendarRange className="h-3 w-3" />
            {format(parseISO(task.deadline), "EEE, MMM d - HH:mm")}
          </p>
        </div>

        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onAddToCalendar}
          disabled={Boolean(task.linkedEventId)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-[#B7C2B8] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          {task.linkedEventId ? "Scheduled" : "Add to Calendar"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#8FA098] transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
