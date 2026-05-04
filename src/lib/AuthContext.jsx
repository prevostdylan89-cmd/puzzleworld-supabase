import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('guest_mode') === 'true');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  // Compatibilité avec l'ancien code qui utilisait appPublicSettings
  const [appPublicSettings] = useState({ status: 'active' });
  const isLoadingPublicSettings = false;

  // Charge le profil depuis user_profiles pour avoir le vrai display_name
  const enrichUserWithProfile = async (supabaseUser) => {
    const base = enrichUser(supabaseUser);
    try {
      // Timeout de 3 secondes pour éviter un blocage infini
      const profilePromise = supabase
        .from('user_profiles')
        .select('display_name, avatar, friend_code')
        .eq('created_by', supabaseUser.email)
        .limit(1);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      );
      const { data: profiles } = await Promise.race([profilePromise, timeoutPromise]);
      if (profiles && profiles.length > 0 && profiles[0].display_name) {
        return {
          ...base,
          full_name: profiles[0].display_name,
          display_name: profiles[0].display_name,
          picture: profiles[0].avatar || base.picture,
          friend_code: profiles[0].friend_code,
        };
      }
    } catch (e) {
      // En cas d'erreur ou timeout, on retourne le profil de base
      console.warn('Profile fetch failed, using base user:', e.message);
    }
    return base;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const enriched = await enrichUserWithProfile(session.user);
        setUser(enriched);
        setIsAuthenticated(true);
        localStorage.removeItem('guest_mode');
        setIsGuest(false);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const enriched = await enrichUserWithProfile(session.user);
        setUser(enriched);
        setIsAuthenticated(true);
        localStorage.removeItem('guest_mode');
        setIsGuest(false);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Enrichit l'objet user Supabase avec les champs attendus par l'ancienne app base44.
   * base44 utilisait user.email, user.full_name, user.picture, user.role, etc.
   */
  const enrichUser = (supabaseUser) => {
    const meta = supabaseUser.user_metadata || {};
    return {
      ...supabaseUser,
      // Champs base44
      email: supabaseUser.email,
      full_name: meta.display_name || meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
      display_name: meta.display_name || meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
      picture: meta.avatar_url || meta.picture || null,
      role: meta.role || 'user',
      username: meta.username || null,
      daily_scan_credits: meta.daily_scan_credits || {},
    };
  };

  /**
   * updateMe(payload) - compatibilité base44.auth.updateMe()
   * Met à jour les user_metadata Supabase
   */
  const updateMe = async (payload) => {
    const { data, error } = await supabase.auth.updateUser({
      data: payload,
    });
    if (error) throw error;
    if (data.user) setUser(enrichUser(data.user));
    return enrichUser(data.user);
  };

  /**
   * Connexion via Google OAuth (principal fournisseur)
   */
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  /**
   * Connexion via email magique (alternative sans mot de passe)
   */
  const loginWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  /**
   * Connexion email + mot de passe
   */
  const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  /**
   * Inscription email + mot de passe
   */
  const signUpWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  // navigateToLogin → redirige vers la page login (chemin côté React Router)
  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const continueAsGuest = () => {
    localStorage.setItem('guest_mode', 'true');
    setIsGuest(true);
  };

  const exitGuestMode = () => {
    localStorage.removeItem('guest_mode');
    setIsGuest(false);
  };

  const checkAppState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(enrichUser(session.user));
      setIsAuthenticated(true);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isGuest,
      continueAsGuest,
      exitGuestMode,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      updateMe,
      loginWithGoogle,
      loginWithMagicLink,
      loginWithEmail,
      signUpWithEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
