import React from 'react';
import { Sparkles } from 'lucide-react';

export default function DashboardDiscovery() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Découverte (Collection Globale)</h2>
        <p className="text-white/60">Gérez les puzzles de la collection communautaire</p>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Gestion des Puzzles</h3>
          <p className="text-white/60 mb-4">
            Outils de gestion des puzzles : ajout manuel, correction de fiches, suppression
          </p>
          <p className="text-white/40 text-sm">Section en développement</p>
        </div>
      </div>
    </div>
  );
}