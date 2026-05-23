-- ============================================================
-- AI Tutor - Supabase Setup SQL
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT NOT NULL,
  embedding  VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for fast similarity search (IVFFlat)
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Create the match_documents RPC function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count     INT
)
RETURNS TABLE (
  id         UUID,
  content    TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. (Optional) Enable Row Level Security but allow all for anon key
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon" ON documents
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Done! Your Supabase database is ready for AI Tutor.
-- ============================================================
