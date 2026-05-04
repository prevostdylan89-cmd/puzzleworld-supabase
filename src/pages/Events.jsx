import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import EventCard from '@/components/events/EventCard';
import EventModal from '@/components/events/EventModal';
import PullToRefresh from '@/components/shared/PullToRefresh';

export default function Events() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const allEvents = await base44.entities.Event.list('event_date');
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const diff = new Date(a.event_date) - new Date(b.event_date);
    return sortOrder === 'asc' ? diff : -diff;
  });

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleRegistrationChange = () => {
    loadEvents();
    setSelectedEvent(null);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 lg:px-8 py-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap gap-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-400" />
              <h1 className="text-3xl font-bold text-white">{t('eventsTitle')}</h1>
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="asc">{t('sortEarliest')}</option>
              <option value="desc">{t('sortLatest')}</option>
            </select>
          </div>
          <p className="text-white/60">{t('eventsSubtitle')}</p>
        </div>
      </div>

      {/* Events Grid */}
      <PullToRefresh onRefresh={loadEvents}>
        <div className="px-4 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-lg">{t('noEventsAvailable')}</p>
              <p className="text-white/40 text-sm mt-2">{t('noEventsComingSoon')}</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sortedEvents.map((event) => (
                <motion.div key={event.id} variants={item}>
                  <EventCard event={event} onClick={() => handleEventClick(event)} />
                </motion.div>
              ))}
            </motion.div>
          )}
          </div>
        </div>
      </PullToRefresh>

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onRegistrationChange={handleRegistrationChange}
        />
      )}
    </div>
  );
}