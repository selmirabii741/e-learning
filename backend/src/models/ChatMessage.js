import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        type: { type: String }, // e.g. 'image', 'document'
        url: String,
        name: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
