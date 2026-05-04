import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const BADGE_LEVELS = [
  { level: 1, icon: '🌱' },
  { level: 2, icon: '🔲' },
  { level: 3, icon: '🔍' },
  { level: 4, icon: '🧩' },
  { level: 5, icon: '🎨' },
  { level: 6, icon: '⚡' },
  { level: 7, icon: '💎' },
  { level: 8, icon: '🏆' },
  { level: 9, icon: '✨' },
  { level: 10, icon: '👑' },
];

export default function AuthorLevelBadge({ userEmail }) {
  const [userLevel, setUserLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const fetchUserLevel = async () => {
      try {
        const response = await base44.functions.invoke('countUserScans', { userEmail });
        const scansCount = response.data?.count || 0;

        // Determine level based on scans
        let level = 1;
        if (scansCount >= 400) level = 10;
        else if (scansCount >= 250) level = 9;
        else if (scansCount >= 150) level = 8;
        else if (scansCount >= 100) level = 7;
        else if (scansCount >= 75) level = 6;
        else if (scansCount >= 50) level = 5;
        else if (scansCount >= 35) level = 4;
        else if (scansCount >= 20) level = 3;
        else if (scansCount >= 10) level = 2;

        const badge = BADGE_LEVELS.find(b => b.level === level);
        setUserLevel(badge);
      } catch (error) {
        console.log('Error fetching user level:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLevel();
  }, [userEmail]);

  if (loading || !userLevel) return null;

  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs">
      <span>{userLevel.icon}</span>
      <span className="text-orange-400 font-semibold">nv.{userLevel.level}</span>
    </span>
  );
}