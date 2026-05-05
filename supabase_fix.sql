-- Script de corrections - à exécuter dans Supabase SQL Editor

-- Ajouter colonne receiver_email à direct_messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS receiver_email TEXT;

-- Ajouter colonne social_score à puzzle_catalog  
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS social_score NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ajouter colonne email à user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username_set BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS friend_code TEXT;

-- Ajouter colonne full_name à user_profiles  
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages (receiver_email);

-- ============================================================
-- Corrections supplémentaires - colonnes manquantes
-- ============================================================

-- follows : ajouter following_email comme alias
ALTER TABLE follows ADD COLUMN IF NOT EXISTS following_email TEXT;
UPDATE follows SET following_email = following WHERE following_email IS NULL;

-- friendships : colonnes requester/addressee  
ALTER TABLE friendships ADD COLUMN IF NOT EXISTS requester_email TEXT;
ALTER TABLE friendships ADD COLUMN IF NOT EXISTS addressee_email TEXT;
UPDATE friendships SET requester_email = created_by WHERE requester_email IS NULL;
UPDATE friendships SET addressee_email = friend_email WHERE addressee_email IS NULL;

-- posts : colonnes manquantes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_completion_post BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS puzzle_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS puzzle_brand TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS puzzle_pieces NUMERIC;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS puzzle_category TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS puzzle_reference TEXT;

-- puzzle_catalog : colonnes manquantes
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS piece_count NUMERIC;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS category_tag TEXT;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS amazon_price NUMERIC;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS asin TEXT;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS amazon_link TEXT;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS image_hd TEXT;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS social_score NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS wishlist_count NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS added_count NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS total_likes NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS total_dislikes NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- page_settings : colonne is_active (alias de is_visible)
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
UPDATE page_settings SET is_active = is_visible WHERE is_active IS NULL;

-- user_profiles : colonnes manquantes
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username_set BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS friend_code TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Politique RLS pour user_profiles - permettre la lecture publique
DROP POLICY IF EXISTS "public read user_profiles" ON user_profiles;
CREATE POLICY "public read user_profiles" ON user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "own user_profiles" ON user_profiles;
CREATE POLICY "own user_profiles" ON user_profiles FOR ALL
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- Colonnes supplémentaires pour puzzle_catalog
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS social_score NUMERIC DEFAULT 0;
ALTER TABLE puzzle_catalog ADD COLUMN IF NOT EXISTS wishlist_count NUMERIC DEFAULT 0;

-- Colonnes pour likes - user_id n'existe pas, on utilise created_by
-- (déjà corrigé dans le code)

-- Colonnes pour page_settings
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT;
ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- Fix friendships table: add missing columns for compatibility
-- ============================================================
ALTER TABLE friendships 
  ADD COLUMN IF NOT EXISTS requester_email TEXT,
  ADD COLUMN IF NOT EXISTS addressee_email TEXT,
  ADD COLUMN IF NOT EXISTS requester_name TEXT,
  ADD COLUMN IF NOT EXISTS addressee_name TEXT;

-- Migrate existing data: created_by → requester_email, friend_email → addressee_email
UPDATE friendships 
SET requester_email = created_by 
WHERE requester_email IS NULL AND created_by IS NOT NULL;

UPDATE friendships 
SET addressee_email = friend_email 
WHERE addressee_email IS NULL AND friend_email IS NOT NULL;

-- Update RLS policy to also check requester_email/addressee_email
DROP POLICY IF EXISTS "own or friend friendships" ON friendships;
CREATE POLICY "own or friend friendships" ON friendships
  USING (
    created_by = auth.jwt() ->> 'email' 
    OR friend_email = auth.jwt() ->> 'email'
    OR requester_email = auth.jwt() ->> 'email'
    OR addressee_email = auth.jwt() ->> 'email'
  );

-- ============================================================
-- Fix follows table: add follower_email column (mirrors created_by)
-- ============================================================
ALTER TABLE follows 
  ADD COLUMN IF NOT EXISTS follower_email TEXT;

-- Migrate existing data
UPDATE follows 
SET follower_email = created_by 
WHERE follower_email IS NULL AND created_by IS NOT NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_email ON follows (follower_email);

-- Update insert trigger to auto-populate follower_email
CREATE OR REPLACE FUNCTION set_follower_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.follower_email IS NULL THEN
    NEW.follower_email := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_follower_email ON follows;
CREATE TRIGGER trg_set_follower_email
  BEFORE INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION set_follower_email();

-- ============================================================  
-- Fix wishlists table: add missing columns for code compatibility
-- ============================================================
ALTER TABLE wishlists 
  ADD COLUMN IF NOT EXISTS puzzle_name TEXT,
  ADD COLUMN IF NOT EXISTS puzzle_brand TEXT,
  ADD COLUMN IF NOT EXISTS puzzle_pieces NUMERIC,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Migrate title→puzzle_name if needed
UPDATE wishlists SET puzzle_name = title WHERE puzzle_name IS NULL AND title IS NOT NULL;
UPDATE wishlists SET image = image_url WHERE image IS NULL AND image_url IS NOT NULL;
