import React from 'react';

const ADMIN_EMAIL = 'prevost.dylan89@gmail.com';

export default function PostAuthorBadge({ userEmail }) {
  if (!userEmail || userEmail !== ADMIN_EMAIL) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-400">
      ⚡ Admin
    </span>
  );
}