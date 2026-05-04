import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function PopularityScore({ score, showLabel = true, size = 'default' }) {
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400', label: 'Excellent' };
    if (score >= 50) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Bon' };
    return { bg: 'bg-red-500', text: 'text-red-400', label: 'Médiocre' };
  };

  const colors = getScoreColor(score);
  
  const sizeClasses = {
    small: { bar: 'h-2', text: 'text-xs', icon: 'w-3 h-3' },
    default: { bar: 'h-3', text: 'text-sm', icon: 'w-4 h-4' },
    large: { bar: 'h-4', text: 'text-base', icon: 'w-5 h-5' }
  };

  const s = sizeClasses[size] || sizeClasses.default;

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className={`${s.icon} ${colors.text}`} />
            <span className={`${s.text} text-white/70 font-medium`}>Score de Popularité</span>
          </div>
          <span className={`${s.text} font-bold ${colors.text}`}>
            {score}/100
          </span>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="relative w-full bg-white/10 rounded-full overflow-hidden" style={{ height: s.bar }}>
        <div 
          className={`${colors.bg} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`text-xs ${colors.text} font-medium`}>
            {colors.label}
          </span>
          <span className="text-xs text-white/50">
            {score >= 80 ? '🏆' : score >= 50 ? '👍' : '😐'}
          </span>
        </div>
      )}
    </div>
  );
}