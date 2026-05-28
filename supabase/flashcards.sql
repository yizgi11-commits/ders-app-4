-- ─────────────────────────────────────────────────────────────────
-- Flashcards System
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- 1. Main flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id       uuid        REFERENCES subjects(id) ON DELETE SET NULL,
  front            text        NOT NULL,
  back             text        NOT NULL,
  source_pdf       text,        -- storage path e.g. "pdfs/{user_id}/file.pdf"
  source_pdf_name  text,        -- original filename
  next_review_date date        NOT NULL DEFAULT CURRENT_DATE,
  review_count     int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own flashcards"
  ON flashcards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index: fast "due today" query
CREATE INDEX IF NOT EXISTS flashcards_user_review
  ON flashcards(user_id, next_review_date);

-- Index: filter by subject
CREATE INDEX IF NOT EXISTS flashcards_subject
  ON flashcards(subject_id);

-- ─────────────────────────────────────────────────────────────────
-- 2. Supabase Storage bucket for PDFs
-- Run this in SQL or via Dashboard → Storage → New Bucket
-- ─────────────────────────────────────────────────────────────────

-- Create bucket (if using SQL approach)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  false,
  10485760,   -- 10 MB max
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own folder
CREATE POLICY "Users upload own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
