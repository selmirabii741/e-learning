"use client";

import { addDays, addMinutes, format, isSameDay, parseISO, set as setTime } from "date-fns";
import { create } from "zustand";

export type PlannerEventType = "course" | "task" | "exam" | "personal";
export type PlannerPriority = "high" | "medium" | "low";
export type PlannerTab = "all" | "today" | "upcoming" | "completed";

export interface PlannerEvent {
  id: string;
  title: string;
  type: PlannerEventType;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface PlannerTask {
  id: string;
  title: string;
  deadline: string; // ISO
  priority: PlannerPriority;
  completed: boolean;
  linkedEventId: string | null;
}

interface PlannerState {
  anchorDate: Date;
  events: PlannerEvent[];
  tasks: PlannerTask[];
  selectedEventId: string | null;
  activeTab: PlannerTab;
  currentTime: Date;
  setAnchorDate: (date: Date) => void;
  shiftWeek: (direction: "prev" | "next") => void;
  goToToday: () => void;
  setCurrentTime: (date: Date) => void;
  setSelectedEventId: (id: string | null) => void;
  setActiveTab: (tab: PlannerTab) => void;
  addTask: (input: Pick<PlannerTask, "title" | "deadline" | "priority">) => void;
  toggleTask: (taskId: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  deleteTask: (taskId: string) => void;
  addTaskToCalendar: (taskId: string) => void;
  upsertEvent: (event: PlannerEvent) => void;
  deleteEvent: (eventId: string) => void;
  moveEvent: (eventId: string, nextDate: string, nextStartTime: string) => void;
}

const today = new Date();
const thisWeekMonday = setTime(today, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
const mondayDate = addDays(thisWeekMonday, 1 - (thisWeekMonday.getDay() || 7));

const defaultEvents: PlannerEvent[] = [
  { id: "ev-1", title: "Math", type: "course", date: format(addDays(mondayDate, 0), "yyyy-MM-dd"), startTime: "08:30", endTime: "10:00" },
  { id: "ev-2", title: "Project Work", type: "task", date: format(addDays(mondayDate, 0), "yyyy-MM-dd"), startTime: "13:00", endTime: "15:00" },
  { id: "ev-3", title: "Physics", type: "course", date: format(addDays(mondayDate, 1), "yyyy-MM-dd"), startTime: "10:00", endTime: "11:30" },
  { id: "ev-4", title: "Algorithms", type: "course", date: format(addDays(mondayDate, 2), "yyyy-MM-dd"), startTime: "09:00", endTime: "10:30" },
  { id: "ev-5", title: "Database", type: "course", date: format(addDays(mondayDate, 3), "yyyy-MM-dd"), startTime: "09:00", endTime: "10:30" },
  { id: "ev-6", title: "Physics Exam", type: "exam", date: format(addDays(mondayDate, 5), "yyyy-MM-dd"), startTime: "09:00", endTime: "12:00" },
  { id: "ev-7", title: "Practice Problems", type: "personal", date: format(addDays(mondayDate, 2), "yyyy-MM-dd"), startTime: "16:00", endTime: "17:00" }
];

const defaultTasks: PlannerTask[] = [
  { id: "tk-1", title: "Complete Math Assignment", deadline: addHoursIso(today, 5), priority: "high", completed: false, linkedEventId: null },
  { id: "tk-2", title: "Read Chapter 6", deadline: addHoursIso(today, 8), priority: "medium", completed: false, linkedEventId: null },
  { id: "tk-3", title: "Review Database Notes", deadline: addHoursIso(addDays(today, 1), 2), priority: "low", completed: false, linkedEventId: null },
  { id: "tk-4", title: "Submit Lab Report", deadline: addHoursIso(addDays(today, 2), 6), priority: "medium", completed: true, linkedEventId: null }
];

function addHoursIso(base: Date, hours: number) {
  return addMinutes(base, hours * 60).toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function addMinutesToTime(value: string, minutesToAdd: number) {
  const [hours, mins] = value.split(":").map(Number);
  const total = Math.max(0, Math.min(23 * 60 + 59, hours * 60 + mins + minutesToAdd));
  const nextHours = String(Math.floor(total / 60)).padStart(2, "0");
  const nextMinutes = String(total % 60).padStart(2, "0");
  return `${nextHours}:${nextMinutes}`;
}

function diffMinutes(start: string, end: string) {
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  return Math.max(30, eH * 60 + eM - (sH * 60 + sM));
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  anchorDate: mondayDate,
  events: defaultEvents,
  tasks: defaultTasks,
  selectedEventId: null,
  activeTab: "all",
  currentTime: new Date(),
  setAnchorDate: (date) => set({ anchorDate: date }),
  shiftWeek: (direction) =>
    set((state) => ({ anchorDate: addDays(state.anchorDate, direction === "next" ? 7 : -7) })),
  goToToday: () => set({ anchorDate: mondayDate }),
  setCurrentTime: (date) => set({ currentTime: date }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addTask: (input) =>
    set((state) => ({
      tasks: [
        {
          id: createId("tk"),
          title: input.title,
          deadline: input.deadline,
          priority: input.priority,
          completed: false,
          linkedEventId: null
        },
        ...state.tasks
      ]
    })),
  toggleTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    })),
  reorderTasks: (activeId, overId) =>
    set((state) => {
      const from = state.tasks.findIndex((task) => task.id === activeId);
      const to = state.tasks.findIndex((task) => task.id === overId);
      if (from < 0 || to < 0 || from === to) {
        return state;
      }
      const next = [...state.tasks];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { tasks: next };
    }),
  deleteTask: (taskId) =>
    set((state) => {
      const linkedEventId = state.tasks.find((task) => task.id === taskId)?.linkedEventId;
      return {
        tasks: state.tasks.filter((task) => task.id !== taskId),
        events: linkedEventId ? state.events.filter((event) => event.id !== linkedEventId) : state.events
      };
    }),
  addTaskToCalendar: (taskId) =>
    set((state) => {
      const task = state.tasks.find((entry) => entry.id === taskId);
      if (!task || task.linkedEventId) {
        return state;
      }
      const deadline = parseISO(task.deadline);
      const date = format(deadline, "yyyy-MM-dd");
      const startTime = format(setTime(deadline, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }), "HH:mm");
      const eventId = createId("ev");
      const newEvent: PlannerEvent = {
        id: eventId,
        title: task.title,
        type: "task",
        date,
        startTime,
        endTime: addMinutesToTime(startTime, 60)
      };
      return {
        events: [...state.events, newEvent],
        tasks: state.tasks.map((entry) => (entry.id === taskId ? { ...entry, linkedEventId: eventId } : entry))
      };
    }),
  upsertEvent: (event) =>
    set((state) => {
      const exists = state.events.some((entry) => entry.id === event.id);
      return {
        events: exists ? state.events.map((entry) => (entry.id === event.id ? event : entry)) : [...state.events, event]
      };
    }),
  deleteEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
      tasks: state.tasks.map((task) => (task.linkedEventId === eventId ? { ...task, linkedEventId: null } : task)),
      selectedEventId: state.selectedEventId === eventId ? null : state.selectedEventId
    })),
  moveEvent: (eventId, nextDate, nextStartTime) =>
    set((state) => ({
      events: state.events.map((event) => {
        if (event.id !== eventId) {
          return event;
        }
        const duration = diffMinutes(event.startTime, event.endTime);
        const clampedStart = nextStartTime < "08:00" ? "08:00" : nextStartTime > "21:00" ? "21:00" : nextStartTime;
        return {
          ...event,
          date: nextDate,
          startTime: clampedStart,
          endTime: addMinutesToTime(clampedStart, duration)
        };
      })
    }))
}));

export function getWeekDays(anchorDate: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(anchorDate, index));
}

export function isEventNear(event: PlannerEvent, now: Date, thresholdMinutes = 10) {
  const eventStart = parseISO(`${event.date}T${event.startTime}:00`);
  const diff = Math.floor((eventStart.getTime() - now.getTime()) / 60000);
  return diff >= 0 && diff <= thresholdMinutes;
}

export function isTaskForTab(task: PlannerTask, tab: PlannerTab, now: Date) {
  const deadline = parseISO(task.deadline);
  if (tab === "all") return true;
  if (tab === "completed") return task.completed;
  if (tab === "today") return !task.completed && isSameDay(deadline, now);
  return !task.completed && deadline > now;
}
