import React, { useState, useEffect } from 'react';
import { Trophy, Star, Crown, Sparkles, Flame, Award } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const BADGE_CONFIG = {
  'Novice':    { icon: Star,     color: 'text-gray-400',   bg: 'bg-gray-400/20' },
  'Amateur':   { icon: Award,    color: 'text-blue-400',   bg: 'bg-blue-400/20' },
  'Passionné': { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/20' },
  'Expert':    { icon: Trophy,   color: 'text-orange-400', bg: 'bg-orange-400/20' },
  'Maître':    { icon: Flame,    color: 'text-red-400',    bg: 'bg-red-400/20' },
  'Légende':   { icon: Crown,    color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
};

function calculateBadge(total) {
  if (total >= 100) return 'Légende';
  if (total >= 50)  return 'Maître';
  if (total >= 30)  return 'Expert';
  if (total >= 15)  return 'Passionné';
  if (total >= 5)   return 'Amateur';
  return 'Novice';
}

export default function UserBadge({ userEmail, size = 'sm', showLabel = false }) {
  const [badge, setBadge] = useState('Novice');
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (!userEmail) return;
    supabase
      .from('completed_puzzles')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userEmail)
      .then(({ count }) => {
        const total = count || 0;
        setBadge(calculateBadge(total));
        setLevel(Math.floor(total / 5) + 1);
      })
      .catch(() => {});
  }, [userEmail]);

  const config = BADGE_CONFIG[badge] || BADGE_CONFIG['Novice'];
  const Icon = config.icon;

  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const textSizes = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="flex items-center gap-1">
      <div className={`${config.bg} ${config.color} rounded-full p-1 flex items-center justify-center`}>
        <Icon className={sizeClasses[size]} />
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={`${config.color} font-semibold ${textSizes[size]}`}>{badge}</span>
          <span className={`text-white/40 ${textSizes.xs}`}>Niv. {level}</span>
        </div>
      )}
    </div>
  );
}
