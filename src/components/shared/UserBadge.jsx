import React, { useState, useEffect } from 'react';
import { Trophy, Star, Crown, Sparkles, Flame, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BADGE_CONFIG = {
  'Novice': { icon: Star, color: 'text-gray-400', bg: 'bg-gray-400/20', threshold: 0 },
  'Amateur': { icon: Award, color: 'text-blue-400', bg: 'bg-blue-400/20', threshold: 5 },
  'Passionné': { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-400/20', threshold: 15 },
  'Expert': { icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-400/20', threshold: 30 },
  'Maître': { icon: Flame, color: 'text-red-400', bg: 'bg-red-400/20', threshold: 50 },
  'Légende': { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20', threshold: 100 }
};

function calculateBadge(totalPuzzles) {
  if (totalPuzzles >= 100) return 'Légende';
  if (totalPuzzles >= 50) return 'Maître';
  if (totalPuzzles >= 30) return 'Expert';
  if (totalPuzzles >= 15) return 'Passionné';
  if (totalPuzzles >= 5) return 'Amateur';
  return 'Novice';
}

export default function UserBadge({ userEmail, size = 'sm', showLabel = false }) {
  const [badge, setBadge] = useState('Novice');
  const [level, setLevel] = useState(1);

  useEffect(() => {
    loadUserBadge();
  }, [userEmail]);

  const loadUserBadge = async () => {
    try {
      // Get user's completed puzzles
      const puzzles = await base44.entities.CompletedPuzzle.filter({ created_by: userEmail });
      const totalPuzzles = puzzles.length;
      
      // Calculate badge
      const calculatedBadge = calculateBadge(totalPuzzles);
      const calculatedLevel = Math.floor(totalPuzzles / 5) + 1;
      
      setBadge(calculatedBadge);
      setLevel(calculatedLevel);
      
      // Update or create UserLevel record
      const userLevels = await base44.entities.UserLevel.filter({ created_by: userEmail });
      if (userLevels.length > 0) {
        await base44.entities.UserLevel.update(userLevels[0].id, {
          level: calculatedLevel,
          badge_name: calculatedBadge,
          total_puzzles: totalPuzzles,
          total_posts: (await base44.entities.Post.filter({ created_by: userEmail })).length
        });
      } else {
        await base44.entities.UserLevel.create({
          level: calculatedLevel,
          badge_name: calculatedBadge,
          total_puzzles: totalPuzzles,
          total_posts: (await base44.entities.Post.filter({ created_by: userEmail })).length
        });
      }
    } catch (error) {
      console.error('Error loading user badge:', error);
    }
  };

  const config = BADGE_CONFIG[badge];
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

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