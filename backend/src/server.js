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

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import chatRoutes from './routes/chat.js';
import quizRoutes from './routes/quiz.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/students.js';
import messageRoutes from './routes/messages.js';
import forumRoutes from './routes/forum.js';
import aiRoutes from './routes/ai.js';
import globalChatRoutes from './routes/globalChat.js';

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

    //autoIngestAllCourses();
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
  //autoIngestAllCourses();
});


async function autoIngestAllCourses() {
  try {
    const { default: Course } = await import('./models/Course.js');
    const { ingestCourseContent } = await import('./services/rag/tutorService.js');

    const courses = await Course.find({ isPublished: true });
    if (!courses.length) {
      console.log('ℹ️  Aucun cours publié à ingérer dans le RAG.');
      return;
    }

    console.log(`🔄 Auto-ingest RAG : ${courses.length} cours...`);
    let ingested = 0;

    for (const course of courses) {
      const allContent = course.lessons
        .filter((l) => l.content?.trim())
        .map((l) => `# ${l.title}\n\n${l.content}`)
        .join('\n\n---\n\n');

      if (!allContent.trim()) continue;

      try {
        const chunks = await ingestCourseContent(String(course._id), allContent);
        console.log(`  ✅ "${course.title}" — ${chunks} chunks`);
        ingested++;
      } catch (e) {
        console.warn(`  ⚠️  Erreur ingestion "${course.title}": ${e.message}`);
      }
    }

    console.log(`✅ RAG prêt : ${ingested}/${courses.length} cours ingéré(s).`);
  } catch (err) {
    console.error('❌ Erreur auto-ingest RAG:', err.message);
  }
}

