import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PostAuthorBadge({ userEmail }) {
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    const fetchBadge = async () => {
      try {
        const userBadges = await base44.entities.UserBadge.filter(
          { created_by: userEmail },
          '-unlocked_at',
          1
        );
        if (userBadges.length > 0) {
          setBadge(userBadges[0]);
        }
      } catch (error) {
        console.error('Error fetching user badge:', error);
      }
    };

    fetchBadge();
  }, [userEmail]);

  if (!badge) return null;

  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
      <span className="text-2xl">{badge.badge_name}</span>
    </div>
  );
}