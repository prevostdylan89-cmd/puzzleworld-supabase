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

  useEffect(() => {
    // Vérifie la session Supabase au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(enrichUser(session.user));
        setIsAuthenticated(true);
        localStorage.removeItem('guest_mode');
        setIsGuest(false);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    // Écoute les changements d'auth (login / logout / refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(enrichUser(session.user));
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
