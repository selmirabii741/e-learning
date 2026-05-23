"use client";

import { format, isToday, parseISO } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { EventCard } from "@/components/calendar/EventCard";
import type { PlannerEvent } from "@/lib/calendar/planner-store";

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_CELL_HEIGHT = 64;

interface CalendarGridProps {
  weekDays: Date[];
  events: PlannerEvent[];
  currentTime: Date;
  onEventClick: (eventId: string) => void;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function eventLayout(event: PlannerEvent) {
  const startMinutes = toMinutes(event.startTime);
  const endMinutes = toMinutes(event.endTime);
  const offsetMinutes = Math.max(0, startMinutes - START_HOUR * 60);
  const duration = Math.max(30, endMinutes - startMinutes);
  return {
    top: (offsetMinutes / 60) * HOUR_CELL_HEIGHT,
    height: (duration / 60) * HOUR_CELL_HEIGHT - 6
  };
}

function DayColumn({
  day,
  dayIndex,
  events,
  onEventClick
}: {
  day: Date;
  dayIndex: number;
  events: PlannerEvent[];
  onEventClick: (eventId: string) => void;
}) {
  const dayKey = format(day, "yyyy-MM-dd");
  const { setNodeRef } = useDroppable({ id: `drop-${dayKey}`, data: { dayKey, dayIndex } });
  const dayEvents = events.filter((event) => event.date === dayKey);

  return (
    <div ref={setNodeRef} className="relative border-l border-slate-100">
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-2 py-2 backdrop-blur">
        <p className="text-center text-[11px] uppercase tracking-wide text-[#8FA098]">{format(day, "EEE")}</p>
        <div
          className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
            isToday(day) ? "bg-green-600 text-white" : "bg-slate-100 text-[#B7C2B8]"
          }`}
        >
          {format(day, "dd")}
        </div>
      </div>

      <div className="relative" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_CELL_HEIGHT }}>
        {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
          <div
            key={`${dayKey}-line-${i}`}
            className="border-b border-slate-100/90"
            style={{ height: HOUR_CELL_HEIGHT }}
          />
        ))}
        {dayEvents.map((event) => {
          const layout = eventLayout(event);
          return (
            <EventCard
              key={event.id}
              event={event}
              top={layout.top + 2}
              height={Math.max(40, layout.height)}
              onClick={() => onEventClick(event.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CalendarGrid({ weekDays, events, currentTime, onEventClick }: CalendarGridProps) {
  const nowKey = format(currentTime, "yyyy-MM-dd");
  const nowHourOffset = (currentTime.getHours() + currentTime.getMinutes() / 60 - START_HOUR) * HOUR_CELL_HEIGHT;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="grid min-w-[900px] grid-cols-[68px_repeat(7,minmax(0,1fr))]">
        <div className="border-r border-slate-100 bg-slate-50/80">
          <div className="h-[52px] border-b border-slate-100" />
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
            <div
              key={`hour-${i}`}
              className="border-b border-slate-100 px-2 pt-1 text-[11px] text-[#8FA098]"
              style={{ height: HOUR_CELL_HEIGHT }}
            >
              {String(START_HOUR + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {weekDays.map((day, index) => (
          <div key={day.toISOString()} className="relative">
            <DayColumn day={day} dayIndex={index} events={events} onEventClick={onEventClick} />
            {format(day, "yyyy-MM-dd") === nowKey && nowHourOffset > 0 && nowHourOffset < (END_HOUR - START_HOUR + 1) * HOUR_CELL_HEIGHT ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-30 border-t-2 border-red-500"
                style={{ top: 52 + nowHourOffset }}
              >
                <span className="absolute -left-1 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function timeFromDropY(clientY: number, columnRectTop: number) {
  const relative = Math.max(0, clientY - columnRectTop - 52);
  const hourFloat = START_HOUR + relative / HOUR_CELL_HEIGHT;
  const hour = Math.min(END_HOUR, Math.max(START_HOUR, Math.floor(hourFloat)));
  const minutesRaw = (hourFloat - Math.floor(hourFloat)) * 60;
  const minutes = minutesRaw >= 30 ? 30 : 0;
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function dateKeyFromEvent(event: PlannerEvent) {
  return format(parseISO(`${event.date}T00:00:00`), "yyyy-MM-dd");
}
