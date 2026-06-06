import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up from backend/src/)
dotenv.config({ path: resolve(__dirname, '../../.env') });

import authRoutes from './controllers/authController.js';
import courseRoutes from './controllers/coursesController.js';
import chatRoutes from './controllers/chat.js';
import quizRoutes from './controllers/quiz.js';
import progressRoutes from './controllers/progress.js';
import adminRoutes from './controllers/admin.js';
import studentRoutes from './controllers/students.js';
import messageRoutes from './controllers/messages.js';
import forumRoutes from './controllers/forum.js';
import aiRoutes from './controllers/ai.js';
import globalChatRoutes from './controllers/globalChat.js';
import ragRoutes from './controllers/rag.js';

const app = express();


app.use(cors({
  origin: (origin, callback) => {

    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
      /^http:\/\/(192\.168|10\.\d+\.\d+|172\.(1[6-9]|2\d|3[01]))\.\d+:\d+$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/global-chat/conversations', globalChatRoutes);
app.use('/api/rag', ragRoutes);


app.get('/', (req, res) => res.json({ message: '🎓 EduAI API is running', version: '1.0', docs: '/api/health' }));


app.get('/api/health', (req, res) => res.json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT} (accessible sur tout le réseau)`);
});


const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  retryWrites: true,
  family: 4,
};

async function connectMongo(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    console.log('✅ MongoDB connecté');

    autoIngestAllCourses();
  } catch (err) {
    console.error(`❌ MongoDB tentative ${attempt} échouée: ${err.message}`);
    if (attempt < 5) {
      const delay = attempt * 3000;
      console.log(`⏳ Reconnexion dans ${delay / 1000}s...`);
      setTimeout(() => connectMongo(attempt + 1), delay);
    } else {
      console.error('❌ MongoDB: impossible de se connecter après 5 tentatives. Le serveur continue sans DB.');
    }
  }
}

connectMongo();

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB déconnecté — reconnexion automatique...');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnecté');
  autoIngestAllCourses();
});


async function autoIngestAllCourses() {
  try {
    const { default: Course } = await import('./models/Course.js');
    const { ingestCourse } = await import('./services/rag/tutorService.js');
    const { default: LessonChunk } = await import('./models/LessonChunk.js');

    const courses = await Course.find({ isPublished: true });
    if (!courses.length) {
      console.log('ℹ️  Aucun cours publié à ingérer dans le RAG.');
      return;
    }

    // Skip courses that already have chunks (avoid re-indexing on every restart)
    const coursesToIngest = [];
    for (const course of courses) {
      const existingChunks = await LessonChunk.countDocuments({ courseId: course._id });
      if (existingChunks === 0 && course.lessons.some((l) => l.content?.trim() || l.pdfData)) {
        coursesToIngest.push(course);
      }
    }

    if (coursesToIngest.length === 0) {
      console.log(`ℹ️  RAG: ${courses.length} cours déjà indexés ou sans contenu.`);
      return;
    }

    console.log(`🔄 Auto-ingest RAG : ${coursesToIngest.length} cours à indexer...`);
    let ingested = 0;

    for (const course of coursesToIngest) {
      try {
        const result = await ingestCourse(String(course._id));
        console.log(`  ✅ "${course.title}" — ${result.totalChunks} chunks, ${result.lessonsIngested} leçons`);
        ingested++;
      } catch (e) {
        console.warn(`  ⚠️  Erreur ingestion "${course.title}": ${e.message}`);
      }
    }

    console.log(`✅ RAG prêt : ${ingested}/${coursesToIngest.length} cours ingéré(s).`);
  } catch (err) {
    console.error('❌ Erreur auto-ingest RAG:', err.message);
  }
}

