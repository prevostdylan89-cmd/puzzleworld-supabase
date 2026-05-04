import React from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

export default function MaintenancePage({ message }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-12 h-12 text-orange-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">🔧 Maintenance en cours</h1>
        <p className="text-white/60 text-lg leading-relaxed">
          {message || 'Cette page est temporairement en maintenance. Revenez bientôt !'}
        </p>
        <div className="mt-8 flex items-center justify-center gap-2 text-orange-400/60 text-sm">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span>Nous travaillons à vous offrir la meilleure expérience</span>
        </div>
      </motion.div>
    </div>
  );
}