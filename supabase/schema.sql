-- =============================================================
-- Newsly — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- =============================================================

-- ----------------------------------------------------------------
-- PROFILES
-- Extends the built-in auth.users table (1-to-1).
-- Created automatically on signup via the server API.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Newsly Reader',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- USER PREFERENCES
-- One row per user — upserted on every settings change.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  genres        TEXT[]   NOT NULL DEFAULT ARRAY['technology','business','sports'],
  country       TEXT     NOT NULL DEFAULT 'global',
  theme         TEXT     NOT NULL DEFAULT 'dark'         CHECK (theme IN ('dark','light')),
  font_size     TEXT     NOT NULL DEFAULT 'medium'       CHECK (font_size IN ('small','medium','large')),
  sort_mode     TEXT     NOT NULL DEFAULT 'personalized' CHECK (sort_mode IN ('latest','personalized')),
  hide_paywalled BOOLEAN NOT NULL DEFAULT FALSE,
  enhanced_bias  BOOLEAN NOT NULL DEFAULT FALSE,
  notifications  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- BOOKMARKS
-- One row per (user, article). Deduplicated on article_hash.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_hash TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  title        TEXT,
  description  TEXT,
  category     TEXT,
  source       TEXT,
  published_at TEXT,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, article_hash)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);

-- ----------------------------------------------------------------
-- COMMENTS
-- Community comments per article (identified by article_hash).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_hash TEXT        NOT NULL,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT        NOT NULL,
  text         TEXT        NOT NULL CHECK (char_length(text) <= 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_article_hash_idx ON public.comments(article_hash);

-- ----------------------------------------------------------------
-- COMMENT LIKES
-- One like per (user, comment). Toggled via the API.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- ----------------------------------------------------------------
-- BIAS VOTES
-- Community bias voting per article. One vote per (user, article).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bias_votes (
  article_hash TEXT NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote         TEXT NOT NULL CHECK (vote IN ('biased', 'not_biased')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (article_hash, user_id)
);

CREATE INDEX IF NOT EXISTS bias_votes_article_hash_idx ON public.bias_votes(article_hash);


-- =============================================================
-- ROW LEVEL SECURITY
-- All tables must have RLS enabled. Even though the server API
-- uses the service_role key (which bypasses RLS), enabling RLS
-- ensures that if the anon key were ever misused directly it
-- cannot read or write other users' data.
-- =============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bias_votes      ENABLE ROW LEVEL SECURITY;

-- profiles --
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- user_preferences --
CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- bookmarks --
CREATE POLICY "Users can manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- comments — authenticated users can read all, write only their own --
CREATE POLICY "Authenticated users can read comments"
  ON public.comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- comment_likes --
CREATE POLICY "Authenticated users can read likes"
  ON public.comment_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own likes"
  ON public.comment_likes FOR ALL
  USING (auth.uid() = user_id);

-- bias_votes --
CREATE POLICY "Authenticated users can read votes"
  ON public.bias_votes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own votes"
  ON public.bias_votes FOR ALL
  USING (auth.uid() = user_id);


-- =============================================================
-- HELPER: auto-update updated_at timestamp
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
