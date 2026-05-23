import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema(
    {
        content: { type: String, required: true, maxlength: 3000 },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
        votes: { type: Number, default: 0 },
        isAccepted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model('ForumReply', forumReplySchema);
