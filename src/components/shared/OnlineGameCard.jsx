import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Star, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OnlineGameCard({ game }) {
  const {
    title = 'Puzzle Game',
    description = 'An exciting online puzzle experience',
    image = 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=200&fit=crop',
    rating = 4.5,
    players = '10K+',
    platform = 'Web',
    url = '#',
    tags = ['Free', 'Multiplayer']
  } = game || {};

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-transparent to-transparent" />
        
        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          {tags.map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-md text-white/90 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-semibold text-lg group-hover:text-orange-400 transition-colors">
            {title}
          </h3>
          <p className="text-white/50 text-sm mt-1 line-clamp-2">{description}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-white/40 text-xs">
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            {rating}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            {players}
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            {platform}
          </span>
        </div>

        {/* CTA */}
        <Button 
          onClick={() => {
            if (url && url !== '#') {
              window.open(url, '_blank');
            } else {
              toast.info('This game will be available soon!');
            }
          }}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
        >
          Play Now
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}