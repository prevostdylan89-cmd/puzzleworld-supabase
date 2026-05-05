import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

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

  useEffect(() => {
    if (!userEmail) return;
    const fetchUserLevel = async () => {
      try {
        const { count } = await supabase
          .from('puzzle_catalog')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userEmail);

        const scansCount = count || 0;
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

        setUserLevel(BADGE_LEVELS.find(b => b.level === level));
      } catch {}
    };
    fetchUserLevel();
  }, [userEmail]);

  if (!userLevel) return null;

  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs">
      <span>{userLevel.icon}</span>
      <span className="text-orange-400 font-semibold">nv.{userLevel.level}</span>
    </span>
  );
}
