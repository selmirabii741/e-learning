import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
    quizScores: [
      {
        lessonId: mongoose.Schema.Types.ObjectId,
        score: Number,
        totalQuestions: Number,
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    lastAccessed: { type: Date, default: Date.now },
    completionRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
