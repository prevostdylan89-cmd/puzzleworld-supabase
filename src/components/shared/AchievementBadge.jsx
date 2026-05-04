import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, Crown } from 'lucide-react';

const iconMap = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  award: Award,
  crown: Crown
};

export default function AchievementBadge({ achievement, size = 'default' }) {
  const {
    title = 'First Puzzle',
    icon = 'trophy',
    color = 'orange',
    unlocked = true,
    progress = 100,
    description = 'Complete your first puzzle'
  } = achievement || {};

  const Icon = iconMap[icon] || Trophy;
  
  const colorStyles = {
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-500 to-indigo-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    pink: 'from-pink-500 to-rose-500'
  };

  const isSmall = size === 'small';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative flex flex-col items-center ${isSmall ? 'gap-1.5' : 'gap-2'}`}
    >
      {/* Badge Circle */}
      <div className={`relative ${isSmall ? 'w-12 h-12' : 'w-16 h-16'}`}>
        {/* Glow Effect */}
        {unlocked && (
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorStyles[color]} blur-lg opacity-40`} />
        )}
        
        {/* Main Badge */}
        <div className={`relative w-full h-full rounded-full flex items-center justify-center ${
          unlocked 
            ? `bg-gradient-to-br ${colorStyles[color]}` 
            : 'bg-white/10'
        }`}>
          <Icon className={`${isSmall ? 'w-5 h-5' : 'w-7 h-7'} ${unlocked ? 'text-white' : 'text-white/30'}`} />
        </div>

        {/* Progress Ring (if not unlocked) */}
        {!unlocked && progress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(255,107,53,0.3)"
              strokeWidth="3"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="3"
              strokeDasharray={`${progress * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <div className="text-center">
        <p className={`font-medium ${isSmall ? 'text-xs' : 'text-sm'} ${unlocked ? 'text-white' : 'text-white/40'}`}>
          {title}
        </p>
        {!isSmall && (
          <p className="text-xs text-white/40 mt-0.5 max-w-[100px] line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}