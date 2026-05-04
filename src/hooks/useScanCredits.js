import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

const DAILY_LIMIT = 10;

export function useScanCredits(user) {
  const { updateMe } = useAuth();
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Admins ont des scans illimités
  const isAdmin = user?.role === 'admin';

  const getTodayKey = () =>
    new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD

  const loadCredits = useCallback(() => {
    if (!user) { setLoading(false); return; }
    const scanData = user.daily_scan_credits || {};
    const todayKey = getTodayKey();
    if (scanData.date === todayKey) {
      setCreditsUsed(scanData.used || 0);
    } else {
      setCreditsUsed(0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadCredits(); }, [loadCredits]);

  const consumeCredit = async () => {
    const todayKey = getTodayKey();
    const newUsed = creditsUsed + 1;
    setCreditsUsed(newUsed);

    // Persist dans les user_metadata Supabase via updateMe
    await updateMe({
      daily_scan_credits: {
        date: todayKey,
        used: newUsed,
        reset_at: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
      }
    });

    return newUsed;
  };

  const remaining = isAdmin ? 999 : Math.max(0, DAILY_LIMIT - creditsUsed);
  const isLimitReached = isAdmin ? false : creditsUsed >= DAILY_LIMIT;

  const getResetInfo = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    return { dateStr, timeStr: '00:00' };
  };

  return { remaining, creditsUsed, isLimitReached, consumeCredit, loading, getResetInfo, DAILY_LIMIT };
}
