import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('guest_mode') === 'true');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ status: 'active' });
  const isLoadingPublicSettings = false;

  const enrichUserWithProfile = async (supabaseUser) => {
    const base = enrichUser(supabaseUser);
    try {
      const profilePromise = supabase
        .from('user_profiles')
        .select('display_name, profile_photo, friend_code')
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
          picture: profiles[0].profile_photo || base.picture,
          profile_photo: profiles[0].profile_photo || base.picture,
          friend_code: profiles[0].friend_code,
        };
      }
    } catch (e) {
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

  const enrichUser = (supabaseUser) => {
    const meta = supabaseUser.user_metadata || {};
    return {
      ...supabaseUser,
      email: supabaseUser.email,
      full_name: meta.display_name || meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
      display_name: meta.display_name || meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
      picture: meta.avatar_url || meta.picture || null,
      role: meta.role || 'user',
      username: meta.username || null,
      daily_scan_credits: meta.daily_scan_credits || {},
    };
  };

  const updateMe = async (payload) => {
    const { data, error } = await supabase.auth.updateUser({ data: payload });
    if (error) throw error;
    if (data.user) setUser(enrichUser(data.user));
    return enrichUser(data.user);
  };

  // Détecte si on est dans l'app Android (WebView)
  const isAndroidApp = () => {
    return /Android/.test(navigator.userAgent) && /wv/.test(navigator.userAgent);
  };

  const loginWithGoogle = async () => {
    const redirectTo = isAndroidApp()
      ? 'puzzleworld://login'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const loginWithApple = async () => {
    const redirectTo = isAndroidApp()
      ? 'puzzleworld://login'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const loginWithFacebook = async () => {
    const redirectTo = isAndroidApp()
      ? 'puzzleworld://login'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const loginWithMagicLink = async (email) => {
    const redirectTo = isAndroidApp()
      ? 'puzzleworld://login'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

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

  const navigateToLogin = () => { window.location.href = '/login'; };
  const continueAsGuest = () => { localStorage.setItem('guest_mode', 'true'); setIsGuest(true); };

  // FIX : exitGuestMode navigue TOUJOURS vers /login pour que l'utilisateur puisse se connecter
  const exitGuestMode = () => {
    localStorage.removeItem('guest_mode');
    setIsGuest(false);
    window.location.href = '/login';
  };

  // Envoie l'email de réinitialisation de mot de passe
  const sendPasswordResetEmail = async (email) => {
    const redirectTo = `${window.location.origin}/ResetPassword`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  // Met à jour le mot de passe (utilisé sur la page ResetPassword après vérification du token)
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
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
      loginWithApple,
      loginWithFacebook,
      loginWithMagicLink,
      loginWithEmail,
      signUpWithEmail,
      sendPasswordResetEmail,
      updatePassword,
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
