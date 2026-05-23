export type EventType = "course" | "task" | "exam" | "deadline";
export type TaskPriority = "low" | "medium" | "high";
export type NotificationChannel = "email" | "in_app";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  timezone: string;
  createdAt: string;
}

export interface CalendarEventRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: EventType;
  color: string;
  startAt: string;
  endAt: string;
  location: string | null;
  reminderMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  details: string | null;
  deadline: string;
  startAt: string;
  endAt: string;
  priority: TaskPriority;
  completed: boolean;
  linkedEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  eventId: string | null;
  taskId: string | null;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledFor: string;
  sentAt: string | null;
  createdAt: string;
}

export interface EventInput {
  title: string;
  description?: string;
  type: EventType;
  color: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  reminderMinutes?: number;
}

export interface EventUpdateInput extends Partial<EventInput> {}

export interface TaskInput {
  title: string;
  details?: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  linkToCalendar?: boolean;
}

export interface TaskUpdateInput extends Partial<TaskInput> {
  completed?: boolean;
  linkedEventId?: string | null;
}

export interface CalendarOverview {
  user: UserRecord;
  events: CalendarEventRecord[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
}

export interface ReminderCandidate {
  user: UserRecord;
  event?: CalendarEventRecord;
  task?: TaskRecord;
  title: string;
  body: string;
  scheduledFor: string;
}

export interface AutoScheduleSuggestion {
  title: string;
  recommendedDate: string;
  startTime: string;
  endTime: string;
  rationale: string;
}
