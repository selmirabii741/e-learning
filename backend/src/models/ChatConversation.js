import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // String (Keycloak ID) or ObjectId depending on the project
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Nouvelle conversation',
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatConversation', chatConversationSchema);
