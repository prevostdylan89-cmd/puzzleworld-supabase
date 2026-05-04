import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageContext';
import { Badge } from '@/components/ui/badge';

export default function EventCard({ event, onClick }) {
  const { t, language } = useLanguage();
  const isFull = event.current_participants >= event.max_capacity;
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const dateLocale = language === 'fr' ? fr : enUS;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all"
    >
      {/* Event Image */}
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/40 to-transparent" />
      </div>

      {/* Full Badge */}
      {isFull && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-red-500/90 text-white border-0">
            {t('full')}
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {event.title}
        </h3>

        <p className="text-white/60 text-sm mb-3 line-clamp-2">
          {event.short_description}
        </p>

        <div className="space-y-2 text-sm">
          {eventDate && (
            <div className="flex items-center gap-2 text-white/70">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>{format(eventDate, 'dd MMMM yyyy', { locale: dateLocale })}</span>
              {event.event_time && <span>• {event.event_time}</span>}
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" />
            <span className={`font-medium ${isFull ? 'text-red-400' : 'text-white'}`}>
              {event.current_participants} / {event.max_capacity}
            </span>
            <span className="text-white/50 text-xs">{t('participants')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}