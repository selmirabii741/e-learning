"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BellRing, CalendarDays, X } from "lucide-react";
import { toast } from "sonner";
import { CalendarGrid, timeFromDropY } from "@/components/calendar/CalendarGrid";
import { getWeekDays, isEventNear, usePlannerStore, type PlannerEvent, type PlannerEventType } from "@/lib/calendar/planner-store";

const EVENT_TYPE_LABEL: Record<PlannerEventType, string> = {
  course: "Courses",
  task: "Tasks",
  exam: "Exams",
  personal: "Personal"
};

const EVENT_TYPE_COLORS: Record<PlannerEventType, string> = {
  course: "bg-green-100 text-green-700",
  task: "bg-blue-100 text-blue-700",
  exam: "bg-purple-100 text-white",
  personal: "bg-orange-100 text-orange-700"
};

export function Calendar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const {
    anchorDate,
    currentTime,
    events,
    tasks,
    selectedEventId,
    setSelectedEventId,
    shiftWeek,
    goToToday,
    setCurrentTime,
    moveEvent,
    upsertEvent,
    deleteEvent
  } = usePlannerStore();

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const [editForm, setEditForm] = useState<PlannerEvent | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function canUseBrowserNotifications() {
    return typeof window !== "undefined" && "Notification" in window;
  }

  function notifyWithBrowser(title: string, body: string) {
    if (!canUseBrowserNotifications() || Notification.permission !== "granted") return;
    new Notification(title, { body });
  }

  async function requestBrowserNotifications() {
    if (!canUseBrowserNotifications()) {
      toast.error("Browser notifications are not supported on this device.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notifications enabled.");
      notifyWithBrowser("Notifications enabled", "You will now receive planner alerts.");
      return;
    }

    if (permission === "denied") {
      toast.error("Notifications are blocked. Enable them in your browser settings.");
      return;
    }

    toast.info("Notification permission request dismissed.");
  }

  useEffect(() => {
    if (!selectedEvent) {
      setEditForm(null);
      return;
    }
    setEditForm(selectedEvent);
  }, [selectedEvent]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [setCurrentTime]);

  useEffect(() => {
    if (!canUseBrowserNotifications()) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // Ignore permission prompt errors, toast reminders still work.
      });
    }
  }, []);

  useEffect(() => {
    function isTaskNear(deadlineIso: string, now: Date, thresholdMinutes = 10) {
      const deadline = parseISO(deadlineIso);
      const diff = Math.floor((deadline.getTime() - now.getTime()) / 60000);
      return diff >= 0 && diff <= thresholdMinutes;
    }

    const interval = setInterval(() => {
      const now = new Date();
      events.forEach((event) => {
        const id = `near-${event.id}-${format(now, "yyyy-MM-dd-HH-mm")}`;
        if (isEventNear(event, now, 10) && !sessionStorage.getItem(id)) {
          toast.info(`Upcoming in 10 minutes: ${event.title}`, {
            description: `${event.startTime}`
          });
          notifyWithBrowser(`Upcoming event: ${event.title}`, `Starts at ${event.startTime}`);
          sessionStorage.setItem(id, "1");
        }
      });

      tasks.forEach((task) => {
        if (task.completed) return;
        const id = `task-near-${task.id}-${format(now, "yyyy-MM-dd-HH-mm")}`;
        if (isTaskNear(task.deadline, now, 10) && !sessionStorage.getItem(id)) {
          const deadline = format(parseISO(task.deadline), "HH:mm");
          toast.info(`Task due in 10 minutes: ${task.title}`, {
            description: `Deadline at ${deadline}`
          });
          notifyWithBrowser(`Task due soon: ${task.title}`, `Deadline at ${deadline}`);
          sessionStorage.setItem(id, "1");
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [events, tasks]);

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const over = event.over;
    if (!over) return;
    const dayKey = String(over.id).replace("drop-", "");
    const columnRectTop = over.rect.top;
    const pointerY =
      event.activatorEvent && "clientY" in event.activatorEvent ? event.activatorEvent.clientY : undefined;
    const clientY = pointerY ?? columnRectTop + 52;
    const fallbackStart = "10:00";
    const computedTime =
      typeof columnRectTop === "number" && typeof clientY === "number"
        ? timeFromDropY(clientY, columnRectTop)
        : fallbackStart;
    moveEvent(activeId, dayKey, computedTime);
  }

  function handleSaveEvent() {
    if (!editForm) return;
    if (!editForm.title.trim()) return;
    if (editForm.endTime <= editForm.startTime) return;
    upsertEvent({ ...editForm, title: editForm.title.trim() });
    toast.success("Event updated");
    setSelectedEventId(null);
  }

  const completionStats = `${tasks.filter((task) => task.completed).length} completed / ${tasks.length} total`;
  const weekRange = `${format(weekDays[0], "MMM d")} - ${format(weekDays[6], "MMM d, yyyy")}`;

  if (!mounted) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex h-64 items-center justify-center text-sm text-[#8FA098]">Loading calendar…</div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Calendar</h1>
          <p className="text-sm text-[#8FA098]">{weekRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void requestBrowserNotifications();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-[#B7C2B8] transition hover:bg-slate-50"
          >
            <BellRing className="h-4 w-4" />
            Notifications
          </button>
          <button
            type="button"
            onClick={() => shiftWeek("prev")}
            className="rounded-lg border border-slate-200 p-2 text-[#B7C2B8] transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-[#B7C2B8] transition hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftWeek("next")}
            className="rounded-lg border border-slate-200 p-2 text-[#B7C2B8] transition hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Courses</span>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">Tasks</span>
        <span className="rounded-full bg-purple-100 px-2 py-1 text-white">Exams</span>
        <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">Personal</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[#B7C2B8]">
          <CalendarDays className="h-3.5 w-3.5" />
          {completionStats}
        </span>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <CalendarGrid
          weekDays={weekDays}
          events={events}
          currentTime={currentTime}
          onEventClick={(eventId) => setSelectedEventId(eventId)}
        />
      </DndContext>

      {selectedEvent && editForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit Event</h3>
                <p className="text-xs text-[#8FA098]">Update title, time, date, or type.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="rounded-lg p-1 text-[#8FA098] transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={editForm.title}
                onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(event) => setEditForm({ ...editForm, date: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                />
                <select
                  value={editForm.type}
                  onChange={(event) => setEditForm({ ...editForm, type: event.target.value as PlannerEventType })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                >
                  {Object.keys(EVENT_TYPE_LABEL).map((type) => (
                    <option key={type} value={type}>
                      {EVENT_TYPE_LABEL[type as PlannerEventType]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={editForm.startTime}
                  onChange={(event) => setEditForm({ ...editForm, startTime: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                />
                <input
                  type="time"
                  value={editForm.endTime}
                  onChange={(event) => setEditForm({ ...editForm, endTime: event.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${EVENT_TYPE_COLORS[editForm.type]}`}>
                  {EVENT_TYPE_LABEL[editForm.type]}
                </span>
                <span className="text-xs text-[#8FA098]">
                  {isSameDay(parseISO(`${editForm.date}T00:00:00`), new Date()) ? "Today" : editForm.date}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  deleteEvent(selectedEvent.id);
                  toast.success("Event deleted");
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventId(null)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-[#B7C2B8] transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </section>
  );
}
