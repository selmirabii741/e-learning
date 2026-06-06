import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();



router.post('/', protect, async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content?.trim()) {
            return res.status(400).json({ message: 'receiverId et content sont requis' });
        }

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'receiverId invalide' });
        }

        if (receiverId === String(req.user._id)) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer un message' });
        }

        const receiver = await User.findById(receiverId).select('_id name');
        if (!receiver) {
            return res.status(404).json({ message: 'Destinataire introuvable' });
        }

        const msg = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content: content.trim(),
        });

        await msg.populate('sender', 'name avatar');
        await msg.populate('receiver', 'name avatar');

        res.status(201).json({ message: msg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});




router.get('/conversations', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Single aggregation: group by partner, last message, unread count
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { receiver: userId }],
                },
            },
            {
                $addFields: {
                    partnerId: {
                        $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender'],
                    },
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$partnerId',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'partner',
                    pipeline: [{ $project: { name: 1, avatar: 1, role: 1, speciality: 1 } }],
                },
            },
            { $unwind: '$partner' },
            {
                $project: {
                    partner: 1,
                    unreadCount: 1,
                    lastMessage: {
                        content: '$lastMessage.content',
                        createdAt: '$lastMessage.createdAt',
                        read: '$lastMessage.read',
                        sender: '$lastMessage.sender',
                    },
                },
            },
        ]);

        res.json({ conversations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});



router.get('/conversations/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const meId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'userId invalide' });
        }

        const partner = await User.findById(userId).select('name avatar role speciality bio');
        if (!partner) return res.status(404).json({ message: 'Utilisateur introuvable' });

        const messages = await Message.find({
            $or: [
                { sender: meId, receiver: userId },
                { sender: userId, receiver: meId },
            ],
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'name avatar')
            .populate('receiver', 'name avatar');


        await Message.updateMany(
            { sender: userId, receiver: meId, read: false },
            { $set: { read: true } }
        );

        res.json({ messages, partner });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});



router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user._id,
            read: false,
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});



router.delete('/:id', protect, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ message: 'Message introuvable' });
        if (String(msg.sender) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Accès refusé' });
        }
        await msg.deleteOne();
        res.json({ message: 'Message supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
