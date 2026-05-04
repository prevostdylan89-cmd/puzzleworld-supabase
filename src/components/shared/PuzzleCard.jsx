import React from 'react';
import { motion } from 'framer-motion';
import { Puzzle, Users, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PuzzleCard({ puzzle, variant = 'default' }) {
  const {
    title = 'Mystery Puzzle',
    image = 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=300&fit=crop',
    pieces = 1000,
    plays = 234,
    rating = 4.5,
    creator = 'Anonymous'
  } = puzzle || {};

  const isLarge = variant === 'large';
  const isFeatured = variant === 'featured';

  return (
    <Link to={createPageUrl('PuzzleDetail')}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
          isFeatured ? 'aspect-[16/10]' : isLarge ? 'aspect-[4/3]' : 'aspect-square'
        }`}
      >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        {/* Title & Info */}
        <div className="space-y-2">
          <h3 className={`font-semibold text-white leading-tight ${
            isFeatured ? 'text-2xl' : isLarge ? 'text-xl' : 'text-base'
          }`}>
            {title}
          </h3>
          
          <p className="text-white/50 text-sm">by {creator}</p>

          <div className="flex items-center gap-4 text-white/70 text-xs">
            <span className="flex items-center gap-1">
              <Puzzle className="w-3.5 h-3.5 text-orange-400" />
              {pieces} pcs
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              {plays}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              {rating}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </Link>
  );
}