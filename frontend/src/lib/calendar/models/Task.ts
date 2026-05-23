import { model, models, Schema } from "mongoose";

const taskSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    details: { type: String, default: null },
    deadline: { type: String, required: true, index: true },
    startAt: { type: String, required: true, index: true },
    endAt: { type: String, required: true, index: true },
    priority: { type: String, required: true },
    completed: { type: Boolean, required: true },
    linkedEventId: { type: String, default: null, index: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  {
    versionKey: false
  }
);

// Compound index for efficient time-slot overlap queries:
// find all tasks for a user whose [startAt, endAt) window intersects a candidate range.
taskSchema.index({ userId: 1, startAt: 1, endAt: 1 });

export const TaskModel = models.Task || model("Task", taskSchema);
