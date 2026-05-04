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
