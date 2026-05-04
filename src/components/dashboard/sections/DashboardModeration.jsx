import React from 'react';
import { base44 } from '@/api/base44Client';
import { Shield } from 'lucide-react';

const WHATSAPP_URL = base44.agents.getWhatsAppConnectURL('content_moderator');

export default function DashboardModeration() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Modération IA</h2>
        <p className="text-white/50 text-sm">Agent IA pour surveiller les posts et commentaires.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Agent Modérateur de Communauté</h3>
            <p className="text-white/50 text-xs">Surveille les posts et commentaires pour violations des règles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/70">
          {[
            '🚫 Discours haineux & discrimination',
            '📢 Spam & contenu promotionnel',
            '💬 Langage offensant ou inapproprié',
            '👤 Harcèlement & attaques personnelles',
            '🧩 Contenu hors-sujet (non lié aux puzzles)',
            '⚠️ Menaces & contenu violent',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors text-sm"
          >
            💬 Démarrer sur WhatsApp
          </a>
          <p className="text-white/40 text-xs self-center">
            Connectez-vous via WhatsApp pour interroger l'agent et lui demander de modérer du contenu.
          </p>
        </div>
      </div>
    </div>
  );
}