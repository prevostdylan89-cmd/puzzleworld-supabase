-- ============================================================
-- PuzzleWorld - Schéma SQL COMPLET v2
-- Basé exactement sur les entités base44 originales
-- À exécuter dans Supabase SQL Editor (remplace tout)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION set_updated_date()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_date = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DROP et recréer toutes les tables avec les bonnes colonnes
-- ============================================================

-- achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  achievement_type TEXT, title TEXT NOT NULL, description TEXT, icon TEXT, color TEXT
);

-- badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  name TEXT NOT NULL, description TEXT NOT NULL, icon TEXT, color TEXT,
  requirement_type TEXT, requirement_value NUMERIC, level NUMERIC NOT NULL
);

-- blog_articles
CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  title TEXT NOT NULL, subtitle TEXT, slug TEXT, content TEXT, blocks JSONB,
  cover_image TEXT, show_cover_in_article BOOLEAN DEFAULT true, category TEXT, tags TEXT,
  meta_title TEXT, meta_description TEXT, external_link TEXT, external_link_label TEXT,
  featured_puzzles JSONB, is_published BOOLEAN DEFAULT false, read_time NUMERIC
);

-- blog_categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  name TEXT NOT NULL, "order" NUMERIC DEFAULT 0, is_featured BOOLEAN DEFAULT false
);

-- bug_reports
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  title TEXT NOT NULL, description TEXT NOT NULL, page TEXT,
  category TEXT DEFAULT 'bug', status TEXT DEFAULT 'nouveau', priority TEXT DEFAULT 'normale',
  user_email TEXT, user_agent TEXT, admin_notes TEXT
);

-- comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  post_id TEXT NOT NULL, content TEXT NOT NULL, author_name TEXT
);

-- completed_puzzles
CREATE TABLE IF NOT EXISTS completed_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_name TEXT NOT NULL, puzzle_brand TEXT, puzzle_pieces NUMERIC NOT NULL,
  image_url TEXT, completion_time TEXT, notes TEXT, rating NUMERIC
);

-- direct_messages (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  sender_email TEXT NOT NULL, sender_name TEXT,
  receiver_email TEXT NOT NULL, receiver_name TEXT,
  message TEXT NOT NULL, is_read BOOLEAN DEFAULT false, conversation_id TEXT NOT NULL
);

-- events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  title TEXT NOT NULL, image TEXT, short_description TEXT, full_description TEXT,
  event_date DATE, event_time TEXT, location TEXT,
  max_capacity NUMERIC, current_participants NUMERIC DEFAULT 0
);

-- event_participants
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  event_id TEXT NOT NULL, user_email TEXT NOT NULL, user_name TEXT
);

-- featured_articles
CREATE TABLE IF NOT EXISTS featured_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  article_id TEXT NOT NULL, position NUMERIC NOT NULL,
  article_title TEXT, article_image TEXT, article_category TEXT, article_slug TEXT
);

-- featured_events
CREATE TABLE IF NOT EXISTS featured_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  event_id TEXT NOT NULL, position NUMERIC NOT NULL,
  event_title TEXT, event_image TEXT, event_date TEXT
);

-- featured_puzzles
CREATE TABLE IF NOT EXISTS featured_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_catalog_id TEXT NOT NULL, position NUMERIC NOT NULL,
  puzzle_asin TEXT, puzzle_title TEXT, puzzle_image TEXT
);

-- follows (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  follower_email TEXT NOT NULL, following_email TEXT NOT NULL
);

-- friendships (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  requester_email TEXT NOT NULL, requester_name TEXT,
  addressee_email TEXT NOT NULL, addressee_name TEXT,
  status TEXT DEFAULT 'pending'
);

-- likes (avec user_id comme dans base44)
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  post_id TEXT NOT NULL, user_id TEXT
);

-- online_games
CREATE TABLE IF NOT EXISTS online_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  title TEXT NOT NULL, description TEXT, image TEXT, url TEXT,
  platform TEXT, rating NUMERIC DEFAULT 4.5, players TEXT DEFAULT '1K+',
  tags JSONB, is_featured BOOLEAN DEFAULT false
);

-- page_settings (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS page_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  page_name TEXT NOT NULL, label TEXT,
  is_active BOOLEAN DEFAULT true,
  maintenance_message TEXT DEFAULT 'Cette page est temporairement en maintenance. Revenez bientôt !'
);

-- personal_puzzles
CREATE TABLE IF NOT EXISTS personal_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  name TEXT NOT NULL, piece_count NUMERIC, image_url TEXT
);

-- posts (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  content TEXT NOT NULL, image_url TEXT,
  puzzle_name TEXT, puzzle_brand TEXT, puzzle_pieces NUMERIC,
  puzzle_category TEXT, puzzle_reference TEXT,
  is_completion_post BOOLEAN DEFAULT false,
  likes_count NUMERIC DEFAULT 0, comments_count NUMERIC DEFAULT 0,
  author_name TEXT
);

-- puzzle_catalog (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS puzzle_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  asin TEXT, ean TEXT, title TEXT NOT NULL, brand TEXT, piece_count NUMERIC,
  image_hd TEXT, category_tag TEXT,
  "socialScore" NUMERIC DEFAULT 0,
  "wishlistCount" NUMERIC DEFAULT 0,
  added_count NUMERIC DEFAULT 0,
  total_likes NUMERIC DEFAULT 0,
  total_superlikes NUMERIC DEFAULT 0,
  total_dislikes NUMERIC DEFAULT 0,
  amazon_link TEXT, amazon_rating NUMERIC, amazon_ratings_total NUMERIC,
  amazon_price NUMERIC, description TEXT,
  status TEXT DEFAULT 'active'
);

-- puzzle_timers
CREATE TABLE IF NOT EXISTS puzzle_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_id TEXT NOT NULL, puzzle_name TEXT NOT NULL, start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ, total_seconds NUMERIC, is_active BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ, accumulated_seconds NUMERIC DEFAULT 0
);

-- speed_records
CREATE TABLE IF NOT EXISTS speed_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_id TEXT, puzzle_name TEXT, puzzle_brand TEXT, puzzle_pieces NUMERIC,
  image_url TEXT, category_tag TEXT,
  hours NUMERIC DEFAULT 0, minutes NUMERIC DEFAULT 0, seconds NUMERIC DEFAULT 0,
  total_seconds NUMERIC NOT NULL, record_date DATE, notes TEXT
);

-- swipe_interactions
CREATE TABLE IF NOT EXISTS swipe_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_id TEXT NOT NULL, puzzle_asin TEXT,
  interaction_type TEXT NOT NULL,
  puzzle_brand TEXT, puzzle_category TEXT
);

-- trend_metrics
CREATE TABLE IF NOT EXISTS trend_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  metric_type TEXT, metric_value TEXT, period DATE,
  count NUMERIC DEFAULT 0, action_type TEXT
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  email TEXT UNIQUE, role TEXT DEFAULT 'user',
  display_name TEXT, profile_photo TEXT, cover_photo TEXT, bio TEXT
);

-- user_badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  badge_id TEXT NOT NULL, badge_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(), is_active BOOLEAN DEFAULT false
);

-- user_categories
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  name TEXT NOT NULL, icon TEXT DEFAULT '🧩', color TEXT DEFAULT '#f97316'
);

-- user_dna
CREATE TABLE IF NOT EXISTS user_dna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  score_brands JSONB DEFAULT '{}', score_categories JSONB DEFAULT '{}',
  total_swipes_count NUMERIC DEFAULT 0, current_session_count NUMERIC DEFAULT 0,
  total_likes NUMERIC DEFAULT 0, total_superlikes NUMERIC DEFAULT 0,
  last_session_stats JSONB DEFAULT '{}'
);

-- user_levels
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  level NUMERIC DEFAULT 1, badge_name TEXT DEFAULT 'Novice',
  total_puzzles NUMERIC DEFAULT 0, total_posts NUMERIC DEFAULT 0
);

-- user_profiles (colonnes EXACTES de base44)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  email TEXT NOT NULL, full_name TEXT, display_name TEXT,
  friend_code TEXT, username_set BOOLEAN DEFAULT false,
  profile_photo TEXT, cover_photo TEXT,
  badge_category TEXT, bio TEXT, current_badge_icon TEXT, is_public BOOLEAN DEFAULT true
);

-- user_puzzles
CREATE TABLE IF NOT EXISTS user_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_name TEXT NOT NULL, puzzle_brand TEXT, puzzle_pieces NUMERIC NOT NULL,
  puzzle_reference TEXT, image_url TEXT,
  status TEXT DEFAULT 'wishlist',
  start_date DATE, end_date DATE, progress_photo TEXT,
  cemetery_type TEXT, cemetery_date DATE, notes TEXT, rating NUMERIC,
  user_category_id TEXT
);

-- user_puzzle_likes
CREATE TABLE IF NOT EXISTS user_puzzle_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_asin TEXT NOT NULL, puzzle_name TEXT, puzzle_brand TEXT,
  puzzle_pieces NUMERIC, puzzle_image TEXT
);

-- user_seen_puzzles
CREATE TABLE IF NOT EXISTS user_seen_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_asin TEXT NOT NULL
);

-- wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_name TEXT NOT NULL, puzzle_brand TEXT, puzzle_pieces NUMERIC,
  image_url TEXT, notes TEXT, priority TEXT DEFAULT 'medium'
);

-- wishlist_aggregates
CREATE TABLE IF NOT EXISTS wishlist_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), created_by TEXT,
  puzzle_name TEXT NOT NULL, puzzle_brand TEXT, puzzle_pieces NUMERIC,
  total_wishlists NUMERIC DEFAULT 0, is_out_of_stock BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON achievements USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read badges" ON badges FOR SELECT USING (true);
CREATE POLICY "admin write badges" ON badges FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published articles" ON blog_articles FOR SELECT USING (is_published = true OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin write articles" ON blog_articles FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "admin write categories" ON blog_categories FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "create bug reports" ON bug_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "read own or admin bug reports" ON bug_reports FOR SELECT USING (created_by = auth.jwt() ->> 'email' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin update bug reports" ON bug_reports FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "create comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "own delete comments" ON comments FOR DELETE USING (created_by = auth.jwt() ->> 'email');

ALTER TABLE completed_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completed_puzzles" ON completed_puzzles USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON direct_messages USING (sender_email = auth.jwt() ->> 'email' OR receiver_email = auth.jwt() ->> 'email');
CREATE POLICY "create messages" ON direct_messages FOR INSERT WITH CHECK (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read events" ON events FOR SELECT USING (true);
CREATE POLICY "admin write events" ON events FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "own participants" ON event_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "own delete participants" ON event_participants FOR DELETE USING (user_email = auth.jwt() ->> 'email');

ALTER TABLE featured_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read featured_articles" ON featured_articles FOR SELECT USING (true);
CREATE POLICY "admin write featured_articles" ON featured_articles FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE featured_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read featured_events" ON featured_events FOR SELECT USING (true);
CREATE POLICY "admin write featured_events" ON featured_events FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE featured_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read featured_puzzles" ON featured_puzzles FOR SELECT USING (true);
CREATE POLICY "admin write featured_puzzles" ON featured_puzzles FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read follows" ON follows FOR SELECT USING (true);
CREATE POLICY "own follows" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "own delete follows" ON follows FOR DELETE USING (follower_email = auth.jwt() ->> 'email');

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own friendships" ON friendships USING (requester_email = auth.jwt() ->> 'email' OR addressee_email = auth.jwt() ->> 'email');
CREATE POLICY "create friendships" ON friendships FOR INSERT WITH CHECK (true);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "own likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "own delete likes" ON likes FOR DELETE USING (created_by = auth.jwt() ->> 'email');

ALTER TABLE online_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read games" ON online_games FOR SELECT USING (true);
CREATE POLICY "admin write games" ON online_games FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read page_settings" ON page_settings FOR SELECT USING (true);
CREATE POLICY "admin write page_settings" ON page_settings FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE personal_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own personal_puzzles" ON personal_puzzles USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "own update posts" ON posts FOR UPDATE USING (created_by = auth.jwt() ->> 'email');
CREATE POLICY "own delete posts" ON posts FOR DELETE USING (created_by = auth.jwt() ->> 'email');

ALTER TABLE puzzle_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read catalog" ON puzzle_catalog FOR SELECT USING (true);
CREATE POLICY "create catalog" ON puzzle_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "own or admin update catalog" ON puzzle_catalog FOR UPDATE USING (created_by = auth.jwt() ->> 'email' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "own or admin delete catalog" ON puzzle_catalog FOR DELETE USING (created_by = auth.jwt() ->> 'email' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE puzzle_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own timers" ON puzzle_timers USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE speed_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own speed records" ON speed_records USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE swipe_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own swipes" ON swipe_interactions USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "admin read swipes" ON swipe_interactions FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE trend_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin trend_metrics" ON trend_metrics USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read users" ON users FOR SELECT USING (true);
CREATE POLICY "own update user" ON users FOR UPDATE USING (email = auth.jwt() ->> 'email');
CREATE POLICY "own insert user" ON users FOR INSERT WITH CHECK (email = auth.jwt() ->> 'email');

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_badges" ON user_badges USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read user_badges" ON user_badges FOR SELECT USING (true);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_categories" ON user_categories USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE user_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_dna" ON user_dna USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "admin read dna" ON user_dna FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own read levels" ON user_levels FOR SELECT USING (created_by = auth.jwt() ->> 'email');
CREATE POLICY "admin write levels" ON user_levels FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "own write profiles" ON user_profiles USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE user_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_puzzles" ON user_puzzles USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE user_puzzle_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own puzzle_likes" ON user_puzzle_likes USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE user_seen_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own seen_puzzles" ON user_seen_puzzles USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlists" ON wishlists USING (created_by = auth.jwt() ->> 'email') WITH CHECK (created_by = auth.jwt() ->> 'email');

ALTER TABLE wishlist_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read aggregates" ON wishlist_aggregates FOR SELECT USING (true);
CREATE POLICY "admin write aggregates" ON wishlist_aggregates FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- Index utiles
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_puzzles_created_by ON user_puzzles (created_by);
CREATE INDEX IF NOT EXISTS idx_posts_created_date ON posts (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_email);
CREATE INDEX IF NOT EXISTS idx_friendships_emails ON friendships (requester_email, addressee_email);
CREATE INDEX IF NOT EXISTS idx_puzzle_catalog_asin ON puzzle_catalog (asin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
