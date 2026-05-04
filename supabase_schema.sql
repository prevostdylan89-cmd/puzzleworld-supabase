-- ============================================================
-- PuzzleWorld - Script SQL Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Active l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── HELPER : created_at / updated_at automatiques ───────────
CREATE OR REPLACE FUNCTION set_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE : achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW(),
  created_by    TEXT,  -- email de l'utilisateur
  achievement_type TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  color         TEXT
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements" ON achievements
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : badges  (admin only write, public read)
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date      TIMESTAMPTZ DEFAULT NOW(),
  updated_date      TIMESTAMPTZ DEFAULT NOW(),
  created_by        TEXT,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  icon              TEXT,
  color             TEXT,
  requirement_type  TEXT,
  requirement_value NUMERIC,
  level             NUMERIC NOT NULL
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read badges"  ON badges FOR SELECT USING (true);
CREATE POLICY "admin write badges"  ON badges FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : blog_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_articles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date          TIMESTAMPTZ DEFAULT NOW(),
  updated_date          TIMESTAMPTZ DEFAULT NOW(),
  created_by            TEXT,
  title                 TEXT NOT NULL,
  subtitle              TEXT,
  slug                  TEXT,
  content               TEXT,
  blocks                JSONB,
  cover_image           TEXT,
  show_cover_in_article BOOLEAN DEFAULT true,
  category              TEXT,
  tags                  TEXT,
  meta_title            TEXT,
  meta_description      TEXT,
  external_link         TEXT,
  external_link_label   TEXT,
  featured_puzzles      JSONB,
  is_published          BOOLEAN DEFAULT false,
  read_time             NUMERIC
);
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published"  ON blog_articles FOR SELECT
  USING (is_published = true OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin write articles"   ON blog_articles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : blog_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by  TEXT,
  name        TEXT NOT NULL,
  "order"     NUMERIC DEFAULT 0,
  is_featured BOOLEAN DEFAULT false
);
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "admin write categories" ON blog_categories FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : bug_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  title        TEXT,
  description  TEXT,
  status       TEXT DEFAULT 'open',
  priority     TEXT,
  page         TEXT,
  user_agent   TEXT
);
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bug reports" ON bug_reports
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "admin read all bug reports" ON bug_reports FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : comments
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  post_id      UUID,
  content      TEXT,
  author_name  TEXT,
  author_picture TEXT
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read comments"  ON comments FOR SELECT USING (true);
CREATE POLICY "own write comments"    ON comments FOR INSERT
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "own delete comments"   ON comments FOR DELETE
  USING (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : completed_puzzles
-- ============================================================
CREATE TABLE IF NOT EXISTS completed_puzzles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  puzzle_id    UUID,
  completed_at TIMESTAMPTZ,
  duration_seconds NUMERIC,
  pieces_count NUMERIC
);
ALTER TABLE completed_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completed_puzzles" ON completed_puzzles
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : direct_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  recipient    TEXT,
  content      TEXT,
  is_read      BOOLEAN DEFAULT false,
  conversation_id TEXT
);
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or recipient messages" ON direct_messages
  USING (created_by = auth.jwt() ->> 'email' OR recipient = auth.jwt() ->> 'email');
CREATE POLICY "create own messages" ON direct_messages FOR INSERT
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  title        TEXT,
  description  TEXT,
  event_date   TIMESTAMPTZ,
  location     TEXT,
  image        TEXT,
  is_published BOOLEAN DEFAULT false,
  max_participants NUMERIC,
  event_type   TEXT
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published events" ON events FOR SELECT
  USING (is_published = true OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin write events" ON events FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : event_participants
-- ============================================================
CREATE TABLE IF NOT EXISTS event_participants (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  event_id     UUID,
  user_email   TEXT
);
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own event_participants" ON event_participants
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read event_participants" ON event_participants FOR SELECT USING (true);

-- ============================================================
-- TABLE : featured_articles / featured_events / featured_puzzles
-- ============================================================
CREATE TABLE IF NOT EXISTS featured_articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  article_id   UUID,
  position     NUMERIC DEFAULT 0
);
ALTER TABLE featured_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read featured_articles"  ON featured_articles FOR SELECT USING (true);
CREATE POLICY "admin write featured_articles"  ON featured_articles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS featured_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  event_id     UUID,
  position     NUMERIC DEFAULT 0
);
ALTER TABLE featured_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read featured_events"  ON featured_events FOR SELECT USING (true);
CREATE POLICY "admin write featured_events"  ON featured_events FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE TABLE IF NOT EXISTS featured_puzzles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  puzzle_id     UUID,
  position      NUMERIC DEFAULT 0,
  catalog_id    UUID
);
ALTER TABLE featured_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read featured_puzzles"  ON featured_puzzles FOR SELECT USING (true);
CREATE POLICY "admin write featured_puzzles"  ON featured_puzzles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : follows
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  following    TEXT  -- email du suivi
);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own follows" ON follows
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read follows" ON follows FOR SELECT USING (true);

-- ============================================================
-- TABLE : friendships
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  friend_email TEXT,
  status       TEXT DEFAULT 'pending'  -- pending / accepted / rejected
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or friend friendships" ON friendships
  USING (created_by = auth.jwt() ->> 'email' OR friend_email = auth.jwt() ->> 'email');
CREATE POLICY "create own friendship" ON friendships FOR INSERT
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : likes
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  post_id      UUID
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own likes" ON likes
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read likes" ON likes FOR SELECT USING (true);

-- ============================================================
-- TABLE : online_games
-- ============================================================
CREATE TABLE IF NOT EXISTS online_games (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  puzzle_id    UUID,
  status       TEXT DEFAULT 'waiting',
  players      JSONB,
  room_code    TEXT,
  max_players  NUMERIC DEFAULT 2,
  winner_email TEXT
);
ALTER TABLE online_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read online_games" ON online_games FOR SELECT USING (true);
CREATE POLICY "own write online_games" ON online_games FOR INSERT
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "own update online_games" ON online_games FOR UPDATE
  USING (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : page_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS page_settings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  page_name    TEXT,
  is_visible   BOOLEAN DEFAULT true,
  settings     JSONB
);
ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read page_settings"  ON page_settings FOR SELECT USING (true);
CREATE POLICY "admin write page_settings"  ON page_settings FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : personal_puzzles
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_puzzles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  title        TEXT,
  image        TEXT,
  pieces_count NUMERIC,
  brand        TEXT,
  notes        TEXT
);
ALTER TABLE personal_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own personal_puzzles" ON personal_puzzles
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : posts
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW(),
  created_by     TEXT,
  content        TEXT,
  image          TEXT,
  puzzle_id      UUID,
  author_name    TEXT,
  author_picture TEXT,
  likes_count    NUMERIC DEFAULT 0,
  comments_count NUMERIC DEFAULT 0,
  post_type      TEXT DEFAULT 'social'
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read posts"   ON posts FOR SELECT USING (true);
CREATE POLICY "own write posts"     ON posts FOR INSERT
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "own update posts"    ON posts FOR UPDATE
  USING (created_by = auth.jwt() ->> 'email');
CREATE POLICY "own delete posts"    ON posts FOR DELETE
  USING (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : puzzle_catalog  (catalogue global des puzzles)
-- ============================================================
CREATE TABLE IF NOT EXISTS puzzle_catalog (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW(),
  created_by    TEXT,
  title         TEXT,
  brand         TEXT,
  pieces_count  NUMERIC,
  image         TEXT,
  ean           TEXT,
  reference     TEXT,
  category      TEXT,
  subcategory   TEXT,
  year          NUMERIC,
  price         NUMERIC,
  description   TEXT,
  difficulty    TEXT,
  is_verified   BOOLEAN DEFAULT false,
  tags          TEXT,
  wishlist_count NUMERIC DEFAULT 0,
  scan_count    NUMERIC DEFAULT 0
);
ALTER TABLE puzzle_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read puzzle_catalog" ON puzzle_catalog FOR SELECT USING (true);
CREATE POLICY "auth write puzzle_catalog"  ON puzzle_catalog FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin update puzzle_catalog" ON puzzle_catalog FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
         OR created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : puzzle_timers
-- ============================================================
CREATE TABLE IF NOT EXISTS puzzle_timers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW(),
  created_by    TEXT,
  puzzle_id     UUID,
  started_at    TIMESTAMPTZ,
  paused_at     TIMESTAMPTZ,
  elapsed_seconds NUMERIC DEFAULT 0,
  status        TEXT DEFAULT 'running'
);
ALTER TABLE puzzle_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own puzzle_timers" ON puzzle_timers
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : speed_records
-- ============================================================
CREATE TABLE IF NOT EXISTS speed_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW(),
  created_by    TEXT,
  puzzle_id     UUID,
  duration_seconds NUMERIC,
  pieces_count  NUMERIC,
  completed_at  TIMESTAMPTZ,
  is_public     BOOLEAN DEFAULT true
);
ALTER TABLE speed_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own speed_records" ON speed_records
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read speed_records" ON speed_records FOR SELECT
  USING (is_public = true);

-- ============================================================
-- TABLE : swipe_interactions
-- ============================================================
CREATE TABLE IF NOT EXISTS swipe_interactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  puzzle_id    UUID,
  direction    TEXT  -- 'like' | 'dislike'
);
ALTER TABLE swipe_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own swipe_interactions" ON swipe_interactions
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : trend_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS trend_metrics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  puzzle_id    UUID,
  metric_type  TEXT,
  value        NUMERIC,
  period       TEXT
);
ALTER TABLE trend_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read trend_metrics"  ON trend_metrics FOR SELECT USING (true);
CREATE POLICY "admin write trend_metrics"  ON trend_metrics FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- TABLE : users  (profil public étendu, séparé de auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  email        TEXT UNIQUE,
  full_name    TEXT,
  picture      TEXT,
  username     TEXT UNIQUE,
  role         TEXT DEFAULT 'user',
  bio          TEXT,
  location     TEXT,
  is_public    BOOLEAN DEFAULT true
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read users" ON users FOR SELECT USING (true);
CREATE POLICY "own update user"   ON users FOR UPDATE
  USING (email = auth.jwt() ->> 'email');
CREATE POLICY "own insert user"   ON users FOR INSERT
  WITH CHECK (email = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : user_badges
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  badge_id     UUID,
  unlocked_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_badges" ON user_badges
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read user_badges" ON user_badges FOR SELECT USING (true);

-- ============================================================
-- TABLE : user_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS user_categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  name         TEXT,
  color        TEXT,
  icon         TEXT,
  "order"      NUMERIC DEFAULT 0
);
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_categories" ON user_categories
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : user_dna
-- ============================================================
CREATE TABLE IF NOT EXISTS user_dna (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  dna_data     JSONB,
  computed_at  TIMESTAMPTZ
);
ALTER TABLE user_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_dna" ON user_dna
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : user_levels
-- ============================================================
CREATE TABLE IF NOT EXISTS user_levels (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  level        NUMERIC DEFAULT 1,
  xp           NUMERIC DEFAULT 0,
  title        TEXT
);
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_levels" ON user_levels
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read user_levels" ON user_levels FOR SELECT USING (true);

-- ============================================================
-- TABLE : user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by      TEXT,
  display_name    TEXT,
  avatar          TEXT,
  bio             TEXT,
  favourite_brand TEXT,
  favourite_theme TEXT,
  is_public       BOOLEAN DEFAULT true,
  social_links    JSONB,
  username        TEXT
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_profiles" ON user_profiles
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read user_profiles" ON user_profiles FOR SELECT USING (true);

-- ============================================================
-- TABLE : user_puzzles  (collection de l'utilisateur)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_puzzles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW(),
  created_by      TEXT,
  catalog_id      UUID,
  title           TEXT,
  brand           TEXT,
  pieces_count    NUMERIC,
  image           TEXT,
  ean             TEXT,
  status          TEXT DEFAULT 'owned',  -- owned / completed / wishlist / exchange
  category_id     UUID,
  category_name   TEXT,
  notes           TEXT,
  rating          NUMERIC,
  purchase_price  NUMERIC,
  purchase_date   DATE,
  is_public       BOOLEAN DEFAULT false,
  missing_pieces  NUMERIC DEFAULT 0,
  times_completed NUMERIC DEFAULT 0,
  last_completed  DATE
);
ALTER TABLE user_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_puzzles" ON user_puzzles
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read public user_puzzles" ON user_puzzles FOR SELECT
  USING (is_public = true OR created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : user_puzzle_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS user_puzzle_likes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  puzzle_id    UUID
);
ALTER TABLE user_puzzle_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_puzzle_likes" ON user_puzzle_likes
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');
CREATE POLICY "public read user_puzzle_likes" ON user_puzzle_likes FOR SELECT USING (true);

-- ============================================================
-- TABLE : user_seen_puzzles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_seen_puzzles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  catalog_id   UUID
);
ALTER TABLE user_seen_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_seen_puzzles" ON user_seen_puzzles
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : wishlists
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by   TEXT,
  catalog_id   UUID,
  title        TEXT,
  brand        TEXT,
  pieces_count NUMERIC,
  image        TEXT,
  ean          TEXT,
  notes        TEXT,
  priority     TEXT DEFAULT 'normal'
);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlists" ON wishlists
  USING (created_by = auth.jwt() ->> 'email')
  WITH CHECK (created_by = auth.jwt() ->> 'email');

-- ============================================================
-- TABLE : wishlist_aggregates  (compteurs publics wishlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_aggregates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  catalog_id   UUID UNIQUE,
  count        NUMERIC DEFAULT 0
);
ALTER TABLE wishlist_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read wishlist_aggregates" ON wishlist_aggregates FOR SELECT USING (true);
CREATE POLICY "auth write wishlist_aggregates"  ON wishlist_aggregates FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- INDEX utiles pour les performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_puzzles_created_by  ON user_puzzles (created_by);
CREATE INDEX IF NOT EXISTS idx_user_puzzles_catalog_id  ON user_puzzles (catalog_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_catalog_ean        ON puzzle_catalog (ean);
CREATE INDEX IF NOT EXISTS idx_posts_created_by          ON posts (created_by);
CREATE INDEX IF NOT EXISTS idx_posts_created_date        ON posts (created_date DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_convo     ON direct_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_friendships_emails        ON friendships (created_by, friend_email);
CREATE INDEX IF NOT EXISTS idx_wishlists_catalog_id      ON wishlists (catalog_id);

-- ============================================================
-- Trigger : auto updated_date sur les tables principales
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'achievements','badges','blog_articles','blog_categories',
    'bug_reports','completed_puzzles','direct_messages','events',
    'friendships','online_games','page_settings','personal_puzzles',
    'posts','puzzle_catalog','puzzle_timers','speed_records',
    'user_categories','user_dna','user_levels','user_profiles',
    'user_puzzles','wishlists','wishlist_aggregates','users'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%s_updated
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_date();',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- Supabase Storage : bucket "puzzle-images"
-- (à créer manuellement dans le dashboard Supabase Storage)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('puzzle-images', 'puzzle-images', true)
-- ON CONFLICT DO NOTHING;
