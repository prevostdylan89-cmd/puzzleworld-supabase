import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export default function UserBadgeDisplay({ userEmail }) {
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    if (!userEmail) return;
    const fetchBadge = async () => {
      try {
        // Get the user's active visible badge
        const { data: userBadges } = await supabase
          .from('user_badges')
          .select('badge_name')
          .eq('created_by', userEmail)
          .eq('is_visible', true)
          .limit(1);

        if (!userBadges || userBadges.length === 0) return;

        const { data: badges } = await supabase
          .from('badges')
          .select('name, icon, color')
          .eq('name', userBadges[0].badge_name)
          .limit(1);

        if (badges && badges.length > 0) {
          setBadge({ icon: badges[0].icon, label: badges[0].name });
        }
      } catch {}
    };
    fetchBadge();
  }, [userEmail]);

  if (!badge) return null;

  return (
    <span title={badge.label} className="text-base leading-none">
      {badge.icon}
    </span>
  );
}
