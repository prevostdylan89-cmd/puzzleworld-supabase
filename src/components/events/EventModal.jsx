import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EventModal({ event, onClose, onRegistrationChange }) {
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  const isFull = event.current_participants >= event.max_capacity;
  const eventDate = event.event_date ? new Date(event.event_date) : null;

  useEffect(() => {
    checkUserAndRegistration();
  }, [event.id]);

  const checkUserAndRegistration = async () => {
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);

      if (currentUser) {
        const registrations = await base44.entities.EventParticipant.filter({
          event_id: event.id,
          user_email: currentUser.email
        });
        setIsRegistered(registrations.length > 0);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error(t('loginToRegister'));
      base44.auth.redirectToLogin();
      return;
    }

    if (isRegistered) {
      toast.info(t('alreadyRegistered'));
      return;
    }

    if (isFull) {
      toast.error(t('eventFull'));
      return;
    }

    setLoading(true);
    try {
      // Create participation
      await base44.entities.EventParticipant.create({
        event_id: event.id,
        user_email: user.email,
        user_name: user.full_name || user.email
      });

      // Update participant count
      await base44.entities.Event.update(event.id, {
        current_participants: event.current_participants + 1
      });

      setIsRegistered(true);
      toast.success(t('registrationConfirmed'));
      
      if (onRegistrationChange) {
        onRegistrationChange();
      }
    } catch (error) {
      console.error('Error registering:', error);
      toast.error(t('registrationError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0a0a2e] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header with Image */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a2e] via-[#0a0a2e]/60 to-transparent" />
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Register Button (Top) */}
            {!checkingRegistration && (
              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  onClick={handleRegister}
                  disabled={loading || isRegistered || isFull || !user}
                  className={`w-full ${
                    isRegistered
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                      : isFull
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                  }`}
                >
                  {loading ? (
                    t('registering')
                  ) : isRegistered ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('alreadyRegisteredBtn')}
                    </>
                  ) : isFull ? (
                    t('eventFullBtn')
                  ) : !user ? (
                    t('loginToRegisterBtn')
                  ) : (
                    t('registerBtn')
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{event.title}</h2>

            {/* Event Info */}
            <div className="space-y-3 mb-6">
              {eventDate && (
                <div className="flex items-center gap-3 text-white/80">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  <span>
                    {format(eventDate, 'EEEE dd MMMM yyyy', { locale: language === 'fr' ? fr : enUS })}
                    {event.event_time && ` • ${event.event_time}`}
                  </span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3 text-white/80">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <span>{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-orange-400" />
                <span className={`font-medium ${isFull ? 'text-red-400' : 'text-white'}`}>
                  {event.current_participants} / {event.max_capacity} {t('participants')}
                </span>
              </div>
            </div>

            {/* Full Description */}
            <div className="prose prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-white mb-3">{t('aboutEvent')}</h3>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                {event.full_description || event.short_description}
              </p>
            </div>

            {/* Plus d'infos button */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <Button
                onClick={() => window.location.href = '/Events'}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {t('moreInfoEvents')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}