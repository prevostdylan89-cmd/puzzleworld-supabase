import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function UserBadgeDisplay({ userEmail }) {
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    base44.functions.invoke('getUserBadgeInfo', { email: userEmail })
      .then(res => {
        if (res.data?.badge) {
          setBadge(res.data.badge);
        }
      })
      .catch(error => console.log('Error fetching badge:', error));
  }, [userEmail]);

  if (!badge) return null;

  return (
    <span title={badge.label} className="text-base leading-none">
      {badge.icon}
    </span>
  );
}