import { create } from 'zustand';
import { format } from 'date-fns';
import type { 
  CalendarEventRecord, 
  TaskRecord, 
  NotificationRecord, 
  CalendarOverview,
  EventType,
  EventInput,
  TaskInput
} from '@/lib/calendar/types';

type ActiveFilter = "all" | EventType;

interface EventDraft extends EventInput {
  reminderMinutes: number;
}

interface TaskDraft extends TaskInput {
  linkToCalendar: boolean;
}

export function createEmptyEventDraft(): EventDraft {
  return {
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "10:00",
    endTime: "11:00",
    type: "course",
    color: "#75C46B",
    description: "",
    location: "",
    reminderMinutes: 60
  };
}

export function createEmptyTaskDraft(): TaskDraft {
  return {
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "17:00",
    endTime: "18:00",
    priority: "medium",
    details: "",
    linkToCalendar: false
  };
}

interface CalendarState {
  overview: CalendarOverview | null;
  filter: ActiveFilter;
  search: string;
  eventDraft: EventDraft;
  taskDraft: TaskDraft;
  selectedEvent: CalendarEventRecord | null;
  selectedTaskId: string | null;
  
  setOverview: (overview: CalendarOverview) => void;
  setFilter: (filter: ActiveFilter) => void;
  setSearch: (search: string) => void;
  updateEventDraft: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  updateTaskDraft: <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => void;
  setEventDraft: (draft: EventDraft) => void;
  setTaskDraft: (draft: TaskDraft) => void;
  setSelectedEvent: (event: CalendarEventRecord | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  resetEventForm: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  overview: null,
  filter: "all",
  search: "",
  eventDraft: createEmptyEventDraft(),
  taskDraft: createEmptyTaskDraft(),
  selectedEvent: null,
  selectedTaskId: null,

  setOverview: (overview) => set({ overview }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  
  updateEventDraft: (key, value) => set((state) => ({ 
    eventDraft: { ...state.eventDraft, [key]: value } 
  })),
  
  updateTaskDraft: (key, value) => set((state) => ({ 
    taskDraft: { ...state.taskDraft, [key]: value } 
  })),

  setEventDraft: (draft) => set({ eventDraft: draft }),
  setTaskDraft: (draft) => set({ taskDraft: draft }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  
  resetEventForm: () => set({ 
    eventDraft: createEmptyEventDraft(),
    selectedEvent: null
  })
}));
