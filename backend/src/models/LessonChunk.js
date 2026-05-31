import mongoose from 'mongoose';

const lessonChunkSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    metadata: {
      courseTitle: { type: String, default: '' },
      lessonTitle: { type: String, default: '' },
      pdfName: { type: String, default: '' },
      pageNumber: { type: Number },
    },
    embedding: {
      type: [Number],
      default: undefined, // Don't store empty array
    },
  },
  { timestamps: true }
);

// Compound index for efficient lesson-scoped queries
lessonChunkSchema.index({ courseId: 1, lessonId: 1 });

// Text index on content for keyword search fallback (when embeddings are unavailable)
lessonChunkSchema.index({ content: 'text' });

export default mongoose.model('LessonChunk', lessonChunkSchema);
