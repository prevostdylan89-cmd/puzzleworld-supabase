import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Marketplace</h1>
      </div>
      <p className="text-white/60 mb-10">Échangez et vendez vos puzzles entre passionnés</p>

      <div className="flex flex-col items-center justify-center py-24 bg-white/5 border border-white/10 rounded-2xl">
        <ShoppingBag className="w-16 h-16 text-orange-400/40 mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">Bientôt disponible</h2>
        <p className="text-white/50 text-center max-w-md">
          La Marketplace PuzzleWorld arrive prochainement.<br />
          Vous pourrez vendre, acheter et échanger vos puzzles directement entre membres.
        </p>
      </div>
    </div>
  );
}
