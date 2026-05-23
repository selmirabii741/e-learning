import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  set,
  startOfWeek
} from "date-fns";
import type { CalendarEventRecord, EventInput, EventType, TaskRecord } from "@/lib/calendar/types";

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function startOfCalendarWeek(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function endOfCalendarWeek(date: Date) {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(anchorDate: Date) {
  const start = startOfCalendarWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function combineDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return set(new Date(`${date}T00:00:00`), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0
  }).toISOString();
}

/**
 * Returns true when two time ranges overlap (strictly — touching edges are OK).
 * Example: 10:00–11:00 vs 11:00–12:00 → false (no overlap)
 *          10:00–11:00 vs 10:30–11:30 → true  (overlap)
 */
export function timeSlotsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return parseISO(startA) < parseISO(endB) && parseISO(startB) < parseISO(endA);
}

/**
 * Scans a list of tasks and returns the first one that conflicts with the
 * proposed [startAt, endAt) window, or null if the slot is free.
 * Optionally excludes a task by ID (useful for updates).
 */
export function findConflictingTask(
  tasks: { id: string; startAt: string; endAt: string }[],
  startAt: string,
  endAt: string,
  excludeTaskId?: string
) {
  return (
    tasks.find(
      (task) =>
        task.id !== excludeTaskId &&
        timeSlotsOverlap(task.startAt, task.endAt, startAt, endAt)
    ) ?? null
  );
}

export function splitIsoToForm(isoString: string) {
  const date = parseISO(isoString);
  return {
    date: format(date, "yyyy-MM-dd"),
    time: format(date, "HH:mm")
  };
}

export function formatTimeRange(startAt: string, endAt: string) {
  return `${format(parseISO(startAt), "HH:mm")} - ${format(parseISO(endAt), "HH:mm")}`;
}

export function minutesSinceDayStart(isoString: string) {
  const value = parseISO(isoString);
  return value.getHours() * 60 + value.getMinutes();
}

export function eventLayout(event: CalendarEventRecord, dayStartHour = 7) {
  const startMinute = minutesSinceDayStart(event.startAt) - dayStartHour * 60;
  const duration = Math.max(differenceInMinutes(parseISO(event.endAt), parseISO(event.startAt)), 30);
  return {
    top: `${(startMinute / 30) * 64}px`,
    height: `${(duration / 30) * 64 - 8}px`
  };
}

export function groupEventsByDay(events: CalendarEventRecord[], days: Date[]) {
  return days.map((day) =>
    events.filter((event) => isSameDay(parseISO(event.startAt), day))
  );
}

export function nextReminderAt(event: CalendarEventRecord) {
  return addMinutes(parseISO(event.startAt), -event.reminderMinutes).toISOString();
}

export function buildTaskLinkedEvent(task: TaskRecord): EventInput {
  const deadline = parseISO(task.deadline);
  return {
    title: task.title,
    description: task.details ?? "Task synced from the todo list",
    type: "task",
    color: "#7CA6FF",
    date: format(deadline, "yyyy-MM-dd"),
    startTime: "17:00",
    endTime: "18:00",
    location: "Linked from Todo",
    reminderMinutes: 120
  };
}

export function typeLabel(type: EventType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function isEventUpcoming(event: CalendarEventRecord, hours = 48) {
  const now = new Date();
  const threshold = addMinutes(now, hours * 60);
  const start = parseISO(event.startAt);
  return start >= now && start <= threshold;
}
