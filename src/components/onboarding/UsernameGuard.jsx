import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!currentUser.username_set) {
        setNeedsUsername(true);
      }
    } catch (e) {
      // Not logged in
    } finally {
      setChecked(true);
    }
  };

  const handleComplete = (data) => {
    setNeedsUsername(false);
    setUser(prev => ({ ...prev, ...data }));
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