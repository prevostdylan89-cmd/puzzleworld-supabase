import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Crown, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BadgesModal({ open, onClose, user }) {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [activeBadge, setActiveBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      loadBadges();
    }
  }, [open, user]);

  const loadBadges = async () => {
    try {
      // Load all system badges
      let allBadges = await base44.entities.Badge.list();
      
      // If no badges exist, create default ones
      if (allBadges.length === 0) {
        await createDefaultBadges();
        allBadges = await base44.entities.Badge.list();
      }

      // Load user's unlocked badges
      const userUnlocked = await base44.entities.UserBadge.filter({
        created_by: user.email
      });

      // Check and unlock badges based on current stats
      const completed = await base44.entities.UserPuzzle.filter({
        created_by: user.email,
        status: 'done'
      });

      const completedCount = completed.length;
      const totalPieces = completed.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);

      // Determine which badge should be unlocked
      const sortedBadges = allBadges
        .filter(b => b.requirement_type === 'puzzles_completed')
        .sort((a, b) => b.requirement_value - a.requirement_value);

      const currentBadge = sortedBadges.find(b => completedCount >= b.requirement_value);

      if (currentBadge) {
        // Check if user already has this badge
        const hasBadge = userUnlocked.some(ub => ub.badge_id === currentBadge.id);
        
        if (!hasBadge) {
          // Unlock the badge
          await base44.entities.UserBadge.create({
            badge_id: currentBadge.id,
            badge_name: currentBadge.name,
            is_active: true
          });
          
          // Deactivate other badges
          for (const ub of userUnlocked) {
            await base44.entities.UserBadge.update(ub.id, { is_active: false });
          }
        }

        setActiveBadge(currentBadge);
      }

      setBadges(allBadges);
      setUserBadges(await base44.entities.UserBadge.filter({ created_by: user.email }));
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultBadges = async () => {
    const defaultBadges = [
      { name: 'Novice', description: 'Complétez votre premier puzzle', icon: '🧩', color: '#94a3b8', requirement_type: 'puzzles_completed', requirement_value: 0, level: 1 },
      { name: 'Amateur', description: 'Complétez 5 puzzles', icon: '🎯', color: '#60a5fa', requirement_type: 'puzzles_completed', requirement_value: 5, level: 2 },
      { name: 'Passionné', description: 'Complétez 15 puzzles', icon: '⭐', color: '#fbbf24', requirement_type: 'puzzles_completed', requirement_value: 15, level: 3 },
      { name: 'Expert', description: 'Complétez 30 puzzles', icon: '💎', color: '#a78bfa', requirement_type: 'puzzles_completed', requirement_value: 30, level: 4 },
      { name: 'Maître', description: 'Complétez 50 puzzles', icon: '👑', color: '#f97316', requirement_type: 'puzzles_completed', requirement_value: 50, level: 5 },
      { name: 'Légende', description: 'Complétez 100 puzzles', icon: '🏆', color: '#ef4444', requirement_type: 'puzzles_completed', requirement_value: 100, level: 6 }
    ];

    for (const badge of defaultBadges) {
      await base44.entities.Badge.create(badge);
    }
  };

  const isUnlocked = (badgeId) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-orange-400" />
            Badges
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {activeBadge && (
              <div className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 rounded-xl p-6 text-center">
                <div className="text-5xl mb-3">{activeBadge.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{activeBadge.name}</h3>
                <p className="text-white/60">Badge actuel</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((badge) => {
                const unlocked = isUnlocked(badge.id);
                const isActive = activeBadge?.id === badge.id;
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-orange-500/20 border-orange-500/50 ring-2 ring-orange-500/30'
                        : unlocked
                        ? 'bg-white/5 border-white/20'
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}
                  >
                    <div className={`text-4xl mb-2 ${unlocked ? '' : 'grayscale opacity-50'}`}>
                      {badge.icon}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-white/50 text-xs mb-2">{badge.description}</p>
                    {unlocked ? (
                      <span className="text-green-400 text-xs font-medium">✓ Débloqué</span>
                    ) : (
                      <span className="text-white/40 text-xs">Verrouillé</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}