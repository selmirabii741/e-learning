import mongoose from 'mongoose';
import crypto from 'crypto';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  pdfUrl: { type: String },
  pdfData: { type: Buffer },
  pdfName: { type: String },
  duration: { type: Number, default: 0 },
  order: { type: Number, required: true },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnail: { type: String, default: '' },
    category: { type: String, required: true },
    level: { type: String, enum: ['débutant', 'intermédiaire', 'avancé'], default: 'débutant' },
    lessons: [lessonSchema],
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublished: { type: Boolean, default: false },

    // ── Secure enrollment code system ──
    enrollmentCode: { type: String, unique: true, sparse: true },
    requireCode: { type: Boolean, default: true },
    invitedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    vectorIds: [{ type: String }],
  },
  { timestamps: true }
);

// Auto-generate a unique 8-char enrollment code if not set
courseSchema.pre('save', function (next) {
  if (!this.enrollmentCode) {
    this.enrollmentCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

export default mongoose.model('Course', courseSchema);

