import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EventCard({ event, onRegisterClick, onMoreInfoClick }) {
  const {
    title = 'Monthly Challenge',
    description = 'Complete the puzzle in record time',
    image = 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&h=200&fit=crop',
    date = 'Jan 15-31',
    participants = 1234,
    timeLeft = '5 days left',
    type = 'challenge'
  } = event || {};

  const typeColors = {
    challenge: 'from-orange-500 to-red-500',
    tournament: 'from-purple-500 to-indigo-500',
    community: 'from-blue-500 to-cyan-500'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] hover:border-orange-500/30 transition-all"
    >
      {/* Image Header */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000019] to-transparent" />
        
        {/* Type Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${typeColors[type]}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-white/50 text-sm line-clamp-2">{description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-white/40 text-xs">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            {participants.toLocaleString()}
          </span>
        </div>

        {/* Time Left */}
        <div className="flex items-center gap-1.5 text-orange-400 text-sm font-medium pt-2">
          <Clock className="w-4 h-4" />
          {timeLeft}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3">
          <Button 
            onClick={() => onRegisterClick?.(event)}
            size="sm" 
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
          >
            S'inscrire
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button 
            onClick={() => onMoreInfoClick?.(event)}
            size="sm"
            variant="outline"
            className="border-white/20 hover:bg-white/10 text-white rounded-full px-3"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}