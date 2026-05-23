import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    message: { type: String, default: '', maxlength: 500, trim: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests
accessRequestSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('AccessRequest', accessRequestSchema);
