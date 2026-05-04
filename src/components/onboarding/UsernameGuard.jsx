import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import UsernameSetupModal from './UsernameSetupModal';

export default function UsernameGuard() {
  const children = null;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { setChecked(true); return; }

      const meta = currentUser.user_metadata || {};
      const enriched = {
        ...currentUser,
        email: currentUser.email,
        full_name: meta.full_name || meta.name || currentUser.email?.split('@')[0],
        picture: meta.avatar_url || meta.picture || null,
        role: meta.role || 'user',
        username_set: meta.username_set === true,
        display_name: meta.display_name || null,
      };

      setUser(enriched);

      // Vérifier aussi dans user_profiles
      if (!enriched.username_set) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username_set, display_name')
          .eq('created_by', currentUser.email)
          .limit(1);

        if (profiles && profiles.length > 0 && profiles[0].username_set) {
          setNeedsUsername(false);
        } else {
          setNeedsUsername(true);
        }
      }
    } catch (e) {
      console.error('UsernameGuard error:', e);
    } finally {
      setChecked(true);
    }
  };

  const handleComplete = async (data) => {
    setNeedsUsername(false);
    setUser(prev => ({ ...prev, ...data, username_set: true }));
    navigate('/Tutorial');
  };

  return (
    <>
      {children}
      {checked && needsUsername && user && (
        <UsernameSetupModal user={user} onComplete={handleComplete} />
      )}
    </>
  );
}
