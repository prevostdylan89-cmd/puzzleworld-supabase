import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SectionHeader({ title, subtitle, link, linkText = 'View All' }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-white/50 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {link && (
        <Link 
          to={createPageUrl(link)}
          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors group"
        >
          {linkText}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}