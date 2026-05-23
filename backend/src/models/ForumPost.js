import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        content: { type: String, required: true, maxlength: 5000 },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tags: [{ type: String, lowercase: true, trim: true }],
        votes: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        replyCount: { type: Number, default: 0 },
        isSolved: { type: Boolean, default: false },

        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    },
    { timestamps: true }
);


forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
forumPostSchema.index({ author: 1, createdAt: -1 });
forumPostSchema.index({ createdAt: -1 });

export default mongoose.model('ForumPost', forumPostSchema);
