import { model, models, Schema } from "mongoose";

const eventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    type: { type: String, required: true },
    color: { type: String, required: true },
    startAt: { type: String, required: true, index: true },
    endAt: { type: String, required: true },
    location: { type: String, default: null },
    reminderMinutes: { type: Number, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  {
    versionKey: false
  }
);

export const EventModel = models.Event || model("Event", eventSchema);
