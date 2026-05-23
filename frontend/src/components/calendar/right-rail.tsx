"use client";

import { format, formatDistanceToNow, parseISO } from "date-fns";
import clsx from "clsx";
import { BellRing, CalendarDays, Check, Clock3, Mail, Sparkles, Trash2 } from "lucide-react";
import { EVENT_COLOR_OPTIONS, EVENT_TYPE_META, PRIORITY_META } from "@/lib/calendar/constants";
import type {
  CalendarEventRecord,
  EventInput,
  EventType,
  NotificationRecord,
  TaskInput,
  TaskPriority,
  TaskRecord
} from "@/lib/calendar/types";

interface EventDraft extends EventInput {
  reminderMinutes: number;
}

interface TaskDraft extends TaskInput {
  linkToCalendar: boolean;
}


interface RightRailProps {
  eventDraft: EventDraft;
  taskDraft: TaskDraft;
  selectedEvent: CalendarEventRecord | null;
  activeSection: "calendar" | "todo" | "reminders";
  selectedTaskId: string | null;
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  aiSuggestions: {
    title: string;
    recommendedDate: string;
    startTime: string;
    endTime: string;
    rationale: string;
  }[];
  isSavingEvent: boolean;
  isSavingTask: boolean;
  isLoadingAi: boolean;
  onEventDraftChange: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  onTaskDraftChange: <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => void;
  onSubmitEvent: () => void;
  onDeleteSelected: () => void;
  onResetEventForm: () => void;
  onSubmitTask: () => void;
  onSelectTask: (task: TaskRecord) => void;
  onToggleTask: (task: TaskRecord) => void;
  onDeleteTask: (id: string) => void;
  onFetchAiSuggestions: () => void;
  onApplySuggestion: (index: number) => void;
}

export function RightRail({
  activeSection,
  eventDraft,
  taskDraft,
  selectedEvent,
  selectedTaskId,
  tasks,
  notifications,
  aiSuggestions,
  isSavingEvent,
  isSavingTask,
  isLoadingAi,
  onEventDraftChange,
  onTaskDraftChange,
  onSubmitEvent,
  onDeleteSelected,
  onResetEventForm,
  onSubmitTask,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onFetchAiSuggestions,
  onApplySuggestion
}: RightRailProps) {
  return (
    <aside className="space-y-5 xl:sticky xl:top-6">
      {activeSection === "calendar" && (
        <section id="event-form-section" className="glass-panel section-anchor rounded-[30px] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink">{selectedEvent ? "Edit event" : "Add event"}</h2>
              <p className="mt-1 text-sm text-[#8FA098]">
                Create classes, tasks, exams, and deadlines directly from the planner.
              </p>
            </div>
            {selectedEvent ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#8FA098] transition hover:border-slate-300 hover:text-ink"
                onClick={onResetEventForm}
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <input
              value={eventDraft.title}
              onChange={(event) => onEventDraftChange("title", event.target.value)}
              placeholder="Event title"
              className="field-shell h-12 w-full rounded-2xl px-4 text-sm outline-none"
            />
            <input
              type="date"
              value={eventDraft.date}
              onChange={(event) => onEventDraftChange("date", event.target.value)}
              className="field-shell h-12 w-full rounded-2xl px-4 text-sm outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={eventDraft.startTime}
                onChange={(event) => onEventDraftChange("startTime", event.target.value)}
                className="field-shell h-12 rounded-2xl px-4 text-sm outline-none"
              />
              <input
                type="time"
                value={eventDraft.endTime}
                onChange={(event) => onEventDraftChange("endTime", event.target.value)}
                className="field-shell h-12 rounded-2xl px-4 text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={eventDraft.type}
                onChange={(event) => onEventDraftChange("type", event.target.value as EventType)}
                className="field-shell h-12 rounded-2xl px-4 text-sm outline-none"
              >
                {Object.entries(EVENT_TYPE_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={eventDraft.reminderMinutes}
                onChange={(event) => onEventDraftChange("reminderMinutes", Number(event.target.value))}
                min={15}
                step={15}
                className="field-shell h-12 rounded-2xl px-4 text-sm outline-none"
                placeholder="Reminder mins"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {EVENT_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={clsx(
                    "h-8 w-8 rounded-full border-2 shadow-soft transition",
                    eventDraft.color === color ? "scale-110 border-ink" : "border-white"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onEventDraftChange("color", color)}
                />
              ))}
            </div>

            <textarea
              value={eventDraft.description}
              onChange={(event) => onEventDraftChange("description", event.target.value)}
              placeholder="Description"
              rows={4}
              className="field-shell w-full rounded-3xl px-4 py-3 text-sm outline-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onSubmitEvent}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-green-600 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-green-700 disabled:opacity-60"
                disabled={isSavingEvent}
              >
                {isSavingEvent ? "Saving..." : selectedEvent ? "Save changes" : "Add event"}
              </button>
              <button
                type="button"
                onClick={selectedEvent ? onDeleteSelected : onFetchAiSuggestions}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-white/92 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                disabled={isLoadingAi}
              >
                {selectedEvent ? "Delete" : <Sparkles className="h-4 w-4" />}
                {selectedEvent ? null : isLoadingAi ? "Scheduling..." : "AI schedule"}
              </button>
            </div>

          </div>

          {aiSuggestions.length ? (
            <div className="mt-5 rounded-[24px] border border-green-100 bg-green-50/70 p-4 shadow-soft">
              <div className="text-sm font-semibold text-green-800">AI suggestions</div>
              <div className="mt-3 space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.recommendedDate}-${suggestion.startTime}`}
                    type="button"
                    className="glass-card w-full rounded-2xl px-4 py-3 text-left transition hover:-translate-y-0.5"
                    onClick={() => onApplySuggestion(index)}
                  >
                    <div className="text-sm font-semibold text-ink">
                      {suggestion.recommendedDate} - {suggestion.startTime} to {suggestion.endTime}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[#8FA098]">{suggestion.rationale}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section
        id="todo-section"
        className="glass-panel section-anchor rounded-[30px] p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink">To-do list</h2>
            <p className="mt-1 text-sm text-[#8FA098]">Capture tasks, add priorities, and link them to the calendar.</p>
          </div>
          <button
            type="button"
            onClick={onSubmitTask}
            className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-green-100 disabled:opacity-60"
            disabled={isSavingTask}
          >
            {isSavingTask ? "Saving..." : "Add task"}
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={taskDraft.title}
            onChange={(event) => onTaskDraftChange("title", event.target.value)}
            placeholder="Task title"
            className="field-shell h-12 w-full rounded-2xl px-4 text-sm outline-none"
          />
          <input
            type="date"
            value={taskDraft.date}
            onChange={(event) => onTaskDraftChange("date", event.target.value)}
            className="field-shell h-12 w-full rounded-2xl px-4 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              value={taskDraft.startTime}
              onChange={(event) => onTaskDraftChange("startTime", event.target.value)}
              className="field-shell h-12 rounded-2xl px-4 text-sm outline-none"
            />
            <input
              type="time"
              value={taskDraft.endTime}
              onChange={(event) => onTaskDraftChange("endTime", event.target.value)}
              className="field-shell h-12 rounded-2xl px-4 text-sm outline-none"
            />
          </div>
          <select
            value={taskDraft.priority}
            onChange={(event) => onTaskDraftChange("priority", event.target.value as TaskPriority)}
            className="field-shell h-12 w-full rounded-2xl px-4 text-sm outline-none"
          >
            {Object.entries(PRIORITY_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <label className="field-shell flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#B7C2B8]">
            <input
              type="checkbox"
              checked={taskDraft.linkToCalendar}
              onChange={(event) => onTaskDraftChange("linkToCalendar", event.target.checked)}
              className="h-4 w-4 rounded border-line text-green-600"
            />
            Link task to calendar
          </label>
        </div>

        {activeSection === "calendar" && (
          <div className="mt-5 space-y-3">
            {tasks.map((task) => {
              const isExpanded = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className={clsx(
                    "glass-card overflow-hidden rounded-3xl transition-all duration-200",
                    isExpanded ? "ring-2 ring-green-300 shadow-soft" : "hover:-translate-y-0.5"
                  )}
                >
                  {/* Clickable header row */}
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <div
                      className={clsx(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
                        task.completed
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={clsx("text-sm font-semibold", task.completed ? "text-[#8FA098] line-through" : "text-ink")}>
                        {task.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8FA098]">
                        <span>{formatDistanceToNow(parseISO(task.deadline), { addSuffix: true })}</span>
                        <span className={PRIORITY_META[task.priority].tone}>{PRIORITY_META[task.priority].label}</span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded ? (
                    <div className="border-t border-line bg-slate-50/50 px-4 py-3 animate-rise">
                      <div className="space-y-2">
                        {task.details ? (
                          <div className="text-sm leading-6 text-[#B7C2B8]">{task.details}</div>
                        ) : (
                          <div className="text-sm italic text-[#8FA098]">No additional details.</div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8FA098]">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            Deadline: {format(parseISO(task.deadline), "dd MMM yyyy, HH:mm")}
                          </span>
                          {task.linkedEventId ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Linked to calendar
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onToggleTask(task); }}
                          className={clsx(
                            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                            task.completed
                              ? "bg-slate-100 text-[#B7C2B8] hover:bg-slate-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {task.completed ? "Mark active" : "Mark done"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#8FA098] transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="reminders-section" className="glass-panel section-anchor rounded-[30px] p-5">
        <div className="mb-4 flex items-center gap-2">
          <BellRing className="h-5 w-5 text-green-600" />
          <div>
            <h2 className="text-lg font-bold text-ink">Notifications</h2>
            <p className="mt-1 text-sm text-[#8FA098]">
              Alertes professionnelles du planning, avec statut d'envoi et canal de diffusion.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="glass-card rounded-3xl border border-dashed border-line px-4 py-5 text-sm text-[#8FA098]">
              Aucune notification planifiee pour le moment.
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className="glass-card rounded-3xl px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">{notification.title}</div>
                    <div className="mt-1 text-xs leading-5 text-[#8FA098]">{notification.body}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-[#B7C2B8]">
                    {notification.channel === "email" ? <Mail className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
                    {notification.channel === "email" ? "Email" : "Site"}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#8FA098]">
                    {format(parseISO(notification.scheduledFor), "dd MMM yyyy - HH:mm")}
                  </span>
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 font-semibold",
                      notification.status === "sent" && "bg-emerald-50 text-emerald-700",
                      notification.status === "pending" && "bg-amber-50 text-amber-700",
                      notification.status === "failed" && "bg-rose-50 text-rose-700"
                    )}
                  >
                    {notification.status === "sent"
                      ? "Envoyee"
                      : notification.status === "pending"
                        ? "En attente"
                        : "Echec"}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-[#8FA098]">
                  {formatDistanceToNow(parseISO(notification.scheduledFor), { addSuffix: true })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
