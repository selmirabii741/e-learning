import { parseISO } from "date-fns";
import { connectToDatabase } from "@/lib/calendar/mongodb";
import { EventModel } from "@/lib/calendar/models/Event";
import { NotificationModel } from "@/lib/calendar/models/Notification";
import { TaskModel } from "@/lib/calendar/models/Task";
import { UserModel } from "@/lib/calendar/models/User";
import type {
  CalendarEventRecord,
  CalendarOverview,
  EventInput,
  EventUpdateInput,
  NotificationRecord,
  TaskInput,
  TaskRecord,
  TaskUpdateInput,
  UserRecord
} from "@/lib/calendar/types";
import { buildTaskLinkedEvent, combineDateTime, createId, findConflictingTask } from "@/lib/calendar/utils";

const DEMO_USER_ID = "user_demo_01";

function toPlainRecord<T extends { _id?: unknown; __v?: unknown }>(value: T): Omit<T, "_id" | "__v"> {
  const { _id, __v, ...rest } = value;
  void _id;
  void __v;
  return rest;
}

export class CalendarConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarConflictError";
  }
}

function normalizeEventPayload(input: EventInput, existing?: CalendarEventRecord): CalendarEventRecord {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId("evt"),
    userId: existing?.userId ?? DEMO_USER_ID,
    title: input.title,
    description: input.description ?? null,
    type: input.type,
    color: input.color,
    startAt: combineDateTime(input.date, input.startTime),
    endAt: combineDateTime(input.date, input.endTime),
    location: input.location ?? null,
    reminderMinutes: input.reminderMinutes ?? 60,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function normalizeTaskPayload(input: TaskInput, existing?: TaskRecord): TaskRecord {
  const now = new Date().toISOString();
  const startAt = combineDateTime(input.date, input.startTime);
  const endAt = combineDateTime(input.date, input.endTime);
  return {
    id: existing?.id ?? createId("tsk"),
    userId: existing?.userId ?? DEMO_USER_ID,
    title: input.title,
    details: input.details ?? null,
    deadline: endAt,
    startAt,
    endAt,
    priority: input.priority,
    completed: existing?.completed ?? false,
    linkedEventId: existing?.linkedEventId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function eventsOverlap(firstStartAt: string, firstEndAt: string, secondStartAt: string, secondEndAt: string) {
  return parseISO(firstStartAt) < parseISO(secondEndAt) && parseISO(secondStartAt) < parseISO(firstEndAt);
}

/**
 * Query MongoDB directly for overlapping tasks — much faster than loading
 * all tasks into memory when there are hundreds of records.
 * Uses the compound index (userId, startAt, endAt).
 *
 * Overlap condition:  existingStart < candidateEnd  AND  candidateStart < existingEnd
 * Touching edges (e.g. 10:00–11:00 vs 11:00–12:00) are NOT treated as conflicts.
 */
async function findOverlappingTaskInDb(
  userId: string,
  startAt: string,
  endAt: string,
  excludeTaskId?: string
): Promise<{ id: string; title: string; startAt: string; endAt: string } | null> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {
    userId,
    // overlap: existing.startAt < candidateEnd AND existing.endAt > candidateStart
    startAt: { $lt: endAt },
    endAt: { $gt: startAt }
  };

  if (excludeTaskId) {
    filter.id = { $ne: excludeTaskId };
  }

  const conflict = await TaskModel.findOne(filter as any, { id: 1, title: 1, startAt: 1, endAt: 1 }).lean();
  if (!conflict) return null;

  return conflict as { id: string; title: string; startAt: string; endAt: string };
}

async function ensureTaskCalendarSlotAvailable(task: TaskRecord, userId: string) {
  const candidateEvent = buildTaskLinkedEvent(task);
  const candidateStartAt = combineDateTime(candidateEvent.date, candidateEvent.startTime);
  const candidateEndAt = combineDateTime(candidateEvent.date, candidateEvent.endTime);
  const existingTaskEvents = (await listEvents(userId)).filter((event) => event.type === "task");
  const conflictingEvent = existingTaskEvents.find((event) =>
    eventsOverlap(candidateStartAt, candidateEndAt, event.startAt, event.endAt)
  );

  if (conflictingEvent) {
    throw new CalendarConflictError(
      "A task already exists in that calendar slot. Change the deadline or disable calendar linking."
    );
  }

  return candidateEvent;
}

async function ensureDemoUser(userId: string): Promise<UserRecord> {
  const created: UserRecord = {
    id: userId,
    email: process.env.DEFAULT_CALENDAR_USER_EMAIL ?? "rabieselmi741@gmail.com",
    fullName: "Oussama BR",
    timezone: "Africa/Lagos",
    createdAt: new Date().toISOString()
  };
  const user = await UserModel.findOneAndUpdate(
    { id: userId } as any,
    {
      $setOnInsert: created
    },
    { upsert: true, returnDocument: "after" }
  ).lean();
  return toPlainRecord(user as UserRecord & { _id?: unknown; __v?: unknown });
}

export async function getOverview(userId = DEMO_USER_ID): Promise<CalendarOverview> {
  await connectToDatabase();
  const user = await ensureDemoUser(userId);
  const [events, tasks, notifications] = await Promise.all([
    EventModel.find({ userId } as any).sort({ startAt: 1 }).lean(),
    TaskModel.find({ userId } as any).sort({ deadline: 1 }).lean(),
    NotificationModel.find({ userId } as any).sort({ scheduledFor: 1 }).lean()
  ]);
  return {
    user,
    events: events.map((event) => toPlainRecord(event as CalendarEventRecord & { _id?: unknown; __v?: unknown })),
    tasks: tasks.map((task) => toPlainRecord(task as TaskRecord & { _id?: unknown; __v?: unknown })),
    notifications: notifications.map((notification) =>
      toPlainRecord(notification as NotificationRecord & { _id?: unknown; __v?: unknown })
    )
  };
}

export async function listEvents(userId = DEMO_USER_ID) {
  return (await getOverview(userId)).events;
}

export async function createEvent(input: EventInput, userId = DEMO_USER_ID) {
  await connectToDatabase();
  await ensureDemoUser(userId);
  const event = normalizeEventPayload(input);
  await EventModel.create(event);
  return event;
}

export async function updateEvent(id: string, updates: EventUpdateInput, userId = DEMO_USER_ID) {
  const current = (await listEvents(userId)).find((event) => event.id === id);
  if (!current) {
    return null;
  }

  const nextEvent = normalizeEventPayload(
    {
      title: updates.title ?? current.title,
      description: updates.description ?? current.description ?? "",
      type: updates.type ?? current.type,
      color: updates.color ?? current.color,
      date: updates.date ?? current.startAt.slice(0, 10),
      startTime: updates.startTime ?? current.startAt.slice(11, 16),
      endTime: updates.endTime ?? current.endAt.slice(11, 16),
      location: updates.location ?? current.location ?? "",
      reminderMinutes: updates.reminderMinutes ?? current.reminderMinutes
    },
    current
  );

  await connectToDatabase();
  await EventModel.updateOne({ id, userId }, nextEvent);
  return nextEvent;
}

export async function deleteEvent(id: string, userId = DEMO_USER_ID) {
  await connectToDatabase();
  await EventModel.deleteOne({ id, userId });
  await NotificationModel.deleteMany({ userId, eventId: id });
  await TaskModel.updateMany(
    { userId, linkedEventId: id },
    { $set: { linkedEventId: null, updatedAt: new Date().toISOString() } }
  );
  return true;
}

export async function listTasks(userId = DEMO_USER_ID) {
  return (await getOverview(userId)).tasks;
}

export async function createTask(input: TaskInput, userId = DEMO_USER_ID) {
  await connectToDatabase();
  await ensureDemoUser(userId);
  const baseTask = normalizeTaskPayload(input);

  // ── Time-slot conflict check (database-level for performance) ─
  const conflict = await findOverlappingTaskInDb(userId, baseTask.startAt, baseTask.endAt);
  if (conflict) {
    throw new CalendarConflictError(
      `Time slot already occupied by "${conflict.title}"`
    );
  }

  let eventId: string | null = null;

  if (input.linkToCalendar) {
    const linkedEvent = await ensureTaskCalendarSlotAvailable(baseTask, userId);
    const linked = await createEvent(linkedEvent, userId);
    eventId = linked.id;
  }

  const task = {
    ...baseTask,
    linkedEventId: eventId
  };
  await TaskModel.create(task);
  return task;
}

export async function updateTask(id: string, updates: TaskUpdateInput, userId = DEMO_USER_ID) {
  const current = (await listTasks(userId)).find((task) => task.id === id);
  if (!current) {
    return null;
  }

  const nextTask: TaskRecord = {
    ...normalizeTaskPayload(
      {
        title: updates.title ?? current.title,
        details: updates.details ?? current.details ?? "",
        date: updates.date ?? current.startAt.slice(0, 10),
        startTime: updates.startTime ?? current.startAt.slice(11, 16),
        endTime: updates.endTime ?? current.endAt.slice(11, 16),
        priority: updates.priority ?? current.priority,
        linkToCalendar: false
      },
      current
    ),
    completed: updates.completed ?? current.completed,
    linkedEventId:
      updates.linkedEventId === undefined ? current.linkedEventId : updates.linkedEventId
  };

  // ── Time-slot conflict check (exclude self, database-level) ─
  const conflict = await findOverlappingTaskInDb(userId, nextTask.startAt, nextTask.endAt, id);
  if (conflict) {
    throw new CalendarConflictError(
      `Time slot already occupied by "${conflict.title}"`
    );
  }

  await connectToDatabase();
  await TaskModel.updateOne({ id, userId }, nextTask);
  return nextTask;
}

export async function deleteTask(id: string, userId = DEMO_USER_ID) {
  await connectToDatabase();
  await TaskModel.deleteOne({ id, userId });
  await NotificationModel.deleteMany({ userId, taskId: id });
  return true;
}

export async function createNotification(record: Omit<NotificationRecord, "id" | "createdAt">) {
  await connectToDatabase();
  const notification: NotificationRecord = {
    ...record,
    id: createId("ntf"),
    createdAt: new Date().toISOString()
  };
  await NotificationModel.create(notification);
  return notification;
}

export async function markNotificationSent(id: string, status: NotificationRecord["status"]) {
  await connectToDatabase();
  const sentAt = new Date().toISOString();
  await NotificationModel.updateOne({ id }, { $set: { status, sentAt: status === "sent" ? sentAt : null } });
}

export async function getUser(userId = DEMO_USER_ID): Promise<UserRecord> {
  return (await getOverview(userId)).user;
}
