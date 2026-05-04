import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const LEVELS = [
  { level: 1, threshold: 0,   emoji: '🌱' },
  { level: 2, threshold: 5,   emoji: '🔲' },
  { level: 3, threshold: 15,  emoji: '🔍' },
  { level: 4, threshold: 30,  emoji: '🧩' },
  { level: 5, threshold: 60,  emoji: '🎨' },
  { level: 6, threshold: 100, emoji: '🔓' },
  { level: 7, threshold: 150, emoji: '⚡' },
  { level: 8, threshold: 250, emoji: '💎' },
  { level: 9, threshold: 400, emoji: '🏆' },
  { level: 10, threshold: 600, emoji: '👑' },
];

function getLevel(count) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (count >= lvl.threshold) current = lvl;
  }
  return current;
}

export default function UserLevelTag({ userEmail }) {
  const [levelData, setLevelData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    Promise.all([
      base44.entities.PuzzleCatalog.filter({ created_by: userEmail }),
      base44.entities.User.filter({ email: userEmail })
    ])
      .then(([items, users]) => {
        setLevelData(getLevel(items.length));
        if (users.length > 0 && users[0].role === 'admin') setIsAdmin(true);
      })
      .catch(() => {});
  }, [userEmail]);

  if (!levelData) return null;

  return (
    <span className="flex items-center gap-1">
      {isAdmin && (
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold whitespace-nowrap">
          👑 Admin
        </span>
      )}
      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold whitespace-nowrap">
        {levelData.emoji} Niv.{levelData.level}
      </span>
    </span>
  );
}