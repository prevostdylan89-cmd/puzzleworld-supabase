import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ghbutltffpnrdkbtvlog.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnV0bHRmZnBucmRrYnR2bG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDgzMTAsImV4cCI6MjA5MzQ4NDMxMH0.gU5V7C4-d8xAIy2nPUUr1IzwS2cS1yjyuvihbMwaJCo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

// ─── Importer toutes les entités ─────────────────────────────
import * as entities from './entities';

// ─── Objet base44 de compatibilité ───────────────────────────
// Reproduit l'API base44 pour que le code existant continue de fonctionner

const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

const enrichUser = (user) => {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    ...user,
    email: user.email,
    full_name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Utilisateur',
    picture: meta.avatar_url || meta.picture || null,
    role: meta.role || 'user',
    username: meta.username || null,
    daily_scan_credits: meta.daily_scan_credits || {},
  };
};

export const base44 = {
  // ── Auth ──────────────────────────────────────────────────
  auth: {
    me: async () => {
      const user = await getUser();
      if (!user) throw { status: 401, message: 'Not authenticated' };
      return enrichUser(user);
    },
    updateMe: async (payload) => {
      const { data, error } = await supabase.auth.updateUser({ data: payload });
      if (error) throw error;
      return enrichUser(data.user);
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    redirectToLogin: (redirectUrl) => {
      window.location.href = '/login';
    },
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
  },

  // ── Entities (compatibilité base44.entities.XXX.list() etc.) ─
  entities: {
    Achievement:       entities.Achievement,
    Badge:             entities.Badge,
    BlogArticle:       entities.BlogArticle,
    BlogCategory:      entities.BlogCategory,
    BugReport:         entities.BugReport,
    Comment:           entities.Comment,
    CompletedPuzzle:   entities.CompletedPuzzle,
    DirectMessage:     entities.DirectMessage,
    Event:             entities.Event,
    EventParticipant:  entities.EventParticipant,
    FeaturedArticle:   entities.FeaturedArticle,
    FeaturedEvent:     entities.FeaturedEvent,
    FeaturedPuzzle:    entities.FeaturedPuzzle,
    Follow:            entities.Follow,
    Friendship:        entities.Friendship,
    Like:              entities.Like,
    OnlineGame:        entities.OnlineGame,
    PageSettings:      entities.PageSettings,
    PersonalPuzzle:    entities.PersonalPuzzle,
    Post:              entities.Post,
    PuzzleCatalog:     entities.PuzzleCatalog,
    PuzzleCategory:    entities.UserCategory, // alias
    PuzzleTimer:       entities.PuzzleTimer,
    SpeedRecord:       entities.SpeedRecord,
    SwipeInteraction:  entities.SwipeInteraction,
    TrendMetric:       entities.TrendMetric,
    User:              entities.User,
    UserBadge:         entities.UserBadge,
    UserCategory:      entities.UserCategory,
    UserDNA:           entities.UserDNA,
    UserLevel:         entities.UserLevel,
    UserProfile:       entities.UserProfile,
    UserPuzzle:        entities.UserPuzzle,
    UserPuzzleLike:    entities.UserPuzzleLike,
    UserSeenPuzzle:    entities.UserSeenPuzzle,
    Wishlist:          entities.Wishlist,
    WishlistAggregate: entities.WishlistAggregate,
  },

  // ── Storage (upload d'images) ─────────────────────────────
  storage: {
    upload: async (file, path) => {
      const { data, error } = await supabase.storage
        .from('puzzle-images')
        .upload(path || `${Date.now()}_${file.name}`, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('puzzle-images')
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    },
    getUrl: (path) => {
      const { data } = supabase.storage
        .from('puzzle-images')
        .getPublicUrl(path);
      return data.publicUrl;
    },
  },

  // ── App logs (no-op silencieux) ───────────────────────────
  appLogs: {
    logUserInApp: async () => {},
    log: async () => {},
  },
};

export default supabase;

// Ajouter functions à l'objet base44 existant
base44.functions = {
  invoke: async (functionName, payload = {}) => {
    try {
      // Essayer d'appeler une Supabase Edge Function si elle existe
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });
      if (error) {
        console.warn(`Function ${functionName} not found, returning empty:`, error.message);
        return null;
      }
      return data;
    } catch (e) {
      // Si la fonction n'existe pas encore, retourner null silencieusement
      console.warn(`Function ${functionName} not available:`, e.message);
      return null;
    }
  }
};

// Agents base44 - non disponible, remplacé par no-op
base44.agents = {
  getWhatsAppConnectURL: () => '#',
  invoke: async () => null,
};

// ── Integrations (compatibilité base44.integrations.Core) ─────────────────
base44.integrations = {
  Core: {
    // Upload de fichier vers Supabase Storage
    UploadFile: async ({ file }) => {
      const ext = file.name.split('.').pop();
      const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('puzzle-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('puzzle-images')
        .getPublicUrl(data.path);
      return { file_url: urlData.publicUrl };
    },
    // InvokeLLM désactivé - retourne null silencieusement
    InvokeLLM: async () => null,
  }
};
