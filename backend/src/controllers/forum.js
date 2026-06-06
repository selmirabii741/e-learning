import express from 'express';
import ForumPost from '../models/ForumPost.js';
import ForumReply from '../models/ForumReply.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();


router.get('/stats', protect, async (req, res) => {
    try {
        const [popularTags, hotPosts, topUsers] = await Promise.all([

            ForumPost.aggregate([
                { $unwind: '$tags' },
                { $group: { _id: '$tags', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            ForumPost.find({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } })
                .sort({ views: -1 })
                .limit(5)
                .populate('author', 'name avatar')
                .select('title views votes replyCount isSolved'),

            ForumPost.aggregate([
                { $group: { _id: '$author', posts: { $sum: 1 } } },
                { $sort: { posts: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $project: { posts: 1, 'user.name': 1, 'user.avatar': 1, 'user._id': 1 } },
            ]),
        ]);
        res.json({ popularTags, hotPosts, topUsers });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.get('/', protect, async (req, res) => {
    try {
        const { search, tag, sort = 'newest', page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = {};
        if (search) filter.$text = { $search: search };
        if (tag) filter.tags = tag.toLowerCase();

        let sortObj = { createdAt: -1 };
        if (sort === 'votes') sortObj = { votes: -1 };
        if (sort === 'active') sortObj = { updatedAt: -1 };
        if (sort === 'unsolved') { filter.isSolved = false; sortObj = { createdAt: -1 }; }

        const [posts, total] = await Promise.all([
            ForumPost.find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(Number(limit))
                .populate('author', 'name avatar'),
            ForumPost.countDocuments(filter),
        ]);

        res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.get('/:id', protect, async (req, res) => {
    try {
        const post = await ForumPost.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'name avatar role');

        if (!post) return res.status(404).json({ message: 'Post introuvable' });

        const replies = await ForumReply.find({ post: req.params.id })
            .sort({ isAccepted: -1, votes: -1, createdAt: 1 })
            .populate('author', 'name avatar role');

        res.json({ post, replies });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.post('/', protect, async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ message: 'Titre et contenu requis' });
        }
        const tagsArr = (tags || '')
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 5);

        const post = await ForumPost.create({
            title: title.trim(),
            content: content.trim(),
            author: req.user._id,
            tags: tagsArr,
        });

        await post.populate('author', 'name avatar');
        res.status(201).json({ post });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.post('/:id/replies', protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) return res.status(400).json({ message: 'Réponse vide' });

        const post = await ForumPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post introuvable' });

        const reply = await ForumReply.create({
            content: content.trim(),
            author: req.user._id,
            post: req.params.id,
        });


        await ForumPost.findByIdAndUpdate(req.params.id, { $inc: { replyCount: 1 } });

        await reply.populate('author', 'name avatar role');
        res.status(201).json({ reply });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.put('/:id/vote', protect, async (req, res) => {
    try {
        const { dir } = req.body;
        const delta = dir === 'down' ? -1 : 1;
        const post = await ForumPost.findByIdAndUpdate(
            req.params.id,
            { $inc: { votes: delta } },
            { new: true }
        ).populate('author', 'name avatar');
        if (!post) return res.status(404).json({ message: 'Post introuvable' });
        res.json({ post });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.put('/replies/:replyId/vote', protect, async (req, res) => {
    try {
        const { dir } = req.body;
        const delta = dir === 'down' ? -1 : 1;
        const reply = await ForumReply.findByIdAndUpdate(
            req.params.replyId,
            { $inc: { votes: delta } },
            { new: true }
        ).populate('author', 'name avatar role');
        if (!reply) return res.status(404).json({ message: 'Réponse introuvable' });
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.put('/replies/:replyId/accept', protect, async (req, res) => {
    try {
        const reply = await ForumReply.findById(req.params.replyId);
        if (!reply) return res.status(404).json({ message: 'Réponse introuvable' });

        const post = await ForumPost.findById(reply.post);
        if (String(post.author) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Seul le créateur du post peut accepter une réponse' });
        }


        await ForumReply.updateMany({ post: reply.post }, { isAccepted: false });
        reply.isAccepted = true;
        await reply.save();

        await ForumPost.findByIdAndUpdate(reply.post, { isSolved: true });

        await reply.populate('author', 'name avatar role');
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post introuvable' });
        if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        await Promise.all([
            ForumPost.findByIdAndDelete(req.params.id),
            ForumReply.deleteMany({ post: req.params.id }),
        ]);
        res.json({ message: 'Post supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});


router.delete('/replies/:replyId', protect, async (req, res) => {
    try {
        const reply = await ForumReply.findById(req.params.replyId);
        if (!reply) return res.status(404).json({ message: 'Réponse introuvable' });
        if (String(reply.author) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        await reply.deleteOne();
        await ForumPost.findByIdAndUpdate(reply.post, { $inc: { replyCount: -1 } });
        res.json({ message: 'Réponse supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
});

export default router;
