import mongoose from 'mongoose';

const chatChunkSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatDocument',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number], // Array of numbers for vector search
      index: '2dsphere', // Optional: if using MongoDB Atlas Vector Search, setup the search index in Atlas. For local keyword search, we fallback to text index.
    },
  },
  { timestamps: true }
);

chatChunkSchema.index({ content: 'text' }); // Keyword search fallback

export default mongoose.model('ChatChunk', chatChunkSchema);
