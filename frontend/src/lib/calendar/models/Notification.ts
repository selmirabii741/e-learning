import { model, models, Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    eventId: { type: String, default: null, index: true },
    taskId: { type: String, default: null, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    channel: { type: String, required: true },
    status: { type: String, required: true, index: true },
    scheduledFor: { type: String, required: true, index: true },
    sentAt: { type: String, default: null },
    createdAt: { type: String, required: true }
  },
  {
    versionKey: false
  }
);

export const NotificationModel = models.Notification || model("Notification", notificationSchema);
