import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function FeaturedEventSelector({ open, onClose, position, currentEvent, onUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadEvents();
    }
  }, [open, searchQuery]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const allEvents = await base44.entities.Event.list('-event_date', 50);
      
      if (searchQuery) {
        const filtered = allEvents.filter(e => 
          e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setEvents(filtered);
      } else {
        setEvents(allEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = async (event) => {
    setIsLoading(true);
    try {
      if (currentEvent) {
        await base44.entities.FeaturedEvent.update(currentEvent.id, {
          event_id: event.id,
          event_title: event.title,
          event_image: event.image,
          event_date: event.event_date
        });
      } else {
        await base44.entities.FeaturedEvent.create({
          event_id: event.id,
          event_title: event.title,
          event_image: event.image,
          event_date: event.event_date,
          position
        });
      }
      toast.success('Événement mis en avant!');
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Sélectionner un événement pour la position {position}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un événement..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Aucun événement trouvé</p>
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-orange-500/30"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{event.title}</h4>
                    <p className="text-white/50 text-xs">{event.event_date} • {event.location}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}