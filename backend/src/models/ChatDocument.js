import mongoose from 'mongoose';

const chatDocumentSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
    },
    extractedText: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatDocument', chatDocumentSchema);
