import express from 'express';
import { protect } from '../middleware/auth.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatDocument from '../models/ChatDocument.js';
import ChatChunk from '../models/ChatChunk.js';
import { aiChat } from '../services/rag/tutorService.js';
import multer from 'multer';
import Tesseract from 'tesseract.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const router = express.Router();

// GET /api/chat/conversations
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const conversations = await ChatConversation.find({ userId }).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
});

// POST /api/chat/conversations
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const { title } = req.body;
    
    const newConv = await ChatConversation.create({
      userId,
      title: title || 'Nouvelle conversation',
    });
    
    res.status(201).json(newConv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la conversation' });
  }
});

// DELETE /api/chat/conversations/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const conv = await ChatConversation.findOneAndDelete({ _id: req.params.id, userId });
    
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });
    
    // Delete associated messages, docs, chunks
    await ChatMessage.deleteMany({ conversationId: req.params.id });
    await ChatDocument.deleteMany({ conversationId: req.params.id });
    await ChatChunk.deleteMany({ conversationId: req.params.id });
    
    res.json({ message: 'Conversation supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    // Validate ownership
    const conv = await ChatConversation.findOne({ _id: req.params.id, userId });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });

    const messages = await ChatMessage.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// GET /api/chat/conversations/:id/documents
router.get('/:id/documents', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const conv = await ChatConversation.findOne({ _id: req.params.id, userId });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });

    const docs = await ChatDocument.find({ conversationId: req.params.id }).select('-extractedText').sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des documents' });
  }
});

// POST /api/chat/conversations/:id/upload
router.post('/:id/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });
    
    const conv = await ChatConversation.findOne({ _id: req.params.id, userId });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });

    let extractedText = '';
    const mime = req.file.mimetype;
    
    if (mime === 'application/pdf') {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text?.trim() || '';
    } else if (mime.startsWith('image/')) {
      try {
        const worker = await Tesseract.createWorker(['fra', 'eng']);
        const { data: { text } } = await worker.recognize(req.file.buffer);
        await worker.terminate();
        extractedText = text?.trim() || '';
      } catch (err) {
        console.error("Erreur Tesseract:", err);
        return res.status(500).json({ message: "Impossible d'analyser l'image. Le format est peut-être non supporté." });
      }
    } else {
      // Treat as plain text (Code, TXT, MD, CSV, etc.)
      extractedText = req.file.buffer.toString('utf-8').trim();
    }

    if (!extractedText) {
      return res.status(422).json({ message: 'Le fichier ne contient pas de texte lisible.' });
    }

    const newDoc = await ChatDocument.create({
      conversationId: req.params.id,
      userId,
      fileName: req.file.originalname,
      extractedText,
    });

    // Chunking logic (simple split by newline or size)
    const chunkSize = 1500;
    const overlap = 200;
    let index = 0;
    const chunks = [];
    
    for (let i = 0; i < extractedText.length; i += (chunkSize - overlap)) {
      const content = extractedText.substring(i, i + chunkSize);
      if (content.trim().length > 10) {
        chunks.push({
          conversationId: req.params.id,
          documentId: newDoc._id,
          userId,
          content: content.trim(),
          chunkIndex: index++,
        });
      }
    }
    
    if (chunks.length > 0) {
      await ChatChunk.insertMany(chunks);
    }

    res.json({ message: 'Fichier uploadé et indexé avec succès', documentId: newDoc._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'upload', error: error.message });
  }
});

// POST /api/chat/conversations/:id/messages
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const { content, searchMode = 'document' } = req.body;
    const conversationId = req.params.id;

    if (!content) return res.status(400).json({ message: 'Message vide' });

    const conv = await ChatConversation.findOne({ _id: conversationId, userId });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });

    // Save user message
    const userMsg = await ChatMessage.create({
      conversationId,
      role: 'user',
      content,
    });

    // Update conversation title if first message
    const messageCount = await ChatMessage.countDocuments({ conversationId });
    if (messageCount <= 2) { // including the one we just saved
      conv.title = content.substring(0, 40) + '...';
      await conv.save();
    } else {
      conv.updatedAt = new Date();
      await conv.save();
    }

    // ── RAG Retrieval (Keyword search fallback if no embeddings) ──
    const searchTerms = content.split(' ').filter(w => w.length > 3).join(' ');
    let context = '';
    
    if (searchTerms) {
      const relevantChunks = await ChatChunk.find(
        { conversationId, $text: { $search: searchTerms } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(3);

      if (relevantChunks.length > 0) {
        context = relevantChunks.map(c => c.content).join('\n\n---\n\n');
      }
    }
    
    // If no specific chunks found, optionally grab first 1500 chars of recent document as fallback
    if (!context) {
      const recentDoc = await ChatDocument.findOne({ conversationId }).sort({ createdAt: -1 });
      if (recentDoc && recentDoc.extractedText) {
        context = recentDoc.extractedText.substring(0, 3000);
      }
    }

    // ── Call LLM ──
    let systemPrompt = '';
    
    if (searchMode === 'global') {
      systemPrompt = `Tu es un assistant IA global et professionnel pour une plateforme e-learning.
Tu dois répondre normalement aux questions en utilisant tes connaissances générales.
Tu peux utiliser le contexte documentaire ci-dessous comme supplément d'information, mais tu n'es pas limité à celui-ci.
Utilise le markdown pour structurer tes réponses.

CONTEXTE DOCUMENTAIRE (le cas échéant) :
${context}`;
    } else {
      systemPrompt = `Tu es un assistant IA strict.
Règles obligatoires :
1. Tu dois répondre UNIQUEMENT en te basant sur le CONTEXTE DOCUMENTAIRE fourni ci-dessous.
2. Si le contexte documentaire est vide, réponds poliment que tu as besoin qu'un document, une image ou du code soit uploadé via les boutons en bas pour pouvoir répondre aux questions de manière ciblée.
3. Si la question est une simple salutation (ex: bonjour), tu peux répondre poliment mais rappelle que tu es là pour analyser des documents.
4. Si la réponse à la question ne se trouve PAS dans le contexte documentaire, dis EXACTEMENT : "Je ne trouve pas cette information dans le document fourni." et ne donne aucune réponse issue de tes connaissances générales.
5. N'invente JAMAIS d'informations.
6. Utilise le markdown pour structurer tes réponses.

CONTEXTE DOCUMENTAIRE :
${context}`;
    }

    const answerContent = await aiChat(systemPrompt, content);

    // Save assistant message
    const assistantMsg = await ChatMessage.create({
      conversationId,
      role: 'assistant',
      content: answerContent,
    });

    res.json({ message: assistantMsg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la réponse', error: error.message });
  }
});

export default router;
