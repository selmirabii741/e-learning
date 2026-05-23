import { model, models, Schema } from "mongoose";

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    timezone: { type: String, required: true },
    createdAt: { type: String, required: true }
  },
  {
    versionKey: false
  }
);

export const UserModel = models.User || model("User", userSchema);
