import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BADGE_LEVELS = [
  { level: 1, badgeName: 'Novice', threshold: 1, icon: '🌱' },
  { level: 2, badgeName: 'Débutant', threshold: 10, icon: '🔲' },
  { level: 3, badgeName: 'Apprenti', threshold: 20, icon: '🔍' },
  { level: 4, badgeName: 'Passionné', threshold: 35, icon: '🧩' },
  { level: 5, badgeName: 'Expert', threshold: 50, icon: '🎨' },
  { level: 6, badgeName: 'Maître', threshold: 75, icon: '⚡' },
  { level: 7, badgeName: 'Champion', threshold: 100, icon: '💎' },
  { level: 8, badgeName: 'Légende', threshold: 150, icon: '🏆' },
  { level: 9, badgeName: 'Mythique', threshold: 250, icon: '✨' },
  { level: 10, badgeName: 'Divin', threshold: 400, icon: '👑' },
];

export default function LevelsProgressModal({ open, onClose, currentScans, currentLevel }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-[#0a0a2e] border border-white/[0.06] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-b border-white/[0.06] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Progression des Niveaux</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {BADGE_LEVELS.map((level, index) => {
                  const isCompleted = currentScans >= level.threshold;
                  const isCurrent = level.level === currentLevel.level;
                  const nextLevel = BADGE_LEVELS[index + 1];
                  const scansToNext = nextLevel ? Math.max(0, nextLevel.threshold - currentScans) : 0;

                  return (
                    <motion.div
                      key={level.level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-xl p-4 border transition-all ${
                        isCurrent
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : isCompleted
                          ? 'bg-white/[0.03] border-white/[0.06]'
                          : 'bg-white/[0.01] border-white/[0.03] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon & Level */}
                        <div className="flex-shrink-0">
                          <div className={`text-3xl ${isCompleted ? '' : 'opacity-50'}`}>
                            {level.icon}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{level.badgeName}</span>
                            <span className="text-white/50 text-sm">Niveau {level.level}</span>
                            {isCompleted && (
                              <span className="text-green-400 text-xs font-medium">✓ Débloqué</span>
                            )}
                            {isCurrent && (
                              <span className="text-orange-400 text-xs font-medium">● Actuel</span>
                            )}
                          </div>
                          <div className="text-sm text-white/60 mt-1">
                            {isCompleted ? (
                              <span>{level.threshold} scans requis</span>
                            ) : (
                              <span>
                                {currentScans} / {level.threshold} scans
                                {nextLevel && scansToNext > 0 && (
                                  <span className="text-orange-400 ml-2">
                                    {scansToNext} manquant{scansToNext > 1 ? 's' : ''}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-shrink-0 w-32">
                          <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-orange-500'}`}
                              initial={{ width: 0 }}
                              animate={{
                                width: isCompleted
                                  ? '100%'
                                  : `${Math.min(100, (currentScans / level.threshold) * 100)}%`,
                              }}
                              transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white/[0.03] border-t border-white/[0.06] p-6">
                <Button
                  onClick={onClose}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}