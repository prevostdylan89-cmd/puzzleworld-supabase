/**
 * entities.js
 * Couche de compatibilité base44 → Supabase
 *
 * Reproduit l'interface base44 (list, get, create, update, delete, filter)
 * mais envoie les requêtes vers Supabase REST.
 *
 * Usage identique à l'ancien code :
 *   import { UserPuzzle } from '@/api/entities';
 *   const puzzles = await UserPuzzle.list('-created_date');
 *   const puzzle  = await UserPuzzle.get(id);
 *   await UserPuzzle.create({ ... });
 *   await UserPuzzle.update(id, { ... });
 *   await UserPuzzle.delete(id);
 *   const results = await UserPuzzle.filter({ status: 'completed' }, '-created_date', 20);
 */

import { supabase } from './supabaseClient';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Convertit un ordre base44 "-created_date" → { column, ascending }
 */
function parseOrder(orderStr) {
  if (!orderStr) return null;
  const descending = orderStr.startsWith('-');
  const column = descending ? orderStr.slice(1) : orderStr;
  return { column, ascending: !descending };
}

/**
 * Récupère l'utilisateur courant depuis Supabase Auth
 */
async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── factory ────────────────────────────────────────────────────────────────

/**
 * Crée un objet entity compatible base44 pour une table Supabase.
 *
 * @param {string} tableName  - nom de la table Supabase (ex: "user_puzzles")
 * @param {object} options
 *   @param {boolean} options.ownedByUser  - si true, filtre/attache created_by automatiquement
 *   @param {string}  options.userField    - champ "propriétaire" (défaut: "created_by")
 */
function createEntity(tableName, { ownedByUser = false, userField = 'created_by' } = {}) {

  // Normalise un résultat Supabase : lève une erreur si nécessaire
  const check = ({ data, error }) => {
    if (error) throw error;
    return data;
  };

  return {
    tableName,

    /** list(orderStr?, limit?) → array */
    async list(orderStr, limit) {
      let q = supabase.from(tableName).select('*');

      if (ownedByUser) {
        const user = await currentUser();
        if (user) q = q.eq(userField, user.email);
      }

      const ord = parseOrder(orderStr);
      if (ord) q = q.order(ord.column, { ascending: ord.ascending });
      if (limit) q = q.limit(limit);

      return check(await q) || [];
    },

    /** filter(filterObj, orderStr?, limit?) → array */
    async filter(filterObj = {}, orderStr, limit) {
      let q = supabase.from(tableName).select('*');

      if (ownedByUser) {
        const user = await currentUser();
        if (user) q = q.eq(userField, user.email);
      }

      for (const [key, value] of Object.entries(filterObj)) {
        if (value === null || value === undefined) continue;
        if (Array.isArray(value)) {
          q = q.in(key, value);
        } else {
          q = q.eq(key, value);
        }
      }

      const ord = parseOrder(orderStr);
      if (ord) q = q.order(ord.column, { ascending: ord.ascending });
      if (limit) q = q.limit(limit);

      return check(await q) || [];
    },

    /** get(id) → object */
    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    /** create(payload) → object */
    async create(payload) {
      if (ownedByUser) {
        const user = await currentUser();
        if (user && !payload[userField]) {
          payload = { ...payload, [userField]: user.email };
        }
      }
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...payload, created_date: payload.created_date || new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** update(id, payload) → object */
    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** delete(id) → void */
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    /** bulkCreate(array) → array */
    async bulkCreate(items) {
      if (ownedByUser) {
        const user = await currentUser();
        if (user) {
          items = items.map(item => ({
            ...item,
            [userField]: item[userField] || user.email,
            created_date: item.created_date || new Date().toISOString(),
          }));
        }
      }
      const { data, error } = await supabase
        .from(tableName)
        .insert(items)
        .select();
      if (error) throw error;
      return data || [];
    },

    /** bulkDelete(ids) → void */
    async bulkDelete(ids) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
  };
}

// ─── Toutes les entités de l'app ─────────────────────────────────────────────

export const Achievement         = createEntity('achievements',          { ownedByUser: true });
export const Badge               = createEntity('badges');
export const BlogArticle         = createEntity('blog_articles');
export const BlogCategory        = createEntity('blog_categories');
export const BugReport           = createEntity('bug_reports',           { ownedByUser: true });
export const Comment             = createEntity('comments',              { ownedByUser: true });
export const CompletedPuzzle     = createEntity('completed_puzzles',     { ownedByUser: true });
export const DirectMessage       = createEntity('direct_messages',       { ownedByUser: true });
export const Event               = createEntity('events');
export const EventParticipant    = createEntity('event_participants',    { ownedByUser: true });
export const FeaturedArticle     = createEntity('featured_articles');
export const FeaturedEvent       = createEntity('featured_events');
export const FeaturedPuzzle      = createEntity('featured_puzzles');
export const Follow              = createEntity('follows',               { ownedByUser: true });
export const Friendship          = createEntity('friendships',           { ownedByUser: true });
export const Like                = createEntity('likes',                 { ownedByUser: true });
export const OnlineGame          = createEntity('online_games');
export const PageSettings        = createEntity('page_settings');
export const PersonalPuzzle      = createEntity('personal_puzzles',      { ownedByUser: true });
export const Post                = createEntity('posts',                 { ownedByUser: true });
export const PuzzleCatalog       = createEntity('puzzle_catalog');
export const PuzzleTimer         = createEntity('puzzle_timers',         { ownedByUser: true });
export const SpeedRecord         = createEntity('speed_records',         { ownedByUser: true });
export const SwipeInteraction    = createEntity('swipe_interactions',    { ownedByUser: true });
export const TrendMetric         = createEntity('trend_metrics');
export const User                = createEntity('users');
export const UserBadge           = createEntity('user_badges',           { ownedByUser: true });
export const UserCategory        = createEntity('user_categories',       { ownedByUser: true });
export const UserDNA             = createEntity('user_dna',              { ownedByUser: true });
export const UserLevel           = createEntity('user_levels',           { ownedByUser: true });
export const UserProfile         = createEntity('user_profiles',         { ownedByUser: true });
export const UserPuzzle          = createEntity('user_puzzles',          { ownedByUser: true });
export const UserPuzzleLike      = createEntity('user_puzzle_likes',     { ownedByUser: true });
export const UserSeenPuzzle      = createEntity('user_seen_puzzles',     { ownedByUser: true });
export const Wishlist            = createEntity('wishlists',             { ownedByUser: true });
export const WishlistAggregate   = createEntity('wishlist_aggregates');
