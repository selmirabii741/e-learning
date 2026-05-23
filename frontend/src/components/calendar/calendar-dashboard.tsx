"use client";

import Sidebar from '@/components/layout/Sidebar';
import { format, parseISO, startOfToday } from "date-fns";
import { startTransition, useEffect, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Filter,
  ListTodo,
  Mail,
  Plus,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { EVENT_TYPE_META, PRIORITY_META } from "@/lib/calendar/constants";
import { EduSidebar } from "@/components/calendar/edu-sidebar";
import { RightRail } from "@/components/calendar/right-rail";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import type {
  AutoScheduleSuggestion,
  CalendarEventRecord,
  CalendarOverview,
  EventType,
  TaskRecord
} from "@/lib/calendar/types";
import { getWeekDays, splitIsoToForm, startOfCalendarWeek } from "@/lib/calendar/utils";
import { useCalendarStore, createEmptyEventDraft, createEmptyTaskDraft } from "@/lib/calendar/store";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";

type ActiveFilter = "all" | EventType;
type SidebarSection = "calendar" | "todo" | "reminders";


async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function CalendarDashboard() {
  useSmartNotifications();
  const {
    overview, setOverview,
    filter, setFilter,
    search, setSearch,
    eventDraft, setEventDraft, updateEventDraft,
    taskDraft, setTaskDraft, updateTaskDraft,
    selectedEvent, setSelectedEvent,
    selectedTaskId, setSelectedTaskId,
    resetEventForm
  } = useCalendarStore();

  const [anchorDate, setAnchorDate] = useState(startOfCalendarWeek(startOfToday()));
  const [activeSection, setActiveSection] = useState<SidebarSection>("calendar");
  const [aiSuggestions, setAiSuggestions] = useState<AutoScheduleSuggestion[]>([]);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    void loadOverview();
  }, []);

  async function loadOverview() {
    const response = await fetch("/api/calendar/overview");
    const data = (await response.json()) as CalendarOverview;
    setOverview(data);
  }

  function navigateToSection(section: SidebarSection) {
    setActiveSection(section);
    if (section === "todo") {
      setFilter("task");
    } else if (section === "calendar") {
      setFilter("all");
    }
    const targetId =
      section === "calendar" ? "calendar-section" : section === "todo" ? "todo-section" : "reminders-section";
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function populateEventForm(event: CalendarEventRecord) {
    const start = splitIsoToForm(event.startAt);
    const end = splitIsoToForm(event.endAt);
    setSelectedEvent(event);
    setEventDraft({
      title: event.title,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      type: event.type,
      color: event.color,
      description: event.description ?? "",
      location: event.location ?? "",
      reminderMinutes: event.reminderMinutes
    });
    const linkedTask = overview?.tasks.find((task) => task.linkedEventId === event.id) ?? null;
    setSelectedTaskId(linkedTask?.id ?? null);
    if (event.type === "task") {
      navigateToSection("todo");
      if (linkedTask) {
        toast.success(`Task "${linkedTask.title}" is highlighted in your to-do list.`);
      }
    } else {
      setActiveSection("calendar");
      // Scroll to the event form so user sees details
      document.getElementById("event-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function saveEvent() {
    if (!eventDraft.title.trim()) {
      toast.error("Event title is required.");
      return;
    }

    if (eventDraft.endTime <= eventDraft.startTime) {
      toast.error("End time must be after start time.");
      return;
    }

    const wasEditing = Boolean(selectedEvent);
    setIsSavingEvent(true);
    const endpoint = selectedEvent ? `/api/events/${selectedEvent.id}` : "/api/events";
    const method = selectedEvent ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventDraft)
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        await loadOverview();
        return;
      }

      resetEventForm();
      await loadOverview();
      toast.success(wasEditing ? "Event updated successfully." : "Event added successfully.");
    } catch {
      toast.error("Unable to save the event right now.");
    } finally {
      setIsSavingEvent(false);
    }
  }

  async function removeEvent(id: string) {
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        await loadOverview();
        return;
      }

      if (selectedEvent?.id === id) {
        resetEventForm();
      }
      await loadOverview();
      toast.success("Event deleted successfully.");
    } catch {
      toast.error("Unable to delete the event right now.");
    }
  }

  async function moveEvent(id: string, targetDate: Date) {
    const event = overview?.events.find((entry) => entry.id === id);
    if (!event) {
      return;
    }

    const start = splitIsoToForm(event.startAt);
    const end = splitIsoToForm(event.endAt);

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(targetDate, "yyyy-MM-dd"),
          startTime: start.time,
          endTime: end.time
        })
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        await loadOverview();
        return;
      }

      await loadOverview();
    } catch {
      toast.error("Unable to move the event right now.");
    }
  }

  async function saveTask() {
    if (!taskDraft.title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    if (!taskDraft.date || !taskDraft.startTime || !taskDraft.endTime) {
      toast.error("Task date and time range are required.");
      return;
    }

    if (taskDraft.endTime <= taskDraft.startTime) {
      toast.error("End time must be after start time.");
      return;
    }

    setIsSavingTask(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskDraft)
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        await loadOverview();
        return;
      }

      setTaskDraft(createEmptyTaskDraft());
      await loadOverview();
      setSelectedTaskId(null);
      toast.success(
        taskDraft.linkToCalendar
          ? "Task added and linked to the calendar."
          : "Task added successfully."
      );
      navigateToSection("todo");
    } catch {
      toast.error("Unable to save the task right now.");
    } finally {
      setIsSavingTask(false);
    }
  }

  function selectTask(task: TaskRecord) {
    // Toggle: if already selected, deselect; otherwise select this task
    setSelectedTaskId(selectedTaskId === task.id ? null : task.id);
  }

  async function toggleTask(task: TaskRecord) {
    setSelectedTaskId(task.id);
    startTransition(() => {
      if (overview) {
        setOverview({
          ...overview,
          tasks: overview.tasks.map((item) =>
            item.id === task.id ? { ...item, completed: !item.completed } : item
          )
        });
      }
    });

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed })
      });

      if (!response.ok) {
        await loadOverview();
        toast.error(await readErrorMessage(response));
        return;
      }

      await loadOverview();
      toast.success(!task.completed ? "Task marked as done." : "Task marked as active again.");
      navigateToSection("todo");
    } catch {
      await loadOverview();
      toast.error("Unable to update the task right now.");
    }
  }

  async function removeTask(id: string) {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        await loadOverview();
        return;
      }
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
      }
      await loadOverview();
      toast.success("Task deleted successfully.");
    } catch {
      toast.error("Unable to delete the task right now.");
    }
  }

  async function sendTaskEmail(taskId: string, taskTitle: string) {
    try {
      const response = await fetch(`/api/tasks/${taskId}/notify`, { method: "POST" });
      const data = await response.json() as { delivered: boolean; to?: string; preview?: unknown };
      if (data.delivered) {
        toast.success(`📧 Email envoyé pour "${taskTitle}"`, {
          description: `Envoyé à ${data.to}`,
          duration: 7000
        });
      } else {
        toast.info(`📧 Email simulé (SMTP non configuré)`, {
          description: "Configurez SMTP_PASS dans .env.local pour un envoi réel.",
          duration: 7000
        });
      }
    } catch {
      toast.error("Impossible d'envoyer l'email.");
    }
  }

  async function fetchAiSuggestions() {
    setIsLoadingAi(true);

    try {
      const response = await fetch("/api/ai/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventDraft.title || taskDraft.title || "Focused study block" })
      });

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        await loadOverview();
        return;
      }

      const data = (await response.json()) as AutoScheduleSuggestion[];
      setAiSuggestions(data);
      toast.success("AI suggestions are ready.");
    } catch {
      toast.error("Unable to fetch AI suggestions right now.");
    } finally {
      setIsLoadingAi(false);
    }
  }

  function applySuggestion(index: number) {
    const suggestion = aiSuggestions[index];
    if (!suggestion) {
      return;
    }

    setEventDraft({
      ...eventDraft,
      title: eventDraft.title || "AI scheduled session",
      date: suggestion.recommendedDate,
      startTime: suggestion.startTime,
      endTime: suggestion.endTime,
      type: eventDraft.type || "task"
    });
    toast.success("Suggestion applied to the event form.");
  }

  const allEvents = overview?.events ?? [];
  const visibleEvents = allEvents.filter((event) => {
    const matchesFilter = filter === "all" || event.type === filter;
    const haystack = `${event.title} ${event.description ?? ""} ${event.location ?? ""}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingEvents = [...visibleEvents]
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3);
  const openTaskCount = (overview?.tasks ?? []).filter((task) => !task.completed).length;
  const linkedTaskCount = (overview?.tasks ?? []).filter((task) => task.linkedEventId).length;
  const nextReminder = overview?.notifications?.[0] ?? null;
  const allTasks = overview?.tasks ?? [];

  const days = getWeekDays(anchorDate);

  return (
    <Sidebar>
      <div className="min-h-screen p-4 xl:p-6">
        <div className="mx-auto grid max-w-[1400px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

          <main className="space-y-6">
            <section
              id="calendar-section"
              className="glass-panel section-anchor rounded-[32px] px-5 py-5 xl:px-7"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-700 shadow-soft">
                    <Sparkles className="h-3.5 w-3.5" />
                    Planner workspace
                  </div>
                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink xl:text-4xl">Calendar</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8FA098] xl:text-[15px]">
                    One place for courses, study tasks, exams, deadlines, and automated reminders.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <label className="field-shell flex h-12 items-center gap-3 rounded-2xl px-4 shadow-soft">
                    <Search className="h-4 w-4 text-[#8FA098]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search events"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={resetEventForm}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add event
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="glass-card rounded-[26px] px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FA098]">This week</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{visibleEvents.length}</div>
                  <p className="mt-1 text-sm text-[#8FA098]">Visible events in the current view.</p>
                </div>
                <div className="glass-card rounded-[26px] px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FA098]">Open tasks</div>
                  <div className="mt-2 text-2xl font-bold text-ink">{openTaskCount}</div>
                  <p className="mt-1 text-sm text-[#8FA098]">{linkedTaskCount} task{linkedTaskCount === 1 ? "" : "s"} linked to calendar.</p>
                </div>
                <div className="glass-card rounded-[26px] px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8FA098]">Next reminder</div>
                  <div className="mt-2 text-base font-bold text-ink">{nextReminder?.title ?? "No reminder queued"}</div>
                  <p className="mt-1 text-sm text-[#8FA098]">
                    {nextReminder ? format(parseISO(nextReminder.scheduledFor), "dd MMM - HH:mm") : "Everything is clear for now."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(["all", "course", "task", "exam", "deadline"] as ActiveFilter[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={clsx(
                        "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                        filter === item
                          ? "border-green-100 bg-green-50 text-green-700 shadow-soft"
                          : "border-white/80 bg-white/85 text-[#8FA098] hover:border-line hover:text-ink"
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      <span>{item === "all" ? "All events" : EVENT_TYPE_META[item].label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAnchorDate((current) => new Date(current.getTime() - 7 * 86400000))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white/90 text-[#8FA098] transition hover:-translate-y-0.5 hover:text-ink"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchorDate(startOfCalendarWeek(new Date()))}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-line bg-white/90 px-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchorDate((current) => new Date(current.getTime() + 7 * 86400000))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white/90 text-[#8FA098] transition hover:-translate-y-0.5 hover:text-ink"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            {activeSection === "todo" ? (
              /* ─── Task List View ─── */
              <section id="todo-section" className="glass-panel section-anchor rounded-[30px] p-5 xl:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                      <ListTodo className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-ink">All tasks</h2>
                      <p className="text-sm text-[#8FA098]">
                        {allTasks.length} task{allTasks.length !== 1 ? "s" : ""} · {allTasks.filter((t) => t.completed).length} completed
                      </p>
                    </div>
                  </div>
                </div>

                {allTasks.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[#8FA098]">No tasks yet. Add one from the right panel.</div>
                ) : (
                  <div className="space-y-3">
                    {allTasks.map((task) => {
                      const isExpanded = selectedTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className={clsx(
                            "glass-card overflow-hidden rounded-2xl transition-all duration-200",
                            isExpanded ? "ring-2 ring-green-300 shadow-soft" : "hover:-translate-y-0.5"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectTask(task)}
                            className="flex w-full items-center gap-4 px-5 py-4 text-left"
                          >
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleTask(task); }}
                              className={clsx(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition cursor-pointer",
                                task.completed
                                  ? "border-green-600 bg-green-600 text-white"
                                  : "border-slate-300 bg-white text-transparent hover:border-green-400"
                              )}
                            >
                              <Check className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={clsx("text-sm font-semibold", task.completed ? "text-[#8FA098] line-through" : "text-ink")}>
                                {task.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#8FA098]">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {format(parseISO(task.startAt), "dd MMM yyyy, HH:mm")} – {format(parseISO(task.endAt), "HH:mm")}
                                </span>
                                <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", PRIORITY_META[task.priority].tone)}>
                                  {PRIORITY_META[task.priority].label}
                                </span>
                                {task.linkedEventId ? (
                                  <span className="inline-flex items-center gap-1 text-green-700">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Linked
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <Trash2
                              className="h-4 w-4 shrink-0 text-slate-300 transition hover:text-rose-500 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                            />
                          </button>

                          {isExpanded ? (
                            <div className="border-t border-line bg-slate-50/50 px-5 py-4 animate-rise">
                              {task.details ? (
                                <p className="text-sm leading-6 text-[#B7C2B8]">{task.details}</p>
                              ) : (
                                <p className="text-sm italic text-[#8FA098]">Aucun détail supplémentaire.</p>
                              )}
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleTask(task)}
                                  className={clsx(
                                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                                    task.completed
                                      ? "bg-slate-100 text-[#B7C2B8] hover:bg-slate-200"
                                      : "bg-green-50 text-green-700 hover:bg-green-100"
                                  )}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {task.completed ? "Marquer actif" : "Marquer terminé"}
                                </button>

                                {/* ── Email reminder button ── */}
                                <button
                                  type="button"
                                  onClick={() => sendTaskEmail(task.id, task.title)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  Envoyer email
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeTask(task.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#8FA098] transition hover:bg-rose-50 hover:text-rose-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Supprimer
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
            ) : (
              /* ─── Calendar View ─── */
              <>
                <WeekCalendar
                  anchorDate={anchorDate}
                  events={visibleEvents}
                  tasks={allTasks}
                  activeFilter={filter}
                  selectedEventId={selectedEvent?.id ?? null}
                  onSelectEvent={populateEventForm}
                  onDeleteEvent={removeEvent}
                  onMoveEvent={moveEvent}
                />

                <section className="glass-panel rounded-[30px] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-ink">Upcoming focus points</h2>
                      <p className="mt-1 text-sm text-[#8FA098]">
                        Important events that deserve attention this week.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-[#8FA098]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(days[0], "MMM d")} - {format(days[6], "MMM d")}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {upcomingEvents.map((event) => (
                      <button
                        type="button"
                        key={event.id}
                        onClick={() => populateEventForm(event)}
                        className="glass-card animate-rise rounded-[24px] p-5 text-left transition hover:-translate-y-1"
                      >
                        <div
                          className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: `${event.color}22`, color: event.color }}
                        >
                          {EVENT_TYPE_META[event.type].label}
                        </div>
                        <div className="mt-4 text-base font-bold text-ink">{event.title}</div>
                        <div className="mt-2 text-sm text-[#8FA098]">
                          {format(parseISO(event.startAt), "dd MMM yyyy - HH:mm")}
                        </div>
                        <div className="mt-4 text-sm leading-6 text-[#8FA098]">
                          {event.description ?? "No description yet."}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </main>

          <RightRail
            activeSection={activeSection}
            eventDraft={eventDraft}
            taskDraft={taskDraft}
            selectedEvent={selectedEvent}
            selectedTaskId={selectedTaskId}
            tasks={overview?.tasks ?? []}
            notifications={overview?.notifications ?? []}
            aiSuggestions={aiSuggestions}
            isSavingEvent={isSavingEvent}
            isSavingTask={isSavingTask}
            isLoadingAi={isLoadingAi}
            onEventDraftChange={updateEventDraft}
            onTaskDraftChange={updateTaskDraft}
            onSubmitEvent={saveEvent}
            onDeleteSelected={() => (selectedEvent ? removeEvent(selectedEvent.id) : undefined)}
            onResetEventForm={resetEventForm}
            onSubmitTask={saveTask}
            onSelectTask={selectTask}
            onToggleTask={toggleTask}
            onDeleteTask={removeTask}
            onFetchAiSuggestions={fetchAiSuggestions}
            onApplySuggestion={applySuggestion}
          />
        </div>
      </div>
    </Sidebar>
  );
}
