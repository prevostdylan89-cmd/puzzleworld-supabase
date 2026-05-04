import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FriendRequestNotification() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(currentUser => setUser(currentUser))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new friend requests
    const unsubscribe = base44.entities.Friendship.subscribe((event) => {
      if (
        event.type === 'create' &&
        event.data?.addressee_email === user.email &&
        event.data?.status === 'pending'
      ) {
        const newNotif = {
          id: event.id,
          requester_email: event.data.requester_email,
          timestamp: Date.now()
        };

        // Get requester's display name
        base44.entities.UserProfile.filter({ email: event.data.requester_email })
          .then(profiles => {
            if (profiles.length > 0) {
              newNotif.displayName = profiles[0].display_name || profiles[0].full_name || event.data.requester_email;
            } else {
              newNotif.displayName = event.data.requester_email;
            }
            setNotifications(prev => [newNotif, ...prev]);
            // Auto-dismiss after 6 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== event.id));
            }, 6000);
          })
          .catch(() => {
            newNotif.displayName = event.data.requester_email;
            setNotifications(prev => [newNotif, ...prev]);
          });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/40 rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg backdrop-blur-sm">
              <UserPlus className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-white/90">
                <span className="font-semibold text-blue-300">{notif.displayName}</span> vous a envoyé une demande d'ami
              </span>
              <button
                onClick={() => handleDismiss(notif.id)}
                className="ml-2 text-white/50 hover:text-white/80 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}