import React from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function GuestLoginScreen({ onContinueAsGuest }) {
  return (
    <div className="fixed inset-0 bg-[#000019] flex flex-col items-center justify-center p-6">
      {/* Back arrow to guest mode */}
      <button
        onClick={onContinueAsGuest}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Mode invité
      </button>
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4">
          <img
            src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png"
            alt="PuzzleWorld"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-white">PuzzleWorld</h1>
        <p className="text-white/50 mt-2 text-center">Votre communauté puzzle ultime</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="text-center mb-2">
          <h2 className="text-white font-semibold text-lg">Rejoindre PuzzleWorld</h2>
          <p className="text-white/40 text-sm mt-1">Connectez-vous pour profiter de toutes les fonctionnalités</p>
        </div>

        {/* Login button */}
        <Button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl text-base"
        >
          Se connecter / Créer un compte
        </Button>
        <p className="text-white/30 text-[11px] text-center -mt-1">
          🔒 Votre session sera mémorisée — pas besoin de vous reconnecter à chaque visite
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Guest button */}
        <Button
          onClick={onContinueAsGuest}
          variant="outline"
          className="w-full h-12 border-white/20 text-white/70 hover:bg-white/5 hover:text-white rounded-xl text-sm"
        >
          Continuer en mode invité
        </Button>

      </div>

      {/* Features preview */}
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm text-center">
        {[
          { icon: '🧩', label: 'Explorer les puzzles' },
          { icon: '🌍', label: 'Voir la communauté' },
          { icon: '🎉', label: 'Découvrir les events' },
        ].map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-white/40 text-xs">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}