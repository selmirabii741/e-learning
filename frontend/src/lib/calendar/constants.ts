import type { EventType, TaskPriority } from "@/lib/calendar/types";

export const EVENT_TYPE_META: Record<
  EventType,
  { label: string; pill: string; soft: string }
> = {
  course: { label: "Courses", pill: "bg-emerald-100 text-emerald-700", soft: "bg-emerald-50" },
  task: { label: "Tasks", pill: "bg-sky-100 text-sky-700", soft: "bg-sky-50" },
  exam: { label: "Exams", pill: "bg-amber-100 text-amber-700", soft: "bg-amber-50" },
  deadline: { label: "Deadlines", pill: "bg-rose-100 text-rose-700", soft: "bg-rose-50" }
};

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; tone: string }
> = {
  low: { label: "Low", tone: "text-[#8FA098]" },
  medium: { label: "Medium", tone: "text-amber-600" },
  high: { label: "High", tone: "text-rose-600" }
};

export const EVENT_TYPE_OPTIONS: EventType[] = ["course", "task", "exam", "deadline"];
export const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high"];
export const EVENT_COLOR_OPTIONS = [
  "#75C46B",
  "#7CA6FF",
  "#B58CF6",
  "#FFB85C",
  "#FF6A88",
  "#96A0AE"
];
