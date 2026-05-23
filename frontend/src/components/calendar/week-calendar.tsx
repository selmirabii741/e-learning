"use client";

import { format, isSameDay, isToday, parseISO } from "date-fns";
import clsx from "clsx";
import { Clock3, Lock, Trash2 } from "lucide-react";
import { EVENT_TYPE_META } from "@/lib/calendar/constants";
import type { CalendarEventRecord, TaskRecord } from "@/lib/calendar/types";
import { eventLayout, formatTimeRange, getWeekDays, groupEventsByDay, minutesSinceDayStart } from "@/lib/calendar/utils";

const hours = Array.from({ length: 14 }, (_, index) => 7 + index);
const DAY_START_HOUR = 7;
const CELL_HEIGHT = 64; // px per 30-minute slot

interface WeekCalendarProps {
  anchorDate: Date;
  events: CalendarEventRecord[];
  tasks: TaskRecord[];
  activeFilter: "all" | CalendarEventRecord["type"];
  selectedEventId: string | null;
  onSelectEvent: (event: CalendarEventRecord) => void;
  onDeleteEvent: (id: string) => void;
  onMoveEvent: (id: string, date: Date) => void;
}

/** Compute the CSS top + height for a task's occupied-slot overlay. */
function occupiedSlotLayout(task: TaskRecord) {
  const startMinute = minutesSinceDayStart(task.startAt) - DAY_START_HOUR * 60;
  const endMinute = minutesSinceDayStart(task.endAt) - DAY_START_HOUR * 60;
  const duration = Math.max(endMinute - startMinute, 15);
  return {
    top: `${(startMinute / 30) * CELL_HEIGHT}px`,
    height: `${(duration / 30) * CELL_HEIGHT}px`
  };
}

export function WeekCalendar({
  anchorDate,
  events,
  tasks,
  activeFilter,
  selectedEventId,
  onSelectEvent,
  onDeleteEvent,
  onMoveEvent
}: WeekCalendarProps) {
  const days = getWeekDays(anchorDate);
  const visibleEvents = activeFilter === "all" ? events : events.filter((event) => event.type === activeFilter);
  const eventsByDay = groupEventsByDay(visibleEvents, days);

  // Group occupied task slots by day for the visual overlay
  const occupiedByDay = days.map((day) =>
    tasks.filter((task) => task.startAt && isSameDay(parseISO(task.startAt), day))
  );

  return (
    <section className="glass-panel rounded-[30px] p-4 xl:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-bold text-ink">
            {format(days[0], "d MMM")} - {format(days[6], "d MMM yyyy")}
          </div>
          <p className="mt-1 text-sm text-[#8FA098]">Weekly view with draggable blocks and quick editing.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-100 bg-green-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700 shadow-soft">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          GMT+1
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-[72px_repeat(7,minmax(0,1fr))] overflow-hidden rounded-[24px] border border-line bg-white/75">
          <div className="border-r border-line bg-slate-50/60" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="border-r border-line bg-slate-50/75 px-3 py-4 text-center last:border-r-0"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = event.dataTransfer.getData("text/plain");
                if (id) {
                  onMoveEvent(id, day);
                }
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FA098]">
                {format(day, "EEE")}
              </div>
              <div
                className={clsx(
                  "mx-auto mt-2 flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold",
                  isToday(day) ? "bg-green-600 text-white shadow-soft" : "bg-white text-ink"
                )}
              >
                {format(day, "dd")}
              </div>
            </div>
          ))}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-r border-t border-line px-3 py-5 text-xs font-medium text-[#8FA098]">
                {`${String(hour).padStart(2, "0")}:00`}
              </div>
              {days.map((day, dayIndex) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="surface-grid relative h-16 border-r border-t border-line last:border-r-0"
                >
                  {hour === 7 && (
                    <div className="absolute inset-0">
                      {/* ── Occupied slot overlays (tasks) ── */}
                      {occupiedByDay[dayIndex]?.map((task) => {
                        const layout = occupiedSlotLayout(task);
                        return (
                          <div
                            key={`occupied-${task.id}`}
                            className="absolute left-0 right-0 z-[1] pointer-events-none select-none"
                            style={{ ...layout }}
                            title={`Occupied: ${task.title}`}
                          >
                            <div className="h-full w-full rounded-xl border border-rose-200/60 bg-rose-50/40 backdrop-blur-[1px]"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(244,63,94,0.06) 4px, rgba(244,63,94,0.06) 6px)"
                              }}
                            >
                              <div className="flex items-center gap-1 px-2 py-1">
                                <Lock className="h-3 w-3 text-rose-400/70" />
                                <span className="truncate text-[10px] font-medium text-rose-400/80">
                                  {task.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* ── Event cards ── */}
                      {eventsByDay[dayIndex]?.map((event) => {
                        const meta = EVENT_TYPE_META[event.type];
                        const isSelected = selectedEventId === event.id;
                        return (
                          <div
                            key={event.id}
                            className={clsx(
                              "absolute left-2 right-2 z-[2] rounded-2xl border px-3 py-2 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-panel",
                              isSelected ? "ring-2 ring-green-300" : ""
                            )}
                            draggable
                            onDragStart={(dragEvent) => dragEvent.dataTransfer.setData("text/plain", event.id)}
                            onClick={() => onSelectEvent(event)}
                            onKeyDown={(keyEvent) => {
                              if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                                keyEvent.preventDefault();
                                onSelectEvent(event);
                              }
                            }}
                            role="button"
                            style={{
                              ...eventLayout(event),
                              backgroundColor: `${event.color}22`,
                              borderColor: `${event.color}55`
                            }}
                            tabIndex={0}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-ink">{event.title}</div>
                                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#8FA098]">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  <span>{formatTimeRange(event.startAt, event.endAt)}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="rounded-full p-1 text-[#8FA098] transition hover:bg-white/80 hover:text-rose-500"
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  onDeleteEvent(event.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className={clsx("rounded-full px-2 py-1 text-[11px] font-semibold", meta.pill)}>
                                {meta.label}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#8FA098]">
        <div className="rounded-full border border-dashed border-green-300 px-3 py-1.5">
          Drag an event to another day to reschedule it
        </div>
        <div className="rounded-full border border-dashed border-slate-300 px-3 py-1.5">
          Click any event to edit details from the right panel
        </div>
        <div className="rounded-full border border-dashed border-rose-300 px-3 py-1.5 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Hatched zones indicate occupied task slots
        </div>
      </div>
    </section>
  );
}
