# 🎓 AI Tutor

A production-ready AI-powered tutoring application built with Next.js 14, Gemini API, and Supabase pgvector. Upload any course material and get intelligent chat, structured summaries, and auto-generated quizzes.

---

## ✨ Features

- **📄 Course Upload** — Upload PDFs or paste text; auto-chunked and embedded
- **💬 RAG Chat** — Ask questions, get grounded answers from your course content
- **📋 Smart Summary** — Structured summary with topics, concepts, and definitions
- **🧠 Quiz Generator** — 5 MCQs + 3 short-answer questions with answer key
- **⬇️ Downloads** — Export summary and quiz as `.txt` files

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| LLM | Gemini 1.5 Flash |
| Embeddings | text-embedding-004 (768 dims) |
| Vector DB | Supabase + pgvector |
| Styling | Inline CSS (zero dependencies) |

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-tutor
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### Get your Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy and paste into `.env.local`

#### Get your Supabase credentials:
1. Go to [supabase.com](https://supabase.com) → your project
2. **Settings → API**
3. Copy **Project URL** and **anon/public key**

### 3. Set Up Supabase Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open `supabase-setup.sql` from this project
3. Run the entire script
4. You should see the `documents` table and `match_documents` function created

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ai-tutor/
├── app/
│   ├── api/
│   │   ├── upload/route.ts    # PDF/text ingestion + chunking + embedding
│   │   ├── chat/route.ts      # RAG-powered Q&A
│   │   ├── summary/route.ts   # Course summarization
│   │   └── quiz/route.ts      # Quiz generation
│   ├── page.tsx               # Main UI
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── lib/
│   ├── gemini.ts              # Gemini model clients
│   ├── embeddings.ts          # Embedding generation + text chunking
│   ├── rag.ts                 # Retrieval, summarization, quiz logic
│   └── supabase.ts            # Supabase client
├── supabase-setup.sql         # DB setup script
├── .env.local.example         # Environment template
└── README.md
```

---

## 🧠 How It Works

### Upload Flow
1. User uploads PDF or pastes text
2. Text extracted (pdf-parse for PDFs)
3. Chunked into 500–800 character segments
4. Each chunk embedded via `text-embedding-004` (768 dimensions)
5. Chunks + embeddings stored in Supabase `documents` table

### Chat (RAG) Flow
1. User question is embedded
2. Top 3 similar chunks retrieved via `match_documents` (cosine similarity)
3. Chunks injected into prompt: `"Answer using ONLY this context"`
4. Gemini 1.5 Flash generates the answer

### Summary & Quiz
- All stored chunks fetched
- Single structured prompt sent to Gemini
- Response returned and rendered; downloadable as `.txt`

---

## 🔧 Customization

| Setting | File | Variable |
|---------|------|----------|
| Chunk size | `lib/embeddings.ts` | `minSize`, `maxSize` |
| Similarity threshold | `lib/rag.ts` | `matchThreshold` |
| Top K chunks | `lib/rag.ts` | `matchCount` |
| Number of quiz questions | `lib/rag.ts` | Edit prompt |

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in your Vercel project settings.

---

## ⚠️ Important Notes

- **Clear on re-upload**: Uploading new content clears previous documents
- **Rate limits**: Gemini API has per-minute limits; large uploads may need retries
- **PDF parsing**: Complex PDFs with tables/images may have imperfect extraction
- **Anon key security**: For production, consider adding authentication via Supabase Auth

---

## 📝 License

MIT
