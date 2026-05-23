import { addHours, isAfter, isBefore, parseISO, subHours } from "date-fns";
import { createNotification, getOverview, markNotificationSent } from "@/lib/calendar/repository";
import { sendReminderEmail } from "@/lib/calendar/email";
import type { ReminderCandidate } from "@/lib/calendar/types";

export async function collectReminderCandidates(userId?: string): Promise<ReminderCandidate[]> {
  const overview = await getOverview(userId);
  const now = new Date();
  const lookAheadHours = Number(process.env.NOTIFICATION_EMAIL_LOOKAHEAD_HOURS ?? 24);
  const until = addHours(now, lookAheadHours);

  const eventReminders = overview.events
    .filter((event) => {
      const start = parseISO(event.startAt);
      return isAfter(start, now) && isBefore(start, until);
    })
    .map((event) => ({
      user: overview.user,
      event,
      title: `${event.title} starts soon`,
      body: `${event.title} is scheduled for ${event.startAt}. Open EduAI to review details and tasks.`,
      scheduledFor: event.startAt
    }));

  const taskReminders = overview.tasks
    .filter((task) => !task.completed)
    .filter((task) => {
      const reminderAt = subHours(parseISO(task.deadline), 2);
      return isAfter(reminderAt, now) && isBefore(reminderAt, until);
    })
    .map((task) => ({
      user: overview.user,
      task,
      title: `${task.title} is due in 2 hours`,
      body: `${task.title} is due on ${task.deadline}. You have 2 hours left to complete it.`,
      scheduledFor: subHours(parseISO(task.deadline), 2).toISOString()
    }));

  return [...eventReminders, ...taskReminders];
}

export async function runReminderDispatch(userId?: string) {
  const overview = await getOverview(userId);
  const now = new Date();
  const pending = overview.notifications.filter((notification) => notification.status === "pending");
  const candidates = await collectReminderCandidates(userId);

  const createdNotifications = await Promise.all(
    candidates.flatMap((candidate) =>
      (["in_app", "email"] as const)
        .filter((channel) => {
          return !overview.notifications.some(
            (notification) =>
              notification.channel === channel &&
              notification.eventId === (candidate.event?.id ?? null) &&
              notification.taskId === (candidate.task?.id ?? null) &&
              notification.title === candidate.title &&
              notification.scheduledFor === candidate.scheduledFor
          );
        })
        .map((channel) =>
          createNotification({
            userId: candidate.user.id,
            eventId: candidate.event?.id ?? null,
            taskId: candidate.task?.id ?? null,
            title: candidate.title,
            body: candidate.body,
            channel,
            status: "pending",
            scheduledFor: candidate.scheduledFor,
            sentAt: null
          })
        )
    )
  );

  const emailNotifications = [...pending, ...createdNotifications].filter(
    (notification) =>
      notification.channel === "email" &&
      notification.status === "pending" &&
      parseISO(notification.scheduledFor) <= now
  );

  // Phase 1: mark due in-app notifications as sent.
  const inAppNotifications = [...pending, ...createdNotifications].filter(
    (notification) =>
      notification.channel === "in_app" &&
      notification.status === "pending" &&
      parseISO(notification.scheduledFor) <= now
  );
  await Promise.all(inAppNotifications.map((notification) => markNotificationSent(notification.id, "sent")));

  // Phase 2: send emails after in-app notifications are processed.
  const deliveries = await Promise.all(
    emailNotifications.map(async (notification) => {
      try {
        const event = overview.events.find((entry) => entry.id === notification.eventId);
        const task = overview.tasks.find((entry) => entry.id === notification.taskId);
        const result = await sendReminderEmail({
          user: overview.user,
          event,
          task,
          title: notification.title,
          body: notification.body,
          scheduledFor: notification.scheduledFor
        });
        await markNotificationSent(notification.id, result.delivered ? "sent" : "pending");
        return {
          id: notification.id,
          delivered: result.delivered,
          preview: "preview" in result ? result.preview : undefined
        };
      } catch (error) {
        await markNotificationSent(notification.id, "failed");
        return {
          id: notification.id,
          delivered: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    })
  );

  return {
    created: createdNotifications.length,
    inAppProcessed: inAppNotifications.length,
    processed: deliveries.length,
    deliveries
  };
}
